import { describe, it, expect } from 'vitest';
import { Matrix4 } from '../../../src/math/matrices/Matrix4.js';
import { SquareMatrix } from '../../../src/math/matrices/SquareMatrix.js';
import { Vector3 } from '../../../src/math/vectors/Vector3.js';
import { Vector4 } from '../../../src/math/vectors/Vector4.js';
import { createSquareMatrix } from '../../helpers/math/createSquareMatrix.js';
import { TestSquareMatrixUneven } from '../../helpers/math/TestSquareMatrixUneven.js';
import { EPSILON } from '../../helpers/const.js';

const I4 = new Matrix4(
  1, 0, 0, 0,
  0, 1, 0, 0,
  0, 0, 1, 0,
  0, 0, 0, 1
);

const Z4 = new Matrix4(
  0, 0, 0, 0,
  0, 0, 0, 0,
  0, 0, 0, 0,
  0, 0, 0, 0
);

const TestMatrix4 = createSquareMatrix(4);

describe('Matrix4', () => {
  describe('Inheritance', () => {
    it('should extend SquareMatrix', () => {
      const m = new Matrix4();
      expect(m instanceof SquareMatrix).toBe(true);
    });

    it('should have TransposeType property', () => {
      expect(Matrix4.TransposeType).toBe(Matrix4);
    });
  });

  describe('Constructor', () => {
    it('should create identity matrix by default', () => {
      const m = new Matrix4();
      expect(m.equals(I4)).toBe(true);
    });

    it('should create matrix from column-major input', () => {
      const m = new Matrix4(
        1, 2, 3, 4,
        5, 6, 7, 8,
        9, 10, 11, 12,
        13, 14, 15, 16
      );
      expect(m.get(0, 0)).toBe(1);
      expect(m.get(0, 1)).toBe(2);
      expect(m.get(1, 0)).toBe(5);
      expect(m.get(1, 1)).toBe(6);
    });

    it('should accept NaN values', () => {
      const m = new Matrix4(NaN, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15);
      expect(Number.isNaN(m.get(0, 0))).toBe(true);
      expect(m.get(0, 1)).toBe(1);
    });

    it('should accept Infinity values', () => {
      const m = new Matrix4(Infinity, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15);
      expect(m.get(0, 0)).toBe(Infinity);
      expect(m.get(0, 1)).toBe(1);
    });

    it('should accept -Infinity values', () => {
      const m = new Matrix4(-Infinity, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15);
      expect(m.get(0, 0)).toBe(-Infinity);
    });

    it('should throw error for wrong number of elements', () => {
      expect(() => {
        new Matrix4(1, 2, 3);
      }).toThrow('size mismatch');
    });
  });

  describe('Static Factory Methods', () => {
    describe('identity()', () => {
      it('should create identity matrix', () => {
        const m = Matrix4.identity();
        expect(m.equals(I4)).toBe(true);
      });
    });

    describe('zero()', () => {
      it('should create zero matrix', () => {
        const m = Matrix4.zero();
        expect(m.equals(Z4)).toBe(true);
      });
    });

    describe('fromElements()', () => {
      it('should create matrix from Float32Array', () => {
        const elements = new Float32Array(16);
        elements.fill(1);
        const expected = new Matrix4(
          1, 1, 1, 1,
          1, 1, 1, 1,
          1, 1, 1, 1,
          1, 1, 1, 1
        );
        const m = Matrix4.fromElements(elements);
        expect(m instanceof Matrix4).toBe(true);
        expect(m.equals(expected)).toBe(true);
      });
    });
  });

  describe('Element Access', () => {
    it('should access elements via get(column, row)', () => {
      const m = new Matrix4();
      expect(m.get(0, 0)).toBe(1);
      expect(m.get(3, 3)).toBe(1);
    });

    it('should set elements via set(column, row, value)', () => {
      const m = new Matrix4();
      m.set(0, 0, 5);
      expect(m.get(0, 0)).toBe(5);
    });

    it('should access elements via m[column][row]', () => {
      const m = new Matrix4();
      expect(m[0][0]).toBe(1);
      expect(m[1][0]).toBe(0);
      expect(m[3][3]).toBe(1);
    });

    it('should set elements via m[column][row] = value', () => {
      const m = new Matrix4();
      m[0][0] = 5;
      expect(m[0][0]).toBe(5);
      expect(m.get(0, 0)).toBe(5);
    });

    it('should access elements via elements array', () => {
      const m = new Matrix4();
      expect(m.elements[0]).toBe(1);
      expect(m.elements[5]).toBe(1);
      expect(m.elements[10]).toBe(1);
      expect(m.elements[15]).toBe(1);
    });

    it('should throw error for out-of-bounds indices', () => {
      const m = new Matrix4();
      expect(() => m.get(4, 0)).toThrow();
      expect(() => m.get(0, 4)).toThrow();
      expect(() => m.set(-1, 0, 1)).toThrow();
    });
  });

  describe('multiply()', () => {
    it('should multiply two Matrix4 matrices', () => {
      const m1 = new Matrix4(
        2, 3, 1, 4,
        1, 0, 2, 1,
        3, 1, 1, 2,
        1, 2, 3, 1
      );
      const m2 = new Matrix4(
        1, 2, 1, 0,
        2, 1, 0, 1,
        0, 1, 2, 1,
        1, 0, 1, 2
      );
      const expected = new Matrix4(
        7, 4, 6, 8,
        6, 8, 7, 10,
        8, 4, 7, 6,
        7, 8, 8, 8
      );
      const original = m1.clone();
      m1.multiply(m2);
      expect(m1.equals(expected)).toBe(true);
      expect(m1.equals(original)).toBe(false);
    });

    it('should multiply Matrix4 and SquareMatrix matrices', () => {
      const m1 = new Matrix4(
        2, 3, 1, 4,
        1, 0, 2, 1,
        3, 1, 1, 2,
        1, 2, 3, 1
      );
      const m2 = new TestMatrix4(
        1, 2, 1, 0,
        2, 1, 0, 1,
        0, 1, 2, 1,
        1, 0, 1, 2
      );
      const expected = new Matrix4(
        7, 4, 6, 8,
        6, 8, 7, 10,
        8, 4, 7, 6,
        7, 8, 8, 8
      );
      const original = m1.clone();
      m1.multiply(m2);
      expect(m1.equals(expected)).toBe(true);
      expect(m1.equals(original)).toBe(false);
    });

    it('should throw error when multiplying incompatible matrices', () => {
      const m1 = new Matrix4(
        2, 3, 1, 4,
        1, 0, 2, 1,
        3, 1, 1, 2,
        1, 2, 3, 1
      );
      const m2 = new TestSquareMatrixUneven(2, 3);
      expect(() => m1.multiply(m2)).toThrow('Matrix multiplication incompatible: 4x4 * 3x2');
    });

    it('should handle Infinity in operations', () => {
      const m1 = new Matrix4(Infinity, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15);
      const m2 = new Matrix4();
      m1.multiply(m2);
      expect(m1.get(0, 0)).toBe(Infinity);
    });
  });

  describe('multiplyMatrices()', () => {
    it('should multiply two Matrix4 matrices without mutation', () => {
      const m1 = new Matrix4(
        2, 3, 1, 4,
        1, 0, 2, 1,
        3, 1, 1, 2,
        1, 2, 3, 1
      );
      const m2 = new Matrix4(
        1, 2, 1, 0,
        2, 1, 0, 1,
        0, 1, 2, 1,
        1, 0, 1, 2
      );
      const expected = new Matrix4(
        7, 4, 6, 8,
        6, 8, 7, 10,
        8, 4, 7, 6,
        7, 8, 8, 8
      );
      const original = m1.clone();
      const result = Matrix4.multiply(m1, m2);
      expect(result.equals(expected)).toBe(true);
      expect(m1.equals(original)).toBe(true);
    });

    it('should multiply Matrix4 and SquareMatrix matrices', () => {
      const m1 = new Matrix4(
        2, 3, 1, 4,
        1, 0, 2, 1,
        3, 1, 1, 2,
        1, 2, 3, 1
      );
      const m2 = new TestMatrix4(
        1, 2, 1, 0,
        2, 1, 0, 1,
        0, 1, 2, 1,
        1, 0, 1, 2
      );
      const expected = new Matrix4(
        7, 4, 6, 8,
        6, 8, 7, 10,
        8, 4, 7, 6,
        7, 8, 8, 8
      );
      const original = m1.clone();
      m1.multiply(m2);
      expect(m1.equals(expected)).toBe(true);
      expect(m1.equals(original)).toBe(false);
    });

    it('should throw error when multiplying incompatible matrices', () => {
      const m1 = new Matrix4(
        2, 3, 1, 4,
        1, 0, 2, 1,
        3, 1, 1, 2,
        1, 2, 3, 1
      );
      const m2 = new TestSquareMatrixUneven(2, 3);
      expect(() => m1.multiply(m2)).toThrow('Matrix multiplication incompatible: 4x4 * 3x2');
    });

    it('should throw error when result matrix size does not match', () => {
      const a = new Matrix4();
      const b = new Matrix4();
      const result = new TestSquareMatrixUneven(3, 3);
      expect(() => {
        result.multiplyMatrices(a, b);
      }).toThrow('Result matrix size mismatch');
    });

    it('should fallback to generic implementation for non-4x4 inputs', () => {
      const a = new Matrix4();
      const b = new TestSquareMatrixUneven(4, 3);
      const result = new Matrix4();
      expect(() => {
        result.multiplyMatrices(a, b);
      }).toThrow('incompatible');
    });

    it('should use optimized path when both inputs are 4x4', () => {
      const a = new Matrix4(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 1, 2, 3, 1);
      const b = new Matrix4(2, 0, 0, 0, 0, 2, 0, 0, 0, 0, 2, 0, 0, 0, 0, 1);
      const result = new Matrix4();
      result.multiplyMatrices(a, b);
      const expected = new Matrix4(2, 0, 0, 0, 0, 2, 0, 0, 0, 0, 2, 0, 1, 2, 3, 1);
      expect(result.equals(expected)).toBe(true);
    });

    it('should multiply by zero matrix', () => {
      const a = new Matrix4(1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16);
      const zero = Matrix4.zero();
      const result = new Matrix4();
      result.multiplyMatrices(a, zero);
      expect(result.equals(zero)).toBe(true);
    });

    it('should multiply zero matrix by another matrix', () => {
      const zero = Matrix4.zero();
      const b = new Matrix4(1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16);
      const result = new Matrix4();
      result.multiplyMatrices(zero, b);
      expect(result.equals(zero)).toBe(true);
    });

    it('should multiply by identity matrix', () => {
      const a = new Matrix4(1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16);
      const identity = new Matrix4();
      const result = new Matrix4();
      result.multiplyMatrices(a, identity);
      expect(result.equals(a)).toBe(true);
    });
  });

  describe('determinant()', () => {
    it('should calculate determinant of identity matrix', () => {
      const m = new Matrix4();
      expect(m.determinant()).toBe(1);
    });

    it('should calculate determinant of diagonal matrix', () => {
      const m = new Matrix4(
        2, 0, 0, 0,
        0, 2, 0, 0,
        0, 0, 2, 0,
        0, 0, 0, 2
      );
      expect(m.determinant()).toBe(16);
    });

    it('should calculate determinant of general 4x4 matrix', () => {
      const m = new Matrix4(
        5, 2, 3, 4,
        8, 7, 3, 5,
        11, 1, 12, 9,
        13, 16, 15, 13
      );
      expect(m.determinant()).toBe(720);
    });

    it('should return 0 for singular matrix', () => {
      const m = new Matrix4(
        1, 1, 1, 1,
        2, 2, 2, 2,
        3, 3, 3, 3,
        4, 4, 4, 4
      );
      expect(m.determinant()).toBe(0);
    });

    it('should return 0 for zero matrix', () => {
      const zero = new Matrix4().makeScale(0, 0, 0);
      expect(zero.determinant()).toBe(0);
    });

    it('should handle negative determinant', () => {
      const m = new Matrix4(
        -1, 0, 0, 0,
        0, 1, 0, 0,
        0, 0, 1, 0,
        0, 0, 0, 1
      );
      expect(m.determinant()).toBe(-1);
    });

    it('should handle near-singular matrix', () => {
      const m = new Matrix4(
        1, 0, 0, 0,
        0, 1, 0, 0,
        0, 0, 1, 0,
        0, 0, 0, 1e-8
      );
      const det = m.determinant();
      expect(det).toBeCloseTo(1e-8, 10);
      expect(det).not.toBe(0);
    });

    it('should handle NaN in determinant', () => {
      const m = new Matrix4(NaN, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15);
      const det = m.determinant();
      expect(Number.isNaN(det)).toBe(true);
    });
  });

  describe('invert()', () => {
    it('should invert identity matrix', () => {
      const m = new Matrix4().makeIdentity();
      const original = m.clone();
      m.invert();
      expect(m.equals(original)).toBe(true);
    });

    it('should invert diagonal matrix', () => {
      const m = new Matrix4(
        2, 0, 0, 0,
        0, 2, 0, 0,
        0, 0, 2, 0,
        0, 0, 0, 2
      );
      const inverse = m.clone().invert();
      expect(inverse.get(0, 0)).toBeCloseTo(0.5);
      expect(inverse.get(1, 1)).toBeCloseTo(0.5);
      expect(inverse.get(2, 2)).toBeCloseTo(0.5);
      expect(inverse.get(3, 3)).toBeCloseTo(0.5);
    });

    it('should invert translation matrix', () => {
      const m = new Matrix4(
        1, 0, 0, 0,
        0, 1, 0, 0,
        0, 0, 1, 0,
        3, 5, 7, 1
      );
      const inverse = m.clone().invert();
      const expected = new Matrix4(
        1, 0, 0, 0,
        0, 1, 0, 0,
        0, 0, 1, 0,
        -3, -5, -7, 1
      );
      expect(inverse.equals(expected)).toBe(true);
    });

    it('should throw error for singular matrix', () => {
      const m = new Matrix4(
        1, 1, 1, 1,
        2, 2, 2, 2,
        3, 3, 3, 3,
        4, 4, 4, 4
      );
      expect(() => m.invert()).toThrow('not invertible');
    });

    it('should handle near-singular matrix', () => {
      const m = new Matrix4(
        1, 0, 0, 0,
        0, 1, 0, 0,
        0, 0, 1, 0,
        0, 0, 0, 0.01
      );
      expect(() => m.invert()).not.toThrow();
      const original = m.clone();
      const inverse = m.clone().invert();
      const product = new Matrix4().multiplyMatrices(original, inverse);
      const identity = new Matrix4();
      expect(product.equalsEpsilon(identity, EPSILON)).toBe(true);
    });

    it('should satisfy double inversion', () => {
      const m = new Matrix4(
        2, 1, 0, 0,
        1, 2, 1, 0,
        0, 1, 2, 1,
        0, 0, 1, 2
      );
      const original = m.clone();
      m.invert().invert();
      expect(m.equalsEpsilon(original, EPSILON)).toBe(true);
    });

    it('should satisfy m * m.inverse() = identity', () => {
      const m = new Matrix4(
        2, 0, 0, 0,
        0, 2, 0, 0,
        0, 0, 2, 0,
        1, 0, 0, 1
      );
      const inverse = m.clone().invert();
      const product = new Matrix4().multiplyMatrices(m, inverse);
      const identity = new Matrix4();
      expect(product.equalsEpsilon(identity, EPSILON)).toBe(true);
    });

    it('should return this for chaining', () => {
      const m = new Matrix4(
        2, 0, 0, 0,
        0, 2, 0, 0,
        0, 0, 2, 0,
        0, 0, 0, 2
      );
      const result = m.invert();
      expect(result).toBe(m);
    });
  });

  describe('static transpose()', () => {
    it('should transpose matrix and return new Matrix4', () => {
      const m = new Matrix4(
        1, 2, 3, 4,
        5, 6, 7, 8,
        9, 10, 11, 12,
        13, 14, 15, 16
      );
      const transposed = Matrix4.transpose(m);
      const expected = new Matrix4(
        1, 5, 9, 13,
        2, 6, 10, 14,
        3, 7, 11, 15,
        4, 8, 12, 16
      );
      expect(transposed instanceof Matrix4).toBe(true);
      expect(transposed.equals(expected)).toBe(true);
      expect(m.get(0, 1)).toBe(2);
      expect(m.get(1, 0)).toBe(5);
    });
  });

  describe('Static Methods', () => {
    describe('getInverse()', () => {
      it('should calculate inverse without mutating original', () => {
        const m = new Matrix4(
          2, 0, 0, 0,
          0, 2, 0, 0,
          0, 0, 2, 0,
          0, 0, 0, 2
        );
        const original = m.clone();
        const inverse = Matrix4.getInverse(m);
        expect(m.equals(original)).toBe(true);
        expect(inverse.get(0, 0)).toBeCloseTo(0.5);
      });

      it('should throw error for non-Matrix4 input', () => {
        const m = new TestSquareMatrixUneven(4, 4);
        expect(() => Matrix4.getInverse(m as any)).toThrow('Matrix4.getInverse requires Matrix4 instance');
      });

      it('should throw error for singular matrix', () => {
        const m = new Matrix4(
          1, 1, 1, 1,
          2, 2, 2, 2,
          3, 3, 3, 3,
          4, 4, 4, 4
        );
        expect(() => Matrix4.getInverse(m)).toThrow('not invertible');
      });

      it('should calculate inverse correctly', () => {
        const m = new Matrix4(
          1, 0, 0, 0,
          0, 1, 0, 0,
          0, 0, 1, 0,
          3, 5, 7, 1
        );
        const inverse = Matrix4.getInverse(m);
        const expected = new Matrix4(
          1, 0, 0, 0,
          0, 1, 0, 0,
          0, 0, 1, 0,
          -3, -5, -7, 1
        );
        expect(inverse.equals(expected)).toBe(true);
      });
    });

    describe('inverse()', () => {
      it('should be alias for getInverse()', () => {
        const m = new Matrix4(
          2, 0, 0, 0,
          0, 2, 0, 0,
          0, 0, 2, 0,
          0, 0, 0, 2
        );
        const inverse1 = Matrix4.getInverse(m);
        const inverse2 = Matrix4.inverse(m);
        expect(inverse1.equals(inverse2)).toBe(true);
      });
    });
  });

  describe('Transformation Methods', () => {
    describe('transformDirection()', () => {
      it('should transform direction vector (ignores translation)', () => {
        const m = new Matrix4().makeTranslation(10, 20, 30);
        const v = new Vector3(1, 0, 0);
        const result = m.transformDirection(v);
        expect(result.x).toBe(1);
        expect(result.y).toBe(0);
        expect(result.z).toBe(0);
      });

      it('should transform direction with rotation', () => {
        const m = new Matrix4().makeRotationZ(Math.PI / 2);
        const v = new Vector3(1, 0, 0);
        const result = m.transformDirection(v);
        expect(result.x).toBeCloseTo(0);
        expect(result.y).toBeCloseTo(-1);
        expect(result.z).toBeCloseTo(0);
      });

      it('should transform direction with scale', () => {
        const m = new Matrix4().makeScale(2, 3, 4);
        const v = new Vector3(1, 1, 1);
        const result = m.transformDirection(v);
        expect(result.x).toBe(2);
        expect(result.y).toBe(3);
        expect(result.z).toBe(4);
      });

      it('should return new Vector3 instance', () => {
        const m = new Matrix4();
        const v = new Vector3(1, 2, 3);
        const result = m.transformDirection(v);
        expect(result).toBeInstanceOf(Vector3);
        expect(result).not.toBe(v);
      });

      it('should handle zero vector', () => {
        const m = new Matrix4().makeRotationX(Math.PI / 4);
        const v = new Vector3(0, 0, 0);
        const result = m.transformDirection(v);
        expect(result.x).toBe(0);
        expect(result.y).toBe(0);
        expect(result.z).toBe(0);
      });

      it('should handle identity matrix', () => {
        const m = new Matrix4();
        const v = new Vector3(1, 2, 3);
        const result = m.transformDirection(v);
        expect(result.x).toBe(1);
        expect(result.y).toBe(2);
        expect(result.z).toBe(3);
      });

      it('should handle NaN in transformDirection', () => {
        const m = new Matrix4();
        const v = new Vector3(NaN, 1, 2);
        const result = m.transformDirection(v);
        expect(Number.isNaN(result.x)).toBe(true);
      });
    });

    describe('transformPoint()', () => {
      it('should transform point with translation', () => {
        const m = new Matrix4().makeTranslation(1, 2, 3);
        const v = new Vector3(0, 0, 0);
        const result = m.transformPoint(v);
        expect(result.x).toBe(1);
        expect(result.y).toBe(2);
        expect(result.z).toBe(3);
      });

      it('should transform point with rotation and translation', () => {
        const rotation = new Matrix4().makeRotationZ(Math.PI / 2);
        const translation = new Matrix4().makeTranslation(1, 0, 0);
        const m = new Matrix4().multiplyMatrices(translation, rotation);
        const v = new Vector3(1, 0, 0);
        const result = m.transformPoint(v);
        expect(result.x).toBeCloseTo(1);
        expect(result.y).toBeCloseTo(-1);
        expect(result.z).toBeCloseTo(0);
      });

      it('should handle perspective division (w component)', () => {
        const m = new Matrix4(
          1, 0, 0, 0,
          0, 1, 0, 0,
          0, 0, 1, 0,
          0, 0, 0, 2
        );
        const v = new Vector3(2, 4, 6);
        const result = m.transformPoint(v);
        expect(result.x).toBeCloseTo(1);
        expect(result.y).toBeCloseTo(2);
        expect(result.z).toBeCloseTo(3);
      });

      it('should return new Vector3 instance', () => {
        const m = new Matrix4();
        const v = new Vector3(1, 2, 3);
        const result = m.transformPoint(v);
        expect(result).toBeInstanceOf(Vector3);
        expect(result).not.toBe(v);
      });

      it('should handle zero point', () => {
        const m = new Matrix4().makeTranslation(1, 2, 3);
        const v = new Vector3(0, 0, 0);
        const result = m.transformPoint(v);
        expect(result.x).toBe(1);
        expect(result.y).toBe(2);
        expect(result.z).toBe(3);
      });

      it('should handle Infinity in transformPoint', () => {
        const m = new Matrix4().makeTranslation(1, 2, 3);
        const v = new Vector3(Infinity, 1, 2);
        const result = m.transformPoint(v);
        expect(Number.isNaN(result.x) || !isFinite(result.x)).toBe(true);
      });
    });

    describe('transformVector()', () => {
      it('should transform Vector4', () => {
        const m = new Matrix4().makeTranslation(1, 2, 3);
        const v = new Vector4(1, 1, 1, 1);
        const result = m.transformVector(v);
        expect(result.x).toBe(2);
        expect(result.y).toBe(3);
        expect(result.z).toBe(4);
        expect(result.w).toBe(1);
      });

      it('should transform Vector4 with rotation', () => {
        const m = new Matrix4().makeRotationZ(Math.PI / 2);
        const v = new Vector4(1, 0, 0, 1);
        const result = m.transformVector(v);
        expect(result.x).toBeCloseTo(0);
        expect(result.y).toBeCloseTo(-1);
        expect(result.z).toBeCloseTo(0);
        expect(result.w).toBeCloseTo(1);
      });

      it('should handle w component correctly', () => {
        const m = new Matrix4(
          1, 0, 0, 0,
          0, 1, 0, 0,
          0, 0, 1, 0,
          0, 0, 0, 2
        );
        const v = new Vector4(1, 1, 1, 1);
        const result = m.transformVector(v);
        expect(result.w).toBe(2);
      });

      it('should return new Vector4 instance', () => {
        const m = new Matrix4();
        const v = new Vector4(1, 2, 3, 1);
        const result = m.transformVector(v);
        expect(result).toBeInstanceOf(Vector4);
        expect(result).not.toBe(v);
      });

      it('should handle zero vector', () => {
        const m = new Matrix4().makeTranslation(1, 2, 3);
        const v = new Vector4(0, 0, 0, 0);
        const result = m.transformVector(v);
        expect(result.x).toBe(0);
        expect(result.y).toBe(0);
        expect(result.z).toBe(0);
        expect(result.w).toBe(0);
      });
    });
  });

  describe('Transformation Builders', () => {
    describe('makeTranslation()', () => {
      it('should create translation matrix', () => {
        const m = new Matrix4().makeTranslation(1, 2, 3);
        expect(m.get(3, 0)).toBe(1);
        expect(m.get(3, 1)).toBe(2);
        expect(m.get(3, 2)).toBe(3);
        expect(m.get(3, 3)).toBe(1);
      });

      it('should set identity in upper-left 3x3', () => {
        const m = new Matrix4().makeTranslation(1, 2, 3);
        expect(m.get(0, 0)).toBe(1);
        expect(m.get(1, 1)).toBe(1);
        expect(m.get(2, 2)).toBe(1);
        expect(m.get(0, 1)).toBe(0);
      });

      it('should handle zero translation', () => {
        const m = new Matrix4().makeTranslation(0, 0, 0);
        expect(m.equals(new Matrix4())).toBe(true);
      });

      it('should handle negative translation', () => {
        const m = new Matrix4().makeTranslation(-1, -2, -3);
        expect(m.get(3, 0)).toBe(-1);
        expect(m.get(3, 1)).toBe(-2);
        expect(m.get(3, 2)).toBe(-3);
      });

      it('should return this for chaining', () => {
        const m = new Matrix4();
        const result = m.makeTranslation(1, 2, 3);
        expect(result).toBe(m);
      });
    });

    describe('makeRotationX()', () => {
      it('should create rotation matrix around X axis', () => {
        const m = new Matrix4().makeRotationX(Math.PI / 2);
        expect(m.get(0, 0)).toBe(1);
        expect(m.get(1, 1)).toBeCloseTo(0);
        expect(m.get(1, 2)).toBeCloseTo(-1);
        expect(m.get(2, 1)).toBeCloseTo(1);
        expect(m.get(2, 2)).toBeCloseTo(0);
      });

      it('should handle zero rotation', () => {
        const m = new Matrix4().makeRotationX(0);
        expect(m.equals(new Matrix4())).toBe(true);
      });

      it('should handle full rotation (2π)', () => {
        const m = new Matrix4().makeRotationX(2 * Math.PI);
        expect(m.get(1, 1)).toBeCloseTo(1);
        expect(m.get(1, 2)).toBeCloseTo(0);
      });

      it('should return this for chaining', () => {
        const m = new Matrix4();
        const result = m.makeRotationX(Math.PI / 4);
        expect(result).toBe(m);
      });
    });

    describe('makeRotationY()', () => {
      it('should create rotation matrix around Y axis', () => {
        const m = new Matrix4().makeRotationY(Math.PI / 2);
        expect(m.get(1, 1)).toBe(1);
        expect(m.get(0, 0)).toBeCloseTo(0);
        expect(m.get(0, 2)).toBeCloseTo(1);
        expect(m.get(2, 0)).toBeCloseTo(-1);
        expect(m.get(2, 2)).toBeCloseTo(0);
      });

      it('should handle zero rotation', () => {
        const m = new Matrix4().makeRotationY(0);
        expect(m.equals(new Matrix4())).toBe(true);
      });

      it('should return this for chaining', () => {
        const m = new Matrix4();
        const result = m.makeRotationY(Math.PI / 4);
        expect(result).toBe(m);
      });
    });

    describe('makeRotationZ()', () => {
      it('should create rotation matrix around Z axis', () => {
        const m = new Matrix4().makeRotationZ(Math.PI / 2);
        expect(m.get(2, 2)).toBe(1);
        expect(m.get(0, 0)).toBeCloseTo(0);
        expect(m.get(0, 1)).toBeCloseTo(-1);
        expect(m.get(1, 0)).toBeCloseTo(1);
        expect(m.get(1, 1)).toBeCloseTo(0);
      });

      it('should handle zero rotation', () => {
        const m = new Matrix4().makeRotationZ(0);
        expect(m.equals(new Matrix4())).toBe(true);
      });

      it('should return this for chaining', () => {
        const m = new Matrix4();
        const result = m.makeRotationZ(Math.PI / 4);
        expect(result).toBe(m);
      });
    });

    describe('makeScale()', () => {
      it('should create scale matrix', () => {
        const m = new Matrix4().makeScale(2, 3, 4);
        expect(m.get(0, 0)).toBe(2);
        expect(m.get(1, 1)).toBe(3);
        expect(m.get(2, 2)).toBe(4);
        expect(m.get(3, 3)).toBe(1);
      });

      it('should handle uniform scale', () => {
        const m = new Matrix4().makeScale(2, 2, 2);
        expect(m.get(0, 0)).toBe(2);
        expect(m.get(1, 1)).toBe(2);
        expect(m.get(2, 2)).toBe(2);
      });

      it('should handle zero scale', () => {
        const m = new Matrix4().makeScale(0, 0, 0);
        expect(m.get(0, 0)).toBe(0);
        expect(m.get(1, 1)).toBe(0);
        expect(m.get(2, 2)).toBe(0);
      });

      it('should handle negative scale', () => {
        const m = new Matrix4().makeScale(-1, -2, -3);
        expect(m.get(0, 0)).toBe(-1);
        expect(m.get(1, 1)).toBe(-2);
        expect(m.get(2, 2)).toBe(-3);
      });

      it('should return this for chaining', () => {
        const m = new Matrix4();
        const result = m.makeScale(2, 2, 2);
        expect(result).toBe(m);
      });
    });

    describe('Method Chaining', () => {
      it('should chain makeTranslation', () => {
        const m = new Matrix4();
        const result = m.makeTranslation(1, 2, 3);
        expect(result).toBe(m);
      });

      it('should chain makeRotationX', () => {
        const m = new Matrix4();
        const result = m.makeRotationX(Math.PI / 4);
        expect(result).toBe(m);
      });

      it('should chain makeRotationY', () => {
        const m = new Matrix4();
        const result = m.makeRotationY(Math.PI / 4);
        expect(result).toBe(m);
      });

      it('should chain makeRotationZ', () => {
        const m = new Matrix4();
        const result = m.makeRotationZ(Math.PI / 4);
        expect(result).toBe(m);
      });

      it('should chain makeScale', () => {
        const m = new Matrix4();
        const result = m.makeScale(2, 2, 2);
        expect(result).toBe(m);
      });

      it('should chain multiple operations', () => {
        const m = new Matrix4()
          .makeTranslation(1, 2, 3)
          .multiply(new Matrix4().makeRotationZ(Math.PI / 4))
          .multiply(new Matrix4().makeScale(2, 2, 2));
        expect(m.get(3, 0)).toBe(1);
      });
    });
  });

  describe('Integration Tests', () => {
    it('should compose translation and rotation correctly', () => {
      const rotation = new Matrix4().makeRotationZ(Math.PI / 2);
      const translation = new Matrix4().makeTranslation(1, 0, 0);
      const composed = new Matrix4().multiplyMatrices(translation, rotation);
      const v = new Vector3(1, 0, 0);
      const result = composed.transformPoint(v);
      expect(result.x).toBeCloseTo(1);
      expect(result.y).toBeCloseTo(-1);
    });

    it('should compose scale and translation correctly', () => {
      const scale = new Matrix4().makeScale(2, 2, 2);
      const translation = new Matrix4().makeTranslation(1, 1, 1);
      const composed = new Matrix4().multiplyMatrices(translation, scale);
      const v = new Vector3(1, 1, 1);
      const result = composed.transformPoint(v);
      expect(result.x).toBe(3);
      expect(result.y).toBe(3);
      expect(result.z).toBe(3);
    });

    it('should transform direction correctly with composed transformations', () => {
      const rotation = new Matrix4().makeRotationZ(Math.PI / 2);
      const scale = new Matrix4().makeScale(2, 2, 2);
      const composed = new Matrix4().multiplyMatrices(rotation, scale);
      const v = new Vector3(1, 0, 0);
      const result = composed.transformDirection(v);
      expect(result.x).toBeCloseTo(0);
      expect(result.y).toBeCloseTo(-2);
    });
  });
});
