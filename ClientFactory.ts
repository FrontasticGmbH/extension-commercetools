import {
  ClientBuilder,
  Client,
  AuthMiddlewareOptions,
  HttpMiddlewareOptions,
  RefreshAuthMiddlewareOptions,
  TokenCache,
} from '@commercetools/sdk-client-v2';
// @ts-ignore
import fetch from 'node-fetch';
import { ClientConfig } from './interfaces/ClientConfig';

export class ClientFactory {
  static factor: (
    clientConfig: ClientConfig,
    environment: string | undefined,
    tokenCache: TokenCache | undefined,
    refreshToken?: string,
  ) => Client = (
    clientConfig: ClientConfig,
    environment: string | undefined,
    tokenCache: TokenCache | undefined,
    refreshToken?: string,
  ) => {
    const httpMiddlewareOptions: HttpMiddlewareOptions = {
      host: clientConfig.hostUrl,
      fetch,
    };

    let clientBuilder: ClientBuilder = undefined;

    if (refreshToken) {
      const refreshAuthMiddlewareOptions: RefreshAuthMiddlewareOptions = {
        host: clientConfig.authUrl,
        projectKey: clientConfig.projectKey,
        credentials: {
          clientId: clientConfig.clientId,
          clientSecret: clientConfig.clientSecret,
        },
        // scopes: ['manage_project:' + clientConfig.projectKey],
        fetch,
        tokenCache: tokenCache,
        refreshToken: refreshToken,
      };

      clientBuilder = new ClientBuilder()
        .withHttpMiddleware(httpMiddlewareOptions)
        .withRefreshTokenFlow(refreshAuthMiddlewareOptions);
    }

    if (clientBuilder === undefined) {
      const authMiddlewareOptions: AuthMiddlewareOptions = {
        host: clientConfig.authUrl,
        projectKey: clientConfig.projectKey,
        credentials: {
          clientId: clientConfig.clientId,
          clientSecret: clientConfig.clientSecret,
        },
        // scopes: ['manage_project:' + clientConfig.projectKey],
        fetch,
        tokenCache: tokenCache,
      };

      clientBuilder = new ClientBuilder()
        .withHttpMiddleware(httpMiddlewareOptions)
        .withClientCredentialsFlow(authMiddlewareOptions);
    }

    // To avoid logging sensible data, only enable the logger if the environment is defined and not production.
    if (environment !== undefined && environment !== 'prod' && environment !== 'production') {
      clientBuilder = clientBuilder.withLoggerMiddleware();
    }

    return clientBuilder.build();
  };
}
