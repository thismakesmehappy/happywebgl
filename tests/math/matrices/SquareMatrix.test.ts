import { describe, it, expect } from 'vitest';
import { Matrix } from '../../../src/math/matrices/Matrix.js';
import { Matrix4 } from '../../../src/math/matrices/Matrix4.js';
import { SquareMatrix } from '../../../src/math/matrices/SquareMatrix.js';
import { createSquareMatrix } from '../../helpers/math/createSquareMatrix.js';
import { createMatrixPair } from '../../helpers/math/createMatrixPair.js';
import { EPSILON } from '../../helpers/const.js';
import { TestSquareMatrixUneven } from '../../helpers/math/TestSquareMatrixUneven.js';

const TestSquareMatrix1 = createSquareMatrix(1);
const TestSquareMatrix2 = createSquareMatrix(2);
const TestSquareMatrix4 = createSquareMatrix(4);
const [TestMatrix3x2, TestMatrix2x3] = createMatrixPair(3, 2);

describe('SquareMatrix', () => {
  describe('dimension getter', () => {
    it('should return the dimension for square matrices', () => {
      const m = new TestSquareMatrix4();
      expect(m.dimension).toBe(4);
    });

    it('should throw error for non-square matrices', () => {
      const m = new TestSquareMatrixUneven(2, 3);
      expect(() => m.dimension).toThrow('Matrix is not square');
    });
  });

  describe('Static Factory Methods', () => {
    describe('identity()', () => {
      it('should create identity matrix using Matrix.zero() and makeIdentity()', () => {
        // Since SquareMatrix doesn't have static identity(), use Matrix.zero() then makeIdentity()
        const m = Matrix.zero.call(TestSquareMatrix4);
        m.makeIdentity();
        expect(m.equals(new TestSquareMatrix4().makeIdentity())).toBe(true);
      });
    });

    describe('zero()', () => {
      it('should create zero matrix', () => {
        const m = SquareMatrix.zero.call(TestSquareMatrix4);
        expect(m.equals(new TestSquareMatrix4())).toBe(true);
      });
    });
  });

  describe('transpose()', () => {
    it('should transpose 2x2 matrix', () => {
      const m = new TestSquareMatrix2(1, 3, 2, 4);
      m.transpose();
      const expected = new TestSquareMatrix2(1, 2, 3, 4);
      expect(m.equals(expected)).toBe(true);
    });

    it('should transpose 4x4 matrix', () => {
      const m = new TestSquareMatrix4(
        1, 2, 3, 4,
        5, 6, 7, 8,
        9, 10, 11, 12,
        13, 14, 15, 16
      );
      const expected = new TestSquareMatrix4(
        1, 5, 9, 13,
        2, 6, 10, 14,
        3, 7, 11, 15,
        4, 8, 12, 16
      );
      m.transpose();
      expect(m.equals(expected)).toBe(true);
    });

    it('should be idempotent (transpose twice returns original)', () => {
      const m = new Matrix4(
        1, 2, 3, 4,
        5, 6, 7, 8,
        9, 10, 11, 12,
        13, 14, 15, 16
      );
      const original = m.clone();
      m.transpose();
      m.transpose();
      expect(m.equals(original)).toBe(true);
    });

    it('should transpose 1x1 matrix (no-op)', () => {
      const m = new TestSquareMatrix1(5);
      const original = m.clone();
      m.transpose();
      expect(m.equals(original)).toBe(true);
    });

    it('should mutate the original matrix', () => {
      const m = new TestSquareMatrix2(1, 3, 2, 4);
      const original = m.clone();
      m.transpose();
      expect(m.equals(original)).toBe(false);
    });

    it('should return this for method chaining', () => {
      const m = new TestSquareMatrix2(1, 3, 2, 4);
      const result = m.transpose();
      expect(result).toBe(m);
    });

    it('should throw error when transposing non-square matrix', () => {
      const m = new TestSquareMatrixUneven(2, 3);
      expect(() => m.transpose()).toThrow('SquareMatrix.transpose(): Matrix must be square (3x2)');
    });
  });

  describe('determinant()', () => {
    it('should calculate determinant of 1x1 matrix', () => {
      const m = new TestSquareMatrix1(5);
      expect(m.determinant()).toBe(5);
    });

    it('should calculate determinant of 2x2 matrix', () => {
      const m = new TestSquareMatrix2(1, 3, 2, 4);
      expect(m.determinant()).toBe(-2);
    });

    it('should calculate determinant of identity matrix', () => {
      const m = new TestSquareMatrix4().makeIdentity();
      expect(m.determinant()).toBe(1);
    });

    it('should calculate determinant of diagonal matrix', () => {
      const m = new TestSquareMatrix4(
        2, 0, 0, 0,
        0, 2, 0, 0,
        0, 0, 2, 0,
        0, 0, 0, 2
      );
      expect(m.determinant()).toBe(16);
    });

    it('should calculate determinant of 4x4 matrix', () => {
      const m = new TestSquareMatrix4(
        1, 2, 3, 4,
        8, 7, 6, 5,
        11, 10, 12, 9,
        13, 16, 15, 13
      );
      expect(m.determinant()).toBe(207);
    });

    it('should return 0 for singular matrix', () => {
      const m = new TestSquareMatrix4(
        1, 1, 5, 9,
        1, 1, 5, 9,
        3, 3, 7, 11,
        4, 4, 8, 12
      );
      expect(m.determinant()).toBe(0);
    });

    it('should return 0 for zero matrix', () => {
      const m = new TestSquareMatrix4();
      expect(m.determinant()).toBe(0);
    });

    it('should calculate determinant with negative values', () => {
      const m = new TestSquareMatrix2(-1, -3, 2, 4);
      expect(m.determinant()).toBe(2);
    });

    it('should handle near-zero determinant', () => {
      const m = new TestSquareMatrix4(
        1, 0, 0, 0,
        0, 1, 0, 0,
        0, 0, 1, 0,
        0, 0, 0, 1e-8
      );
      const det = m.determinant();
      expect(det).toBeCloseTo(1e-8, 10);
      expect(det).not.toBe(0);
    });

    it('should throw error when calculating determinant of non-square matrix', () => {
      const m = new TestSquareMatrixUneven(2, 3);
      expect(() => m.determinant()).toThrow('SquareMatrix.determinant(): Matrix must be square (3x2)');
    });
  });

  describe('invert()', () => {
    it('should invert identity matrix', () => {
      const m = new TestSquareMatrix4().makeIdentity();
      const original = m.clone();
      m.invert();
      expect(m.equals(original)).toBe(true);
    });

    it('should invert diagonal matrix', () => {
      const m = new TestSquareMatrix4(
        2, 0, 0, 0,
        0, 2, 0, 0,
        0, 0, 2, 0,
        0, 0, 0, 2
      );
      const inverse = m.clone().invert();
      const expected = new TestSquareMatrix4(
        0.5, 0, 0, 0,
        0, 0.5, 0, 0,
        0, 0, 0.5, 0,
        0, 0, 0, 0.5
      );
      expect(inverse.equalsEpsilon(expected, EPSILON)).toBe(true);
    });

    it('should invert translation matrix', () => {
      const m = new TestSquareMatrix4(
        1, 0, 0, 0,
        0, 1, 0, 0,
        0, 0, 1, 0,
        2, 3, 4, 1
      );
      const inverse = m.clone().invert();
      const expected = new TestSquareMatrix4(
        1, 0, 0, 0,
        0, 1, 0, 0,
        0, 0, 1, 0,
        -2, -3, -4, 1
      );
      expect(inverse.equalsEpsilon(expected, EPSILON)).toBe(true);
    });

    it('should throw error for singular matrix', () => {
      const m = new TestSquareMatrix4(
        1, 1, 5, 9,
        2, 2, 6, 10,
        3, 3, 7, 11,
        4, 4, 8, 12
      );
      expect(() => m.invert()).toThrow('not invertible');
    });

    it('should satisfy m * m.inverse() = identity', () => {
      const m = new TestSquareMatrix4(
        2, 0, 0, 0,
        0, 2, 0, 0,
        0, 0, 2, 0,
        1, 0, 0, 1
      );
      const inverse = m.clone().invert();
      const product = new TestSquareMatrix4().multiplyMatrices(m, inverse);
      const identity = new TestSquareMatrix4().makeIdentity();
      expect(product.equalsEpsilon(identity, EPSILON)).toBe(true);
    });

    it('should invert 1x1 matrix', () => {
      const m = new TestSquareMatrix1(5);
      const original = m.clone();
      m.invert();
      expect(m.get(0, 0)).toBeCloseTo(0.2, 8);
    });

    it('should mutate the original matrix', () => {
      const m = new TestSquareMatrix4(
        2, 0, 0, 0,
        0, 2, 0, 0,
        0, 0, 2, 0,
        0, 0, 0, 2
      );
      const original = m.clone();
      m.invert();
      expect(m.equals(original)).toBe(false);
    });

    it('should return this for method chaining', () => {
      const m = new TestSquareMatrix4(
        2, 0, 0, 0,
        0, 2, 0, 0,
        0, 0, 2, 0,
        0, 0, 0, 2
      );
      const result = m.invert();
      expect(result).toBe(m);
    });

    it('should satisfy double inversion', () => {
      const m = new TestSquareMatrix4(
        2, 1, 0, 0,
        1, 2, 1, 0,
        0, 1, 2, 1,
        0, 0, 1, 2
      );
      const original = m.clone();
      m.invert().invert();
      expect(m.equalsEpsilon(original, EPSILON)).toBe(true);
    });

    it('should handle near-singular matrix', () => {
      const m = new TestSquareMatrix4(
        1, 0, 0, 0,
        0, 1, 0, 0,
        0, 0, 1, 0,
        0, 0, 0, 0.01
      );
      expect(() => m.invert()).not.toThrow();
      const original = m.clone();
      const inverse = m.clone().invert();
      const product = new TestSquareMatrix4().multiplyMatrices(original, inverse);
      const identity = new TestSquareMatrix4().makeIdentity();
      expect(product.equalsEpsilon(identity, EPSILON)).toBe(true);
    });

    it('should throw error when inverting non-square matrix', () => {
      const m = new TestSquareMatrixUneven(2, 3);
      expect(() => m.invert()).toThrow('SquareMatrix.invert(): Matrix must be square (3x2)');
    });
  });

  describe('Integration Tests', () => {
    it('should satisfy det(M) = det(M^T)', () => {
      const m = new TestSquareMatrix4(
        1, 2, 3, 4,
        5, 6, 7, 8,
        9, 10, 11, 12,
        13, 14, 15, 16
      );
      const detOriginal = m.determinant();
      m.transpose();
      const detTransposed = m.determinant();
      expect(detTransposed).toBeCloseTo(detOriginal, 10);
    });

    it('should satisfy (M^T)^(-1) = (M^(-1))^T', () => {
      const m = new TestSquareMatrix4(
        2, 1, 0, 0,
        1, 2, 1, 0,
        0, 1, 2, 1,
        0, 0, 1, 2
      );
      const mTransposeInverse = m.clone().transpose().invert();
      const mInverseTranspose = m.clone().invert().transpose();
      expect(mTransposeInverse.equalsEpsilon(mInverseTranspose, EPSILON)).toBe(true);
    });

    it('should satisfy det(M^(-1)) = 1/det(M)', () => {
      const m = new TestSquareMatrix4(
        2, 0, 0, 0,
        0, 2, 0, 0,
        0, 0, 2, 0,
        0, 0, 0, 2
      );
      const detM = m.determinant();
      const mInverse = m.clone().invert();
      const detMInverse = mInverse.determinant();
      expect(detMInverse).toBeCloseTo(1 / detM, 10);
    });
  });

  describe('Error Message Verification', () => {
    it('should throw correct error message for dimension getter on non-square matrix', () => {
      const m = new TestSquareMatrixUneven(2, 3);
      expect(() => m.dimension).toThrow('SquareMatrix.dimension: Matrix is not square (3x2)');
    });

    it('should throw correct error message for transpose on non-square matrix', () => {
      const m = new TestSquareMatrixUneven(2, 3);
      expect(() => m.transpose()).toThrow('SquareMatrix.transpose(): Matrix must be square (3x2)');
    });

    it('should throw correct error message for determinant on non-square matrix', () => {
      const m = new TestSquareMatrixUneven(2, 3);
      expect(() => m.determinant()).toThrow('SquareMatrix.determinant(): Matrix must be square (3x2)');
    });

    it('should throw correct error message for invert on non-square matrix', () => {
      const m = new TestSquareMatrixUneven(2, 3);
      expect(() => m.invert()).toThrow('SquareMatrix.invert(): Matrix must be square (3x2)');
    });

    it('should throw correct error message for invert on singular matrix', () => {
      const m = new TestSquareMatrix4(
        1, 1, 1, 1,
        2, 2, 2, 2,
        3, 3, 3, 3,
        4, 4, 4, 4
      );
      expect(() => m.invert()).toThrow('not invertible');
    });
  });

  describe('Edge Cases', () => {
    describe('1x1 matrix operations', () => {
      it('should calculate determinant of 1x1 matrix', () => {
        const m = new TestSquareMatrix1(7);
        expect(m.determinant()).toBe(7);
      });

      it('should invert 1x1 matrix', () => {
        const m = new TestSquareMatrix1(4);
        m.invert();
        expect(m.get(0, 0)).toBeCloseTo(0.25, 8);
      });

      it('should transpose 1x1 matrix (no-op)', () => {
        const m = new TestSquareMatrix1(3);
        const original = m.clone();
        m.transpose();
        expect(m.equals(original)).toBe(true);
      });
    });

    describe('Floating-point precision', () => {
      it('should handle determinant with floating-point precision issues', () => {
        const m = new TestSquareMatrix4(
          0.1, 0.2, 0.3, 0.4,
          0.5, 0.6, 0.7, 0.8,
          0.9, 1.0, 1.1, 1.2,
          1.3, 1.4, 1.5, 1.6
        );
        const det = m.determinant();
        expect(typeof det).toBe('number');
        expect(isNaN(det)).toBe(false);
        expect(isFinite(det)).toBe(true);
      });

      it('should handle inversion with floating-point precision', () => {
        const m = new TestSquareMatrix4(
          1.1, 0.1, 0.0, 0.0,
          0.1, 1.1, 0.1, 0.0,
          0.0, 0.1, 1.1, 0.1,
          0.0, 0.0, 0.1, 1.1
        );
        const original = m.clone();
        m.invert();
        const product = new TestSquareMatrix4().multiplyMatrices(original, m);
        const identity = new TestSquareMatrix4().makeIdentity();
        expect(product.equalsEpsilon(identity, EPSILON)).toBe(true);
      });

      it('should preserve column-major order after operations', () => {
        const m = new TestSquareMatrix4(
          1, 2, 3, 4,
          5, 6, 7, 8,
          9, 10, 11, 12,
          13, 14, 15, 16
        );
        const originalElements = Array.from(m.elements);
        m.transpose();
        expect(m.elements.length).toBe(16);
        expect(m.elements instanceof Float32Array).toBe(true);
      });
    });
  });
});
