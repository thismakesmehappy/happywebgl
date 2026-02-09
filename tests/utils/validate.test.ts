import { describe, it, expect } from 'vitest';
import { validate } from '../../src/utils/validate.js';
import { AppError } from '../../src/errors/AppError.js';
import { ErrorCode } from '../../src/errors/ErrorCodes.js';

const baseContext = {
  code: ErrorCode.RES_INVALID_ARG,
  resource: 'Test',
  method: 'validate',
};

const captureError = (fn: () => void): AppError | null => {
  try {
    fn();
  } catch (err) {
    return err as AppError;
  }
  return null;
};

describe('validate', () => {
  describe('number', () => {
    const positiveCases = [
      { name: 'finite accepts 0', call: () => validate.number.finite(0, baseContext) },
      { name: 'finite accepts -1.25', call: () => validate.number.finite(-1.25, baseContext) },
      { name: 'integer accepts integers', call: () => validate.number.integer(3, baseContext) },
      { name: 'nonNegativeInt accepts zero', call: () => validate.number.nonNegativeInt(0, baseContext) },
      { name: 'nonNegativeInt accepts positive values', call: () => validate.number.nonNegativeInt(10, baseContext) },
      { name: 'positiveInt accepts positive values', call: () => validate.number.positiveInt(2, baseContext) },
      { name: 'unsignedInt accepts zero', call: () => validate.number.unsignedInt(0, baseContext) },
      { name: 'unsignedInt accepts positive values', call: () => validate.number.unsignedInt(10, baseContext) },
      { name: 'positive accepts positive values', call: () => validate.number.positive(0.5, baseContext) },
      { name: 'inRange enforces inclusive bounds', call: () => validate.number.inRange(1, baseContext, 0, 2) },
      { name: 'inRange accepts extreme value (min)', call: () => validate.number.inRange(0, baseContext, 0, 2) },
      { name: 'inRange accepts extreme value (max)', call: () => validate.number.inRange(2, baseContext, 0, 2) },
      {
        name: 'inRange can skip finite checks when configured',
        call: () => validate.number.inRange(NaN, baseContext, 0, 2, { requireFinite: false }),
      },
    ];

    it.each(positiveCases)('$name', ({ call }) => {
      expect(call).not.toThrow();
    });

    const negativeCases = [
      {
        name: 'finite rejects non-finite values',
        call: () => validate.number.finite(NaN, baseContext),
        expected: '[RES_002] Test.validate: value must be a finite number, got NaN',
      },
      {
        name: 'finite supports option labels',
        call: () => validate.number.finite(NaN, baseContext, { label: 'amount' }),
        expected: '[RES_002] Test.validate: amount must be a finite number, got NaN',
      },
      {
        name: 'finite supports detail overrides without label',
        call: () => validate.number.finite(NaN, baseContext, { detail: 'custom finite' }),
        expected: '[RES_002] Test.validate: custom finite',
      },
      {
        name: 'integer rejects non-integers with a label',
        call: () => validate.number.integer(1.5, baseContext, 'count'),
        expected:
          '[RES_002] Test.validate: count must be an integer, got 1.5. ' +
          'Use Math.floor(), Math.round(), or Math.trunc() to convert.',
      },
      {
        name: 'integer rejects non-finite values',
        call: () => validate.number.integer(Infinity, baseContext),
        expected: '[RES_002] Test.validate: value must be a finite number, got Infinity',
      },
      {
        name: 'nonNegativeInt rejects negative values',
        call: () => validate.number.nonNegativeInt(-1, baseContext),
        expected: '[RES_002] Test.validate: value must be a non-negative integer, got -1',
      },
      {
        name: 'nonNegativeInt supports option labels',
        call: () => validate.number.nonNegativeInt(-1, baseContext, { label: 'index' }),
        expected: '[RES_002] Test.validate: index must be a non-negative integer, got -1',
      },
      {
        name: 'nonNegativeInt supports detail overrides without label',
        call: () => validate.number.nonNegativeInt(-1, baseContext, { detail: 'custom non-negative' }),
        expected: '[RES_002] Test.validate: custom non-negative',
      },
      {
        name: 'nonNegativeInt rejects non-integers',
        call: () => validate.number.nonNegativeInt(1.2, baseContext),
        expected:
          '[RES_002] Test.validate: value must be an integer, got 1.2. ' +
          'Use Math.floor(), Math.round(), or Math.trunc() to convert.',
      },
      {
        name: 'positiveInt rejects zero',
        call: () => validate.number.positiveInt(0, baseContext),
        expected: '[RES_002] Test.validate: value must be a positive integer, got 0',
      },
      {
        name: 'positiveInt supports option labels',
        call: () => validate.number.positiveInt(0, baseContext, { label: 'count' }),
        expected: '[RES_002] Test.validate: count must be a positive integer, got 0',
      },
      {
        name: 'positiveInt supports detail overrides without label',
        call: () => validate.number.positiveInt(0, baseContext, { detail: 'custom positive int' }),
        expected: '[RES_002] Test.validate: custom positive int',
      },
      {
        name: 'positiveInt rejects negatives as non-negative',
        call: () => validate.number.positiveInt(-2, baseContext),
        expected: '[RES_002] Test.validate: value must be a non-negative integer, got -2',
      },
      {
        name: 'unsignedInt rejects negative values',
        call: () => validate.number.unsignedInt(-3, baseContext),
        expected: '[RES_002] Test.validate: value must be non-negative for unsigned integer, got -3',
      },
      {
        name: 'unsignedInt supports option labels',
        call: () => validate.number.unsignedInt(-3, baseContext, { label: 'slot' }),
        expected: '[RES_002] Test.validate: slot must be non-negative for unsigned integer, got -3',
      },
      {
        name: 'unsignedInt supports detail overrides without label',
        call: () => validate.number.unsignedInt(-3, baseContext, { detail: 'custom unsigned' }),
        expected: '[RES_002] Test.validate: custom unsigned',
      },
      {
        name: 'unsignedInt rejects non-integers',
        call: () => validate.number.unsignedInt(2.5, baseContext),
        expected:
          '[RES_002] Test.validate: value must be an integer, got 2.5. ' +
          'Use Math.floor(), Math.round(), or Math.trunc() to convert.',
      },
      {
        name: 'positive rejects non-positive values',
        call: () => validate.number.positive(0, baseContext),
        expected: '[RES_002] Test.validate: value must be a positive number, got 0',
      },
      {
        name: 'positive rejects non-finite values',
        call: () => validate.number.positive(NaN, baseContext),
        expected: '[RES_002] Test.validate: value must be a positive number, got NaN',
      },
      {
        name: 'inRange rejects values above max',
        call: () => validate.number.inRange(3, baseContext, 0, 2),
        expected: '[RES_002] Test.validate: value must be between 0 and 2, got 3',
      },
      {
        name: 'inRange rejects values below min and supports labels',
        call: () => validate.number.inRange(-1, baseContext, 0, 2, { label: 'index' }),
        expected: '[RES_002] Test.validate: index must be between 0 and 2, got -1',
      },
      {
        name: 'inRange rejects non-finite values by default',
        call: () => validate.number.inRange(NaN, baseContext, 0, 2),
        expected: '[RES_002] Test.validate: value must be a finite number, got NaN',
      },
      {
        name: 'supports detail overrides',
        call: () => validate.number.integer(2.2, baseContext, { detail: 'custom detail' }),
        expected: '[RES_002] Test.validate: custom detail',
      },
      {
        name: 'supports detail functions',
        call: () => validate.number.inRange(5, baseContext, 0, 2, {
          detail: value => `bad value ${value}`,
        }),
        expected: '[RES_002] Test.validate: bad value 5',
      },
    ];

    it.each(negativeCases)('$name', ({ call, expected }) => {
      const err = captureError(call);
      expect(err).toBeInstanceOf(AppError);
      expect(err?.message).toBe(expected);
    });
  });

  describe('set', () => {
    const positiveCases = [
      { name: 'oneOf accepts allowed values', call: () => validate.set.oneOf('a', ['a', 'b'], baseContext) },
    ];

    it.each(positiveCases)('$name', ({ call }) => {
      expect(call).not.toThrow();
    });

    const negativeCases = [
      {
        name: 'oneOf rejects disallowed values with label',
        call: () => validate.set.oneOf('c', ['a', 'b'], baseContext, { label: 'mode' }),
        expected: '[RES_002] Test.validate: mode must be one of: a, b, got c',
      },
      {
        name: 'oneOf rejects disallowed values with default label',
        call: () => validate.set.oneOf('c', ['a', 'b'], baseContext),
        expected: '[RES_002] Test.validate: value must be one of: a, b, got c',
      },
      {
        name: 'oneOf supports detail functions',
        call: () => validate.set.oneOf(3, [1, 2], baseContext, {
          detail: value => `unsupported ${value}`,
        }),
        expected: '[RES_002] Test.validate: unsupported 3',
      },
    ];

    it.each(negativeCases)('$name', ({ call, expected }) => {
      const err = captureError(call);
      expect(err).toBeInstanceOf(AppError);
      expect(err?.message).toBe(expected);
    });
  });
});
