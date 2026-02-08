import { GLSLType } from './GLSLType';
import { Shader } from './Shader';

/**
 * Information about a declared attribute variable
 *
 * Attributes are per-vertex inputs to the vertex shader. Each vertex in
 * a draw call has its own attribute values, typically sourced from a
 * VertexBuffer.
 *
 * Common attributes:
 * - `aPosition` (vec3): Vertex position in object space
 * - `aNormal` (vec3): Vertex normal for lighting
 * - `aTexCoord` (vec2): Texture coordinates (UVs)
 * - `aColor` (vec4): Per-vertex color
 * - `aTangent` (vec3): Tangent vector for normal mapping
 */
export interface AttributeInfo {
  /** The attribute's name as it appears in GLSL (e.g., 'aPosition') */
  name: string;
  /** The GLSL data type */
  type: GLSLType;
}

/**
 * VertexShader - Definition of a vertex shader
 *
 * A VertexShader represents the GLSL code and metadata for a vertex shader.
 * It processes each vertex in the geometry, transforming positions and
 * computing values to pass to the fragment shader.
 *
 * **Vertex Shader Responsibilities:**
 * - Transform vertex positions (object → clip space)
 * - Pass data to fragment shader via varyings
 * - Per-vertex lighting calculations (Gouraud shading)
 * - Skeletal animation, morphing, displacement
 *
 * **Inputs:**
 * - Attributes: Per-vertex data (position, normal, UV, etc.)
 * - Uniforms: Constant data (matrices, time, etc.)
 *
 * **Outputs:**
 * - `gl_Position`: Required clip-space position (vec4)
 * - Varyings: Data passed to fragment shader
 *
 * **Usage:**
 * ```typescript
 * const vertexShader = new VertexShader(`#version 300 es
 *   in vec3 aPosition;
 *   in vec3 aNormal;
 *
 *   uniform mat4 uModelViewProjection;
 *   uniform mat3 uNormalMatrix;
 *
 *   out vec3 vNormal;
 *
 *   void main() {
 *     gl_Position = uModelViewProjection * vec4(aPosition, 1.0);
 *     vNormal = uNormalMatrix * aNormal;
 *   }
 * `)
 *   .declareAttribute('aPosition', GLSLType.Vec3)
 *   .declareAttribute('aNormal', GLSLType.Vec3)
 *   .declareUniform('uModelViewProjection', GLSLType.Mat4)
 *   .declareUniform('uNormalMatrix', GLSLType.Mat3)
 *   .declareVarying('vNormal', GLSLType.Vec3);
 * ```
 *
 * **Pipeline Position:**
 * ```
 * Vertex Data → [VertexShader] → Primitive Assembly → Rasterization → FragmentShader
 *     ↑              ↓
 * Attributes    gl_Position + Varyings
 * ```
 *
 * @see FragmentShader for the next stage in the pipeline
 * @see Program for combining vertex and fragment shaders
 * @see Shader for common shader functionality
 */
export class VertexShader extends Shader {
  /**
   * Declared attribute variables
   *
   * Attributes are per-vertex inputs sourced from VertexBuffers.
   * The Program uses these declarations to set up vertex array
   * attribute pointers.
   *
   * @internal Use `attributes` getter for read-only access
   */
  private _attributes: Map<string, AttributeInfo> = new Map();

  /**
   * Creates a new VertexShader definition
   *
   * @param source - GLSL vertex shader source code
   *
   * The source should be valid GLSL 300 es (WebGL 2) and include:
   * - `#version 300 es` directive
   * - Input attributes declared with `in`
   * - Output varyings declared with `out`
   * - A `main()` function that sets `gl_Position`
   *
   * @example
   * ```typescript
   * const shader = new VertexShader(`#version 300 es
   *   in vec3 aPosition;
   *   uniform mat4 uMVP;
   *
   *   void main() {
   *     gl_Position = uMVP * vec4(aPosition, 1.0);
   *   }
   * `);
   * ```
   */
  constructor(source: string) {
    super(source);
  }

  /**
   * Declares an attribute variable used by this vertex shader
   *
   * Attributes are per-vertex inputs. Each attribute must correspond to
   * a VertexBuffer that provides the data. Common attributes:
   *
   * | Name | Type | Description |
   * |------|------|-------------|
   * | aPosition | vec3 | Vertex position |
   * | aNormal | vec3 | Surface normal |
   * | aTexCoord | vec2 | Texture coordinates |
   * | aColor | vec4 | Per-vertex color |
   * | aTangent | vec3 | Tangent for normal maps |
   *
   * @param name - Attribute name as it appears in GLSL (e.g., 'aPosition')
   * @param type - The GLSL data type
   * @returns this for method chaining
   *
   * @example
   * ```typescript
   * vertexShader
   *   .declareAttribute('aPosition', GLSLType.Vec3)
   *   .declareAttribute('aNormal', GLSLType.Vec3)
   *   .declareAttribute('aTexCoord', GLSLType.Vec2);
   * ```
   */
  declareAttribute(name: string, type: GLSLType): this {
    this._attributes.set(name, { name, type });
    return this;
  }

  /**
   * Gets all declared attributes
   *
   * Returns a read-only view of the attributes map. Use this to inspect
   * what vertex data the shader expects.
   *
   * @returns Read-only map of attribute name to AttributeInfo
   *
   * @example
   * ```typescript
   * for (const [name, info] of vertexShader.attributes) {
   *   console.log(`Attribute: ${name} (${info.type})`);
   * }
   * ```
   */
  get attributes(): ReadonlyMap<string, AttributeInfo> {
    return this._attributes;
  }

  /**
   * Checks if a specific attribute is declared
   *
   * @param name - Attribute name to check
   * @returns true if the attribute is declared
   */
  hasAttribute(name: string): boolean {
    return this._attributes.has(name);
  }

  /**
   * Gets the type of a declared attribute
   *
   * @param name - Attribute name
   * @returns The GLSLType or undefined if not declared
   */
  getAttributeType(name: string): GLSLType | undefined {
    return this._attributes.get(name)?.type;
  }

  // ===========================================================================
  // Phase 4+ Methods (Stubs for Future Implementation)
  // ===========================================================================

  // ---------------------------------------------------------------------------
  // Auto-Parsing (Phase 4+)
  // ---------------------------------------------------------------------------
  //
  // static parse(source: string): VertexShader {
  //   // Parses a vertex shader from source, auto-detecting declarations
  //   // Returns a new VertexShader with uniforms, attributes, and varyings
  //   // automatically populated from the source
  //   //
  //   // 1. Create shader
  //   // 2. Parse attributes: /in\s+(\w+)\s+(\w+)\s*;/g
  //   // 3. Parse uniforms: /uniform\s+(\w+)\s+(\w+)\s*;/g
  //   // 4. Parse varyings (out): /out\s+(\w+)\s+(\w+)\s*;/g
  //   //
  //   // Example:
  //   //   const shader = VertexShader.parse(source);
  //   //   console.log(shader.attributes); // Auto-populated!
  //   //   console.log(shader.uniforms);   // Auto-populated!
  // }
  // ---------------------------------------------------------------------------
}