import { BaseApi } from './BaseApi';
import { Account } from '../../../types/account/Account';
import {
  CustomerDraft,
  CustomerUpdate,
  CustomerUpdateAction,
  CustomerToken,
} from '@commercetools/platform-sdk/dist/declarations/src/generated/models/customer';
import { AccountMapper } from '../mappers/AccontMapper';
import { BaseAddress } from '@commercetools/platform-sdk/dist/declarations/src/generated/models/common';
import { Cart } from '../../../types/cart/Cart';
import { CartResourceIdentifier } from '@commercetools/platform-sdk/dist/declarations/src/generated/models/cart';
import { Address } from '../../../types/account/Address';
import { Guid } from '../../utils/Guid';
import { PasswordResetToken } from '../../../types/account/PasswordResetToken';

export class AccountApi extends BaseApi {
  create: (account: Account, cart: Cart | undefined) => Promise<Account> = async (
    account: Account,
    cart: Cart | undefined,
  ) => {
    try {
      const locale = await this.getCommercetoolsLocal();

      const {
        commercetoolsAddresses,
        billingAddresses,
        shippingAddresses,
        defaultBillingAddress,
        defaultShippingAddress,
      } = this.extractAddresses(account);

      const customerDraft: CustomerDraft = {
        email: account.email,
        password: account.password,
        salutation: account?.salutation,
        firstName: account?.firstName,
        lastName: account?.lastName,
        dateOfBirth: account?.birthday
          ? account.birthday.getFullYear() + '-' + account.birthday.getMonth() + '-' + account.birthday.getDate()
          : undefined,
        isEmailVerified: account?.confirmed,
        addresses: commercetoolsAddresses.length > 0 ? commercetoolsAddresses : undefined,
        defaultBillingAddress: defaultBillingAddress,
        defaultShippingAddress: defaultShippingAddress,
        billingAddresses: billingAddresses.length > 0 ? billingAddresses : undefined,
        shippingAddresses: shippingAddresses.length > 0 ? shippingAddresses : undefined,
        anonymousCart:
          cart !== undefined
            ? ({
                typeId: 'cart',
                id: cart.cartId,
              } as CartResourceIdentifier)
            : undefined,
      };

      account = await this.getApiForProject()
        .customers()
        .post({
          body: customerDraft,
        })
        .execute()
        .then((response) => {
          return AccountMapper.commercetoolsCustomerToAccount(response.body.customer, locale);
        })
        .catch((error) => {
          if (error.code && error.code === 400) {
            if (error.body && error.body?.errors?.[0]?.code === 'DuplicateField') {
              throw new Error(`The account ${account.email} does already exist.`);
            }

            /*
             * The cart might already belong to another user, so we try to create tje account without the cart.
             */
            if (cart) {
              return this.create(account, undefined);
            }
          }

          throw error;
        });

      const token = await this.generateToken(account);

      if (token) {
        account.confirmationToken = token.value;
        account.tokenValidUntil = new Date(token.expiresAt);
      }

      return account;
    } catch (error) {
      //TODO: better error, get status code etc...
      throw new Error(`create failed. ${error}`);
    }
  };

  generateToken: (account: Account) => Promise<CustomerToken> = async (account: Account) => {
    const token = await this.getApiForProject()
      .customers()
      .emailToken()
      .post({
        body: {
          id: account.accountId,
          ttlMinutes: 2 * 7 * 24 * 60,
        },
      })
      .execute();

    return token.body;
  };

  confirmEmail: (token: string) => Promise<Account> = async (token: string) => {
    try {
      const locale = await this.getCommercetoolsLocal();

      return await this.getApiForProject()
        .customers()
        .emailConfirm()
        .post({
          body: {
            tokenValue: token,
          },
        })
        .execute()
        .then((response) => {
          return AccountMapper.commercetoolsCustomerToAccount(response.body, locale);
        })
        .catch((error) => {
          throw new Error(`Failed to confirm email with token ${token}. ${error}`);
        });
    } catch (error) {
      //TODO: better error, get status code etc...
      throw new Error(`Confirm email failed. ${error}`);
    }
  };

  login: (account: Account, cart: Cart | undefined, reverify?: boolean) => Promise<Account> = async (
    account: Account,
    cart: Cart | undefined,
    reverify = false,
  ) => {
    try {
      const locale = await this.getCommercetoolsLocal();

      account = await this.getApiForProject()
        .login()
        .post({
          body: {
            email: account.email,
            password: account.password,
            anonymousCart:
              cart !== undefined
                ? ({
                    typeId: 'cart',
                    id: cart.cartId,
                  } as CartResourceIdentifier)
                : undefined,
          },
        })
        .execute()
        .then((response) => {
          return AccountMapper.commercetoolsCustomerToAccount(response.body.customer, locale);
        })
        .catch((error) => {
          if (error.code && error.code === 400) {
            if (error.body && error.body?.errors?.[0]?.code === 'InvalidCredentials') {
              throw new Error(`Invalid credentials to login with the account ${account.email}`);
            }

            /*
             * The cart might already belong to another user, so we try to log in without the cart.
             */
            if (cart) {
              return this.login(account, undefined, reverify);
            }
          }

          throw new Error(`Failed to login account  ${account.email}.`);
        });

      if (reverify) {
        const token = await this.generateToken(account);
        account.confirmationToken = token.value;
        account.tokenValidUntil = new Date(token.expiresAt);
      } else if (!account.confirmed) {
        throw new Error(`Your account ${account.email} is not activated yet!`);
      }

      return account;
    } catch (error) {
      //TODO: better error, get status code etc...
      throw new Error(`login failed. ${error}`);
    }
  };

  updatePassword: (account: Account, oldPassword: string, newPassword: string) => Promise<Account> = async (
    account: Account,
    oldPassword: string,
    newPassword: string,
  ) => {
    try {
      const locale = await this.getCommercetoolsLocal();

      const accountVersion = await this.fetchAccountVersion(account);

      account = await this.getApiForProject()
        .customers()
        .password()
        .post({
          body: {
            id: account.accountId,
            version: accountVersion,
            currentPassword: oldPassword,
            newPassword: newPassword,
          },
        })
        .execute()
        .then((response) => {
          return AccountMapper.commercetoolsCustomerToAccount(response.body, locale);
        })
        .catch((error) => {
          throw new Error(`Failed to update password for account ${account.email}. ${error}`);
        });

      return account;
    } catch (error) {
      //TODO: better error, get status code etc...
      throw new Error(`updateAccount failed. ${error}`);
    }
  };

  generatePasswordResetToken: (email: string) => Promise<PasswordResetToken> = async (email: string) => {
    try {
      return await this.getApiForProject()
        .customers()
        .passwordToken()
        .post({
          body: {
            email: email,
            ttlMinutes: 2 * 24 * 60,
          },
        })
        .execute()
        .then((response) => {
          return {
            email: email,
            confirmationToken: response.body.value,
            tokenValidUntil: new Date(response.body.expiresAt),
          };
        })
        .catch((error) => {
          throw new Error(`Failed to generate reset token for account ${email}. ${error}`);
        });
    } catch (error) {
      //TODO: better error, get status code etc...
      throw new Error(`generatePasswordResetToken failed. ${error}`);
    }
  };

  resetPassword: (token: string, newPassword: string) => Promise<Account> = async (
    token: string,
    newPassword: string,
  ) => {
    try {
      const locale = await this.getCommercetoolsLocal();

      return await this.getApiForProject()
        .customers()
        .passwordReset()
        .post({
          body: {
            tokenValue: token,
            newPassword: newPassword,
          },
        })
        .execute()
        .then((response) => {
          return AccountMapper.commercetoolsCustomerToAccount(response.body, locale);
        })
        .catch((error) => {
          throw new Error(`Failed to reset password with token ${token}. ${error}`);
        });
    } catch (error) {
      //TODO: better error, get status code etc...
      throw new Error(`resetPassword failed. ${error}`);
    }
  };

  update: (account: Account) => Promise<Account> = async (account: Account) => {
    try {
      const customerUpdateActions: CustomerUpdateAction[] = [];

      if (account.firstName) {
        customerUpdateActions.push({ action: 'setFirstName', firstName: account.firstName });
      }

      if (account.lastName) {
        customerUpdateActions.push({ action: 'setLastName', lastName: account.lastName });
      }

      if (account.salutation) {
        customerUpdateActions.push({ action: 'setSalutation', salutation: account.salutation });
      }

      if (account.birthday) {
        customerUpdateActions.push({
          action: 'setDateOfBirth',
          dateOfBirth:
            account.birthday.getFullYear() + '-' + account.birthday.getMonth() + '-' + account.birthday.getDate(),
        });
      }

      // TODO: should we also update addresses in this method?

      return await this.updateAccount(account, customerUpdateActions);
    } catch (error) {
      //TODO: better error, get status code etc...
      throw new Error(`update failed. ${error}`);
    }
  };

  addAddress: (account: Account, address: Address) => Promise<Account> = async (account: Account, address: Address) => {
    try {
      const customerUpdateActions: CustomerUpdateAction[] = [];

      let addressData = AccountMapper.addressToCommercetoolsAddress(address);

      if (addressData.id !== undefined) {
        addressData = {
          ...addressData,
          id: undefined,
        };
      }

      if (address.isDefaultBillingAddress || address.isDefaultShippingAddress) {
        addressData = {
          ...addressData,
          key: Guid.newGuid(),
        };
      }

      customerUpdateActions.push({ action: 'addAddress', address: addressData });

      if (address.isDefaultBillingAddress) {
        customerUpdateActions.push({ action: 'setDefaultBillingAddress', addressKey: addressData.key });
      }

      if (address.isDefaultShippingAddress) {
        customerUpdateActions.push({ action: 'setDefaultShippingAddress', addressKey: addressData.key });
      }

      return await this.updateAccount(account, customerUpdateActions);
    } catch (error) {
      //TODO: better error, get status code etc...
      throw new Error(`addAddress failed. ${error}`);
    }
  };

  updateAddress: (account: Account, address: Address) => Promise<Account> = async (
    account: Account,
    address: Address,
  ) => {
    try {
      const customerUpdateActions: CustomerUpdateAction[] = [];

      let addressData = AccountMapper.addressToCommercetoolsAddress(address);

      if (addressData.id !== undefined) {
        addressData = {
          ...addressData,
          id: undefined,
        };
      }

      if (address.isDefaultBillingAddress || address.isDefaultShippingAddress) {
        addressData = {
          ...addressData,
          key: Guid.newGuid(),
        };
      }

      customerUpdateActions.push({ action: 'changeAddress', addressId: address.addressId, address: addressData });

      if (address.isDefaultBillingAddress) {
        customerUpdateActions.push({ action: 'setDefaultBillingAddress', addressKey: addressData.key });
      }

      if (address.isDefaultShippingAddress) {
        customerUpdateActions.push({ action: 'setDefaultShippingAddress', addressKey: addressData.key });
      }

      return await this.updateAccount(account, customerUpdateActions);
    } catch (error) {
      //TODO: better error, get status code etc...
      throw new Error(`updateAddress failed. ${error}`);
    }
  };

  removeAddress: (account: Account, address: Address) => Promise<Account> = async (
    account: Account,
    address: Address,
  ) => {
    try {
      const customerUpdateActions: CustomerUpdateAction[] = [];

      const addressData = AccountMapper.addressToCommercetoolsAddress(address);

      if (addressData.id === undefined) {
        throw new Error(`The address passed doesn't contain an id.`);
      }

      customerUpdateActions.push({ action: 'removeAddress', addressId: address.addressId });

      return await this.updateAccount(account, customerUpdateActions);
    } catch (error) {
      //TODO: better error, get status code etc...
      throw new Error(`removeAddress failed. ${error}`);
    }
  };

  setDefaultBillingAddress: (account: Account, address: Address) => Promise<Account> = async (
    account: Account,
    address: Address,
  ) => {
    try {
      const customerUpdateActions: CustomerUpdateAction[] = [];

      const addressData = AccountMapper.addressToCommercetoolsAddress(address);

      customerUpdateActions.push({ action: 'setDefaultBillingAddress', addressId: addressData.id });

      return await this.updateAccount(account, customerUpdateActions);
    } catch (error) {
      //TODO: better error, get status code etc...
      throw new Error(`setDefaultBillingAddress failed. ${error}`);
    }
  };

  setDefaultShippingAddress: (account: Account, address: Address) => Promise<Account> = async (
    account: Account,
    address: Address,
  ) => {
    try {
      const customerUpdateActions: CustomerUpdateAction[] = [];

      const addressData = AccountMapper.addressToCommercetoolsAddress(address);

      customerUpdateActions.push({ action: 'setDefaultShippingAddress', addressId: addressData.id });

      return await this.updateAccount(account, customerUpdateActions);
    } catch (error) {
      //TODO: better error, get status code etc...
      throw new Error(`setDefaultShippingAddress failed. ${error}`);
    }
  };

  protected extractAddresses(account: Account) {
    const commercetoolsAddresses: BaseAddress[] = [];
    const billingAddresses: number[] = [];
    const shippingAddresses: number[] = [];
    let defaultBillingAddress: number | undefined;
    let defaultShippingAddress: number | undefined;

    account.addresses.forEach((address, key) => {
      const addressData = AccountMapper.addressToCommercetoolsAddress(address);

      commercetoolsAddresses.push(addressData);

      if (address.isDefaultBillingAddress) {
        billingAddresses.push(key);
        defaultBillingAddress = key;
      }

      if (address.isDefaultShippingAddress) {
        shippingAddresses.push(key);
        defaultShippingAddress = key;
      }
    });

    return {
      commercetoolsAddresses,
      billingAddresses,
      shippingAddresses,
      defaultBillingAddress,
      defaultShippingAddress,
    };
  }

  protected async fetchAccountVersion(account: Account): Promise<number | undefined> {
    const commercetoolsAccount = await this.getApiForProject()
      .customers()
      .withId({ ID: account.accountId })
      .get()
      .execute();

    return commercetoolsAccount.body?.version;
  }

  protected async updateAccount(account: Account, customerUpdateActions: CustomerUpdateAction[]) {
    const locale = await this.getCommercetoolsLocal();

    const accountVersion = await this.fetchAccountVersion(account);

    const customerUpdate: CustomerUpdate = {
      version: accountVersion,
      actions: customerUpdateActions,
    };

    return await this.getApiForProject()
      .customers()
      .withId({ ID: account.accountId })
      .post({
        body: customerUpdate,
      })
      .execute()
      .then((response) => {
        return AccountMapper.commercetoolsCustomerToAccount(response.body, locale);
      })
      .catch((error) => {
        throw error;
      });
  }
}
