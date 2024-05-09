import { Context, Request } from '@frontastic/extension-types';
import { ProductPaginatedResult } from '@Types/result';
import { ProductApi } from '../../apis/ProductApi';
import { ProductQueryFactory } from '../ProductQueryFactory';
import { getCurrency, getLocale, getPath } from '../Request';

export class SearchRouter {
  static identifyFrom(request: Request) {
    const urlMatches = getPath(request)?.match(/^\/search/);

    if (urlMatches) {
      return true;
    }

    return false;
  }

  static loadFor = async (
    request: Request,
    commercetoolsFrontendContext: Context,
  ): Promise<ProductPaginatedResult> | null => {
    const productApi = new ProductApi(commercetoolsFrontendContext, getLocale(request), getCurrency(request), request);

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
