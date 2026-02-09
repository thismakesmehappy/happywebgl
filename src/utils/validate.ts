import { AppError } from '../errors/AppError.js';
import { ErrorCode } from '../errors/ErrorCodes.js';

type ValidationContext = {
  code: ErrorCode;
  resource: string;
  method: string;
};

type Detail = string | ((value: unknown) => string);

type NumberValidationOptions = {
  label?: string;
  detail?: Detail;
};

type NumberRangeOptions = {
  label?: string;
  detail?: Detail;
  requireFinite?: boolean;
};

type SetOptions = {
  label?: string;
  detail?: Detail;
};

const fail = (context: ValidationContext, detail: string): never => {
  throw new AppError(context.code, {
    resource: context.resource,
    method: context.method,
    detail,
  });
};

const resolveDetail = (
  value: unknown,
  detail: Detail | undefined,
  fallback: string,
): string => {
  if (typeof detail === 'function') {
    return detail(value);
  }
  if (typeof detail === 'string') {
    return detail;
  }
  return fallback;
};

export const validate = {
  number: {
    finite(
      value: number,
      context: ValidationContext,
      labelOrOptions: string | NumberValidationOptions = 'value',
    ): void {
      const label = typeof labelOrOptions === 'string' ? labelOrOptions : labelOrOptions.label ?? 'value';
      const detail = typeof labelOrOptions === 'string' ? undefined : labelOrOptions.detail;
      if (!Number.isFinite(value)) {
        fail(
          context,
          resolveDetail(
            value,
            detail,
            `${label} must be a finite number, got ${value}`,
          ),
        );
      }
    },
    integer(
      value: number,
      context: ValidationContext,
      labelOrOptions: string | NumberValidationOptions = 'value',
    ): void {
      const label = typeof labelOrOptions === 'string' ? labelOrOptions : labelOrOptions.label ?? 'value';
      const detail = typeof labelOrOptions === 'string' ? undefined : labelOrOptions.detail;
      validate.number.finite(value, context, { label, detail });
      if (!Number.isInteger(value)) {
        fail(
          context,
          resolveDetail(
            value,
            detail,
            `${label} must be an integer, got ${value}. ` +
              'Use Math.floor(), Math.round(), or Math.trunc() to convert.',
          ),
        );
      }
    },
    nonNegativeInt(
      value: number,
      context: ValidationContext,
      labelOrOptions: string | NumberValidationOptions = 'value',
    ): void {
      const label = typeof labelOrOptions === 'string' ? labelOrOptions : labelOrOptions.label ?? 'value';
      const detail = typeof labelOrOptions === 'string' ? undefined : labelOrOptions.detail;
      validate.number.integer(value, context, { label, detail });
      if (value < 0) {
        fail(
          context,
          resolveDetail(
            value,
            detail,
            `${label} must be a non-negative integer, got ${value}`,
          ),
        );
      }
    },
    positiveInt(
      value: number,
      context: ValidationContext,
      labelOrOptions: string | NumberValidationOptions = 'value',
    ): void {
      const label = typeof labelOrOptions === 'string' ? labelOrOptions : labelOrOptions.label ?? 'value';
      const detail = typeof labelOrOptions === 'string' ? undefined : labelOrOptions.detail;
      validate.number.nonNegativeInt(value, context, { label, detail });
      if (value === 0) {
        fail(
          context,
          resolveDetail(
            value,
            detail,
            `${label} must be a positive integer, got ${value}`,
          ),
        );
      }
    },
    unsignedInt(
      value: number,
      context: ValidationContext,
      labelOrOptions: string | NumberValidationOptions = 'value',
    ): void {
      const label = typeof labelOrOptions === 'string' ? labelOrOptions : labelOrOptions.label ?? 'value';
      const detail = typeof labelOrOptions === 'string' ? undefined : labelOrOptions.detail;
      validate.number.integer(value, context, { label, detail });
      if (value < 0) {
        fail(
          context,
          resolveDetail(
            value,
            detail,
            `${label} must be non-negative for unsigned integer, got ${value}`,
          ),
        );
      }
    },
    positive(
      value: number,
      context: ValidationContext,
      options: NumberValidationOptions = {},
    ): void {
      const label = options.label ?? 'value';
      const detail = options.detail;
      if (!Number.isFinite(value) || value <= 0) {
        fail(
          context,
          resolveDetail(
            value,
            detail,
            `${label} must be a positive number, got ${value}`,
          ),
        );
      }
    },
    inRange(
      value: number,
      context: ValidationContext,
      min: number,
      max: number,
      options: NumberRangeOptions = {},
    ): void {
      const label = options.label ?? 'value';
      const detail = options.detail;
      const requireFinite = options.requireFinite !== false;
      if (requireFinite && !Number.isFinite(value)) {
        fail(
          context,
          resolveDetail(
            value,
            detail,
            `${label} must be a finite number, got ${value}`,
          ),
        );
      }
      if (value < min || value > max) {
        fail(
          context,
          resolveDetail(
            value,
            detail,
            `${label} must be between ${min} and ${max}, got ${value}`,
          ),
        );
      }
    },
  },
  set: {
    oneOf(
      value: unknown,
      allowed: readonly unknown[],
      context: ValidationContext,
      options: SetOptions = {},
    ): void {
      if (allowed.includes(value)) {
        return;
      }
      const label = options.label ?? 'value';
      fail(
        context,
        resolveDetail(
          value,
          options.detail,
          `${label} must be one of: ${allowed.join(', ')}, got ${value}`,
        ),
      );
    },
  },
};
