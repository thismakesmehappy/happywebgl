import { describe, it, expect } from 'vitest';
import { Matrix } from '../../../src/math/matrices/Matrix.js';
import { Matrix4 } from '../../../src/math/matrices/Matrix4.js';
import { TestMatrixWithoutZeroElements } from '../../helpers/math/TestMatrixWithoutZeroElements.js';
import { createMatrixPair } from '../../helpers/math/createMatrixPair.js';

const [TestMatrix2x2] = createMatrixPair(2, 2);
const [TestMatrix3x3] = createMatrixPair(3, 3);
const [TestMatrix3x2, TestMatrix2x3] = createMatrixPair(3, 2);
const [TestMatrix4x3, TestMatrix3x4] = createMatrixPair(4, 3);
const [TestMatrix4x4] = createMatrixPair(4, 4);

describe('Matrix (Base Class)', () => {
  describe('Constructor', () => {
    it('should create matrix with correct dimensions', () => {
      const elements = new Array(12).fill(0);
      const m = new TestMatrix3x4(...elements);
      expect(m.columns).toBe(3);
      expect(m.rows).toBe(4);
    });

    it('should throw error when input size is greater than expected', () => {
      const wrongElements = new Array(5).fill(0);
      expect(() => {
        new TestMatrix3x4(2, 2, ...wrongElements);
      }).toThrow('size mismatch');
    });

    it('should throw error when input size is less than expected', () => {
      const wrongElements = new Array(3).fill(0);
      expect(() => {
        new TestMatrix3x4(2, 2, ...wrongElements);
      }).toThrow('size mismatch');
    });

    it('should throw error when input is empty', () => {
      expect(() => {
        new TestMatrixWithoutZeroElements(2, 2);
      }).toThrow('size mismatch');
    });

    it('should accept NaN values', () => {
      const m = new TestMatrix2x2(NaN, 1, 2, 3);
      expect(Number.isNaN(m.get(0, 0))).toBe(true);
      expect(m.get(0, 1)).toBe(1);
    });

    it('should accept Infinity values', () => {
      const m = new TestMatrix2x2(Infinity, 1, 2, 3);
      expect(m.get(0, 0)).toBe(Infinity);
      expect(m.get(0, 1)).toBe(1);
    });

    it('should accept -Infinity values', () => {
      const m = new TestMatrix2x2(-Infinity, 1, 2, 3);
      expect(m.get(0, 0)).toBe(-Infinity);
      expect(m.get(0, 1)).toBe(1);
    });

    it('should accept mixed NaN/Infinity/normal values', () => {
      const m = new TestMatrix2x2(NaN, Infinity, -Infinity, 5);
      expect(Number.isNaN(m.get(0, 0))).toBe(true);
      expect(m.get(0, 1)).toBe(Infinity);
      expect(m.get(1, 0)).toBe(-Infinity);
      expect(m.get(1, 1)).toBe(5);
    });
  });

  describe('Getters', () => {
    it('should return size as rows * columns', () => {
      const m = new TestMatrix3x4();
      expect(m.size).toBe(12);
    });

    it('should return size for different matrix dimensions', () => {
      const m2x2 = new TestMatrix2x2();
      expect(m2x2.size).toBe(4);

      const m4x3 = new TestMatrix4x3();
      expect(m4x3.size).toBe(12);
    });

    it('should return elements as Float32Array', () => {
      const m = new TestMatrix3x4(1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12);
      expect(m.elements).toEqual(new Float32Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]));
    });
  });

  describe('Proxy Indexing', () => {
    it('should access elements using column proxy syntax', () => {
      const m = new TestMatrix3x4(1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12);
      expect(m[0][0]).toBe(1);
      expect(m[0][1]).toBe(2);
      expect(m[0][2]).toBe(3);
      expect(m[0][3]).toBe(4);
    });

    it('should set elements using column proxy syntax', () => {
      const m = new TestMatrix3x4(1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12);
      m[0][0] = 10;
      expect(m[0][0]).toBe(10);
    });

    it('should return undefined for out-of-bounds row indices', () => {
      const m = new TestMatrix3x4(1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12);
      expect(m[0][5]).toBe(undefined);
    });

    it('should throw error when setting out-of-bounds row indices', () => {
      const m = new TestMatrix3x4(1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12);
      expect(() => {
        m[0][5] = 10;
      }).toThrow(TypeError);
    });

    it('should handle symbol access in proxy', () => {
      const m = new TestMatrix3x4();
      const sym = Symbol('test');
      expect(m[sym as any]).toBeUndefined();
    });

    it('should return undefined for out-of-bounds column access', () => {
      const m = new TestMatrix3x4();
      expect(m[10]).toBeUndefined();
    });

    it('should return undefined for negative column access', () => {
      const m = new TestMatrix3x4();
      expect(m[-1]).toBeUndefined();
    });

    it('should access actual methods for non-numeric properties', () => {
      const m = new TestMatrix3x4();
      expect(m['toString']).toBeDefined();
      expect(typeof m['toString']).toBe('function');
    });

    it('should handle symbol access in column proxy', () => {
      const m = new TestMatrix3x4();
      const sym = Symbol('test');
      expect(m[0][sym as any]).toBeUndefined();
    });

    it('should return undefined for non-numeric string column access', () => {
      const m = new TestMatrix3x4();
      expect(m['abc' as any]).toBeUndefined();
    });

    it('should return undefined for NaN column index', () => {
      const m = new TestMatrix3x4();
      expect(m[NaN as any]).toBeUndefined();
    });

    it('should return undefined for non-numeric string row access', () => {
      const m = new TestMatrix3x4();
      expect(m[0]['abc' as any]).toBeUndefined();
    });

    it('should return undefined for NaN row index', () => {
      const m = new TestMatrix3x4();
      expect(m[0][NaN as any]).toBeUndefined();
    });

    it('should throw error when setting symbol property', () => {
      const m = new TestMatrix3x4();
      const sym = Symbol('test');
      expect(() => {
        (m[0] as any)[sym] = 5;
      }).toThrow(TypeError);
    });

    it('should set NaN via proxy', () => {
      const m = new TestMatrix2x2();
      m[0][0] = NaN;
      expect(Number.isNaN(m.get(0, 0))).toBe(true);
    });

    it('should set Infinity via proxy', () => {
      const m = new TestMatrix2x2();
      m[0][0] = Infinity;
      expect(m.get(0, 0)).toBe(Infinity);
    });

    it('should set -Infinity via proxy', () => {
      const m = new TestMatrix2x2();
      m[0][0] = -Infinity;
      expect(m.get(0, 0)).toBe(-Infinity);
    });
  });

  describe('Element Access (get/set)', () => {
    it('should throw error for negative column index', () => {
      const m = new TestMatrix3x4();
      expect(() => m.get(-1, 0)).toThrow('Column index -1 out of bounds');
    });

    it('should throw error for negative row index', () => {
      const m = new TestMatrix3x4();
      expect(() => m.get(0, -1)).toThrow('Row index -1 out of bounds');
    });

    it('should throw error for column index out of bounds', () => {
      const m = new TestMatrix3x4();
      expect(() => m.get(5, 0)).toThrow('Column index 5 out of bounds');
    });

    it('should throw error for row index out of bounds', () => {
      const m = new TestMatrix3x4();
      expect(() => m.get(0, 5)).toThrow('Row index 5 out of bounds');
    });

    it('should set element and return this for chaining', () => {
      const m = new TestMatrix3x4();
      const result = m.set(1, 2, 42);
      expect(result).toBe(m);
      expect(m.get(1, 2)).toBe(42);
    });

    it('should set and get NaN values', () => {
      const m = new TestMatrix2x2();
      m.set(0, 0, NaN);
      expect(Number.isNaN(m.get(0, 0))).toBe(true);
    });

    it('should set and get Infinity values', () => {
      const m = new TestMatrix2x2();
      m.set(0, 0, Infinity);
      expect(m.get(0, 0)).toBe(Infinity);
    });

    it('should set and get -Infinity values', () => {
      const m = new TestMatrix2x2();
      m.set(0, 0, -Infinity);
      expect(m.get(0, 0)).toBe(-Infinity);
    });
  });

  describe('Copy and Clone', () => {
    it('should copy matrices correctly', () => {
      const m1 = new TestMatrix3x4(1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12);
      const m2 = new TestMatrix3x4();
      m2.copy(m1);
      expect(m2.equals(m1)).toBe(true);
    });

    it('should throw error when copying matrices of different sizes', () => {
      const m1 = new TestMatrix3x4(1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12);
      const m2 = new TestMatrix2x2(1, 2, 3, 4);
      expect(() => m1.copy(m2 as any)).toThrow('Matrices must have the same size: MatrixB (4x3) and MatrixA (2x2)');
    });

    it('should copy matrix to itself', () => {
      const m = new TestMatrix3x4(1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12);
      const original = m.clone();
      m.copy(m);
      expect(m.equals(original)).toBe(true);
    });

    it('should clone matrices correctly', () => {
      const m1 = new TestMatrix3x4(1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12);
      const m2 = m1.clone();
      expect(m2.equals(m1)).toBe(true);
    });

    it('should clone matrix with NaN values', () => {
      const m1 = new TestMatrix2x2(NaN, 1, 2, 3);
      const m2 = m1.clone();
      expect(Number.isNaN(m2.get(0, 0))).toBe(true);
      expect(m2.get(0, 1)).toBe(1);
      m2.set(0, 1, 999);
      expect(m1.get(0, 1)).toBe(1);
    });

    it('should clone matrix with Infinity values', () => {
      const m1 = new TestMatrix2x2(Infinity, 1, 2, 3);
      const m2 = m1.clone();
      expect(m2.get(0, 0)).toBe(Infinity);
      expect(m2.get(0, 1)).toBe(1);
      m2.set(0, 1, 999);
      expect(m1.get(0, 1)).toBe(1);
    });

    it('should verify clone is independent', () => {
      const m1 = new TestMatrix3x4(1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12);
      const m2 = m1.clone();
      m2.set(0, 0, 999);
      expect(m1.get(0, 0)).toBe(1);
      expect(m2.get(0, 0)).toBe(999);
    });
  });

  describe('Comparison Methods', () => {
    describe('equals()', () => {
      it('should return true for identical matrices', () => {
        const m1 = new TestMatrix3x4(1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12);
        const m2 = new TestMatrix3x4(1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12);
        expect(m1.equals(m2)).toBe(true);
      });

      it('should return false for matrices with different values', () => {
        const m1 = new TestMatrix3x4(1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12);
        const m2 = new TestMatrix3x4(2, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12);
        expect(m1.equals(m2)).toBe(false);
      });

      it('should return false for matrices of different sizes', () => {
        const m1 = new TestMatrix3x4(1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12);
        const m2 = new TestMatrix2x2(1, 2, 3, 4);
        expect(m1.equals(m2)).toBe(false);
      });

      it('should return false when comparing NaN values', () => {
        const m1 = new TestMatrix2x2(NaN, 1, 2, 3);
        const m2 = new TestMatrix2x2(NaN, 1, 2, 3);
        expect(m1.equals(m2)).toBe(false);
      });

      it('should return true when comparing Infinity values', () => {
        const m1 = new TestMatrix2x2(Infinity, 1, 2, 3);
        const m2 = new TestMatrix2x2(Infinity, 1, 2, 3);
        expect(m1.equals(m2)).toBe(true);
      });

      it('should return true when comparing -Infinity values', () => {
        const m1 = new TestMatrix2x2(-Infinity, 1, 2, 3);
        const m2 = new TestMatrix2x2(-Infinity, 1, 2, 3);
        expect(m1.equals(m2)).toBe(true);
      });
    });

    describe('equalsEpsilon()', () => {
      it('should compare matrices within tolerance', () => {
        const m1 = new TestMatrix3x4(1.0, 2.0, 3.0, 4.0, 5.0, 6.0, 7.0, 8.0, 9.0, 10.0, 11.0, 12.0);
        const m2 = new TestMatrix3x4(1.000001, 2.000001, 3.000001, 4.000001, 5.000001, 6.000001, 7.000001, 8.000001, 9.000001, 10.000001, 11.000001, 12.000001);
        expect(m1.equalsEpsilon(m2, 0.00001)).toBe(true);
      });

      it('should return false for matrices outside tolerance', () => {
        const m1 = new TestMatrix3x4(1.0, 2.0, 3.0, 4.0, 5.0, 6.0, 7.0, 8.0, 9.0, 10.0, 11.0, 12.0);
        const m2 = new TestMatrix3x4(1.002, 2.002, 3.002, 4.002, 5.002, 6.002, 7.002, 8.002, 9.002, 10.002, 11.002, 12.002);
        expect(m1.equalsEpsilon(m2, 0.00001)).toBe(false);
      });

      it('should return false for matrices of different sizes', () => {
        const m1 = new TestMatrix3x4();
        const m2 = new TestMatrix2x2();
        expect(m1.equalsEpsilon(m2)).toBe(false);
      });

      it('should use default epsilon when not provided', () => {
        const m1 = new TestMatrix3x4(1.0, 2.0, 3.0, 4.0, 5.0, 6.0, 7.0, 8.0, 9.0, 10.0, 11.0, 12.0);
        const m2 = new TestMatrix3x4(1.000001, 2.000001, 3.000001, 4.000001, 5.000001, 6.000001, 7.000001, 8.000001, 9.000001, 10.000001, 11.000001, 12.000001);
        expect(m1.equalsEpsilon(m2)).toBe(true);
      });

      it('should handle NaN values', () => {
        const m1 = new TestMatrix2x2(NaN, 1, 2, 3);
        const m2 = new TestMatrix2x2(NaN, 1, 2, 3);
        expect(m1.equalsEpsilon(m2, 0.00001)).toBe(false);
      });

      it('should handle Infinity values', () => {
        const m1 = new TestMatrix2x2(Infinity, 1, 2, 3);
        const m2 = new TestMatrix2x2(Infinity, 1, 2, 3);
        expect(m1.equalsEpsilon(m2, 0.00001)).toBe(true);
      });

      it('should return false when comparing Infinity and -Infinity', () => {
        const m1 = new TestMatrix2x2(Infinity, 1, 2, 3);
        const m2 = new TestMatrix2x2(-Infinity, 1, 2, 3);
        expect(m1.equalsEpsilon(m2, 0.00001)).toBe(false);
      });

      it('should throw error for negative epsilon', () => {
        const m1 = new TestMatrix2x2(1, 2, 3, 4);
        const m2 = new TestMatrix2x2(1, 2, 3, 4);
        expect(() => m1.equalsEpsilon(m2, -0.00001)).toThrow();
      });

      it('should work with zero epsilon (exact equality)', () => {
        const m1 = new TestMatrix2x2(1, 2, 3, 4);
        const m2 = new TestMatrix2x2(1, 2, 3, 4);
        expect(m1.equalsEpsilon(m2, 0)).toBe(true);
      });

      it('should work with zero epsilon for different values', () => {
        const m1 = new TestMatrix2x2(1, 2, 3, 4);
        const m2 = new TestMatrix2x2(1.000001, 2, 3, 4);
        expect(m1.equalsEpsilon(m2, 0)).toBe(false);
      });

      it('should work with very large epsilon', () => {
        const m1 = new TestMatrix2x2(1, 2, 3, 4);
        const m2 = new TestMatrix2x2(100, 200, 300, 400);
        expect(m1.equalsEpsilon(m2, 1000)).toBe(true);
      });
    });
  });

  describe('Instance Arithmetic Methods', () => {
    describe('add()', () => {
      it('should add two matrices correctly', () => {
        const m1 = new TestMatrix3x4(10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10);
        const m2 = new TestMatrix3x4(1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12);
        const expected = new TestMatrix3x4(11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22);
        m1.add(m2);
        expect(m1.equals(expected)).toBe(true);
      });

      it('should throw error when adding matrices of different sizes', () => {
        const m1 = new TestMatrix3x4(1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12);
        const m2 = new TestMatrix2x2(1, 2, 3, 4);
        expect(() => m1.add(m2 as any)).toThrow('Matrices must have the same size: MatrixB (4x3) and MatrixA (2x2)');
      });

      it('should add zero matrix (no-op)', () => {
        const m1 = new TestMatrix3x4(1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12);
        const zero = new TestMatrix3x4();
        const original = m1.clone();
        m1.add(zero);
        expect(m1.equals(original)).toBe(true);
      });

      it('should handle NaN in add()', () => {
        const m1 = new TestMatrix2x2(NaN, 1, 2, 3);
        const m2 = new TestMatrix2x2(1, 1, 1, 1);
        m1.add(m2);
        expect(Number.isNaN(m1.get(0, 0))).toBe(true);
        expect(m1.get(0, 1)).toBe(2);
      });

      it('should handle Infinity in add()', () => {
        const m1 = new TestMatrix2x2(Infinity, 1, 2, 3);
        const m2 = new TestMatrix2x2(1, 1, 1, 1);
        m1.add(m2);
        expect(m1.get(0, 0)).toBe(Infinity);
        expect(m1.get(0, 1)).toBe(2);
      });
    });

    describe('subtract()', () => {
      it('should subtract two matrices correctly', () => {
        const m1 = new TestMatrix3x4(12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12);
        const m2 = new TestMatrix3x4(1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12);
        m1.subtract(m2);
        const expected = new TestMatrix3x4(11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0);
        expect(m1.equals(expected)).toBe(true);
      });

      it('should throw error when subtracting matrices of different sizes', () => {
        const m1 = new TestMatrix3x4(1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12);
        const m2 = new TestMatrix2x2(1, 2, 3, 4);
        expect(() => m1.subtract(m2 as any)).toThrow('Matrices must have the same size: MatrixB (4x3) and MatrixA (2x2)');
      });

      it('should subtract from itself (result is zero matrix)', () => {
        const m1 = new TestMatrix3x4(1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12);
        const original = m1.clone();
        m1.subtract(original);
        const zero = new TestMatrix3x4();
        expect(m1.equals(zero)).toBe(true);
      });

      it('should subtract zero matrix (no-op)', () => {
        const m1 = new TestMatrix3x4(1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12);
        const zero = new TestMatrix3x4();
        const original = m1.clone();
        m1.subtract(zero);
        expect(m1.equals(original)).toBe(true);
      });

      it('should handle NaN in subtract()', () => {
        const m1 = new TestMatrix2x2(NaN, 1, 2, 3);
        const m2 = new TestMatrix2x2(1, 1, 1, 1);
        m1.subtract(m2);
        expect(Number.isNaN(m1.get(0, 0))).toBe(true);
        expect(m1.get(0, 1)).toBe(0);
      });

      it('should handle Infinity in subtract()', () => {
        const m1 = new TestMatrix2x2(Infinity, 1, 2, 3);
        const m2 = new TestMatrix2x2(1, 1, 1, 1);
        m1.subtract(m2);
        expect(m1.get(0, 0)).toBe(Infinity);
        expect(m1.get(0, 1)).toBe(0);
      });
    });

    describe('multiply()', () => {
      it('should multiply this matrix by another matrix', () => {
        const m1 = new TestMatrix4x4(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 2, 3, 4, 1);
        const m2 = new TestMatrix4x4(2, 0, 0, 0, 0, 2, 0, 0, 0, 0, 2, 0, 0, 0, 0, 1);
        const original = m1.clone();
        m1.multiply(m2);
        expect(m1.equals(original)).toBe(false);
        expect(m2.equals(new TestMatrix4x4(2, 0, 0, 0, 0, 2, 0, 0, 0, 0, 2, 0, 0, 0, 0, 1))).toBe(true);
        const expected = new TestMatrix4x4(2, 0, 0, 0, 0, 2, 0, 0, 0, 0, 2, 0, 2, 3, 4, 1);
        expect(m1.equals(expected)).toBe(true);
      });

      it('should throw error when multiplying incompatible matrices', () => {
        const m1 = new TestMatrix3x4(1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12);
        const m2 = new TestMatrix2x2(1, 2, 3, 4);
        expect(() => m1.multiply(m2 as any)).toThrow('Matrix multiplication incompatible');
      });

      it('should multiply by identity matrix (no-op)', () => {
        const m1 = new TestMatrix4x4(1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16);
        const identity = new TestMatrix4x4().makeIdentity();
        const original = m1.clone();
        m1.multiply(identity);
        expect(m1.equals(original)).toBe(true);
      });

      it('should handle NaN in multiply()', () => {
        const m1 = new TestMatrix2x2(NaN, 1, 2, 3);
        const m2 = new TestMatrix2x2(1, 0, 0, 1).makeIdentity();
        m1.multiply(m2);
        expect(Number.isNaN(m1.get(0, 0))).toBe(true);
      });

      it('should handle Infinity in multiply()', () => {
        const m1 = new TestMatrix2x2(Infinity, 1, 2, 3);
        const m2 = new TestMatrix2x2(1, 0, 0, 1).makeIdentity();
        m1.multiply(m2);
        expect(m1.get(0, 0)).toBe(Infinity);
      });
    });
  });

  describe('multiplyMatrices()', () => {
    it('should multiply 4x3 and 3x4 matrices and return 4x4 matrix', () => {
      const a = new TestMatrix3x4(1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12);
      const b = new TestMatrix4x3(1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12);
      const result = new Matrix4();
      const expected = new Matrix4(
        1 * 1 + 2 * 5 + 3 * 9, 1 * 2 + 2 * 6 + 3 * 10, 1 * 3 + 2 * 7 + 3 * 11, 1 * 4 + 2 * 8 + 3 * 12,
        4 * 1 + 5 * 5 + 6 * 9, 4 * 2 + 5 * 6 + 6 * 10, 4 * 3 + 5 * 7 + 6 * 11, 4 * 4 + 5 * 8 + 6 * 12,
        7 * 1 + 8 * 5 + 9 * 9, 7 * 2 + 8 * 6 + 9 * 10, 7 * 3 + 8 * 7 + 9 * 11, 7 * 4 + 8 * 8 + 9 * 12,
        10 * 1 + 11 * 5 + 12 * 9, 10 * 2 + 11 * 6 + 12 * 10, 10 * 3 + 11 * 7 + 12 * 11, 10 * 4 + 11 * 8 + 12 * 12
      );
      result.multiplyMatrices(a, b);
      expect(result.equals(expected)).toBe(true);
    });

    it('should multiply non-square matrix with square matrix', () => {
      const a = new TestMatrix3x2(1, 2, 3, 4, 5, 6);
      const b = new TestMatrix3x3(7, 8, 9, 10, 11, 12, 13, 14, 15);
      const result = new TestMatrix3x2();
      result.multiplyMatrices(a, b);
      const expected = new TestMatrix3x2(
        1 * 7 + 3 * 8 + 5 * 9, 2 * 7 + 4 * 8 + 6 * 9,
        1 * 10 + 3 * 11 + 5 * 12, 2 * 10 + 4 * 11 + 6 * 12,
        1 * 13 + 3 * 14 + 5 * 15, 2 * 13 + 4 * 14 + 6 * 15
      );
      expect(result.equals(expected)).toBe(true);
    });

    it('should multiply two 2x2 matrices', () => {
      const a = new TestMatrix2x2(1, 3, 2, 4);
      const b = new TestMatrix2x2(5, 7, 6, 8);
      const result = new TestMatrix2x2();
      const expected = new TestMatrix2x2(19, 43, 22, 50);
      result.multiplyMatrices(a, b);
      expect(result.equals(expected)).toBe(true);
    });

    it('should return original matrix when multiplying by identity matrix', () => {
      const a = new TestMatrix3x2(1, 2, 3, 4, 5, 6);
      const identity = new TestMatrix3x3().makeIdentity();
      const result = new TestMatrix3x2();
      result.multiplyMatrices(a, identity);
      const expected = new TestMatrix3x2(1, 2, 3, 4, 5, 6);
      expect(result.equals(expected)).toBe(true);
    });

    it('should return original matrix when multiplying identity matrix by non-square matrix', () => {
      const a = new TestMatrix4x3(1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12);
      const identity = new TestMatrix4x4().makeIdentity();
      const result = new TestMatrix4x3();
      result.multiplyMatrices(a, identity);
      const expected = new TestMatrix4x3(1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12);
      expect(result.equals(expected)).toBe(true);
    });

    it('should throw error for incompatible sizes', () => {
      const a = new TestMatrix3x2();
      const b = new TestMatrix2x2();
      const result = new TestMatrix2x2();
      expect(() => {
        result.multiplyMatrices(a, b);
      }).toThrow('incompatible');
    });

    it('should throw error when result matrix size does not match expected size', () => {
      const a = new TestMatrix3x4(1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12);
      const b = new TestMatrix4x3(1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12);
      const result = new TestMatrix2x2();
      expect(() => {
        result.multiplyMatrices(a, b);
      }).toThrow('Result matrix size mismatch: expected 4x4, got 2x2');
    });

    it('should multiply by zero matrix (result is zero)', () => {
      const a = new TestMatrix4x4(1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16);
      const zero = new TestMatrix4x4();
      const result = new TestMatrix4x4();
      result.multiplyMatrices(a, zero);
      const expectedZero = new TestMatrix4x4();
      expect(result.equals(expectedZero)).toBe(true);
    });

    it('should multiply zero matrix by another matrix (result is zero)', () => {
      const zero = new TestMatrix4x4();
      const b = new TestMatrix4x4(1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16);
      const result = new TestMatrix4x4();
      result.multiplyMatrices(zero, b);
      const expectedZero = new TestMatrix4x4();
      expect(result.equals(expectedZero)).toBe(true);
    });
  });

  describe('makeIdentity()', () => {
    it('should create identity matrix for square matrix', () => {
      const m = new TestMatrix3x3();
      const expected = new TestMatrix3x3(1, 0, 0, 0, 1, 0, 0, 0, 1);
      m.makeIdentity();
      expect(m.equals(expected)).toBe(true);
    });

    it('should create identity for non-square matrices (min diagonal)', () => {
      const m = new TestMatrix3x4();
      m.makeIdentity();
      expect(m.get(0, 0)).toBe(1);
      expect(m.get(1, 1)).toBe(1);
      expect(m.get(2, 2)).toBe(1);
      expect(m.get(2, 3)).toBe(0);
      expect(m.get(0, 3)).toBe(0);
    });

    it('should zero all elements before setting diagonal', () => {
      const m = new TestMatrix3x3(5, 5, 5, 5, 5, 5, 5, 5, 5);
      m.makeIdentity();
      expect(m.get(0, 1)).toBe(0);
      expect(m.get(1, 0)).toBe(0);
    });

    it('should be idempotent (calling multiple times)', () => {
      const m = new TestMatrix3x3(5, 5, 5, 5, 5, 5, 5, 5, 5);
      m.makeIdentity();
      const firstCall = m.clone();
      m.makeIdentity();
      expect(m.equals(firstCall)).toBe(true);
    });

    it('should work on matrix with existing values', () => {
      const m = new TestMatrix3x3(10, 20, 30, 40, 50, 60, 70, 80, 90);
      m.makeIdentity();
      const expected = new TestMatrix3x3(1, 0, 0, 0, 1, 0, 0, 0, 1);
      expect(m.equals(expected)).toBe(true);
    });
  });

  describe('Static Factory Methods', () => {
    describe('zero()', () => {
      it('should create zero matrix', () => {
        const m = Matrix.zero.call(TestMatrix3x4);
        expect(m.elements.every(v => v === 0)).toBe(true);
        expect(m.size).toBe(12);
      });

      it('should create zero matrix for different dimensions', () => {
        const m2x2 = Matrix.zero.call(TestMatrix2x2);
        expect(m2x2.elements.every(v => v === 0)).toBe(true);
        expect(m2x2.size).toBe(4);
      });
    });

    describe('fromArray()', () => {
      it('should create matrix from array', () => {
        const arr = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
        const m = Matrix.fromArray.call(TestMatrix3x4, arr);
        expect(m.elements).toEqual(new Float32Array(arr));
      });

      it('should create matrix from Float32Array', () => {
        const arr = new Float32Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
        const m = Matrix.fromArray.call(TestMatrix3x4, arr);
        expect(m.elements).toEqual(arr);
      });

      it('should create zero matrix for empty array', () => {
        const m = Matrix.fromArray.call(TestMatrix3x4, []);
        const zero = new TestMatrix3x4();
        expect(m.equals(zero)).toBe(true);
      });

      it('should accept NaN values', () => {
        const arr = [NaN, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
        const m = Matrix.fromArray.call(TestMatrix3x4, arr);
        expect(Number.isNaN(m.get(0, 0))).toBe(true);
        expect(m.get(0, 1)).toBe(2);
      });

      it('should accept Infinity values', () => {
        const arr = [Infinity, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
        const m = Matrix.fromArray.call(TestMatrix3x4, arr);
        expect(m.get(0, 0)).toBe(Infinity);
        expect(m.get(0, 1)).toBe(2);
      });

      it('should accept array-like objects', () => {
        const arrayLike = {
          length: 12,
          0: 1, 1: 2, 2: 3, 3: 4, 4: 5, 5: 6,
          6: 7, 7: 8, 8: 9, 9: 10, 10: 11, 11: 12
        };
        const m = Matrix.fromArray.call(TestMatrix3x4, arrayLike);
        expect(m.get(0, 0)).toBe(1);
        expect(m.get(0, 1)).toBe(2);
      });
    });

    describe('fromElements()', () => {
      it('should create matrix from array-like', () => {
        const arr = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
        const m = Matrix.fromElements.call(TestMatrix3x4, arr);
        expect(m.elements).toEqual(new Float32Array(arr));
      });

      it('should create matrix from Float32Array', () => {
        const arr = new Float32Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
        const m = Matrix.fromElements.call(TestMatrix3x4, arr);
        expect(m.elements).toEqual(arr);
      });

      it('should be equivalent to fromArray()', () => {
        const arr = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
        const m1 = Matrix.fromArray.call(TestMatrix3x4, arr);
        const m2 = Matrix.fromElements.call(TestMatrix3x4, arr);
        expect(m1.equals(m2)).toBe(true);
      });

      it('should create zero matrix for empty array', () => {
        const m = Matrix.fromElements.call(TestMatrix3x4, []);
        const zero = new TestMatrix3x4();
        expect(m.equals(zero)).toBe(true);
      });

      it('should accept NaN values', () => {
        const arr = [NaN, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
        const m = Matrix.fromElements.call(TestMatrix3x4, arr);
        expect(Number.isNaN(m.get(0, 0))).toBe(true);
        expect(m.get(0, 1)).toBe(2);
      });

      it('should accept Infinity values', () => {
        const arr = [Infinity, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
        const m = Matrix.fromElements.call(TestMatrix3x4, arr);
        expect(m.get(0, 0)).toBe(Infinity);
        expect(m.get(0, 1)).toBe(2);
      });
    });
  });

  describe('Static Arithmetic Methods', () => {
    describe('add()', () => {
      it('should add matrices without mutation', () => {
        const a = new TestMatrix3x4(1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12);
        const b = new TestMatrix3x4(1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1);
        const originalA = a.clone();
        const originalB = b.clone();
        const result = Matrix.add.call(TestMatrix3x4, a, b);
        const expected = new TestMatrix3x4(2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13);
        expect(result.equals(expected)).toBe(true);
        expect(a.equals(originalA)).toBe(true);
        expect(b.equals(originalB)).toBe(true);
      });

      it('should throw error when adding matrices of different sizes', () => {
        const a = new TestMatrix3x4(1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12);
        const b = new TestMatrix2x2(1, 2, 3, 4);
        expect(() => Matrix.add.call(TestMatrix3x4, a, b as any)).toThrow('Matrices must have the same size');
      });
    });

    describe('subtract()', () => {
      it('should subtract matrices without mutation', () => {
        const a = new TestMatrix3x4(10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10);
        const b = new TestMatrix3x4(1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12);
        const originalA = a.clone();
        const originalB = b.clone();
        const result = Matrix.subtract.call(TestMatrix3x4, a, b);
        const expected = new TestMatrix3x4(9, 8, 7, 6, 5, 4, 3, 2, 1, 0, -1, -2);
        expect(result.equals(expected)).toBe(true);
        expect(a.equals(originalA)).toBe(true);
        expect(b.equals(originalB)).toBe(true);
      });

      it('should throw error when subtracting matrices of different sizes', () => {
        const a = new TestMatrix3x4(1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12);
        const b = new TestMatrix2x2(1, 2, 3, 4);
        expect(() => Matrix.subtract.call(TestMatrix3x4, a, b as any)).toThrow('Matrices must have the same size');
      });
    });

    describe('multiply()', () => {
      it('should multiply matrices without mutation', () => {
        const a = new TestMatrix4x4(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 2, 3, 4, 1);
        const b = new TestMatrix4x4(2, 0, 0, 0, 0, 2, 0, 0, 0, 0, 2, 0, 0, 0, 0, 1);
        const originalA = a.clone();
        const originalB = b.clone();
        const result = Matrix.multiply.call(TestMatrix4x4, a, b);
        const expected = new TestMatrix4x4(2, 0, 0, 0, 0, 2, 0, 0, 0, 0, 2, 0, 2, 3, 4, 1);
        expect(result.equals(expected)).toBe(true);
        expect(a.equals(originalA)).toBe(true);
        expect(b.equals(originalB)).toBe(true);
      });

      it('should throw error when multiplying incompatible matrices', () => {
        const a = new TestMatrix3x4(1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12);
        const b = new TestMatrix2x2(1, 2, 3, 4);
        expect(() => Matrix.multiply.call(TestMatrix3x4, a, b as any)).toThrow('Matrix multiplication incompatible');
      });
    });
  });

  describe('static transpose()', () => {
    it('should transpose non-square matrix and return swapped dimensions', () => {
      const m = new TestMatrix4x3(1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12);
      const expected = new TestMatrix3x4(1, 4, 7, 10, 2, 5, 8, 11, 3, 6, 9, 12);
      const transposed = Matrix.transpose(m);
      expect(transposed instanceof TestMatrix3x4).toBe(true);
      expect(transposed.equals(expected)).toBe(true);
    });

    it('should transpose square matrix and return same matrix size', () => {
      const m = new TestMatrix3x3(1, 2, 3, 4, 5, 6, 7, 8, 9);
      const expected = new TestMatrix3x3(1, 4, 7, 2, 5, 8, 3, 6, 9);
      const transposed = Matrix.transpose(m);
      expect(transposed.equals(expected)).toBe(true);
    });

    it('should use TransposeType property', () => {
      const m = new Matrix4();
      const transposed = Matrix.transpose(m);
      expect(transposed instanceof Matrix4).toBe(true);
    });

    it('should throw error when TransposeType is missing', () => {
      class MatrixWithoutTransposeType extends Matrix {
        get rows(): number {
          return 2;
        }
        get columns(): number {
          return 2;
        }
        constructor(...elements: number[]) {
          super(...elements);
          this._validateSize();
          return this._setupProxy();
        }
      }

      const m = new MatrixWithoutTransposeType(1, 2, 3, 4);
      expect(() => Matrix.transpose(m)).toThrow('must declare static readonly TransposeType property');
    });

    it('should use fromArray when fromElements is not available', () => {
      class MatrixWithOnlyFromArray extends Matrix {
        get rows(): number {
          return 2;
        }
        get columns(): number {
          return 2;
        }
        static get TransposeType() {
          return MatrixWithOnlyFromArray;
        }
        static fromArray<T extends Matrix>(this: new (...args: any[]) => T, array: ArrayLike<number>): T {
          return new this(...Array.from(array)) as T;
        }
        constructor(...elements: number[]) {
          super(...elements);
          this._validateSize();
          return this._setupProxy();
        }
      }

      const m = new MatrixWithOnlyFromArray(1, 2, 3, 4);
      const transposed = Matrix.transpose(m);
      expect(transposed).toBeInstanceOf(MatrixWithOnlyFromArray);
      expect(transposed.get(0, 0)).toBe(1);
      expect(transposed.get(1, 0)).toBe(2);
      expect(transposed.get(0, 1)).toBe(3);
      expect(transposed.get(1, 1)).toBe(4);
    });

    it('should throw error when transpose result has wrong dimensions', () => {
      class MatrixA extends Matrix {
        get rows(): number {
          return 2;
        }
        get columns(): number {
          return 3;
        }
        static get TransposeType() {
          return MatrixB;
        }
        constructor(...elements: number[]) {
          super(...elements);
          this._validateSize();
          return this._setupProxy();
        }
      }

      class MatrixB extends Matrix {
        get rows(): number {
          return 2;
        }
        get columns(): number {
          return 2;
        }
        static get TransposeType() {
          return MatrixA;
        }
        static fromElements<T extends Matrix>(this: new (...args: any[]) => T, elements: ArrayLike<number>): T {
          return new this(...Array.from(elements)) as T;
        }
        constructor(...elements: number[]) {
          super(...elements);
          this._validateSize();
          return this._setupProxy();
        }
      }

      const m = new MatrixA(1, 2, 3, 4, 5, 6);
      expect(() => Matrix.transpose(m)).toThrow('Matrix elements array size mismatch: expected 4 elements (2x2) for MatrixB, got');
    });
  });

  // ============================================================================
  // Type Checking Methods
  // ============================================================================

  describe('Type Checking Methods', () => {
    describe('isFinite()', () => {
      it('returns true for finite values', () => {
        const m = new TestMatrix2x2(1.5, -2.5, 3.5, -4.5);
        expect(m.isFinite()).toBe(true);
      });

      it('returns false if any element is NaN', () => {
        const m = new TestMatrix2x2(1, NaN, 3, 4);
        expect(m.isFinite()).toBe(false);
      });

      it('returns false if any element is Infinity', () => {
        const m = new TestMatrix2x2(1, Infinity, 3, 4);
        expect(m.isFinite()).toBe(false);
      });

      it('returns false if any element is -Infinity', () => {
        const m = new TestMatrix2x2(1, -Infinity, 3, 4);
        expect(m.isFinite()).toBe(false);
      });
    });

    describe('isInteger()', () => {
      it('returns true for integer values', () => {
        const m = new TestMatrix2x2(1, 2, 3, 4);
        expect(m.isInteger()).toBe(true);
      });

      it('returns false if any element is not an integer', () => {
        const m = new TestMatrix2x2(1, 2.5, 3, 4);
        expect(m.isInteger()).toBe(false);
      });

      it('returns false for NaN or Infinity', () => {
        expect(new TestMatrix2x2(1, NaN, 3, 4).isInteger()).toBe(false);
        expect(new TestMatrix2x2(1, Infinity, 3, 4).isInteger()).toBe(false);
      });
    });

    describe('isUnsignedInteger()', () => {
      it('returns true for non-negative integer values', () => {
        const m = new TestMatrix2x2(0, 1, 2, 3);
        expect(m.isUnsignedInteger()).toBe(true);
      });

      it('returns false if any element is negative', () => {
        const m = new TestMatrix2x2(1, -2, 3, 4);
        expect(m.isUnsignedInteger()).toBe(false);
      });

      it('returns false if any element is not an integer', () => {
        const m = new TestMatrix2x2(1, 2.5, 3, 4);
        expect(m.isUnsignedInteger()).toBe(false);
      });

      it('returns false for NaN or Infinity', () => {
        expect(new TestMatrix2x2(1, NaN, 3, 4).isUnsignedInteger()).toBe(false);
        expect(new TestMatrix2x2(1, Infinity, 3, 4).isUnsignedInteger()).toBe(false);
      });
    });
  });

  // ============================================================================
  // Rounding Methods
  // ============================================================================

  describe('Rounding Methods', () => {
    describe('truncate()', () => {
      it('truncates positive values toward zero', () => {
        const m = new TestMatrix2x2(1.7, 2.3, 3.9, 4.1);
        m.truncate();
        expect(m.get(0, 0)).toBe(1);
        expect(m.get(0, 1)).toBe(2);
        expect(m.get(1, 0)).toBe(3);
        expect(m.get(1, 1)).toBe(4);
      });

      it('truncates negative values toward zero', () => {
        const m = new TestMatrix2x2(-1.7, -2.3, -3.9, -4.1);
        m.truncate();
        expect(m.get(0, 0)).toBe(-1);
        expect(m.get(0, 1)).toBe(-2);
        expect(m.get(1, 0)).toBe(-3);
        expect(m.get(1, 1)).toBe(-4);
      });

      it('returns this for chaining', () => {
        const m = new TestMatrix2x2(1.5, 2.5, 3.5, 4.5);
        expect(m.truncate()).toBe(m);
      });

      it('throws for NaN', () => {
        const m = new TestMatrix2x2(1, NaN, 3, 4);
        expect(() => m.truncate()).toThrow('non-finite');
      });

      it('throws for Infinity', () => {
        const m = new TestMatrix2x2(1, Infinity, 3, 4);
        expect(() => m.truncate()).toThrow('non-finite');
      });

      it('static version returns new matrix', () => {
        const m = new TestMatrix2x2(1.7, -2.3, 3.9, -4.1);
        const result = Matrix.truncate(m);
        expect(result).not.toBe(m);
        expect(result.get(0, 0)).toBe(1);
        expect(result.get(0, 1)).toBe(-2);
        expect(m.get(0, 0)).toBeCloseTo(1.7, 5); // Original unchanged
      });
    });

    describe('floor()', () => {
      it('floors positive values toward negative infinity', () => {
        const m = new TestMatrix2x2(1.7, 2.3, 3.9, 4.1);
        m.floor();
        expect(m.get(0, 0)).toBe(1);
        expect(m.get(0, 1)).toBe(2);
        expect(m.get(1, 0)).toBe(3);
        expect(m.get(1, 1)).toBe(4);
      });

      it('floors negative values toward negative infinity', () => {
        const m = new TestMatrix2x2(-1.7, -2.3, -3.9, -4.1);
        m.floor();
        expect(m.get(0, 0)).toBe(-2);
        expect(m.get(0, 1)).toBe(-3);
        expect(m.get(1, 0)).toBe(-4);
        expect(m.get(1, 1)).toBe(-5);
      });

      it('returns this for chaining', () => {
        const m = new TestMatrix2x2(1.5, 2.5, 3.5, 4.5);
        expect(m.floor()).toBe(m);
      });

      it('throws for NaN', () => {
        const m = new TestMatrix2x2(1, NaN, 3, 4);
        expect(() => m.floor()).toThrow('non-finite');
      });

      it('throws for Infinity', () => {
        const m = new TestMatrix2x2(1, Infinity, 3, 4);
        expect(() => m.floor()).toThrow('non-finite');
      });

      it('static version returns new matrix', () => {
        const m = new TestMatrix2x2(1.7, -2.3, 3.9, -4.1);
        const result = Matrix.floor(m);
        expect(result).not.toBe(m);
        expect(result.get(0, 0)).toBe(1);
        expect(result.get(0, 1)).toBe(-3);
        expect(m.get(0, 1)).toBeCloseTo(-2.3, 5); // Original unchanged
      });
    });

    describe('ceil()', () => {
      it('ceils positive values toward positive infinity', () => {
        const m = new TestMatrix2x2(1.1, 2.3, 3.9, 4.1);
        m.ceil();
        expect(m.get(0, 0)).toBe(2);
        expect(m.get(0, 1)).toBe(3);
        expect(m.get(1, 0)).toBe(4);
        expect(m.get(1, 1)).toBe(5);
      });

      it('ceils negative values toward positive infinity', () => {
        const m = new TestMatrix2x2(-1.7, -2.3, -3.9, -4.1);
        m.ceil();
        expect(m.get(0, 0)).toBe(-1);
        expect(m.get(0, 1)).toBe(-2);
        expect(m.get(1, 0)).toBe(-3);
        expect(m.get(1, 1)).toBe(-4);
      });

      it('returns this for chaining', () => {
        const m = new TestMatrix2x2(1.5, 2.5, 3.5, 4.5);
        expect(m.ceil()).toBe(m);
      });

      it('throws for NaN', () => {
        const m = new TestMatrix2x2(1, NaN, 3, 4);
        expect(() => m.ceil()).toThrow('non-finite');
      });

      it('throws for Infinity', () => {
        const m = new TestMatrix2x2(1, Infinity, 3, 4);
        expect(() => m.ceil()).toThrow('non-finite');
      });

      it('static version returns new matrix', () => {
        const m = new TestMatrix2x2(1.1, -2.3, 3.9, -4.1);
        const result = Matrix.ceil(m);
        expect(result).not.toBe(m);
        expect(result.get(0, 0)).toBe(2);
        expect(result.get(0, 1)).toBe(-2);
        expect(m.get(0, 0)).toBeCloseTo(1.1, 5); // Original unchanged
      });
    });

    describe('round()', () => {
      it('rounds to nearest integer', () => {
        const m = new TestMatrix2x2(1.4, 2.5, 3.6, 4.4);
        m.round();
        expect(m.get(0, 0)).toBe(1);
        expect(m.get(0, 1)).toBe(3); // 2.5 rounds up
        expect(m.get(1, 0)).toBe(4);
        expect(m.get(1, 1)).toBe(4);
      });

      it('rounds negative values', () => {
        const m = new TestMatrix2x2(-1.4, -2.5, -3.6, -4.4);
        m.round();
        expect(m.get(0, 0)).toBe(-1);
        expect(m.get(0, 1)).toBe(-2); // -2.5 rounds toward positive
        expect(m.get(1, 0)).toBe(-4);
        expect(m.get(1, 1)).toBe(-4);
      });

      it('returns this for chaining', () => {
        const m = new TestMatrix2x2(1.5, 2.5, 3.5, 4.5);
        expect(m.round()).toBe(m);
      });

      it('throws for NaN', () => {
        const m = new TestMatrix2x2(1, NaN, 3, 4);
        expect(() => m.round()).toThrow('non-finite');
      });

      it('throws for Infinity', () => {
        const m = new TestMatrix2x2(1, Infinity, 3, 4);
        expect(() => m.round()).toThrow('non-finite');
      });

      it('static version returns new matrix', () => {
        const m = new TestMatrix2x2(1.4, 2.5, -3.5, 4.6);
        const result = Matrix.round(m);
        expect(result).not.toBe(m);
        expect(result.get(0, 0)).toBe(1);
        expect(result.get(0, 1)).toBe(3);
        expect(m.get(0, 0)).toBeCloseTo(1.4, 5); // Original unchanged
      });
    });

    describe('expand()', () => {
      it('expands positive values away from zero (ceil)', () => {
        const m = new TestMatrix2x2(1.1, 2.1, 3.1, 4.1);
        m.expand();
        expect(m.get(0, 0)).toBe(2);
        expect(m.get(0, 1)).toBe(3);
        expect(m.get(1, 0)).toBe(4);
        expect(m.get(1, 1)).toBe(5);
      });

      it('expands negative values away from zero (floor)', () => {
        const m = new TestMatrix2x2(-1.1, -2.1, -3.1, -4.1);
        m.expand();
        expect(m.get(0, 0)).toBe(-2);
        expect(m.get(0, 1)).toBe(-3);
        expect(m.get(1, 0)).toBe(-4);
        expect(m.get(1, 1)).toBe(-5);
      });

      it('handles zero', () => {
        const m = new TestMatrix2x2(0, 1.1, -1.1, 0);
        m.expand();
        expect(m.get(0, 0)).toBe(0);
        expect(m.get(0, 1)).toBe(2);
        expect(m.get(1, 0)).toBe(-2);
        expect(m.get(1, 1)).toBe(0);
      });

      it('returns this for chaining', () => {
        const m = new TestMatrix2x2(1.5, 2.5, 3.5, 4.5);
        expect(m.expand()).toBe(m);
      });

      it('throws for NaN', () => {
        const m = new TestMatrix2x2(1, NaN, 3, 4);
        expect(() => m.expand()).toThrow('non-finite');
      });

      it('throws for Infinity', () => {
        const m = new TestMatrix2x2(1, Infinity, 3, 4);
        expect(() => m.expand()).toThrow('non-finite');
      });

      it('static version returns new matrix', () => {
        const m = new TestMatrix2x2(1.1, -2.1, 0, 3.9);
        const result = Matrix.expand(m);
        expect(result).not.toBe(m);
        expect(result.get(0, 0)).toBe(2);
        expect(result.get(0, 1)).toBe(-3);
        expect(result.get(1, 0)).toBe(0);
        expect(m.get(0, 0)).toBeCloseTo(1.1, 5); // Original unchanged
      });
    });
  });

  // ============================================================================
  // Clamping Methods
  // ============================================================================

  describe('Clamping Methods', () => {
    describe('clampNonNegative()', () => {
      it('keeps positive values unchanged', () => {
        const m = new TestMatrix2x2(1.5, 2.5, 3.5, 4.5);
        m.clampNonNegative();
        expect(m.get(0, 0)).toBeCloseTo(1.5, 5);
        expect(m.get(0, 1)).toBeCloseTo(2.5, 5);
      });

      it('clamps negative values to 0', () => {
        const m = new TestMatrix2x2(-1.5, -2.5, 3.5, -4.5);
        m.clampNonNegative();
        expect(m.get(0, 0)).toBe(0);
        expect(m.get(0, 1)).toBe(0);
        expect(m.get(1, 0)).toBeCloseTo(3.5, 5);
        expect(m.get(1, 1)).toBe(0);
      });

      it('returns this for chaining', () => {
        const m = new TestMatrix2x2(1.5, -2.5, 3.5, -4.5);
        expect(m.clampNonNegative()).toBe(m);
      });

      it('throws for NaN', () => {
        const m = new TestMatrix2x2(1, NaN, 3, 4);
        expect(() => m.clampNonNegative()).toThrow('non-finite');
      });

      it('throws for Infinity', () => {
        const m = new TestMatrix2x2(1, -Infinity, 3, 4);
        expect(() => m.clampNonNegative()).toThrow('non-finite');
      });

      it('static version returns new matrix', () => {
        const m = new TestMatrix2x2(1.5, -2.5, 3.5, -4.5);
        const result = Matrix.clampNonNegative(m);
        expect(result).not.toBe(m);
        expect(result.get(0, 0)).toBeCloseTo(1.5, 5);
        expect(result.get(0, 1)).toBe(0);
        expect(m.get(0, 1)).toBeCloseTo(-2.5, 5); // Original unchanged
      });
    });
  });

  // ============================================================================
  // Integer Conversion Methods
  // ============================================================================

  describe('Integer Conversion Methods', () => {
    describe('toInt()', () => {
      it('truncates to integers', () => {
        const m = new TestMatrix2x2(1.7, -2.3, 3.9, -4.1);
        m.toInt();
        expect(m.get(0, 0)).toBe(1);
        expect(m.get(0, 1)).toBe(-2);
        expect(m.get(1, 0)).toBe(3);
        expect(m.get(1, 1)).toBe(-4);
      });

      it('returns this for chaining', () => {
        const m = new TestMatrix2x2(1.5, -2.5, 3.5, -4.5);
        expect(m.toInt()).toBe(m);
      });

      it('throws for NaN', () => {
        const m = new TestMatrix2x2(1, NaN, 3, 4);
        expect(() => m.toInt()).toThrow('non-finite');
      });

      it('throws for Infinity', () => {
        const m = new TestMatrix2x2(1, -Infinity, 3, 4);
        expect(() => m.toInt()).toThrow('non-finite');
      });

      it('static version returns new matrix', () => {
        const m = new TestMatrix2x2(1.7, -2.3, 3.9, -4.1);
        const result = Matrix.toInt(m);
        expect(result).not.toBe(m);
        expect(result.get(0, 0)).toBe(1);
        expect(result.get(0, 1)).toBe(-2);
        expect(m.get(0, 0)).toBeCloseTo(1.7, 5); // Original unchanged
      });
    });

    describe('toUint()', () => {
      it('clamps negatives to 0 and truncates', () => {
        const m = new TestMatrix2x2(1.7, -2.3, 3.9, -4.1);
        m.toUint();
        expect(m.get(0, 0)).toBe(1);
        expect(m.get(0, 1)).toBe(0);
        expect(m.get(1, 0)).toBe(3);
        expect(m.get(1, 1)).toBe(0);
      });

      it('handles all negative values', () => {
        const m = new TestMatrix2x2(-1.7, -2.3, -3.9, -4.1);
        m.toUint();
        expect(m.get(0, 0)).toBe(0);
        expect(m.get(0, 1)).toBe(0);
        expect(m.get(1, 0)).toBe(0);
        expect(m.get(1, 1)).toBe(0);
      });

      it('returns this for chaining', () => {
        const m = new TestMatrix2x2(1.5, -2.5, 3.5, -4.5);
        expect(m.toUint()).toBe(m);
      });

      it('throws for NaN', () => {
        const m = new TestMatrix2x2(1, NaN, 3, 4);
        expect(() => m.toUint()).toThrow('non-finite');
      });

      it('throws for Infinity', () => {
        const m = new TestMatrix2x2(1, -Infinity, 3, 4);
        expect(() => m.toUint()).toThrow('non-finite');
      });

      it('static version returns new matrix', () => {
        const m = new TestMatrix2x2(1.7, -2.3, 3.9, -4.1);
        const result = Matrix.toUint(m);
        expect(result).not.toBe(m);
        expect(result.get(0, 0)).toBe(1);
        expect(result.get(0, 1)).toBe(0);
        expect(m.get(0, 1)).toBeCloseTo(-2.3, 5); // Original unchanged
      });
    });

    describe('chaining rounding methods', () => {
      it('supports chaining multiple operations', () => {
        const m = new TestMatrix2x2(1.7, -2.3, 3.9, -4.1);
        const result = m.clone().clampNonNegative().floor();
        expect(result.get(0, 0)).toBe(1);
        expect(result.get(0, 1)).toBe(0);
        expect(result.get(1, 0)).toBe(3);
        expect(result.get(1, 1)).toBe(0);
      });

      it('can use alternative rounding with toUint pattern', () => {
        const m = new TestMatrix2x2(1.7, -2.3, 3.9, -4.1);
        // Round instead of truncate
        const result = m.clone().clampNonNegative().round();
        expect(result.get(0, 0)).toBe(2); // 1.7 rounds to 2
        expect(result.get(0, 1)).toBe(0); // -2.3 clamped to 0
        expect(result.get(1, 0)).toBe(4); // 3.9 rounds to 4
        expect(result.get(1, 1)).toBe(0); // -4.1 clamped to 0
      });
    });
  });
});
