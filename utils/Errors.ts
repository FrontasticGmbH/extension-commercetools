export type ErrorData = {
  message: string;
  code?: string;
};

export type ErrorProps = {
  code?: string;
} & ({ message: string; errors?: never } | { message?: never; errors: ErrorData[] });

export class ExtensionError extends Error {
  code?: string;
  errors: ErrorData[];

  constructor({ message, code, errors }: ErrorProps) {
    const error: ErrorData = message ? { message, ...(code ? { code } : {}) } : errors?.[0];

    super(error.message);
    this.errors = message ? [error] : errors;

    if (error.code) this.code = error.code;
  }
}

export class ValidationError extends ExtensionError {
  constructor(options: ErrorProps) {
    super(options);
    this.code = 'validation_error';
  }
}
