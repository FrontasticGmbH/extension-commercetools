
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
