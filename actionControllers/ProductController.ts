import { Request, Response } from '@frontastic/extension-types';
import { ProductApi } from '../apis/ProductApi';
import { ActionContext } from '@frontastic/extension-types';
import { ProductQueryFactory } from '../utils/ProductQueryFactory';
import { ProductQuery } from '../../../types/query/ProductQuery';
import { CategoryQuery } from '../../../types/query/CategoryQuery';
import { getLocale, getToken } from '../utils/Request';

type ActionHook = (request: Request, actionContext: ActionContext) => Promise<Response>;

export const getProduct: ActionHook = async (request: Request, actionContext: ActionContext) => {
  const productApi = new ProductApi(actionContext.frontasticContext, getLocale(request), getToken(request));

  let productQuery: ProductQuery = {};

  if ('id' in request.query) {
    productQuery = {
      productIds: [request.query['id']],
    };
  }

  if ('sku' in request.query) {
    productQuery = {
      skus: [request.query['sku']],
    };
  }

  const product = await productApi.getProduct(productQuery);

  const response: Response = {
    statusCode: 200,
    body: JSON.stringify(product),
    sessionData: {
      ...request.sessionData,
      token: productApi.token,
    },
  };

  return response;
};

export const query: ActionHook = async (request: Request, actionContext: ActionContext) => {
  const productApi = new ProductApi(actionContext.frontasticContext, getLocale(request), getToken(request));

  const productQuery = ProductQueryFactory.queryFromParams(request);

  const queryResult = await productApi.query(productQuery);

  console.debug('token before response::: ', productApi.token);

  const response: Response = {
    statusCode: 200,
    body: JSON.stringify(queryResult),
    sessionData: {
      ...request.sessionData,
      token: productApi.token,
    },
  };

  return response;
};

export const queryCategories: ActionHook = async (request: Request, actionContext: ActionContext) => {
  const productApi = new ProductApi(actionContext.frontasticContext, getLocale(request), getToken(request));

  const categoryQuery: CategoryQuery = {
    limit: request.query?.limit ?? undefined,
    cursor: request.query?.cursor ?? undefined,
    slug: request.query?.slug ?? undefined,
  };

  const queryResult = await productApi.queryCategories(categoryQuery);

  const response: Response = {
    statusCode: 200,
    body: JSON.stringify(queryResult),
    sessionData: {
      ...request.sessionData,
      token: productApi.token,
    },
  };

  return response;
};

export const searchableAttributes: ActionHook = async (request: Request, actionContext: ActionContext) => {
  const productApi = new ProductApi(actionContext.frontasticContext, getLocale(request), getToken(request));

  const result = await productApi.getSearchableAttributes();

  const response: Response = {
    statusCode: 200,
    body: JSON.stringify(result),
    sessionData: {
      ...request.sessionData,
      token: productApi.token,
    },
  };

  return response;
};
