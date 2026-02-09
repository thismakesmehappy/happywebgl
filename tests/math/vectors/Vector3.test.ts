/**
 * Vector3 Test Suite
 * 
 * Tests for the Vector3 class covering:
 * - Basic arithmetic operations
 * - Length and normalization
 * - Dot and cross products
 * - Utility methods (clone, copy, equals)
 * - Component accessors
 */

import { describe, it, expect } from 'vitest';
import { Vector3 } from '../../../src/math/vectors/Vector3.js';
import { EPSILON } from '../../helpers/const.js';

describe('Vector3', () => {
  describe('Constructor', () => {
    it('should create a zero vector by default', () => {
      const v = new Vector3();
      expect(v.x).toBe(0);
      expect(v.y).toBe(0);
      expect(v.z).toBe(0);
    });

    it('should create a vector with given components', () => {
      const x = 1.0;
      const y = 0.5;
      const z = 0.25;
      const v = new Vector3(x, y, z);
      expect(v.x).toBe(x);
      expect(v.y).toBe(y);
      expect(v.z).toBe(z);
    });
  });

  describe('Component Accessors', () => {
    it('should access components via x, y, z', () => {
        const x = 1.0;
        const y = 0.5;
        const z = 0.25;
        const v = new Vector3();
        v.x = x;
        v.y = y;
        v.z = z;
        expect(v.x).toBe(x);
        expect(v.y).toBe(y);
        expect(v.z).toBe(z);
    });

    it('should access components via r, g, b (color)', () => {
        const x = 1.0;
        const y = 0.5;
        const z = 0.25;
        const v = new Vector3();
        v.r = x;
        v.g = y;
        v.b = z;
        expect(v.r).toBe(x);
        expect(v.g).toBe(y);
        expect(v.b).toBe(z);
    });

    it('should access components via s, t, p (texture)', () => {
        const x = 1.0;
        const y = 0.5;
        const z = 0.25;
        const v = new Vector3();
        v.s = x;
        v.t = y;
        v.p = z;
        expect(v.s).toBe(x);
        expect(v.t).toBe(y);
        expect(v.p).toBe(z);
    });

    it('should have all accessors refer to the same data', () => {
        const x = 1.0;
        const y = 0.5;
        const z = 0.25;
        const v = new Vector3();
        v.x = x;
        v.y = y;
        v.z = z;
        expect(v.x).toBe(v.r);
        expect(v.y).toBe(v.g);
        expect(v.z).toBe(v.b);
        expect(v.x).toBe(v.s);
        expect(v.y).toBe(v.t);
        expect(v.z).toBe(v.p);
    });
  });

  describe('Basic Arithmetic - Mutating', () => {
    it('should add another vector', () => {
      const v = new Vector3(1.0, 2.0, 3.0);
      const v2 = new Vector3(4.0, 5.0, 6.0);
      v.add(v2);
      expect(v.x).toBe(5.0);
      expect(v.y).toBe(7.0);
      expect(v.z).toBe(9.0);
    });

    it('should subtract another vector', () => {
        const v = new Vector3(1.0, 2.0, 3.0);
        const v2 = new Vector3(4.0, 5.0, 6.0);
        v.subtract(v2);
        expect(v.x).toBe(-3.0);
        expect(v.y).toBe(-3.0);
        expect(v.z).toBe(-3.0);

    });

    it('should multiply by scalar', () => {
      const v = new Vector3(1.0, 2.0, 3.0);
      v.multiplyScalar(2.0);
      expect(v.x).toBe(2.0);
      expect(v.y).toBe(4.0);
      expect(v.z).toBe(6.0);
    });

    it('should divide by scalar', () => {
      const v = new Vector3(2.0, 5.0, 3.0);
      v.divideScalar(2.0);
      expect(v.x).toBe(1.0);
      expect(v.y).toBe(2.5);
      expect(v.z).toBe(1.5);
    });

    it('should throw error when dividing by zero', () => {
      const v = new Vector3(2.0, 5.0, 3.0);
      expect(() => v.divideScalar(0.0)).toThrow('Cannot divide vector by zero');
    });

    it('should support method chaining', () => {
      const v = new Vector3(1.0, 2.0, 3.0);
      v.add(new Vector3(4.0, 5.0, 6.0)).multiplyScalar(2.0);
      expect(v.x).toBe(10.0);
      expect(v.y).toBe(14.0);
      expect(v.z).toBe(18.0);
    });
  });

  describe('Basic Arithmetic - Static', () => {
    it('should add two vectors without mutation', () => {
      const v1 = new Vector3(1.0, 2.0, 3.0);
      const v2 = new Vector3(4.0, 5.0, 6.0);
      const v3 = Vector3.add(v1, v2);
      expect(v3.x).toBe(5.0);
      expect(v3.y).toBe(7.0);
      expect(v3.z).toBe(9.0);
      expect(v1.x).toBe(1.0);
      expect(v1.y).toBe(2.0);
      expect(v1.z).toBe(3.0);
      expect(v2.x).toBe(4.0);
      expect(v2.y).toBe(5.0);
      expect(v2.z).toBe(6.0);
    });

    it('should subtract two vectors without mutation', () => {
      const v1 = new Vector3(1.0, 2.0, 3.0);
      const v2 = new Vector3(4.0, 5.0, 6.0);
      const v3 = Vector3.subtract(v1, v2);
      expect(v3.x).toBe(-3.0);
      expect(v3.y).toBe(-3.0);
      expect(v3.z).toBe(-3.0);
      expect(v1.x).toBe(1.0);
      expect(v1.y).toBe(2.0);
      expect(v1.z).toBe(3.0);
      expect(v2.x).toBe(4.0);
      expect(v2.y).toBe(5.0);
      expect(v2.z).toBe(6.0);
    });

    it('should multiply vector by scalar without mutation', () => {
      const v1 = new Vector3(1.0, 2.0, 3.0);
      const v2 = Vector3.multiplyScalar(v1, 2.0);
      expect(v2.x).toBe(2.0);
      expect(v2.y).toBe(4.0);
      expect(v2.z).toBe(6.0);
      expect(v1.x).toBe(1.0);
      expect(v1.y).toBe(2.0);
      expect(v1.z).toBe(3.0);
    });

    it('should divide vector by scalar without mutation', () => {
      const v1 = new Vector3(2.0, 5.0, 3.0);
      const v2 = Vector3.divideScalar(v1, 2.0);
      expect(v2.x).toBe(1.0);
      expect(v2.y).toBe(2.5);
      expect(v2.z).toBe(1.5);
      expect(v1.x).toBe(2.0);
      expect(v1.y).toBe(5.0);
      expect(v1.z).toBe(3.0);
    });
  });

  describe('Length Operations', () => {
    it('should calculate length correctly', () => {
      const v = new Vector3(3.0, 4.0, 0.0);
      expect(v.length()).toBe(5.0);
    });

    it('should calculate length squared correctly', () => {
      const v = new Vector3(3.0, 4.0, 0.0);
      expect(v.lengthSquared()).toBe(25.0);
    });

    it('should return zero length for zero vector', () => {
      const v = new Vector3(0.0, 0.0, 0.0);
      expect(v.length()).toBe(0.0);
      expect(v.lengthSquared()).toBe(0.0);
    });
  });

  describe('Normalization', () => {
    it('should normalize vector to unit length (mutating)', () => {
      const v = new Vector3(3.0, 4.0, 0.0);
      v.normalize();
      const expected = new Vector3(0.6, 0.8, 0.0);
      expect(v.equalsEpsilon(expected, EPSILON)).toBe(true);
      // (3, 4, 0) normalized should be (0.6, 0.8, 0)
    });

    it('should normalize vector to unit length (static)', () => {
      const v1 = new Vector3(3.0, 4.0, 0.0);
      const v2 = Vector3.normalize(v1);
      const expected = new Vector3(0.6, 0.8, 0.0);
      expect(v2.equalsEpsilon(expected, EPSILON)).toBe(true);
      expect(v1.x).toBe(3.0);
      expect(v1.y).toBe(4.0);
      expect(v1.z).toBe(0.0);
    });

    it('should handle zero vector gracefully', () => {
      const v = new Vector3(0.0, 0.0, 0.0);
      v.normalize();
      expect(v.x).toBe(0.0);
      expect(v.y).toBe(0.0);
      expect(v.z).toBe(0.0);
      // normalize(0,0,0) should return unchanged/zero vector
    });

    it('should preserve direction when normalizing', () => {
      const v = new Vector3(3.0, 4.0, 0.0);
      const expected = new Vector3(0.6, 0.8, 0.0);
      v.normalize();
      expect(v.equalsEpsilon(expected, EPSILON)).toBe(true);
    });
  });

  describe('Dot Product', () => {
    it('should calculate dot product correctly', () => {
      const v1 = new Vector3(1.0, 2.0, 3.0);
      const v2 = new Vector3(4.0, 5.0, 6.0);
      expect(v1.dot(v2)).toBe(32.0);
      // (1, 2, 3) · (4, 5, 6) = 32
    });

    it('should return zero for perpendicular vectors', () => {
      const v1 = new Vector3(1.0, 0.0, 0.0);
      const v2 = new Vector3(0.0, 1.0, 0.0);
      expect(v1.dot(v2)).toBe(0.0);
      // (1, 0, 0) · (0, 1, 0) = 0
    });

    it('should calculate dot product via static method', () => {
      const v1 = new Vector3(1.0, 2.0, 3.0);
      const v2 = new Vector3(4.0, 5.0, 6.0);
      expect(Vector3.dot(v1, v2)).toBe(32.0);
      expect(v1.x).toBe(1.0);
      expect(v1.y).toBe(2.0);
      expect(v1.z).toBe(3.0);
      expect(v2.x).toBe(4.0);
      expect(v2.y).toBe(5.0);
      expect(v2.z).toBe(6.0);
    });
  });

  describe('Cross Product', () => {
    it('should calculate cross product correctly (mutating)', () => {
      const v1 = new Vector3(1.0, 0.0, 0.0);
      const v2 = new Vector3(0.0, 1.0, 0.0);
      v1.cross(v2);
      expect(v1.x).toBe(0.0);
      expect(v1.y).toBe(0.0);
      expect(v1.z).toBe(1.0);
      // (1, 0, 0) × (0, 1, 0) = (0, 0, 1)
    });

    it('should calculate cross product correctly (static)', () => {
      const v1 = new Vector3(1.0, 0.0, 0.0);
      const v2 = new Vector3(0.0, 1.0, 0.0);
      const v3 = Vector3.cross(v1, v2);
      expect(v3.x).toBe(0.0);
      expect(v3.y).toBe(0.0);
      expect(v3.z).toBe(1.0);
      expect(v1.x).toBe(1.0);
      expect(v1.y).toBe(0.0);
      expect(v1.z).toBe(0.0);
    });

    it('should be anti-commutative', () => {
      const v1 = new Vector3(1.0, 0.0, 0.0);
      const v2 = new Vector3(0.0, 1.0, 0.0);
      const v3 = v1.clone().cross(v2);
      const v4 = v2.clone().cross(v1);
      expect(v3.x).toBe(0.0);
      expect(v3.y).toBe(0.0);
      expect(v3.z).toBe(1.0);
      expect(v4.x).toBe(0.0);
      expect(v4.y).toBe(0.0);
      expect(v4.z).toBe(-1.0);
      // Check anti-commutative property: a × b = -(b × a)
      // This means v3 + v4 should equal zero vector
      const sum = v3.clone().add(v4);
      expect(sum.equals(new Vector3(0, 0, 0))).toBe(true);
    });

    it('should produce perpendicular vector', () => {
      const v1 = new Vector3(1.0, 0.0, 0.0);
      const v2 = new Vector3(0.0, 1.0, 0.0);
      const v3 = v1.cross(v2);
      expect(v3.x).toBe(0.0);
      expect(v3.y).toBe(0.0);
      expect(v3.z).toBe(1.0);
      // Result should be perpendicular to both inputs
    });
  });

  describe('Utility Methods', () => {
    it('should clone vector correctly', () => {
      const v1 = new Vector3(1.0, 2.0, 3.0);
      const v2 = v1.clone();
      expect(v2.x).toBe(1.0);
      expect(v2.y).toBe(2.0);
      expect(v2.z).toBe(3.0);
      expect(v1.x).toBe(1.0);
      expect(v1.y).toBe(2.0);
      expect(v1.z).toBe(3.0);
    });

    it('should copy vector values correctly', () => {
      const v1 = new Vector3(1.0, 2.0, 3.0);
      const v2 = new Vector3();
      v2.copy(v1);
      expect(v2.x).toBe(1.0);
      expect(v2.y).toBe(2.0);
      expect(v2.z).toBe(3.0);
      expect(v1.x).toBe(1.0);
      expect(v1.y).toBe(2.0);
      expect(v1.z).toBe(3.0);
      // copy() should modify this vector
    });

    it('should compare vectors for equality', () => {
      const v1 = new Vector3(1.0, 2.0, 3.0);
      const v2 = new Vector3(1.0, 2.0, 3.0);
      expect(v1.equals(v2)).toBe(true);
      expect(v1.x).toBe(1.0);
      expect(v1.y).toBe(2.0);
      expect(v1.z).toBe(3.0);
      expect(v2.x).toBe(1.0);
      expect(v2.y).toBe(2.0);
      expect(v2.z).toBe(3.0);
    });

    it('should return false for unequal vectors', () => {
      const v1 = new Vector3(1.0, 2.0, 3.0);
      const v2 = new Vector3(4.0, 5.0, 6.0);
      expect(v1.equals(v2)).toBe(false);
      expect(v1.x).toBe(1.0);
      expect(v1.y).toBe(2.0);
      expect(v1.z).toBe(3.0);
      expect(v2.x).toBe(4.0);
      expect(v2.y).toBe(5.0);
      expect(v2.z).toBe(6.0);
    });
  });
});
