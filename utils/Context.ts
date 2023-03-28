import { Context } from '@frontastic/extension-types';

/**
 * Use this object to override values locally that would normally
 * be fetched from the projectConfiguration.
 * Only works in development.
 */
const projectConfigurationOverrides = {};

export const getFromProjectConfig = (key: string, context: Context) => {
  if (context.environment === 'development' && projectConfigurationOverrides[key]) {
    return projectConfigurationOverrides[key];
  }

  return context.projectConfiguration[key];
};
