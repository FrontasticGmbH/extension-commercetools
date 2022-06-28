import { Cart } from '../../../types/cart/Cart';
import {
  CartAddPaymentAction,
  CartDraft,
  CartRemoveDiscountCodeAction,
  CartSetBillingAddressAction,
  CartSetLocaleAction,
  CartSetShippingAddressAction,
  CartSetShippingMethodAction,
} from '@commercetools/platform-sdk';
import { CartMapper } from '../mappers/CartMapper';
import { LineItem } from '../../../types/cart/LineItem';
import { Cart as CommercetoolsCart } from '@commercetools/platform-sdk';
import {
  CartAddDiscountCodeAction,
  CartAddLineItemAction,
  CartChangeLineItemQuantityAction,
  CartRemoveLineItemAction,
  CartSetCountryAction,
  CartSetCustomerEmailAction,
  CartUpdate,
} from '@commercetools/platform-sdk/dist/declarations/src/generated/models/cart';
import { Address } from '../../../types/account/Address';
import { Order } from '../../../types/cart/Order';
import { OrderFromCartDraft } from '@commercetools/platform-sdk/dist/declarations/src/generated/models/order';
import { Guid } from '../utils/Guid';
import { BaseApi } from './BaseApi';
import { ShippingMethod } from '../../../types/cart/ShippingMethod';
import { Locale } from '../Locale';
import { Payment } from '../../../types/cart/Payment';
import {
  PaymentDraft,
  PaymentUpdateAction,
} from '@commercetools/platform-sdk/dist/declarations/src/generated/models/payment';
import { Account } from '../../../types/account/Account';
import { isReadyForCheckout } from '../utils/Cart';
import { Discount } from '../../../types/cart/Discount';

export class CartApi extends BaseApi {
  getForUser: (account: Account) => Promise<Cart> = async (account: Account) => {
    try {
      const locale = await this.getCommercetoolsLocal();

      const response = await this.getApiForProject()
        .carts()
        .get({
          queryArgs: {
            limit: 1,
            expand: [
              'lineItems[*].discountedPrice.includedDiscounts[*].discount',
              'discountCodes[*].discountCode',
              'paymentInfo.payments[*]',
            ],
            where: [`customerId="${account.accountId}"`, `cartState="Active"`],
            sort: 'createdAt desc',
          },
        })
        .execute();

      if (response.body.count >= 1) {
        return this.buildCartWithAvailableShippingMethods(response.body.results[0], locale);
      }

      const cartDraft: CartDraft = {
        currency: locale.currency,
        country: locale.country,
        locale: locale.language,
        customerId: account.accountId,
        inventoryMode: 'ReserveOnOrder',
      };

      const commercetoolsCart = await this.getApiForProject()
        .carts()
        .post({
          queryArgs: {
            expand: [
              'lineItems[*].discountedPrice.includedDiscounts[*].discount',
              'discountCodes[*].discountCode',
              'paymentInfo.payments[*]',
            ],
          },
          body: cartDraft,
        })
        .execute();

      return this.buildCartWithAvailableShippingMethods(commercetoolsCart.body, locale);
    } catch (error) {
      //TODO: better error, get status code etc...
      throw new Error(`getForUser failed. ${error}`);
    }
  };

  getAnonymous: (anonymousId: string) => Promise<Cart> = async (anonymousId: string) => {
    try {
      const locale = await this.getCommercetoolsLocal();

      const response = await this.getApiForProject()
        .carts()
        .get({
          queryArgs: {
            limit: 1,
            expand: [
              'lineItems[*].discountedPrice.includedDiscounts[*].discount',
              'discountCodes[*].discountCode',
              'paymentInfo.payments[*]',
            ],
            where: [`anonymousId="${anonymousId}"`, `cartState="Active"`],
            sort: 'createdAt desc',
          },
        })
        .execute();

      if (response.body.count >= 1) {
        return this.buildCartWithAvailableShippingMethods(response.body.results[0], locale);
      }

      const cartDraft: CartDraft = {
        currency: locale.currency,
        country: locale.country,
        locale: locale.language,
        anonymousId: anonymousId,
        inventoryMode: 'ReserveOnOrder',
      };

      const commercetoolsCart = await this.getApiForProject()
        .carts()
        .post({
          queryArgs: {
            expand: [
              'lineItems[*].discountedPrice.includedDiscounts[*].discount',
              'discountCodes[*].discountCode',
              'paymentInfo.payments[*]',
            ],
          },
          body: cartDraft,
        })
        .execute();

      return this.buildCartWithAvailableShippingMethods(commercetoolsCart.body, locale);
    } catch (error) {
      //TODO: better error, get status code etc...
      throw new Error(`getAnonymous failed. ${error}`);
    }
  };

  getById: (cartId: string) => Promise<Cart> = async (cartId: string) => {
    try {
      const locale = await this.getCommercetoolsLocal();

      const response = await this.getApiForProject()
        .carts()
        .withId({
          ID: cartId,
        })
        .get({
          queryArgs: {
            limit: 1,
            expand: [
              'lineItems[*].discountedPrice.includedDiscounts[*].discount',
              'discountCodes[*].discountCode',
              'paymentInfo.payments[*]',
            ],
          },
        })
        .execute();

      return this.buildCartWithAvailableShippingMethods(response.body, locale);
    } catch (error) {
      //TODO: better error, get status code etc...
      throw new Error(`getById failed. ${error}`);
    }
  };

  addToCart: (cart: Cart, lineItem: LineItem) => Promise<Cart> = async (cart: Cart, lineItem: LineItem) => {
    try {
      const locale = await this.getCommercetoolsLocal();

      const cartUpdate: CartUpdate = {
        version: +cart.cartVersion,
        actions: [
          {
            action: 'addLineItem',
            sku: lineItem.variant.sku,
            quantity: +lineItem.count,
          } as CartAddLineItemAction,
        ],
      };

      const commercetoolsCart = await this.updateCart(cart.cartId, cartUpdate, locale);

      return this.buildCartWithAvailableShippingMethods(commercetoolsCart, locale);
    } catch (error) {
      //TODO: better error, get status code etc...
      throw new Error(`addToCart failed. ${error}`);
    }
  };

  updateLineItem: (cart: Cart, lineItem: LineItem) => Promise<Cart> = async (cart: Cart, lineItem: LineItem) => {
    try {
      const locale = await this.getCommercetoolsLocal();

      const cartUpdate: CartUpdate = {
        version: +cart.cartVersion,
        actions: [
          {
            action: 'changeLineItemQuantity',
            lineItemId: lineItem.lineItemId,
            quantity: +lineItem.count,
          } as CartChangeLineItemQuantityAction,
        ],
      };

      const commercetoolsCart = await this.updateCart(cart.cartId, cartUpdate, locale);

      return this.buildCartWithAvailableShippingMethods(commercetoolsCart, locale);
    } catch (error) {
      //TODO: better error, get status code etc...
      throw new Error(`updateLineItem failed. ${error}`);
    }
  };

  removeLineItem: (cart: Cart, lineItem: LineItem) => Promise<Cart> = async (cart: Cart, lineItem: LineItem) => {
    try {
      const locale = await this.getCommercetoolsLocal();

      const cartUpdate: CartUpdate = {
        version: +cart.cartVersion,
        actions: [
          {
            action: 'removeLineItem',
            lineItemId: lineItem.lineItemId,
          } as CartRemoveLineItemAction,
        ],
      };

      const commercetoolsCart = await this.updateCart(cart.cartId, cartUpdate, locale);

      return this.buildCartWithAvailableShippingMethods(commercetoolsCart, locale);
    } catch (error) {
      //TODO: better error, get status code etc...
      throw new Error(`removeLineItem failed. ${error}`);
    }
  };

  setEmail: (cart: Cart, email: string) => Promise<Cart> = async (cart: Cart, email: string) => {
    try {
      const locale = await this.getCommercetoolsLocal();

      const cartUpdate: CartUpdate = {
        version: +cart.cartVersion,
        actions: [
          {
            action: 'setCustomerEmail',
            email: email,
          } as CartSetCustomerEmailAction,
        ],
      };

      const commercetoolsCart = await this.updateCart(cart.cartId, cartUpdate, locale);

      return this.buildCartWithAvailableShippingMethods(commercetoolsCart, locale);
    } catch (error) {
      //TODO: better error, get status code etc...
      throw new Error(`setEmail failed. ${error}`);
    }
  };

  setShippingAddress: (cart: Cart, address: Address) => Promise<Cart> = async (cart: Cart, address: Address) => {
    try {
      const locale = await this.getCommercetoolsLocal();

      const cartUpdate: CartUpdate = {
        version: +cart.cartVersion,
        actions: [
          {
            action: 'setShippingAddress',
            address: CartMapper.addressToCommercetoolsAddress(address),
          } as CartSetShippingAddressAction,
        ],
      };

      const commercetoolsCart = await this.updateCart(cart.cartId, cartUpdate, locale);

      return this.buildCartWithAvailableShippingMethods(commercetoolsCart, locale);
    } catch (error) {
      //TODO: better error, get status code etc...
      throw new Error(`setShippingAddress failed. ${error}`);
    }
  };

  setBillingAddress: (cart: Cart, address: Address) => Promise<Cart> = async (cart: Cart, address: Address) => {
    try {
      const locale = await this.getCommercetoolsLocal();

      const cartUpdate: CartUpdate = {
        version: +cart.cartVersion,
        actions: [
          {
            action: 'setBillingAddress',
            address: CartMapper.addressToCommercetoolsAddress(address),
          } as CartSetBillingAddressAction,
        ],
      };

      const commercetoolsCart = await this.updateCart(cart.cartId, cartUpdate, locale);

      return this.buildCartWithAvailableShippingMethods(commercetoolsCart, locale);
    } catch (error) {
      //TODO: better error, get status code etc...
      throw new Error(`setBillingAddress failed. ${error}`);
    }
  };

  setShippingMethod: (cart: Cart, shippingMethod: ShippingMethod) => Promise<Cart> = async (
    cart: Cart,
    shippingMethod: ShippingMethod,
  ) => {
    try {
      const locale = await this.getCommercetoolsLocal();

      const cartUpdate: CartUpdate = {
        version: +cart.cartVersion,
        actions: [
          {
            action: 'setShippingMethod',
            shippingMethod: {
              typeId: 'shipping-method',
              id: shippingMethod.shippingMethodId,
            },
          } as CartSetShippingMethodAction,
        ],
      };

      const commercetoolsCart = await this.updateCart(cart.cartId, cartUpdate, locale);

      return this.buildCartWithAvailableShippingMethods(commercetoolsCart, locale);
    } catch (error) {
      //TODO: better error, get status code etc...
      throw new Error(`setShippingMethod failed. ${error}`);
    }
  };

  order: (cart: Cart) => Promise<Order> = async (cart: Cart) => {
    try {
      const locale = await this.getCommercetoolsLocal();

      const orderFromCartDraft: OrderFromCartDraft = {
        id: cart.cartId,
        version: +cart.cartVersion,
        orderNumber: Guid.newGuid(),
      };

      if (!isReadyForCheckout(cart)) {
        throw new Error('Cart not complete yet.');
      }

      const response = await this.getApiForProject()
        .orders()
        .post({
          queryArgs: {
            expand: [
              'lineItems[*].discountedPrice.includedDiscounts[*].discount',
              'discountCodes[*].discountCode',
              'paymentInfo.payments[*]',
            ],
          },
          body: orderFromCartDraft,
        })
        .execute();

      return CartMapper.commercetoolsOrderToOrder(response.body, locale);
    } catch (error) {
      //TODO: better error, get status code etc...
      throw new Error(`order failed. ${error}`);
    }
  };

  getOrders: (account: Account) => Promise<Order[]> = async (account: Account) => {
    try {
      const locale = await this.getCommercetoolsLocal();

      const response = await this.getApiForProject()
        .orders()
        .get({
          queryArgs: {
            expand: [
              'lineItems[*].discountedPrice.includedDiscounts[*].discount',
              'discountCodes[*].discountCode',
              'paymentInfo.payments[*]',
            ],
            where: `customerId="${account.accountId}"`,
            sort: 'createdAt desc',
          },
        })
        .execute();

      return response.body.results.map((order) => CartMapper.commercetoolsOrderToOrder(order, locale));
    } catch (error) {
      //TODO: better error, get status code etc...
      throw new Error(`get orders failed. ${error}`);
    }
  };

  getShippingMethods: (onlyMatching: boolean) => Promise<ShippingMethod[]> = async (onlyMatching: boolean) => {
    try {
      const locale = await this.getCommercetoolsLocal();

      const methodArgs = {
        queryArgs: {
          expand: ['zoneRates[*].zone'],
          country: undefined as string | any,
        },
      };

      let requestBuilder = this.getApiForProject().shippingMethods().get(methodArgs);

      if (onlyMatching) {
        methodArgs.queryArgs.country = locale.country;
        requestBuilder = this.getApiForProject().shippingMethods().matchingLocation().get(methodArgs);
      }

      const response = await requestBuilder.execute();

      return response.body.results.map((shippingMethod) =>
        CartMapper.commercetoolsShippingMethodToShippingMethod(shippingMethod, locale),
      );
    } catch (error) {
      //TODO: better error, get status code etc...
      throw new Error(`getShippingMethods failed. ${error}`);
    }
  };

  getAvailableShippingMethods: (cart: Cart) => Promise<ShippingMethod[]> = async (cart: Cart) => {
    try {
      const locale = await this.getCommercetoolsLocal();

      const response = await this.getApiForProject()
        .shippingMethods()
        .matchingCart()
        .get({
          queryArgs: {
            expand: ['zoneRates[*].zone'],
            cartId: cart.cartId,
          },
        })
        .execute();

      return response.body.results.map((shippingMethod) =>
        CartMapper.commercetoolsShippingMethodToShippingMethod(shippingMethod, locale),
      );
    } catch (error) {
      //TODO: better error, get status code etc...
      throw new Error(`getAvailableShippingMethods failed. ${error}`);
    }
  };

  addPayment: (cart: Cart, payment: Payment) => Promise<Cart> = async (cart: Cart, payment: Payment) => {
    try {
      const locale = await this.getCommercetoolsLocal();

      // TODO: create and use custom a payment field to include details for the payment integration

      const paymentDraft: PaymentDraft = {
        key: payment.id,
        amountPlanned: {
          centAmount: payment.amountPlanned.centAmount,
          currencyCode: payment.amountPlanned.currencyCode,
        },
        interfaceId: payment.paymentId,
        paymentMethodInfo: {
          paymentInterface: payment.paymentProvider,
          method: payment.paymentMethod,
        },
        paymentStatus: {
          interfaceCode: payment.paymentStatus,
          interfaceText: payment.debug,
        },
      };

      const paymentResponse = await this.getApiForProject()
        .payments()
        .post({
          body: paymentDraft,
        })
        .execute();

      const cartUpdate: CartUpdate = {
        version: +cart.cartVersion,
        actions: [
          {
            action: 'addPayment',
            payment: {
              typeId: 'payment',
              id: paymentResponse.body.id,
            },
          } as CartAddPaymentAction,
        ],
      };

      const commercetoolsCart = await this.updateCart(cart.cartId, cartUpdate, locale);

      return this.buildCartWithAvailableShippingMethods(commercetoolsCart, locale);
    } catch (error) {
      //TODO: better error, get status code etc...
      throw new Error(`addPayment failed. ${error}`);
    }
  };

  updatePayment: (cart: Cart, payment: Payment) => Promise<Payment> = async (cart: Cart, payment: Payment) => {
    try {
      const locale = await this.getCommercetoolsLocal();
      const originalPayment = cart.payments.find((cartPayment) => cartPayment.id === payment.id);

      if (originalPayment === undefined) {
        throw new Error(`Payment ${payment.id} not found in cart ${cart.cartId}`);
      }

      const paymentUpdateActions: PaymentUpdateAction[] = [];

      if (payment.paymentStatus) {
        paymentUpdateActions.push({
          action: 'setStatusInterfaceCode',
          interfaceCode: payment.paymentStatus,
        });
      }

      if (payment.debug) {
        paymentUpdateActions.push({
          action: 'setStatusInterfaceText',
          interfaceText: payment.debug,
        });
      }

      if (payment.paymentId) {
        paymentUpdateActions.push({
          action: 'setInterfaceId',
          interfaceId: payment.paymentId,
        });
      }

      if (paymentUpdateActions.length === 0) {
        // There is nothing to be updated
        return payment;
      }

      const response = await this.getApiForProject()
        .payments()
        .withKey({
          key: originalPayment.id,
        })
        .post({
          body: {
            version: originalPayment.version,
            actions: paymentUpdateActions,
          },
        })
        .execute();

      return CartMapper.commercetoolsPaymentToPayment(response.body, locale);
    } catch (error) {
      //TODO: better error, get status code etc...
      throw new Error(`updatePayment failed. ${error}`);
    }
  };

  redeemDiscountCode: (cart: Cart, code: string) => Promise<Cart> = async (cart: Cart, code: string) => {
    try {
      const locale = await this.getCommercetoolsLocal();

      const cartUpdate: CartUpdate = {
        version: +cart.cartVersion,
        actions: [
          {
            action: 'addDiscountCode',
            code: code,
          } as CartAddDiscountCodeAction,
        ],
      };

      const commercetoolsCart = await this.updateCart(cart.cartId, cartUpdate, locale);

      return this.buildCartWithAvailableShippingMethods(commercetoolsCart, locale);
    } catch (error) {
      //TODO: better error, get status code etc...
      throw new Error(`redeemDiscountCode failed. ${error}`);
    }
  };

  removeDiscountCode: (cart: Cart, discount: Discount) => Promise<Cart> = async (cart: Cart, discount: Discount) => {
    try {
      const locale = await this.getCommercetoolsLocal();

      const cartUpdate: CartUpdate = {
        version: +cart.cartVersion,
        actions: [
          {
            action: 'removeDiscountCode',
            discountCode: {
              typeId: 'discount-code',
              id: discount.discountId,
            },
          } as CartRemoveDiscountCodeAction,
        ],
      };

      const commercetoolsCart = await this.updateCart(cart.cartId, cartUpdate, locale);

      return this.buildCartWithAvailableShippingMethods(commercetoolsCart, locale);
    } catch (error) {
      //TODO: better error, get status code etc...
      throw new Error(`removeDiscountCode failed. ${error}`);
    }
  };

  protected async updateCart(cartId: string, cartUpdate: CartUpdate, locale: Locale): Promise<CommercetoolsCart> {
    return await this.getApiForProject()
      .carts()
      .withId({
        ID: cartId,
      })
      .post({
        queryArgs: {
          expand: [
            'lineItems[*].discountedPrice.includedDiscounts[*].discount',
            'discountCodes[*].discountCode',
            'paymentInfo.payments[*]',
          ],
        },
        body: cartUpdate,
      })
      .execute()
      .then((response) => {
        return response.body;
      });
  }

  protected buildCartWithAvailableShippingMethods: (
    commercetoolsCart: CommercetoolsCart,
    locale: Locale,
  ) => Promise<Cart> = async (commercetoolsCart: CommercetoolsCart, locale: Locale) => {
    const cart = await this.assertCorrectLocale(commercetoolsCart, locale);

    try {
      // It would not be possible to get available shipping method
      // if the shipping address has not been set.
      if (cart.shippingAddress !== undefined && cart.shippingAddress.country !== undefined) {
        cart.availableShippingMethods = await this.getAvailableShippingMethods(cart);
      }
    } catch (error) {
      throw new Error(`buildCartWithAvailableShippingMethods failed. ${error}`);
    }

    return cart;
  };

  protected assertCorrectLocale: (commercetoolsCart: CommercetoolsCart, locale: Locale) => Promise<Cart> = async (
    commercetoolsCart: CommercetoolsCart,
    locale: Locale,
  ) => {
    if (commercetoolsCart.totalPrice.currencyCode !== locale.currency.toLocaleUpperCase()) {
      return this.recreate(commercetoolsCart, locale);
    }

    if (this.doesCartNeedLocaleUpdate(commercetoolsCart, locale)) {
      const cartUpdate: CartUpdate = {
        version: commercetoolsCart.version,
        actions: [
          {
            action: 'setCountry',
            country: locale.country,
          } as CartSetCountryAction,
          {
            action: 'setLocale',
            country: locale.language,
          } as CartSetLocaleAction,
        ],
      };

      commercetoolsCart = await this.updateCart(commercetoolsCart.id, cartUpdate, locale);

      return CartMapper.commercetoolsCartToCart(commercetoolsCart, locale);
    }

    return CartMapper.commercetoolsCartToCart(commercetoolsCart, locale);
  };

  protected recreate: (primaryCommercetoolsCart: CommercetoolsCart, locale: Locale) => Promise<Cart> = async (
    primaryCommercetoolsCart: CommercetoolsCart,
    locale: Locale,
  ) => {
    const primaryCartId = primaryCommercetoolsCart.id;
    const cartVersion = primaryCommercetoolsCart.version;
    const lineItems = primaryCommercetoolsCart.lineItems;

    const cartDraft: CartDraft = {
      currency: locale.currency,
      country: locale.country,
      locale: locale.language,
    };

    // TODO: implement a logic that hydrate cartDraft with commercetoolsCart
    // for (const key of Object.keys(commercetoolsCart)) {
    //   if (cartDraft.hasOwnProperty(key) && cartDraft[key] !== undefined) {
    //     cartDraft[key] = commercetoolsCart[key];
    //   }
    // }

    const propertyList = [
      'customerId',
      'customerEmail',
      'customerGroup',
      'anonymousId',
      'store',
      'inventoryMode',
      'taxMode',
      'taxRoundingMode',
      'taxCalculationMode',
      'shippingAddress',
      'billingAddress',
      'shippingMethod',
      'externalTaxRateForShippingMethod',
      'deleteDaysAfterLastModification',
      'origin',
      'shippingRateInput',
      'itemShippingAddresses',
    ];

    for (const key of propertyList) {
      if (primaryCommercetoolsCart.hasOwnProperty(key)) {
        cartDraft[key] = primaryCommercetoolsCart[key];
      }
    }

    let replicatedCommercetoolsCart = await this.getApiForProject()
      .carts()
      .post({
        queryArgs: {
          expand: [
            'lineItems[*].discountedPrice.includedDiscounts[*].discount',
            'discountCodes[*].discountCode',
            'paymentInfo.payments[*]',
          ],
        },
        body: cartDraft,
      })
      .execute()
      .then((response) => {
        return response.body;
      });

    // Add line items to the replicated cart one by one to handle the exception
    // if an item is not available on the new currency.
    for (const lineItem of lineItems) {
      try {
        const cartUpdate: CartUpdate = {
          version: +replicatedCommercetoolsCart.version,
          actions: [
            {
              action: 'addLineItem',
              sku: lineItem.variant.sku,
              quantity: +lineItem.quantity,
            },
          ],
        };

        replicatedCommercetoolsCart = await this.updateCart(replicatedCommercetoolsCart.id, cartUpdate, locale);
      } catch (error) {
        // Ignore that a line item could not be added due to missing price, etc
      }
    }

    // Delete previous cart
    await this.getApiForProject()
      .carts()
      .withId({
        ID: primaryCartId,
      })
      .delete({
        queryArgs: {
          version: cartVersion,
        },
      })
      .execute();

    return CartMapper.commercetoolsCartToCart(replicatedCommercetoolsCart, locale);
  };

  protected doesCartNeedLocaleUpdate: (commercetoolsCart: CommercetoolsCart, locale: Locale) => boolean = (
    commercetoolsCart: CommercetoolsCart,
    locale: Locale,
  ) => {
    if (commercetoolsCart.country === undefined) {
      return true;
    }

    if (commercetoolsCart.locale === undefined) {
      return true;
    }

    return commercetoolsCart.country !== locale.country || commercetoolsCart.locale !== locale.language;
  };
}
