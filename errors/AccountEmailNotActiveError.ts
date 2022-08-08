import { ErrorProps, ExtensionError } from '../utils/Errors';

export class AccountEmailNotActiveError extends ExtensionError {
  constructor(options: ErrorProps) {
    super(options);
    this.code = 'account_email_not_active_error';
  }
}
