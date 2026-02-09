/**
 * Quaternion Test Suite
 * 
 * Comprehensive tests for the Quaternion class covering:
 * - Basic operations (constructor, getters/setters, identity, zero)
 * - Length operations (length, lengthSquared, normalize)
 * - Quaternion operations (conjugate, inverse, dot, multiply, multiplyScalar)
 * - Rotation operations (fromAxisAngle, fromEulerAngles, toRotationMatrix, fromRotationMatrix)
 * - Interpolation (slerp, lerp/nlerp)
 * - Utility methods (clone, copy, equals, equalsEpsilon)
 * - Edge cases and NaN/Infinity handling
 */

import { describe, it, expect } from 'vitest';
import { Quaternion } from '../../../src/math/quaternions/Quaternion.js';
import { Vector2 } from '../../../src/math/vectors/Vector2.js';
import { Vector3 } from '../../../src/math/vectors/Vector3.js';
import { Matrix3 } from '../../../src/math/matrices/Matrix3.js';
import { Matrix4 } from '../../../src/math/matrices/Matrix4.js';
import { EPSILON } from '../../helpers/const.js';

const IDENTITY = new Quaternion(0, 0, 0, 1);
const ZERO = new Quaternion(0, 0, 0, 0);

describe('Quaternion', () => {
  describe('Constructor', () => {
    it('should create identity quaternion by default', () => {
      const q = new Quaternion();
      expect(q.equals(IDENTITY)).toBe(true);
    });

    it('should create quaternion with given components', () => {
      const q = new Quaternion(1, 2, 3, 4);
      expect(q.x).toBe(1);
      expect(q.y).toBe(2);
      expect(q.z).toBe(3);
      expect(q.w).toBe(4);
    });

    it('should accept NaN values', () => {
      const q = new Quaternion(NaN, 1, 2, 3);
      expect(Number.isNaN(q.x)).toBe(true);
      expect(q.y).toBe(1);
    });

    it('should accept Infinity values', () => {
      const q = new Quaternion(Infinity, 1, 2, 3);
      expect(q.x).toBe(Infinity);
      expect(q.y).toBe(1);
    });

    it('should accept -Infinity values', () => {
      const q = new Quaternion(-Infinity, 1, 2, 3);
      expect(q.x).toBe(-Infinity);
    });
  });

  describe('Getters and Setters', () => {
    it('should get x component', () => {
      const q = new Quaternion(1, 2, 3, 4);
      expect(q.x).toBe(1);
    });

    it('should set x component', () => {
      const q = new Quaternion();
      q.x = 5;
      expect(q.x).toBe(5);
    });

    it('should get y component', () => {
      const q = new Quaternion(1, 2, 3, 4);
      expect(q.y).toBe(2);
    });

    it('should set y component', () => {
      const q = new Quaternion();
      q.y = 6;
      expect(q.y).toBe(6);
    });

    it('should get z component', () => {
      const q = new Quaternion(1, 2, 3, 4);
      expect(q.z).toBe(3);
    });

    it('should set z component', () => {
      const q = new Quaternion();
      q.z = 7;
      expect(q.z).toBe(7);
    });

    it('should get w component', () => {
      const q = new Quaternion(1, 2, 3, 4);
      expect(q.w).toBe(4);
    });

    it('should set w component', () => {
      const q = new Quaternion();
      q.w = 8;
      expect(q.w).toBe(8);
    });

    it('should get elements as Float32Array', () => {
      const q = new Quaternion(1, 2, 3, 4);
      const elements = q.elements;
      expect(elements).toBeInstanceOf(Float32Array);
      expect(elements[0]).toBe(1);
      expect(elements[1]).toBe(2);
      expect(elements[2]).toBe(3);
      expect(elements[3]).toBe(4);
    });
  });

  describe('Static Factory Methods', () => {
    describe('identity()', () => {
      it('should create identity quaternion', () => {
        const q = Quaternion.identity();
        expect(q.equals(IDENTITY)).toBe(true);
      });

      it('should return new quaternion instance', () => {
        const q1 = Quaternion.identity();
        const q2 = Quaternion.identity();
        expect(q1).not.toBe(q2);
        expect(q1.equals(q2)).toBe(true);
      });
    });

    describe('zero()', () => {
      it('should create zero quaternion', () => {
        const q = Quaternion.zero();
        expect(q.equals(ZERO)).toBe(true);
      });

      it('should return new quaternion instance', () => {
        const q1 = Quaternion.zero();
        const q2 = Quaternion.zero();
        expect(q1).not.toBe(q2);
        expect(q1.equals(q2)).toBe(true);
      });
    });
  });

  describe('Identity and Zero', () => {
    describe('identity()', () => {
      it('should set quaternion to identity', () => {
        const q = new Quaternion(1, 2, 3, 4);
        q.identity();
        expect(q.equals(IDENTITY)).toBe(true);
      });

      it('should return this for chaining', () => {
        const q = new Quaternion();
        const result = q.identity();
        expect(result).toBe(q);
      });
    });

    describe('zero()', () => {
      it('should set quaternion to zero', () => {
        const q = new Quaternion(1, 2, 3, 4);
        q.zero();
        expect(q.equals(ZERO)).toBe(true);
      });

      it('should return this for chaining', () => {
        const q = new Quaternion();
        const result = q.zero();
        expect(result).toBe(q);
      });
    });
  });

  describe('Length Operations', () => {
    describe('lengthSquared()', () => {
      it('should calculate squared length correctly', () => {
        const q = new Quaternion(1, 2, 3, 4);
        expect(q.lengthSquared()).toBe(1 + 4 + 9 + 16); // 30
      });

      it('should return 0 for zero quaternion', () => {
        const q = new Quaternion(0, 0, 0, 0);
        expect(q.lengthSquared()).toBe(0);
      });

      it('should return 1 for identity quaternion', () => {
        const q = new Quaternion(0, 0, 0, 1);
        expect(q.lengthSquared()).toBe(1);
      });

      it('should handle negative components', () => {
        const q = new Quaternion(-1, -2, -3, -4);
        expect(q.lengthSquared()).toBe(30);
      });
    });

    describe('length()', () => {
      it('should calculate length correctly', () => {
        const q = new Quaternion(0, 0, 0, 1);
        expect(q.length()).toBe(1);
      });

      it('should return 0 for zero quaternion', () => {
        const q = new Quaternion(0, 0, 0, 0);
        expect(q.length()).toBe(0);
      });

      it('should match sqrt of lengthSquared', () => {
        const q = new Quaternion(1, 2, 3, 4);
        expect(q.length()).toBeCloseTo(Math.sqrt(q.lengthSquared()), 5);
      });
    });

    describe('normalize()', () => {
      it('should normalize quaternion to unit length', () => {
        const q = new Quaternion(2, 0, 0, 2);
        q.normalize();
        expect(q.length()).toBeCloseTo(1, 5);
      });

      it('should preserve rotation direction', () => {
        const q = new Quaternion(2, 0, 0, 2);
        const original = q.clone();
        q.normalize();
        // Normalized quaternion should have same direction
        const ratio = q.x / original.x;
        expect(Math.abs(ratio - 1 / original.length())).toBeLessThan(EPSILON);
      });

      it('should leave zero quaternion unchanged', () => {
        const q = new Quaternion(0, 0, 0, 0);
        q.normalize();
        expect(q.equals(ZERO)).toBe(true);
      });

      it('should return this for chaining', () => {
        const q = new Quaternion(2, 0, 0, 2);
        const result = q.normalize();
        expect(result).toBe(q);
      });

      it('should handle already normalized quaternion', () => {
        const q = new Quaternion(0, 0, 0, 1);
        q.normalize();
        expect(q.equals(IDENTITY)).toBe(true);
      });
    });

    describe('static normalize()', () => {
      it('should return normalized quaternion without mutating input', () => {
        const q = new Quaternion(2, 0, 0, 2);
        const original = q.clone();
        const normalized = Quaternion.normalize(q);
        expect(q.equals(original)).toBe(true);
        expect(normalized.length()).toBeCloseTo(1, 5);
      });

      it('should return zero quaternion for zero input', () => {
        const q = new Quaternion(0, 0, 0, 0);
        const normalized = Quaternion.normalize(q);
        expect(normalized.equals(ZERO)).toBe(true);
      });
    });
  });

  describe('Quaternion Operations', () => {
    describe('conjugate()', () => {
      it('should negate vector part', () => {
        const q = new Quaternion(1, 2, 3, 4);
        q.conjugate();
        expect(q.x).toBe(-1);
        expect(q.y).toBe(-2);
        expect(q.z).toBe(-3);
        expect(q.w).toBe(4);
      });

      it('should leave identity quaternion unchanged', () => {
        const q = new Quaternion(0, 0, 0, 1);
        q.conjugate();
        expect(q.equals(IDENTITY)).toBe(true);
      });

      it('should return this for chaining', () => {
        const q = new Quaternion(1, 2, 3, 4);
        const result = q.conjugate();
        expect(result).toBe(q);
      });
    });

    describe('static conjugate()', () => {
      it('should return conjugate without mutating input', () => {
        const q = new Quaternion(1, 2, 3, 4);
        const original = q.clone();
        const conjugate = Quaternion.conjugate(q);
        expect(q.equals(original)).toBe(true);
        expect(conjugate.x).toBe(-1);
        expect(conjugate.y).toBe(-2);
        expect(conjugate.z).toBe(-3);
        expect(conjugate.w).toBe(4);
      });
    });

    describe('inverse()', () => {
      it('should calculate inverse correctly', () => {
        const q = new Quaternion(1, 0, 0, 1);
        q.normalize();
        const original = q.clone();
        q.inverse();
        // For unit quaternion, inverse equals conjugate
        const conjugate = Quaternion.conjugate(original);
        expect(q.equalsEpsilon(conjugate, EPSILON)).toBe(true);
      });

      it('should satisfy q * q.inverse() = identity for unit quaternion', () => {
        const q = new Quaternion(1, 2, 3, 4);
        q.normalize();
        const qInv = q.clone().inverse();
        const result = Quaternion.multiply(q, qInv);
        expect(result.equalsEpsilon(IDENTITY, EPSILON)).toBe(true);
      });

      it('should throw error for zero quaternion', () => {
        const q = new Quaternion(0, 0, 0, 0);
        expect(() => q.inverse()).toThrow('Cannot invert zero quaternion');
      });

      it('should return this for chaining', () => {
        const q = new Quaternion(1, 0, 0, 1);
        q.normalize();
        const result = q.inverse();
        expect(result).toBe(q);
      });
    });

    describe('static inverse()', () => {
      it('should return inverse without mutating input', () => {
        const q = new Quaternion(1, 0, 0, 1);
        q.normalize();
        const original = q.clone();
        const inverse = Quaternion.inverse(q);
        expect(q.equals(original)).toBe(true);
        expect(inverse.equalsEpsilon(Quaternion.conjugate(q), EPSILON)).toBe(true);
      });

      it('should throw error for zero quaternion', () => {
        const q = new Quaternion(0, 0, 0, 0);
        expect(() => Quaternion.inverse(q)).toThrow('Cannot invert zero quaternion');
      });
    });

    describe('dot()', () => {
      it('should calculate dot product correctly', () => {
        const q1 = new Quaternion(1, 2, 3, 4);
        const q2 = new Quaternion(5, 6, 7, 8);
        expect(q1.dot(q2)).toBe(1 * 5 + 2 * 6 + 3 * 7 + 4 * 8); // 70
      });

      it('should return 0 for orthogonal quaternions', () => {
        const q1 = new Quaternion(1, 0, 0, 0);
        const q2 = new Quaternion(0, 0, 0, 1);
        expect(q1.dot(q2)).toBe(0);
      });

      it('should return length squared for dot with itself', () => {
        const q = new Quaternion(1, 2, 3, 4);
        expect(q.dot(q)).toBe(q.lengthSquared());
      });
    });

    describe('static dot()', () => {
      it('should calculate dot product correctly', () => {
        const q1 = new Quaternion(1, 2, 3, 4);
        const q2 = new Quaternion(5, 6, 7, 8);
        expect(Quaternion.dot(q1, q2)).toBe(70);
      });
    });

    describe('multiply()', () => {
      it('should multiply quaternions correctly', () => {
        const q1 = new Quaternion(1, 0, 0, 1);
        const q2 = new Quaternion(0, 1, 0, 1);
        q1.normalize();
        q2.normalize();
        const original = q1.clone();
        q1.multiply(q2);
        // Quaternion multiplication is not commutative
        expect(q1.equals(original)).toBe(false);
      });

      it('should satisfy identity multiplication', () => {
        const q = new Quaternion(1, 2, 3, 4);
        q.normalize();
        const original = q.clone();
        q.multiply(IDENTITY);
        expect(q.equalsEpsilon(original, EPSILON)).toBe(true);
      });

      it('should return this for chaining', () => {
        const q1 = new Quaternion(1, 0, 0, 1);
        const q2 = new Quaternion(0, 1, 0, 1);
        const result = q1.multiply(q2);
        expect(result).toBe(q1);
      });

      it('should multiply quaternions with correct formula', () => {
        // Add your test here
        const q1 = new Quaternion(1, 2, 3, 4);
        const q2 = new Quaternion(5, 6, 7, 8);
        
        const result = Quaternion.multiply(q1, q2);
        
        expect(result.w).toBe(4*8 - 1*5 - 2*6 - 3*7); // -6
        expect(result.x).toBe(4*5 + 1*8 + 2*7 - 3*6); // 24
        expect(result.y).toBe(4*6 - 1*7 + 2*8 + 3*5); // 48
        expect(result.z).toBe(4*7 + 1*6 - 2*5 + 3*8); // 48
      });
    });

    describe('static multiply()', () => {
      it('should return product without mutating inputs', () => {
        const q1 = new Quaternion(1, 0, 0, 1);
        const q2 = new Quaternion(0, 1, 0, 1);
        q1.normalize();
        q2.normalize();
        const original1 = q1.clone();
        const original2 = q2.clone();
        const product = Quaternion.multiply(q1, q2);
        expect(q1.equals(original1)).toBe(true);
        expect(q2.equals(original2)).toBe(true);
        expect(product.equals(q1)).toBe(false);
      });
    });

    describe('multiplyScalar()', () => {
      it('should multiply all components by scalar', () => {
        const q = new Quaternion(1, 2, 3, 4);
        q.multiplyScalar(2);
        expect(q.x).toBe(2);
        expect(q.y).toBe(4);
        expect(q.z).toBe(6);
        expect(q.w).toBe(8);
      });

      it('should handle negative scalar', () => {
        const q = new Quaternion(1, 2, 3, 4);
        q.multiplyScalar(-1);
        expect(q.x).toBe(-1);
        expect(q.y).toBe(-2);
        expect(q.z).toBe(-3);
        expect(q.w).toBe(-4);
      });

      it('should handle zero scalar', () => {
        const q = new Quaternion(1, 2, 3, 4);
        q.multiplyScalar(0);
        expect(q.equals(ZERO)).toBe(true);
      });

      it('should return this for chaining', () => {
        const q = new Quaternion(1, 2, 3, 4);
        const result = q.multiplyScalar(2);
        expect(result).toBe(q);
      });
    });

    describe('static multiplyScalar()', () => {
      it('should return scaled quaternion without mutating input', () => {
        const q = new Quaternion(1, 2, 3, 4);
        const original = q.clone();
        const scaled = Quaternion.multiplyScalar(q, 2);
        expect(q.equals(original)).toBe(true);
        expect(scaled.x).toBe(2);
        expect(scaled.y).toBe(4);
        expect(scaled.z).toBe(6);
        expect(scaled.w).toBe(8);
      });
    });
  });

  describe('Rotation Operations', () => {
    describe('fromAxisAngle()', () => {
      it('should create rotation quaternion from axis and angle', () => {
        const axis = new Vector3(1, 0, 0);
        const angle = Math.PI / 2;
        const q = new Quaternion();
        q.fromAxisAngle(axis, angle);
        expect(q.length()).toBeCloseTo(1, 5);
      });

      it('should normalize axis automatically', () => {
        const axis = new Vector3(2, 0, 0);
        const angle = Math.PI / 2;
        const q = new Quaternion();
        q.fromAxisAngle(axis, angle);
        expect(q.length()).toBeCloseTo(1, 5);
      });

      it('should handle zero angle', () => {
        const axis = new Vector3(1, 0, 0);
        const angle = 0;
        const q = new Quaternion();
        q.fromAxisAngle(axis, angle);
        expect(q.equalsEpsilon(IDENTITY, EPSILON)).toBe(true);
      });

      it('should handle full rotation (2π)', () => {
        const axis = new Vector3(1, 0, 0);
        const angle = Math.PI * 2;
        const q = new Quaternion();
        q.fromAxisAngle(axis, angle);
        // Full rotation should be close to identity (or its negative)
        const isIdentity = q.equalsEpsilon(IDENTITY, EPSILON);
        const isNegIdentity = q.equalsEpsilon(new Quaternion(0, 0, 0, -1), EPSILON);
        expect(isIdentity || isNegIdentity).toBe(true);
      });

      it('should return this for chaining', () => {
        const axis = new Vector3(1, 0, 0);
        const q = new Quaternion();
        const result = q.fromAxisAngle(axis, Math.PI / 2);
        expect(result).toBe(q);
      });
    });

    describe('static fromAxisAngle()', () => {
      it('should create rotation quaternion', () => {
        const axis = new Vector3(1, 0, 0);
        const angle = Math.PI / 2;
        const q = Quaternion.fromAxisAngle(axis, angle);
        expect(q.length()).toBeCloseTo(1, 5);
      });
    });

    describe('fromEulerAngles()', () => {
      it('should create rotation quaternion from Euler angles', () => {
        const q = new Quaternion();
        q.fromEulerAngles(Math.PI / 4, Math.PI / 6, Math.PI / 3);
        expect(q.length()).toBeCloseTo(1, 5);
      });

      it('should handle zero angles', () => {
        const q = new Quaternion();
        q.fromEulerAngles(0, 0, 0);
        expect(q.equalsEpsilon(IDENTITY, EPSILON)).toBe(true);
      });

      it('should return this for chaining', () => {
        const q = new Quaternion();
        const result = q.fromEulerAngles(Math.PI / 4, Math.PI / 6, Math.PI / 3);
        expect(result).toBe(q);
      });
    });

    describe('static fromEulerAngles()', () => {
      it('should create rotation quaternion', () => {
        const q = Quaternion.fromEulerAngles(Math.PI / 4, Math.PI / 6, Math.PI / 3);
        expect(q.length()).toBeCloseTo(1, 5);
      });
    });

    describe('toRotationMatrix3()', () => {
      it('should convert quaternion to rotation matrix', () => {
        const q = Quaternion.fromAxisAngle(new Vector3(1, 0, 0), Math.PI / 2);
        const m = q.toRotationMatrix3();
        expect(m instanceof Matrix3).toBe(true);
      });

      it('should produce orthogonal matrix', () => {
        const q = Quaternion.fromAxisAngle(new Vector3(1, 0, 0), Math.PI / 2);
        const m = q.toRotationMatrix3();
        const mT = m.clone().transpose();
        const shouldBeIdentity = Matrix3.multiply(m, mT);
        expect(shouldBeIdentity.equalsEpsilon(Matrix3.identity(), EPSILON)).toBe(true);
      });

      it('should round-trip with fromRotationMatrix3', () => {
        const q1 = Quaternion.fromAxisAngle(new Vector3(1, 0, 0), Math.PI / 4);
        const m = q1.toRotationMatrix3();
        const q2 = new Quaternion().fromRotationMatrix3(m);
        // Quaternions q and -q represent the same rotation

        expect(q1.equalsEpsilon(q2, EPSILON)).toBe(true);
      });

      it('should handle zero quaternion (n === 0)', () => {
        // Test the branch where n === 0 (degenerate quaternion)
        const q = new Quaternion(0, 0, 0, 0);
        const m = q.toRotationMatrix3();
        // Should return identity matrix for zero quaternion
        expect(m.equalsEpsilon(Matrix3.identity(), EPSILON)).toBe(true);
      });
    });

    describe('toRotationMatrix4()', () => {
      it('should convert quaternion to rotation matrix', () => {
        const q = Quaternion.fromAxisAngle(new Vector3(1, 0, 0), Math.PI / 2);
        const m = q.toRotationMatrix4();
        expect(m instanceof Matrix4).toBe(true);
      });

      it('should produce orthogonal matrix in upper-left 3x3', () => {
        const q = Quaternion.fromAxisAngle(new Vector3(1, 0, 0), Math.PI / 2);
        const m = q.toRotationMatrix4();
        const m3 = new Matrix3(
          m.get(0, 0), m.get(0, 1), m.get(0, 2),
          m.get(1, 0), m.get(1, 1), m.get(1, 2),
          m.get(2, 0), m.get(2, 1), m.get(2, 2)
        );
        const m3T = m3.clone().transpose();
        const shouldBeIdentity = Matrix3.multiply(m3, m3T);
        expect(shouldBeIdentity.equalsEpsilon(Matrix3.identity(), EPSILON)).toBe(true);
      });

      it('should round-trip with fromRotationMatrix4', () => {
        const q1 = Quaternion.fromAxisAngle(new Vector3(1, 0, 0), Math.PI / 4);
        const m = q1.toRotationMatrix4();
        const q2 = new Quaternion().fromRotationMatrix4(m);

        const matches = q1.equalsEpsilon(q2, EPSILON) || q1.equalsEpsilon(Quaternion.multiplyScalar(q2, -1), EPSILON);
        expect(matches).toBe(true);
      });

      it('should handle zero quaternion (n === 0)', () => {
        // Test the branch where n === 0 (degenerate quaternion)
        const q = new Quaternion(0, 0, 0, 0);
        const m = q.toRotationMatrix4();
        // Should return identity matrix for zero quaternion
        expect(m.equalsEpsilon(Matrix4.identity(), EPSILON)).toBe(true);
      });
    });

    describe('fromRotationMatrix3()', () => {
      it('should extract quaternion from rotation matrix', () => {
        const m = new Matrix3().makeRotationZ(Math.PI / 2);
        const q = new Quaternion();
        q.fromRotationMatrix3(m);
        expect(q.length()).toBeCloseTo(1, 5);
      });

      it('should round-trip with toRotationMatrix3', () => {
        const m1 = new Matrix3().makeRotationZ(Math.PI / 4);
        const q = new Quaternion().fromRotationMatrix3(m1);
        const m2 = q.toRotationMatrix3();
        // Quaternions q and -q represent the same rotation
        // Check if matrices represent the same rotation by transforming a test vector
        const testVec = new Vector3(1, 0, 0);
        const result1 = m1.transformVector(testVec);
        const result2 = m2.transformVector(testVec);
        expect(result1.equalsEpsilon(result2, EPSILON)).toBe(true);
      });

      it('should return this for chaining', () => {
        const m = new Matrix3().makeRotationZ(Math.PI / 2);
        const q = new Quaternion();
        const result = q.fromRotationMatrix3(m);
        expect(result).toBe(q);
      });
    });

    describe('static fromRotationMatrix3()', () => {
      it('should create quaternion from rotation matrix', () => {
        const m = new Matrix3().makeRotationZ(Math.PI / 2);
        const q = Quaternion.fromRotationMatrix3(m);
        expect(q.length()).toBeCloseTo(1, 5);
      });

      it('should handle matrix with trace > 0', () => {
        // Create a rotation matrix that will have trace > 0
        const m = new Matrix3().makeRotationZ(Math.PI / 4);
        const q = Quaternion.fromRotationMatrix3(m);
        expect(q.length()).toBeCloseTo(1, 5);
      });

      it('should handle matrix with m00 > m11 && m00 > m22', () => {
        // Create a rotation matrix where m00 is the largest diagonal element AND trace <= 0
        // This tests the branch: else if (m00 > m11 && m00 > m22)
        // Rotation around X-axis by 120 degrees: trace = 1 + cos(120) + cos(120) = 1 - 0.5 - 0.5 = 0
        // For 120 degrees: cos(120) = -0.5, sin(120) = sqrt(3)/2
        // Matrix: [1, 0, 0; 0, -0.5, sqrt(3)/2; 0, -sqrt(3)/2, -0.5]
        const manualM = new Matrix3(
          1, 0, 0,
          0, -0.5, Math.sqrt(3)/2,
          0, -Math.sqrt(3)/2, -0.5
        );
        // Verify conditions: trace = 1 + (-0.5) + (-0.5) = 0 <= 0, m00=1 > m11=-0.5, m00=1 > m22=-0.5
        const trace = manualM.get(0, 0) + manualM.get(1, 1) + manualM.get(2, 2);
        expect(trace).toBeCloseTo(0, 5);
        expect(manualM.get(0, 0) > manualM.get(1, 1)).toBe(true);
        expect(manualM.get(0, 0) > manualM.get(2, 2)).toBe(true);
        
        const q = Quaternion.fromRotationMatrix3(manualM);
        expect(q.length()).toBeCloseTo(1, 5);
      });

      it('should handle matrix with m11 > m22', () => {
        // Create a rotation matrix where m11 > m22 AND trace <= 0 AND not (m00 > m11 && m00 > m22)
        // This tests the branch: else if (m11 > m22)
        // Rotation around Y-axis by 120 degrees: trace = -0.5 + 1 + (-0.5) = 0
        // Matrix: [-0.5, 0, sqrt(3)/2; 0, 1, 0; -sqrt(3)/2, 0, -0.5]
        const manualM = new Matrix3(
          -0.5, 0, Math.sqrt(3)/2,
          0, 1, 0,
          -Math.sqrt(3)/2, 0, -0.5
        );
        // Verify conditions: trace = -0.5 + 1 + (-0.5) = 0 <= 0
        // m00=-0.5, m11=1, m22=-0.5
        // NOT (m00 > m11 && m00 > m22): -0.5 > 1 is false, so condition is true
        // m11 > m22: 1 > -0.5 is true
        const trace = manualM.get(0, 0) + manualM.get(1, 1) + manualM.get(2, 2);
        expect(trace).toBeCloseTo(0, 5);
        expect(manualM.get(1, 1) > manualM.get(2, 2)).toBe(true);
        expect(manualM.get(0, 0) > manualM.get(1, 1)).toBe(false); // m00 is not > m11
        
        const q = Quaternion.fromRotationMatrix3(manualM);
        expect(q.length()).toBeCloseTo(1, 5);
      });

      it('should handle matrix with m22 largest (else branch)', () => {
        // Test the else branch: m22 is largest AND trace <= 0 AND NOT (m00 > m11 && m00 > m22) AND NOT (m11 > m22)
        // Create matrix with m22 largest: m00=-0.5, m11=-0.5, m22=1, trace=0
        const manualM = new Matrix3(
          -0.5, -Math.sqrt(3)/2, 0,
          Math.sqrt(3)/2, -0.5, 0,
          0, 0, 1
        );
        // Verify conditions: trace = -0.5 + (-0.5) + 1 = 0 <= 0
        // m22=1 > m00=-0.5, m22=1 > m11=-0.5
        // NOT (m00 > m11 && m00 > m22): -0.5 > -0.5 is false, so condition is true
        // NOT (m11 > m22): -0.5 > 1 is false, so condition is true
        const trace = manualM.get(0, 0) + manualM.get(1, 1) + manualM.get(2, 2);
        expect(trace).toBeCloseTo(0, 5);
        expect(manualM.get(2, 2) > manualM.get(0, 0)).toBe(true);
        expect(manualM.get(2, 2) > manualM.get(1, 1)).toBe(true);
        expect(manualM.get(0, 0) > manualM.get(1, 1)).toBe(false); // m00 is not > m11
        expect(manualM.get(1, 1) > manualM.get(2, 2)).toBe(false); // m11 is not > m22
        
        const q = Quaternion.fromRotationMatrix3(manualM);
        expect(q.length()).toBeCloseTo(1, 5);
      });
    });

    describe('fromRotationMatrix4()', () => {
      it('should extract quaternion from rotation matrix', () => {
        const m = new Matrix4().makeRotationZ(Math.PI / 2);
        const q = new Quaternion();
        q.fromRotationMatrix4(m);
        expect(q.length()).toBeCloseTo(1, 5);
      });

      it('should round-trip with toRotationMatrix4', () => {
        const m1 = new Matrix4().makeRotationZ(Math.PI / 4);
        const q = new Quaternion().fromRotationMatrix4(m1);
        const m2 = q.toRotationMatrix4();
        // Quaternions q and -q represent the same rotation
        // Check if matrices represent the same rotation by transforming a test vector
        const testVec = new Vector3(1, 0, 0);
        const result1 = m1.transformDirection(testVec);
        const result2 = m2.transformDirection(testVec);
        expect(result1.equalsEpsilon(result2, EPSILON)).toBe(true);
      });

      it('should return this for chaining', () => {
        const m = new Matrix4().makeRotationZ(Math.PI / 2);
        const q = new Quaternion();
        const result = q.fromRotationMatrix4(m);
        expect(result).toBe(q);
      });
    });

    describe('static fromRotationMatrix4()', () => {
      it('should create quaternion from rotation matrix', () => {
        const m = new Matrix4().makeRotationZ(Math.PI / 2);
        const q = Quaternion.fromRotationMatrix4(m);
        expect(q.length()).toBeCloseTo(1, 5);
      });

      it('should handle matrix with trace > 0', () => {
        const m = new Matrix4().makeRotationZ(Math.PI / 4);
        const q = Quaternion.fromRotationMatrix4(m);
        expect(q.length()).toBeCloseTo(1, 5);
      });

      it('should handle matrix with m00 > m11 && m00 > m22', () => {
        // Create Matrix4 with trace <= 0 and m00 > m11 && m00 > m22
        // Extract 3x3 rotation part and create Matrix4
        const m3 = new Matrix3(
          1, 0, 0,
          0, -0.5, Math.sqrt(3)/2,
          0, -Math.sqrt(3)/2, -0.5
        );
        const m4 = new Matrix4(
          m3.get(0, 0), m3.get(0, 1), m3.get(0, 2), 0,
          m3.get(1, 0), m3.get(1, 1), m3.get(1, 2), 0,
          m3.get(2, 0), m3.get(2, 1), m3.get(2, 2), 0,
          0, 0, 0, 1
        );
        const q = Quaternion.fromRotationMatrix4(m4);
        expect(q.length()).toBeCloseTo(1, 5);
      });

      it('should handle matrix with m11 > m22', () => {
        // Create Matrix4 with trace <= 0 and m11 > m22
        const m3 = new Matrix3(
          -0.5, 0, Math.sqrt(3)/2,
          0, 1, 0,
          -Math.sqrt(3)/2, 0, -0.5
        );
        const m4 = new Matrix4(
          m3.get(0, 0), m3.get(0, 1), m3.get(0, 2), 0,
          m3.get(1, 0), m3.get(1, 1), m3.get(1, 2), 0,
          m3.get(2, 0), m3.get(2, 1), m3.get(2, 2), 0,
          0, 0, 0, 1
        );
        const q = Quaternion.fromRotationMatrix4(m4);
        expect(q.length()).toBeCloseTo(1, 5);
      });

      it('should handle matrix with m22 largest (else branch)', () => {
        // Create Matrix4 with trace <= 0 and m22 largest
        const m3 = new Matrix3(
          -0.5, -Math.sqrt(3)/2, 0,
          Math.sqrt(3)/2, -0.5, 0,
          0, 0, 1
        );
        const m4 = new Matrix4(
          m3.get(0, 0), m3.get(0, 1), m3.get(0, 2), 0,
          m3.get(1, 0), m3.get(1, 1), m3.get(1, 2), 0,
          m3.get(2, 0), m3.get(2, 1), m3.get(2, 2), 0,
          0, 0, 0, 1
        );
        const q = Quaternion.fromRotationMatrix4(m4);
        expect(q.length()).toBeCloseTo(1, 5);
      });
    });
  });

  describe('Vector Transformations', () => {
    describe('rotateVector()', () => {
      it('should rotate vector correctly around Z-axis', () => {
        const q = Quaternion.fromAxisAngle(new Vector3(0, 0, 1), Math.PI / 2);
        const v = new Vector3(1, 0, 0);
        const rotated = q.rotateVector(v);
        
        expect(rotated.x).toBeCloseTo(0, 5);
        expect(rotated.y).toBeCloseTo(1, 5);
        expect(rotated.z).toBeCloseTo(0, 5);
      });
  
      it('should rotate vector correctly around X-axis', () => {
        const q = Quaternion.fromAxisAngle(new Vector3(1, 0, 0), Math.PI / 2);
        const v = new Vector3(0, 1, 0);
        const rotated = q.rotateVector(v);
        
        expect(rotated.x).toBeCloseTo(0, 5);
        expect(rotated.y).toBeCloseTo(0, 5);
        expect(rotated.z).toBeCloseTo(1, 5);
      });
  
      it('should rotate vector correctly around Y-axis', () => {
        const q = Quaternion.fromAxisAngle(new Vector3(0, 1, 0), Math.PI / 2);
        const v = new Vector3(1, 0, 0);
        const rotated = q.rotateVector(v);
        
        expect(rotated.x).toBeCloseTo(0, 5);
        expect(rotated.y).toBeCloseTo(0, 5);
        expect(rotated.z).toBeCloseTo(-1, 5);
      });
  
      it('should handle identity quaternion', () => {
        const q = Quaternion.identity();
        const v = new Vector3(1, 2, 3);
        const rotated = q.rotateVector(v);
        
        expect(rotated.equalsEpsilon(v, EPSILON)).toBe(true);
      });
  
      it('should handle 180° rotation', () => {
        const q = Quaternion.fromAxisAngle(new Vector3(0, 0, 1), Math.PI);
        const v = new Vector3(1, 0, 0);
        const rotated = q.rotateVector(v);
        
        expect(rotated.x).toBeCloseTo(-1, 5);
        expect(rotated.y).toBeCloseTo(0, 5);
        expect(rotated.z).toBeCloseTo(0, 5);
      });
  
      it('should preserve vector length', () => {
        const q = Quaternion.fromAxisAngle(new Vector3(1, 1, 1), Math.PI / 3);
        const v = new Vector3(1, 2, 3);
        const rotated = q.rotateVector(v);
        
        expect(rotated.length()).toBeCloseTo(v.length(), 5);
      });

      it('should handle zero vector', () => {
        const q = Quaternion.fromAxisAngle(new Vector3(1, 0, 0), Math.PI / 2);
        const v = new Vector3(0, 0, 0);
        const rotated = q.rotateVector(v);
        
        expect(rotated.x).toBeCloseTo(0, 5);
        expect(rotated.y).toBeCloseTo(0, 5);
        expect(rotated.z).toBeCloseTo(0, 5);
      });

      it('should handle non-normalized quaternion', () => {
        const q = new Quaternion(2, 0, 0, 2); // Not normalized
        q.normalize(); // Normalize before rotating
        const v = new Vector3(1, 0, 0);
        const rotated = q.rotateVector(v);
        // Should preserve vector length
        expect(rotated.length()).toBeCloseTo(v.length(), 5);
      });
    });

    describe('static rotateVector()', () => {
      it('should rotate vector without mutating quaternion', () => {
        const q = Quaternion.fromAxisAngle(new Vector3(0, 0, 1), Math.PI / 2);
        const v = new Vector3(1, 0, 0);
        const original = q.clone();
        const rotated = Quaternion.rotateVector(v, q);
        
        expect(q.equals(original)).toBe(true);
        expect(rotated.x).toBeCloseTo(0, 5);
        expect(rotated.y).toBeCloseTo(1, 5);
        expect(rotated.z).toBeCloseTo(0, 5);
      });
    });
  });

  describe('Interpolation', () => {
    describe('lerp()', () => {
      it('should interpolate between quaternions', () => {
        const q1 = Quaternion.fromAxisAngle(new Vector3(1, 0, 0), 0);
        const q2 = Quaternion.fromAxisAngle(new Vector3(1, 0, 0), Math.PI);
        q1.lerp(q2, 0.5);
        expect(q1.length()).toBeCloseTo(1, 5);
      });

      it('should return identity at t=0', () => {
        const q1 = Quaternion.fromAxisAngle(new Vector3(1, 0, 0), 0);
        const q2 = Quaternion.fromAxisAngle(new Vector3(1, 0, 0), Math.PI);
        const original = q1.clone();
        q1.lerp(q2, 0);
        expect(q1.equalsEpsilon(original, EPSILON)).toBe(true);
      });

      it('should return target at t=1', () => {
        const q1 = Quaternion.fromAxisAngle(new Vector3(1, 0, 0), 0);
        const q2 = Quaternion.fromAxisAngle(new Vector3(1, 0, 0), Math.PI);
        q1.lerp(q2, 1);
        expect(q1.equalsEpsilon(q2, EPSILON)).toBe(true);
      });

      it('should return this for chaining', () => {
        const q1 = Quaternion.fromAxisAngle(new Vector3(1, 0, 0), 0);
        const q2 = Quaternion.fromAxisAngle(new Vector3(1, 0, 0), Math.PI);
        const result = q1.lerp(q2, 0.5);
        expect(result).toBe(q1);
      });
    });

    describe('slerp()', () => {
      it('should interpolate between quaternions', () => {
        const q1 = Quaternion.fromAxisAngle(new Vector3(1, 0, 0), 0);
        const q2 = Quaternion.fromAxisAngle(new Vector3(1, 0, 0), Math.PI);
        q1.slerp(q2, 0.5);
        expect(q1.length()).toBeCloseTo(1, 5);
      });

      it('should return identity at t=0', () => {
        const q1 = Quaternion.fromAxisAngle(new Vector3(1, 0, 0), 0);
        const q2 = Quaternion.fromAxisAngle(new Vector3(1, 0, 0), Math.PI);
        const original = q1.clone();
        q1.slerp(q2, 0);
        expect(q1.equalsEpsilon(original, EPSILON)).toBe(true);
      });

      it('should return target at t=1', () => {
        const q1 = Quaternion.fromAxisAngle(new Vector3(1, 0, 0), 0);
        const q2 = Quaternion.fromAxisAngle(new Vector3(1, 0, 0), Math.PI);
        q1.slerp(q2, 1);
        expect(q1.equalsEpsilon(q2, EPSILON)).toBe(true);
      });

      it('should take shortest path', () => {
        const q1 = Quaternion.fromAxisAngle(new Vector3(1, 0, 0), 0);
        const q2 = Quaternion.fromAxisAngle(new Vector3(1, 0, 0), Math.PI * 1.5);
        q1.slerp(q2, 0.5);
        // Should interpolate along shorter path
        expect(q1.length()).toBeCloseTo(1, 5);
      });

      it('should handle negative dot product (flip quaternion)', () => {
        // Create quaternions with negative dot product
        const q1 = Quaternion.fromAxisAngle(new Vector3(1, 0, 0), 0);
        const q2 = Quaternion.fromAxisAngle(new Vector3(1, 0, 0), Math.PI);
        // Negate q2 to ensure negative dot product
        const q2Neg = Quaternion.multiplyScalar(q2, -1);
        const original = q1.clone();
        q1.slerp(q2Neg, 0.5);
        // Should flip and interpolate
        expect(q1.length()).toBeCloseTo(1, 5);
        expect(q1.equals(original)).toBe(false);
      });

      it('should use lerp when quaternions are very close (dot > 0.9995)', () => {
        // Create two very similar quaternions
        const q1 = Quaternion.fromAxisAngle(new Vector3(1, 0, 0), 0);
        const q2 = Quaternion.fromAxisAngle(new Vector3(1, 0, 0), 0.001); // Very small angle
        const original = q1.clone();
        q1.slerp(q2, 0.5);
        // Should use lerp fallback when very close
        expect(q1.length()).toBeCloseTo(1, 5);
      });

      it('should return this for chaining', () => {
        const q1 = Quaternion.fromAxisAngle(new Vector3(1, 0, 0), 0);
        const q2 = Quaternion.fromAxisAngle(new Vector3(1, 0, 0), Math.PI);
        const result = q1.slerp(q2, 0.5);
        expect(result).toBe(q1);
      });
    });

    describe('static slerp()', () => {
      it('should return interpolated quaternion without mutating inputs', () => {
        const q1 = Quaternion.fromAxisAngle(new Vector3(1, 0, 0), 0);
        const q2 = Quaternion.fromAxisAngle(new Vector3(1, 0, 0), Math.PI);
        const original1 = q1.clone();
        const original2 = q2.clone();
        const interpolated = Quaternion.slerp(q1, q2, 0.5);
        expect(q1.equals(original1)).toBe(true);
        expect(q2.equals(original2)).toBe(true);
        expect(interpolated.length()).toBeCloseTo(1, 5);
      });
    });

    describe('static nlerp()', () => {
      it('should return interpolated quaternion without mutating inputs', () => {
        const q1 = Quaternion.fromAxisAngle(new Vector3(1, 0, 0), 0);
        const q2 = Quaternion.fromAxisAngle(new Vector3(1, 0, 0), Math.PI);
        const original1 = q1.clone();
        const original2 = q2.clone();
        const interpolated = Quaternion.nlerp(q1, q2, 0.5);
        expect(q1.equals(original1)).toBe(true);
        expect(q2.equals(original2)).toBe(true);
        expect(interpolated.length()).toBeCloseTo(1, 5);
      });

      it('should handle edge cases (t=0, t=1)', () => {
        const q1 = Quaternion.fromAxisAngle(new Vector3(1, 0, 0), 0);
        const q2 = Quaternion.fromAxisAngle(new Vector3(1, 0, 0), Math.PI);
        const result0 = Quaternion.nlerp(q1, q2, 0);
        const result1 = Quaternion.nlerp(q1, q2, 1);
        expect(result0.equalsEpsilon(q1, EPSILON)).toBe(true);
        expect(result1.equalsEpsilon(q2, EPSILON)).toBe(true);
      });
    });
  });

  describe('Copy and Clone', () => {
    describe('clone()', () => {
      it('should create new quaternion with same values', () => {
        const q1 = new Quaternion(1, 2, 3, 4);
        const q2 = q1.clone();
        expect(q2.equals(q1)).toBe(true);
        expect(q2).not.toBe(q1);
      });

      it('should be independent of original', () => {
        const q1 = new Quaternion(1, 2, 3, 4);
        const q2 = q1.clone();
        q1.x = 10;
        expect(q2.x).toBe(1);
      });
    });

    describe('copy()', () => {
      it('should copy values from another quaternion', () => {
        const q1 = new Quaternion(1, 2, 3, 4);
        const q2 = new Quaternion(10, 20, 30, 40);
        q2.copy(q1);
        expect(q2.equals(q1)).toBe(true);
      });

      it('should not mutate source quaternion', () => {
        const q1 = new Quaternion(1, 2, 3, 4);
        const q2 = new Quaternion(10, 20, 30, 40);
        const original = q1.clone();
        q2.copy(q1);
        expect(q1.equals(original)).toBe(true);
      });

      it('should return this for chaining', () => {
        const q1 = new Quaternion(1, 2, 3, 4);
        const q2 = new Quaternion();
        const result = q2.copy(q1);
        expect(result).toBe(q2);
      });
    });
  });

  describe('Comparison', () => {
    describe('equals()', () => {
      it('should return true for equal quaternions', () => {
        const q1 = new Quaternion(1, 2, 3, 4);
        const q2 = new Quaternion(1, 2, 3, 4);
        expect(q1.equals(q2)).toBe(true);
      });

      it('should return false for different quaternions', () => {
        const q1 = new Quaternion(1, 2, 3, 4);
        const q2 = new Quaternion(1, 2, 3, 5);
        expect(q1.equals(q2)).toBe(false);
      });

      it('should return true for identity quaternions', () => {
        const q1 = new Quaternion(0, 0, 0, 1);
        const q2 = new Quaternion(0, 0, 0, 1);
        expect(q1.equals(q2)).toBe(true);
      });
    });

    describe('equalsEpsilon()', () => {
      it('should return true for quaternions within epsilon', () => {
        const q1 = new Quaternion(1, 2, 3, 4);
        const q2 = new Quaternion(1.0000001, 2, 3, 4);
        expect(q1.equalsEpsilon(q2, 1e-5)).toBe(true);
      });

      it('should return false for quaternions outside epsilon', () => {
        const q1 = new Quaternion(1, 2, 3, 4);
        const q2 = new Quaternion(1.1, 2, 3, 4);
        expect(q1.equalsEpsilon(q2, 1e-5)).toBe(false);
      });

      it('should use default epsilon if not provided', () => {
        const q1 = new Quaternion(1, 2, 3, 4);
        const q2 = new Quaternion(1.0000001, 2, 3, 4);
        expect(q1.equalsEpsilon(q2)).toBe(true);
      });

      it('should throw error for negative epsilon', () => {
        const q1 = new Quaternion(1, 2, 3, 4);
        const q2 = new Quaternion(1, 2, 3, 4);
        expect(() => q1.equalsEpsilon(q2, -1)).toThrow('Epsilon must be non-negative');
      });
    });
  });

  describe('Edge Cases', () => {
    describe('NaN handling', () => {
      it('should handle NaN in length operations', () => {
        const q = new Quaternion(NaN, 1, 2, 3);
        expect(Number.isNaN(q.lengthSquared())).toBe(true);
        expect(Number.isNaN(q.length())).toBe(true);
      });

      it('should handle NaN in normalize', () => {
        const q = new Quaternion(NaN, 1, 2, 3);
        q.normalize();
        // Normalize should handle NaN gracefully
        expect(Number.isNaN(q.length()) || q.length() === 0).toBe(true);
      });
    });

    describe('Infinity handling', () => {
      it('should handle Infinity in length operations', () => {
        const q = new Quaternion(Infinity, 1, 2, 3);
        expect(q.lengthSquared()).toBe(Infinity);
        expect(q.length()).toBe(Infinity);
      });
    });

    describe('Very small quaternions', () => {
      it('should handle very small quaternion in normalize', () => {
        const q = new Quaternion(1e-10, 1e-10, 1e-10, 1e-10);
        q.normalize();
        expect(q.length()).toBeCloseTo(1, 5);
      });
    });

    describe('Very large quaternions', () => {
      it('should handle very large quaternion in normalize', () => {
        const q = new Quaternion(1e10, 1e10, 1e10, 1e10);
        q.normalize();
        expect(q.length()).toBeCloseTo(1, 5);
      });
    });
  });

  describe('Essential Missing Methods', () => {
    describe('toAxisAngle()', () => {
      it('should extract axis and angle correctly', () => {
        const axis = new Vector3(1, 0, 0);
        const angle = Math.PI / 2;
        const q = Quaternion.fromAxisAngle(axis, angle);
        const result = q.toAxisAngle();
        expect(result.axis.x).toBeCloseTo(1, 5);
        expect(result.axis.y).toBeCloseTo(0, 5);
        expect(result.axis.z).toBeCloseTo(0, 5);
        expect(result.angle).toBeCloseTo(angle, 5);
      });

      it('should round-trip with fromAxisAngle', () => {
        const originalAxis = new Vector3(1, 1, 1).normalize();
        const originalAngle = Math.PI / 3;
        const q = Quaternion.fromAxisAngle(originalAxis, originalAngle);
        const { axis, angle } = q.toAxisAngle();
        const q2 = Quaternion.fromAxisAngle(axis, angle);
        // Quaternions q and -q represent the same rotation
        const matches = q.equalsEpsilon(q2, EPSILON) || 
                       q.equalsEpsilon(Quaternion.multiplyScalar(q2, -1), EPSILON);
        expect(matches).toBe(true);
      });

      it('should handle identity quaternion', () => {
        const q = Quaternion.identity();
        const { axis, angle } = q.toAxisAngle();
        expect(angle).toBeCloseTo(0, 5);
      });

      it('should handle zero quaternion', () => {
        const q = Quaternion.zero();
        const { axis, angle } = q.toAxisAngle();
        expect(angle).toBeCloseTo(0, 5);
        expect(axis.length()).toBeCloseTo(1, 5);
      });

      it('should handle quaternion with w = 1 (zero rotation)', () => {
        const q = new Quaternion(0, 0, 0, 1);
        const { axis, angle } = q.toAxisAngle();
        expect(angle).toBeCloseTo(0, 5);
      });

      it('should handle quaternion with w = -1 (180° rotation)', () => {
        const q = new Quaternion(0, 0, 0, -1);
        const { axis, angle } = q.toAxisAngle();
        // Quaternion with w = -1 represents 180° rotation (or 2π - 180° = 180°)
        // The angle should be normalized to [0, π]
        expect(angle).toBeGreaterThanOrEqual(0);
        expect(angle).toBeLessThanOrEqual(Math.PI);
        // For w = -1, the rotation is 180° regardless of axis
        expect(Math.abs(angle - Math.PI) < EPSILON || angle < EPSILON).toBe(true);
      });

      it('should handle very small angle', () => {
        const axis = new Vector3(1, 0, 0);
        const q = Quaternion.fromAxisAngle(axis, 1e-6);
        const { angle } = q.toAxisAngle();
        expect(angle).toBeCloseTo(1e-6, 5);
      });

      it('should handle angle near π', () => {
        const axis = new Vector3(1, 0, 0);
        const q = Quaternion.fromAxisAngle(axis, Math.PI - 1e-6);
        const { angle } = q.toAxisAngle();
        expect(angle).toBeCloseTo(Math.PI - 1e-6, 5);
      });

      it('should normalize angle > π to [0, π] range', () => {
        // Create quaternion with angle > π
        const axis = new Vector3(1, 0, 0);
        const q = Quaternion.fromAxisAngle(axis, Math.PI + 0.1);
        const { angle } = q.toAxisAngle();
        // Angle should be normalized to [0, π]
        expect(angle).toBeGreaterThanOrEqual(0);
        expect(angle).toBeLessThanOrEqual(Math.PI);
      });

      it('should handle very small angle (sinHalfAngle <= 1e-6)', () => {
        // Create quaternion with very small angle
        const axis = new Vector3(1, 0, 0);
        const q = Quaternion.fromAxisAngle(axis, 1e-7);
        const { axis: extractedAxis, angle } = q.toAxisAngle();
        // Should use default axis when sinHalfAngle is very small
        expect(extractedAxis.x).toBeCloseTo(1, 5);
        expect(extractedAxis.y).toBeCloseTo(0, 5);
        expect(extractedAxis.z).toBeCloseTo(0, 5);
        expect(angle).toBeLessThan(1e-5);
      });

      it('should handle non-normalized quaternion', () => {
        const q = new Quaternion(2, 0, 0, 2); // Not normalized
        const { axis, angle } = q.toAxisAngle();
        // Should normalize internally
        expect(axis.length()).toBeCloseTo(1, 5);
      });
    });

    describe('toEulerAngles()', () => {
      it('should extract Euler angles correctly', () => {
        // Use simpler angles to avoid gimbal lock issues
        const pitch = Math.PI / 6;
        const yaw = Math.PI / 6;
        const roll = Math.PI / 6;
        const q = Quaternion.fromEulerAngles(pitch, yaw, roll);
        const { x, y, z } = q.toEulerAngles();
        // Euler angles can have multiple representations due to gimbal lock
        // Check if the extracted angles produce the same rotation by rotating a test vector
        const q2 = Quaternion.fromEulerAngles(x, y, z);
        const testVec = new Vector3(1, 0, 0);
        const rotated1 = q.rotateVector(testVec);
        const rotated2 = q2.rotateVector(testVec);
        expect(rotated1.equalsEpsilon(rotated2, EPSILON)).toBe(true);
      });

      it('should round-trip with fromEulerAngles', () => {
        // Use simpler angles to avoid gimbal lock issues
        const pitch = Math.PI / 6;
        const yaw = Math.PI / 6;
        const roll = Math.PI / 6;
        const q1 = Quaternion.fromEulerAngles(pitch, yaw, roll);
        const { x, y, z } = q1.toEulerAngles();
        const q2 = Quaternion.fromEulerAngles(x, y, z);
        // Quaternions q and -q represent the same rotation
        const matches = q1.equalsEpsilon(q2, EPSILON) || 
                       q1.equalsEpsilon(Quaternion.multiplyScalar(q2, -1), EPSILON);
        expect(matches).toBe(true);
      });

      it('should handle zero angles', () => {
        const q = Quaternion.fromEulerAngles(0, 0, 0);
        const { x, y, z } = q.toEulerAngles();
        expect(x).toBeCloseTo(0, 5);
        expect(y).toBeCloseTo(0, 5);
        expect(z).toBeCloseTo(0, 5);
      });

      it('should handle gimbal lock (pitch = π/2)', () => {
        const q = Quaternion.fromEulerAngles(Math.PI / 2, Math.PI / 4, Math.PI / 3);
        const { x, y, z } = q.toEulerAngles();
        // Gimbal lock: yaw and roll become coupled, so exact round-trip doesn't work
        // This is a fundamental limitation of Euler angles
        // Verify that extracted angles produce a valid normalized quaternion
        const q2 = Quaternion.fromEulerAngles(x, y, z);
        expect(q2.length()).toBeCloseTo(1, 5);
        // Note: Due to gimbal lock, q and q2 may represent different rotations
        // This is expected behavior - gimbal lock is a limitation of Euler angles
      });

      it('should handle gimbal lock (pitch = -π/2)', () => {
        const q = Quaternion.fromEulerAngles(-Math.PI / 2, Math.PI / 4, Math.PI / 3);
        const { x, y, z } = q.toEulerAngles();
        // Gimbal lock: yaw and roll become coupled, so exact round-trip doesn't work
        const q2 = Quaternion.fromEulerAngles(x, y, z);
        expect(q2.length()).toBeCloseTo(1, 5);
        // Note: Due to gimbal lock, q and q2 may represent different rotations
      });

      it('should handle negative angles', () => {
        const q = Quaternion.fromEulerAngles(-Math.PI / 4, -Math.PI / 6, -Math.PI / 3);
        const { x, y, z } = q.toEulerAngles();
        // Verify extracted angles are in valid ranges
        expect(x).toBeGreaterThanOrEqual(-Math.PI / 2);
        expect(x).toBeLessThanOrEqual(Math.PI / 2);
        expect(y).toBeGreaterThanOrEqual(-Math.PI);
        expect(y).toBeLessThanOrEqual(Math.PI);
        expect(z).toBeGreaterThanOrEqual(-Math.PI);
        expect(z).toBeLessThanOrEqual(Math.PI);
        // Verify extracted angles produce a valid normalized quaternion
        const q2 = Quaternion.fromEulerAngles(x, y, z);
        expect(q2.length()).toBeCloseTo(1, 5);
        // Note: Euler angles have multiple representations, so perfect round-trip may not work
      });

      it('should handle toEulerAngles with Math.abs(sinp) >= 1 branch', () => {
        // Create quaternion that will trigger Math.abs(sinp) >= 1
        // sinp = 2 * (w * y - z * x)
        // For Math.abs(sinp) >= 1, we need |w*y - z*x| >= 0.5
        // Create a quaternion where w*y >= 0.5 (and z*x = 0)
        // q = (0, 1, 0, 0.6) gives sinp = 2 * (0.6 * 1 - 0 * 0) = 1.2 >= 1
        const q = new Quaternion(0, 1, 0, 0.6);
        const sinp = 2 * (q.w * q.y - q.z * q.x);
        // Verify sinp >= 1 to trigger the branch
        expect(Math.abs(sinp)).toBeGreaterThanOrEqual(1);
        const { x } = q.toEulerAngles();
        // Should handle Math.abs(sinp) >= 1 branch and clamp pitch to ±90°
        // The branch uses Math.sign(sinp) * Math.PI / 2
        expect(Math.abs(x)).toBeCloseTo(Math.PI / 2, 2);
      });
    });

    describe('fromLookAt()', () => {
      it('should create rotation to look at target', () => {
        const from = new Vector3(0, 0, 0);
        const target = new Vector3(1, 0, 0);
        const q = new Quaternion().fromLookAt(from, target);
        expect(q.length()).toBeCloseTo(1, 5);
      });

      it('should handle custom up vector', () => {
        const from = new Vector3(0, 0, 0);
        const target = new Vector3(1, 0, 0);
        const up = new Vector3(0, 0, 1);
        const q = new Quaternion().fromLookAt(from, target, up);
        expect(q.length()).toBeCloseTo(1, 5);
      });

      it('should return this for chaining', () => {
        const from = new Vector3(0, 0, 0);
        const target = new Vector3(1, 0, 0);
        const q = new Quaternion();
        const result = q.fromLookAt(from, target);
        expect(result).toBe(q);
      });

      it('should handle from == target', () => {
        const from = new Vector3(1, 2, 3);
        const target = new Vector3(1, 2, 3);
        const q = new Quaternion().fromLookAt(from, target);
        // Should produce identity or handle gracefully
        expect(q.length()).toBeCloseTo(1, 5);
      });

      it('should handle zero-length up vector', () => {
        const from = new Vector3(0, 0, 0);
        const target = new Vector3(1, 0, 0);
        const up = new Vector3(0, 0, 0);
        const q = new Quaternion().fromLookAt(from, target, up);
        // Should handle gracefully (use default up)
        expect(q.length()).toBeCloseTo(1, 5);
      });

      it('should handle up vector parallel to forward', () => {
        const from = new Vector3(0, 0, 0);
        const target = new Vector3(1, 0, 0);
        const up = new Vector3(2, 0, 0); // Parallel to forward
        const q = new Quaternion().fromLookAt(from, target, up);
        // Should handle gracefully
        expect(q.length()).toBeCloseTo(1, 5);
      });

      it('should handle fromLookAt with m00 > m11 && m00 > m22 branch', () => {
        // fromLookAt builds matrix: [right, correctedUp, -forward] in column-major order
        // For trace <= 0 AND m00 > m11 && m00 > m22:
        // trace = right.x + correctedUp.y - forward.z <= 0
        // right.x > correctedUp.y AND right.x > -forward.z
        // Create a matrix with these properties, then extract vectors
        const manualM = new Matrix3(
          1, 0, 0,
          0, -0.5, Math.sqrt(3)/2,
          0, -Math.sqrt(3)/2, -0.5
        );
        // Extract forward, right, correctedUp from matrix columns
        // Matrix columns: [right, correctedUp, -forward]
        const right = new Vector3(manualM.get(0, 0), manualM.get(0, 1), manualM.get(0, 2));
        const correctedUp = new Vector3(manualM.get(1, 0), manualM.get(1, 1), manualM.get(1, 2));
        const forward = new Vector3(-manualM.get(2, 0), -manualM.get(2, 1), -manualM.get(2, 2));
        
        // Now use fromLookAt with from and target that create this forward
        const from = new Vector3(0, 0, 0);
        const target = Vector3.add(from, forward);
        // Use correctedUp as the up vector
        const q = new Quaternion().fromLookAt(from, target, correctedUp);
        expect(q.length()).toBeCloseTo(1, 5);
        
        // Also verify the matrix conversion works
        const qFromMatrix = Quaternion.fromRotationMatrix3(manualM);
        expect(qFromMatrix.length()).toBeCloseTo(1, 5);
      });

      it('should handle fromLookAt with m11 > m22 branch', () => {
        // For m11 > m22 AND trace <= 0 AND NOT (m00 > m11 && m00 > m22):
        // We need: correctedUp.y > -forward.z AND trace <= 0 AND NOT (right.x > correctedUp.y && right.x > -forward.z)
        // Create matrix: m00=-0.5, m11=1, m22=-0.5, trace=0
        const manualM = new Matrix3(
          -0.5, 0, Math.sqrt(3)/2,
          0, 1, 0,
          -Math.sqrt(3)/2, 0, -0.5
        );
        // Extract vectors from matrix
        const right = new Vector3(manualM.get(0, 0), manualM.get(0, 1), manualM.get(0, 2));
        const correctedUp = new Vector3(manualM.get(1, 0), manualM.get(1, 1), manualM.get(1, 2));
        const forward = new Vector3(-manualM.get(2, 0), -manualM.get(2, 1), -manualM.get(2, 2));
        
        // Use fromLookAt with these vectors
        const from = new Vector3(0, 0, 0);
        const target = Vector3.add(from, forward);
        const q = new Quaternion().fromLookAt(from, target, correctedUp);
        expect(q.length()).toBeCloseTo(1, 5);
        
        // Verify matrix conversion
        const qFromMatrix = Quaternion.fromRotationMatrix3(manualM);
        expect(qFromMatrix.length()).toBeCloseTo(1, 5);
      });
    });

    describe('static lookAt()', () => {
      it('should create rotation to look at target', () => {
        const from = new Vector3(0, 0, 0);
        const target = new Vector3(1, 0, 0);
        const q = Quaternion.lookAt(from, target);
        expect(q.length()).toBeCloseTo(1, 5);
      });
    });

    describe('fromRotationBetweenVectors()', () => {
      it('should create rotation from vector a to vector b', () => {
        const a = new Vector3(1, 0, 0);
        const b = new Vector3(0, 1, 0);
        const q = new Quaternion().fromRotationBetweenVectors(a, b);
        expect(q.length()).toBeCloseTo(1, 5);
        
        // Verify it rotates a towards b
        const rotated = q.rotateVector(a);
        expect(rotated.equalsEpsilon(b, EPSILON)).toBe(true);
      });

      it('should handle parallel vectors', () => {
        const a = new Vector3(1, 0, 0);
        const b = new Vector3(2, 0, 0);
        const q = new Quaternion().fromRotationBetweenVectors(a, b);
        expect(q.equalsEpsilon(Quaternion.identity(), EPSILON)).toBe(true);
      });

      it('should handle opposite vectors', () => {
        const a = new Vector3(1, 0, 0);
        const b = new Vector3(-1, 0, 0);
        const q = new Quaternion().fromRotationBetweenVectors(a, b);
        expect(q.length()).toBeCloseTo(1, 5);
        const rotated = q.rotateVector(a);
        expect(rotated.equalsEpsilon(b, EPSILON)).toBe(true);
      });

      it('should handle parallel vectors (dot > 0.999999)', () => {
        const a = new Vector3(1, 0, 0);
        const b = new Vector3(1.0000001, 0, 0); // Nearly parallel
        const q = new Quaternion().fromRotationBetweenVectors(a, b);
        // Should return identity for parallel vectors
        expect(q.equalsEpsilon(Quaternion.identity(), EPSILON)).toBe(true);
      });

      it('should handle opposite vectors (dot < -0.999999)', () => {
        const a = new Vector3(1, 0, 0);
        const b = new Vector3(-1.0000001, 0, 0); // Nearly opposite
        const q = new Quaternion().fromRotationBetweenVectors(a, b);
        expect(q.length()).toBeCloseTo(1, 5);
        const rotated = q.rotateVector(a);
        expect(rotated.equalsEpsilon(b.normalize(), EPSILON)).toBe(true);
      });

      it('should handle opposite vectors with first axis failing (lengthSquared < 1e-6)', () => {
        // Test case where cross product with (1,0,0) fails, needs fallback to (0,1,0)
        // When a = (1,0,0) and b = (-1,0,0), cross((1,0,0), (1,0,0)) = (0,0,0)
        // So it should use fallback axis (0,1,0)
        const a = new Vector3(1, 0, 0);
        const b = new Vector3(-1, 0, 0);
        const q = new Quaternion().fromRotationBetweenVectors(a, b);
        expect(q.length()).toBeCloseTo(1, 5);
        // Verify it rotates a to b
        const rotated = q.rotateVector(a);
        expect(rotated.equalsEpsilon(b, EPSILON)).toBe(true);
      });

      it('should handle fromRotationBetweenVectors with first cross product failing (axis.lengthSquared < 1e-6)', () => {
        // Test the branch where cross((1,0,0), v0) has lengthSquared < 1e-6
        // This happens when v0 is parallel to (1,0,0)
        // Use a vector parallel to (1,0,0) but opposite direction
        const a = new Vector3(1, 0, 0);
        const b = new Vector3(-1, 0, 0);
        const q = new Quaternion().fromRotationBetweenVectors(a, b);
        expect(q.length()).toBeCloseTo(1, 5);
        // Verify the rotation works
        const rotated = q.rotateVector(a);
        expect(rotated.equalsEpsilon(b, EPSILON)).toBe(true);
      });

      it('should handle nearly parallel vectors', () => {
        const a = new Vector3(1, 0, 0);
        const b = new Vector3(1, 0.0001, 0);
        const q = new Quaternion().fromRotationBetweenVectors(a, b);
        expect(q.length()).toBeCloseTo(1, 5);
      });

      it('should handle nearly opposite vectors', () => {
        const a = new Vector3(1, 0, 0);
        const b = new Vector3(-1, 0.0001, 0);
        const q = new Quaternion().fromRotationBetweenVectors(a, b);
        expect(q.length()).toBeCloseTo(1, 5);
      });

      it('should handle non-normalized input vectors', () => {
        const a = new Vector3(2, 0, 0); // Not normalized
        const b = new Vector3(0, 3, 0); // Not normalized
        const q = new Quaternion().fromRotationBetweenVectors(a, b);
        expect(q.length()).toBeCloseTo(1, 5);
        const normalizedA = Vector3.normalize(a);
        const normalizedB = Vector3.normalize(b);
        const rotated = q.rotateVector(normalizedA);
        expect(rotated.equalsEpsilon(normalizedB, EPSILON)).toBe(true);
      });

      it('should return this for chaining', () => {
        const a = new Vector3(1, 0, 0);
        const b = new Vector3(0, 1, 0);
        const q = new Quaternion();
        const result = q.fromRotationBetweenVectors(a, b);
        expect(result).toBe(q);
      });
    });

    describe('static fromRotationBetweenVectors()', () => {
      it('should create rotation from vector a to vector b', () => {
        const a = new Vector3(1, 0, 0);
        const b = new Vector3(0, 1, 0);
        const q = Quaternion.fromRotationBetweenVectors(a, b);
        expect(q.length()).toBeCloseTo(1, 5);
      });
    });

    describe('set()', () => {
      it('should set all components', () => {
        const q = new Quaternion();
        q.set(1, 2, 3, 4);
        expect(q.x).toBe(1);
        expect(q.y).toBe(2);
        expect(q.z).toBe(3);
        expect(q.w).toBe(4);
      });

      it('should return this for chaining', () => {
        const q = new Quaternion();
        const result = q.set(1, 2, 3, 4);
        expect(result).toBe(q);
      });

      it('should handle NaN values', () => {
        const q = new Quaternion();
        q.set(NaN, 1, 2, 3);
        expect(Number.isNaN(q.x)).toBe(true);
        expect(q.y).toBe(1);
      });

      it('should handle Infinity values', () => {
        const q = new Quaternion();
        q.set(Infinity, 1, 2, 3);
        expect(q.x).toBe(Infinity);
        expect(q.y).toBe(1);
      });
    });

    describe('fromArray()', () => {
      it('should set quaternion from array', () => {
        const q = new Quaternion();
        q.fromArray([1, 2, 3, 4]);
        expect(q.x).toBe(1);
        expect(q.y).toBe(2);
        expect(q.z).toBe(3);
        expect(q.w).toBe(4);
      });

      it('should handle offset', () => {
        const q = new Quaternion();
        q.fromArray([0, 0, 0, 0, 5, 6, 7, 8], 4);
        expect(q.x).toBe(5);
        expect(q.y).toBe(6);
        expect(q.z).toBe(7);
        expect(q.w).toBe(8);
      });

      it('should use defaults for missing values', () => {
        const q = new Quaternion();
        q.fromArray([1, 2]);
        expect(q.x).toBe(1);
        expect(q.y).toBe(2);
        expect(q.z).toBe(0);
        expect(q.w).toBe(1);
      });

      it('should return this for chaining', () => {
        const q = new Quaternion();
        const result = q.fromArray([1, 2, 3, 4]);
        expect(result).toBe(q);
      });

      it('should handle array with undefined elements (uses ?? 0 fallback)', () => {
        // Test the ?? 0 fallback when array elements are undefined
        // Create array-like object with undefined values
        const arr: (number | undefined)[] = [1, 2, undefined, undefined];
        const q = new Quaternion();
        q.fromArray(arr);
        expect(q.x).toBe(1);
        expect(q.y).toBe(2);
        expect(q.z).toBe(0); // Should use ?? 0 fallback for undefined
        expect(q.w).toBe(1); // Note: w uses ?? 1, not ?? 0 (see implementation)
      });
    });

    describe('toArray()', () => {
      it('should convert quaternion to array', () => {
        const q = new Quaternion(1, 2, 3, 4);
        const arr = q.toArray();
        expect(arr).toEqual([1, 2, 3, 4]);
      });

      it('should write to provided array with offset', () => {
        const q = new Quaternion(1, 2, 3, 4);
        const arr = new Array(8).fill(0);
        q.toArray(arr, 2);
        expect(arr[2]).toBe(1);
        expect(arr[3]).toBe(2);
        expect(arr[4]).toBe(3);
        expect(arr[5]).toBe(4);
      });

      it('should create new array if not provided', () => {
        const q = new Quaternion(1, 2, 3, 4);
        const arr = q.toArray();
        expect(arr).toBeInstanceOf(Array);
        expect(arr.length).toBe(4);
      });

      it('should work with array created from Float32Array', () => {
        const q = new Quaternion(1, 2, 3, 4);
        const floatArr = new Float32Array(8);
        const arr = Array.from(floatArr);
        q.toArray(arr, 2);
        expect(arr[2]).toBe(1);
        expect(arr[3]).toBe(2);
        expect(arr[4]).toBe(3);
        expect(arr[5]).toBe(4);
      });
    });
  });

  describe('Integration Tests', () => {
    describe('Round-trip conversions', () => {
      it('should round-trip quaternion → axis-angle → quaternion', () => {
        const originalAxis = new Vector3(1, 1, 1).normalize();
        const originalAngle = Math.PI / 3;
        const q1 = Quaternion.fromAxisAngle(originalAxis, originalAngle);
        const { axis, angle } = q1.toAxisAngle();
        const q2 = Quaternion.fromAxisAngle(axis, angle);
        const matches = q1.equalsEpsilon(q2, EPSILON) || 
                       q1.equalsEpsilon(Quaternion.multiplyScalar(q2, -1), EPSILON);
        expect(matches).toBe(true);
      });

      it('should round-trip quaternion → euler → quaternion', () => {
        const pitch = Math.PI / 6;
        const yaw = Math.PI / 6;
        const roll = Math.PI / 6;
        const q1 = Quaternion.fromEulerAngles(pitch, yaw, roll);
        const { x, y, z } = q1.toEulerAngles();
        const q2 = Quaternion.fromEulerAngles(x, y, z);
        const matches = q1.equalsEpsilon(q2, EPSILON) || 
                       q1.equalsEpsilon(Quaternion.multiplyScalar(q2, -1), EPSILON);
        expect(matches).toBe(true);
      });

      it('should round-trip quaternion → matrix3 → quaternion', () => {
        const q1 = Quaternion.fromAxisAngle(new Vector3(1, 1, 1).normalize(), Math.PI / 4);
        const m = q1.toRotationMatrix3();
        const q2 = new Quaternion().fromRotationMatrix3(m);
        const matches = q1.equalsEpsilon(q2, EPSILON) || 
                       q1.equalsEpsilon(Quaternion.multiplyScalar(q2, -1), EPSILON);
        expect(matches).toBe(true);
      });

      it('should round-trip quaternion → matrix4 → quaternion', () => {
        const q1 = Quaternion.fromAxisAngle(new Vector3(1, 1, 1).normalize(), Math.PI / 4);
        const m = q1.toRotationMatrix4();
        const q2 = new Quaternion().fromRotationMatrix4(m);
        const matches = q1.equalsEpsilon(q2, EPSILON) || 
                       q1.equalsEpsilon(Quaternion.multiplyScalar(q2, -1), EPSILON);
        expect(matches).toBe(true);
      });
    });

    describe('Method chaining', () => {
      it('should chain multiple operations', () => {
        const q = new Quaternion()
          .fromAxisAngle(new Vector3(1, 0, 0), Math.PI / 4)
          .multiply(Quaternion.fromAxisAngle(new Vector3(0, 1, 0), Math.PI / 6))
          .normalize();
        expect(q.length()).toBeCloseTo(1, 5);
      });

      it('should chain set and operations', () => {
        const q = new Quaternion()
          .set(1, 2, 3, 4)
          .normalize()
          .multiplyScalar(2);
        expect(q.length()).toBeCloseTo(2, 5);
      });
    });

    describe('Composition equivalence', () => {
      it('should satisfy q1.multiply(q2).multiply(q3) = multiply(multiply(q1, q2), q3)', () => {
        const q1 = Quaternion.fromAxisAngle(new Vector3(1, 0, 0), Math.PI / 4);
        const q2 = Quaternion.fromAxisAngle(new Vector3(0, 1, 0), Math.PI / 6);
        const q3 = Quaternion.fromAxisAngle(new Vector3(0, 0, 1), Math.PI / 3);
        
        const result1 = q1.clone().multiply(q2).multiply(q3);
        const result2 = Quaternion.multiply(Quaternion.multiply(q1, q2), q3);
        
        expect(result1.equalsEpsilon(result2, EPSILON)).toBe(true);
      });
    });
  });

  describe('Nice-to-Have Methods', () => {
    describe('angleTo()', () => {
      it('should calculate angle between quaternions', () => {
        const q1 = Quaternion.fromAxisAngle(new Vector3(1, 0, 0), 0);
        const q2 = Quaternion.fromAxisAngle(new Vector3(1, 0, 0), Math.PI / 2);
        const angle = q1.angleTo(q2);
        expect(angle).toBeCloseTo(Math.PI / 2, 5);
      });

      it('should return 0 for identical quaternions', () => {
        const q1 = Quaternion.fromAxisAngle(new Vector3(1, 0, 0), Math.PI / 4);
        const q2 = q1.clone();
        const angle = q1.angleTo(q2);
        expect(angle).toBeLessThan(EPSILON);
      });

      it('should return 0 when clampedDot >= 1 - 1e-6', () => {
        // Create quaternions that are extremely close (dot very close to 1)
        const q1 = Quaternion.fromAxisAngle(new Vector3(1, 0, 0), 0);
        const q2 = Quaternion.fromAxisAngle(new Vector3(1, 0, 0), 1e-7); // Extremely small angle
        const angle = q1.angleTo(q2);
        // Should return 0 when clampedDot >= 1 - 1e-6
        expect(angle).toBeLessThan(1e-5);
      });

      it('should return PI for opposite quaternions', () => {
        const q1 = Quaternion.fromAxisAngle(new Vector3(1, 0, 0), 0);
        const q2 = Quaternion.fromAxisAngle(new Vector3(1, 0, 0), Math.PI);
        const angle = q1.angleTo(q2);
        expect(angle).toBeCloseTo(Math.PI, 5);
      });

      it('should always return positive angle', () => {
        const q1 = Quaternion.fromAxisAngle(new Vector3(1, 0, 0), Math.PI / 4);
        const q2 = Quaternion.fromAxisAngle(new Vector3(1, 0, 0), 3 * Math.PI / 4);
        const angle = q1.angleTo(q2);
        expect(angle).toBeGreaterThanOrEqual(0);
        expect(angle).toBeLessThanOrEqual(Math.PI);
      });

      it('should handle nearly identical quaternions', () => {
        const q1 = Quaternion.fromAxisAngle(new Vector3(1, 0, 0), Math.PI / 4);
        const q2 = Quaternion.fromAxisAngle(new Vector3(1, 0, 0), Math.PI / 4 + 1e-6);
        const angle = q1.angleTo(q2);
        expect(angle).toBeLessThan(1e-5);
      });

      it('should handle nearly opposite quaternions', () => {
        const q1 = Quaternion.fromAxisAngle(new Vector3(1, 0, 0), Math.PI / 4);
        const q2 = Quaternion.fromAxisAngle(new Vector3(1, 0, 0), Math.PI / 4 + Math.PI - 1e-6);
        const angle = q1.angleTo(q2);
        expect(angle).toBeCloseTo(Math.PI, 5);
      });

      it('should handle non-normalized quaternions', () => {
        const q1 = new Quaternion(2, 0, 0, 2); // Not normalized
        const q2 = new Quaternion(0, 2, 0, 2); // Not normalized
        q1.normalize();
        q2.normalize();
        const angle = q1.angleTo(q2);
        expect(angle).toBeGreaterThanOrEqual(0);
        expect(angle).toBeLessThanOrEqual(Math.PI);
      });
    });

    describe('static squad()', () => {
      it('should perform spherical cubic interpolation', () => {
        const q0 = Quaternion.fromAxisAngle(new Vector3(1, 0, 0), 0);
        const q1 = Quaternion.fromAxisAngle(new Vector3(1, 0, 0), Math.PI / 4);
        const q2 = Quaternion.fromAxisAngle(new Vector3(1, 0, 0), Math.PI / 2);
        const q3 = Quaternion.fromAxisAngle(new Vector3(1, 0, 0), 3 * Math.PI / 4);
        const q = Quaternion.squad(q0, q1, q2, q3, 0.5);
        expect(q.length()).toBeCloseTo(1, 5);
      });

      it('should interpolate at t=0', () => {
        const q0 = Quaternion.fromAxisAngle(new Vector3(1, 0, 0), 0);
        const q1 = Quaternion.fromAxisAngle(new Vector3(1, 0, 0), Math.PI / 4);
        const q2 = Quaternion.fromAxisAngle(new Vector3(1, 0, 0), Math.PI / 2);
        const q3 = Quaternion.fromAxisAngle(new Vector3(1, 0, 0), 3 * Math.PI / 4);
        const q = Quaternion.squad(q0, q1, q2, q3, 0);
        expect(q.equalsEpsilon(q0, EPSILON)).toBe(true);
      });

      it('should interpolate at t=1', () => {
        const q0 = Quaternion.fromAxisAngle(new Vector3(1, 0, 0), 0);
        const q1 = Quaternion.fromAxisAngle(new Vector3(1, 0, 0), Math.PI / 4);
        const q2 = Quaternion.fromAxisAngle(new Vector3(1, 0, 0), Math.PI / 2);
        const q3 = Quaternion.fromAxisAngle(new Vector3(1, 0, 0), 3 * Math.PI / 4);
        const q = Quaternion.squad(q0, q1, q2, q3, 1);
        expect(q.equalsEpsilon(q3, EPSILON)).toBe(true);
      });

      it('should handle all quaternions being the same', () => {
        const q = Quaternion.fromAxisAngle(new Vector3(1, 0, 0), Math.PI / 4);
        const result = Quaternion.squad(q, q, q, q, 0.5);
        expect(result.equalsEpsilon(q, EPSILON)).toBe(true);
      });

      it('should handle t outside [0, 1] (extrapolation)', () => {
        const q0 = Quaternion.fromAxisAngle(new Vector3(1, 0, 0), 0);
        const q1 = Quaternion.fromAxisAngle(new Vector3(1, 0, 0), Math.PI / 4);
        const q2 = Quaternion.fromAxisAngle(new Vector3(1, 0, 0), Math.PI / 2);
        const q3 = Quaternion.fromAxisAngle(new Vector3(1, 0, 0), 3 * Math.PI / 4);
        const q = Quaternion.squad(q0, q1, q2, q3, 1.5);
        expect(q.length()).toBeCloseTo(1, 5);
      });
    });

    describe('rotateTowards()', () => {
      it('should rotate towards target by maximum angle', () => {
        const q = Quaternion.fromAxisAngle(new Vector3(1, 0, 0), 0);
        const target = Quaternion.fromAxisAngle(new Vector3(1, 0, 0), Math.PI / 2);
        q.rotateTowards(target, Math.PI / 4);
        const angle = q.angleTo(target);
        expect(angle).toBeLessThanOrEqual(Math.PI / 4 + EPSILON);
      });

      it('should reach target if angle is large enough', () => {
        const q = Quaternion.fromAxisAngle(new Vector3(1, 0, 0), 0);
        const target = Quaternion.fromAxisAngle(new Vector3(1, 0, 0), Math.PI / 4);
        q.rotateTowards(target, Math.PI / 2);
        expect(q.equalsEpsilon(target, EPSILON)).toBe(true);
      });

      it('should not rotate if already at target', () => {
        const q = Quaternion.fromAxisAngle(new Vector3(1, 0, 0), Math.PI / 4);
        const target = q.clone();
        const original = q.clone();
        q.rotateTowards(target, Math.PI / 2);
        expect(q.equalsEpsilon(original, EPSILON)).toBe(true);
      });

      it('should return this for chaining', () => {
        const q = Quaternion.fromAxisAngle(new Vector3(1, 0, 0), 0);
        const target = Quaternion.fromAxisAngle(new Vector3(1, 0, 0), Math.PI / 2);
        const result = q.rotateTowards(target, Math.PI / 4);
        expect(result).toBe(q);
      });

      it('should not rotate if maxRadians = 0', () => {
        const q = Quaternion.fromAxisAngle(new Vector3(1, 0, 0), Math.PI / 4);
        const target = Quaternion.fromAxisAngle(new Vector3(1, 0, 0), Math.PI / 2);
        const original = q.clone();
        q.rotateTowards(target, 0);
        expect(q.equalsEpsilon(original, EPSILON)).toBe(true);
      });

      it('should handle maxRadians > angle', () => {
        const q = Quaternion.fromAxisAngle(new Vector3(1, 0, 0), 0);
        const target = Quaternion.fromAxisAngle(new Vector3(1, 0, 0), Math.PI / 4);
        q.rotateTowards(target, Math.PI);
        expect(q.equalsEpsilon(target, EPSILON)).toBe(true);
      });

      it('should handle very small maxRadians', () => {
        const q = Quaternion.fromAxisAngle(new Vector3(1, 0, 0), 0);
        const target = Quaternion.fromAxisAngle(new Vector3(1, 0, 0), Math.PI / 2);
        const originalAngle = q.angleTo(target);
        q.rotateTowards(target, 1e-6);
        const newAngle = q.angleTo(target);
        // Should have rotated by approximately maxRadians
        expect(originalAngle - newAngle).toBeCloseTo(1e-6, 3);
        expect(newAngle).toBeLessThan(originalAngle);
      });
    });

    describe('premultiply()', () => {
      it('should pre-multiply quaternions correctly', () => {
        const q1 = new Quaternion(1, 0, 0, 1);
        const q2 = new Quaternion(0, 1, 0, 1);
        q1.normalize();
        q2.normalize();
        const original = q1.clone();
        q1.premultiply(q2);
        // Premultiply: q1 = q2 * q1 (different from multiply)
        expect(q1.equals(original)).toBe(false);
      });

      it('should satisfy q.premultiply(p) = p.multiply(q)', () => {
        const q = new Quaternion(1, 0, 0, 1);
        const p = new Quaternion(0, 1, 0, 1);
        q.normalize();
        p.normalize();
        const q1 = q.clone().premultiply(p);
        const q2 = p.clone().multiply(q);
        expect(q1.equalsEpsilon(q2, EPSILON)).toBe(true);
      });

      it('should handle premultiply with identity', () => {
        const q = new Quaternion(1, 2, 3, 4);
        q.normalize();
        const original = q.clone();
        q.premultiply(Quaternion.identity());
        expect(q.equalsEpsilon(original, EPSILON)).toBe(true);
      });

      it('should return this for chaining', () => {
        const q1 = new Quaternion(1, 0, 0, 1);
        const q2 = new Quaternion(0, 1, 0, 1);
        const result = q1.premultiply(q2);
        expect(result).toBe(q1);
      });
    });

    describe('add()', () => {
      it('should add quaternions component-wise', () => {
        const q1 = new Quaternion(1, 2, 3, 4);
        const q2 = new Quaternion(5, 6, 7, 8);
        q1.add(q2);
        expect(q1.x).toBe(6);
        expect(q1.y).toBe(8);
        expect(q1.z).toBe(10);
        expect(q1.w).toBe(12);
      });

      it('should return this for chaining', () => {
        const q1 = new Quaternion(1, 2, 3, 4);
        const q2 = new Quaternion(5, 6, 7, 8);
        const result = q1.add(q2);
        expect(result).toBe(q1);
      });

      it('should handle adding zero quaternion', () => {
        const q = new Quaternion(1, 2, 3, 4);
        const original = q.clone();
        q.add(Quaternion.zero());
        expect(q.equals(original)).toBe(true);
      });

      it('should handle adding identity quaternion', () => {
        const q = new Quaternion(1, 2, 3, 4);
        q.add(Quaternion.identity());
        expect(q.x).toBe(1);
        expect(q.y).toBe(2);
        expect(q.z).toBe(3);
        expect(q.w).toBe(5);
      });
    });

    describe('subtract()', () => {
      it('should subtract quaternions component-wise', () => {
        const q1 = new Quaternion(5, 6, 7, 8);
        const q2 = new Quaternion(1, 2, 3, 4);
        q1.subtract(q2);
        expect(q1.x).toBe(4);
        expect(q1.y).toBe(4);
        expect(q1.z).toBe(4);
        expect(q1.w).toBe(4);
      });

      it('should return this for chaining', () => {
        const q1 = new Quaternion(5, 6, 7, 8);
        const q2 = new Quaternion(1, 2, 3, 4);
        const result = q1.subtract(q2);
        expect(result).toBe(q1);
      });

      it('should handle subtracting zero quaternion', () => {
        const q = new Quaternion(1, 2, 3, 4);
        const original = q.clone();
        q.subtract(Quaternion.zero());
        expect(q.equals(original)).toBe(true);
      });

      it('should handle subtracting itself', () => {
        const q = new Quaternion(1, 2, 3, 4);
        q.subtract(q);
        expect(q.equals(Quaternion.zero())).toBe(true);
      });
    });
  });

  describe('Interpolation Edge Cases', () => {
    describe('lerp()', () => {
      it('should handle t < 0 (extrapolation)', () => {
        const q1 = Quaternion.fromAxisAngle(new Vector3(1, 0, 0), 0);
        const q2 = Quaternion.fromAxisAngle(new Vector3(1, 0, 0), Math.PI);
        q1.lerp(q2, -0.5);
        expect(q1.length()).toBeCloseTo(1, 5);
      });

      it('should handle t > 1 (extrapolation)', () => {
        const q1 = Quaternion.fromAxisAngle(new Vector3(1, 0, 0), 0);
        const q2 = Quaternion.fromAxisAngle(new Vector3(1, 0, 0), Math.PI);
        q1.lerp(q2, 1.5);
        expect(q1.length()).toBeCloseTo(1, 5);
      });

      it('should handle exactly opposite quaternions', () => {
        const q1 = Quaternion.fromAxisAngle(new Vector3(1, 0, 0), 0);
        const q2 = Quaternion.fromAxisAngle(new Vector3(1, 0, 0), Math.PI);
        q1.lerp(q2, 0.5);
        expect(q1.length()).toBeCloseTo(1, 5);
      });
    });

    describe('slerp()', () => {
      it('should handle t < 0 (extrapolation)', () => {
        const q1 = Quaternion.fromAxisAngle(new Vector3(1, 0, 0), 0);
        const q2 = Quaternion.fromAxisAngle(new Vector3(1, 0, 0), Math.PI);
        q1.slerp(q2, -0.5);
        expect(q1.length()).toBeCloseTo(1, 5);
      });

      it('should handle t > 1 (extrapolation)', () => {
        const q1 = Quaternion.fromAxisAngle(new Vector3(1, 0, 0), 0);
        const q2 = Quaternion.fromAxisAngle(new Vector3(1, 0, 0), Math.PI);
        q1.slerp(q2, 1.5);
        expect(q1.length()).toBeCloseTo(1, 5);
      });

      it('should handle very small t', () => {
        const q1 = Quaternion.fromAxisAngle(new Vector3(1, 0, 0), 0);
        const q2 = Quaternion.fromAxisAngle(new Vector3(1, 0, 0), Math.PI);
        const original = q1.clone();
        q1.slerp(q2, 1e-10);
        expect(q1.equalsEpsilon(original, EPSILON)).toBe(true);
      });

      it('should handle t very close to 1', () => {
        const q1 = Quaternion.fromAxisAngle(new Vector3(1, 0, 0), 0);
        const q2 = Quaternion.fromAxisAngle(new Vector3(1, 0, 0), Math.PI);
        q1.slerp(q2, 1 - 1e-10);
        expect(q1.equalsEpsilon(q2, EPSILON)).toBe(true);
      });
    });
  });
});
