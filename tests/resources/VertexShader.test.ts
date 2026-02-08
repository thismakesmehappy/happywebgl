import { describe, it, expect } from 'vitest';
import { VertexShader } from '../../src/resources/shaders/VertexShader.js';
import { GLSLType } from '../../src/resources/shaders/GLSLType.js';

const validVertexShader = `#version 300 es
in vec3 aPosition;
void main() {
  gl_Position = vec4(aPosition, 1.0);
}
`;

describe('VertexShader', () => {
  describe('constructor', () => {
    it('stores the shader source', () => {
      const shader = new VertexShader(validVertexShader);
      expect(shader.source).toBe(validVertexShader);
    });
  });

  describe('attributes', () => {
    it('tracks declared attributes', () => {
      const shader = new VertexShader(validVertexShader);
      shader.declareAttribute('aPosition', GLSLType.Vec3);

      const cases: Array<[unknown, unknown]> = [
        [shader.attributes.get('aPosition')?.type, GLSLType.Vec3],
        [shader.hasAttribute('aPosition'), true],
        [shader.hasAttribute('missing'), false],
        [shader.getAttributeType('aPosition'), GLSLType.Vec3],
        [shader.getAttributeType('missing'), undefined],
      ];

      cases.forEach(([actual, expected]) => {
        expect(actual).toBe(expected);
      });
    });
  });

  describe('redeclarations', () => {
    it('overwrites attributes with the same name', () => {
      const shader = new VertexShader(validVertexShader);
      shader.declareAttribute('aPosition', GLSLType.Vec3);
      shader.declareAttribute('aPosition', GLSLType.Vec4);

      expect(shader.getAttributeType('aPosition')).toBe(GLSLType.Vec4);
    });
  });

  describe('method chaining', () => {
    it('supports chaining attribute declarations', () => {
      const shader = new VertexShader(validVertexShader);
      const result = shader.declareAttribute('aPosition', GLSLType.Vec3);

      expect(result).toBe(shader);
    });
  });
});
