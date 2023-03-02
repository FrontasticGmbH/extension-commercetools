import { ActionContext, Request } from '@frontastic/extension-types';
import { Cart } from '@Types/cart/Cart';
import { CartApi } from '../apis/CartApi';
import { Guid } from './Guid';

export class CartFetcher {
  static async fetchCart(cartApi: CartApi, request: Request, actionContext: ActionContext): Promise<Cart> {
    if (request.sessionData?.account !== undefined) {
      return await cartApi.getForUser(request.sessionData.account);
    }

    if (request.sessionData?.cartId !== undefined) {
      try {
        return await cartApi.getById(request.sessionData.cartId);
      } catch (error) {
        console.info(`Error fetching the cart ${request.sessionData.cartId}, creating a new one. ${error}`);
      }
    }

    return await cartApi.getAnonymous(Guid.newGuid());
  }
}
