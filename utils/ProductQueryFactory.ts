import { DataSourceConfiguration, Request } from '@frontastic/extension-types';
import { ProductQuery, SortAttributes, SortOrder } from '../../../types/query/ProductQuery';
import { Filter, FilterTypes } from '../../../types/query/Filter';
import { RangeFilter } from '../../../types/query/RangeFilter';
import { TermFilter } from '../../../types/query/TermFilter';
import { FilterFieldTypes } from '../../../types/product/FilterField';
import { Facet } from '../../../types/query/Facet';
import { TermFacet } from '../../../types/query/TermFacet';
import { RangeFacet } from '../../../types/query/RangeFacet';

export class ProductQueryFactory {
  static queryFromParams: (request: Request, config?: DataSourceConfiguration) => ProductQuery = (
    request: Request,
    config?: DataSourceConfiguration,
  ) => {
    let queryParams;
    const filters: Filter[] = [];
    const productQuery: ProductQuery = {
      productIds: [],
      skus: [],
    };

    // Selected ID/SKUs filter from the studio
    const productIds = config?.configuration?.productIds?.split(',').map((val: string) => val.trim());
    const productSkus = config?.configuration?.productSkus?.split(',').map((val: string) => val.trim());

    /**
     * Merge params
     */
    if (request?.query) {
      queryParams = request.query;
    }

    if (config?.configuration) {
      queryParams = {
        ...queryParams,
        ...config.configuration,
      };
    }

    // Add SKUs and IDs if they are there
    if (productSkus && productSkus.length > 0) queryParams.skus = productSkus;
    if (productIds && productIds.length > 0) queryParams.productIds = productIds;

    /**
     * Map query
     */
    productQuery.query = queryParams?.query || undefined;

    /**
     * Map Category
     *
     * Category could be overwritten by category configuration from Frontastic Studio
     */
    productQuery.category = queryParams?.category || undefined;

    /**
     * Map productIds
     */
    if (queryParams?.productIds && Array.isArray(queryParams?.productIds)) {
      queryParams?.productIds.map((productId: string | number) => {
        productQuery.productIds.push(productId.toString());
      });
    }

    /**
     * Map skus
     */
    if (queryParams?.skus && Array.isArray(queryParams?.skus)) {
      queryParams?.skus.map((sku: string | number) => {
        productQuery.skus.push(sku.toString());
      });
    }

    /**
     * Map filters and category
     *
     * Since filters and values might be returned in separated arrays we are using
     * the following method to merge both, filters and values, in a single array.
     */
    const configFiltersData = [];
    configFiltersData.push(...ProductQueryFactory.mergeProductFiltersAndValues(queryParams));
    configFiltersData.push(...ProductQueryFactory.mergeCategoryFiltersAndValues(queryParams));

    let key: any;
    let configFilterData: any;

    if (configFiltersData instanceof Array) {
      for ([key, configFilterData] of Object.entries(configFiltersData)) {
        if (configFilterData?.field === 'categoryId') {
          // Overwrite category with any value that has been set from Frontastic Studio
          productQuery.category = configFilterData.values[0]; // TODO: should change if category is a single value
          continue;
        }

        switch (configFilterData.type) {
          case FilterFieldTypes.NUMBER:
            const rangeFilter: RangeFilter = {
              identifier: configFilterData?.field,
              type: FilterTypes.RANGE,
              min: +configFilterData?.min || undefined,
              max: +configFilterData?.max || undefined,
            };
            filters.push(rangeFilter);
            break;
          case FilterFieldTypes.ENUM:
            const enumFilter: TermFilter = {
              identifier: configFilterData?.field,
              type: FilterTypes.TERM,
              terms: configFilterData?.values.map((term: string | number) => term),
            };
            filters.push(enumFilter);
            break;
          case FilterFieldTypes.BOOLEAN:
            const booleanFilter: TermFilter = {
              identifier: configFilterData?.field,
              type: FilterTypes.BOOLEAN,
              terms: [configFilterData?.values[0]],
            };
            filters.push(booleanFilter);
            break;
          default:
            break;
        }
      }

      productQuery.filters = filters;
    }

    /**
     * Map facets
     */
    if (queryParams.facets) {
      productQuery.facets = ProductQueryFactory.queryParamsToFacets(queryParams);
    }

    /**
     * Map sort attributes
     */
    if (queryParams.sortAttributes) {
      const sortAttributes: SortAttributes = {};
      let sortAttribute;

      for (sortAttribute of Object.values(queryParams.sortAttributes)) {
        const key = Object.keys(sortAttribute)[0];
        sortAttributes[key] = sortAttribute[key] ? sortAttribute[key] : SortOrder.ASCENDING;
      }
      productQuery.sortAttributes = sortAttributes;
    }

    /**
     * Map page limit
     */
    productQuery.limit = queryParams?.limit || undefined;

    /**
     * Map page cursor
     */
    productQuery.cursor = queryParams?.cursor || undefined;

    return productQuery;
  };

  private static queryParamsToFacets(queryParams: any) {
    const facets: Facet[] = [];
    let key: any;
    let facetData: any;

    for ([key, facetData] of Object.entries(queryParams.facets)) {
      // Force terms as an array if exist
      if (facetData?.terms && !Array.isArray(facetData.terms)) {
        facetData.terms = Object.values(facetData.terms);
      }

      switch (true) {
        case facetData.min !== undefined && facetData.max !== undefined:
          facets.push({
            type: FilterTypes.RANGE,
            identifier: key,
            min: +facetData.min,
            max: +facetData.max,
          } as RangeFacet);
          break;
        case facetData.terms !== undefined:
          facets.push({
            type: FilterTypes.TERM,
            identifier: key,
            terms: facetData.terms.map((facetValueData: string) => facetValueData),
          } as TermFacet);
          break;
        case facetData.boolean !== undefined:
          facets.push({
            type: FilterTypes.BOOLEAN,
            identifier: key,
            terms: [facetData.boolean],
          } as TermFacet);
          break;
        default:
          break;
      }
    }

    return facets;
  }

  private static mergeProductFiltersAndValues(queryParams: any) {
    const filtersData: any[] = [];

    if (queryParams?.productFilters?.filters === undefined) {
      return filtersData;
    }

    if (queryParams?.productFilters?.values === undefined) {
      return queryParams.productFilters.filters;
    }

    queryParams.productFilters.filters.forEach((filter: any) => {
      if (filter?.field) {
        const filterValues =
          // TODO: to be adapted when Studio returned multiple values
          [queryParams.productFilters?.values[filter.field]] || [];

        const filterData = {
          ...filter,
          values: filterValues,
        };
        filtersData.push(filterData);
      }
    });

    return filtersData;
  }

  private static mergeCategoryFiltersAndValues(queryParams: any) {
    const filtersData: any[] = [];

    if (queryParams?.categoryFilters?.filters === undefined) {
      return filtersData;
    }

    if (queryParams?.categoryFilters?.values === undefined) {
      return queryParams.categoryFilters.filters;
    }

    queryParams.categoryFilters.filters.forEach((filter: any) => {
      if (filter?.field) {
        const filterValues = [queryParams.categoryFilters.values[filter.field]] || [];

        const filterData = {
          ...filter,
          values: filterValues,
        };
        filtersData.push(filterData);
      }
    });

    return filtersData;
  }
}
