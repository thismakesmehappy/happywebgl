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
import {createMatrixPair} from "../helpers/math/createMatrixPair";

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

  const validVertexShader = `
    attribute vec4 aPosition;
    void main() {
      gl_Position = aPosition;
    }
  `;

  const validFragmentShader = `
    precision mediump float;
    uniform vec4 uColor;
    void main() {
      gl_FragColor = uColor;
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
      _checkError: vi.fn(),
    };
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Constructor', () => {
    it('creates a program with vertex and fragment shaders', () => {
      const program = new Program(
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
      const program = new Program(
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

    it('marks program as not disposed initially', () => {
      const program = new Program(
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
      const program = new Program(
        mockGLContext as GLContext,
        validVertexShader,
        validFragmentShader,
      );

      expect(program.program).toBe(mockProgram);
    });

    it('throws error if program has been disposed', () => {
      const program = new Program(
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
      const program1 = new Program(
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

  describe('use()', () => {
    it('activates the program with gl.useProgram()', () => {
      const program = new Program(
        mockGLContext as GLContext,
        validVertexShader,
        validFragmentShader,
      );

      program.use();

      expect(mockGL.useProgram).toHaveBeenCalledWith(mockProgram);
    });

    it('returns this for method chaining', () => {
      const program = new Program(
        mockGLContext as GLContext,
        validVertexShader,
        validFragmentShader,
      );

      const result = program.use();

      expect(result).toBe(program);
    });

    it('supports method chaining', () => {
      const program = new Program(
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
      const program = new Program(
        mockGLContext as GLContext,
        validVertexShader,
        validFragmentShader,
      );

      program.dispose();

      expect(() => program.use()).toThrow('Program has been disposed');
    });

    it('updates static binding tracker', () => {
      const program = new Program(
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
      const program = new Program(
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
      const program = new Program(
        mockGLContext as GLContext,
        validVertexShader,
        validFragmentShader,
      );

      program.use();

      const result = program.unuse();

      expect(result).toBe(program);
    });

    it('supports method chaining with dispose', () => {
      const program = new Program(
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
      const program = new Program(
        mockGLContext as GLContext,
        validVertexShader,
        validFragmentShader,
      );

      program.dispose();

      expect(() => program.unuse()).toThrow('Program has been disposed');
    });

    it('updates static binding tracker', () => {
      const program = new Program(
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
      const program = new Program(
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
      const program = new Program(
        mockGLContext as GLContext,
        validVertexShader,
        validFragmentShader,
      );

      const location = program.getUniformLocation('uNonExistent');

      expect(location).toBeNull();
    });

    it('caches uniform locations for fast access', () => {
      const program = new Program(
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
      const program = new Program(
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
      const program = new Program(
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
      const program = new Program(
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
      const program = new Program(
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
      const program = new Program(
        mockGLContext as GLContext,
        validVertexShader,
        validFragmentShader,
      );

      const location = program.getAttributeLocation('aNonExistent');

      expect(location).toBe(-1);
    });

    it('caches attribute locations for fast access', () => {
      const program = new Program(
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
      const program = new Program(
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
      const program = new Program(
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
      const program = new Program(
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
      const program = new Program(
        mockGLContext as GLContext,
        validVertexShader,
        validFragmentShader,
      );

      program.dispose();

      expect(mockGL.deleteProgram).toHaveBeenCalledWith(mockProgram);
    });

    it('clears location caches', () => {
      const program = new Program(
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
      const program = new Program(
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
      const program = new Program(
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
      const program = new Program(
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
      const program = new Program(
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
      const program1 = new Program(
        mockGLContext as GLContext,
        validVertexShader,
        validFragmentShader,
      );

      const program2 = new Program(
        mockGLContext as GLContext,
        validVertexShader,
        validFragmentShader,
      );

      // Use program 1
      program1.use();
      expect(mockGL.useProgram).toHaveBeenLastCalledWith(mockProgram);

      // Switch to program 2
      program2.use();
      expect(mockGL.useProgram).toHaveBeenLastCalledWith(mockProgram);

      // Deactivate program 2
      program2.unuse();
      expect(mockGL.useProgram).toHaveBeenLastCalledWith(null);
    });

    it('allows method chaining throughout lifecycle', () => {
      const program = new Program(
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
      const program = new Program(
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

  describe('Multiple instances', () => {
    it('each Program instance is independent', () => {
      const mockProgram1 = {} as WebGLProgram;
      const mockProgram2 = {} as WebGLProgram;

      let createCount = 0;
      (mockGLContext.createProgram as any).mockImplementation(() => {
        createCount++;
        return createCount === 1 ? mockProgram1 : mockProgram2;
      });

      const program1 = new Program(
        mockGLContext as GLContext,
        validVertexShader,
        validFragmentShader,
      );
      const program2 = new Program(
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

      const program1 = new Program(
        mockGLContext as GLContext,
        validVertexShader,
        validFragmentShader,
      );
      const program2 = new Program(
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
      program = new Program(
        mockGLContext as GLContext,
        validVertexShader,
        validFragmentShader,
      );
      // Mock queryCurrentProgram to return this program (simulating program.use())
      (mockGLContext.queryCurrentProgram as any).mockReturnValue(mockProgram);
      program.use();
    });

    describe('Scalar uniforms', () => {
      it('setUniform1f sets float uniform', () => {
        program.setUniform1f('uTime', 1.5);
        expect(mockGL.uniform1f).toHaveBeenCalled();
      });

      it('setUniform1f sets negative float uniform', () => {
        program.setUniform1f('uTime', -1.5);
        expect(mockGL.uniform1f).toHaveBeenCalled();
      });

      it('setUniform1f sets integer uniform', () => {
        program.setUniform1f('uTime', 5);
        expect(mockGL.uniform1f).toHaveBeenCalled();
      });

      it('setUniform1i sets integer uniform', () => {
        program.setUniform1i('uColor', 5);
        expect(mockGL.uniform1i).toHaveBeenCalled();
      });

      it('setUniform1i sets negative integer uniform', () => {
        program.setUniform1i('uColor', -5);
        expect(mockGL.uniform1i).toHaveBeenCalled();
      });

      it('setUniform1i throws if floating value', () => {
        expect(() => program.setUniform1i('uColor', 5.3)).toThrow();
      });

      it('setUniform1ui throws if floating value', () => {
        expect(() => program.setUniform1ui('uColor', 5.3)).toThrow();
      });

      it('setUniform1ui sets unsigned integer uniform', () => {
        program.setUniform1ui('uColor', 10);
        expect(mockGL.uniform1ui).toHaveBeenCalled();
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
      it('setUniform2f with individual floating values', () => {
        program.setUniform2f('uColor', 1.1, -2.3);
        expect(mockGL.uniform2f).toHaveBeenCalled();
      });

      it('setUniform2f with Vector2', () => {
        const vec = new Vector2(1.1, -2.3);
        program.setUniform2f('uColor', vec);
        expect(mockGL.uniform2f).toHaveBeenCalled();
      });

      it('setUniform2f throws if y missing when x is number', () => {
        expect(() => program.setUniform2f('uColor', 1.0)).toThrow('y is required');
      });

      it('setUniform2i with individual values', () => {
        program.setUniform2i('uColor', 1, -2);
        expect(mockGL.uniform2i).toHaveBeenCalled();
      });

      it('setUniform2i with Vector2', () => {
        const vec = new Vector2(1, 2);
        program.setUniform2i('uColor', vec);
        expect(mockGL.uniform2i).toHaveBeenCalled();
      });

      it('setUniform2i throws if y missing when x is number', () => {
        expect(() => program.setUniform2i('uColor', 1.0)).toThrow('y is required');
      });

      it('setUniform2ui sets uvec2 uniform', () => {
        program.setUniform2ui('uColor', 1, 2);
        expect(mockGL.uniform2ui).toHaveBeenCalled();
      });

      it('setUniform2ui throws if y missing when x is number', () => {
        expect(() => program.setUniform2ui('uColor', 1.0)).toThrow('y is required');
      });
    });

    describe('vec3 uniforms', () => {
      it('setUniform3f with individual values', () => {
        program.setUniform3f('uColor', 1.0, 2.0, 3.0);
        expect(mockGL.uniform3f).toHaveBeenCalled();
      });

      it('setUniform3f with Vector3', () => {
        const vec = new Vector3(1.0, 2.0, 3.0);
        program.setUniform3f('uColor', vec);
        expect(mockGL.uniform3f).toHaveBeenCalled();
      });

      it('setUniform3f throws if y or z missing when x is number', () => {
        expect(() => program.setUniform3f('uColor', 1.0, 2.0)).toThrow('y and z are required');
      });

      it('setUniform3i sets ivec3 uniform', () => {
        program.setUniform3i('uColor', 1, 2, 3);
        expect(mockGL.uniform3i).toHaveBeenCalled();
      });

      it('setUniform3i throws if y or z missing when x is number', () => {
        expect(() => program.setUniform3i('uColor', 1, 2)).toThrow('y and z are required');
      });

      it('setUniform3ui sets uvec3 uniform', () => {
        program.setUniform3ui('uColor', 1, 2, 3);
        expect(mockGL.uniform3ui).toHaveBeenCalled();
      });

      it('setUniform3ui throws if y or z missing when x is number', () => {
        expect(() => program.setUniform3ui('uColor', 1, 2)).toThrow('y and z are required');
      });
    });

    describe('vec4 uniforms', () => {
      it('setUniform4f with individual values', () => {
        program.setUniform4f('uColor', 1.0, 0.0, 0.0, 1.0);
        expect(mockGL.uniform4f).toHaveBeenCalled();
      });

      it('setUniform4f with Vector4', () => {
        const vec = new Vector4(1.0, 0.0, 0.0, 1.0);
        program.setUniform4f('uColor', vec);
        expect(mockGL.uniform4f).toHaveBeenCalled();
      });

      it('setUniform4f with Quaternion', () => {
        const quat = new Quaternion();
        program.setUniform4f('uColor', quat);
        expect(mockGL.uniform4f).toHaveBeenCalled();
      });

      it('setUniform4f throws if y, z, or w missing when x is number', () => {
        expect(() => program.setUniform4f('uColor', 1.0, 2.0, 3.0)).toThrow('y, z, and w are required');
      });

      it('setUniform4i sets ivec4 uniform', () => {
        program.setUniform4i('uColor', 1, 2, 3, 4);
        expect(mockGL.uniform4i).toHaveBeenCalled();
      });

      it('setUniform4i throws if y, z, or w missing when x is number', () => {
        expect(() => program.setUniform4i('uColor', 1, 2, 3)).toThrow('y, z, and w are required');
      });

      it('setUniform4ui sets uvec4 uniform', () => {
        program.setUniform4ui('uColor', 1, 2, 3, 4);
        expect(mockGL.uniform4ui).toHaveBeenCalled();
      });

      it('setUniform4ui throws if y, z, or w missing when x is number', () => {
        expect(() => program.setUniform4ui('uColor', 1, 2, 3)).toThrow('y, z, and w are required');
      });
    });

    describe('Array uniforms (*fv, *iv, *uiv)', () => {
      it('setUniform1fv sets float array', () => {
        program.setUniform1fv('uColor', [1.0, 2.0, 3.0]);
        expect(mockGL.uniform1fv).toHaveBeenCalled();
      });

      it('setUniform2fv sets vec2 array', () => {
        program.setUniform2fv('uColor', [1.0, 2.0]);
        expect(mockGL.uniform2fv).toHaveBeenCalled();
      });

      it('setUniform3fv sets vec3 array', () => {
        program.setUniform3fv('uColor', [1.0, 2.0, 3.0]);
        expect(mockGL.uniform3fv).toHaveBeenCalled();
      });

      it('setUniform4fv sets vec4 array', () => {
        program.setUniform4fv('uColor', [1.0, 2.0, 3.0, 4.0]);
        expect(mockGL.uniform4fv).toHaveBeenCalled();
      });

      it('setUniform1iv sets int array', () => {
        program.setUniform1iv('uColor', [1, 2, 3]);
        expect(mockGL.uniform1iv).toHaveBeenCalled();
      });

      it('setUniform2iv sets ivec2 array', () => {
        program.setUniform2iv('uColor', [1, 2]);
        expect(mockGL.uniform2iv).toHaveBeenCalled();
      });

      it('setUniform3iv sets ivec3 array', () => {
        program.setUniform3iv('uColor', [1, 2, 3]);
        expect(mockGL.uniform3iv).toHaveBeenCalled();
      });

      it('setUniform4iv sets ivec4 array', () => {
        program.setUniform4iv('uColor', [1, 2, 3, 4]);
        expect(mockGL.uniform4iv).toHaveBeenCalled();
      });

      it('setUniform1uiv sets uint array', () => {
        program.setUniform1uiv('uColor', [1, 2, 3]);
        expect(mockGL.uniform1uiv).toHaveBeenCalled();
      });

      it('setUniform2uiv sets uvec2 array', () => {
        program.setUniform2uiv('uColor', [1, 2]);
        expect(mockGL.uniform2uiv).toHaveBeenCalled();
      });

      it('setUniform3uiv sets uvec3 array', () => {
        program.setUniform3uiv('uColor', [1, 2, 3]);
        expect(mockGL.uniform3uiv).toHaveBeenCalled();
      });

      it('setUniform4uiv sets uvec4 array', () => {
        program.setUniform4uiv('uColor', [1, 2, 3, 4]);
        expect(mockGL.uniform4uiv).toHaveBeenCalled();
      });
    });

    describe('Matrix uniforms', () => {
      it('setUniformMatrix2fv with Matrix2', () => {
        const mat = new Matrix2();
        program.setUniformMatrix2fv('uMatrix', mat);
        expect(mockGL.uniformMatrix2fv).toHaveBeenCalled();
      });

      it('setUniformMatrix2fv with array', () => {
        program.setUniformMatrix2fv('uMatrix', [1, 0, 0, 1]);
        expect(mockGL.uniformMatrix2fv).toHaveBeenCalled();
      });

      it('setUniformMatrix2fv throws with wrong array size', () => {
        expect(() => program.setUniformMatrix2fv('uMatrix', new Float32Array(9))).toThrow('divisible by 4');
      });

      it('setUniformMatrix3fv with Matrix3', () => {
        const mat = new Matrix3();
        program.setUniformMatrix3fv('uMatrix', mat);
        expect(mockGL.uniformMatrix3fv).toHaveBeenCalled();
      });

      it('setUniformMatrix3fv with array', () => {
        program.setUniformMatrix3fv('uMatrix', [1, 0, 0, 0, 1, 0, 0, 0, 1]);
        expect(mockGL.uniformMatrix3fv).toHaveBeenCalled();
      });

      it('setUniformMatrix3fv throws with wrong array size', () => {
        expect(() => program.setUniformMatrix3fv('uMatrix', new Float32Array(16))).toThrow('divisible by 9');
      });

      it('setUniformMatrix4fv with Matrix4', () => {
        const mat = new Matrix4();
        program.setUniformMatrix4fv('uMatrix', mat);
        expect(mockGL.uniformMatrix4fv).toHaveBeenCalled();
      });

      it('setUniformMatrix4fv with array', () => {
        program.setUniformMatrix4fv('uMatrix', new Float32Array(16));
        expect(mockGL.uniformMatrix4fv).toHaveBeenCalled();
      });

      it('setUniformMatrix4fv throws with wrong array size', () => {
        expect(() => program.setUniformMatrix4fv('uMatrix', new Float32Array(9))).toThrow('divisible by 16');
      });

      it('setUniformMatrix2x3fv sets mat2x3', () => {
        program.setUniformMatrix2x3fv('uMatrix', new Float32Array(6));
        expect(mockGL.uniformMatrix2x3fv).toHaveBeenCalled();
      });

      it('setUniformMatrix2x3fv sets mat2x3 with number[]', () => {
        program.setUniformMatrix2x3fv('uMatrix', [1, 2, 3, 4, 5, 6]);
        expect(mockGL.uniformMatrix2x3fv).toHaveBeenCalled();
      });

      it('setUniformMatrix2x3fv sets mat2x3 with Matrix', () => {
        const [TestMatrix2x3, _] = createMatrixPair(2, 3);
        const matrix = new TestMatrix2x3(1, 2, 3, 4, 5, 6);
        program.setUniformMatrix2x3fv('uMatrix', matrix);
        expect(mockGL.uniformMatrix2x3fv).toHaveBeenCalled();
      });

      it('setUniformMatrix2x3fv throws with wrong array size', () => {
        expect(() => program.setUniformMatrix2x3fv('uMatrix', new Float32Array(8))).toThrow();
      });

      it('setUniformMatrix2x3fv throws mat2x3 with wrong Matrix size', () => {
        const [TestMatrix4x3, _] = createMatrixPair(4, 3);
        const matrix = new TestMatrix4x3(1, 2, 3, 4, 5, 6, 1, 2, 3, 4, 5, 6);
        expect(() => program.setUniformMatrix2x3fv('uMatrix', matrix)).toThrow();
      });


      it('setUniformMatrix2x4fv sets mat2x4', () => {
        program.setUniformMatrix2x4fv('uMatrix', new Float32Array(8));
        expect(mockGL.uniformMatrix2x4fv).toHaveBeenCalled();
      });

      it('setUniformMatrix2x4fv sets mat2x4 with number[]', () => {
        program.setUniformMatrix2x4fv('uMatrix', [1, 2, 3, 4, 5, 6, 7, 8]);
        expect(mockGL.uniformMatrix2x4fv).toHaveBeenCalled();
      });

      it('setUniformMatrix2x4fv sets mat2x4 with Matrix', () => {
        const [TestMatrix2x4, _] = createMatrixPair(2, 4);
        const matrix = new TestMatrix2x4(1, 2, 3, 4, 5, 6, 7, 8);
        program.setUniformMatrix2x4fv('uMatrix', matrix);
        expect(mockGL.uniformMatrix2x4fv).toHaveBeenCalled();
      });

      it('setUniformMatrix2x4fv throws with wrong array size', () => {
        expect(() => program.setUniformMatrix2x4fv('uMatrix', new Float32Array(6))).toThrow();
      });

      it('setUniformMatrix2x4fv throws with wrong Matrix size', () => {
        const [TestMatrix3x4, _] = createMatrixPair(3, 4);
        const matrix = new TestMatrix3x4(1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12);
        expect(() => program.setUniformMatrix2x4fv('uMatrix', matrix)).toThrow();
      });

      it('setUniformMatrix3x2fv sets mat3x2', () => {
        program.setUniformMatrix3x2fv('uMatrix', new Float32Array(6));
        expect(mockGL.uniformMatrix3x2fv).toHaveBeenCalled();
      });

      it('setUniformMatrix3x2fv sets mat3x2 with number[]', () => {
        program.setUniformMatrix3x2fv('uMatrix', [1, 2, 3, 4, 5, 6]);
        expect(mockGL.uniformMatrix3x2fv).toHaveBeenCalled();
      });

      it('setUniformMatrix3x2fv sets mat3x2 with Matrix', () => {
        const [TestMatrix3x2, _] = createMatrixPair(3, 2);
        const matrix = new TestMatrix3x2(1, 2, 3, 4, 5, 6);
        program.setUniformMatrix3x2fv('uMatrix', matrix);
        expect(mockGL.uniformMatrix3x2fv).toHaveBeenCalled();
      });

      it('setUniformMatrix3x2fv throws with wrong array size', () => {
        expect(() => program.setUniformMatrix3x2fv('uMatrix', new Float32Array(8))).toThrow();
      });

      it('setUniformMatrix3x2fv throws with wrong Matrix size', () => {
        const [TestMatrix3x3, _] = createMatrixPair(3, 3);
        const matrix = new TestMatrix3x3(1, 2, 3, 4, 5, 6, 7, 8, 9);
        expect(() => program.setUniformMatrix3x2fv('uMatrix', matrix)).toThrow();
      });

      it('setUniformMatrix3x4fv sets mat3x4', () => {
        program.setUniformMatrix3x4fv('uMatrix', new Float32Array(12));
        expect(mockGL.uniformMatrix3x4fv).toHaveBeenCalled();
      });

      it('setUniformMatrix3x4fv sets mat3x4 with number[]', () => {
        program.setUniformMatrix3x4fv('uMatrix', [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
        expect(mockGL.uniformMatrix3x4fv).toHaveBeenCalled();
      });

      it('setUniformMatrix3x4fv sets mat3x4 with Matrix', () => {
        const [TestMatrix3x4, _] = createMatrixPair(3, 4);
        const matrix = new TestMatrix3x4(1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12);
        program.setUniformMatrix3x4fv('uMatrix', matrix);
        expect(mockGL.uniformMatrix3x4fv).toHaveBeenCalled();
      });

      it('setUniformMatrix3x4fv throws with wrong array size', () => {
        expect(() => program.setUniformMatrix3x4fv('uMatrix', new Float32Array(8))).toThrow();
      });

      it('setUniformMatrix3x4fv throws with wrong Matrix size', () => {
        const [TestMatrix4x4, _] = createMatrixPair(4, 4);
        const matrix = new TestMatrix4x4(1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16);
        expect(() => program.setUniformMatrix3x4fv('uMatrix', matrix)).toThrow();
      });

      it('setUniformMatrix4x2fv sets mat4x2', () => {
        program.setUniformMatrix4x2fv('uMatrix', new Float32Array(8));
        expect(mockGL.uniformMatrix4x2fv).toHaveBeenCalled();
      });

      it('setUniformMatrix4x2fv sets mat4x2 with number[]', () => {
        program.setUniformMatrix4x2fv('uMatrix', [1, 2, 3, 4, 5, 6, 7, 8]);
        expect(mockGL.uniformMatrix4x2fv).toHaveBeenCalled();
      });

      it('setUniformMatrix4x2fv sets mat4x2 with Matrix', () => {
        const [TestMatrix4x2, _] = createMatrixPair(4, 2);
        const matrix = new TestMatrix4x2(1, 2, 3, 4, 5, 6, 7, 8);
        program.setUniformMatrix4x2fv('uMatrix', matrix);
        expect(mockGL.uniformMatrix4x2fv).toHaveBeenCalled();
      });

      it('setUniformMatrix4x2fv throws with wrong array size', () => {
        expect(() => program.setUniformMatrix4x2fv('uMatrix', new Float32Array(6))).toThrow();
      });

      it('setUniformMatrix4x2fv throws with wrong Matrix size', () => {
        const [TestMatrix4x3, _] = createMatrixPair(4, 3);
        const matrix = new TestMatrix4x3(1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12);
        expect(() => program.setUniformMatrix4x2fv('uMatrix', matrix)).toThrow();
      });

      it('setUniformMatrix4x3fv sets mat4x3', () => {
        program.setUniformMatrix4x3fv('uMatrix', new Float32Array(12));
        expect(mockGL.uniformMatrix4x3fv).toHaveBeenCalled();
      });

      it('setUniformMatrix4x3fv sets mat4x3 with Matrix', () => {
        const [TestMatrix4x3, _] = createMatrixPair(4, 3);
        const matrix = new TestMatrix4x3(1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12);
        program.setUniformMatrix4x3fv('uMatrix', matrix);
        expect(mockGL.uniformMatrix4x3fv).toHaveBeenCalled();
      });

      it('setUniformMatrix4x3fv sets mat4x3 with number[]', () => {
        program.setUniformMatrix4x3fv('uMatrix', [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
        expect(mockGL.uniformMatrix4x3fv).toHaveBeenCalled();
      });

      it('setUniformMatrix4x3fv throws with wrong array size', () => {
        expect(() => program.setUniformMatrix4x3fv('uMatrix', new Float32Array(8))).toThrow();
      });

      it('setUniformMatrix4x3fv throws with wrong Matrix size', () => {
        const [TestMatrix4x4, _] = createMatrixPair(4, 4);
        const matrix = new TestMatrix4x4(1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16);
        expect(() => program.setUniformMatrix4x3fv('uMatrix', matrix)).toThrow();
      });

      it('setUniformMatrix2fv supports transpose parameter', () => {
        const mat = new Matrix2();
        program.setUniformMatrix2fv('uMatrix', mat, true);
        expect(mockGL.uniformMatrix2fv).toHaveBeenCalledWith(
          expect.anything(),
          true,
          mat.elements,
        );
      });

      it('setUniformMatrix3fv supports transpose parameter', () => {
        const mat = new Matrix3();
        program.setUniformMatrix3fv('uMatrix', mat, true);
        expect(mockGL.uniformMatrix3fv).toHaveBeenCalledWith(
          expect.anything(),
          true,
          mat.elements,
        );
      });

      it('setUniformMatrix4fv supports transpose parameter', () => {
        const mat = new Matrix4();
        program.setUniformMatrix4fv('uMatrix', mat, true);
        expect(mockGL.uniformMatrix4fv).toHaveBeenCalledWith(
          expect.anything(),
          true,
          mat.elements,
        );
      });

      it('setUniformMatrix2x3fv supports transpose parameter', () => {
        program.setUniformMatrix2x3fv('uMatrix', new Float32Array(6), true);
        expect(mockGL.uniformMatrix2x3fv).toHaveBeenCalledWith(
          expect.anything(),
          true,
          expect.any(Float32Array),
        );
      });

      it('setUniformMatrix2x4fv supports transpose parameter', () => {
        program.setUniformMatrix2x4fv('uMatrix', new Float32Array(8), true);
        expect(mockGL.uniformMatrix2x4fv).toHaveBeenCalledWith(
          expect.anything(),
          true,
          expect.any(Float32Array),
        );
      });

      it('setUniformMatrix3x2fv supports transpose parameter', () => {
        program.setUniformMatrix3x2fv('uMatrix', new Float32Array(6), true);
        expect(mockGL.uniformMatrix3x2fv).toHaveBeenCalledWith(
          expect.anything(),
          true,
          expect.any(Float32Array),
        );
      });

      it('setUniformMatrix3x4fv supports transpose parameter', () => {
        program.setUniformMatrix3x4fv('uMatrix', new Float32Array(12), true);
        expect(mockGL.uniformMatrix3x4fv).toHaveBeenCalledWith(
          expect.anything(),
          true,
          expect.any(Float32Array),
        );
      });

      it('setUniformMatrix4x2fv supports transpose parameter', () => {
        program.setUniformMatrix4x2fv('uMatrix', new Float32Array(8), true);
        expect(mockGL.uniformMatrix4x2fv).toHaveBeenCalledWith(
          expect.anything(),
          true,
          expect.any(Float32Array),
        );
      });

      it('setUniformMatrix4x3fv supports transpose parameter', () => {
        program.setUniformMatrix4x3fv('uMatrix', new Float32Array(12), true);
        expect(mockGL.uniformMatrix4x3fv).toHaveBeenCalledWith(
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
      it('setUniform1i throws when disposed', () => {
        program.dispose();
        expect(() => program.setUniform1i('uColor', 1)).toThrow('Program has been disposed');
      });

      it('setUniform1ui throws when disposed', () => {
        program.dispose();
        expect(() => program.setUniform1ui('uColor', 1)).toThrow('Program has been disposed');
      });

      it('setUniform2f throws when disposed', () => {
        program.dispose();
        expect(() => program.setUniform2f('uColor', 1, 2)).toThrow('Program has been disposed');
      });

      it('setUniform2i throws when disposed', () => {
        program.dispose();
        expect(() => program.setUniform2i('uColor', 1, 2)).toThrow('Program has been disposed');
      });

      it('setUniform2ui throws when disposed', () => {
        program.dispose();
        expect(() => program.setUniform2ui('uColor', 1, 2)).toThrow('Program has been disposed');
      });

      it('setUniform3f throws when disposed', () => {
        program.dispose();
        expect(() => program.setUniform3f('uColor', 1, 2, 3)).toThrow('Program has been disposed');
      });

      it('setUniform3i throws when disposed', () => {
        program.dispose();
        expect(() => program.setUniform3i('uColor', 1, 2, 3)).toThrow('Program has been disposed');
      });

      it('setUniform3ui throws when disposed', () => {
        program.dispose();
        expect(() => program.setUniform3ui('uColor', 1, 2, 3)).toThrow('Program has been disposed');
      });

      it('setUniform4f throws when disposed', () => {
        program.dispose();
        expect(() => program.setUniform4f('uColor', 1, 2, 3, 4)).toThrow('Program has been disposed');
      });

      it('setUniform4i throws when disposed', () => {
        program.dispose();
        expect(() => program.setUniform4i('uColor', 1, 2, 3, 4)).toThrow('Program has been disposed');
      });

      it('setUniform4ui throws when disposed', () => {
        program.dispose();
        expect(() => program.setUniform4ui('uColor', 1, 2, 3, 4)).toThrow('Program has been disposed');
      });

      it('setUniform1fv throws when disposed', () => {
        program.dispose();
        expect(() => program.setUniform1fv('uColor', [1])).toThrow('Program has been disposed');
      });

      it('setUniform2fv throws when disposed', () => {
        program.dispose();
        expect(() => program.setUniform2fv('uColor', [1, 2])).toThrow('Program has been disposed');
      });

      it('setUniform3fv throws when disposed', () => {
        program.dispose();
        expect(() => program.setUniform3fv('uColor', [1, 2, 3])).toThrow('Program has been disposed');
      });

      it('setUniform4fv throws when disposed', () => {
        program.dispose();
        expect(() => program.setUniform4fv('uColor', [1, 2, 3, 4])).toThrow('Program has been disposed');
      });

      it('setUniform1iv throws when disposed', () => {
        program.dispose();
        expect(() => program.setUniform1iv('uColor', [1])).toThrow('Program has been disposed');
      });

      it('setUniform2iv throws when disposed', () => {
        program.dispose();
        expect(() => program.setUniform2iv('uColor', [1, 2])).toThrow('Program has been disposed');
      });

      it('setUniform3iv throws when disposed', () => {
        program.dispose();
        expect(() => program.setUniform3iv('uColor', [1, 2, 3])).toThrow('Program has been disposed');
      });

      it('setUniform4iv throws when disposed', () => {
        program.dispose();
        expect(() => program.setUniform4iv('uColor', [1, 2, 3, 4])).toThrow('Program has been disposed');
      });

      it('setUniform1uiv throws when disposed', () => {
        program.dispose();
        expect(() => program.setUniform1uiv('uColor', [1])).toThrow('Program has been disposed');
      });

      it('setUniform2uiv throws when disposed', () => {
        program.dispose();
        expect(() => program.setUniform2uiv('uColor', [1, 2])).toThrow('Program has been disposed');
      });

      it('setUniform3uiv throws when disposed', () => {
        program.dispose();
        expect(() => program.setUniform3uiv('uColor', [1, 2, 3])).toThrow('Program has been disposed');
      });

      it('setUniform4uiv throws when disposed', () => {
        program.dispose();
        expect(() => program.setUniform4uiv('uColor', [1, 2, 3, 4])).toThrow('Program has been disposed');
      });

      it('setUniformMatrix2fv throws when disposed', () => {
        program.dispose();
        expect(() => program.setUniformMatrix2fv('uMatrix', [1, 0, 0, 1])).toThrow('Program has been disposed');
      });

      it('setUniformMatrix3fv throws when disposed', () => {
        program.dispose();
        expect(() => program.setUniformMatrix3fv('uMatrix', new Float32Array(9))).toThrow('Program has been disposed');
      });

      it('setUniformMatrix4fv throws when disposed', () => {
        program.dispose();
        expect(() => program.setUniformMatrix4fv('uMatrix', new Float32Array(16))).toThrow('Program has been disposed');
      });

      it('setUniformMatrix2x3fv throws when disposed', () => {
        program.dispose();
        expect(() => program.setUniformMatrix2x3fv('uMatrix', new Float32Array(6))).toThrow('Program has been disposed');
      });

      it('setUniformMatrix2x4fv throws when disposed', () => {
        program.dispose();
        expect(() => program.setUniformMatrix2x4fv('uMatrix', new Float32Array(8))).toThrow('Program has been disposed');
      });

      it('setUniformMatrix3x2fv throws when disposed', () => {
        program.dispose();
        expect(() => program.setUniformMatrix3x2fv('uMatrix', new Float32Array(6))).toThrow('Program has been disposed');
      });

      it('setUniformMatrix3x4fv throws when disposed', () => {
        program.dispose();
        expect(() => program.setUniformMatrix3x4fv('uMatrix', new Float32Array(12))).toThrow('Program has been disposed');
      });

      it('setUniformMatrix4x2fv throws when disposed', () => {
        program.dispose();
        expect(() => program.setUniformMatrix4x2fv('uMatrix', new Float32Array(8))).toThrow('Program has been disposed');
      });

      it('setUniformMatrix4x3fv throws when disposed', () => {
        program.dispose();
        expect(() => program.setUniformMatrix4x3fv('uMatrix', new Float32Array(12))).toThrow('Program has been disposed');
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