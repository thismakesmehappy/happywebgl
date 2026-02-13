import { GLContext } from '../core/GLContext';
import { Program } from '../resources/Program';
import { AppError } from '../errors/AppError.js';
import { ErrorCode } from '../errors/ErrorCodes.js';
import { validate } from '../utils/validate.js';

/**
 * Uniform value types supported by materials
 */
export type UniformValue =
  | number
  | number[]
  | Float32Array
  | Int32Array
  | Uint32Array;

/**
 * Which side(s) of faces to render
 */
export enum Side {
  /** Render front faces only (default) */
  Front = 0,
  /** Render back faces only */
  Back = 1,
  /** Render both sides */
  Double = 2,
}

/**
 * Blend mode presets
 */
export enum BlendMode {
  /** No blending (opaque) */
  None = 0,
  /** Standard alpha blending */
  Normal = 1,
  /** Additive blending (for glows, particles) */
  Additive = 2,
  /** Multiply blending */
  Multiply = 3,
  /** Premultiplied alpha blending */
  Premultiplied = 4,
  /** Screen blending (lighten) */
  Screen = 5,
  /** Subtractive blending (darken) */
  Subtractive = 6,
}

/**
 * Custom blend state configuration (overrides BlendMode when set)
 *
 * Note: When using BlendState, specify all fields you rely on to avoid
 * inheriting prior WebGL state set by other materials.
 */
export interface BlendState {
  /** Enable or disable blending (default: true when BlendState is provided) */
  enabled?: boolean;
  /** Blend factors for RGB + alpha together */
  blendFunc?: { src: GLenum; dst: GLenum };
  /** Separate blend factors for RGB and alpha */
  blendFuncSeparate?: {
    srcRGB: GLenum;
    dstRGB: GLenum;
    srcAlpha: GLenum;
    dstAlpha: GLenum;
  };
  /** Blend equation for RGB + alpha together */
  blendEquation?: GLenum;
  /** Separate blend equations for RGB and alpha */
  blendEquationSeparate?: { modeRGB: GLenum; modeAlpha: GLenum };
  /** Constant blend color (used with CONSTANT_COLOR/ALPHA factors) */
  blendColor?: { r: number; g: number; b: number; a: number };
}

/**
 * Material - Base class for materials (Layer 3)
 *
 * A Material combines a Program with uniform values to define how geometry
 * is rendered. This follows Design A from ARCHITECTURE.md: each Material
 * references a Program and manages its own uniforms.
 *
 * **Architecture:**
 * ```
 * VertexShader + FragmentShader → Program (compiled) → Material (+ uniform values)
 * ```
 *
 * **Design (Design A):**
 * - Material = Program + Uniforms + Render State
 * - Materials reference a compiled Program
 * - Uniforms are stored and uploaded when material is used
 * - Multiple materials can share the same Program with different uniform values
 *
 * **Usage:**
 * ```typescript
 * // Create shader definitions
 * const vs = new VertexShader(vertexSource)
 *   .declareAttribute('aPosition', GLSLType.Vec3)
 *   .declareUniform('uMVP', GLSLType.Mat4);
 *
 * const fs = new FragmentShader(fragmentSource)
 *   .declareUniform('uColor', GLSLType.Vec4);
 *
 * // Create program
 * const program = new Program(ctx, vs, fs);
 *
 * // Create material with uniform values
 * const material = new Material(ctx, program);
 * material.setUniform('uColor', [1.0, 0.0, 0.0, 1.0]);
 * material.setUniform('uMVP', mvpMatrix);
 *
 * // During rendering
 * material.use();  // activates program, applies state, uploads uniforms
 * // ... render geometry ...
 * ```
 *
 * **Per-object uniforms (optimization):**
 * **Best practice:** Material uniforms should represent *material-level* state
 * shared across many draws (e.g., colors, roughness, texture selectors).
 * For uniforms that change per draw call (like MVP matrix), update them
 * directly on the program after calling `use()`:
 * ```typescript
 * material.use();  // uploads material uniforms once
 * for (const object of objects) {
 *   material.program.setUniformMatrix4fv('uMVP', object.mvpMatrix);
 *   object.draw();
 * }
 * ```
 *
 * @see Program for the compiled shader program
 * @see VertexShader for vertex shader definitions
 * @see FragmentShader for fragment shader definitions
 * @see BasicMaterial for a simple flat-color material
 */
export class Material {
  /**
   * The rendering context
   * @internal
   */
  protected _ctx: GLContext;

  /**
   * The compiled program used by this material
   * @internal
   */
  protected _program: Program;

  /**
   * Uniform values to be uploaded when material is used
   * @internal
   */
  protected _uniforms: Map<string, UniformValue> = new Map();

  /**
   * Tracks if this material has been disposed
   * @internal
   */
  protected _disposed: boolean = false;

  // ===========================================================================
  // Render State Properties
  // ===========================================================================

  /**
   * Whether this material is visible (can be skipped in rendering)
   */
  visible: boolean = true;

  /**
   * Whether this material uses transparency
   *
   * Transparent materials are typically rendered after opaque materials
   * and may require sorting by depth.
   */
  transparent: boolean = false;

  /**
   * Which side(s) of faces to render
   *
   * Controls face culling:
   * - Front: cull back faces (default)
   * - Back: cull front faces
   * - Double: no culling (render both sides)
   */
  side: Side = Side.Front;

  /**
   * Whether to perform depth testing
   *
   * When true, fragments are discarded if they fail the depth test.
   */
  depthTest: boolean = true;

  /**
   * Whether to write to the depth buffer
   *
   * Typically disabled for transparent materials to avoid
   * depth-sorting artifacts.
   */
  depthWrite: boolean = true;

  /**
   * Blend mode for this material
   *
   * Controls how fragments are combined with the framebuffer.
   * Ignored when blendState is provided.
   */
  blendMode: BlendMode = BlendMode.None;

  /**
   * Custom blend state (overrides blendMode when set)
   *
   * Use this for advanced blending configurations, including:
   * - Separate RGB/alpha blend factors
   * - Custom blend equations
   * - Constant blend color
   */
  blendState: BlendState | null = null;

  /**
   * Render order hint (lower values render first)
   *
   * Used by renderers to sort materials within the same category
   * (opaque vs transparent).
   */
  renderOrder: number = 0;

  /**
   * Creates a new Material
   *
   * @param ctx - GLContext to use
   * @param program - Compiled Program to use for rendering
   */
  constructor(ctx: GLContext, program: Program) {
    this._ctx = ctx;
    this._program = program;
  }

  /**
   * Resource name for error messages (override in subclasses)
   */
  protected get _resourceName(): string {
    return 'Material';
  }

  /**
   * Whether this material has been disposed
   */
  get isDisposed(): boolean {
    return this._disposed;
  }

  /**
   * Gets the program used by this material
   *
   * Use this for introspection or to set uniforms directly.
   */
  get program(): Program {
    if (this._disposed) {
      throw new AppError(ErrorCode.RES_DISPOSED, { resource: this._resourceName });
    }
    return this._program;
  }

  /**
   * Gets all uniform names
   */
  get uniformNames(): string[] {
    return Array.from(this._uniforms.keys());
  }

  /**
   * Sets a uniform value
   *
   * The uniform will be uploaded to the shader when `use()` is called.
   *
   * **Best practice:** use this for material-level uniforms (shared across many
   * draws). For per-object/per-draw uniforms, call `material.use()` and then set
   * uniforms directly on `material.program`.
   *
   * @param name - Uniform name in the shader
   * @param value - Uniform value
   * @returns this for method chaining
   * @throws AppError if material has been disposed
   */
  setUniform(name: string, value: UniformValue): this {
    if (this._disposed) {
      throw new AppError(ErrorCode.RES_DISPOSED, { resource: this._resourceName });
    }
    this._uniforms.set(name, value);
    return this;
  }

  /**
   * Gets a uniform value
   *
   * @param name - Uniform name
   * @returns The uniform value or undefined if not set
   */
  getUniform(name: string): UniformValue | undefined {
    return this._uniforms.get(name);
  }

  /**
   * Checks if a uniform is set
   *
   * @param name - Uniform name
   * @returns true if the uniform is set
   */
  hasUniform(name: string): boolean {
    return this._uniforms.has(name);
  }

  /**
   * Removes a uniform
   *
   * @param name - Uniform name to remove
   * @returns this for method chaining
   */
  removeUniform(name: string): this {
    this._uniforms.delete(name);
    return this;
  }

  /**
   * Activates this material for rendering
   *
   * This is a convenience method that:
   * 1. Activates the shader program
   * 2. Applies render state (depth, culling, blending)
   * 3. Uploads all uniforms
   *
   * For fine-grained control (e.g., in a Renderer), use:
   * - `applyState()` - apply render state only
   * - `applyUniforms()` - upload uniforms only
   *
   * @returns this for method chaining
   * @throws AppError if material has been disposed
   */
  use(): this {
    if (this._disposed) {
      throw new AppError(ErrorCode.RES_DISPOSED, { resource: this._resourceName });
    }

    // 1. Activate the program
    this._program.use();

    // 2. Apply render state
    this.applyState();

    // 3. Upload uniforms
    this.applyUniforms();

    return this;
  }

  /**
   * Applies render state for this material
   *
   * Sets depth testing, depth writing, face culling, and blending
   * based on the material's properties.
   *
   * **Phase 4 Renderer Integration:**
   * A Renderer can batch objects by material and call `applyState()` once
   * per material, then call `applyUniforms()` for each object. This reduces
   * redundant state changes when rendering many objects with the same material.
   *
   * @returns this for method chaining
   * @throws AppError if material has been disposed
   */
  applyState(): this {
    if (this._disposed) {
      throw new AppError(ErrorCode.RES_DISPOSED, { resource: this._resourceName });
    }

    this._applyDepthState();
    this._applyCullState();
    this._applyBlendState();

    return this;
  }

  private _applyDepthState(): void {
    const state = this._ctx.state;

    if (this.depthTest) {
      state.enableDepthTest();
    } else {
      state.disableDepthTest();
    }

    state.setDepthMask(this.depthWrite);
  }

  private _applyCullState(): void {
    const state = this._ctx.state;

    switch (this.side) {
      case Side.Front:
        // Render front faces only → cull back faces
        state.setCullFaceBack();
        break;
      case Side.Back:
        // Render back faces only → cull front faces
        state.setCullFaceFront();
        break;
      case Side.Double:
        // Render both sides → disable culling
        state.disableCullFace();
        break;
    }
  }

  private _applyBlendState(): void {
    const gl = this._ctx.gl;
    const state = this._ctx.state;

    if (this.blendState) {
      const blendState = this.blendState;
      if (blendState.enabled === false) {
        state.disableBlend();
        return;
      }

      state.enableBlend();

      if (blendState.blendColor) {
        const { r, g, b, a } = blendState.blendColor;
        state.setBlendColor(r, g, b, a);
      }

      if (blendState.blendEquationSeparate) {
        const { modeRGB, modeAlpha } = blendState.blendEquationSeparate;
        state.setBlendEquationSeparate(modeRGB, modeAlpha);
      } else if (blendState.blendEquation !== undefined) {
        state.setBlendEquation(blendState.blendEquation);
      }

      if (blendState.blendFuncSeparate) {
        const { srcRGB, dstRGB, srcAlpha, dstAlpha } = blendState.blendFuncSeparate;
        state.setBlendFuncSeparate(srcRGB, dstRGB, srcAlpha, dstAlpha);
      } else if (blendState.blendFunc) {
        const { src, dst } = blendState.blendFunc;
        state.setBlendFunc(src, dst);
      }

      return;
    }

    switch (this.blendMode) {
      case BlendMode.None:
        state.disableBlend();
        break;
      case BlendMode.Normal:
        state.enableBlend();
        state.setBlendEquation(gl.FUNC_ADD);
        state.setBlendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
        break;
      case BlendMode.Additive:
        state.enableBlend();
        state.setBlendEquation(gl.FUNC_ADD);
        state.setBlendFunc(gl.SRC_ALPHA, gl.ONE);
        break;
      case BlendMode.Multiply:
        state.enableBlend();
        state.setBlendEquation(gl.FUNC_ADD);
        state.setBlendFunc(gl.DST_COLOR, gl.ZERO);
        break;
      case BlendMode.Premultiplied:
        state.enableBlend();
        state.setBlendEquation(gl.FUNC_ADD);
        state.setBlendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
        break;
      case BlendMode.Screen:
        state.enableBlend();
        state.setBlendEquation(gl.FUNC_ADD);
        state.setBlendFunc(gl.ONE, gl.ONE_MINUS_SRC_COLOR);
        break;
      case BlendMode.Subtractive:
        state.enableBlend();
        state.setBlendEquation(gl.FUNC_REVERSE_SUBTRACT);
        state.setBlendFunc(gl.ONE, gl.ONE);
        break;
    }
  }

  /**
   * Uploads all uniforms for this material
   *
   * Calls the subclass `_updateUniforms()` hook, then uploads all stored
   * uniform values to the active shader program.
   *
   * **Note:** The program must be active before calling this method.
   * Use `material.program.use()` or `material.use()` first.
   *
   * **Best practice:** treat material uniforms as shared state; set per-object
   * uniforms on the program after `use()`.
   *
   * **Phase 4 Renderer Integration:**
   * A Renderer can call `applyUniforms()` for each object after calling
   * `applyState()` once per material batch. Per-object uniforms (like
   * model matrix) can be set via `setUniform()` before calling this.
   *
   * @returns this for method chaining
   * @throws AppError if material has been disposed
   */
  applyUniforms(): this {
    if (this._disposed) {
      throw new AppError(ErrorCode.RES_DISPOSED, { resource: this._resourceName });
    }

    // Call subclass hook to update uniforms
    this._updateUniforms();

    // Upload all stored uniforms
    for (const [name, value] of this._uniforms) {
      this._uploadUniform(name, value);
    }

    return this;
  }

  /**
   * Uploads a single uniform value to the program
   *
   * Determines the appropriate setter method based on the value type and length.
   *
   * @param name - Uniform name
   * @param value - Uniform value
   * @internal
   */
  protected _uploadUniform(name: string, value: UniformValue): void {
    const program = this._program;

    if (typeof value === 'number') {
      // Scalar number → float
      program.setUniform1f(name, value);
      return;
    }

    if (value instanceof Float32Array) {
      this._uploadFloat32Array(name, value);
      return;
    }

    if (value instanceof Int32Array) {
      this._uploadInt32Array(name, value);
      return;
    }

    if (value instanceof Uint32Array) {
      // Uint32Array treated as float array for rendering purposes
      this._uploadFloatArray(name, value);
      return;
    }

    if (Array.isArray(value)) {
      this._uploadNumberArray(name, value);
    }
  }

  /**
   * Uploads a Float32Array uniform
   * @internal
   */
  private _uploadFloat32Array(name: string, value: Float32Array): void {
    const program = this._program;
    const len = value.length;

    switch (len) {
      case 1:
        program.setUniform1fv(name, value);
        break;
      case 2:
        program.setUniform2fv(name, value);
        break;
      case 3:
        program.setUniform3fv(name, value);
        break;
      case 4:
        program.setUniform4fv(name, value);
        break;
      case 9:
        program.setUniformMatrix3fv(name, value);
        break;
      case 16:
        program.setUniformMatrix4fv(name, value);
        break;
      default:
        // For vec4 arrays (length divisible by 4), use setUniform4fv
        if (len > 0 && len % 4 === 0) {
          program.setUniform4fv(name, value);
        }
        break;
    }
  }

  /**
   * Uploads an Int32Array uniform
   * @internal
   */
  private _uploadInt32Array(name: string, value: Int32Array): void {
    const program = this._program;
    const len = value.length;

    switch (len) {
      case 1:
        program.setUniform1iv(name, value);
        break;
      case 2:
        program.setUniform2iv(name, value);
        break;
      case 3:
        program.setUniform3iv(name, value);
        break;
      case 4:
        program.setUniform4iv(name, value);
        break;
      default:
        // For ivec4 arrays (length divisible by 4), use setUniform4iv
        if (len > 0 && len % 4 === 0) {
          program.setUniform4iv(name, value);
        }
        break;
    }
  }

  /**
   * Uploads a Uint32Array or similar as float array
   * @internal
   */
  private _uploadFloatArray(name: string, value: Uint32Array | Float32Array): void {
    const program = this._program;
    const len = value.length;

    switch (len) {
      case 1:
        program.setUniform1fv(name, value as Float32Array);
        break;
      case 2:
        program.setUniform2fv(name, value as Float32Array);
        break;
      case 3:
        program.setUniform3fv(name, value as Float32Array);
        break;
      case 4:
        program.setUniform4fv(name, value as Float32Array);
        break;
      default:
        // For vec4 arrays (length divisible by 4), use setUniform4fv
        if (len > 0 && len % 4 === 0) {
          program.setUniform4fv(name, value as Float32Array);
        }
        break;
    }
  }

  /**
   * Uploads a number[] uniform
   * @internal
   */
  private _uploadNumberArray(name: string, value: number[]): void {
    const program = this._program;
    const len = value.length;

    switch (len) {
      case 1:
        program.setUniform1f(name, value[0]!);
        break;
      case 2:
        program.setUniform2f(name, value[0]!, value[1]!);
        break;
      case 3:
        program.setUniform3f(name, value[0]!, value[1]!, value[2]!);
        break;
      case 4:
        program.setUniform4f(name, value[0]!, value[1]!, value[2]!, value[3]!);
        break;
      case 9:
        program.setUniformMatrix3fv(name, value);
        break;
      case 16:
        program.setUniformMatrix4fv(name, value);
        break;
      default:
        // For vec4 arrays (length divisible by 4), use setUniform4fv
        if (len > 0 && len % 4 === 0) {
          program.setUniform4fv(name, value);
        }
        break;
    }
  }

  /**
   * Called before rendering to allow subclasses to update uniforms
   *
   * Override this in subclasses to set material-specific uniforms.
   *
   * **Phase 4 Lighting Integration:**
   * When lit materials (LambertMaterial, PhongMaterial) are implemented,
   * this method signature will be extended to accept a RenderContext:
   *
   * ```typescript
   * interface RenderContext {
   *   lights?: Light[];
   *   camera?: Camera;
   *   time?: number;
   * }
   *
   * protected _updateUniforms(context?: RenderContext): void
   * ```
   *
   * Lit materials will extract light data from the context and upload
   * light uniforms (position, color, intensity) to the shader.
   * BasicMaterial will continue to ignore the context parameter.
   *
   * @internal
   */
  protected _updateUniforms(): void {
    // Override in subclasses
    // Phase 4: Will accept optional RenderContext for lighting
  }

  /**
   * Cleans up resources
   *
   * Note: This does NOT dispose the program, as programs may be shared.
   * Call program.dispose() separately if needed.
   */
  dispose(): void {
    if (this._disposed) {
      return;
    }
    this._uniforms.clear();
    this._disposed = true;
  }

  // ===========================================================================
  // Validation Helpers
  // ===========================================================================

  /**
   * Validates that a value is a finite number
   * @internal
   */
  protected _validateFinite(
    value: number,
    methodName: string,
    label: string,
  ): void {
    validate.number.finite(value, {
      code: ErrorCode.RES_INVALID_ARG,
      resource: this._resourceName,
      method: methodName,
    }, label);
  }

  /**
   * Validates that a value is a non-negative integer
   * @internal
   */
  protected _validateNonNegativeInt(
    value: number,
    methodName: string,
    label: string,
  ): void {
    validate.number.nonNegativeInt(value, {
      code: ErrorCode.RES_INVALID_ARG,
      resource: this._resourceName,
      method: methodName,
    }, label);
  }

  /**
   * Validates that a value is a positive integer (> 0)
   * @internal
   */
  protected _validatePositiveInt(
    value: number,
    methodName: string,
    label: string,
  ): void {
    validate.number.positiveInt(value, {
      code: ErrorCode.RES_INVALID_ARG,
      resource: this._resourceName,
      method: methodName,
    }, label);
  }
}
