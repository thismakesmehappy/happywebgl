import { describe, it, expect } from 'vitest';
import { FragmentShader } from '../../src/resources/shaders/FragmentShader.js';
import { GLSLType } from '../../src/resources/shaders/GLSLType.js';

const validFragmentShader = `#version 300 es
precision mediump float;
out vec4 fragColor;
void main() {
  fragColor = vec4(1.0);
}
`;

describe('FragmentShader', () => {
  describe('constructor', () => {
    it('stores the shader source', () => {
      const shader = new FragmentShader(validFragmentShader);
      expect(shader.source).toBe(validFragmentShader);
    });
  });

  describe('declareOutput', () => {
    it.each([
      ['non-integer', 1.5, 'integer'],
      ['non-finite', Infinity, 'finite number'],
      ['negative', -1, 'non-negative'],
    ])('throws for %s location', (_label, location, message) => {
      const shader = new FragmentShader(validFragmentShader);
      expect(() =>
        shader.declareOutput('fragColor', GLSLType.Vec4, location),
      ).toThrow(message);
    });

    it('accepts a non-zero location', () => {
      const shader = new FragmentShader(validFragmentShader);
      shader.declareOutput('fragColor', GLSLType.Vec4, 1);

      expect(shader.getOutput('fragColor')).toEqual({
        name: 'fragColor',
        type: GLSLType.Vec4,
        location: 1,
      });
    });

    it('defaults location to zero', () => {
      const shader = new FragmentShader(validFragmentShader);
      shader.declareOutput('fragColor', GLSLType.Vec4);

      expect(shader.getOutput('fragColor')?.location).toBe(0);
    });

    it('supports method chaining', () => {
      const shader = new FragmentShader(validFragmentShader);
      const result = shader.declareOutput('fragColor', GLSLType.Vec4, 0);

      expect(result).toBe(shader);
    });
  });

  describe('validateOutputs', () => {
    const cases = [
      {
        label: 'duplicate locations',
        build: () => {
          const shader = new FragmentShader(validFragmentShader);
          shader.declareOutput('gColor', GLSLType.Vec4, 0);
          shader.declareOutput('gNormal', GLSLType.Vec4, 0);
          return shader;
        },
        args: [] as number[],
        shouldThrow: true,
        message: 'share location',
      },
      {
        label: 'output exceeds maxDrawBuffers',
        build: () => {
          const shader = new FragmentShader(validFragmentShader);
          shader.declareOutput('gColor', GLSLType.Vec4, 2);
          return shader;
        },
        args: [2],
        shouldThrow: true,
        message: 'maxDrawBuffers',
      },
      {
        label: 'invalid maxDrawBuffers',
        build: () => {
          const shader = new FragmentShader(validFragmentShader);
          shader.declareOutput('gColor', GLSLType.Vec4, 0);
          return shader;
        },
        args: [0],
        shouldThrow: true,
        message: 'positive integer',
      },
      {
        label: 'non-finite maxDrawBuffers',
        build: () => {
          const shader = new FragmentShader(validFragmentShader);
          shader.declareOutput('gColor', GLSLType.Vec4, 0);
          return shader;
        },
        args: [NaN],
        shouldThrow: true,
        message: 'finite number',
      },
      {
        label: 'unique locations in range',
        build: () => {
          const shader = new FragmentShader(validFragmentShader);
          shader.declareOutput('gColor', GLSLType.Vec4, 0);
          shader.declareOutput('gNormal', GLSLType.Vec4, 1);
          return shader;
        },
        args: [4],
        shouldThrow: false,
      },
      {
        label: 'location at maxDrawBuffers - 1 passes',
        build: () => {
          const shader = new FragmentShader(validFragmentShader);
          shader.declareOutput('gColor', GLSLType.Vec4, 1);
          return shader;
        },
        args: [2],
        shouldThrow: false,
      },
      {
        label: 'no outputs declared',
        build: () => new FragmentShader(validFragmentShader),
        args: [] as number[],
        shouldThrow: false,
      },
    ];

    it.each(cases)('$label', ({ build, args, shouldThrow, message }) => {
      const shader = build();
      const action = () => shader.validateOutputs(...args);

      if (shouldThrow) {
        expect(action).toThrow(message);
      } else {
        expect(action).not.toThrow();
      }
    });
  });

  describe('output accessors', () => {
    it('exposes declared outputs', () => {
      const shader = new FragmentShader(validFragmentShader);
      shader.declareOutput('fragColor', GLSLType.Vec4, 0);

      const cases: Array<[unknown, unknown]> = [
        [shader.outputs.get('fragColor')?.location, 0],
        [shader.hasOutput('fragColor'), true],
        [shader.hasOutput('missing'), false],
        [shader.getOutput('fragColor')?.type, GLSLType.Vec4],
        [shader.getOutput('missing'), undefined],
      ];

      cases.forEach(([actual, expected]) => {
        expect(actual).toBe(expected);
      });
    });
  });

  describe('redeclarations', () => {
    it('overwrites outputs with the same name', () => {
      const shader = new FragmentShader(validFragmentShader);
      shader.declareOutput('fragColor', GLSLType.Vec4, 0);
      shader.declareOutput('fragColor', GLSLType.Vec4, 1);

      expect(shader.getOutput('fragColor')?.location).toBe(1);
    });
  });
});
