import { Context, Request } from '@frontastic/extension-types';
import { ProductApi } from '../apis/ProductApi';
import { CategoryQuery } from '../../../types/query/CategoryQuery';
import { Category } from '../../../types/product/Category';
import { getLocale, getPath } from './Request';
import { Result } from '../../../types/product/Result';
import { ProductQueryFactory } from './ProductQueryFactory';

export class CategoryRouter {
  static identifyFrom(request: Request) {
    if (getPath(request)?.match(/.+/)) {
      return true;
    }

    return false;
  }

  static loadFor = async (request: Request, frontasticContext: Context): Promise<Result> => {
    const productApi = new ProductApi(frontasticContext, getLocale(request));
    const urlMatches = getPath(request)?.match(/[^\/]+/);

    if (urlMatches) {
      const categoryQuery: CategoryQuery = {
        slug: urlMatches[0],
      };

      const categoryQueryResult = await productApi.queryCategories(categoryQuery);

      if (categoryQueryResult.items.length == 0) return null;
      request.query.category = (categoryQueryResult.items[0] as Category).categoryId;

      const productQuery = ProductQueryFactory.queryFromParams({
        ...request,
      });

      return await productApi.query(productQuery);
    }

    return null;
  };
}
