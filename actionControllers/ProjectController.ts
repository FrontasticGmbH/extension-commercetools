import { ActionContext, Request, Response } from '@frontastic/extension-types';
import { getLocale, getToken } from '../utils/Request';
import { ProjectApi } from '../apis/ProjectApi';

type ActionHook = (request: Request, actionContext: ActionContext) => Promise<Response>;

export const getProjectSettings: ActionHook = async (request: Request, actionContext: ActionContext) => {
  const projectApi = new ProjectApi(actionContext.frontasticContext, getLocale(request), getToken(request));

  const project = await projectApi.getProjectSettings();

  const response: Response = {
    statusCode: 200,
    body: JSON.stringify(project),
    sessionData: {
      ...request.sessionData,
      token: projectApi.token,
    },
  };

  return response;
};
