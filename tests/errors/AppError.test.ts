import { describe, it, expect } from 'vitest';
import { AppError } from '../../src/errors/AppError.js';
import { ErrorCode } from '../../src/errors/ErrorCodes.js';

describe('AppError', () => {
  it('formats message with code and context', () => {
    const err = new AppError(ErrorCode.RES_INVALID_ARG, {
      resource: 'VertexArray',
      method: 'setAttribute',
      detail: 'buffer is required',
    });

    expect(err.message).toBe(
      '[RES_002] VertexArray.setAttribute: buffer is required',
    );
    expect(err.code).toBe(ErrorCode.RES_INVALID_ARG);
    expect(err.context).toEqual({
      resource: 'VertexArray',
      method: 'setAttribute',
      detail: 'buffer is required',
    });
  });

  it('falls back to unknown error message for missing template', () => {
    const err = new AppError('MISSING' as ErrorCode);
    expect(err.message).toBe('[MISSING] Unknown error');
  });
});
