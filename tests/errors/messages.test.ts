import { describe, it, expect } from 'vitest';
import { ErrorCode } from '../../src/errors/ErrorCodes.js';
import { ERROR_MESSAGES } from '../../src/errors/messages.js';
import * as errors from '../../src/errors/index.js';

describe('errors module', () => {
  it('exports error codes and messages', () => {
    expect(ErrorCode.RES_DISPOSED).toBe('RES_001');
    expect(ErrorCode.RES_INVALID_ARG).toBe('RES_002');
    expect(ERROR_MESSAGES[ErrorCode.RES_DISPOSED]).toBe('{resource} has been disposed');
    expect(ERROR_MESSAGES[ErrorCode.RES_INVALID_ARG]).toBe('{resource}.{method}: {detail}');
  });

  it('re-exports from index', () => {
    expect(errors.ErrorCode).toBeDefined();
    expect(errors.ERROR_MESSAGES).toBeDefined();
    expect(errors.AppError).toBeDefined();
  });
});
