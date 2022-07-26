import * as AccountActions from './actionControllers/AccountController';
import * as ProductActions from './actionControllers/ProductController';
import * as CartActions from './actionControllers/CartController';
import * as WishlistActions from './actionControllers/WishlistController';
import * as ProjectActions from './actionControllers/ProjectController';

import {
  DataSourceConfiguration,
  DataSourceContext,
  DynamicPageContext,
  DynamicPageRedirectResult,
  DynamicPageSuccessResult,
  ExtensionRegistry,
  Request,
} from '@frontastic/extension-types';
import { getLocale, getPath } from './utils/Request';
import { ProductRouter } from './utils/ProductRouter';
import { Product } from '../../types/product/Product';
import { SearchRouter } from './utils/SearchRouter';
import { Result } from '../../types/product/Result';
import { CategoryRouter } from './utils/CategoryRouter';
import { ProductApi } from './apis/ProductApi';
import { ProductQueryFactory } from './utils/ProductQueryFactory';

export default {
  'dynamic-page-handler': async (
    request: Request,
    context: DynamicPageContext,
  ): Promise<DynamicPageSuccessResult | DynamicPageRedirectResult | null> => {
    // Identify static page
    const staticPageMatch = getPath(request)?.match(
      /^\/(cart|checkout|wishlist|account|login|register|reset-password|thank-you)/,
    );
    if (staticPageMatch) {
      return {
        dynamicPageType: `frontastic${staticPageMatch[0]}`,
        dataSourcePayload: {},
        pageMatchingPayload: {},
      } as DynamicPageSuccessResult;
    }

    // Identify Product
    if (ProductRouter.identifyFrom(request)) {
      return ProductRouter.loadFor(request, context.frontasticContext).then((product: Product) => {
        if (product) {
          return {
            dynamicPageType: 'frontastic/product-detail-page',
            dataSourcePayload: {
              product: product,
            },
            pageMatchingPayload: {
              product: product,
            },
          };
        }

        // FIXME: Return proper error result
        return null;
      });
    }

    // Identify Search
    if (SearchRouter.identifyFrom(request)) {
      return SearchRouter.loadFor(request, context.frontasticContext).then((result: Result) => {
        if (result) {
          return {
            dynamicPageType: 'frontastic/search',
            dataSourcePayload: result,
            pageMatchingPayload: {
              query: result.query,
            },
          };
        }

        // FIXME: Return proper error result
        return null;
      });
    }

    if (CategoryRouter.identifyFrom(request)) {
      return CategoryRouter.loadFor(request, context.frontasticContext).then((result: Result) => {
        if (result) {
          return {
            dynamicPageType: 'frontastic/category',
            dataSourcePayload: {
              total: result.total,
              items: result.items,
              facets: result.facets,
              previousCursor: result.previousCursor,
              nextCursor: result.nextCursor,
              category: getPath(request),
            },
            pageMatchingPayload: {
              total: result.total,
              items: result.items,
              facets: result.facets,
              previousCursor: result.previousCursor,
              nextCursor: result.nextCursor,
              category: getPath(request),
            },
          };
        }

        // FIXME: Return proper error result
        return null;
      });
    }

    return null;
  },
  'data-sources': {
    'frontastic/product-list': async (config: DataSourceConfiguration, context: DataSourceContext) => {
      const productApi = new ProductApi(context.frontasticContext, context.request ? getLocale(context.request) : null);

      const productQuery = ProductQueryFactory.queryFromParams(context?.request, config);

      return await productApi.query(productQuery).then((queryResult) => {
        return {
          dataSourcePayload: queryResult,
        };
      });
    },

    'frontastic/similar-products': async (config: DataSourceConfiguration, context: DataSourceContext) => {
      if (!context.hasOwnProperty('request')) {
        throw new Error(`Request is not defined in context ${context}`);
      }

      const productApi = new ProductApi(context.frontasticContext, getLocale(context.request));
      const productQuery = ProductQueryFactory.queryFromParams(context.request, config);
      const queryWithCategoryId = {
        ...productQuery,
        category: (
          context.pageFolder.dataSourceConfigurations.find((stream) => (stream as any).streamId === '__master') as any
        )?.preloadedValue?.product?.categories?.[0]?.categoryId,
      };

      return await productApi.query(queryWithCategoryId).then((queryResult) => {
        return {
          dataSourcePayload: queryResult,
        };
      });
    },

    'frontastic/product': async (config: DataSourceConfiguration, context: DataSourceContext) => {
      const productApi = new ProductApi(context.frontasticContext, context.request ? getLocale(context.request) : null);

      const productQuery = ProductQueryFactory.queryFromParams(context?.request, config);

      return await productApi.getProduct(productQuery).then((queryResult) => {
        return {
          dataSourcePayload: {
            product: queryResult,
          },
        };
      });
    },
  },
  actions: {
    account: AccountActions,
    cart: CartActions,
    product: ProductActions,
    wishlist: WishlistActions,
    project: ProjectActions,
  },
} as ExtensionRegistry;
