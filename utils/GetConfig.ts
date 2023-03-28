import { Context } from '@frontastic/extension-types';
import { ClientConfig } from '../interfaces/ClientConfig';
import { getFromProjectConfig } from './Context';

export const getConfig = (context: Context, engine: string, locale: string | null): ClientConfig => {
  const prefix = `EXTENSION_${engine}`;

  return {
    authUrl: getFromProjectConfig(`${prefix}_AUTH_URL`, context),
    clientId: getFromProjectConfig(`${prefix}_CLIENT_ID`, context),
    clientSecret: getFromProjectConfig(`${prefix}_CLIENT_SECRET`, context),
    hostUrl: getFromProjectConfig(`${prefix}_HOST_URL`, context),
    projectKey: getFromProjectConfig(`${prefix}_PROJECT_KEY`, context),
    productIdField: getFromProjectConfig(`${prefix}_PRODUCT_ID_FIELD`, context),
    categoryIdField: getFromProjectConfig(`${prefix}_CATEGORY_ID_FIELD`, context),
  } as ClientConfig;
};
