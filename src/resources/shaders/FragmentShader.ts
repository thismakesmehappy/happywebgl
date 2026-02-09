import { GLSLType } from './GLSLType';
import { Shader } from './Shader';
import { AppError } from '../../errors/AppError.js';
import { ErrorCode } from '../../errors/ErrorCodes.js';
import { validate } from '../../utils/validate.js';

/**
 * Information about a fragment shader output
 *
 * Fragment shaders can output to multiple render targets (MRT) in WebGL 2.
 * Each output is written to a specific color attachment of the framebuffer.
 *
 * For simple rendering to the default framebuffer, there's typically just
 * one output for the final fragment color.
 */
export interface OutputInfo {
  /** The output's name as it appears in GLSL (e.g., 'fragColor') */
  name: string;
  /** The GLSL data type (typically vec4 for colors) */
  type: GLSLType;
  /** The color attachment index for MRT (default: 0) */
  location: number;
}

/**
 * FragmentShader - Definition of a fragment shader
 *
 * A FragmentShader represents the GLSL code and metadata for a fragment
 * shader. It computes the final color for each pixel (fragment) covered
 * by the rendered geometry.
 *
 * **Fragment Shader Responsibilities:**
 * - Compute final pixel color
 * - Texture sampling and application
 * - Per-pixel lighting (Phong shading)
 * - Discard fragments (transparency, clipping)
 * - Write to multiple render targets (deferred rendering)
 *
 * **Inputs:**
 * - Varyings: Interpolated data from vertex shader
 * - Uniforms: Constant data (colors, textures, etc.)
 *
 * **Outputs:**
 * - Fragment color(s): Written to framebuffer attachment(s)
 *
 * **Usage:**
 * ```typescript
 * const fragmentShader = new FragmentShader(`#version 300 es
 *   precision highp float;
 *
 *   in vec3 vNormal;
 *
 *   uniform vec3 uLightDir;
 *   uniform vec4 uColor;
 *
 *   out vec4 fragColor;
 *
 *   void main() {
 *     float diffuse = max(dot(normalize(vNormal), uLightDir), 0.0);
 *     fragColor = vec4(uColor.rgb * diffuse, uColor.a);
 *   }
 * `)
 *   .declareVarying('vNormal', GLSLType.Vec3)
 *   .declareUniform('uLightDir', GLSLType.Vec3)
 *   .declareUniform('uColor', GLSLType.Vec4)
 *   .declareOutput('fragColor', GLSLType.Vec4);
 * ```
 *
 * **Pipeline Position:**
 * ```
 * VertexShader → Rasterization → [FragmentShader] → Blending → Framebuffer
 *                     ↓                   ↓
 *              Interpolated Varyings  Fragment Color(s)
 * ```
 *
 * **Precision:**
 * Fragment shaders require explicit precision qualifiers in GLSL 300 es:
 * ```glsl
 * precision highp float;   // High precision (recommended)
 * precision mediump float; // Medium precision (mobile-friendly)
 * ```
 *
 * @see VertexShader for the previous stage in the pipeline
 * @see Program for combining vertex and fragment shaders
 * @see Shader for common shader functionality
 */
export class FragmentShader extends Shader {
  /**
   * Declared output variables
   *
   * Outputs are the final colors written to the framebuffer. Most shaders
   * have a single output (fragColor), but MRT allows multiple outputs.
   *
   * @internal Use `outputs` getter for read-only access
   */
  private _outputs: Map<string, OutputInfo> = new Map();

  /**
   * Creates a new FragmentShader definition
   *
   * @param source - GLSL fragment shader source code
   *
   * The source should be valid GLSL 300 es (WebGL 2) and include:
   * - `#version 300 es` directive
   * - Precision qualifier (`precision highp float;`)
   * - Input varyings declared with `in`
   * - Output(s) declared with `out`
   * - A `main()` function that writes to output(s)
   *
   * @example
   * ```typescript
   * const shader = new FragmentShader(`#version 300 es
   *   precision highp float;
   *
   *   uniform vec4 uColor;
   *   out vec4 fragColor;
   *
   *   void main() {
   *     fragColor = uColor;
   *   }
   * `);
   * ```
   */
  constructor(source: string) {
    super(source);
  }

  /**
   * Declares an output variable
   *
   * Most fragment shaders have a single vec4 output for the final color.
   * For Multiple Render Targets (MRT), you can declare multiple outputs
   * with different location indices.
   *
   * @param name - Output name as it appears in GLSL (e.g., 'fragColor')
   * @param type - The GLSL data type (typically GLSLType.Vec4)
   * @param location - Color attachment index for MRT (default: 0)
   * @returns this for method chaining
   *
   * @example
   * ```typescript
   * // Single output (most common)
   * fragmentShader.declareOutput('fragColor', GLSLType.Vec4);
   *
   * // Multiple Render Targets (deferred rendering)
   * fragmentShader
   *   .declareOutput('gPosition', GLSLType.Vec4, 0)
   *   .declareOutput('gNormal', GLSLType.Vec4, 1)
   *   .declareOutput('gAlbedo', GLSLType.Vec4, 2);
   * ```
   */
  declareOutput(name: string, type: GLSLType, location: number = 0): this {
    const context = {
      code: ErrorCode.RES_INVALID_ARG,
      resource: 'FragmentShader',
      method: 'declareOutput',
    };
    validate.number.nonNegativeInt(location, context, 'location');

    this._outputs.set(name, { name, type, location });
    return this;
  }

  /**
   * Gets all declared outputs
   *
   * Returns a read-only view of the outputs map. Use this to inspect
   * what the fragment shader writes.
   *
   * @returns Read-only map of output name to OutputInfo
   */
  get outputs(): ReadonlyMap<string, OutputInfo> {
    return this._outputs;
  }

  /**
   * Checks if a specific output is declared
   *
   * @param name - Output name to check
   * @returns true if the output is declared
   */
  hasOutput(name: string): boolean {
    return this._outputs.has(name);
  }

  /**
   * Gets info about a declared output
   *
   * @param name - Output name
   * @returns The OutputInfo or undefined if not declared
   */
  getOutput(name: string): OutputInfo | undefined {
    return this._outputs.get(name);
  }

  /**
   * Validates output locations for uniqueness and range
   *
   * @param maxDrawBuffers - Optional upper bound (exclusive). Typically
   *                         gl.getParameter(gl.MAX_DRAW_BUFFERS).
   * @throws AppError if outputs share a location or exceed maxDrawBuffers
   */
  validateOutputs(maxDrawBuffers?: number): void {
    if (maxDrawBuffers !== undefined) {
      const context = {
        code: ErrorCode.RES_INVALID_ARG,
        resource: 'FragmentShader',
        method: 'validateOutputs',
      };
      validate.number.positiveInt(maxDrawBuffers, context, 'maxDrawBuffers');
    }

    const usedLocations = new Map<number, string>();
    for (const [name, info] of this._outputs) {
      if (maxDrawBuffers !== undefined && info.location >= maxDrawBuffers) {
        throw new AppError(ErrorCode.RES_INVALID_ARG, {
          resource: 'FragmentShader',
          method: 'validateOutputs',
          detail:
            `Output '${name}' uses location ${info.location}, ` +
            `but maxDrawBuffers is ${maxDrawBuffers}`,
        });
      }

      const existing = usedLocations.get(info.location);
      if (existing) {
        throw new AppError(ErrorCode.RES_INVALID_ARG, {
          resource: 'FragmentShader',
          method: 'validateOutputs',
          detail:
            `Outputs '${existing}' and '${name}' share location ${info.location}`,
        });
      }
      usedLocations.set(info.location, name);
    }
  }

  // ===========================================================================
  // Phase 4+ Methods (Stubs for Future Implementation)
  // ===========================================================================

  // ---------------------------------------------------------------------------
  // Auto-Parsing (Phase 4+)
  // ---------------------------------------------------------------------------
  //
  // static parse(source: string): FragmentShader {
  //   // Parses a fragment shader from source, auto-detecting declarations
  //   // Returns a new FragmentShader with uniforms, varyings, and outputs
  //   // automatically populated from the source
  //   //
  //   // 1. Create shader
  //   // 2. Parse varyings (in): /in\s+(\w+)\s+(\w+)\s*;/g
  //   // 3. Parse uniforms: /uniform\s+(\w+)\s+(\w+)\s*;/g
  //   // 4. Parse outputs: /out\s+(\w+)\s+(\w+)\s*;/g
  //   //    - Also check for layout(location = N) prefix
  //   //
  //   // Example:
  //   //   const shader = FragmentShader.parse(source);
  //   //   console.log(shader.varyings); // Auto-populated inputs!
  //   //   console.log(shader.uniforms); // Auto-populated!
  //   //   console.log(shader.outputs);  // Auto-populated!
  // }
  // ---------------------------------------------------------------------------
}
