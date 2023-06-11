import { Context } from '@frontastic/extension-types';
import { IntegrationApi } from '@Promotion-talon-one/apis/IntegrationApi';

export class PromotionApiFactory {
  static getTalonOneApi(args: ConstructorParameters<typeof IntegrationApi>) {
    return new IntegrationApi(...args);
  }

  static getDefaultApi(frontasticContext: Context, sessionId: string, locale?: string, currency?: string) {
    return this.getTalonOneApi([frontasticContext, sessionId, locale, currency]);
  }
}
