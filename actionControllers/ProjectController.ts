import { ActionContext, Request, Response } from '@frontastic/extension-types';
import { getLocale } from '../utils/Request';
import { ProjectApi } from '../apis/ProjectApi';
import { getToken } from '../utils/Token';

type ActionHook = (request: Request, actionContext: ActionContext) => Promise<Response>;

function getProjectApi(request: Request, actionContext: ActionContext) {
  return new ProjectApi(actionContext.frontasticContext, getLocale(request), getToken(request));
}

export const getProjectSettings: ActionHook = async (request: Request, actionContext: ActionContext) => {
  const projectApi = getProjectApi(request, actionContext);

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
