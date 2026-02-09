import { GLSLType } from './GLSLType';
import { ErrorCode } from '../../errors/ErrorCodes.js';
import { validate } from '../../utils/validate.js';

/**
 * Information about a declared uniform variable
 *
 * Uniforms are global variables in shaders that remain constant for all
 * vertices/fragments in a single draw call. They're set from JavaScript
 * before rendering.
 */
export interface UniformInfo {
  /** The uniform's name as it appears in GLSL (e.g., 'uModelMatrix') */
  name: string;
  /** The GLSL data type */
  type: GLSLType;
}

/**
 * Information about a declared varying variable
 *
 * Varyings are variables that pass data from vertex shader to fragment shader.
 * The vertex shader writes them (outputs), and the fragment shader reads them
 * (inputs). Values are automatically interpolated across the primitive.
 *
 * In GLSL 300 es (WebGL 2), these are declared with `out` in vertex shaders
 * and `in` in fragment shaders (not the `varying` keyword from GLSL 100).
 */
export interface VaryingInfo {
  /** The varying's name as it appears in GLSL (e.g., 'vNormal') */
  name: string;
  /** The GLSL data type */
  type: GLSLType;
}

/**
 * Shader - Abstract base class for shader definitions
 *
 * Shader provides common functionality for both VertexShader and
 * FragmentShader. It holds the GLSL source code and manages declarations
 * of uniforms and varyings that the shader uses.
 *
 * **Purpose:**
 * A shader definition is separate from the compiled Program. The shader
 * describes *what* the GPU code does and *what it expects* (uniforms,
 * attributes, varyings). The Program is the *compiled* artifact on the GPU.
 *
 * **Phase 1 (Manual Declaration):**
 * Users manually declare what uniforms and varyings the shader uses:
 * ```typescript
 * const shader = new VertexShader(source)
 *   .declareUniform('uModelMatrix', GLSLType.Mat4)
 *   .declareUniform('uViewMatrix', GLSLType.Mat4)
 *   .declareVarying('vNormal', GLSLType.Vec3);
 * ```
 *
 * **Phase 4+ (Auto-Parsing):**
 * The library will parse GLSL source to automatically extract declarations:
 * ```typescript
 * // Future API
 * const shader = VertexShader.parse(source);
 * console.log(shader.uniforms); // Auto-populated from source
 * ```
 *
 * **Design Rationale:**
 * - **Separation of concerns**: Shader = definition, Program = compiled
 * - **Introspection**: Know what a shader expects before runtime errors
 * - **Compatibility checking**: Verify vertex/fragment varyings match
 * - **Future-proof**: Supports caching, validation, hot-reload
 *
 * @see VertexShader for vertex-specific functionality (attributes)
 * @see FragmentShader for fragment-specific functionality (outputs)
 * @see Program for the compiled GPU resource
 */
export abstract class Shader {
  /**
   * The GLSL source code for this shader
   *
   * This should be valid GLSL 300 es code (WebGL 2). The source is stored
   * as-is and passed to Program for compilation.
   *
   * @example
   * ```glsl
   * #version 300 es
   * precision highp float;
   *
   * in vec3 aPosition;
   * uniform mat4 uMVP;
   *
   * void main() {
   *   gl_Position = uMVP * vec4(aPosition, 1.0);
   * }
   * ```
   */
  readonly source: string;

  /**
   * Declared uniform variables
   *
   * Maps uniform name to its type information. Uniforms can be declared
   * in both vertex and fragment shaders - the Program will query locations
   * for all of them.
   *
   * @internal Use `uniforms` getter for read-only access
   */
  protected _uniforms: Map<string, UniformInfo> = new Map();

  /**
   * Declared varying variables
   *
   * For VertexShader: These are outputs (`out` variables)
   * For FragmentShader: These are inputs (`in` variables)
   *
   * The names and types must match between vertex and fragment shaders
   * for the Program to link successfully.
   *
   * @internal Use `varyings` getter for read-only access
   */
  protected _varyings: Map<string, VaryingInfo> = new Map();

  /**
   * Creates a new shader definition
   *
   * @param source - GLSL source code (should be valid GLSL 300 es)
   *
   * @example
   * ```typescript
   * const vertexSource = `#version 300 es
   *   in vec3 aPosition;
   *   uniform mat4 uMVP;
   *   void main() {
   *     gl_Position = uMVP * vec4(aPosition, 1.0);
   *   }
   * `;
   * const shader = new VertexShader(vertexSource);
   * ```
   */
  constructor(source: string) {
    this.source = source;
  }

  /**
   * Declares a uniform variable used by this shader
   *
   * Call this to register uniforms that the shader expects. This information
   * is used by Program to:
   * - Query uniform locations at link time
   * - Validate that required uniforms are set before rendering
   * - Provide introspection for debugging and tooling
   *
   * @param name - Uniform name as it appears in GLSL (e.g., 'uModelMatrix')
   * @param type - The GLSL data type
   * @returns this for method chaining
   *
   * @example
   * ```typescript
   * vertexShader
   *   .declareUniform('uModelMatrix', GLSLType.Mat4)
   *   .declareUniform('uColor', GLSLType.Vec4)
   *   .declareUniform('uTexture', GLSLType.Sampler2D);
   * ```
   */
  declareUniform(name: string, type: GLSLType): this {
    this._uniforms.set(name, { name, type });
    return this;
  }

  /**
   * Declares a varying variable
   *
   * For VertexShader: Declares an output variable (`out`)
   * For FragmentShader: Declares an input variable (`in`)
   *
   * Varyings must match between vertex and fragment shaders - same name
   * and same type. The Program can validate this at link time.
   *
   * @param name - Varying name as it appears in GLSL (e.g., 'vNormal')
   * @param type - The GLSL data type
   * @returns this for method chaining
   *
   * @example
   * ```typescript
   * // In vertex shader (outputs)
   * vertexShader
   *   .declareVarying('vPosition', GLSLType.Vec3)
   *   .declareVarying('vNormal', GLSLType.Vec3)
   *   .declareVarying('vTexCoord', GLSLType.Vec2);
   *
   * // In fragment shader (inputs - must match!)
   * fragmentShader
   *   .declareVarying('vPosition', GLSLType.Vec3)
   *   .declareVarying('vNormal', GLSLType.Vec3)
   *   .declareVarying('vTexCoord', GLSLType.Vec2);
   * ```
   */
  declareVarying(name: string, type: GLSLType): this {
    this._varyings.set(name, { name, type });
    return this;
  }

  /**
   * Gets all declared uniforms
   *
   * Returns a read-only view of the uniforms map. Use this to inspect
   * what uniforms a shader expects.
   *
   * @returns Read-only map of uniform name to UniformInfo
   *
   * @example
   * ```typescript
   * for (const [name, info] of shader.uniforms) {
   *   console.log(`Uniform: ${name} (${info.type})`);
   * }
   * ```
   */
  get uniforms(): ReadonlyMap<string, UniformInfo> {
    return this._uniforms;
  }

  /**
   * Gets all declared varyings
   *
   * Returns a read-only view of the varyings map. Use this to inspect
   * what varyings a shader declares or expects.
   *
   * @returns Read-only map of varying name to VaryingInfo
   */
  get varyings(): ReadonlyMap<string, VaryingInfo> {
    return this._varyings;
  }

  /**
   * Checks if a specific uniform is declared
   *
   * @param name - Uniform name to check
   * @returns true if the uniform is declared
   */
  hasUniform(name: string): boolean {
    return this._uniforms.has(name);
  }

  /**
   * Checks if a specific varying is declared
   *
   * @param name - Varying name to check
   * @returns true if the varying is declared
   */
  hasVarying(name: string): boolean {
    return this._varyings.has(name);
  }

  /**
   * Gets the type of a declared uniform
   *
   * @param name - Uniform name
   * @returns The GLSLType or undefined if not declared
   */
  getUniformType(name: string): GLSLType | undefined {
    return this._uniforms.get(name)?.type;
  }

  /**
   * Gets the type of a declared varying
   *
   * @param name - Varying name
   * @returns The GLSLType or undefined if not declared
   */
  getVaryingType(name: string): GLSLType | undefined {
    return this._varyings.get(name)?.type;
  }

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
      resource: this.constructor.name,
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
      resource: this.constructor.name,
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
      resource: this.constructor.name,
      method: methodName,
    }, label);
  }

  // ===========================================================================
  // Phase 4+ Methods (Stubs for Future Implementation)
  // ===========================================================================

  // ---------------------------------------------------------------------------
  // Shader Composition / Includes (Phase 4+)
  // ---------------------------------------------------------------------------
  //
  // Implement a ShaderChunks system for reusable GLSL code (Three.js pattern):
  //
  // 1. ShaderChunks registry:
  //    ShaderChunks.register('lighting', LIGHTING_GLSL);
  //    ShaderChunks.register('fog', FOG_GLSL);
  //
  // 2. #include directive support:
  //    const source = `
  //      #include <lighting>
  //      void main() { ... }
  //    `;
  //    const resolved = ShaderChunks.resolve(source);
  //
  // 3. Common chunks to implement:
  //    - lighting (diffuse, specular calculations)
  //    - fog (linear, exponential)
  //    - normals (normal mapping, TBN matrix)
  //    - skinning (bone transforms)
  //    - shadows (shadow mapping)
  //
  // Implementation location: src/resources/shaders/ShaderChunks.ts
  // See: Three.js ShaderChunk pattern for reference
  // ---------------------------------------------------------------------------

  // ---------------------------------------------------------------------------
  // Auto-Parsing Methods (Phase 4+)
  // ---------------------------------------------------------------------------
  //
  // protected _parseUniforms(): void {
  //   // Parse uniform declarations from source
  //   // Regex pattern: /uniform\s+(\w+)\s+(\w+)\s*;/g
  //   // Match groups: [1] = type, [2] = name
  //   // Will parse lines like:
  //   // - `uniform mat4 uModelMatrix;`
  //   // - `uniform vec4 uColor;`
  //   // - `uniform sampler2D uTexture;`
  //   // And automatically populate the _uniforms map.
  // }
  //
  // protected _parseVaryings(): void {
  //   // Parse varying declarations from source
  //   // For vertex: /out\s+(\w+)\s+(\w+)\s*;/g
  //   // For fragment: /in\s+(\w+)\s+(\w+)\s*;/g
  //   // Will parse lines like:
  //   // - `out vec3 vNormal;` (vertex shader)
  //   // - `in vec3 vNormal;` (fragment shader)
  //   // And automatically populate the _varyings map.
  // }
  // ---------------------------------------------------------------------------
}
