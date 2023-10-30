import { Context } from '@frontastic/extension-types';
import { BaseApi } from './BaseApi';
import { ProjectSettings } from '@Types/ProjectSettings';
import { getConfig } from '../utils/GetConfig';

export class ProjectApi extends BaseApi {
  getProjectSettings: (context: Context) => Promise<ProjectSettings> = async (context) => {
    return await this.getProject().then((response) => {
      const engine = 'COMMERCETOOLS';
      const { projectKey } = getConfig(context.projectConfiguration, engine, this.defaultLocale);

      return {
        projectKey,
        name: response.name,
        countries: response.countries,
        currencies: response.currencies,
        languages: response.languages,
      };
    });
  };
}
