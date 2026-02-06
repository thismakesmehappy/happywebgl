import { ErrorCode } from './ErrorCodes.js';

export const ERROR_MESSAGES: Record<ErrorCode, string> = {
  [ErrorCode.CORE_INVALID_ARG]: '{resource}.{method}: {detail}',
  [ErrorCode.CORE_NOT_FOUND]: '{resource}.{method}: {detail}',
  [ErrorCode.CORE_WEBGL_FAILURE]: '{resource}.{method}: {detail}',
  [ErrorCode.CORE_STATE_ERROR]: '{resource}.{method}: {detail}',
  [ErrorCode.RES_DISPOSED]: '{resource} has been disposed',
  [ErrorCode.RES_INVALID_ARG]: '{resource}.{method}: {detail}',
  [ErrorCode.RES_GL_ERROR]: '{resource}.{method}: {detail}',
  [ErrorCode.MATH_INVALID_ARG]: '{resource}.{method}: {detail}',
  [ErrorCode.MATH_OUT_OF_BOUNDS]: '{resource}.{method}: {detail}',
  [ErrorCode.MATH_DIVIDE_BY_ZERO]: '{resource}.{method}: {detail}',
  [ErrorCode.MATH_NON_INVERTIBLE]: '{resource}.{method}: {detail}',
};
