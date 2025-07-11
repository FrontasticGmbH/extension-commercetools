## Version 3.8.0 (2025-06-24)

** New Features & Improvements **

- update account login response
- Simplify queryParamsToIds function signature for improved readability
- Enhance type definitions and error handling in API and utility functions
- rename variable, pass in accountGroupIds into session
- Clean up DataSource and QueryParams interfaces for improved readability
- Consolidate RawFacetData interface and update imports for better structure
- Reorganize imports in ProductQueryFactory for improved readability
- Enhance product query capabilities with dynamic filters and data source configuration
- added price filter as product filters
- add support for multiple customer groups
- Update QueryParams import and remove obsolete cartApi interface
- port changes to b2c
- removed usage of streamId and replace by the new dataSourceId field

** Bug Fixes **

- fix lint errors
- Correct error handling in BaseApi to use statusCode for improved accuracy
- Update DataSource and ProductQueryFactory to use optional properties for min and max values
- Update DataSourceConfiguration to enforce specific type for configuration
- remove account usage from session
- handle single value on product filter query

## Version 3.7.0 (2025-06-09)

** New Features & Improvements **

- Aded request log and api endpoint name
- Upgrade commercetools ts client and removed fetch
- Switch method to standard class method for uniformity

** Bug Fixes **

- Get the error code from statusCode instead of code
- Refactor type handling for query parameter utilities.
- Refactor `queryParamsToStates` for improved typing and clarity
- Refactor and clean up type management and configs.
- Improve type safety and simplify query assignment logic
- Simplify matching logic in CartMapper shipping rates
- Refactor filter handling and improve type safety.
- Refactor type handling and improve query parameter parsing
- Add type definitions for cart API and datasource configuration
- Refactor mappers to simplify code and remove unused parameters.
- Refactor types and improve session data handling.
- Refactor CartController for improved readability and consistency

## Version 3.6.0 (2025-05-27)

** New Features & Improvements **

- Migrate from commercetools/sdk-client-v2 to commercetools/ts-client

## Version 3.5.0 (2025-05-12)

** New Features & Improvements **

- Sent confirmation email if user tries to login but haven't confirmed email yet
- Return 200 response if account is not yet logged in
- Streamline account and cart API usage by consolidating account fetching logic and removing unused functions
- Moved all usages of account to accountId
- Added info to the cart error code and support 400 errors
- Added target to the discount
- Use full identifier for filter attributes
- Backported style changs from B2B

** Bug Fixes **

- Validated discount target before map it

## Version 3.4.1 (2025-04-15)

* Map more fields in lineitems
* Aligned discount code to not add the cart gift and handle invalid discount codes

## Version 3.4.0 (2025-04-07)

** New Features & Improvements **

* Added missig comment for category router section
* Removed redundant pageMatchingPayload as it's same value as dataSourcePayload
* Renamed field for dynamic filters
* Updated schemas with product and category filter endpoints
* Implemented product filters and update product detail page structure
* Added error handling for missing checkout config in B2B and B2C
* Removed redundant getOrders method

** Bug Fixes **

* Addapted matching attribute structure for PDP in B2C

## Version 3.3.0 (2025-03-17)

*• New Features & Improvements **

• used full name to loop over variants
• generated product url using, if exist, the first matching variant in B2C
• use single product selection in B2C
• set meta fields undefined if empty in B2C and B2B
• switch to using LocalizedValue.getLocalizedValue
• map meta data fields for products and categories
• mapped cart returned by accoun login method in B2C
• fix lint
• set order number during checkout session

*• Bug Fixes **

• handled product queries with multiple or/and and a single or/and

## Version 3.2.0 (2025-03-03)

** Bug Fixes **

* ensured that if no local or default local exist, first locale available is returned

## Version 3.1.0 (2025-02-17)

** New Features & Improvements **

* added account group filter to PDP in B2B and B2C
* limited the cart fetching for session to not create any cart in B2C
* fix lint errors
* add priceCustomerGroup to product search query(b2c)
* renamed method to match the discount type returned
* added support for free shipping method above amount
* improved imported types
* added types to index
* aligned product and cart discount types
* improved method to loop over product variants
* renamed field for discount code id
* clean up types and comments B2B backend
* impproved discount code handler for B2C
* added support for buy and get + shipping discounts on B2C
* added method to handle localized currencies and cleanup
* handled cart discount for whole cart and line items
* handle product discount on product query and cart for B2C
* implemented product discount types on frontend
* Add discount types to B2C
* Get precise currency for discount value based on locale
* Update B2B to match B2C
* Rename discounts to discount
* Rename DiscountValue to ProductDiscountValue
* Rename ProductDiscount items
* Rename DiscountedTotalPricePortion to DiscountTotalPricePortion
* Introduce product discounts inside b2c
* Add direct discount and rename discount to DiscountCodes B2C

** Bug Fixes **

* Not set customer group when cart is recreated
* Set correct name for discount code id
* Added missing locales
* Handled empty discount
* Differenciated discounted amount and value for product and cart discounts
* Used correct price for product discount mapping

## Version 3.0.0 (2025-02-03)

** New Features & Improvements **

* Added customer group to orders
* Handle slug in url for a given locale
* Map customer groups
* Upgraded extension-types version and used new preloadedValue field

## Version 2.1.0 (2024-12-16)

** New Features and Improvements **

* Map and pass shipping state correctly

## Version 2.0.0 (2024-11-20)

** New Features & Improvements **

* Modify attribute values to test CI lint
* fix weak cryptographic algorithm
* Updated core SDK to V2 alpha, added support

** Bug Fixes **

* Fixed similar products issue in preview

## Version 1.13.0 (2024-11-05)

** New Features and Improvements **

- Added hostURl to the CoCo SDK client to see that url into the dev logs
- Handled multi level category and included categoryId and categoryRef fields
- Moved child categories only if parent exist and refactor descentants
- Implement new product search

** Bug fixes **

- Verify that matching variants exist before use the allMatched property
- Return payment information on order details

## Version 1.20.0 (2024-10-02)

** New Features and Improvements **

- Upgrades to support version Next.js version 14.2.9, React v18.3.1, Yarn4 .4.1 and Typescript version 5.5.4
- Removed unused method that call APIHub directly

** Bug fixes **

- Remove unneeded cart fields during recreation

## Version 1.19.0 (2024-08-30)

** New Features and Improvements **

- Add region extraction from commercetools host
- Cleanup traces of first checkout implementation
- Removed product type from facet name

## Version 1.18.0 (2024-08-15)

** New Features and Improvements **

- Concatenated product type name to the attribute name on searchableAttributes
- Used label as key for searchable attributes

## Version 1.17.0 (2024-08-01)

** New Features and Improvements **

- Filter results shows corresponding variants that matches the price interval
- Added a method to find master data source and comments on private data access
- Added spare parts datasource, refactored referenced products, added product id type
- Added type map for reference and aligned types

## Version 1.16.0 (2024-06-28)

** New Features and Improvements **

## Version 1.15.0 (2024-06-24)

** New Features and Improvements **

- Handled discount code states different from MatchesCart
- Support localized attribute
- Set account email on cart creation for logged in user

## Version 1.14.2 (2024-06-06)

## Version 1.14.1 (2024-05-23)

** Bug fixes **

- Rolled back hardcoded locale and implement tranlatable fields

## Version 1.14.0 (2024-05-23)

** New Features and Improvements **

- Allow for different locales and checkout application keys

** Bug fixes **

- Verified if account exist on session to fetch the cart

## Version 1.13.0 (2024-05-16)

** New Features and Improvements **

- Allowed not active cart to fetch the checkout session token
- Used checkout hash key to identify checkout token in the session

## Version 1.12.1 (2024-05-09)

** New Features and Improvements **

- Set either customersId or anonymousId when cart is recreated
- Rolled back arrays handling on cart mappers

## Version 1.10.0 (2023-12-18)

** New Features and Improvements **

- Improve handle of expired token

** Bug fixes **

- Handle recreated cart on getCart action

## Version 1.10.0 (2023-12-18)

** New Features and Improvements **

- Improve token refresh for checkout anywhere

** Bug fixes **

- Handle anonymous cart

## Version 1.9.0 (2023-11-28)

** New Features and Improvements **

- Create cart only when an action will be performed

** Bug fixes **

- Set cart id on order mapper

## Version 1.8.0 (2023-11-16)

** New Features and Improvements **

- Added price filters to searchable attributes
- Cleaned up cart and wishlist when customer logged out

## Version 1.7.0 (2023-09-27)

** New Features and Improvements **

- Added CoCo, SMTP, and Adyen schema fields for project configuration schema

** Bug fixes **

- Handled attribute labels when there is no localization

## Version 1.6.0 (2023-09-01)

** New Features and Improvements **

- Falled back into project config if studio config is not set for all extensions

## Version 1.5.1 (2023-08-25)

** Bug fixes **

- Removed usage of promotion from CoCo extension

## Version 1.5.0 (2023-08-25)

** New Features and Improvements **

- Allow terretory with numbers in locale parsing

** Bug fixes **

- Don't set addressId when mapping to CoCo address
- Added missing field to account request mapper and validate confirmation before send email
- Parse currency along with locale
- Return human readable facet label

## Version 1.4.0 (2023-03-08)

** New Features and Improvements **

- Upgrade CoCo library
- Get types from alias

## Version 1.3.0 (2023-02-15)

** New Features and Improvements **

- Moved token storage from session to global variable

## Version 1.2.0 (2023-02-03)

** New Features and Improvements **

- Implemented index and session storage for Pages
- Implemented selection of valid locale
- Returned error response when account login failed
- Added data source handler for frontastic empty
- Extensions cleanup
- Create a more structured way for exceptions in our extensions
- Replace category path by _url
- Add a loading state to buttons
- Allowed config the category identification field
- Set default locale on extensions from project config
- Use product key instead of id to identify products on CoCo extension

** Bug fixes **

- Issue with slugs that may contain any of these
- Implemented filter price mapper and included price filters as searchable attributes
- Handled error when try to fetch not existing wishlist
- Get correct shipping price for tier configuration
- API cache validation rule is incorrect
- Search results, product count is undefined

## Version 1.1.0 (2022-07-05)

** New Features **

- Added similar products datasource

** Bug fixes **

- Localization fix

## Version 1.0.0 (2022-07-04)

** New Features **

- First stable version

## Version 1.0.0-alpha.2 (2022-07-04)

## Version 1.0.0-alpha.1 (2022-07-04)

** New Features **

- Initial release
