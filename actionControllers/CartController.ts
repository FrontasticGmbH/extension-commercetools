import { Request, Response } from '@frontastic/extension-types';
import { ActionContext } from '@frontastic/extension-types';
import { Cart } from '../../../types/cart/Cart';
import { LineItem } from '../../../types/cart/LineItem';
import { Address } from '../../../types/account/Address';
import { CartFetcher } from '../utils/CartFetcher';
import { ShippingMethod } from '../../../types/cart/ShippingMethod';
import { Payment, PaymentStatuses } from '../../../types/cart/Payment';
import { CartApi } from '../apis/CartApi';
import { getLocale } from '../utils/Request';
import { Discount } from '../../../types/cart/Discount';
import { EmailApi } from '../apis/EmailApi';

type ControllerResponse = Response & {
  error?: string;
  errorCode?: number;
};

type ActionHook = (request: Request, actionContext: ActionContext) => Promise<Response>;

async function updateCartFromRequest(request: Request, actionContext: ActionContext): Promise<Cart> {
  const cartApi = new CartApi(actionContext.frontasticContext, getLocale(request));
  let cart = await CartFetcher.fetchCart(request, actionContext);

  if (request?.body === undefined || request?.body === '') {
    return cart;
  }

  const body: {
    account?: { email?: string };
    shipping?: Address;
    billing?: Address;
  } = JSON.parse(request.body);

  if (body?.account?.email !== undefined) {
    cart = await cartApi.setEmail(cart, body.account.email);
  }

  if (body?.shipping !== undefined || body?.billing !== undefined) {
    const shippingAddress = body?.shipping !== undefined ? body.shipping : body.billing;
    const billingAddress = body?.billing !== undefined ? body.billing : body.shipping;

    cart = await cartApi.setShippingAddress(cart, shippingAddress);
    cart = await cartApi.setBillingAddress(cart, billingAddress);
  }

  return cart;
}

export const getCart: ActionHook = async (request: Request, actionContext: ActionContext) => {
  const cart = await CartFetcher.fetchCart(request, actionContext);
  const cartId = cart.cartId;

  const response: Response = {
    statusCode: 200,
    body: JSON.stringify(cart),
    sessionData: {
      ...request.sessionData,
      cartId,
    },
  };

  return response;
};

export const addToCart: ActionHook = async (request: Request, actionContext: ActionContext) => {
  const cartApi = new CartApi(actionContext.frontasticContext, getLocale(request));

  const body: {
    variant?: { sku?: string; count: number };
  } = JSON.parse(request.body);

  const lineItem: LineItem = {
    variant: {
      sku: body.variant?.sku || undefined,
      price: undefined,
    },
    count: +body.variant?.count || 1,
  };

  let cart = await CartFetcher.fetchCart(request, actionContext);
  cart = await cartApi.addToCart(cart, lineItem);

  const cartId = cart.cartId;

  const response: Response = {
    statusCode: 200,
    body: JSON.stringify(cart),
    sessionData: {
      ...request.sessionData,
      cartId,
    },
  };

  return response;
};

export const updateLineItem: ActionHook = async (request: Request, actionContext: ActionContext) => {
  const cartApi = new CartApi(actionContext.frontasticContext, getLocale(request));

  const body: {
    lineItem?: { id?: string; count: number };
  } = JSON.parse(request.body);

  const lineItem: LineItem = {
    lineItemId: body.lineItem?.id,
    count: +body.lineItem?.count || 1,
  };

  let cart = await CartFetcher.fetchCart(request, actionContext);
  cart = await cartApi.updateLineItem(cart, lineItem);

  const cartId = cart.cartId;

  const response: Response = {
    statusCode: 200,
    body: JSON.stringify(cart),
    sessionData: {
      ...request.sessionData,
      cartId,
    },
  };

  return response;
};

export const removeLineItem: ActionHook = async (request: Request, actionContext: ActionContext) => {
  const cartApi = new CartApi(actionContext.frontasticContext, getLocale(request));

  const body: {
    lineItem?: { id?: string };
  } = JSON.parse(request.body);

  const lineItem: LineItem = {
    lineItemId: body.lineItem?.id,
  };

  let cart = await CartFetcher.fetchCart(request, actionContext);
  cart = await cartApi.removeLineItem(cart, lineItem);

  const cartId = cart.cartId;

  const response: Response = {
    statusCode: 200,
    body: JSON.stringify(cart),
    sessionData: {
      ...request.sessionData,
      cartId,
    },
  };

  return response;
};

export const updateCart: ActionHook = async (request: Request, actionContext: ActionContext) => {
  const cart = await updateCartFromRequest(request, actionContext);
  const cartId = cart.cartId;

  const response: Response = {
    statusCode: 200,
    body: JSON.stringify(cart),
    sessionData: {
      ...request.sessionData,
      cartId,
    },
  };

  return response;
};

export const checkout: ActionHook = async (request: Request, actionContext: ActionContext) => {
  const cartApi = new CartApi(actionContext.frontasticContext, getLocale(request));
  const emailApi = new EmailApi(actionContext.frontasticContext.project.configuration.smtp);

  const { account } = JSON.parse(request.body);

  let cart = await updateCartFromRequest(request, actionContext);
  cart = await cartApi.order(cart);
  if (cart) await emailApi.sendPaymentConfirmationEmail(account);

  // Unset the cartId
  const cartId: string = undefined;

  const response: Response = {
    statusCode: 200,
    body: JSON.stringify(cart),
    sessionData: {
      ...request.sessionData,
      cartId,
    },
  };

  return response;
};

export const getOrders: ActionHook = async (request: Request, actionContext: ActionContext) => {
  const cartApi = new CartApi(actionContext.frontasticContext, getLocale(request));

  const account = request.sessionData?.account !== undefined ? request.sessionData.account : undefined;

  if (account === undefined) {
    throw new Error('Not logged in.');
  }

  const orders = await cartApi.getOrders(account);

  const response: Response = {
    statusCode: 200,
    body: JSON.stringify(orders),
    sessionData: {
      ...request.sessionData,
    },
  };
  return response;
};

export const getShippingMethods: ActionHook = async (request: Request, actionContext: ActionContext) => {
  const cartApi = new CartApi(actionContext.frontasticContext, getLocale(request));
  const cart = await CartFetcher.fetchCart(request, actionContext);
  const onlyMatching = request.query.onlyMatching === 'true';

  const shippingMethods = await cartApi.getShippingMethods(onlyMatching);

  const response: Response = {
    statusCode: 200,
    body: JSON.stringify(shippingMethods),
    sessionData: {
      ...request.sessionData,
      cartId: cart.cartId,
    },
  };

  return response;
};

export const getAvailableShippingMethods: ActionHook = async (request: Request, actionContext: ActionContext) => {
  const cartApi = new CartApi(actionContext.frontasticContext, getLocale(request));
  const cart = await CartFetcher.fetchCart(request, actionContext);

  const availableShippingMethods = await cartApi.getAvailableShippingMethods(cart);

  const response: Response = {
    statusCode: 200,
    body: JSON.stringify(availableShippingMethods),
    sessionData: {
      ...request.sessionData,
      cartId: cart.cartId,
    },
  };

  return response;
};

export const setShippingMethod: ActionHook = async (request: Request, actionContext: ActionContext) => {
  const cartApi = new CartApi(actionContext.frontasticContext, getLocale(request));
  let cart = await CartFetcher.fetchCart(request, actionContext);

  const shippingMethod: ShippingMethod = {
    shippingMethodId: request.query.shippingMethodId,
  };

  cart = await cartApi.setShippingMethod(cart, shippingMethod);

  const response: Response = {
    statusCode: 200,
    body: JSON.stringify(cart),
    sessionData: {
      ...request.sessionData,
      cartId: cart.cartId,
    },
  };

  return response;
};

export const addPaymentByInvoice: ActionHook = async (request: Request, actionContext: ActionContext) => {
  const cartApi = new CartApi(actionContext.frontasticContext, getLocale(request));
  let cart = await CartFetcher.fetchCart(request, actionContext);

  const body: {
    payment?: Payment;
  } = JSON.parse(request.body);

  const payment: Payment = {
    ...body.payment,
    paymentProvider: 'frontastic',
    paymentMethod: 'invoice',
    paymentStatus: PaymentStatuses.PENDING,
  };

  if (payment.amountPlanned === undefined) {
    payment.amountPlanned = {};
  }

  payment.amountPlanned.centAmount = payment.amountPlanned.centAmount ?? cart.sum.centAmount ?? undefined;
  payment.amountPlanned.currencyCode = payment.amountPlanned.currencyCode ?? cart.sum.currencyCode ?? undefined;

  cart = await cartApi.addPayment(cart, payment);

  const response: Response = {
    statusCode: 200,
    body: JSON.stringify(cart),
    sessionData: {
      ...request.sessionData,
      cartId: cart.cartId,
    },
  };

  return response;
};

export const updatePayment: ActionHook = async (request: Request, actionContext: ActionContext) => {
  const cartApi = new CartApi(actionContext.frontasticContext, getLocale(request));
  const cart = await CartFetcher.fetchCart(request, actionContext);

  const body: {
    payment?: Payment;
  } = JSON.parse(request.body);

  const payment = await cartApi.updatePayment(cart, body.payment);

  const response: Response = {
    statusCode: 200,
    body: JSON.stringify(payment),
    sessionData: {
      ...request.sessionData,
      cartId: cart.cartId,
    },
  };

  return response;
};

export const redeemDiscount: ActionHook = async (request: Request, actionContext: ActionContext) => {
  const cartApi = new CartApi(actionContext.frontasticContext, getLocale(request));
  const cart = await CartFetcher.fetchCart(request, actionContext);

  const body: {
    code?: string;
  } = JSON.parse(request.body);

  const result = await cartApi.redeemDiscountCode(cart, body.code);

  let response: ControllerResponse;

  if (result.data) {
    response = {
      statusCode: 200,
      body: JSON.stringify(result.data),
      sessionData: {
        ...request.sessionData,
        cartId: result.data.cartId,
      },
    };
  }

  if (result.error) {
    response = {
      statusCode: result.statusCode,
      errorCode: 101,
      error: result.error,
    };
  }

  return response;
};

export const removeDiscount: ActionHook = async (request: Request, actionContext: ActionContext) => {
  const cartApi = new CartApi(actionContext.frontasticContext, getLocale(request));
  let cart = await CartFetcher.fetchCart(request, actionContext);

  const body: {
    discountId?: string;
  } = JSON.parse(request.body);

  const discount: Discount = {
    discountId: body?.discountId,
  };

  cart = await cartApi.removeDiscountCode(cart, discount);

  const response: Response = {
    statusCode: 200,
    body: JSON.stringify(cart),
    sessionData: {
      ...request.sessionData,
      cartId: cart.cartId,
    },
  };

  return response;
};
