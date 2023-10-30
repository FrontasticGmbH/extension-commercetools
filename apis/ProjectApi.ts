import { BaseApi } from './BaseApi';
import { ProjectSettings } from '@Types/ProjectSettings';

export class ProjectApi extends BaseApi {
  getProjectSettings: () => Promise<ProjectSettings> = async () => {
    const projectKey = this.projectKey;

    return await this.getProject().then((response) => {
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
