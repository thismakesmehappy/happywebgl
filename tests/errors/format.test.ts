import { describe, it, expect } from 'vitest';
import { formatMessage } from '../../src/errors/format.js';

describe('formatMessage', () => {
  it.each([
    ['replaces placeholders', 'Hello {name}!', { name: 'World' }, 'Hello World!'],
    ['leaves unknown placeholders', 'Value: {missing}', { name: 'World' }, 'Value: {missing}'],
    ['stringifies non-primitive values', 'Obj: {data}', { data: { a: 1 } }, 'Obj: {"a":1}'],
    ['handles null and undefined values', 'Null: {n}, Undef: {u}', { n: null, u: undefined }, 'Null: null, Undef: undefined'],
    ['handles boolean and number values', 'Bool: {b}, Num: {n}', { b: false, n: 42 }, 'Bool: false, Num: 42'],
  ])('%s', (_label, template, context, expected) => {
    const result = formatMessage(template, context as Record<string, unknown>);
    expect(result).toBe(expected);
  });

  it('falls back to String() when JSON stringify fails', () => {
    const circular: any = {};
    circular.self = circular;
    const result = formatMessage('Circ: {c}', { c: circular });
    expect(result).toBe('Circ: [object Object]');
  });
});
