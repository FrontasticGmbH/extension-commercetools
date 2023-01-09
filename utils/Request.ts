import { Request } from '@frontastic/extension-types';
import { Token } from '@Types/Token';

export const getPath = (request: Request): string | null => {
  return getHeader(request, 'frontastic-path') ?? request.query.path;
};

export const getLocale = (request: Request): string | null => {
  if (request !== undefined) {
    const locale = getHeader(request, 'frontastic-locale') ?? request.query.locale;

    if (locale !== undefined) {
      return getHeader(request, 'frontastic-locale') ?? request.query.locale;
    }
  }

  return null;
};

export const getToken = (request: Request): Token | undefined => {
  if (request !== undefined) {
    const token: Token | undefined = request.sessionData?.token ?? undefined;

    return token;
  }

  return undefined;
};

const getHeader = (request: Request, header: string): string | null => {
  if (header in request.headers) {
    const foundHeader = request.headers[header];
    if (Array.isArray(foundHeader)) {
      return foundHeader[0];
    }
    return foundHeader;
  }

  return null;
};
