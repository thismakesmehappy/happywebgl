/**
 * Vector2 Test Suite
 * 
 * Tests for the Vector2 class covering:
 * - Basic arithmetic operations
 * - Length and normalization
 * - Dot and cross products
 * - Utility methods (clone, copy, equals)
 * - Component accessors
 */

import { describe, it, expect } from 'vitest';
import { Vector2 } from '../../../src/math/vectors/Vector2.js';
import { EPSILON } from '../../helpers/const.js';

describe('Vector2', () => {
  describe('Constructor', () => {
    it('should create a zero vector by default', () => {
      const v = new Vector2();
      expect(v.x).toBe(0);
      expect(v.y).toBe(0);
    });

    it('should create a vector with given components', () => {
      const x = 1.0;
      const y = 0.5;
      const v = new Vector2(x, y);
      expect(v.x).toBe(x);
      expect(v.y).toBe(y);
    });
  });

  describe('Component Accessors', () => {
    it('should access components via x, y', () => {
        const x = 1.0;
        const y = 0.5;
        const v = new Vector2();
        v.x = x;
        v.y = y;
        expect(v.x).toBe(x);
        expect(v.y).toBe(y);
    });

    it('should access components via r, g (color)', () => {
        const x = 1.0;
        const y = 0.5;
        const v = new Vector2();
        v.r = x;
        v.g = y;
        expect(v.r).toBe(x);
        expect(v.g).toBe(y);
    });

    it('should access components via s, t (texture)', () => {
        const x = 1.0;
        const y = 0.5;
        const v = new Vector2();
        v.s = x;
        v.t = y;
        expect(v.s).toBe(x);
        expect(v.t).toBe(y);
    });

    it('should have all accessors refer to the same data', () => {
        const x = 1.0;
        const y = 0.5;
        const v = new Vector2();
        v.x = x;
        v.y = y;
        expect(v.x).toBe(v.r);
        expect(v.y).toBe(v.g);
        expect(v.x).toBe(v.s);
        expect(v.y).toBe(v.t);
    });
  });

  describe('Basic Arithmetic - Mutating', () => {
    it('should add another vector', () => {
      const v = new Vector2(1.0, 2.0);
      const v2 = new Vector2(4.0, 5.0);
      v.add(v2);
      expect(v.x).toBe(5.0);
      expect(v.y).toBe(7.0);
    });

    it('should subtract another vector', () => {
        const v = new Vector2(1.0, 2.0);
        const v2 = new Vector2(4.0, 5.0);
        v.subtract(v2);
        expect(v.x).toBe(-3.0);
        expect(v.y).toBe(-3.0);

    });

    it('should multiply by scalar', () => {
      const v = new Vector2(1.0, 2.0);
      v.multiplyScalar(2.0);
      expect(v.x).toBe(2.0);
      expect(v.y).toBe(4.0);
    });

    it('should divide by scalar', () => {
      const v = new Vector2(2.0, 5.0);
      v.divideScalar(2.0);
      expect(v.x).toBe(1.0);
      expect(v.y).toBe(2.5);
    });

    it('should throw error when dividing by zero', () => {
      const v = new Vector2(2.0, 5.0);
      expect(() => v.divideScalar(0.0)).toThrow('Cannot divide vector by zero');
    });

    it('should support method chaining', () => {
      const v = new Vector2(1.0, 2.0);
      v.add(new Vector2(4.0, 5.0)).multiplyScalar(2.0);
      expect(v.x).toBe(10.0);
      expect(v.y).toBe(14.0);
    });
  });

  describe('Basic Arithmetic - Static', () => {
    it('should add two vectors without mutation', () => {
      const v1 = new Vector2(1.0, 2.0);
      const v2 = new Vector2(4.0, 5.0);
      const v3 = Vector2.add(v1, v2);
      expect(v3.x).toBe(5.0);
      expect(v3.y).toBe(7.0);
      expect(v1.x).toBe(1.0);
      expect(v1.y).toBe(2.0);
      expect(v2.x).toBe(4.0);
      expect(v2.y).toBe(5.0);
    });

    it('should subtract two vectors without mutation', () => {
      const v1 = new Vector2(1.0, 2.0);
      const v2 = new Vector2(4.0, 5.0);
      const v3 = Vector2.subtract(v1, v2);
      expect(v3.x).toBe(-3.0);
      expect(v3.y).toBe(-3.0);
      expect(v1.x).toBe(1.0);
      expect(v1.y).toBe(2.0);
      expect(v2.x).toBe(4.0);
      expect(v2.y).toBe(5.0);
    });

    it('should multiply vector by scalar without mutation', () => {
      const v1 = new Vector2(1.0, 2.0);
      const v2 = Vector2.multiplyScalar(v1, 2.0);
      expect(v2.x).toBe(2.0);
      expect(v2.y).toBe(4.0);
      expect(v1.x).toBe(1.0);
      expect(v1.y).toBe(2.0);
    });

    it('should divide vector by scalar without mutation', () => {
      const v1 = new Vector2(2.0, 5.);
      const v2 = Vector2.divideScalar(v1, 2.0);
      expect(v2.x).toBe(1.0);
      expect(v2.y).toBe(2.5);
      expect(v1.x).toBe(2.0);
      expect(v1.y).toBe(5.0);
    });
  });

  describe('Length Operations', () => {
    it('should calculate length correctly', () => {
      const v = new Vector2(3.0, 4.0);
      expect(v.length()).toBe(5.0);
    });

    it('should calculate length squared correctly', () => {
      const v = new Vector2(3.0, 4.0);
      expect(v.lengthSquared()).toBe(25.0);
    });

    it('should return zero length for zero vector', () => {
      const v = new Vector2(0.0, 0.0);
      expect(v.length()).toBe(0.0);
      expect(v.lengthSquared()).toBe(0.0);
    });
  });

  describe('Normalization', () => {
    it('should normalize vector to unit length (mutating)', () => {
      const v = new Vector2(3.0, 4.0);
      v.normalize();
      const expected = new Vector2(0.6, 0.8);
      expect(v.equalsEpsilon(expected, EPSILON)).toBe(true);
      // (3, 4) normalized should be (0.6, 0.8)
    });

    it('should normalize vector to unit length (static)', () => {
      const v1 = new Vector2(3.0, 4.0);
      const v2 = Vector2.normalize(v1);
      const expected = new Vector2(0.6, 0.8);
      expect(v2.equalsEpsilon(expected, EPSILON)).toBe(true);
      expect(v1.x).toBe(3.0);
      expect(v1.y).toBe(4.0);
    });

    it('should handle zero vector gracefully', () => {
      const v = new Vector2(0.0, 0.0);
      v.normalize();
      expect(v.x).toBe(0.0);
      expect(v.y).toBe(0.0);
      // normalize(0,0,0) should return unchanged/zero vector
    });

    it('should preserve direction when normalizing', () => {
      const v = new Vector2(3.0, 4.0);
      v.normalize();
      const expected = new Vector2(0.6, 0.8);
      expect(v.equalsEpsilon(expected, EPSILON)).toBe(true);
    });
  });

  describe('Dot Product', () => {
    it('should calculate dot product correctly', () => {
      const v1 = new Vector2(1.0, 2.0);
      const v2 = new Vector2(4.0, 5.0);
      expect(v1.dot(v2)).toBe(14.0);
      // (1, 2) · (4, 5) = 14
    });

    it('should return zero for perpendicular vectors', () => {
      const v1 = new Vector2(1.0, 0.0);
      const v2 = new Vector2(0.0, 1.0);
      expect(v1.dot(v2)).toBe(0.0);
      // (1, 0, 0) · (0, 1, 0) = 0
    });

    it('should calculate dot product via static method', () => {
      const v1 = new Vector2(1.0, 2.0);
      const v2 = new Vector2(4.0, 5.0);
      expect(Vector2.dot(v1, v2)).toBe(14.0);
      expect(v1.x).toBe(1.0);
      expect(v1.y).toBe(2.0);
      expect(v2.x).toBe(4.0);
      expect(v2.y).toBe(5.0);
    });
  });

  describe('Cross Product', () => {
    it('should calculate cross product correctly (static)', () => {
      const v1 = new Vector2(1.0, 0.0);
      const v2 = new Vector2(0.0, 1.0);
      const v3 = Vector2.cross(v1, v2);
      expect(v3).toBe(1.0);
    });

    it('should be anti-commutative', () => {
      const v1 = new Vector2(1.0, 0.0);
      const v2 = new Vector2(0.0, 1.0);
      const v3 = Vector2.cross(v1, v2);
      const v4 = Vector2.cross(v2, v1);
      expect(v3).toBe(1.0);
      expect(v4).toBe(-1.0);
      expect(v3).toBe(-v4);
      expect(v1.x).toBe(1.0);
      expect(v1.y).toBe(0.0);
      expect(v2.x).toBe(0.0);
      expect(v2.y).toBe(1.0);
      // a × b = -(b × a)
    });
  });

  describe('Utility Methods', () => {
    it('should clone vector correctly', () => {
      const v1 = new Vector2(1.0, 2.0);
      const v2 = v1.clone();
      expect(v2.x).toBe(1.0);
      expect(v2.y).toBe(2.0);
      expect(v1.x).toBe(1.0);
      expect(v1.y).toBe(2.0);
    });

    it('should copy vector values correctly', () => {
      const v1 = new Vector2(1.0, 2.0);
      const v2 = new Vector2();
      v2.copy(v1);
      expect(v2.x).toBe(1.0);
      expect(v2.y).toBe(2.0);
      expect(v1.x).toBe(1.0);
      expect(v1.y).toBe(2.0);
      // copy() should modify this vector
    });

    it('should compare vectors for equality', () => {
      const v1 = new Vector2(1.0, 2.0);
      const v2 = new Vector2(1.0, 2.0);
      expect(v1.equals(v2)).toBe(true);
      expect(v1.x).toBe(1.0);
      expect(v1.y).toBe(2.0);
      expect(v2.x).toBe(1.0);
      expect(v2.y).toBe(2.0);
    });

    it('should return false for unequal vectors', () => {
      const v1 = new Vector2(1.0, 2.0);
      const v2 = new Vector2(4.0, 5.0);
      expect(v1.equals(v2)).toBe(false);
      expect(v1.x).toBe(1.0);
      expect(v1.y).toBe(2.0);
      expect(v2.x).toBe(4.0);
      expect(v2.y).toBe(5.0);
    });
  });
});
