import { ErrorCode } from './ErrorCodes.js';
import { formatMessage } from './format.js';
import { ERROR_MESSAGES } from './messages.js';

export class AppError extends Error {
  readonly code: ErrorCode;
  readonly context?: Record<string, unknown>;

  constructor(code: ErrorCode, context?: Record<string, unknown>) {
    const template = ERROR_MESSAGES[code] ?? 'Unknown error';
    const message = formatMessage(template, context);
    super(`[${code}] ${message}`);
    this.code = code;
    this.context = context;
  }
}
