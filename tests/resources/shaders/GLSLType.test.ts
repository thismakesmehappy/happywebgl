import { describe, it, expect } from 'vitest';
import {
  GLSLType,
  getComponentCount,
  isMatrixType,
  isSamplerType,
  isVectorType,
} from '../../../src/resources/shaders/GLSLType.js';

describe('GLSLType helpers', () => {
  describe('isSamplerType', () => {
    it('returns true for sampler types', () => {
      expect(isSamplerType(GLSLType.Sampler2D)).toBe(true);
    });

    it('returns false for non-sampler types', () => {
      expect(isSamplerType(GLSLType.Vec3)).toBe(false);
    });
  });

  describe('isMatrixType', () => {
    it('returns true for matrix types', () => {
      expect(isMatrixType(GLSLType.Mat4)).toBe(true);
    });

    it('returns false for non-matrix types', () => {
      expect(isMatrixType(GLSLType.Vec4)).toBe(false);
    });
  });

  describe('isVectorType', () => {
    it('returns true for vector types', () => {
      expect(isVectorType(GLSLType.IVec2)).toBe(true);
    });

    it('returns false for non-vector types', () => {
      expect(isVectorType(GLSLType.Mat3)).toBe(false);
    });
  });

  describe('getComponentCount', () => {
    it.each([
      // Scalars
      [GLSLType.Float, 1],
      [GLSLType.Int, 1],
      [GLSLType.UInt, 1],
      [GLSLType.Bool, 1],
      // 2-component vectors
      [GLSLType.Vec2, 2],
      [GLSLType.IVec2, 2],
      [GLSLType.UVec2, 2],
      [GLSLType.BVec2, 2],
      // 3-component vectors
      [GLSLType.Vec3, 3],
      [GLSLType.IVec3, 3],
      [GLSLType.UVec3, 3],
      [GLSLType.BVec3, 3],
      // 4-component vectors
      [GLSLType.Vec4, 4],
      [GLSLType.IVec4, 4],
      [GLSLType.UVec4, 4],
      [GLSLType.BVec4, 4],
      // Square matrices
      [GLSLType.Mat2, 4],
      [GLSLType.Mat3, 9],
      [GLSLType.Mat4, 16],
      // Non-square matrices
      [GLSLType.Mat2x3, 6],
      [GLSLType.Mat3x2, 6],
      [GLSLType.Mat2x4, 8],
      [GLSLType.Mat4x2, 8],
      [GLSLType.Mat3x4, 12],
      [GLSLType.Mat4x3, 12],
      // Samplers (default case)
      [GLSLType.Sampler2D, 1],
    ])('returns %s for %s', (type, expected) => {
      expect(getComponentCount(type)).toBe(expected);
    });
  });
});
