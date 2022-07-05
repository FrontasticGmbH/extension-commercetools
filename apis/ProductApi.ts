import { Result } from '../../../types/product/Result';
import { ProductMapper } from '../mappers/ProductMapper';
import { ProductQuery } from '../../../types/query/ProductQuery';
import { Product } from '../../../types/product/Product';
import { BaseApi } from './BaseApi';
import { FilterField, FilterFieldTypes } from '../../../types/product/FilterField';
import { FilterTypes } from '../../../types/query/Filter';
import { TermFilter } from '../../../types/query/TermFilter';
import { RangeFilter } from '../../../types/query/RangeFilter';
import { CategoryQuery } from '../../../types/query/CategoryQuery';
import { Category } from '../../../types/product/Category';
import { FacetDefinition } from '../../../types/product/FacetDefinition';

export class ProductApi extends BaseApi {
  protected getOffsetFromCursor = (cursor: string) => {
    if (cursor === undefined) {
      return undefined;
    }

    const offsetMach = cursor.match(/(?<=offset:).+/);
    return offsetMach !== null ? +Object.values(offsetMach)[0] : undefined;
  };

  query: (productQuery: ProductQuery) => Promise<Result> = async (productQuery: ProductQuery) => {
    try {
      const locale = await this.getCommercetoolsLocal();

      // TODO: get default from constant
      const limit = +productQuery.limit || 24;

      const filterQuery: string[] = [];
      const filterFacets: string[] = [];
      const sortAttributes: string[] = [];

      const facetDefinitions: FacetDefinition[] = [
        ...ProductMapper.commercetoolsProductTypesToFacetDefinitions(await this.getProductTypes(), locale),
        // Include Scoped Price facet
        {
          attributeId: 'variants.scopedPrice.value',
          attributeType: 'money',
        },
        // Include Price facet
        {
          attributeId: 'variants.price',
          attributeType: 'money',
        },
      ];

      const queryArgFacets = ProductMapper.facetDefinitionsToCommercetoolsQueryArgFacets(facetDefinitions, locale);

      if (productQuery.productIds !== undefined && productQuery.productIds.length !== 0) {
        filterQuery.push(`id:"${productQuery.productIds.join('","')}"`);
      }

      if (productQuery.skus !== undefined && productQuery.skus.length !== 0) {
        filterQuery.push(`variants.sku:"${productQuery.skus.join('","')}"`);
      }

      if (productQuery.category !== undefined && productQuery.category !== '') {
        filterQuery.push(`categories.id:subtree("${productQuery.category}")`);
      }

      if (productQuery.filters !== undefined) {
        productQuery.filters.forEach((filter) => {
          switch (filter.type) {
            case FilterTypes.TERM:
              filterQuery.push(`${filter.identifier}.key:"${(filter as TermFilter).terms.join('","')}"`);
              break;
            case FilterTypes.BOOLEAN:
              filterQuery.push(
                `${filter.identifier}:${(filter as TermFilter).terms[0]?.toString().toLowerCase() === 'true'}`,
              );
              break;
            case FilterTypes.RANGE:
              if (filter.identifier === 'price') {
                // The scopedPrice filter is a commercetools price filter of a product variant selected
                // base on the price scope. The scope used is currency and country.
                filterQuery.push(
                  `variants.scopedPrice.value.centAmount:range (${(filter as RangeFilter).min ?? '*'} to ${
                    (filter as RangeFilter).max ?? '*'
                  })`,
                );
              }
              break;
          }
        });
      }

      if (productQuery.facets !== undefined) {
        filterFacets.push(
          ...ProductMapper.facetDefinitionsToFilterFacets(productQuery.facets, facetDefinitions, locale),
        );
      }

      if (productQuery.sortAttributes !== undefined) {
        Object.keys(productQuery.sortAttributes).map((field, directionIndex) => {
          sortAttributes.push(`${field} ${Object.values(productQuery.sortAttributes)[directionIndex]}`);
        });
      }

      const methodArgs = {
        queryArgs: {
          sort: sortAttributes,
          limit: limit,
          offset: this.getOffsetFromCursor(productQuery.cursor),
          priceCurrency: locale.currency,
          priceCountry: locale.country,
          facet: queryArgFacets.length > 0 ? queryArgFacets : undefined,
          filter: filterFacets.length > 0 ? filterFacets : undefined,
          'filter.facets': filterFacets.length > 0 ? filterFacets : undefined,
          'filter.query': filterQuery.length > 0 ? filterQuery : undefined,
          [`text.${locale.language}`]: productQuery.query,
        },
      };

      return await this.getApiForProject()
        .productProjections()
        .search()
        .get(methodArgs)
        .execute()
        .then((response) => {
          const items = response.body.results.map((product) =>
            ProductMapper.commercetoolsProductProjectionToProduct(product, locale),
          );

          const result: Result = {
            total: response.body.total,
            items: items,
            count: response.body.count,
            facets: ProductMapper.commercetoolsFacetResultsToFacets(response.body.facets, productQuery, locale),
            previousCursor: ProductMapper.calculatePreviousCursor(response.body.offset, response.body.count),
            nextCursor: ProductMapper.calculateNextCursor(
              response.body.offset,
              response.body.count,
              response.body.total,
            ),
            query: productQuery,
          };

          return result;
        })
        .catch((error) => {
          throw error;
        });
    } catch (error) {
      //TODO: better error, get status code etc...
      throw new Error(`query failed. ${error}`);
    }
  };

  getProduct: (productQuery: ProductQuery) => Promise<Product> = async (productQuery: ProductQuery) => {
    try {
      const result = await this.query(productQuery);

      return result.items.shift() as Product;
    } catch (error) {
      //TODO: better error, get status code etc...
      throw new Error(`getProduct failed. ${error}`);
    }
  };

  getSearchableAttributes: () => Promise<FilterField[]> = async () => {
    try {
      const locale = await this.getCommercetoolsLocal();

      const response = await this.getApiForProject().productTypes().get().execute();

      const filterFields = ProductMapper.commercetoolsProductTypesToFilterFields(response.body.results, locale);

      filterFields.push({
        field: 'categoryId',
        type: FilterFieldTypes.ENUM,
        label: 'Category ID',
        values: await this.queryCategories({ limit: 250 }).then((result) => {
          return (result.items as Category[]).map((item) => {
            return {
              value: item.categoryId,
              name: item.name,
            };
          });
        }),
      });

      return filterFields;
    } catch (error) {
      //TODO: better error, get status code etc...
      throw new Error(`getSearchableAttributes failed. ${error}`);
    }
  };

  queryCategories: (categoryQuery: CategoryQuery) => Promise<Result> = async (categoryQuery: CategoryQuery) => {
    try {
      const locale = await this.getCommercetoolsLocal();

      // TODO: get default from constant
      const limit = +categoryQuery.limit || 24;
      const where: string[] = [];

      if (categoryQuery.slug) {
        where.push(`slug(${locale.language}="${categoryQuery.slug}")`);
      }

      if (categoryQuery.parentId) {
        where.push(`parent(id="${categoryQuery.parentId}")`);
      }

      const methodArgs = {
        queryArgs: {
          limit: limit,
          offset: this.getOffsetFromCursor(categoryQuery.cursor),
          where: where.length > 0 ? where : undefined,
        },
      };

      return await this.getApiForProject()
        .categories()
        .get(methodArgs)
        .execute()
        .then((response) => {
          const items = response.body.results.map((category) =>
            ProductMapper.commercetoolsCategoryToCategory(category, locale),
          );

          const result: Result = {
            total: response.body.total,
            items: items,
            count: response.body.count,
            previousCursor: ProductMapper.calculatePreviousCursor(response.body.offset, response.body.count),
            nextCursor: ProductMapper.calculateNextCursor(
              response.body.offset,
              response.body.count,
              response.body.total,
            ),
            query: categoryQuery,
          };

          return result;
        })
        .catch((error) => {
          throw error;
        });
    } catch (error) {
      //TODO: better error, get status code etc...
      throw new Error(`queryCategories failed. ${error}`);
    }
  };
}
