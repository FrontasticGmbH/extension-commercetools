import { Project } from '@frontastic/extension-types';
import { ClientConfig } from '../interfaces/ClientConfig';

export const getConfig = (project: Project, engine: string, locale: string | null): ClientConfig => {
  if (!project.configuration[engine]) {
    throw `Configuration details are not available for ${engine}`;
  }

  return {
    authUrl: project.configuration?.[engine].authUrl,
    clientId: project.configuration?.[engine].clientId,
    clientSecret: project.configuration?.[engine].clientSecret,
    hostUrl: project.configuration?.[engine].hostUrl,
    projectKey: project.configuration?.[engine].projectKey,
  } as ClientConfig;
};
