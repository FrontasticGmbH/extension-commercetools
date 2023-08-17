import { ActionContext, Request, Response } from '@frontastic/extension-types';
import { AccountApi } from '../apis/AccountApi';
import { Account } from '@Types/account/Account';
import { Address } from '@Types/account/Address';
import { CartFetcher } from '../utils/CartFetcher';
import { getCurrency, getLocale } from '../utils/Request';
import { EmailApiFactory } from '../utils/EmailApiFactory';
import { AccountAuthenticationError } from '../errors/AccountAuthenticationError';
import { CartApi } from '../apis/CartApi';

type ActionHook = (request: Request, actionContext: ActionContext) => Promise<Response>;

export type AccountRegisterBody = {
  email?: string;
  password?: string;
  salutation?: string;
  firstName?: string;
  lastName?: string;
  birthdayYear?: string;
  birthdayMonth?: string;
  birthdayDay?: string;
  billingAddress?: Address;
  shippingAddress?: Address;
};

export type AccountLoginBody = {
  email?: string;
  password?: string;
};

type AccountChangePasswordBody = {
  oldPassword: string;
  newPassword: string;
};

function getAccountApi(request: Request, actionContext: ActionContext) {
  return new AccountApi(actionContext.frontasticContext, getLocale(request), getCurrency(request));
}

function getCartApi(request: Request, actionContext: ActionContext) {
  return new CartApi(actionContext.frontasticContext, getLocale(request), getCurrency(request));
}

async function loginAccount(request: Request, actionContext: ActionContext, account: Account): Promise<Response> {
  const accountApi = getAccountApi(request, actionContext);
  const cartApi = getCartApi(request, actionContext);

  const cart = await CartFetcher.fetchCart(cartApi, request, actionContext);

  try {
    account = await accountApi.login(account, cart);
  } catch (error) {
    if (error instanceof AccountAuthenticationError) {
      const response: Response = {
        statusCode: 401,
        body: JSON.stringify(error.message),
        sessionData: {
          ...request.sessionData,
          account: account,
        },
      };

      return response;
    }

    throw error;
  }

  if (!account.confirmed) {
    // If needed, the account confirmation email can be requested using
    // the endpoint action/account/requestConfirmationEmail.
    const response: Response = {
      statusCode: 401,
      body: JSON.stringify(`Your email address "${account.email}" was not yet verified.`),
      sessionData: {
        ...request.sessionData,
        account: account,
      },
    };

    return response;
  }

  const response: Response = {
    statusCode: 200,
    body: JSON.stringify(account),
    sessionData: {
      ...request.sessionData,
      account: account,
    },
  };

  return response;
}

function assertIsAuthenticated(request: Request) {
  const account = fetchAccountFromSession(request);

  if (account === undefined) {
    throw new AccountAuthenticationError({ message: 'Not logged in.' });
  }
}

function fetchAccountFromSession(request: Request): Account | undefined {
  if (request.sessionData?.account !== undefined) {
    return request.sessionData.account;
  }

  return undefined;
}

function parseBirthday(accountRegisterBody: AccountRegisterBody): Date | undefined {
  if (accountRegisterBody.birthdayYear) {
    return new Date(
      +accountRegisterBody.birthdayYear,
      +accountRegisterBody?.birthdayMonth ?? 1,
      +accountRegisterBody?.birthdayDay ?? 1,
    );
  }

  return null;
}

function mapRequestToAccount(request: Request): Account {
  const accountRegisterBody: AccountRegisterBody = JSON.parse(request.body);

  const account: Account = {
    email: accountRegisterBody?.email,
    password: accountRegisterBody?.password,
    salutation: accountRegisterBody?.salutation,
    firstName: accountRegisterBody?.firstName,
    lastName: accountRegisterBody?.lastName,
    birthday: parseBirthday(accountRegisterBody),
    addresses: [],
  };

  if (accountRegisterBody.billingAddress) {
    accountRegisterBody.billingAddress.isDefaultBillingAddress = true;
    accountRegisterBody.billingAddress.isDefaultShippingAddress = !(accountRegisterBody.shippingAddress !== undefined);

    account.addresses.push(accountRegisterBody.billingAddress);
  }

  if (accountRegisterBody.shippingAddress) {
    accountRegisterBody.shippingAddress.isDefaultShippingAddress = true;
    accountRegisterBody.shippingAddress.isDefaultBillingAddress = !(accountRegisterBody.billingAddress !== undefined);

    account.addresses.push(accountRegisterBody.shippingAddress);
  }

  return account;
}

export const getAccount: ActionHook = async (request: Request, actionContext: ActionContext) => {
  const account = fetchAccountFromSession(request);

  if (account === undefined) {
    return {
      statusCode: 200,
      body: JSON.stringify({
        loggedIn: false,
      }),
    };
  }

  const response: Response = {
    statusCode: 200,
    body: JSON.stringify({
      loggedIn: true,
      account,
    }),
    sessionData: {
      ...request.sessionData,
      account: account,
    },
  };

  return response;
};

export const register: ActionHook = async (request: Request, actionContext: ActionContext) => {
  const locale = getLocale(request);

  const accountApi = getAccountApi(request, actionContext);
  const cartApi = getCartApi(request, actionContext);

  const accountData = mapRequestToAccount(request);

  const cart = await CartFetcher.fetchCart(cartApi, request, actionContext);

  const account = await accountApi.create(accountData, cart);

  const emailApi = EmailApiFactory.getDefaultApi(actionContext.frontasticContext, locale);

  emailApi.sendWelcomeCustomerEmail(account);

  if (!account.confirmed) {
    emailApi.sendAccountVerificationEmail(account);
  }

  const response: Response = {
    statusCode: 200,
    body: JSON.stringify(account),
    sessionData: {
      ...request.sessionData,
    },
  };

  return response;
};

export const requestConfirmationEmail: ActionHook = async (request: Request, actionContext: ActionContext) => {
  const locale = getLocale(request);

  const accountApi = getAccountApi(request, actionContext);
  const cartApi = getCartApi(request, actionContext);

  const accountLoginBody: AccountLoginBody = JSON.parse(request.body);

  let account = {
    email: accountLoginBody.email,
    password: accountLoginBody.password,
  } as Account;

  const cart = await CartFetcher.fetchCart(cartApi, request, actionContext);

  account = await accountApi.login(account, cart);

  if (account.confirmed) {
    const response: Response = {
      statusCode: 405,
      body: JSON.stringify(`Your email address "${account.email}" was verified already.`),
      sessionData: {
        ...request.sessionData,
        account: account,
      },
    };

    return response;
  }

  const emailApi = EmailApiFactory.getDefaultApi(actionContext.frontasticContext, locale);
  emailApi.sendAccountVerificationEmail(account);

  const response: Response = {
    statusCode: 200,
    body: JSON.stringify({}),
    sessionData: {
      ...request.sessionData,
    },
  };

  return response;
};

export const confirm: ActionHook = async (request: Request, actionContext: ActionContext) => {
  const accountApi = new AccountApi(actionContext.frontasticContext, getLocale(request), getCurrency(request));

  type AccountConfirmBody = {
    token?: string;
  };

  const accountConfirmBody: AccountConfirmBody = JSON.parse(request.body);

  const account = await accountApi.confirmEmail(accountConfirmBody.token);

  const response: Response = {
    statusCode: 200,
    body: JSON.stringify(account),
    sessionData: {
      ...request.sessionData,
      account: account,
    },
  };

  return response;
};

export const login: ActionHook = async (request: Request, actionContext: ActionContext) => {
  const accountLoginBody: AccountLoginBody = JSON.parse(request.body);

  const account = {
    email: accountLoginBody.email,
    password: accountLoginBody.password,
  } as Account;

  return await loginAccount(request, actionContext, account);
};

export const logout: ActionHook = async (request: Request, actionContext: ActionContext) => {
  return {
    statusCode: 200,
    body: JSON.stringify({}),
    sessionData: {
      ...request.sessionData,
      account: undefined,
    },
  } as Response;
};

/**
 * Change password
 */
export const password: ActionHook = async (request: Request, actionContext: ActionContext) => {
  assertIsAuthenticated(request);

  let account = fetchAccountFromSession(request);

  const accountApi = new AccountApi(actionContext.frontasticContext, getLocale(request), getCurrency(request));

  const accountChangePasswordBody: AccountChangePasswordBody = JSON.parse(request.body);

  account = await accountApi.updatePassword(
    account,
    accountChangePasswordBody.oldPassword,
    accountChangePasswordBody.newPassword,
  );

  return {
    statusCode: 200,
    body: JSON.stringify(account),
    sessionData: {
      ...request.sessionData,
      account,
    },
  } as Response;
};

/**
 * Request new reset token
 */
export const requestReset: ActionHook = async (request: Request, actionContext: ActionContext) => {
  const locale = getLocale(request);

  type AccountRequestResetBody = {
    email?: string;
  };

  const accountApi = new AccountApi(actionContext.frontasticContext, locale, getCurrency(request));
  const emailApi = EmailApiFactory.getDefaultApi(actionContext.frontasticContext, locale);

  const accountRequestResetBody: AccountRequestResetBody = JSON.parse(request.body);

  const passwordResetToken = await accountApi.generatePasswordResetToken(accountRequestResetBody.email);

  emailApi.sendPasswordResetEmail(accountRequestResetBody as Account, passwordResetToken.token);

  return {
    statusCode: 200,
    body: JSON.stringify({}),
    sessionData: {
      ...request.sessionData,
      // TODO: should we redirect to logout rather to unset the account?
      account: undefined,
    },
  } as Response;
};

/**
 * Reset password
 */
export const reset: ActionHook = async (request: Request, actionContext: ActionContext) => {
  type AccountResetBody = {
    token?: string;
    newPassword?: string;
  };

  const accountResetBody: AccountResetBody = JSON.parse(request.body);

  const accountApi = new AccountApi(actionContext.frontasticContext, getLocale(request), getCurrency(request));

  const account = await accountApi.resetPassword(accountResetBody.token, accountResetBody.newPassword);
  account.password = accountResetBody.newPassword;

  return await loginAccount(request, actionContext, account);
};

export const update: ActionHook = async (request: Request, actionContext: ActionContext) => {
  assertIsAuthenticated(request);

  let account = fetchAccountFromSession(request);

  const accountApi = new AccountApi(actionContext.frontasticContext, getLocale(request), getCurrency(request));

  account = {
    ...account,
    ...mapRequestToAccount(request),
  };

  account = await accountApi.update(account);

  return {
    statusCode: 200,
    body: JSON.stringify(account),
    sessionData: {
      ...request.sessionData,
      account,
    },
  } as Response;
};

export const addAddress: ActionHook = async (request: Request, actionContext: ActionContext) => {
  assertIsAuthenticated(request);

  let account = fetchAccountFromSession(request);

  const address: Address = JSON.parse(request.body);

  const accountApi = new AccountApi(actionContext.frontasticContext, getLocale(request), getCurrency(request));

  account = await accountApi.addAddress(account, address);

  return {
    statusCode: 200,
    body: JSON.stringify(account),
    sessionData: {
      ...request.sessionData,
      account,
    },
  } as Response;
};

export const updateAddress: ActionHook = async (request: Request, actionContext: ActionContext) => {
  assertIsAuthenticated(request);

  let account = fetchAccountFromSession(request);

  const address: Address = JSON.parse(request.body);

  const accountApi = new AccountApi(actionContext.frontasticContext, getLocale(request), getCurrency(request));

  account = await accountApi.updateAddress(account, address);

  return {
    statusCode: 200,
    body: JSON.stringify(account),
    sessionData: {
      ...request.sessionData,
      account,
    },
  } as Response;
};

export const removeAddress: ActionHook = async (request: Request, actionContext: ActionContext) => {
  assertIsAuthenticated(request);

  let account = fetchAccountFromSession(request);

  const address: Address = JSON.parse(request.body);

  const accountApi = new AccountApi(actionContext.frontasticContext, getLocale(request), getCurrency(request));

  account = await accountApi.removeAddress(account, address);

  return {
    statusCode: 200,
    body: JSON.stringify(account),
    sessionData: {
      ...request.sessionData,
      account,
    },
  } as Response;
};

export const setDefaultBillingAddress: ActionHook = async (request: Request, actionContext: ActionContext) => {
  assertIsAuthenticated(request);

  let account = fetchAccountFromSession(request);

  const address: Address = JSON.parse(request.body);

  const accountApi = new AccountApi(actionContext.frontasticContext, getLocale(request), getCurrency(request));

  account = await accountApi.setDefaultBillingAddress(account, address);

  return {
    statusCode: 200,
    body: JSON.stringify(account),
    sessionData: {
      ...request.sessionData,
      account,
    },
  } as Response;
};

export const setDefaultShippingAddress: ActionHook = async (request: Request, actionContext: ActionContext) => {
  assertIsAuthenticated(request);

  let account = fetchAccountFromSession(request);

  const address: Address = JSON.parse(request.body);

  const accountApi = new AccountApi(actionContext.frontasticContext, getLocale(request), getCurrency(request));

  account = await accountApi.setDefaultShippingAddress(account, address);

  return {
    statusCode: 200,
    body: JSON.stringify(account),
    sessionData: {
      ...request.sessionData,
      account,
    },
  } as Response;
};
