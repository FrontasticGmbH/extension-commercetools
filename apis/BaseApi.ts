import { ApiRoot, createApiBuilderFromCtpClient, Project, ProductType } from '@commercetools/platform-sdk';
import { ClientFactory } from '../ClientFactory';
import { Context } from '@frontastic/extension-types';
import { getConfig } from '../utils/GetConfig';
import { Locale } from '../Locale';
import { ByProjectKeyRequestBuilder } from '@commercetools/platform-sdk/dist/declarations/src/generated/client/by-project-key-request-builder';

const localeRegex =
  /^(?<language>[a-z]{2,})(?:_(?<territory>[A-Z]{2,}))?(?:\.(?<codeset>[A-Z0-9_+-]+))?(?:@(?<modifier>[A-Za-z]+))?$/;

const languageToTerritory = {
  en: 'GB',
};

const modifierToCurrency = {
  euro: 'EUR',
};

const territoryToCurrency = {
  AD: 'EUR',
  AE: 'AED',
  AF: 'AFN',
  AG: 'XCD',
  AI: 'XCD',
  AL: 'ALL',
  AM: 'AMD',
  AN: 'ANG',
  AO: 'AOA',
  AQ: 'AQD',
  AR: 'ARS',
  AS: 'EUR',
  AT: 'EUR',
  AU: 'AUD',
  AW: 'ANG',
  AX: 'EUR',
  AZ: 'AZN',
  BA: 'BAM',
  BB: 'BBD',
  BD: 'BDT',
  BE: 'EUR',
  BF: 'XOF',
  BG: 'BGN',
  BH: 'BHD',
  BI: 'BIF',
  BJ: 'XOF',
  BL: 'EUR',
  BM: 'BMD',
  BN: 'BND',
  BO: 'BOB',
  BR: 'BRL',
  BS: 'BSD',
  BT: 'INR',
  BV: 'NOK',
  BW: 'BWP',
  BY: 'BYR',
  BZ: 'BZD',
  CA: 'CAD',
  CC: 'AUD',
  CD: 'CDF',
  CF: 'XAF',
  CG: 'XAF',
  CH: 'CHF',
  CI: 'XOF',
  CK: 'NZD',
  CL: 'CLP',
  CM: 'XAF',
  CN: 'CNY',
  CO: 'COP',
  CR: 'CRC',
  CU: 'CUP',
  CV: 'CVE',
  CX: 'AUD',
  CY: 'CYP',
  CZ: 'CZK',
  DE: 'EUR',
  DJ: 'DJF',
  DK: 'DKK',
  DM: 'XCD',
  DO: 'DOP',
  DZ: 'DZD',
  EC: 'ECS',
  EE: 'EEK',
  EG: 'EGP',
  EH: 'MAD',
  ER: 'ETB',
  ES: 'EUR',
  ET: 'ETB',
  FI: 'EUR',
  FJ: 'FJD',
  FK: 'FKP',
  FM: 'USD',
  FO: 'DKK',
  FR: 'EUR',
  GA: 'XAF',
  GB: 'GBP',
  GD: 'XCD',
  GE: 'GEL',
  GF: 'EUR',
  GG: 'GGP',
  GH: 'GHS',
  GI: 'GIP',
  GL: 'DKK',
  GM: 'GMD',
  GN: 'GNF',
  GP: 'EUR',
  GQ: 'XAF',
  GR: 'EUR',
  GS: 'GBP',
  GT: 'GTQ',
  GU: 'USD',
  GW: 'XOF',
  GY: 'GYD',
  HK: 'HKD',
  HM: 'AUD',
  HN: 'HNL',
  HR: 'HRK',
  HT: 'HTG',
  HU: 'HUF',
  ID: 'IDR',
  IE: 'EUR',
  IL: 'ILS',
  IM: 'GBP',
  IN: 'INR',
  IO: 'USD',
  IQ: 'IQD',
  IR: 'IRR',
  IS: 'ISK',
  IT: 'EUR',
  JE: 'GBP',
  JM: 'JMD',
  JO: 'JOD',
  JP: 'JPY',
  KE: 'KES',
  KG: 'KGS',
  KH: 'KHR',
  KI: 'AUD',
  KM: 'KMF',
  KN: 'XCD',
  KP: 'KPW',
  KR: 'KRW',
  KW: 'KWD',
  KY: 'KYD',
  KZ: 'KZT',
  LA: 'LAK',
  LB: 'LBP',
  LC: 'XCD',
  LI: 'CHF',
  LK: 'LKR',
  LR: 'LRD',
  LS: 'LSL',
  LT: 'LTL',
  LU: 'EUR',
  LV: 'LVL',
  LY: 'LYD',
  MA: 'MAD',
  MC: 'EUR',
  MD: 'MDL',
  ME: 'EUR',
  MF: 'ANG',
  MG: 'MGA',
  MH: 'USD',
  MK: 'MKD',
  ML: 'XOF',
  MM: 'MMK',
  MN: 'MNT',
  MO: 'MOP',
  MP: 'USD',
  MQ: 'EUR',
  MR: 'MRO',
  MS: 'XCD',
  MT: 'MTL',
  MU: 'MUR',
  MV: 'MVR',
  MW: 'MWK',
  MX: 'MXN',
  MY: 'MYR',
  MZ: 'MZN',
  NA: 'NAD',
  NC: 'XPF',
  NE: 'XOF',
  NF: 'AUD',
  NG: 'NGN',
  NI: 'NIO',
  NL: 'EUR',
  NO: 'NOK',
  NP: 'NPR',
  NR: 'AUD',
  NU: 'NZD',
  NZ: 'NZD',
  OM: 'OMR',
  PA: 'PAB',
  PE: 'PEN',
  PF: 'XPF',
  PG: 'PGK',
  PH: 'PHP',
  PK: 'PKR',
  PL: 'PLN',
  PM: 'EUR',
  PN: 'NZD',
  PR: 'USD',
  PS: 'JOD',
  PT: 'EUR',
  PW: 'USD',
  PY: 'PYG',
  QA: 'QAR',
  RE: 'EUR',
  RO: 'RON',
  RS: 'RSD',
  RU: 'RUB',
  RW: 'RWF',
  SA: 'SAR',
  SB: 'SBD',
  SC: 'SCR',
  SD: 'SDG',
  SE: 'SEK',
  SG: 'SGD',
  SH: 'GBP',
  SI: 'EUR',
  SJ: 'NOK',
  SK: 'SKK',
  SL: 'SLL',
  SM: 'EUR',
  SN: 'XOF',
  SO: 'SOS',
  SR: 'SRD',
  ST: 'STD',
  SV: 'SVC',
  SY: 'SYP',
  SZ: 'SZL',
  TC: 'USD',
  TD: 'XAF',
  TF: 'EUR',
  TG: 'XOF',
  TH: 'THB',
  TJ: 'TJS',
  TK: 'NZD',
  TM: 'TMT',
  TN: 'TND',
  TO: 'TOP',
  TP: 'IDR',
  TR: 'TRY',
  TT: 'TTD',
  TV: 'AUD',
  TW: 'TWD',
  TZ: 'TZS',
  UA: 'UAH',
  UG: 'UGX',
  UM: 'USD',
  USAF: 'USD',
  US: 'USD',
  UY: 'UYU',
  UZ: 'UZS',
  VA: 'EUR',
  VC: 'XCD',
  VE: 'VEF',
  VG: 'USD',
  VI: 'USD',
  VN: 'VND',
  VU: 'VUV',
  WF: 'XPF',
  WS: 'EUR',
  YE: 'YER',
  YT: 'EUR',
  ZA: 'ZAR',
  ZM: 'ZMK',
  ZW: 'ZWD',
};

interface ParsedLocale {
  language: string;
  territory: string;
  currency: string;
}

const parseLocale = (locale: string): ParsedLocale => {
  const matches = locale.match(localeRegex);

  if (matches === null) {
    throw new Error(`Invalid locale: ${locale}`);
  }

  const language = matches.groups.language;

  let territory = matches.groups.territory;
  if (territory === undefined) {
    if (language in languageToTerritory) {
      territory = languageToTerritory[language];
    } else {
      territory = language.toUpperCase();
    }
  }

  let currency: undefined | string = undefined;

  const modifier = matches.groups.modifier;
  if (modifier !== undefined) {
    if (modifier in modifierToCurrency) {
      currency = modifierToCurrency[modifier];
    } else {
      const foundCurrency = Object.values(territoryToCurrency).find((currency) => currency === modifier.toUpperCase());
      if (foundCurrency !== undefined) {
        currency = foundCurrency;
      }
    }
  }

  if (currency === undefined) {
    if (territory in territoryToCurrency) {
      currency = territoryToCurrency[territory];
    } else {
      currency = 'EUR';
    }
  }

  return {
    language,
    territory,
    currency,
  };
};

const projectCacheTtlMilliseconds = 10 * 60 * 1000;
const projectCache: {
  [projectKey: string]: { project: Project; expiryTime: Date };
} = {};

const productTypesCache: {
  [projectKey: string]: { productTypes: ProductType[]; expiryTime: Date };
} = {};

const pickCandidate = (candidates: string[], availableOptions: string[]): string | undefined => {
  for (const candidate of candidates) {
    const found = availableOptions.find((option) => option.toLowerCase() === candidate.toLowerCase());
    if (found !== undefined) {
      return found;
    }
  }

  return undefined;
};

const pickCommercetoolsLanguage = (parsedLocale: ParsedLocale, availableLanguages: string[]) => {
  const candidates = [`${parsedLocale.language}-${parsedLocale.territory}`, parsedLocale.language];

  const foundCandidate = pickCandidate(candidates, availableLanguages);
  if (foundCandidate !== undefined) {
    return foundCandidate;
  }

  const prefix = `${parsedLocale.language.toLowerCase()}-`;
  const foundPrefix = availableLanguages.find((option) => option.toLowerCase().startsWith(prefix));
  if (foundPrefix !== undefined) {
    return foundPrefix;
  }

  return availableLanguages[0];
};

const pickCommercetoolsCountry = (parsedLocale: ParsedLocale, language: string, availableCountries: string[]) => {
  const candidates = [parsedLocale.territory, parsedLocale.language, language];

  const foundCandidate = pickCandidate(candidates, availableCountries);
  if (foundCandidate !== undefined) {
    return foundCandidate;
  }

  return availableCountries[0];
};

const pickCommercetoolsCurrency = (parsedLocale: ParsedLocale, availableCurrencies: string[]) => {
  const candidates = [
    parsedLocale.currency,
    parseLocale(`${parsedLocale.language}_${parsedLocale.territory}`).currency,
  ];

  const foundCandidate = pickCandidate(candidates, availableCurrencies);
  if (foundCandidate !== undefined) {
    return foundCandidate;
  }

  return availableCurrencies[0];
};

export abstract class BaseApi {
  protected apiRoot: ApiRoot;
  protected projectKey: string;
  protected locale: string;

  constructor(frontasticContext: Context, locale: string | null) {
    this.locale = locale !== null ? locale : frontasticContext.project.defaultLocale;

    const engine = 'commercetools';
    const clientSettings = getConfig(frontasticContext.project, engine, this.locale);
    const client = ClientFactory.factor(clientSettings, frontasticContext.environment);

    this.apiRoot = createApiBuilderFromCtpClient(client);
    this.projectKey = clientSettings.projectKey;
  }

  protected getApiForProject(): ByProjectKeyRequestBuilder {
    return this.apiRoot.withProjectKey({ projectKey: this.projectKey });
  }

  protected async getCommercetoolsLocal(): Promise<Locale> {
    const parsedLocale = parseLocale(this.locale);
    const project = await this.getProject();

    const language = pickCommercetoolsLanguage(parsedLocale, project.languages);
    const country = pickCommercetoolsCountry(parsedLocale, language, project.countries);
    const currency = pickCommercetoolsCurrency(parsedLocale, project.currencies);

    return Promise.resolve({
      language,
      country,
      currency,
    });
  }

  protected async getProductTypes() {
    const now = new Date();

    if (this.projectKey in productTypesCache) {
      const cacheEntry = productTypesCache[this.projectKey];
      if (now < cacheEntry.expiryTime) {
        return cacheEntry.productTypes;
      }
    }

    const response = await this.getApiForProject().productTypes().get().execute();

    const productTypes = response.body.results;

    productTypesCache[this.projectKey] = {
      productTypes,
      expiryTime: new Date(now.getMilliseconds() + projectCacheTtlMilliseconds),
    };

    return productTypes;
  }

  protected async getProject() {
    const now = new Date();

    if (this.projectKey in projectCache) {
      const cacheEntry = projectCache[this.projectKey];
      if (now < cacheEntry.expiryTime) {
        return cacheEntry.project;
      }
    }

    const response = await this.getApiForProject().get().execute();
    const project = response.body;

    projectCache[this.projectKey] = {
      project,
      expiryTime: new Date(now.getMilliseconds() + projectCacheTtlMilliseconds),
    };

    return project;
  }
}
