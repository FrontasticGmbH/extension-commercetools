import { Context, Request } from '@frontastic/extension-types';
import { ProductQueryFactory } from './ProductQueryFactory';
import { Result } from '../../../types/product/Result';
import { ProductApi } from '../apis/ProductApi';
import { getPath, getLocale } from './Request';
import { getToken } from './Token';

export class SearchRouter {
  static identifyFrom(request: Request) {
    const urlMatches = getPath(request)?.match(/^\/search/);

    if (urlMatches) {
      return true;
    }

    return false;
  }

  static loadFor = async (request: Request, frontasticContext: Context): Promise<Result> | null => {
    const productApi = new ProductApi(frontasticContext, getLocale(request), getToken(request));

    const urlMatches = getPath(request)?.match(/\/search/);

    if (urlMatches) {
      const productQuery = ProductQueryFactory.queryFromParams({
        ...request,
        query: { ...request.query, query: request.query.query || request.query.q },
      });
      return productApi.query(productQuery);
    }

    return null;
  };
}
