import { ErrorCode } from './ErrorCodes.js';

export const ERROR_MESSAGES: Record<ErrorCode, string> = {
  [ErrorCode.RES_DISPOSED]: '{resource} has been disposed',
  [ErrorCode.RES_INVALID_ARG]: '{resource}.{method}: {detail}',
};
