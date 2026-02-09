import { describe, it, expect } from 'vitest';
import { Matrix2 } from '../../../src/math/matrices/Matrix2.js';
import { SquareMatrix } from '../../../src/math/matrices/SquareMatrix.js';
import { Vector2 } from '../../../src/math/vectors/Vector2.js';
import { createSquareMatrix } from '../../helpers/math/createSquareMatrix.js';
import { TestSquareMatrixUneven } from '../../helpers/math/TestSquareMatrixUneven.js';
import { EPSILON } from '../../helpers/const.js';

const I2 = new Matrix2(
  1, 0,
  0, 1
);

const Z2 = new Matrix2(
  0, 0,
  0, 0
);

const TestMatrix2 = createSquareMatrix(2);

describe('Matrix2', () => {
  describe('Inheritance', () => {
    it('should extend SquareMatrix', () => {
      const m = new Matrix2();
      expect(m instanceof SquareMatrix).toBe(true);
    });

    it('should have TransposeType property', () => {
      expect(Matrix2.TransposeType).toBe(Matrix2);
    });
  });

  describe('Constructor', () => {
    it('should create identity matrix by default', () => {
      const m = new Matrix2();
      expect(m.equals(I2)).toBe(true);
    });

    it('should create matrix from column-major input', () => {
      const m = new Matrix2(
        1, 2,
        3, 4
      );
      expect(m.get(0, 0)).toBe(1);
      expect(m.get(0, 1)).toBe(2);
      expect(m.get(1, 0)).toBe(3);
      expect(m.get(1, 1)).toBe(4);
    });

    it('should accept NaN values', () => {
      const m = new Matrix2(NaN, 1, 2, 3);
      expect(Number.isNaN(m.get(0, 0))).toBe(true);
      expect(m.get(0, 1)).toBe(1);
    });

    it('should accept Infinity values', () => {
      const m = new Matrix2(Infinity, 1, 2, 3);
      expect(m.get(0, 0)).toBe(Infinity);
      expect(m.get(0, 1)).toBe(1);
    });

    it('should accept -Infinity values', () => {
      const m = new Matrix2(-Infinity, 1, 2, 3);
      expect(m.get(0, 0)).toBe(-Infinity);
    });

    it('should throw error for wrong number of elements', () => {
      expect(() => {
        new Matrix2(1, 2, 3);
      }).toThrow('size mismatch');
    });
  });

  describe('Static Factory Methods', () => {
    describe('identity()', () => {
      it('should create identity matrix', () => {
        const m = Matrix2.identity();
        expect(m.equals(I2)).toBe(true);
      });
    });

    describe('zero()', () => {
      it('should create zero matrix', () => {
        const m = Matrix2.zero();
        expect(m.equals(Z2)).toBe(true);
      });
    });

    describe('fromElements()', () => {
      it('should create matrix from Float32Array', () => {
        const elements = new Float32Array(4);
        elements.fill(1);
        const expected = new Matrix2(
          1, 1,
          1, 1
        );
        const m = Matrix2.fromElements(elements);
        expect(m instanceof Matrix2).toBe(true);
        expect(m.equals(expected)).toBe(true);
      });
    });
  });

  describe('Element Access', () => {
    it('should access elements via get(column, row)', () => {
      const m = new Matrix2();
      expect(m.get(0, 0)).toBe(1);
      expect(m.get(1, 1)).toBe(1);
    });

    it('should set elements via set(column, row, value)', () => {
      const m = new Matrix2();
      m.set(0, 0, 5);
      expect(m.get(0, 0)).toBe(5);
    });

    it('should access elements via m[column][row]', () => {
      const m = new Matrix2();
      expect(m[0][0]).toBe(1);
      expect(m[1][0]).toBe(0);
      expect(m[1][1]).toBe(1);
    });

    it('should set elements via m[column][row] = value', () => {
      const m = new Matrix2();
      m[0][0] = 5;
      expect(m[0][0]).toBe(5);
      expect(m.get(0, 0)).toBe(5);
    });

    it('should access elements via elements array', () => {
      const m = new Matrix2();
      expect(m.elements[0]).toBe(1);
      expect(m.elements[3]).toBe(1);
    });

    it('should throw error for out-of-bounds indices', () => {
      const m = new Matrix2();
      expect(() => m.get(2, 0)).toThrow();
      expect(() => m.get(0, 2)).toThrow();
      expect(() => m.set(-1, 0, 1)).toThrow();
    });
  });

  describe('multiply()', () => {
    it('should multiply two Matrix2 matrices', () => {
      const m1 = new Matrix2(
        2, 3,
        1, 0
      );
      const m2 = new Matrix2(
        1, 2,
        2, 1
      );
      const expected = new Matrix2(
        4, 3,
        5, 6
      );
      const original = m1.clone();
      m1.multiply(m2);
      expect(m1.equals(expected)).toBe(true);
      expect(m1.equals(original)).toBe(false);
    });

    it('should multiply Matrix2 and SquareMatrix matrices', () => {
      const m1 = new Matrix2(
        2, 3,
        1, 0
      );
      const m2 = new TestMatrix2(
        1, 2,
        2, 1
      );
      const expected = new Matrix2(
        4, 3,
        5, 6
      );
      const original = m1.clone();
      m1.multiply(m2);
      expect(m1.equals(expected)).toBe(true);
      expect(m1.equals(original)).toBe(false);
    });

    it('should throw error when multiplying incompatible matrices', () => {
      const m1 = new Matrix2(
        2, 3,
        1, 0
      );
      const m2 = new TestSquareMatrixUneven(2, 3);
      expect(() => m1.multiply(m2)).toThrow('Matrix multiplication incompatible: 2x2 * 3x2');
    });

    it('should handle Infinity in operations', () => {
      const m1 = new Matrix2(Infinity, 1, 2, 3);
      const m2 = new Matrix2();
      m1.multiply(m2);
      expect(m1.get(0, 0)).toBe(Infinity);
    });
  });

  describe('multiplyMatrices()', () => {
    it('should multiply two Matrix2 matrices without mutation', () => {
      const m1 = new Matrix2(
        2, 3,
        1, 0
      );
      const m2 = new Matrix2(
        1, 2,
        2, 1
      );
      const expected = new Matrix2(
        4, 3,
        5, 6
      );
      const original = m1.clone();
      const result = Matrix2.multiply(m1, m2);
      expect(result.equals(expected)).toBe(true);
      expect(m1.equals(original)).toBe(true);
    });

    it('should throw error when result matrix size does not match', () => {
      const a = new Matrix2();
      const b = new Matrix2();
      const result = new TestSquareMatrixUneven(3, 3);
      expect(() => {
        result.multiplyMatrices(a, b);
      }).toThrow('Result matrix size mismatch');
    });

    it('should fallback to generic implementation for non-2x2 inputs', () => {
      const a = new Matrix2();
      const b = new TestSquareMatrixUneven(2, 3);
      const result = new Matrix2();
      expect(() => {
        result.multiplyMatrices(a, b);
      }).toThrow('incompatible');
    });

    it('should use optimized path when both inputs are 2x2', () => {
      const a = new Matrix2(1, 0, 0, 1);
      const b = new Matrix2(2, 0, 0, 2);
      const result = new Matrix2();
      result.multiplyMatrices(a, b);
      const expected = new Matrix2(2, 0, 0, 2);
      expect(result.equals(expected)).toBe(true);
    });

    it('should multiply by zero matrix', () => {
      const a = new Matrix2(1, 2, 3, 4);
      const zero = Matrix2.zero();
      const result = new Matrix2();
      result.multiplyMatrices(a, zero);
      expect(result.equals(zero)).toBe(true);
    });

    it('should multiply zero matrix by another matrix', () => {
      const zero = Matrix2.zero();
      const b = new Matrix2(1, 2, 3, 4);
      const result = new Matrix2();
      result.multiplyMatrices(zero, b);
      expect(result.equals(zero)).toBe(true);
    });

    it('should multiply by identity matrix', () => {
      const a = new Matrix2(1, 2, 3, 4);
      const identity = new Matrix2();
      const result = new Matrix2();
      result.multiplyMatrices(a, identity);
      expect(result.equals(a)).toBe(true);
    });
  });

  describe('determinant()', () => {
    it('should calculate determinant of identity matrix', () => {
      const m = new Matrix2();
      expect(m.determinant()).toBe(1);
    });

    it('should calculate determinant of diagonal matrix', () => {
      const m = new Matrix2(
        2, 0,
        0, 2
      );
      expect(m.determinant()).toBe(4);
    });

    it('should calculate determinant of general 2x2 matrix', () => {
      const m = new Matrix2(
        1, 2,
        3, 4
      );
      expect(m.determinant()).toBe(-2);
    });

    it('should return 0 for singular matrix', () => {
      const m = new Matrix2(
        1, 1,
        2, 2
      );
      expect(m.determinant()).toBe(0);
    });

    it('should return 0 for zero matrix', () => {
      const zero = new Matrix2().makeScale(0, 0);
      expect(zero.determinant()).toBe(0);
    });

    it('should handle negative determinant', () => {
      const m = new Matrix2(
        -1, 0,
        0, 1
      );
      expect(m.determinant()).toBe(-1);
    });

    it('should handle near-singular matrix', () => {
      const m = new Matrix2(
        1, 0,
        0, 1e-8
      );
      const det = m.determinant();
      expect(det).toBeCloseTo(1e-8, 10);
      expect(det).not.toBe(0);
    });

    it('should handle NaN in determinant', () => {
      const m = new Matrix2(NaN, 1, 2, 3);
      const det = m.determinant();
      expect(Number.isNaN(det)).toBe(true);
    });
  });

  describe('invert()', () => {
    it('should invert identity matrix', () => {
      const m = new Matrix2().makeIdentity();
      const original = m.clone();
      m.invert();
      expect(m.equals(original)).toBe(true);
    });

    it('should invert diagonal matrix', () => {
      const m = new Matrix2(
        2, 0,
        0, 2
      );
      const inverse = m.clone().invert();
      expect(inverse.get(0, 0)).toBeCloseTo(0.5);
      expect(inverse.get(1, 1)).toBeCloseTo(0.5);
    });

    it('should invert general 2x2 matrix', () => {
      const m = new Matrix2(
        1, 2,
        3, 4
      );
      const inverse = m.clone().invert();
      const expected = new Matrix2(
        -2, 1,
        1.5, -0.5
      );
      expect(inverse.equalsEpsilon(expected, EPSILON)).toBe(true);
    });

    it('should throw error for singular matrix', () => {
      const m = new Matrix2(
        1, 1,
        2, 2
      );
      expect(() => m.invert()).toThrow('not invertible');
    });

    it('should handle near-singular matrix', () => {
      const m = new Matrix2(
        1, 0,
        0, 0.01
      );
      expect(() => m.invert()).not.toThrow();
      const original = m.clone();
      const inverse = m.clone().invert();
      const product = new Matrix2().multiplyMatrices(original, inverse);
      const identity = new Matrix2();
      expect(product.equalsEpsilon(identity, EPSILON)).toBe(true);
    });

    it('should satisfy double inversion', () => {
      const m = new Matrix2(
        2, 1,
        1, 2
      );
      const original = m.clone();
      m.invert().invert();
      expect(m.equalsEpsilon(original, EPSILON)).toBe(true);
    });

    it('should satisfy m * m.inverse() = identity', () => {
      const m = new Matrix2(
        2, 0,
        0, 2
      );
      const inverse = m.clone().invert();
      const product = new Matrix2().multiplyMatrices(m, inverse);
      const identity = new Matrix2();
      expect(product.equalsEpsilon(identity, EPSILON)).toBe(true);
    });

    it('should return this for chaining', () => {
      const m = new Matrix2(
        2, 0,
        0, 2
      );
      const result = m.invert();
      expect(result).toBe(m);
    });
  });

  describe('static transpose()', () => {
    it('should transpose matrix and return new Matrix2', () => {
      const m = new Matrix2(
        1, 2,
        3, 4
      );
      const transposed = Matrix2.transpose(m);
      const expected = new Matrix2(
        1, 3,
        2, 4
      );
      expect(transposed instanceof Matrix2).toBe(true);
      expect(transposed.equals(expected)).toBe(true);
      expect(m.get(0, 1)).toBe(2);
      expect(m.get(1, 0)).toBe(3);
    });
  });

  describe('Static Methods', () => {
    describe('getInverse()', () => {
      it('should calculate inverse without mutating original', () => {
        const m = new Matrix2(
          2, 0,
          0, 2
        );
        const original = m.clone();
        const inverse = Matrix2.getInverse(m);
        expect(m.equals(original)).toBe(true);
        expect(inverse.get(0, 0)).toBeCloseTo(0.5);
      });

      it('should throw error for non-Matrix2 input', () => {
        const m = new TestSquareMatrixUneven(2, 2);
        expect(() => Matrix2.getInverse(m as any)).toThrow('Matrix2.getInverse requires Matrix2 instance');
      });

      it('should throw error for singular matrix', () => {
        const m = new Matrix2(
          1, 1,
          2, 2
        );
        expect(() => Matrix2.getInverse(m)).toThrow('not invertible');
      });

      it('should calculate inverse correctly', () => {
        const m = new Matrix2(
          1, 2,
          3, 4
        );
        const inverse = Matrix2.getInverse(m);
        const expected = new Matrix2(
          -2, 1,
          1.5, -0.5
        );
        expect(inverse.equalsEpsilon(expected, EPSILON)).toBe(true);
      });
    });

    describe('inverse()', () => {
      it('should be alias for getInverse()', () => {
        const m = new Matrix2(
          2, 0,
          0, 2
        );
        const inverse1 = Matrix2.getInverse(m);
        const inverse2 = Matrix2.inverse(m);
        expect(inverse1.equals(inverse2)).toBe(true);
      });
    });
  });

  describe('Transformation Methods', () => {
    describe('transformVector()', () => {
      it('should transform Vector2', () => {
        const m = new Matrix2().makeScale(2, 3);
        const v = new Vector2(1, 1);
        const result = m.transformVector(v);
        expect(result.x).toBe(2);
        expect(result.y).toBe(3);
      });

      it('should transform Vector2 with rotation', () => {
        const m = new Matrix2().makeRotation(Math.PI / 2);
        const v = new Vector2(1, 0);
        const result = m.transformVector(v);
        expect(result.x).toBeCloseTo(0);
        expect(result.y).toBeCloseTo(-1);
      });

      it('should return new Vector2 instance', () => {
        const m = new Matrix2();
        const v = new Vector2(1, 2);
        const result = m.transformVector(v);
        expect(result).toBeInstanceOf(Vector2);
        expect(result).not.toBe(v);
      });

      it('should handle zero vector', () => {
        const m = new Matrix2().makeRotation(Math.PI / 4);
        const v = new Vector2(0, 0);
        const result = m.transformVector(v);
        expect(result.x).toBe(0);
        expect(result.y).toBe(0);
      });

      it('should handle identity matrix', () => {
        const m = new Matrix2();
        const v = new Vector2(1, 2);
        const result = m.transformVector(v);
        expect(result.x).toBe(1);
        expect(result.y).toBe(2);
      });

      it('should handle NaN in transformVector', () => {
        const m = new Matrix2();
        const v = new Vector2(NaN, 1);
        const result = m.transformVector(v);
        expect(Number.isNaN(result.x)).toBe(true);
      });
    });
  });

  describe('Transformation Builders', () => {
    describe('makeRotation()', () => {
      it('should create rotation matrix', () => {
        const m = new Matrix2().makeRotation(Math.PI / 2);
        expect(m.get(0, 0)).toBeCloseTo(0);
        expect(m.get(0, 1)).toBeCloseTo(-1);
        expect(m.get(1, 0)).toBeCloseTo(1);
        expect(m.get(1, 1)).toBeCloseTo(0);
      });

      it('should handle zero rotation', () => {
        const m = new Matrix2().makeRotation(0);
        expect(m.equals(new Matrix2())).toBe(true);
      });

      it('should handle full rotation (2π)', () => {
        const m = new Matrix2().makeRotation(2 * Math.PI);
        expect(m.get(0, 0)).toBeCloseTo(1);
        expect(m.get(0, 1)).toBeCloseTo(0);
      });

      it('should return this for chaining', () => {
        const m = new Matrix2();
        const result = m.makeRotation(Math.PI / 4);
        expect(result).toBe(m);
      });
    });

    describe('makeScale()', () => {
      it('should create scale matrix', () => {
        const m = new Matrix2().makeScale(2, 3);
        expect(m.get(0, 0)).toBe(2);
        expect(m.get(1, 1)).toBe(3);
      });

      it('should handle uniform scale', () => {
        const m = new Matrix2().makeScale(2, 2);
        expect(m.get(0, 0)).toBe(2);
        expect(m.get(1, 1)).toBe(2);
      });

      it('should handle zero scale', () => {
        const m = new Matrix2().makeScale(0, 0);
        expect(m.get(0, 0)).toBe(0);
        expect(m.get(1, 1)).toBe(0);
      });

      it('should handle negative scale', () => {
        const m = new Matrix2().makeScale(-1, -2);
        expect(m.get(0, 0)).toBe(-1);
        expect(m.get(1, 1)).toBe(-2);
      });

      it('should return this for chaining', () => {
        const m = new Matrix2();
        const result = m.makeScale(2, 2);
        expect(result).toBe(m);
      });

    });

    describe('Method Chaining', () => {
      it('should chain makeRotation', () => {
        const m = new Matrix2();
        const result = m.makeRotation(Math.PI / 4);
        expect(result).toBe(m);
      });

      it('should chain makeScale', () => {
        const m = new Matrix2();
        const result = m.makeScale(2, 2);
        expect(result).toBe(m);
      });

      it('should chain multiple operations', () => {
        const m = new Matrix2()
          .makeRotation(Math.PI / 4)
          .multiply(new Matrix2().makeScale(2, 2));
        expect(m.get(0, 0)).toBeCloseTo(Math.sqrt(2), 0.001);
      });
    });
  });

  describe('Integration Tests', () => {
    it('should compose rotation and scale correctly', () => {
      const rotation = new Matrix2().makeRotation(Math.PI / 2);
      const scale = new Matrix2().makeScale(2, 2);
      const composed = new Matrix2().multiplyMatrices(rotation, scale);
      const v = new Vector2(1, 0);
      const result = composed.transformVector(v);
      expect(result.x).toBeCloseTo(0);
      expect(result.y).toBeCloseTo(-2);
    });
  });
});
