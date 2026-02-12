import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Program } from '../../src/resources/Program.js';
import { GLContext } from '../../src/core/GLContext.js';
import { Vector2 } from '../../src/math/vectors/Vector2.js';
import { Vector3 } from '../../src/math/vectors/Vector3.js';
import { Vector4 } from '../../src/math/vectors/Vector4.js';
import { Matrix2 } from '../../src/math/matrices/Matrix2.js';
import { Matrix3 } from '../../src/math/matrices/Matrix3.js';
import { Matrix4 } from '../../src/math/matrices/Matrix4.js';
import { Quaternion } from '../../src/math/quaternions/Quaternion.js';
import { VertexShader } from '../../src/resources/shaders/VertexShader.js';
import { FragmentShader } from '../../src/resources/shaders/FragmentShader.js';
import { GLSLType } from '../../src/resources/shaders/GLSLType.js';
import { createMatrixPair } from '../helpers/math/createMatrixPair.js';

/**
 * Test suite for Program (WebGL shader program wrapper)
 *
 * Tests the Program class covering:
 * - Constructor and initialization
 * - Compilation and linking via GLContext
 * - Program activation (use) and deactivation (unused)
 * - Uniform location caching and retrieval
 * - Attribute location caching and retrieval
 * - Static binding state tracking
 * - Resource cleanup (dispose)
 * - Error handling for disposed programs
 * - Method chaining support
 */

describe('Program', () => {
  let mockGLContext: Partial<GLContext>;
  let mockGL: any;
  let mockProgram: WebGLProgram;

  const validVertexShader = `#version 300 es
    in vec4 aPosition;
    void main() {
      gl_Position = aPosition;
    }
  `;

  const validFragmentShader = `#version 300 es
    precision mediump float;
    uniform vec4 uColor;
    out vec4 fragColor;
    void main() {
      fragColor = uColor;
    }
  `;

  beforeEach(() => {
    // Create a mock WebGLProgram
    mockProgram = {} as WebGLProgram;

    // Create mock GL object with shader compilation, linking, and location queries
    mockGL = {
      NO_ERROR: 0,
      COMPILE_STATUS: 0x8b81,
      LINK_STATUS: 0x8b82,
      FRAGMENT_SHADER: 0x8b30,
      VERTEX_SHADER: 0x8b31,
      createShader: vi.fn((type: number) => ({})),
      shaderSource: vi.fn(),
      compileShader: vi.fn(),
      getShaderParameter: vi.fn((shader: any, param: number) => {
        // Always report successful compilation
        return param === 0x8b81 ? true : null;
      }),
      getShaderInfoLog: vi.fn(() => ''),
      deleteShader: vi.fn(),
      createProgram: vi.fn(() => mockProgram),
      attachShader: vi.fn(),
      linkProgram: vi.fn(),
      getProgramParameter: vi.fn((program: any, param: number) => {
        // Always report successful linking
        return param === 0x8b82 ? true : null;
      }),
      getProgramInfoLog: vi.fn(() => ''),
      deleteProgram: vi.fn(),
      useProgram: vi.fn(),
      getUniformLocation: vi.fn((program: any, name: string) => {
        // Return a mock location for uniform variables
        // Return null for non-existent uniforms
        if (name === 'uColor' || name === 'uTime' || name === 'uMatrix') {
          return { name } as unknown as WebGLUniformLocation;
        }
        return null;
      }),
      getAttribLocation: vi.fn((program: any, name: string) => {
        // Return indices for attribute variables
        // Return -1 for non-existent attributes
        if (name === 'aPosition') return 0;
        if (name === 'aColor') return 1;
        if (name === 'aNormal') return 2;
        return -1;
      }),
      getError: vi.fn(() => 0),
      // Uniform setters
      uniform1f: vi.fn(),
      uniform1i: vi.fn(),
      uniform1ui: vi.fn(),
      uniform2f: vi.fn(),
      uniform2i: vi.fn(),
      uniform2ui: vi.fn(),
      uniform3f: vi.fn(),
      uniform3i: vi.fn(),
      uniform3ui: vi.fn(),
      uniform4f: vi.fn(),
      uniform4i: vi.fn(),
      uniform4ui: vi.fn(),
      uniform1fv: vi.fn(),
      uniform2fv: vi.fn(),
      uniform3fv: vi.fn(),
      uniform4fv: vi.fn(),
      uniform1iv: vi.fn(),
      uniform2iv: vi.fn(),
      uniform3iv: vi.fn(),
      uniform4iv: vi.fn(),
      uniform1uiv: vi.fn(),
      uniform2uiv: vi.fn(),
      uniform3uiv: vi.fn(),
      uniform4uiv: vi.fn(),
      uniformMatrix2fv: vi.fn(),
      uniformMatrix3fv: vi.fn(),
      uniformMatrix4fv: vi.fn(),
      uniformMatrix2x3fv: vi.fn(),
      uniformMatrix2x4fv: vi.fn(),
      uniformMatrix3x2fv: vi.fn(),
      uniformMatrix3x4fv: vi.fn(),
      uniformMatrix4x2fv: vi.fn(),
      uniformMatrix4x3fv: vi.fn(),
    };

    // Create mock GLContext
    mockGLContext = {
      gl: mockGL as WebGL2RenderingContext,
      createProgram: vi.fn((vertexSource: string, fragmentSource: string) => {
        // Simulate program creation via GLContext
        return mockProgram;
      }),
      registerProgram: vi.fn(),
      queryCurrentProgram: vi.fn(() => null),
      checkError: vi.fn(),
    };
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Constructor', () => {
    it('creates a program with vertex and fragment shaders', () => {
      const program = Program.fromSource(
        mockGLContext as GLContext,
        validVertexShader,
        validFragmentShader,
      );

      expect(mockGLContext.createProgram).toHaveBeenCalledWith(
        validVertexShader,
        validFragmentShader,
      );
      expect(mockGLContext.registerProgram).toHaveBeenCalledWith(mockProgram);
      expect(program).toBeDefined();
      expect(program).toBeInstanceOf(Program);
    });

    it('initializes location caches as empty', () => {
      const program = Program.fromSource(
        mockGLContext as GLContext,
        validVertexShader,
        validFragmentShader,
      );

      // Access a location to verify cache works
      program.getUniformLocation('uColor');
      program.getUniformLocation('uColor');

      // Should only query once (cache hit on second call)
      expect(mockGL.getUniformLocation).toHaveBeenCalledTimes(1);
    });

    it('does not re-query shared uniform locations', () => {
      const vs = new VertexShader(validVertexShader).declareUniform(
        'uShared',
        GLSLType.Float,
      );
      const fs = new FragmentShader(validFragmentShader).declareUniform(
        'uShared',
        GLSLType.Float,
      );

      new Program(mockGLContext as GLContext, vs, fs);

      expect(mockGL.getUniformLocation).toHaveBeenCalledTimes(1);
      expect(mockGL.getUniformLocation).toHaveBeenCalledWith(
        mockProgram,
        'uShared',
      );
    });

    it('marks program as not disposed initially', () => {
      const program = Program.fromSource(
        mockGLContext as GLContext,
        validVertexShader,
        validFragmentShader,
      );

      // Should not throw when calling use()
      expect(() => program.use()).not.toThrow();
    });
  });

  describe('program accessor', () => {
    it('returns the underlying WebGL program', () => {
      const program = Program.fromSource(
        mockGLContext as GLContext,
        validVertexShader,
        validFragmentShader,
      );

      expect(program.program).toBe(mockProgram);
    });

    it('throws error if program has been disposed', () => {
      const program = Program.fromSource(
        mockGLContext as GLContext,
        validVertexShader,
        validFragmentShader,
      );

      program.dispose();

      expect(() => program.program).toThrow('Program has been disposed');
    });
  });

  describe('Program.queryCurrentProgram()', () => {
    it('returns the currently active program from WebGL', () => {
      const program1 = Program.fromSource(
        mockGLContext as GLContext,
        validVertexShader,
        validFragmentShader,
      );

      const activeProgram = {} as WebGLProgram;
      (mockGLContext.queryCurrentProgram as any).mockReturnValue(activeProgram);

      const result = Program.queryCurrentProgram(mockGLContext as GLContext);

      expect(result).toBe(activeProgram);
      expect(mockGLContext.queryCurrentProgram).toHaveBeenCalled();
    });

    it('returns null when no program is active', () => {
      (mockGLContext.queryCurrentProgram as any).mockReturnValue(null);

      const result = Program.queryCurrentProgram(mockGLContext as GLContext);

      expect(result).toBeNull();
    });
  });

  describe('Program.validateCompatibility()', () => {
    describe('Varying validation', () => {
      it('passes when varyings match between shaders', () => {
        const vs = new VertexShader(validVertexShader)
          .declareVarying('vColor', GLSLType.Vec4)
          .declareVarying('vNormal', GLSLType.Vec3);

        const fs = new FragmentShader(validFragmentShader)
          .declareVarying('vColor', GLSLType.Vec4)
          .declareVarying('vNormal', GLSLType.Vec3);

        expect(() => Program.validateCompatibility(vs, fs)).not.toThrow();
      });

      it('passes when fragment shader uses subset of vertex varyings', () => {
        const vs = new VertexShader(validVertexShader)
          .declareVarying('vColor', GLSLType.Vec4)
          .declareVarying('vNormal', GLSLType.Vec3)
          .declareVarying('vTexCoord', GLSLType.Vec2); // Fragment doesn't use this

        const fs = new FragmentShader(validFragmentShader)
          .declareVarying('vColor', GLSLType.Vec4)
          .declareVarying('vNormal', GLSLType.Vec3);

        // Should pass - vertex can output varyings that fragment ignores
        expect(() => Program.validateCompatibility(vs, fs)).not.toThrow();
      });

      it('throws when fragment expects varying not provided by vertex', () => {
        const vs = new VertexShader(validVertexShader)
          .declareVarying('vColor', GLSLType.Vec4);

        const fs = new FragmentShader(validFragmentShader)
          .declareVarying('vColor', GLSLType.Vec4)
          .declareVarying('vNormal', GLSLType.Vec3); // Not in vertex shader

        expect(() => Program.validateCompatibility(vs, fs)).toThrow(
          "Fragment shader expects varying 'vNormal' but vertex shader does not output it",
        );
      });

      it('throws when varying types mismatch', () => {
        const vs = new VertexShader(validVertexShader)
          .declareVarying('vColor', GLSLType.Vec3); // vec3 in vertex

        const fs = new FragmentShader(validFragmentShader)
          .declareVarying('vColor', GLSLType.Vec4); // vec4 in fragment

        expect(() => Program.validateCompatibility(vs, fs)).toThrow(
          "Varying 'vColor' type mismatch: vertex outputs vec3, fragment expects vec4",
        );
      });

      it('passes with no varyings declared', () => {
        const vs = new VertexShader(validVertexShader);
        const fs = new FragmentShader(validFragmentShader);

        expect(() => Program.validateCompatibility(vs, fs)).not.toThrow();
      });
    });

    describe('Uniform validation', () => {
      it('passes when uniforms are only in one shader', () => {
        const vs = new VertexShader(validVertexShader)
          .declareUniform('uMVP', GLSLType.Mat4);

        const fs = new FragmentShader(validFragmentShader)
          .declareUniform('uColor', GLSLType.Vec4);

        expect(() => Program.validateCompatibility(vs, fs)).not.toThrow();
      });

      it('passes when shared uniforms have matching types', () => {
        const vs = new VertexShader(validVertexShader)
          .declareUniform('uTime', GLSLType.Float);

        const fs = new FragmentShader(validFragmentShader)
          .declareUniform('uTime', GLSLType.Float);

        expect(() => Program.validateCompatibility(vs, fs)).not.toThrow();
      });

      it('throws when shared uniform types mismatch', () => {
        const vs = new VertexShader(validVertexShader)
          .declareUniform('uValue', GLSLType.Float);

        const fs = new FragmentShader(validFragmentShader)
          .declareUniform('uValue', GLSLType.Int);

        expect(() => Program.validateCompatibility(vs, fs)).toThrow(
          "Uniform 'uValue' type mismatch: vertex declares float, fragment declares int",
        );
      });
    });

    describe('Constructor integration', () => {
      it('validates compatibility on construction', () => {
        const vs = new VertexShader(validVertexShader)
          .declareVarying('vColor', GLSLType.Vec4);

        const fs = new FragmentShader(validFragmentShader)
          .declareVarying('vMissing', GLSLType.Vec3); // Not in vertex

        expect(() => new Program(mockGLContext as GLContext, vs, fs)).toThrow(
          "Fragment shader expects varying 'vMissing' but vertex shader does not output it",
        );
      });

      it('constructor succeeds with compatible shaders', () => {
        const vs = new VertexShader(validVertexShader)
          .declareVarying('vColor', GLSLType.Vec4)
          .declareUniform('uMVP', GLSLType.Mat4);

        const fs = new FragmentShader(validFragmentShader)
          .declareVarying('vColor', GLSLType.Vec4)
          .declareUniform('uColor', GLSLType.Vec4);

        expect(() => new Program(mockGLContext as GLContext, vs, fs)).not.toThrow();
      });
    });

    describe('Defensive programming use case', () => {
      it('allows pre-validation before program creation', () => {
        const vs = new VertexShader(validVertexShader)
          .declareVarying('vNormal', GLSLType.Vec3);

        const fs = new FragmentShader(validFragmentShader)
          .declareVarying('vNormal', GLSLType.Vec3);

        // Validate first (defensive programming pattern)
        Program.validateCompatibility(vs, fs);

        // Then create (will not throw since we validated)
        const program = new Program(mockGLContext as GLContext, vs, fs);
        expect(program).toBeInstanceOf(Program);
      });
    });
  });

  describe('use()', () => {
    it('activates the program with gl.useProgram()', () => {
      const program = Program.fromSource(
        mockGLContext as GLContext,
        validVertexShader,
        validFragmentShader,
      );

      program.use();

      expect(mockGL.useProgram).toHaveBeenCalledWith(mockProgram);
    });

    it('returns this for method chaining', () => {
      const program = Program.fromSource(
        mockGLContext as GLContext,
        validVertexShader,
        validFragmentShader,
      );

      const result = program.use();

      expect(result).toBe(program);
    });

    it('supports method chaining', () => {
      const program = Program.fromSource(
        mockGLContext as GLContext,
        validVertexShader,
        validFragmentShader,
      );

      const result = program.use().unuse();

      expect(result).toBe(program);
      expect(mockGL.useProgram).toHaveBeenCalledWith(mockProgram);
      expect(mockGL.useProgram).toHaveBeenCalledWith(null);
    });

    it('throws error if program has been disposed', () => {
      const program = Program.fromSource(
        mockGLContext as GLContext,
        validVertexShader,
        validFragmentShader,
      );

      program.dispose();

      expect(() => program.use()).toThrow('Program has been disposed');
    });

    it('updates static binding tracker', () => {
      const program = Program.fromSource(
        mockGLContext as GLContext,
        validVertexShader,
        validFragmentShader,
      );

      program.use();

      // Verify useProgram was called (static tracking happens internally)
      expect(mockGL.useProgram).toHaveBeenCalledWith(mockProgram);
    });
  });

  describe('unuse()', () => {
    it('deactivates the program by calling gl.useProgram(null)', () => {
      const program = Program.fromSource(
        mockGLContext as GLContext,
        validVertexShader,
        validFragmentShader,
      );

      program.use();
      mockGL.useProgram.mockClear();

      program.unuse();

      expect(mockGL.useProgram).toHaveBeenCalledWith(null);
    });

    it('returns this for method chaining', () => {
      const program = Program.fromSource(
        mockGLContext as GLContext,
        validVertexShader,
        validFragmentShader,
      );

      program.use();

      const result = program.unuse();

      expect(result).toBe(program);
    });

    it('supports method chaining with dispose', () => {
      const program = Program.fromSource(
        mockGLContext as GLContext,
        validVertexShader,
        validFragmentShader,
      );

      // Chain: use -> unused -> dispose
      program.use().unuse();

      expect(mockGL.useProgram).toHaveBeenCalledWith(mockProgram);
      expect(mockGL.useProgram).toHaveBeenCalledWith(null);
    });

    it('throws error if program has been disposed', () => {
      const program = Program.fromSource(
        mockGLContext as GLContext,
        validVertexShader,
        validFragmentShader,
      );

      program.dispose();

      expect(() => program.unuse()).toThrow('Program has been disposed');
    });

    it('updates static binding tracker', () => {
      const program = Program.fromSource(
        mockGLContext as GLContext,
        validVertexShader,
        validFragmentShader,
      );

      program.use();
      program.unuse();

      // useProgram called twice: once with program, once with null
      expect(mockGL.useProgram).toHaveBeenCalledTimes(2);
    });
  });

  describe('getUniformLocation()', () => {
    it('returns uniform location for existing uniform', () => {
      const program = Program.fromSource(
        mockGLContext as GLContext,
        validVertexShader,
        validFragmentShader,
      );

      const location = program.getUniformLocation('uColor');

      expect(location).not.toBeNull();
      expect(mockGL.getUniformLocation).toHaveBeenCalledWith(
        mockProgram,
        'uColor',
      );
    });

    it('returns null for non-existent uniform', () => {
      const program = Program.fromSource(
        mockGLContext as GLContext,
        validVertexShader,
        validFragmentShader,
      );

      const location = program.getUniformLocation('uNonExistent');

      expect(location).toBeNull();
    });

    it('caches uniform locations for fast access', () => {
      const program = Program.fromSource(
        mockGLContext as GLContext,
        validVertexShader,
        validFragmentShader,
      );

      // First call queries GPU
      program.getUniformLocation('uColor');
      // Second call should use cache
      program.getUniformLocation('uColor');

      // Should only query once (cache hit on second call)
      expect(mockGL.getUniformLocation).toHaveBeenCalledTimes(1);
    });

    it('caches null results for non-existent uniforms', () => {
      const program = Program.fromSource(
        mockGLContext as GLContext,
        validVertexShader,
        validFragmentShader,
      );

      // First call queries GPU and returns null
      program.getUniformLocation('uNonExistent');
      // Second call should use cache and return null
      program.getUniformLocation('uNonExistent');

      // Should only query once
      expect(mockGL.getUniformLocation).toHaveBeenCalledTimes(1);
    });

    it('throws error if program has been disposed', () => {
      const program = Program.fromSource(
        mockGLContext as GLContext,
        validVertexShader,
        validFragmentShader,
      );

      program.dispose();

      expect(() => program.getUniformLocation('uColor')).toThrow(
        'Program has been disposed',
      );
    });

    it('handles multiple different uniforms', () => {
      const program = Program.fromSource(
        mockGLContext as GLContext,
        validVertexShader,
        validFragmentShader,
      );

      const loc1 = program.getUniformLocation('uColor');
      const loc2 = program.getUniformLocation('uTime');
      const loc3 = program.getUniformLocation('uMatrix');

      expect(loc1).not.toBeNull();
      expect(loc2).not.toBeNull();
      expect(loc3).not.toBeNull();
      expect(mockGL.getUniformLocation).toHaveBeenCalledTimes(3);
    });
  });

  describe('getAttributeLocation()', () => {
    it('returns attribute location for existing attribute', () => {
      const program = Program.fromSource(
        mockGLContext as GLContext,
        validVertexShader,
        validFragmentShader,
      );

      const location = program.getAttributeLocation('aPosition');

      expect(location).toBe(0);
      expect(mockGL.getAttribLocation).toHaveBeenCalledWith(
        mockProgram,
        'aPosition',
      );
    });

    it('returns -1 for non-existent attribute', () => {
      const program = Program.fromSource(
        mockGLContext as GLContext,
        validVertexShader,
        validFragmentShader,
      );

      const location = program.getAttributeLocation('aNonExistent');

      expect(location).toBe(-1);
    });

    it('caches attribute locations for fast access', () => {
      const program = Program.fromSource(
        mockGLContext as GLContext,
        validVertexShader,
        validFragmentShader,
      );

      // First call queries GPU
      program.getAttributeLocation('aPosition');
      // Second call should use cache
      program.getAttributeLocation('aPosition');

      // Should only query once (cache hit on second call)
      expect(mockGL.getAttribLocation).toHaveBeenCalledTimes(1);
    });

    it('caches -1 results for non-existent attributes', () => {
      const program = Program.fromSource(
        mockGLContext as GLContext,
        validVertexShader,
        validFragmentShader,
      );

      // First call queries GPU and returns -1
      program.getAttributeLocation('aNonExistent');
      // Second call should use cache and return -1
      program.getAttributeLocation('aNonExistent');

      // Should only query once
      expect(mockGL.getAttribLocation).toHaveBeenCalledTimes(1);
    });

    it('throws error if program has been disposed', () => {
      const program = Program.fromSource(
        mockGLContext as GLContext,
        validVertexShader,
        validFragmentShader,
      );

      program.dispose();

      expect(() => program.getAttributeLocation('aPosition')).toThrow(
        'Program has been disposed',
      );
    });

    it('handles multiple different attributes', () => {
      const program = Program.fromSource(
        mockGLContext as GLContext,
        validVertexShader,
        validFragmentShader,
      );

      const loc1 = program.getAttributeLocation('aPosition');
      const loc2 = program.getAttributeLocation('aColor');
      const loc3 = program.getAttributeLocation('aNormal');

      expect(loc1).toBe(0);
      expect(loc2).toBe(1);
      expect(loc3).toBe(2);
      expect(mockGL.getAttribLocation).toHaveBeenCalledTimes(3);
    });
  });

  describe('dispose()', () => {
    it('deletes the WebGL program', () => {
      const program = Program.fromSource(
        mockGLContext as GLContext,
        validVertexShader,
        validFragmentShader,
      );

      program.dispose();

      expect(mockGL.deleteProgram).toHaveBeenCalledWith(mockProgram);
    });

    it('clears location caches', () => {
      const program = Program.fromSource(
        mockGLContext as GLContext,
        validVertexShader,
        validFragmentShader,
      );

      // Populate caches
      program.getUniformLocation('uColor');
      program.getAttributeLocation('aPosition');

      // Clear mocks to count new calls
      mockGL.getUniformLocation.mockClear();
      mockGL.getAttribLocation.mockClear();

      // Dispose
      program.dispose();

      // Try to access (should fail, not use cache)
      expect(() => program.getUniformLocation('uColor')).toThrow(
        'Program has been disposed',
      );
    });

    it('marks program as disposed', () => {
      const program = Program.fromSource(
        mockGLContext as GLContext,
        validVertexShader,
        validFragmentShader,
      );

      program.dispose();

      expect(() => program.use()).toThrow('Program has been disposed');
      expect(() => program.unuse()).toThrow('Program has been disposed');
      expect(() => program.program).toThrow('Program has been disposed');
    });

    it('can be called multiple times safely (idempotent)', () => {
      const program = Program.fromSource(
        mockGLContext as GLContext,
        validVertexShader,
        validFragmentShader,
      );

      program.dispose();
      program.dispose();

      // Should not throw on second dispose
      expect(() => program.dispose()).not.toThrow();

      // deleteProgram should still only be called once
      // (on first dispose, subsequent calls return early)
      expect(mockGL.deleteProgram).toHaveBeenCalledTimes(1);
    });

    it('updates binding tracker if this program was active', () => {
      const program = Program.fromSource(
        mockGLContext as GLContext,
        validVertexShader,
        validFragmentShader,
      );

      program.use();
      program.dispose();

      // Verify program was marked for cleanup
      expect(mockGL.deleteProgram).toHaveBeenCalledWith(mockProgram);
    });
  });

  describe('Integration: Full rendering workflow', () => {
    it('supports complete use -> query -> unused -> dispose cycle', () => {
      const program = Program.fromSource(
        mockGLContext as GLContext,
        validVertexShader,
        validFragmentShader,
      );

      // Activate
      program.use();
      expect(mockGL.useProgram).toHaveBeenCalledWith(mockProgram);

      // Query locations
      const colorLoc = program.getUniformLocation('uColor');
      const posLoc = program.getAttributeLocation('aPosition');
      expect(colorLoc).not.toBeNull();
      expect(posLoc).toBe(0);

      // Deactivate
      program.unuse();
      expect(mockGL.useProgram).toHaveBeenLastCalledWith(null);

      // Cleanup
      program.dispose();
      expect(mockGL.deleteProgram).toHaveBeenCalledWith(mockProgram);
    });

    it('supports switching between programs', () => {
      const mockProgram1 = {} as WebGLProgram;
      const mockProgram2 = {} as WebGLProgram;
      (mockGLContext.createProgram as any)
        .mockImplementationOnce(() => mockProgram1)
        .mockImplementationOnce(() => mockProgram2);

      const program1 = Program.fromSource(
        mockGLContext as GLContext,
        validVertexShader,
        validFragmentShader,
      );

      const program2 = Program.fromSource(
        mockGLContext as GLContext,
        validVertexShader,
        validFragmentShader,
      );

      // Use program 1
      program1.use();
      expect(mockGL.useProgram).toHaveBeenLastCalledWith(mockProgram1);

      // Switch to program 2
      program2.use();
      expect(mockGL.useProgram).toHaveBeenLastCalledWith(mockProgram2);

      // Deactivate program 2
      program2.unuse();
      expect(mockGL.useProgram).toHaveBeenLastCalledWith(null);
    });

    it('allows method chaining throughout lifecycle', () => {
      const program = Program.fromSource(
        mockGLContext as GLContext,
        validVertexShader,
        validFragmentShader,
      );

      // Chain: use -> unused
      const result = program.use().unuse();

      expect(result).toBe(program);
      expect(mockGL.useProgram).toHaveBeenCalledWith(mockProgram);
      expect(mockGL.useProgram).toHaveBeenCalledWith(null);
    });
  });

  describe('Error handling', () => {
    it('throws descriptive error when operations performed on disposed program', () => {
      const program = Program.fromSource(
        mockGLContext as GLContext,
        validVertexShader,
        validFragmentShader,
      );

      program.dispose();

      expect(() => program.use()).toThrow('Program has been disposed');
      expect(() => program.unuse()).toThrow('Program has been disposed');
      expect(() => program.program).toThrow('Program has been disposed');
      expect(() => program.getUniformLocation('uColor')).toThrow(
        'Program has been disposed',
      );
      expect(() => program.getAttributeLocation('aPosition')).toThrow(
        'Program has been disposed',
      );
    });
  });

  describe('Dispose callbacks', () => {
    it('invokes callbacks on dispose and clears them', () => {
      const program = Program.fromSource(
        mockGLContext as GLContext,
        validVertexShader,
        validFragmentShader,
      );

      const callback = vi.fn();
      program.registerDisposeCallback(callback);

      program.dispose();
      expect(callback).toHaveBeenCalledTimes(1);

      program.dispose();
      expect(callback).toHaveBeenCalledTimes(1);
    });

    it('does not invoke unregistered callbacks', () => {
      const program = Program.fromSource(
        mockGLContext as GLContext,
        validVertexShader,
        validFragmentShader,
      );

      const callback = vi.fn();
      program.registerDisposeCallback(callback);
      program.unregisterDisposeCallback(callback);

      program.dispose();
      expect(callback).not.toHaveBeenCalled();
    });

    it('exposes isDisposed state', () => {
      const program = Program.fromSource(
        mockGLContext as GLContext,
        validVertexShader,
        validFragmentShader,
      );
      expect(program.isDisposed).toBe(false);
      program.dispose();
      expect(program.isDisposed).toBe(true);
    });
  });

  describe('Multiple instances', () => {
    it('each Program instance is independent', () => {
      const mockProgram1 = {} as WebGLProgram;
      const mockProgram2 = {} as WebGLProgram;

      let createCount = 0;
      (mockGLContext.createProgram as any).mockImplementation(() => {
        createCount++;
        return createCount === 1 ? mockProgram1 : mockProgram2;
      });

      const program1 = Program.fromSource(
        mockGLContext as GLContext,
        validVertexShader,
        validFragmentShader,
      );
      const program2 = Program.fromSource(
        mockGLContext as GLContext,
        validVertexShader,
        validFragmentShader,
      );

      expect(program1.program).toBe(mockProgram1);
      expect(program2.program).toBe(mockProgram2);
      expect(program1.program).not.toBe(program2.program);
    });

    it('disposes one program without affecting others', () => {
      const mockProgram1 = {} as WebGLProgram;
      const mockProgram2 = {} as WebGLProgram;

      let createCount = 0;
      (mockGLContext.createProgram as any).mockImplementation(() => {
        createCount++;
        return createCount === 1 ? mockProgram1 : mockProgram2;
      });

      const program1 = Program.fromSource(
        mockGLContext as GLContext,
        validVertexShader,
        validFragmentShader,
      );
      const program2 = Program.fromSource(
        mockGLContext as GLContext,
        validVertexShader,
        validFragmentShader,
      );

      program1.dispose();

      expect(() => program1.use()).toThrow();
      expect(() => program2.use()).not.toThrow();
    });
  });

  describe('Uniform Setters', () => {
    let program: Program;

    beforeEach(() => {
      program = Program.fromSource(
        mockGLContext as GLContext,
        validVertexShader,
        validFragmentShader,
      );
      // Mock queryCurrentProgram to return this program (simulating program.use())
      (mockGLContext.queryCurrentProgram as any).mockReturnValue(mockProgram);
      program.use();
    });

    describe('Scalar uniforms', () => {
      it.each([
        ['setUniform1f', ['uTime', 1.5], () => mockGL.uniform1f],
        ['setUniform1f', ['uTime', -1.5], () => mockGL.uniform1f],
        ['setUniform1f', ['uTime', 5], () => mockGL.uniform1f],
        ['setUniform1i', ['uColor', 5], () => mockGL.uniform1i],
        ['setUniform1i', ['uColor', -5], () => mockGL.uniform1i],
        ['setUniform1ui', ['uColor', 10], () => mockGL.uniform1ui],
      ])('sets %s', (method, args, getFn) => {
        (program as any)[method](...args);
        expect(getFn()).toHaveBeenCalled();
      });

      it('setUniform1i throws if floating value', () => {
        expect(() => program.setUniform1i('uColor', 5.3)).toThrow();
      });

      it('setUniform1ui throws if floating value', () => {
        expect(() => program.setUniform1ui('uColor', 5.3)).toThrow();
      });

      it('setUniform1ui throws if negative value', () => {
        expect(() => program.setUniform1ui('uColor', -3)).toThrow();
      });

      it('returns this for method chaining', () => {
        const result = program.setUniform1f('uTime', 1.5);
        expect(result).toBe(program);
      });

      it('throws error if disposed', () => {
        program.dispose();
        expect(() => program.setUniform1f('uTime', 1.5)).toThrow('Program has been disposed');
      });
    });

    describe('vec2 uniforms', () => {
      it.each([
        ['setUniform2f', ['uColor', 1.1, -2.3], () => mockGL.uniform2f],
        ['setUniform2f', ['uColor', new Vector2(1.1, -2.3)], () => mockGL.uniform2f],
        ['setUniform2i', ['uColor', 1, -2], () => mockGL.uniform2i],
        ['setUniform2i', ['uColor', new Vector2(1, 2)], () => mockGL.uniform2i],
        ['setUniform2ui', ['uColor', 1, 2], () => mockGL.uniform2ui],
      ])('sets %s', (method, args, getFn) => {
        (program as any)[method](...args);
        expect(getFn()).toHaveBeenCalled();
      });

      it.each([
        ['setUniform2f', 'y is required'],
        ['setUniform2i', 'y is required'],
        ['setUniform2ui', 'y is required'],
      ])('%s throws if y missing when x is number', (method, message) => {
        expect(() => (program as any)[method]('uColor', 1.0)).toThrow(message);
      });
    });

    describe('vec3 uniforms', () => {
      it.each([
        ['setUniform3f', ['uColor', 1.0, 2.0, 3.0], () => mockGL.uniform3f],
        ['setUniform3f', ['uColor', new Vector3(1.0, 2.0, 3.0)], () => mockGL.uniform3f],
        ['setUniform3i', ['uColor', 1, 2, 3], () => mockGL.uniform3i],
        ['setUniform3ui', ['uColor', 1, 2, 3], () => mockGL.uniform3ui],
      ])('sets %s', (method, args, getFn) => {
        (program as any)[method](...args);
        expect(getFn()).toHaveBeenCalled();
      });

      it.each([
        ['setUniform3f', 'y and z are required'],
        ['setUniform3i', 'y and z are required'],
        ['setUniform3ui', 'y and z are required'],
      ])('%s throws if y or z missing when x is number', (method, message) => {
        expect(() => (program as any)[method]('uColor', 1, 2)).toThrow(message);
      });
    });

    describe('vec4 uniforms', () => {
      it.each([
        ['setUniform4f', ['uColor', 1.0, 0.0, 0.0, 1.0], () => mockGL.uniform4f],
        ['setUniform4f', ['uColor', new Vector4(1.0, 0.0, 0.0, 1.0)], () => mockGL.uniform4f],
        ['setUniform4f', ['uColor', new Quaternion()], () => mockGL.uniform4f],
        ['setUniform4i', ['uColor', 1, 2, 3, 4], () => mockGL.uniform4i],
        ['setUniform4ui', ['uColor', 1, 2, 3, 4], () => mockGL.uniform4ui],
      ])('sets %s', (method, args, getFn) => {
        (program as any)[method](...args);
        expect(getFn()).toHaveBeenCalled();
      });

      it.each([
        ['setUniform4f', 'y, z, and w are required'],
        ['setUniform4i', 'y, z, and w are required'],
        ['setUniform4ui', 'y, z, and w are required'],
      ])('%s throws if y, z, or w missing when x is number', (method, message) => {
        expect(() => (program as any)[method]('uColor', 1, 2, 3)).toThrow(message);
      });
    });

    describe('Array uniforms (*fv, *iv, *uiv)', () => {
      it.each([
        ['setUniform1fv', [1.0, 2.0, 3.0], () => mockGL.uniform1fv],
        ['setUniform2fv', [1.0, 2.0], () => mockGL.uniform2fv],
        ['setUniform3fv', [1.0, 2.0, 3.0], () => mockGL.uniform3fv],
        ['setUniform4fv', [1.0, 2.0, 3.0, 4.0], () => mockGL.uniform4fv],
        ['setUniform1iv', [1, 2, 3], () => mockGL.uniform1iv],
        ['setUniform2iv', [1, 2], () => mockGL.uniform2iv],
        ['setUniform3iv', [1, 2, 3], () => mockGL.uniform3iv],
        ['setUniform4iv', [1, 2, 3, 4], () => mockGL.uniform4iv],
        ['setUniform1uiv', [1, 2, 3], () => mockGL.uniform1uiv],
        ['setUniform2uiv', [1, 2], () => mockGL.uniform2uiv],
        ['setUniform3uiv', [1, 2, 3], () => mockGL.uniform3uiv],
        ['setUniform4uiv', [1, 2, 3, 4], () => mockGL.uniform4uiv],
      ])('%s sets array', (method, data, getFn) => {
        (program as any)[method]('uColor', data);
        expect(getFn()).toHaveBeenCalled();
      });
    });

    describe('Matrix uniforms', () => {
      it.each([
        ['setUniformMatrix2fv', new Matrix2(), () => mockGL.uniformMatrix2fv],
        ['setUniformMatrix2fv', [1, 0, 0, 1], () => mockGL.uniformMatrix2fv],
        ['setUniformMatrix3fv', new Matrix3(), () => mockGL.uniformMatrix3fv],
        ['setUniformMatrix3fv', [1, 0, 0, 0, 1, 0, 0, 0, 1], () => mockGL.uniformMatrix3fv],
        ['setUniformMatrix4fv', new Matrix4(), () => mockGL.uniformMatrix4fv],
        ['setUniformMatrix4fv', new Float32Array(16), () => mockGL.uniformMatrix4fv],
      ])('%s sets matrix', (method, data, getFn) => {
        (program as any)[method]('uMatrix', data);
        expect(getFn()).toHaveBeenCalled();
      });

      it.each([
        ['setUniformMatrix2fv', new Float32Array(9), 'divisible by 4'],
        ['setUniformMatrix3fv', new Float32Array(16), 'divisible by 9'],
        ['setUniformMatrix4fv', new Float32Array(9), 'divisible by 16'],
      ])('%s throws with wrong array size', (method, data, message) => {
        expect(() => (program as any)[method]('uMatrix', data)).toThrow(message);
      });

      const matrixCases = [
        {
          method: 'setUniformMatrix2x3fv',
          glFn: () => mockGL.uniformMatrix2x3fv,
          rows: 2,
          cols: 3,
          size: 6,
          wrongArraySize: 8,
          wrongMatrix: [4, 3],
        },
        {
          method: 'setUniformMatrix2x4fv',
          glFn: () => mockGL.uniformMatrix2x4fv,
          rows: 2,
          cols: 4,
          size: 8,
          wrongArraySize: 6,
          wrongMatrix: [3, 4],
        },
        {
          method: 'setUniformMatrix3x2fv',
          glFn: () => mockGL.uniformMatrix3x2fv,
          rows: 3,
          cols: 2,
          size: 6,
          wrongArraySize: 8,
          wrongMatrix: [3, 3],
        },
        {
          method: 'setUniformMatrix3x4fv',
          glFn: () => mockGL.uniformMatrix3x4fv,
          rows: 3,
          cols: 4,
          size: 12,
          wrongArraySize: 8,
          wrongMatrix: [4, 4],
        },
        {
          method: 'setUniformMatrix4x2fv',
          glFn: () => mockGL.uniformMatrix4x2fv,
          rows: 4,
          cols: 2,
          size: 8,
          wrongArraySize: 6,
          wrongMatrix: [4, 3],
        },
        {
          method: 'setUniformMatrix4x3fv',
          glFn: () => mockGL.uniformMatrix4x3fv,
          rows: 4,
          cols: 3,
          size: 12,
          wrongArraySize: 8,
          wrongMatrix: [4, 4],
        },
      ];

      it.each(matrixCases)('%s sets with Float32Array', ({ method, glFn, size }) => {
        (program as any)[method]('uMatrix', new Float32Array(size));
        expect(glFn()).toHaveBeenCalled();
      });

      it.each(matrixCases)('%s sets with number[]', ({ method, glFn, size }) => {
        const data = Array.from({ length: size }, (_, i) => i + 1);
        (program as any)[method]('uMatrix', data);
        expect(glFn()).toHaveBeenCalled();
      });

      it.each(matrixCases)('%s sets with Matrix', ({ method, glFn, rows, cols, size }) => {
        const [TestMatrix, _] = createMatrixPair(rows, cols);
        const data = Array.from({ length: size }, (_, i) => i + 1);
        const matrix = new TestMatrix(...data);
        (program as any)[method]('uMatrix', matrix);
        expect(glFn()).toHaveBeenCalled();
      });

      it.each(matrixCases)('%s throws with wrong array size', ({ method, wrongArraySize }) => {
        expect(() =>
          (program as any)[method]('uMatrix', new Float32Array(wrongArraySize)),
        ).toThrow();
      });

      it.each(matrixCases)('%s throws with wrong Matrix size', ({ method, wrongMatrix }) => {
        const [TestMatrix, _] = createMatrixPair(wrongMatrix[0], wrongMatrix[1]);
        const size = wrongMatrix[0] * wrongMatrix[1];
        const data = Array.from({ length: size }, (_, i) => i + 1);
        const matrix = new TestMatrix(...data);
        expect(() => (program as any)[method]('uMatrix', matrix)).toThrow();
      });

      it.each([
        ['setUniformMatrix2fv', () => new Matrix2(), () => mockGL.uniformMatrix2fv, true],
        ['setUniformMatrix3fv', () => new Matrix3(), () => mockGL.uniformMatrix3fv, true],
        ['setUniformMatrix4fv', () => new Matrix4(), () => mockGL.uniformMatrix4fv, true],
      ])('%s supports transpose parameter (square)', (method, getData, getFn, transpose) => {
        const mat = getData();
        (program as any)[method]('uMatrix', mat, transpose);
        expect(getFn()).toHaveBeenCalledWith(
          expect.anything(),
          transpose,
          (mat as any).elements,
        );
      });

      it.each([
        ['setUniformMatrix2x3fv', 6, () => mockGL.uniformMatrix2x3fv],
        ['setUniformMatrix2x4fv', 8, () => mockGL.uniformMatrix2x4fv],
        ['setUniformMatrix3x2fv', 6, () => mockGL.uniformMatrix3x2fv],
        ['setUniformMatrix3x4fv', 12, () => mockGL.uniformMatrix3x4fv],
        ['setUniformMatrix4x2fv', 8, () => mockGL.uniformMatrix4x2fv],
        ['setUniformMatrix4x3fv', 12, () => mockGL.uniformMatrix4x3fv],
      ])('%s supports transpose parameter', (method, size, getFn) => {
        (program as any)[method]('uMatrix', new Float32Array(size), true);
        expect(getFn()).toHaveBeenCalledWith(
          expect.anything(),
          true,
          expect.any(Float32Array),
        );
      });
    });

    describe('Non-existent uniforms', () => {
      it('silently ignores non-existent uniform (does not throw)', () => {
        // Program is already in use from beforeEach
        expect(() => program.setUniform1f('uNonExistent', 1.0)).not.toThrow();
      });

      it('does not call gl.uniform for non-existent uniform', () => {
        // Program is already in use from beforeEach
        mockGL.uniform1f.mockClear();
        program.setUniform1f('uNonExistent', 1.0);
        expect(mockGL.uniform1f).not.toHaveBeenCalled();
      });
    });

    describe('Disposed program errors', () => {
      it.each([
        ['setUniform1i', ['uColor', 1]],
        ['setUniform1ui', ['uColor', 1]],
        ['setUniform2f', ['uColor', 1, 2]],
        ['setUniform2i', ['uColor', 1, 2]],
        ['setUniform2ui', ['uColor', 1, 2]],
        ['setUniform3f', ['uColor', 1, 2, 3]],
        ['setUniform3i', ['uColor', 1, 2, 3]],
        ['setUniform3ui', ['uColor', 1, 2, 3]],
        ['setUniform4f', ['uColor', 1, 2, 3, 4]],
        ['setUniform4i', ['uColor', 1, 2, 3, 4]],
        ['setUniform4ui', ['uColor', 1, 2, 3, 4]],
        ['setUniform1fv', ['uColor', [1]]],
        ['setUniform2fv', ['uColor', [1, 2]]],
        ['setUniform3fv', ['uColor', [1, 2, 3]]],
        ['setUniform4fv', ['uColor', [1, 2, 3, 4]]],
        ['setUniform1iv', ['uColor', [1]]],
        ['setUniform2iv', ['uColor', [1, 2]]],
        ['setUniform3iv', ['uColor', [1, 2, 3]]],
        ['setUniform4iv', ['uColor', [1, 2, 3, 4]]],
        ['setUniform1uiv', ['uColor', [1]]],
        ['setUniform2uiv', ['uColor', [1, 2]]],
        ['setUniform3uiv', ['uColor', [1, 2, 3]]],
        ['setUniform4uiv', ['uColor', [1, 2, 3, 4]]],
        ['setUniformMatrix2fv', ['uMatrix', [1, 0, 0, 1]]],
        ['setUniformMatrix3fv', ['uMatrix', new Float32Array(9)]],
        ['setUniformMatrix4fv', ['uMatrix', new Float32Array(16)]],
        ['setUniformMatrix2x3fv', ['uMatrix', new Float32Array(6)]],
        ['setUniformMatrix2x4fv', ['uMatrix', new Float32Array(8)]],
        ['setUniformMatrix3x2fv', ['uMatrix', new Float32Array(6)]],
        ['setUniformMatrix3x4fv', ['uMatrix', new Float32Array(12)]],
        ['setUniformMatrix4x2fv', ['uMatrix', new Float32Array(8)]],
        ['setUniformMatrix4x3fv', ['uMatrix', new Float32Array(12)]],
      ])('%s throws when disposed', (method, args) => {
        program.dispose();
        expect(() => (program as any)[method](...args)).toThrow('Program has been disposed');
      });
    });

    describe('Method chaining', () => {
      it('supports chaining multiple uniform setters', () => {
        const result = program
          .setUniform1f('uTime', 1.0)
          .setUniform3f('uColor', 1.0, 0.0, 0.0)
          .setUniformMatrix4fv('uMatrix', new Matrix4());

        expect(result).toBe(program);
      });

      it('supports chaining with use()', () => {
        const result = program
          .use()
          .setUniform1f('uTime', 1.0)
          .setUniform4f('uColor', 1.0, 0.0, 0.0, 1.0);

        expect(result).toBe(program);
        expect(mockGL.useProgram).toHaveBeenCalled();
        expect(mockGL.uniform1f).toHaveBeenCalled();
        expect(mockGL.uniform4f).toHaveBeenCalled();
      });
    });

    describe('Program binding validation', () => {
      it('throws if program is not in use when setting uniform', () => {
        // Reset mock to return null (no program active)
        (mockGLContext.queryCurrentProgram as any).mockReturnValue(null);

        expect(() => program.setUniform1f('uTime', 1.0)).toThrow(
          'Program must be in use (call program.use() first)',
        );
      });

      it('throws if a different program is active', () => {
        // Return a different program object
        const otherProgram = {} as WebGLProgram;
        (mockGLContext.queryCurrentProgram as any).mockReturnValue(otherProgram);

        expect(() => program.setUniform1i('uColor', 5)).toThrow(
          'Program must be in use (call program.use() first)',
        );
      });

      it('succeeds when correct program is in use', () => {
        // mockProgram is already set to return in beforeEach
        expect(() => program.setUniform1f('uTime', 1.0)).not.toThrow();
      });

      it('validates binding for all uniform setter types', () => {
        (mockGLContext.queryCurrentProgram as any).mockReturnValue(null);

        // Scalar setters
        expect(() => program.setUniform1f('uTime', 1.0)).toThrow('must be in use');
        expect(() => program.setUniform1i('uColor', 1)).toThrow('must be in use');
        expect(() => program.setUniform1ui('uColor', 1)).toThrow('must be in use');

        // Vec2 setters
        expect(() => program.setUniform2f('uColor', 1, 2)).toThrow('must be in use');
        expect(() => program.setUniform2i('uColor', 1, 2)).toThrow('must be in use');
        expect(() => program.setUniform2ui('uColor', 1, 2)).toThrow('must be in use');

        // Vec3 setters
        expect(() => program.setUniform3f('uColor', 1, 2, 3)).toThrow('must be in use');
        expect(() => program.setUniform3i('uColor', 1, 2, 3)).toThrow('must be in use');
        expect(() => program.setUniform3ui('uColor', 1, 2, 3)).toThrow('must be in use');

        // Vec4 setters
        expect(() => program.setUniform4f('uColor', 1, 2, 3, 4)).toThrow('must be in use');
        expect(() => program.setUniform4i('uColor', 1, 2, 3, 4)).toThrow('must be in use');
        expect(() => program.setUniform4ui('uColor', 1, 2, 3, 4)).toThrow('must be in use');

        // Array setters
        expect(() => program.setUniform1fv('uColor', [1])).toThrow('must be in use');
        expect(() => program.setUniform2fv('uColor', [1, 2])).toThrow('must be in use');
        expect(() => program.setUniform3fv('uColor', [1, 2, 3])).toThrow('must be in use');
        expect(() => program.setUniform4fv('uColor', [1, 2, 3, 4])).toThrow('must be in use');
        expect(() => program.setUniform1iv('uColor', [1])).toThrow('must be in use');
        expect(() => program.setUniform2iv('uColor', [1, 2])).toThrow('must be in use');
        expect(() => program.setUniform3iv('uColor', [1, 2, 3])).toThrow('must be in use');
        expect(() => program.setUniform4iv('uColor', [1, 2, 3, 4])).toThrow('must be in use');
        expect(() => program.setUniform1uiv('uColor', [1])).toThrow('must be in use');
        expect(() => program.setUniform2uiv('uColor', [1, 2])).toThrow('must be in use');
        expect(() => program.setUniform3uiv('uColor', [1, 2, 3])).toThrow('must be in use');
        expect(() => program.setUniform4uiv('uColor', [1, 2, 3, 4])).toThrow('must be in use');

        // Matrix setters
        expect(() => program.setUniformMatrix2fv('uMatrix', [1, 0, 0, 1])).toThrow('must be in use');
        expect(() => program.setUniformMatrix3fv('uMatrix', new Float32Array(9))).toThrow('must be in use');
        expect(() => program.setUniformMatrix4fv('uMatrix', new Float32Array(16))).toThrow('must be in use');
        expect(() => program.setUniformMatrix2x3fv('uMatrix', new Float32Array(6))).toThrow('must be in use');
        expect(() => program.setUniformMatrix2x4fv('uMatrix', new Float32Array(8))).toThrow('must be in use');
        expect(() => program.setUniformMatrix3x2fv('uMatrix', new Float32Array(6))).toThrow('must be in use');
        expect(() => program.setUniformMatrix3x4fv('uMatrix', new Float32Array(12))).toThrow('must be in use');
        expect(() => program.setUniformMatrix4x2fv('uMatrix', new Float32Array(8))).toThrow('must be in use');
        expect(() => program.setUniformMatrix4x3fv('uMatrix', new Float32Array(12))).toThrow('must be in use');
      });
    });

    describe('Integer type validation', () => {
      it('setUniform1i throws for non-finite values', () => {
        expect(() => program.setUniform1i('uColor', Infinity)).toThrow('must be a finite number');
        expect(() => program.setUniform1i('uColor', -Infinity)).toThrow('must be a finite number');
        expect(() => program.setUniform1i('uColor', NaN)).toThrow('must be a finite number');
      });

      it('setUniform1i throws for non-integer values', () => {
        expect(() => program.setUniform1i('uColor', 1.5)).toThrow('must be an integer');
        expect(() => program.setUniform1i('uColor', 0.1)).toThrow('must be an integer');
      });

      it('setUniform1i accepts valid integers', () => {
        expect(() => program.setUniform1i('uColor', 0)).not.toThrow();
        expect(() => program.setUniform1i('uColor', -5)).not.toThrow();
        expect(() => program.setUniform1i('uColor', 100)).not.toThrow();
      });

      it('setUniform2i validates both components', () => {
        expect(() => program.setUniform2i('uColor', 1.5, 2)).toThrow('must be an integer');
        expect(() => program.setUniform2i('uColor', 1, 2.5)).toThrow('must be an integer');
      });

      it('setUniform3i validates all components', () => {
        expect(() => program.setUniform3i('uColor', 1.5, 2, 3)).toThrow('must be an integer');
        expect(() => program.setUniform3i('uColor', 1, 2.5, 3)).toThrow('must be an integer');
        expect(() => program.setUniform3i('uColor', 1, 2, 3.5)).toThrow('must be an integer');
      });

      it('setUniform4i validates all components', () => {
        expect(() => program.setUniform4i('uColor', 1.5, 2, 3, 4)).toThrow('must be an integer');
        expect(() => program.setUniform4i('uColor', 1, 2.5, 3, 4)).toThrow('must be an integer');
        expect(() => program.setUniform4i('uColor', 1, 2, 3.5, 4)).toThrow('must be an integer');
        expect(() => program.setUniform4i('uColor', 1, 2, 3, 4.5)).toThrow('must be an integer');
      });
    });

    describe('Unsigned integer type validation', () => {
      it('setUniform1ui throws for non-finite values', () => {
        expect(() => program.setUniform1ui('uColor', Infinity)).toThrow('must be a finite number');
        expect(() => program.setUniform1ui('uColor', NaN)).toThrow('must be a finite number');
      });

      it('setUniform1ui throws for non-integer values', () => {
        expect(() => program.setUniform1ui('uColor', 1.5)).toThrow('must be an integer');
      });

      it('setUniform1ui throws for negative values', () => {
        expect(() => program.setUniform1ui('uColor', -1)).toThrow('must be non-negative');
        expect(() => program.setUniform1ui('uColor', -100)).toThrow('must be non-negative');
      });

      it('setUniform1ui accepts valid unsigned integers', () => {
        expect(() => program.setUniform1ui('uColor', 0)).not.toThrow();
        expect(() => program.setUniform1ui('uColor', 100)).not.toThrow();
      });

      it('setUniform2ui validates both components', () => {
        expect(() => program.setUniform2ui('uColor', -1, 2)).toThrow('must be non-negative');
        expect(() => program.setUniform2ui('uColor', 1, -2)).toThrow('must be non-negative');
      });

      it('setUniform3ui validates all components', () => {
        expect(() => program.setUniform3ui('uColor', -1, 2, 3)).toThrow('must be non-negative');
        expect(() => program.setUniform3ui('uColor', 1, -2, 3)).toThrow('must be non-negative');
        expect(() => program.setUniform3ui('uColor', 1, 2, -3)).toThrow('must be non-negative');
      });

      it('setUniform4ui validates all components', () => {
        expect(() => program.setUniform4ui('uColor', -1, 2, 3, 4)).toThrow('must be non-negative');
        expect(() => program.setUniform4ui('uColor', 1, -2, 3, 4)).toThrow('must be non-negative');
        expect(() => program.setUniform4ui('uColor', 1, 2, -3, 4)).toThrow('must be non-negative');
        expect(() => program.setUniform4ui('uColor', 1, 2, 3, -4)).toThrow('must be non-negative');
      });
    });

    describe('Array size validation', () => {
      it('throws for empty arrays', () => {
        expect(() => program.setUniform1fv('uColor', [])).toThrow('Array cannot be empty');
        expect(() => program.setUniform2fv('uColor', [])).toThrow('Array cannot be empty');
        expect(() => program.setUniform3fv('uColor', [])).toThrow('Array cannot be empty');
        expect(() => program.setUniform4fv('uColor', [])).toThrow('Array cannot be empty');
        expect(() => program.setUniform1iv('uColor', [])).toThrow('Array cannot be empty');
        expect(() => program.setUniform2iv('uColor', [])).toThrow('Array cannot be empty');
        expect(() => program.setUniform3iv('uColor', [])).toThrow('Array cannot be empty');
        expect(() => program.setUniform4iv('uColor', [])).toThrow('Array cannot be empty');
        expect(() => program.setUniform1uiv('uColor', [])).toThrow('Array cannot be empty');
        expect(() => program.setUniform2uiv('uColor', [])).toThrow('Array cannot be empty');
        expect(() => program.setUniform3uiv('uColor', [])).toThrow('Array cannot be empty');
        expect(() => program.setUniform4uiv('uColor', [])).toThrow('Array cannot be empty');
      });

      it('setUniform2fv throws for arrays not divisible by 2', () => {
        expect(() => program.setUniform2fv('uColor', [1])).toThrow('divisible by 2');
        expect(() => program.setUniform2fv('uColor', [1, 2, 3])).toThrow('divisible by 2');
      });

      it('setUniform2fv accepts arrays divisible by 2', () => {
        expect(() => program.setUniform2fv('uColor', [1, 2])).not.toThrow();
        expect(() => program.setUniform2fv('uColor', [1, 2, 3, 4])).not.toThrow();
      });

      it('setUniform3fv throws for arrays not divisible by 3', () => {
        expect(() => program.setUniform3fv('uColor', [1, 2])).toThrow('divisible by 3');
        expect(() => program.setUniform3fv('uColor', [1, 2, 3, 4])).toThrow('divisible by 3');
      });

      it('setUniform3fv accepts arrays divisible by 3', () => {
        expect(() => program.setUniform3fv('uColor', [1, 2, 3])).not.toThrow();
        expect(() => program.setUniform3fv('uColor', [1, 2, 3, 4, 5, 6])).not.toThrow();
      });

      it('setUniform4fv throws for arrays not divisible by 4', () => {
        expect(() => program.setUniform4fv('uColor', [1, 2, 3])).toThrow('divisible by 4');
        expect(() => program.setUniform4fv('uColor', [1, 2, 3, 4, 5])).toThrow('divisible by 4');
      });

      it('setUniform4fv accepts arrays divisible by 4', () => {
        expect(() => program.setUniform4fv('uColor', [1, 2, 3, 4])).not.toThrow();
        expect(() => program.setUniform4fv('uColor', [1, 2, 3, 4, 5, 6, 7, 8])).not.toThrow();
      });

      it('setUniform2iv throws for arrays not divisible by 2', () => {
        expect(() => program.setUniform2iv('uColor', [1])).toThrow('divisible by 2');
      });

      it('setUniform3iv throws for arrays not divisible by 3', () => {
        expect(() => program.setUniform3iv('uColor', [1, 2])).toThrow('divisible by 3');
      });

      it('setUniform4iv throws for arrays not divisible by 4', () => {
        expect(() => program.setUniform4iv('uColor', [1, 2, 3])).toThrow('divisible by 4');
      });

      it('setUniform2uiv throws for arrays not divisible by 2', () => {
        expect(() => program.setUniform2uiv('uColor', [1])).toThrow('divisible by 2');
      });

      it('setUniform3uiv throws for arrays not divisible by 3', () => {
        expect(() => program.setUniform3uiv('uColor', [1, 2])).toThrow('divisible by 3');
      });

      it('setUniform4uiv throws for arrays not divisible by 4', () => {
        expect(() => program.setUniform4uiv('uColor', [1, 2, 3])).toThrow('divisible by 4');
      });
    });

    describe('Vector support for int/uint setters', () => {
      it('setUniform2i accepts Vector2', () => {
        const vec = new Vector2(1, 2);
        program.setUniform2i('uColor', vec);
        expect(mockGL.uniform2i).toHaveBeenCalled();
      });

      it('setUniform2i validates Vector2 components are integers', () => {
        const vec = new Vector2(1.5, 2);
        expect(() => program.setUniform2i('uColor', vec)).toThrow('must be an integer');
      });

      it('setUniform2ui accepts Vector2', () => {
        const vec = new Vector2(1, 2);
        program.setUniform2ui('uColor', vec);
        expect(mockGL.uniform2ui).toHaveBeenCalled();
      });

      it('setUniform2ui validates Vector2 components are non-negative', () => {
        const vec = new Vector2(-1, 2);
        expect(() => program.setUniform2ui('uColor', vec)).toThrow('must be non-negative');
      });

      it('setUniform3i accepts Vector3', () => {
        const vec = new Vector3(1, 2, 3);
        program.setUniform3i('uColor', vec);
        expect(mockGL.uniform3i).toHaveBeenCalled();
      });

      it('setUniform3i validates Vector3 components are integers', () => {
        const vec = new Vector3(1, 2.5, 3);
        expect(() => program.setUniform3i('uColor', vec)).toThrow('must be an integer');
      });

      it('setUniform3ui accepts Vector3', () => {
        const vec = new Vector3(1, 2, 3);
        program.setUniform3ui('uColor', vec);
        expect(mockGL.uniform3ui).toHaveBeenCalled();
      });

      it('setUniform3ui validates Vector3 components are non-negative', () => {
        const vec = new Vector3(1, -2, 3);
        expect(() => program.setUniform3ui('uColor', vec)).toThrow('must be non-negative');
      });

      it('setUniform4i accepts Vector4', () => {
        const vec = new Vector4(1, 2, 3, 4);
        program.setUniform4i('uColor', vec);
        expect(mockGL.uniform4i).toHaveBeenCalled();
      });

      it('setUniform4i validates Vector4 components are integers', () => {
        const vec = new Vector4(1, 2, 3, 4.5);
        expect(() => program.setUniform4i('uColor', vec)).toThrow('must be an integer');
      });

      it('setUniform4ui accepts Vector4', () => {
        const vec = new Vector4(1, 2, 3, 4);
        program.setUniform4ui('uColor', vec);
        expect(mockGL.uniform4ui).toHaveBeenCalled();
      });

      it('setUniform4ui validates Vector4 components are non-negative', () => {
        const vec = new Vector4(1, 2, 3, -4);
        expect(() => program.setUniform4ui('uColor', vec)).toThrow('must be non-negative');
      });

      it('setUniform4i accepts Quaternion', () => {
        // Identity quaternion (0, 0, 0, 1) has integer values
        const quat = Quaternion.identity();
        program.setUniform4i('uColor', quat);
        expect(mockGL.uniform4i).toHaveBeenCalled();
      });

      it('setUniform4ui accepts Quaternion', () => {
        // Identity quaternion (0, 0, 0, 1) has non-negative integer values
        const quat = Quaternion.identity();
        program.setUniform4ui('uColor', quat);
        expect(mockGL.uniform4ui).toHaveBeenCalled();
      });
    });
  });
});
