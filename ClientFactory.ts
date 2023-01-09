import {
  ClientBuilder,
  Client,
  AuthMiddlewareOptions,
  HttpMiddlewareOptions,
  TokenCache,
} from '@commercetools/sdk-client-v2';
// @ts-ignore
import fetch from 'node-fetch';
import { ClientConfig } from './interfaces/ClientConfig';
import {
  AnonymousAuthMiddlewareOptions,
  RefreshAuthMiddlewareOptions,
} from '@commercetools/sdk-client-v2/dist/declarations/src/types/sdk';

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
    console.debug(':::: ClientFactory ::::');

    const httpMiddlewareOptions: HttpMiddlewareOptions = {
      host: clientConfig.hostUrl,
      fetch,
    };

    // const httpMiddlewareOptions: HttpMiddlewareOptions = {
    //   host: clientConfig.hostUrl,
    //   fetch: (url: string, { headers, ...rest }: { headers: object }) => {
    //     return fetch(url, {
    //       ...rest,
    //       headers: {
    //         ...headers,
    //         authorization: `Bearer ${token}`,
    //       },
    //     });
    //   },
    // };

    let clientBuilder: ClientBuilder = new ClientBuilder()
      // .withProjectKey(clientConfig.projectKey) // Not necessary if the projectKey was already passed in the authMiddlewareOptions
      // .withClientCredentialsFlow(authMiddlewareOptions)
      // .withAnonymousSessionFlow(anonymousAuthMiddlewareOptions)
      .withHttpMiddleware(httpMiddlewareOptions);

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

      console.debug('refreshAuthMiddlewareOptions:: ', refreshAuthMiddlewareOptions);
      console.debug('refreshAuthMiddlewareOptions.tokenCache.get():: ', refreshAuthMiddlewareOptions.tokenCache.get());

      clientBuilder = clientBuilder.withRefreshTokenFlow(refreshAuthMiddlewareOptions);
    } else {
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

      console.debug('authMiddlewareOptions:: ', authMiddlewareOptions);
      console.debug('authMiddlewareOptions.tokenCache.get():: ', authMiddlewareOptions.tokenCache.get());

      clientBuilder = clientBuilder.withClientCredentialsFlow(authMiddlewareOptions);
    }

    // const anonymousAuthMiddlewareOptions: AnonymousAuthMiddlewareOptions = {
    //   host: clientConfig.authUrl,
    //   projectKey: clientConfig.projectKey,
    //   credentials: {
    //     clientId: clientConfig.clientId,
    //     clientSecret: clientConfig.clientSecret,
    //   },
    //   scopes: [
    //     'manage_project:' + clientConfig.projectKey,
    //     // 'view_project_settings:' + clientConfig.projectKey,
    //     // 'view_products:' + clientConfig.projectKey,
    //   ],
    //   fetch,
    //   tokenCache: tokenCache,
    // };

    // let clientBuilder: ClientBuilder = new ClientBuilder()
    //   // .withProjectKey(clientConfig.projectKey) // Not necessary if the projectKey was already passed in the authMiddlewareOptions
    //   // .withClientCredentialsFlow(authMiddlewareOptions)
    //   .withAnonymousSessionFlow(anonymousAuthMiddlewareOptions)
    //   .withHttpMiddleware(httpMiddlewareOptions);

    // To avoid logging sensible data, only enable the logger if the environment is defined and not production.
    if (environment !== undefined && environment !== 'prod' && environment !== 'production') {
      clientBuilder = clientBuilder.withLoggerMiddleware();
    }

    return clientBuilder.build();
  };
}
