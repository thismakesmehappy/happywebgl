import { describe, it, expect } from 'vitest';
import { Shader } from '../../../src/resources/shaders/Shader.js';
import { GLSLType } from '../../../src/resources/shaders/GLSLType.js';

const validShaderSource = `#version 300 es
void main() {}
`;

class TestShader extends Shader {
  validateFinite(value: number): void {
    this._validateFinite(value, 'validateFinite', 'value');
  }

  validateNonNegativeInt(value: number): void {
    this._validateNonNegativeInt(value, 'validateNonNegativeInt', 'value');
  }

  validatePositiveInt(value: number): void {
    this._validatePositiveInt(value, 'validatePositiveInt', 'value');
  }
}

describe('Shader', () => {
  describe('constructor', () => {
    it('stores the shader source', () => {
      const shader = new TestShader(validShaderSource);
      expect(shader.source).toBe(validShaderSource);
    });
  });

  describe('uniforms', () => {
    it('tracks declared uniforms', () => {
      const shader = new TestShader(validShaderSource);
      shader.declareUniform('uTime', GLSLType.Float);

      const cases: Array<[unknown, unknown]> = [
        [shader.uniforms.get('uTime')?.type, GLSLType.Float],
        [shader.hasUniform('uTime'), true],
        [shader.hasUniform('missing'), false],
        [shader.getUniformType('uTime'), GLSLType.Float],
        [shader.getUniformType('missing'), undefined],
      ];

      cases.forEach(([actual, expected]) => {
        expect(actual).toBe(expected);
      });
    });
  });

  describe('varyings', () => {
    it('tracks declared varyings', () => {
      const shader = new TestShader(validShaderSource);
      shader.declareVarying('vColor', GLSLType.Vec3);

      const cases: Array<[unknown, unknown]> = [
        [shader.varyings.get('vColor')?.type, GLSLType.Vec3],
        [shader.hasVarying('vColor'), true],
        [shader.hasVarying('missing'), false],
        [shader.getVaryingType('vColor'), GLSLType.Vec3],
        [shader.getVaryingType('missing'), undefined],
      ];

      cases.forEach(([actual, expected]) => {
        expect(actual).toBe(expected);
      });
    });
  });

  describe('redeclarations', () => {
    it('overwrites uniforms with the same name', () => {
      const shader = new TestShader(validShaderSource);
      shader.declareUniform('uTime', GLSLType.Float);
      shader.declareUniform('uTime', GLSLType.Vec2);

      expect(shader.getUniformType('uTime')).toBe(GLSLType.Vec2);
    });

    it('overwrites varyings with the same name', () => {
      const shader = new TestShader(validShaderSource);
      shader.declareVarying('vColor', GLSLType.Vec3);
      shader.declareVarying('vColor', GLSLType.Vec4);

      expect(shader.getVaryingType('vColor')).toBe(GLSLType.Vec4);
    });
  });

  describe('method chaining', () => {
    it('supports chaining uniform and varying declarations', () => {
      const shader = new TestShader(validShaderSource);
      const result = shader
        .declareUniform('uTime', GLSLType.Float)
        .declareVarying('vColor', GLSLType.Vec3);

      expect(result).toBe(shader);
    });
  });

  describe('validation helpers', () => {
    it.each([
      ['validateFinite', 1, false, ''],
      ['validateFinite', Infinity, true, 'finite number'],
      ['validateFinite', NaN, true, 'finite number'],
      ['validateNonNegativeInt', 1, false, ''],
      ['validateNonNegativeInt', 1.5, true, 'integer'],
      ['validateNonNegativeInt', -1, true, 'non-negative'],
      ['validatePositiveInt', 1, false, ''],
      ['validatePositiveInt', 0, true, 'positive integer'],
      ['validatePositiveInt', 1.5, true, 'integer'],
      ['validatePositiveInt', -1, true, 'non-negative'],
    ])('%s(%s) validation', (method, value, shouldThrow, message) => {
      const shader = new TestShader(validShaderSource);
      const action = () => (shader as any)[method](value);

      if (shouldThrow) {
        expect(action).toThrow(message);
      } else {
        expect(action).not.toThrow();
      }
    });
  });
});
