import { GLContext } from '../core/GLContext';
import { Vector2 } from '../math/vectors/Vector2';
import { Vector3 } from '../math/vectors/Vector3';
import { Vector4 } from '../math/vectors/Vector4';
import { Matrix2 } from '../math/matrices/Matrix2';
import { Matrix3 } from '../math/matrices/Matrix3';
import { Matrix4 } from '../math/matrices/Matrix4';
import { Quaternion } from '../math/quaternions/Quaternion';
import { Matrix } from '../math';
import { AppError } from '../errors/AppError.js';
import { ErrorCode } from '../errors/ErrorCodes.js';

/**
 * Program - WebGL program wrapper (Layer 2 GPU resource)
 *
 * A Program is a compiled GPU program consisting of a vertex shader and fragment
 * shader linked together. This is the executable code that runs on the GPU during
 * rendering.
 *
 * **WebGL Concept:**
 * In WebGL, creating a shader program requires:
 * 1. Create and compile a vertex shader
 * 2. Create and compile a fragment shader
 * 3. Link them into a WebGL program
 * 4. Query attribute and uniform locations
 *
 * This class handles all of that complexity internally.
 *
 * **Lifecycle:**
 * 1. Create: `new Program(ctx, vertexSource, fragmentSource)`
 * 2. Use: `program.use()` to activate it for rendering
 * 3. Set uniforms: `program.setUniform*()` helper methods
 * 4. Render: `ctx.gl.drawArrays(...)`
 * 5. Stop using: `program.unuse()` to deactivate
 * 6. Cleanup: `program.dispose()` when no longer needed
 *
 * **Usage:**
 * ```typescript
 * const program = new Program(ctx, vertexShaderSource, fragmentShaderSource);
 * program.use();
 *
 * // Set uniforms using helper methods (chainable)
 * program
 *   .setUniform4f('uColor', 1.0, 0.0, 0.0, 1.0)
 *   .setUniformMatrix4fv('uMVP', mvpMatrix);
 *
 * // Or with Vector/Matrix objects
 * program.setUniform3f('uLightPos', lightPosition);  // Vector3
 * program.setUniformMatrix4fv('uModel', modelMatrix); // Matrix4
 *
 * // Set attributes (usually done via VertexArray)
 * const positionLocation = program.getAttributeLocation('aPosition');
 *
 * program.unuse();
 * program.dispose();
 * ```
 *
 * @internal This is a Layer 2 resource. Advanced users use this directly.
 * Most users should use Shader.ts (Layer 2.5) for a more user-friendly API.
 */
export class Program {
  /**
   * The underlying WebGL program object
   * @internal
   */
  private _program: WebGLProgram;

  /**
   * Reference to GLContext
   * @internal
   */
  private _ctx: GLContext;

  /**
   * Cache of uniform locations for fast lookup
   * Maps uniform name to WebGLUniformLocation (or null if not found)
   * @internal
   */
  private _uniformLocations: Map<string, WebGLUniformLocation | null>;

  /**
   * Cache of attribute locations for fast lookup
   * Maps attribute name to location index (or -1 if not found)
   * @internal
   */
  private _attributeLocations: Map<string, GLint>;

  /**
   * Tracks if this program has been disposed
   * @internal
   */
  private _disposed: boolean;


  /**
   * Creates a new Program from vertex and fragment shader sources
   *
   * The constructor will:
   * - Compile the vertex shader
   * - Compile the fragment shader
   * - Link them into a WebGL program
   * - Delete the shader objects (they're linked into the program)
   * - Register with GLContext for cleanup
   *
   * @param ctx - GLContext to use for program creation
   * @param vertexSource - GLSL vertex shader source code
   * @param fragmentSource - GLSL fragment shader source code
   * @throws Error if shader compilation or program linking fails
   *
   * @example
   * const vertexShader = `
   *   attribute vec4 aPosition;
   *   void main() {
   *     gl_Position = aPosition;
   *   }
   * `;
   * const fragmentShader = `
   *   precision mediump float;
   *   uniform vec4 uColor;
   *   void main() {
   *     gl_FragColor = uColor;
   *   }
   * `;
   * const program = new Program(ctx, vertexShader, fragmentShader);
   */
  constructor(
    ctx: GLContext,
    vertexSource: string,
    fragmentSource: string,
  ) {
    this._ctx = ctx;
    this._uniformLocations = new Map();
    this._attributeLocations = new Map();
    this._disposed = false;

    // Use GLContext's shader compilation and linking
    this._program = ctx.createProgram(vertexSource, fragmentSource);

    // Register with GLContext for cleanup tracking
    ctx.registerProgram(this._program);
  }

  /**
   * Gets the underlying WebGL program object
   *
   * Use this to access the raw WebGL program when you need to work directly
   * with the WebGL API.
   *
   * @returns The WebGLProgram object
   * @throws Error if program has been disposed
   *
   * @example
   * const webGLProgram = program.program;
   * ctx.gl.useProgram(webGLProgram);
   */
  get program(): WebGLProgram {
    if (this._disposed) {
      throw new AppError(ErrorCode.RES_DISPOSED, { resource: 'Program' });
    }
    return this._program;
  }

  /**
   * Query the currently active program from WebGL (source of truth)
   *
   * This queries the actual GPU state to determine which program is currently
   * active, ensuring accuracy even if external code has called
   * `ctx.gl.useProgram()` directly.
   *
   * @param ctx - GLContext to query
   * @returns The currently active WebGLProgram or null if no program is active
   *
   * @example
   * const active = Program.queryCurrentProgram(ctx);
   * if (active === program.webGLProgram) {
   *   console.log('program is currently active');
   * }
   */
  static queryCurrentProgram(ctx: GLContext): WebGLProgram | null {
    return ctx.queryCurrentProgram();
  }

  /**
   * Activates this program for rendering
   *
   * After calling use(), all subsequent rendering commands will use this
   * program. The program remains active until another program is activated
   * or use() is called on a different program.
   *
   * This method updates WebGL state and also updates the static binding
   * tracker (used as an optimization hint, not the source of truth).
   *
   * @returns this for method chaining
   * @throws Error if program has been disposed
   *
   * @example
   * program.use();
   * // Now all rendering uses this program
   * // Set uniforms, render, etc.
   *
   * @example
   * // Method chaining
   * program.use().setUniform1f('uTime', 1.5);
   */
  use(): this {
    if (this._disposed) {
      throw new AppError(ErrorCode.RES_DISPOSED, { resource: 'Program' });
    }

    this._ctx.gl.useProgram(this._program);
    this._ctx.checkError('Program.use()');

    return this;
  }

  /**
   * Deactivates this program
   *
   * This unbinds the program by setting the active program to null.
   * After calling unuse(), no program is active and rendering commands
   * will fail until another program is activated.
   *
   * In typical usage, you'll use one program until you need another, then
   * call use() on the new program. You rarely need to call unuse() unless
   * you want to ensure no program is active.
   *
   * @returns this for method chaining
   * @throws Error if program has been disposed
   *
   * @example
   * program.unuse();
   * // Now no program is active
   *
   * @example
   * // Method chaining
   * program.unuse().dispose();
   */
  unuse(): this {
    if (this._disposed) {
      throw new AppError(ErrorCode.RES_DISPOSED, { resource: 'Program' });
    }

    this._ctx.gl.useProgram(null);
    this._ctx.checkError('Program.unuse()');

    return this;
  }

  /**
   * Gets the location of a uniform variable in this program
   *
   * Uniforms are global variables in shaders that don't change per vertex.
   * Common uniforms include:
   * - Transformation matrices (model, view, projection)
   * - Lighting properties
   * - Colors and textures
   *
   * Locations are cached internally for fast access on subsequent calls.
   *
   * **Note:** For most use cases, prefer the `setUniform*()` helper methods
   * which handle location lookup automatically. This method is useful for
   * advanced/escape hatch scenarios where you need direct WebGL API access.
   *
   * @param name - Name of the uniform variable in the shader
   * @returns WebGL uniform location object, or null if not found
   * @throws Error if program has been disposed
   *
   * @example
   * // Preferred: Use helper methods (handles location lookup automatically)
   * program.use().setUniform4f('uColor', 1.0, 0.0, 0.0, 1.0);
   *
   * @example
   * // Escape hatch: Direct WebGL access when needed
   * const colorLoc = program.getUniformLocation('uColor');
   * if (colorLoc !== null) {
   *   ctx.gl.uniform4f(colorLoc, 1.0, 0.0, 0.0, 1.0);
   * }
   *
   * @example
   * // Locations are cached
   * const loc1 = program.getUniformLocation('uTime');  // Queries GPU
   * const loc2 = program.getUniformLocation('uTime');  // Returns cached value
   */
  getUniformLocation(name: string): WebGLUniformLocation | null {
    if (this._disposed) {
      throw new AppError(ErrorCode.RES_DISPOSED, { resource: 'Program' });
    }

    // Check cache first
    if (this._uniformLocations.has(name)) {
      return this._uniformLocations.get(name)!;
    }

    // Query WebGL
    const location = this._ctx.gl.getUniformLocation(this._program, name);
    this._uniformLocations.set(name, location);
    this._ctx.checkError(`getUniformLocation("${name}")`);

    return location;
  }

  /**
   * Gets the location of an attribute variable in this program
   *
   * Attributes are per-vertex variables in shaders. Common attributes include:
   * - Vertex positions
   * - Vertex colors
   * - Texture coordinates
   * - Normals
   *
   * In typical usage, you configure attributes via VertexArray, not directly.
   * But you may need the location for debugging or advanced usage.
   *
   * Locations are cached internally for fast access on subsequent calls.
   *
   * @param name - Name of the attribute variable in the shader
   * @returns WebGL attribute location (integer index), or -1 if not found
   * @throws Error if program has been disposed
   *
   * @example
   * const posLoc = program.getAttributeLocation('aPosition');
   * // Typically used with VertexArray, not directly
   *
   * @example
   * // Locations are cached
   * const loc1 = program.getAttributeLocation('aPosition');  // Queries GPU
   * const loc2 = program.getAttributeLocation('aPosition');  // Returns cached
   */
  getAttributeLocation(name: string): GLint {
    if (this._disposed) {
      throw new AppError(ErrorCode.RES_DISPOSED, { resource: 'Program' });
    }

    // Check cache first
    let location = this._attributeLocations.get(name);
    if (location === undefined) {
      // Query WebGL - getAttribLocation returns number (GLint)
      const glLocation = this._ctx.gl.getAttribLocation(this._program, name);
      location = glLocation !== -1 ? glLocation : -1;
      this._attributeLocations.set(name, location);
      this._ctx.checkError(`getAttributeLocation("${name}")`);
    }

    return location;
  }

  // ============================================================================
  // Uniform Setters - Scalars
  // ============================================================================

  /**
   * Sets a float uniform value
   *
   * @param name - Uniform variable name in the shader
   * @param value - Float value to set
   * @returns this for method chaining
   * @throws Error if program has been disposed
   * @throws Error if program is not currently in use
   *
   * @example
   * program.use().setUniform1f('uTime', 1.5);
   */
  setUniform1f(name: string, value: number): this {
    if (this._disposed) {
      throw new AppError(ErrorCode.RES_DISPOSED, { resource: 'Program' });
    }
    this._validateProgramInUse('setUniform1f');
    const location = this.getUniformLocation(name);
    if (location !== null) {
      this._ctx.gl.uniform1f(location, value);
    }
    return this;
  }

  /**
   * Sets an integer uniform value (also used for sampler2D, samplerCube)
   *
   * @param name - Uniform variable name in the shader
   * @param value - Integer value to set
   * @returns this for method chaining
   * @throws Error if program has been disposed
   * @throws Error if program is not currently in use
   * @throws Error if value is not a finite integer
   *
   * @example
   * program.use().setUniform1i('uTexture', 0); // Texture unit 0
   */
  setUniform1i(name: string, value: number): this {
    if (this._disposed) {
      throw new AppError(ErrorCode.RES_DISPOSED, { resource: 'Program' });
    }
    this._validateProgramInUse('setUniform1i');
    this._validateInt(value, 'setUniform1i');
    const location = this.getUniformLocation(name);
    if (location !== null) {
      this._ctx.gl.uniform1i(location, value);
    }
    return this;
  }

  /**
   * Sets an unsigned integer uniform value (WebGL 2)
   *
   * @param name - Uniform variable name in the shader
   * @param value - Unsigned integer value to set
   * @returns this for method chaining
   * @throws Error if program has been disposed
   * @throws Error if program is not currently in use
   * @throws Error if value is not a finite non-negative integer
   */
  setUniform1ui(name: string, value: number): this {
    if (this._disposed) {
      throw new AppError(ErrorCode.RES_DISPOSED, { resource: 'Program' });
    }
    this._validateProgramInUse('setUniform1ui');
    this._validateUint(value, 'setUniform1ui');
    const location = this.getUniformLocation(name);
    if (location !== null) {
      this._ctx.gl.uniform1ui(location, value);
    }
    return this;
  }

  // ============================================================================
  // Uniform Setters - vec2
  // ============================================================================

  /**
   * Sets a vec2 uniform value
   *
   * Accepts either individual components or a Vector2 object.
   *
   * @param name - Uniform variable name in the shader
   * @param x - First component, or a Vector2 object
   * @param y - Second component (required if x is a number)
   * @returns this for method chaining
   * @throws Error if program has been disposed
   * @throws Error if program is not currently in use
   * @throws Error if x is a number but y is not provided
   *
   * @example
   * // With individual values
   * program.use().setUniform2f('uResolution', 800, 600);
   *
   * @example
   * // With Vector2
   * const resolution = new Vector2(800, 600);
   * program.use().setUniform2f('uResolution', resolution);
   */
  setUniform2f(name: string, x: number | Vector2, y?: number): this {
    if (this._disposed) {
      throw new AppError(ErrorCode.RES_DISPOSED, { resource: 'Program' });
    }
    this._validateProgramInUse('setUniform2f');
    const location = this.getUniformLocation(name);
    if (location !== null) {
      if (x instanceof Vector2) {
        this._ctx.gl.uniform2f(location, x.x, x.y);
      } else {
        if (y === undefined) {
          throw new AppError(ErrorCode.RES_INVALID_ARG, {
            resource: 'Program',
            method: 'setUniform2f',
            detail: 'y is required when x is a number',
          });
        }
        this._ctx.gl.uniform2f(location, x, y);
      }
    }
    return this;
  }

  /**
   * Sets an ivec2 uniform value
   *
   * Accepts either individual components or a Vector2 object (values must be integers).
   *
   * @param name - Uniform variable name in the shader
   * @param x - First component, or a Vector2 object with integer values
   * @param y - Second component (required if x is a number)
   * @returns this for method chaining
   * @throws Error if program has been disposed
   * @throws Error if program is not currently in use
   * @throws Error if values are not finite integers
   *
   * @example
   * // With individual values
   * program.use().setUniform2i('uGridSize', 10, 20);
   *
   * @example
   * // With Vector2 (values must be integers)
   * const gridSize = new Vector2(10, 20);
   * program.use().setUniform2i('uGridSize', gridSize);
   */
  setUniform2i(name: string, x: number | Vector2, y?: number): this {
    if (this._disposed) {
      throw new AppError(ErrorCode.RES_DISPOSED, { resource: 'Program' });
    }
    this._validateProgramInUse('setUniform2i');
    const location = this.getUniformLocation(name);
    if (location !== null) {
      if (x instanceof Vector2) {
        this._validateIntArray(x.elements, 'setUniform2i');
        this._ctx.gl.uniform2i(location, x.x, x.y);
      } else {
        if (y === undefined) {
          throw new AppError(ErrorCode.RES_INVALID_ARG, {
            resource: 'Program',
            method: 'setUniform2i',
            detail: 'y is required when x is a number',
          });
        }
        this._validateIntArray([x, y], 'setUniform2i');
        this._ctx.gl.uniform2i(location, x, y);
      }
    }
    return this;
  }

  /**
   * Sets a uvec2 uniform value (WebGL 2)
   *
   * Accepts either individual components or a Vector2 object (values must be non-negative integers).
   *
   * @param name - Uniform variable name in the shader
   * @param x - First component, or a Vector2 object with non-negative integer values
   * @param y - Second component (required if x is a number)
   * @returns this for method chaining
   * @throws Error if program has been disposed
   * @throws Error if program is not currently in use
   * @throws Error if values are not finite non-negative integers
   *
   * @example
   * // With individual values
   * program.use().setUniform2ui('uCount', 5, 10);
   *
   * @example
   * // With Vector2 (values must be non-negative integers)
   * const count = new Vector2(5, 10);
   * program.use().setUniform2ui('uCount', count);
   */
  setUniform2ui(name: string, x: number | Vector2, y?: number): this {
    if (this._disposed) {
      throw new AppError(ErrorCode.RES_DISPOSED, { resource: 'Program' });
    }
    this._validateProgramInUse('setUniform2ui');
    const location = this.getUniformLocation(name);
    if (location !== null) {
      if (x instanceof Vector2) {
        this._validateUintArray(x.elements, 'setUniform2ui');
        this._ctx.gl.uniform2ui(location, x.x, x.y);
      } else {
        if (y === undefined) {
          throw new AppError(ErrorCode.RES_INVALID_ARG, {
            resource: 'Program',
            method: 'setUniform2ui',
            detail: 'y is required when x is a number',
          });
        }
        this._validateUintArray([x, y], 'setUniform2ui');
        this._ctx.gl.uniform2ui(location, x, y);
      }
    }
    return this;
  }

  // ============================================================================
  // Uniform Setters - vec3
  // ============================================================================

  /**
   * Sets a vec3 uniform value
   *
   * Accepts either individual components or a Vector3 object.
   *
   * @param name - Uniform variable name in the shader
   * @param x - First component, or a Vector3 object
   * @param y - Second component (required if x is a number)
   * @param z - Third component (required if x is a number)
   * @returns this for method chaining
   * @throws Error if program has been disposed
   * @throws Error if program is not currently in use
   * @throws Error if x is a number but y or z is not provided
   *
   * @example
   * // With individual values
   * program.use().setUniform3f('uLightPosition', 1.0, 2.0, 3.0);
   *
   * @example
   * // With Vector3
   * const lightPos = new Vector3(1.0, 2.0, 3.0);
   * program.use().setUniform3f('uLightPosition', lightPos);
   */
  setUniform3f(name: string, x: number | Vector3, y?: number, z?: number): this {
    if (this._disposed) {
      throw new AppError(ErrorCode.RES_DISPOSED, { resource: 'Program' });
    }
    this._validateProgramInUse('setUniform3f');
    const location = this.getUniformLocation(name);
    if (location !== null) {
      if (x instanceof Vector3) {
        this._ctx.gl.uniform3f(location, x.x, x.y, x.z);
      } else {
        if (y === undefined || z === undefined) {
          throw new AppError(ErrorCode.RES_INVALID_ARG, {
            resource: 'Program',
            method: 'setUniform3f',
            detail: 'y and z are required when x is a number',
          });
        }
        this._ctx.gl.uniform3f(location, x, y, z);
      }
    }
    return this;
  }

  /**
   * Sets an ivec3 uniform value
   *
   * Accepts either individual components or a Vector3 object (values must be integers).
   *
   * @param name - Uniform variable name in the shader
   * @param x - First component, or a Vector3 object with integer values
   * @param y - Second component (required if x is a number)
   * @param z - Third component (required if x is a number)
   * @returns this for method chaining
   * @throws Error if program has been disposed
   * @throws Error if program is not currently in use
   * @throws Error if values are not finite integers
   *
   * @example
   * // With individual values
   * program.use().setUniform3i('uGridPos', 1, 2, 3);
   *
   * @example
   * // With Vector3 (values must be integers)
   * const gridPos = new Vector3(1, 2, 3);
   * program.use().setUniform3i('uGridPos', gridPos);
   */
  setUniform3i(name: string, x: number | Vector3, y?: number, z?: number): this {
    if (this._disposed) {
      throw new AppError(ErrorCode.RES_DISPOSED, { resource: 'Program' });
    }
    this._validateProgramInUse('setUniform3i');
    const location = this.getUniformLocation(name);
    if (location !== null) {
      if (x instanceof Vector3) {
        this._validateIntArray(x.elements, 'setUniform3i');
        this._ctx.gl.uniform3i(location, x.x, x.y, x.z);
      } else {
        if (y === undefined || z === undefined) {
          throw new AppError(ErrorCode.RES_INVALID_ARG, {
            resource: 'Program',
            method: 'setUniform3i',
            detail: 'y and z are required when x is a number',
          });
        }
        this._validateIntArray([x, y, z], 'setUniform3i');
        this._ctx.gl.uniform3i(location, x, y, z);
      }
    }
    return this;
  }

  /**
   * Sets a uvec3 uniform value (WebGL 2)
   *
   * Accepts either individual components or a Vector3 object (values must be non-negative integers).
   *
   * @param name - Uniform variable name in the shader
   * @param x - First component, or a Vector3 object with non-negative integer values
   * @param y - Second component (required if x is a number)
   * @param z - Third component (required if x is a number)
   * @returns this for method chaining
   * @throws Error if program has been disposed
   * @throws Error if program is not currently in use
   * @throws Error if values are not finite non-negative integers
   *
   * @example
   * // With individual values
   * program.use().setUniform3ui('uCount', 1, 2, 3);
   *
   * @example
   * // With Vector3 (values must be non-negative integers)
   * const count = new Vector3(1, 2, 3);
   * program.use().setUniform3ui('uCount', count);
   */
  setUniform3ui(name: string, x: number | Vector3, y?: number, z?: number): this {
    if (this._disposed) {
      throw new AppError(ErrorCode.RES_DISPOSED, { resource: 'Program' });
    }
    this._validateProgramInUse('setUniform3ui');
    const location = this.getUniformLocation(name);
    if (location !== null) {
      if (x instanceof Vector3) {
        this._validateUintArray(x.elements, 'setUniform3ui');
        this._ctx.gl.uniform3ui(location, x.x, x.y, x.z);
      } else {
        if (y === undefined || z === undefined) {
          throw new AppError(ErrorCode.RES_INVALID_ARG, {
            resource: 'Program',
            method: 'setUniform3ui',
            detail: 'y and z are required when x is a number',
          });
        }
        this._validateUintArray([x, y, z], 'setUniform3ui');
        this._ctx.gl.uniform3ui(location, x, y, z);
      }
    }
    return this;
  }

  // ============================================================================
  // Uniform Setters - vec4
  // ============================================================================

  /**
   * Sets a vec4 uniform value
   *
   * Accepts either individual components, a Vector4 object, or a Quaternion.
   *
   * @param name - Uniform variable name in the shader
   * @param x - First component, or a Vector4/Quaternion object
   * @param y - Second component (required if x is a number)
   * @param z - Third component (required if x is a number)
   * @param w - Fourth component (required if x is a number)
   * @returns this for method chaining
   * @throws Error if program has been disposed
   * @throws Error if program is not currently in use
   * @throws Error if x is a number but y, z, or w is not provided
   *
   * @example
   * // With individual values
   * program.use().setUniform4f('uColor', 1.0, 0.0, 0.0, 1.0);
   *
   * @example
   * // With Vector4
   * const color = new Vector4(1.0, 0.0, 0.0, 1.0);
   * program.use().setUniform4f('uColor', color);
   *
   * @example
   * // With Quaternion (for rotation uniforms)
   * const rotation = new Quaternion();
   * program.use().setUniform4f('uRotation', rotation);
   */
  setUniform4f(
    name: string,
    x: number | Vector4 | Quaternion,
    y?: number,
    z?: number,
    w?: number,
  ): this {
    if (this._disposed) {
      throw new AppError(ErrorCode.RES_DISPOSED, { resource: 'Program' });
    }
    this._validateProgramInUse('setUniform4f');
    const location = this.getUniformLocation(name);
    if (location !== null) {
      if (x instanceof Vector4) {
        this._ctx.gl.uniform4f(location, x.x, x.y, x.z, x.w);
      } else if (x instanceof Quaternion) {
        this._ctx.gl.uniform4f(location, x.x, x.y, x.z, x.w);
      } else {
        if (y === undefined || z === undefined || w === undefined) {
          throw new AppError(ErrorCode.RES_INVALID_ARG, {
            resource: 'Program',
            method: 'setUniform4f',
            detail: 'y, z, and w are required when x is a number',
          });
        }
        this._ctx.gl.uniform4f(location, x, y, z, w);
      }
    }
    return this;
  }

  /**
   * Sets an ivec4 uniform value
   *
   * Accepts either individual components or a Vector4 object (values must be integers).
   *
   * @param name - Uniform variable name in the shader
   * @param x - First component, or a Vector4 object with integer values
   * @param y - Second component (required if x is a number)
   * @param z - Third component (required if x is a number)
   * @param w - Fourth component (required if x is a number)
   * @returns this for method chaining
   * @throws Error if program has been disposed
   * @throws Error if program is not currently in use
   * @throws Error if values are not finite integers
   *
   * @example
   * // With individual values
   * program.use().setUniform4i('uGridPos', 1, 2, 3, 4);
   *
   * @example
   * // With Vector4 (values must be integers)
   * const gridPos = new Vector4(1, 2, 3, 4);
   * program.use().setUniform4i('uGridPos', gridPos);
   */
  setUniform4i(
    name: string,
    x: number | Vector4 | Quaternion,
    y?: number,
    z?: number,
    w?: number,
  ): this {
    if (this._disposed) {
      throw new AppError(ErrorCode.RES_DISPOSED, { resource: 'Program' });
    }
    this._validateProgramInUse('setUniform4i');
    const location = this.getUniformLocation(name);
    if (location !== null) {
      if (x instanceof Vector4) {
        this._validateIntArray(x.elements, 'setUniform4i');
        this._ctx.gl.uniform4i(location, x.x, x.y, x.z, x.w);
      } else if (x instanceof Quaternion) {
        this._validateIntArray(x.elements, 'setUniform4i');
        this._ctx.gl.uniform4i(location, x.x, x.y, x.z, x.w);
      } else {
        if (y === undefined || z === undefined || w === undefined) {
          throw new AppError(ErrorCode.RES_INVALID_ARG, {
            resource: 'Program',
            method: 'setUniform4i',
            detail: 'y, z, and w are required when x is a number',
          });
        }
        this._validateIntArray([x, y, z, w], 'setUniform4i');
        this._ctx.gl.uniform4i(location, x, y, z, w);
      }
    }
    return this;
  }

  /**
   * Sets a uvec4 uniform value (WebGL 2)
   *
   * Accepts either individual components or a Vector4 object (values must be non-negative integers).
   *
   * @param name - Uniform variable name in the shader
   * @param x - First component, or a Vector4 object with non-negative integer values
   * @param y - Second component (required if x is a number)
   * @param z - Third component (required if x is a number)
   * @param w - Fourth component (required if x is a number)
   * @returns this for method chaining
   * @throws Error if program has been disposed
   * @throws Error if program is not currently in use
   * @throws Error if values are not finite non-negative integers
   *
   * @example
   * // With individual values
   * program.use().setUniform4ui('uCount', 1, 2, 3, 4);
   *
   * @example
   * // With Vector4 (values must be non-negative integers)
   * const count = new Vector4(1, 2, 3, 4);
   * program.use().setUniform4ui('uCount', count);
   */
  setUniform4ui(
    name: string,
    x: number | Vector4 | Quaternion,
    y?: number,
    z?: number,
    w?: number,
  ): this {
    if (this._disposed) {
      throw new AppError(ErrorCode.RES_DISPOSED, { resource: 'Program' });
    }
    this._validateProgramInUse('setUniform4ui');
    const location = this.getUniformLocation(name);
    if (location !== null) {
      if (x instanceof Vector4) {
        this._validateUintArray(x.elements, 'setUniform4ui');
        this._ctx.gl.uniform4ui(location, x.x, x.y, x.z, x.w);
      } else if (x instanceof Quaternion) {
        this._validateUintArray(x.elements, 'setUniform4ui');
        this._ctx.gl.uniform4ui(location, x.x, x.y, x.z, x.w);
      } else {
        if (y === undefined || z === undefined || w === undefined) {
          throw new AppError(ErrorCode.RES_INVALID_ARG, {
            resource: 'Program',
            method: 'setUniform4ui',
            detail: 'y, z, and w are required when x is a number',
          });
        }
        this._validateUintArray([x, y, z, w], 'setUniform4ui');
        this._ctx.gl.uniform4ui(location, x, y, z, w);
      }
    }
    return this;
  }

  // ============================================================================
  // Uniform Setters - Float Vector Arrays (*fv versions)
  // ============================================================================

  /**
   * Sets a float or float array uniform value
   *
   * @param name - Uniform variable name in the shader
   * @param value - Float array to set
   * @returns this for method chaining
   * @throws Error if program has been disposed
   * @throws Error if program is not currently in use
   * @throws Error if value is empty
   */
  setUniform1fv(name: string, value: Float32Array | number[]): this {
    if (this._disposed) {
      throw new AppError(ErrorCode.RES_DISPOSED, { resource: 'Program' });
    }
    this._validateProgramInUse('setUniform1fv');
    this._validateArraySize(value, 1, 'setUniform1fv');
    const location = this.getUniformLocation(name);
    if (location !== null) {
      this._ctx.gl.uniform1fv(location, value);
    }
    return this;
  }

  /**
   * Sets a vec2 or vec2 array uniform value
   *
   * @param name - Uniform variable name in the shader
   * @param value - Float array with length divisible by 2
   * @returns this for method chaining
   * @throws Error if program has been disposed
   * @throws Error if program is not currently in use
   * @throws Error if value length is not divisible by 2
   */
  setUniform2fv(name: string, value: Float32Array | number[]): this {
    if (this._disposed) {
      throw new AppError(ErrorCode.RES_DISPOSED, { resource: 'Program' });
    }
    this._validateProgramInUse('setUniform2fv');
    this._validateArraySize(value, 2, 'setUniform2fv');
    const location = this.getUniformLocation(name);
    if (location !== null) {
      this._ctx.gl.uniform2fv(location, value);
    }
    return this;
  }

  /**
   * Sets a vec3 or vec3 array uniform value
   *
   * @param name - Uniform variable name in the shader
   * @param value - Float array with length divisible by 3
   * @returns this for method chaining
   * @throws Error if program has been disposed
   * @throws Error if program is not currently in use
   * @throws Error if value length is not divisible by 3
   */
  setUniform3fv(name: string, value: Float32Array | number[]): this {
    if (this._disposed) {
      throw new AppError(ErrorCode.RES_DISPOSED, { resource: 'Program' });
    }
    this._validateProgramInUse('setUniform3fv');
    this._validateArraySize(value, 3, 'setUniform3fv');
    const location = this.getUniformLocation(name);
    if (location !== null) {
      this._ctx.gl.uniform3fv(location, value);
    }
    return this;
  }

  /**
   * Sets a vec4 or vec4 array uniform value
   *
   * @param name - Uniform variable name in the shader
   * @param value - Float array with length divisible by 4
   * @returns this for method chaining
   * @throws Error if program has been disposed
   * @throws Error if program is not currently in use
   * @throws Error if value length is not divisible by 4
   */
  setUniform4fv(name: string, value: Float32Array | number[]): this {
    if (this._disposed) {
      throw new AppError(ErrorCode.RES_DISPOSED, { resource: 'Program' });
    }
    this._validateProgramInUse('setUniform4fv');
    this._validateArraySize(value, 4, 'setUniform4fv');
    const location = this.getUniformLocation(name);
    if (location !== null) {
      this._ctx.gl.uniform4fv(location, value);
    }
    return this;
  }

  // ============================================================================
  // Uniform Setters - Integer Vector Arrays (*iv versions)
  // ============================================================================

  /**
   * Sets an int or int array uniform value
   *
   * @param name - Uniform variable name in the shader
   * @param value - Integer array to set
   * @returns this for method chaining
   * @throws Error if program has been disposed
   * @throws Error if program is not currently in use
   * @throws Error if value is empty
   */
  setUniform1iv(name: string, value: Int32Array | number[]): this {
    if (this._disposed) {
      throw new AppError(ErrorCode.RES_DISPOSED, { resource: 'Program' });
    }
    this._validateProgramInUse('setUniform1iv');
    this._validateArraySize(value, 1, 'setUniform1iv');
    const location = this.getUniformLocation(name);
    if (location !== null) {
      this._ctx.gl.uniform1iv(location, value);
    }
    return this;
  }

  /**
   * Sets an ivec2 or ivec2 array uniform value
   *
   * @param name - Uniform variable name in the shader
   * @param value - Integer array with length divisible by 2
   * @returns this for method chaining
   * @throws Error if program has been disposed
   * @throws Error if program is not currently in use
   * @throws Error if value length is not divisible by 2
   */
  setUniform2iv(name: string, value: Int32Array | number[]): this {
    if (this._disposed) {
      throw new AppError(ErrorCode.RES_DISPOSED, { resource: 'Program' });
    }
    this._validateProgramInUse('setUniform2iv');
    this._validateArraySize(value, 2, 'setUniform2iv');
    const location = this.getUniformLocation(name);
    if (location !== null) {
      this._ctx.gl.uniform2iv(location, value);
    }
    return this;
  }

  /**
   * Sets an ivec3 or ivec3 array uniform value
   *
   * @param name - Uniform variable name in the shader
   * @param value - Integer array with length divisible by 3
   * @returns this for method chaining
   * @throws Error if program has been disposed
   * @throws Error if program is not currently in use
   * @throws Error if value length is not divisible by 3
   */
  setUniform3iv(name: string, value: Int32Array | number[]): this {
    if (this._disposed) {
      throw new AppError(ErrorCode.RES_DISPOSED, { resource: 'Program' });
    }
    this._validateProgramInUse('setUniform3iv');
    this._validateArraySize(value, 3, 'setUniform3iv');
    const location = this.getUniformLocation(name);
    if (location !== null) {
      this._ctx.gl.uniform3iv(location, value);
    }
    return this;
  }

  /**
   * Sets an ivec4 or ivec4 array uniform value
   *
   * @param name - Uniform variable name in the shader
   * @param value - Integer array with length divisible by 4
   * @returns this for method chaining
   * @throws Error if program has been disposed
   * @throws Error if program is not currently in use
   * @throws Error if value length is not divisible by 4
   */
  setUniform4iv(name: string, value: Int32Array | number[]): this {
    if (this._disposed) {
      throw new AppError(ErrorCode.RES_DISPOSED, { resource: 'Program' });
    }
    this._validateProgramInUse('setUniform4iv');
    this._validateArraySize(value, 4, 'setUniform4iv');
    const location = this.getUniformLocation(name);
    if (location !== null) {
      this._ctx.gl.uniform4iv(location, value);
    }
    return this;
  }

  // ============================================================================
  // Uniform Setters - Unsigned Integer Vector Arrays (*uiv versions, WebGL 2)
  // ============================================================================

  /**
   * Sets a uint or uint array uniform value
   *
   * @param name - Uniform variable name in the shader
   * @param value - Unsigned integer array to set
   * @returns this for method chaining
   * @throws Error if program has been disposed
   * @throws Error if program is not currently in use
   * @throws Error if value is empty
   */
  setUniform1uiv(name: string, value: Uint32Array | number[]): this {
    if (this._disposed) {
      throw new AppError(ErrorCode.RES_DISPOSED, { resource: 'Program' });
    }
    this._validateProgramInUse('setUniform1uiv');
    this._validateArraySize(value, 1, 'setUniform1uiv');
    const location = this.getUniformLocation(name);
    if (location !== null) {
      this._ctx.gl.uniform1uiv(location, value);
    }
    return this;
  }

  /**
   * Sets a uvec2 or uvec2 array uniform value
   *
   * @param name - Uniform variable name in the shader
   * @param value - Unsigned integer array with length divisible by 2
   * @returns this for method chaining
   * @throws Error if program has been disposed
   * @throws Error if program is not currently in use
   * @throws Error if value length is not divisible by 2
   */
  setUniform2uiv(name: string, value: Uint32Array | number[]): this {
    if (this._disposed) {
      throw new AppError(ErrorCode.RES_DISPOSED, { resource: 'Program' });
    }
    this._validateProgramInUse('setUniform2uiv');
    this._validateArraySize(value, 2, 'setUniform2uiv');
    const location = this.getUniformLocation(name);
    if (location !== null) {
      this._ctx.gl.uniform2uiv(location, value);
    }
    return this;
  }

  /**
   * Sets a uvec3 or uvec3 array uniform value
   *
   * @param name - Uniform variable name in the shader
   * @param value - Unsigned integer array with length divisible by 3
   * @returns this for method chaining
   * @throws Error if program has been disposed
   * @throws Error if program is not currently in use
   * @throws Error if value length is not divisible by 3
   */
  setUniform3uiv(name: string, value: Uint32Array | number[]): this {
    if (this._disposed) {
      throw new AppError(ErrorCode.RES_DISPOSED, { resource: 'Program' });
    }
    this._validateProgramInUse('setUniform3uiv');
    this._validateArraySize(value, 3, 'setUniform3uiv');
    const location = this.getUniformLocation(name);
    if (location !== null) {
      this._ctx.gl.uniform3uiv(location, value);
    }
    return this;
  }

  /**
   * Sets a uvec4 or uvec4 array uniform value
   *
   * @param name - Uniform variable name in the shader
   * @param value - Unsigned integer array with length divisible by 4
   * @returns this for method chaining
   * @throws Error if program has been disposed
   * @throws Error if program is not currently in use
   * @throws Error if value length is not divisible by 4
   */
  setUniform4uiv(name: string, value: Uint32Array | number[]): this {
    if (this._disposed) {
      throw new AppError(ErrorCode.RES_DISPOSED, { resource: 'Program' });
    }
    this._validateProgramInUse('setUniform4uiv');
    this._validateArraySize(value, 4, 'setUniform4uiv');
    const location = this.getUniformLocation(name);
    if (location !== null) {
      this._ctx.gl.uniform4uiv(location, value);
    }
    return this;
  }

  // ============================================================================
  // Uniform Setters - Square Matrices
  // ============================================================================

  /**
   * Sets a mat2 uniform value
   *
   * Accepts either a Matrix2 object or a raw array (4 elements, column-major).
   *
   * @param name - Uniform variable name in the shader
   * @param value - Matrix2 object or 4-element array in column-major order
   * @param transpose - Must be false in WebGL (default: false)
   * @returns this for method chaining
   * @throws Error if program has been disposed
   * @throws Error if program is not currently in use
   *
   * @example
   * // With Matrix2
   * const mat = new Matrix2();
   * program.use().setUniformMatrix2fv('uTransform', mat);
   *
   * @example
   * // With raw array
   * program.use().setUniformMatrix2fv('uTransform', [1, 0, 0, 1]);
   */
  setUniformMatrix2fv(
    name: string,
    value: Matrix2 | Float32Array | number[],
    transpose: boolean = false,
  ): this {
    if (this._disposed) {
      throw new AppError(ErrorCode.RES_DISPOSED, { resource: 'Program' });
    }
    this._validateProgramInUse('setUniformMatrix2fv');
    const location = this.getUniformLocation(name);
    if (location !== null) {
      if (value instanceof Matrix2) {
        this._ctx.gl.uniformMatrix2fv(location, transpose, value.elements);
      } else {
        this._validateArraySize(value, 4, 'setUniformMatrix2fv');
        this._ctx.gl.uniformMatrix2fv(location, transpose, value);
      }
    }
    return this;
  }

  /**
   * Sets a mat3 uniform value
   *
   * Accepts either a Matrix3 object or a raw array (9 elements, column-major).
   *
   * @param name - Uniform variable name in the shader
   * @param value - Matrix3 object or 9-element array in column-major order
   * @param transpose - Must be false in WebGL (default: false)
   * @returns this for method chaining
   * @throws Error if program has been disposed
   * @throws Error if program is not currently in use
   *
   * @example
   * // With Matrix3
   * const normalMatrix = new Matrix3();
   * program.use().setUniformMatrix3fv('uNormalMatrix', normalMatrix);
   */
  setUniformMatrix3fv(
    name: string,
    value: Matrix3 | Float32Array | number[],
    transpose: boolean = false,
  ): this {
    if (this._disposed) {
      throw new AppError(ErrorCode.RES_DISPOSED, { resource: 'Program' });
    }
    this._validateProgramInUse('setUniformMatrix3fv');
    const location = this.getUniformLocation(name);
    if (location !== null) {
      if (value instanceof Matrix3) {
        this._ctx.gl.uniformMatrix3fv(location, transpose, value.elements);
      } else {
        this._validateArraySize(value, 9, 'setUniformMatrix3fv');
        this._ctx.gl.uniformMatrix3fv(location, transpose, value);
      }
    }
    return this;
  }

  /**
   * Sets a mat4 uniform value
   *
   * Accepts either a Matrix4 object or a raw array (16 elements, column-major).
   *
   * @param name - Uniform variable name in the shader
   * @param value - Matrix4 object or 16-element array in column-major order
   * @param transpose - Must be false in WebGL (default: false)
   * @returns this for method chaining
   * @throws Error if program has been disposed
   * @throws Error if program is not currently in use
   *
   * @example
   * // With Matrix4
   * const mvp = Matrix4.multiply(projection, Matrix4.multiply(view, model));
   * program.use().setUniformMatrix4fv('uMVP', mvp);
   *
   * @example
   * // With raw array
   * program.use().setUniformMatrix4fv('uMVP', identityMatrix);
   */
  setUniformMatrix4fv(
    name: string,
    value: Matrix4 | Float32Array | number[],
    transpose: boolean = false,
  ): this {
    if (this._disposed) {
      throw new AppError(ErrorCode.RES_DISPOSED, { resource: 'Program' });
    }
    this._validateProgramInUse('setUniformMatrix4fv');
    const location = this.getUniformLocation(name);
    if (location !== null) {
      if (value instanceof Matrix4) {
        this._ctx.gl.uniformMatrix4fv(location, transpose, value.elements);
      } else {
        this._validateArraySize(value, 16, 'setUniformMatrix4fv');
        this._ctx.gl.uniformMatrix4fv(location, transpose, value);
      }
    }
    return this;
  }

  // ============================================================================
  // Uniform Setters - Non-Square Matrices (WebGL 2)
  // ============================================================================

  /**
   * Sets a mat2x3 uniform value (2 columns, 3 rows)
   *
   * @param name - Uniform variable name in the shader
   * @param value - Float array (6 elements in column-major order)
   * @param transpose - Must be false in WebGL (default: false)
   * @returns this for method chaining
   * @throws Error if program has been disposed
   * @throws Error if program is not currently in use
   */
  setUniformMatrix2x3fv(
    name: string,
    value: Matrix | Float32Array | number[],
    transpose: boolean = false,
  ): this {
    if (this._disposed) {
      throw new AppError(ErrorCode.RES_DISPOSED, { resource: 'Program' });
    }
    this._validateProgramInUse('setUniformMatrix2x3fv');
    const location = this.getUniformLocation(name);
    if (location !== null) {
      if (value instanceof Matrix) {
        this._validateMatrixSize(value, 2, 3, 'setUniformMatrix2x3fv');
        this._ctx.gl.uniformMatrix2x3fv(location, transpose, value.elements);
      } else {
        this._validateArraySize(value, 6, 'setUniformMatrix2x3fv');
        this._ctx.gl.uniformMatrix2x3fv(location, transpose, value);
      }
    }
    return this;
  }

  /**
   * Sets a mat2x4 uniform value (2 columns, 4 rows)
   *
   * @param name - Uniform variable name in the shader
   * @param value - Float array (8 elements in column-major order)
   * @param transpose - Must be false in WebGL (default: false)
   * @returns this for method chaining
   * @throws Error if program has been disposed
   * @throws Error if program is not currently in use
   */
  setUniformMatrix2x4fv(
    name: string,
    value: Matrix | Float32Array | number[],
    transpose: boolean = false,
  ): this {
    if (this._disposed) {
      throw new AppError(ErrorCode.RES_DISPOSED, { resource: 'Program' });
    }
    this._validateProgramInUse('setUniformMatrix2x4fv');
    const location = this.getUniformLocation(name);
    if (location !== null) {
      if (value instanceof Matrix) {
        this._validateMatrixSize(value, 2, 4, 'setUniformMatrix2x4fv');
        this._ctx.gl.uniformMatrix2x4fv(location, transpose, value.elements);
      } else {
        this._validateArraySize(value, 8, 'setUniformMatrix2x4fv');
        this._ctx.gl.uniformMatrix2x4fv(location, transpose, value);
      }
    }
    return this;
  }

  /**
   * Sets a mat3x2 uniform value (3 columns, 2 rows)
   *
   * @param name - Uniform variable name in the shader
   * @param value - Float array (6 elements in column-major order)
   * @param transpose - Must be false in WebGL (default: false)
   * @returns this for method chaining
   * @throws Error if program has been disposed
   * @throws Error if program is not currently in use
   */
  setUniformMatrix3x2fv(
    name: string,
    value: Matrix | Float32Array | number[],
    transpose: boolean = false,
  ): this {
    if (this._disposed) {
      throw new AppError(ErrorCode.RES_DISPOSED, { resource: 'Program' });
    }
    this._validateProgramInUse('setUniformMatrix3x2fv');
    const location = this.getUniformLocation(name);
    if (location !== null) {
      if (value instanceof Matrix) {
        this._validateMatrixSize(value, 3, 2, 'setUniformMatrix3x2fv');
        this._ctx.gl.uniformMatrix3x2fv(location, transpose, value.elements);
      } else {
        this._validateArraySize(value, 6, 'setUniformMatrix3x2fv');
        this._ctx.gl.uniformMatrix3x2fv(location, transpose, value);
      }
    }
    return this;
  }

  /**
   * Sets a mat3x4 uniform value (3 columns, 4 rows)
   *
   * @param name - Uniform variable name in the shader
   * @param value - Float array (12 elements in column-major order)
   * @param transpose - Must be false in WebGL (default: false)
   * @returns this for method chaining
   * @throws Error if program has been disposed
   * @throws Error if program is not currently in use
   */
  setUniformMatrix3x4fv(
    name: string,
    value: Matrix | Float32Array | number[],
    transpose: boolean = false,
  ): this {
    if (this._disposed) {
      throw new AppError(ErrorCode.RES_DISPOSED, { resource: 'Program' });
    }
    this._validateProgramInUse('setUniformMatrix3x4fv');
    const location = this.getUniformLocation(name);
    if (location !== null) {
      if (value instanceof Matrix) {
        this._validateMatrixSize(value, 3, 4, 'setUniformMatrix3x4fv');
        this._ctx.gl.uniformMatrix3x4fv(location, transpose, value.elements);
      } else {
        this._validateArraySize(value, 12, 'setUniformMatrix3x4fv');
        this._ctx.gl.uniformMatrix3x4fv(location, transpose, value);
      }
    }
    return this;
  }

  /**
   * Sets a mat4x2 uniform value (4 columns, 2 rows)
   *
   * @param name - Uniform variable name in the shader
   * @param value - Float array (8 elements in column-major order)
   * @param transpose - Must be false in WebGL (default: false)
   * @returns this for method chaining
   * @throws Error if program has been disposed
   * @throws Error if program is not currently in use
   */
  setUniformMatrix4x2fv(
    name: string,
    value: Matrix | Float32Array | number[],
    transpose: boolean = false,
  ): this {
    if (this._disposed) {
      throw new AppError(ErrorCode.RES_DISPOSED, { resource: 'Program' });
    }
    this._validateProgramInUse('setUniformMatrix4x2fv');
    const location = this.getUniformLocation(name);
    if (location !== null) {
      if (value instanceof Matrix) {
        this._validateMatrixSize(value, 4, 2, 'setUniformMatrix4x2fv');
        this._ctx.gl.uniformMatrix4x2fv(location, transpose, value.elements);
      } else {
        this._validateArraySize(value, 8, 'setUniformMatrix4x2fv');
        this._ctx.gl.uniformMatrix4x2fv(location, transpose, value);
      }
    }
    return this;
  }

  /**
   * Sets a mat4x3 uniform value (4 columns, 3 rows)
   *
   * @param name - Uniform variable name in the shader
   * @param value - Float array (12 elements in column-major order)
   * @param transpose - Must be false in WebGL (default: false)
   * @returns this for method chaining
   * @throws Error if program has been disposed
   * @throws Error if program is not currently in use
   */
  setUniformMatrix4x3fv(
    name: string,
    value: Matrix | Float32Array | number[],
    transpose: boolean = false,
  ): this {
    if (this._disposed) {
      throw new AppError(ErrorCode.RES_DISPOSED, { resource: 'Program' });
    }
    this._validateProgramInUse('setUniformMatrix4x3fv');
    const location = this.getUniformLocation(name);
    if (location !== null) {
      if (value instanceof Matrix) {
        this._validateMatrixSize(value, 4, 3, 'setUniformMatrix4x3fv');
        this._ctx.gl.uniformMatrix4x3fv(location, transpose, value.elements);
      } else {
        this._validateArraySize(value, 12, 'setUniformMatrix4x3fv');
        this._ctx.gl.uniformMatrix4x3fv(location, transpose, value);
      }
    }
    return this;
  }

  // ============================================================================
  // Private Validation Helpers
  // ============================================================================

  /**
   * Validates that this program is currently in use (bound)
   * @internal
   * @throws Error if this program is not the currently active program
   */
  private _validateProgramInUse(methodName: string): void {
    const currentProgram = this._ctx.queryCurrentProgram();
    if (currentProgram !== this._program) {
      throw new AppError(ErrorCode.RES_INVALID_ARG, {
        resource: 'Program',
        method: methodName,
        detail: 'Program must be in use (call program.use() first)',
      });
    }
  }

  /**
   * Validates that a value is a valid integer (finite and integer)
   * @internal
   * @throws Error if value is not a finite integer
   */
  private _validateInt(value: number, methodName: string): void {
    if (!Number.isFinite(value)) {
      throw new AppError(ErrorCode.RES_INVALID_ARG, {
        resource: 'Program',
        method: methodName,
        detail: `Value must be a finite number, got ${value}`,
      });
    }
    if (!Number.isInteger(value)) {
      throw new AppError(ErrorCode.RES_INVALID_ARG, {
        resource: 'Program',
        method: methodName,
        detail:
          `Value must be an integer, got ${value}. ` +
          `Use Math.floor(), Math.round(), or Math.trunc() to convert.`,
      });
    }
  }

  /**
   * Validates that all values in an array are valid integers (finite and integer)
   * @internal
   * @throws Error if a is not a finite integer
   */
  private _validateIntArray(values: Float32Array | number[], methodName: string): void {
    for (const value of values) {
      this._validateInt(value, methodName);
    }
  }

  /**
   * Validates that a value is a valid unsigned integer (finite, integer, non-negative)
   * @internal
   * @throws Error if value is not a valid unsigned integer
   */
  private _validateUint(value: number, methodName: string): void {
    if (!Number.isFinite(value)) {
      throw new AppError(ErrorCode.RES_INVALID_ARG, {
        resource: 'Program',
        method: methodName,
        detail: `Value must be a finite number, got ${value}`,
      });
    }
    if (!Number.isInteger(value)) {
      throw new AppError(ErrorCode.RES_INVALID_ARG, {
        resource: 'Program',
        method: methodName,
        detail:
          `Value must be an integer, got ${value}. ` +
          `Use Math.floor(), Math.round(), or Math.trunc() to convert.`,
      });
    }
    if (value < 0) {
      throw new AppError(ErrorCode.RES_INVALID_ARG, {
        resource: 'Program',
        method: methodName,
        detail: `Value must be non-negative for unsigned integer, got ${value}`,
      });
    }
  }

  /**
   * Validates that all values in an array are valid unsigned integers (finite, integer, non-negative)
   * @internal
   * @throws Error if a is not a finite integer
   */
  private _validateUintArray(values: Float32Array | number[], methodName: string): void {
    for (const value of values) {
      this._validateUint(value, methodName);
    }
  }

  /**
   * Validates that an array has a length divisible by the expected size
   * @internal
   * @throws Error if array length is not divisible by expectedSize
   */
  private _validateArraySize(
    value: ArrayLike<number>,
    expectedSize: number,
    methodName: string,
  ): void {
    if (value.length === 0) {
      throw new AppError(ErrorCode.RES_INVALID_ARG, {
        resource: 'Program',
        method: methodName,
        detail: 'Array cannot be empty',
      });
    }
    if (value.length % expectedSize !== 0) {
      throw new AppError(ErrorCode.RES_INVALID_ARG, {
        resource: 'Program',
        method: methodName,
        detail:
          `Array length must be divisible by ${expectedSize}, ` +
          `got length ${value.length}`,
      });
    }
  }

  /**
   * Validates that a matrix is of expected size
   * @internal
   * @throws Error if matrix size is not as expected
   */
  private _validateMatrixSize(
      value: Matrix,
      expectedColumns: number,
      expectedRows: number,
      methodName: string,
  ): void {
    if (value.columns !== expectedColumns || value.rows !== expectedRows) {
      throw new AppError(ErrorCode.RES_INVALID_ARG, {
        resource: 'Program',
        method: methodName,
        detail: `Matrix is not ${expectedColumns}x${expectedRows}`,
      });
    }
  }

  /**
   * Cleans up WebGL resources
   *
   * Once disposed, this Program cannot be used for rendering. The underlying
   * WebGL program object is deleted from GPU memory.
   *
   * You should dispose programs when they're no longer needed to free GPU
   * memory, especially in applications that create many programs dynamically.
   *
   * Attempting to use a disposed program will throw an error.
   *
   * @throws Error if disposed multiple times (safe to call multiple times)
   *
   * @example
   * program.dispose();
   * // program.use() will now throw an error
   *
   * @example
   * // Can call dispose multiple times safely
   * program.dispose();
   * program.dispose();  // Doesn't throw
   */
  dispose(): void {
    if (this._disposed) {
      return;  // Already disposed, nothing to do
    }

    this._ctx.gl.deleteProgram(this._program);
    this._ctx.checkError('Program.dispose()');

    // Clear location caches
    this._uniformLocations.clear();
    this._attributeLocations.clear();

    // Mark as disposed
    this._disposed = true;

  }
}
