import { Product } from '../../../types/product/Product';
import { Context, Request } from '@frontastic/extension-types';
import { ProductQuery } from '../../../types/query/ProductQuery';
import { ProductApi } from '../apis/ProductApi';
import { LineItem } from '../../../types/cart/LineItem';
import { getPath, getLocale } from './Request';
import { LineItem as WishlistItem } from '../../../types/wishlist/LineItem';

export class ProductRouter {
  private static isProduct(product: Product | LineItem | WishlistItem): product is Product {
    // Only Product has the property "slug"
    return product.hasOwnProperty('slug');
  }

  static generateUrlFor(item: Product | LineItem | WishlistItem) {
    if (ProductRouter.isProduct(item)) {
      return `/${item.slug}/p/${item.variants[0].sku}`;
    }
    return `/slug/p/${item.variant.sku}`;
  }

  static identifyFrom(request: Request) {
    if (getPath(request)?.match(/\/p\/([^\/]+)/)) {
      return true;
    }

    return false;
  }

  static loadFor = async (request: Request, frontasticContext: Context): Promise<Product> => {
    const productApi = new ProductApi(frontasticContext, getLocale(request));

    const urlMatches = getPath(request)?.match(/\/p\/([^\/]+)/);

    if (urlMatches) {
      const productQuery: ProductQuery = {
        skus: [urlMatches[1]],
      };
      return productApi.getProduct(productQuery);
    }

    return null;
  };
}
