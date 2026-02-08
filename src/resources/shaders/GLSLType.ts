/**
 * GLSLType - Enumeration of GLSL data types
 *
 * This enum represents all GLSL data types that can be used for uniforms,
 * attributes, and varyings in shaders. The string values match GLSL syntax
 * exactly, making them useful for:
 *
 * - **Declaration**: Specifying what a shader expects
 * - **Validation**: Checking compatibility between vertex/fragment shaders
 * - **Debugging**: Displaying type information to users
 * - **Routing**: Selecting the correct `setUniform*` method in Program
 *
 * **Usage:**
 * ```typescript
 * vertexShader.declareAttribute('aPosition', GLSLType.Vec3);
 * vertexShader.declareUniform('uModelMatrix', GLSLType.Mat4);
 * fragmentShader.declareUniform('uTexture', GLSLType.Sampler2D);
 * ```
 *
 * **Type Categories:**
 * - Scalars: float, int, uint, bool
 * - Vectors: vec2-4, ivec2-4, uvec2-4, bvec2-4
 * - Matrices: mat2-4, mat2x3, mat2x4, mat3x2, mat3x4, mat4x2, mat4x3
 * - Samplers: sampler2D, samplerCube, sampler3D, sampler2DArray, etc.
 *
 * @see VertexShader for declaring vertex shader inputs/outputs
 * @see FragmentShader for declaring fragment shader inputs/outputs
 * @see Program for how types are used during uniform setting
 */
export enum GLSLType {
  // ==========================================================================
  // Scalar Types
  // ==========================================================================

  /**
   * 32-bit floating point scalar
   *
   * GLSL: `float`
   * JavaScript: `number`
   * WebGL: `uniform1f`
   */
  Float = 'float',

  /**
   * 32-bit signed integer scalar
   *
   * GLSL: `int`
   * JavaScript: `number` (integer)
   * WebGL: `uniform1i`
   *
   * Also used for sampler uniforms (texture unit index).
   */
  Int = 'int',

  /**
   * 32-bit unsigned integer scalar (WebGL 2)
   *
   * GLSL: `uint`
   * JavaScript: `number` (non-negative integer)
   * WebGL: `uniform1ui`
   */
  UInt = 'uint',

  /**
   * Boolean scalar
   *
   * GLSL: `bool`
   * JavaScript: `boolean` or `number` (0/1)
   * WebGL: `uniform1i` (0 = false, non-zero = true)
   */
  Bool = 'bool',

  // ==========================================================================
  // Float Vector Types
  // ==========================================================================

  /**
   * 2-component float vector
   *
   * GLSL: `vec2`
   * JavaScript: `[number, number]` or `Vector2`
   * WebGL: `uniform2f` or `uniform2fv`
   *
   * Common uses: 2D positions, texture coordinates, screen resolution
   */
  Vec2 = 'vec2',

  /**
   * 3-component float vector
   *
   * GLSL: `vec3`
   * JavaScript: `[number, number, number]` or `Vector3`
   * WebGL: `uniform3f` or `uniform3fv`
   *
   * Common uses: 3D positions, RGB colors, normals, directions
   */
  Vec3 = 'vec3',

  /**
   * 4-component float vector
   *
   * GLSL: `vec4`
   * JavaScript: `[number, number, number, number]` or `Vector4`
   * WebGL: `uniform4f` or `uniform4fv`
   *
   * Common uses: RGBA colors, homogeneous coordinates, quaternions
   */
  Vec4 = 'vec4',

  // ==========================================================================
  // Integer Vector Types
  // ==========================================================================

  /**
   * 2-component signed integer vector
   *
   * GLSL: `ivec2`
   * JavaScript: `[number, number]` (integers)
   * WebGL: `uniform2i` or `uniform2iv`
   */
  IVec2 = 'ivec2',

  /**
   * 3-component signed integer vector
   *
   * GLSL: `ivec3`
   * JavaScript: `[number, number, number]` (integers)
   * WebGL: `uniform3i` or `uniform3iv`
   */
  IVec3 = 'ivec3',

  /**
   * 4-component signed integer vector
   *
   * GLSL: `ivec4`
   * JavaScript: `[number, number, number, number]` (integers)
   * WebGL: `uniform4i` or `uniform4iv`
   */
  IVec4 = 'ivec4',

  // ==========================================================================
  // Unsigned Integer Vector Types (WebGL 2)
  // ==========================================================================

  /**
   * 2-component unsigned integer vector
   *
   * GLSL: `uvec2`
   * JavaScript: `[number, number]` (non-negative integers)
   * WebGL: `uniform2ui` or `uniform2uiv`
   */
  UVec2 = 'uvec2',

  /**
   * 3-component unsigned integer vector
   *
   * GLSL: `uvec3`
   * JavaScript: `[number, number, number]` (non-negative integers)
   * WebGL: `uniform3ui` or `uniform3uiv`
   */
  UVec3 = 'uvec3',

  /**
   * 4-component unsigned integer vector
   *
   * GLSL: `uvec4`
   * JavaScript: `[number, number, number, number]` (non-negative integers)
   * WebGL: `uniform4ui` or `uniform4uiv`
   */
  UVec4 = 'uvec4',

  // ==========================================================================
  // Boolean Vector Types
  // ==========================================================================

  /**
   * 2-component boolean vector
   *
   * GLSL: `bvec2`
   * JavaScript: `[boolean, boolean]` or `[number, number]`
   * WebGL: No direct upload; typically not used as uniforms
   */
  BVec2 = 'bvec2',

  /**
   * 3-component boolean vector
   *
   * GLSL: `bvec3`
   * JavaScript: `[boolean, boolean, boolean]`
   * WebGL: No direct upload; typically not used as uniforms
   */
  BVec3 = 'bvec3',

  /**
   * 4-component boolean vector
   *
   * GLSL: `bvec4`
   * JavaScript: `[boolean, boolean, boolean, boolean]`
   * WebGL: No direct upload; typically not used as uniforms
   */
  BVec4 = 'bvec4',

  // ==========================================================================
  // Square Matrix Types
  // ==========================================================================

  /**
   * 2x2 float matrix (2 columns, 2 rows)
   *
   * GLSL: `mat2`
   * JavaScript: `Float32Array(4)` or `Matrix2` (column-major)
   * WebGL: `uniformMatrix2fv`
   *
   * Memory layout (column-major): [col0_row0, col0_row1, col1_row0, col1_row1]
   */
  Mat2 = 'mat2',

  /**
   * 3x3 float matrix (3 columns, 3 rows)
   *
   * GLSL: `mat3`
   * JavaScript: `Float32Array(9)` or `Matrix3` (column-major)
   * WebGL: `uniformMatrix3fv`
   *
   * Common uses: Normal matrix (inverse transpose of model-view)
   */
  Mat3 = 'mat3',

  /**
   * 4x4 float matrix (4 columns, 4 rows)
   *
   * GLSL: `mat4`
   * JavaScript: `Float32Array(16)` or `Matrix4` (column-major)
   * WebGL: `uniformMatrix4fv`
   *
   * Common uses: Model, view, projection, MVP matrices
   */
  Mat4 = 'mat4',

  // ==========================================================================
  // Non-Square Matrix Types (WebGL 2)
  // ==========================================================================

  /**
   * 2x3 float matrix (2 columns, 3 rows)
   *
   * GLSL: `mat2x3`
   * JavaScript: `Float32Array(6)` (column-major)
   * WebGL: `uniformMatrix2x3fv`
   */
  Mat2x3 = 'mat2x3',

  /**
   * 2x4 float matrix (2 columns, 4 rows)
   *
   * GLSL: `mat2x4`
   * JavaScript: `Float32Array(8)` (column-major)
   * WebGL: `uniformMatrix2x4fv`
   */
  Mat2x4 = 'mat2x4',

  /**
   * 3x2 float matrix (3 columns, 2 rows)
   *
   * GLSL: `mat3x2`
   * JavaScript: `Float32Array(6)` (column-major)
   * WebGL: `uniformMatrix3x2fv`
   */
  Mat3x2 = 'mat3x2',

  /**
   * 3x4 float matrix (3 columns, 4 rows)
   *
   * GLSL: `mat3x4`
   * JavaScript: `Float32Array(12)` (column-major)
   * WebGL: `uniformMatrix3x4fv`
   */
  Mat3x4 = 'mat3x4',

  /**
   * 4x2 float matrix (4 columns, 2 rows)
   *
   * GLSL: `mat4x2`
   * JavaScript: `Float32Array(8)` (column-major)
   * WebGL: `uniformMatrix4x2fv`
   */
  Mat4x2 = 'mat4x2',

  /**
   * 4x3 float matrix (4 columns, 3 rows)
   *
   * GLSL: `mat4x3`
   * JavaScript: `Float32Array(12)` (column-major)
   * WebGL: `uniformMatrix4x3fv`
   */
  Mat4x3 = 'mat4x3',

  // ==========================================================================
  // Sampler Types (Textures)
  // ==========================================================================

  /**
   * 2D texture sampler
   *
   * GLSL: `sampler2D`
   * JavaScript: `number` (texture unit index, e.g., 0-15)
   * WebGL: `uniform1i`
   *
   * Most common texture type. Used with `texture()` in shaders.
   */
  Sampler2D = 'sampler2D',

  /**
   * Cube map texture sampler
   *
   * GLSL: `samplerCube`
   * JavaScript: `number` (texture unit index)
   * WebGL: `uniform1i`
   *
   * Used for environment maps, skyboxes, reflections.
   */
  SamplerCube = 'samplerCube',

  /**
   * 3D texture sampler (WebGL 2)
   *
   * GLSL: `sampler3D`
   * JavaScript: `number` (texture unit index)
   * WebGL: `uniform1i`
   *
   * Used for volume rendering, 3D lookup tables.
   */
  Sampler3D = 'sampler3D',

  /**
   * 2D texture array sampler (WebGL 2)
   *
   * GLSL: `sampler2DArray`
   * JavaScript: `number` (texture unit index)
   * WebGL: `uniform1i`
   *
   * Array of 2D textures, indexed by layer in shader.
   */
  Sampler2DArray = 'sampler2DArray',

  /**
   * 2D shadow texture sampler
   *
   * GLSL: `sampler2DShadow`
   * JavaScript: `number` (texture unit index)
   * WebGL: `uniform1i`
   *
   * Used for shadow mapping with depth comparison.
   */
  Sampler2DShadow = 'sampler2DShadow',

  /**
   * Cube shadow texture sampler
   *
   * GLSL: `samplerCubeShadow`
   * JavaScript: `number` (texture unit index)
   * WebGL: `uniform1i`
   *
   * Used for omnidirectional shadow mapping.
   */
  SamplerCubeShadow = 'samplerCubeShadow',

  /**
   * 2D array shadow texture sampler (WebGL 2)
   *
   * GLSL: `sampler2DArrayShadow`
   * JavaScript: `number` (texture unit index)
   * WebGL: `uniform1i`
   *
   * Used for cascaded shadow maps.
   */
  Sampler2DArrayShadow = 'sampler2DArrayShadow',

  // ==========================================================================
  // Integer Sampler Types (WebGL 2)
  // ==========================================================================

  /**
   * 2D integer texture sampler
   *
   * GLSL: `isampler2D`
   * JavaScript: `number` (texture unit index)
   * WebGL: `uniform1i`
   *
   * Samples integer textures (returns ivec4).
   */
  ISampler2D = 'isampler2D',

  /**
   * 3D integer texture sampler
   *
   * GLSL: `isampler3D`
   * JavaScript: `number` (texture unit index)
   * WebGL: `uniform1i`
   */
  ISampler3D = 'isampler3D',

  /**
   * Cube integer texture sampler
   *
   * GLSL: `isamplerCube`
   * JavaScript: `number` (texture unit index)
   * WebGL: `uniform1i`
   */
  ISamplerCube = 'isamplerCube',

  /**
   * 2D array integer texture sampler
   *
   * GLSL: `isampler2DArray`
   * JavaScript: `number` (texture unit index)
   * WebGL: `uniform1i`
   */
  ISampler2DArray = 'isampler2DArray',

  // ==========================================================================
  // Unsigned Integer Sampler Types (WebGL 2)
  // ==========================================================================

  /**
   * 2D unsigned integer texture sampler
   *
   * GLSL: `usampler2D`
   * JavaScript: `number` (texture unit index)
   * WebGL: `uniform1i`
   *
   * Samples unsigned integer textures (returns uvec4).
   */
  USampler2D = 'usampler2D',

  /**
   * 3D unsigned integer texture sampler
   *
   * GLSL: `usampler3D`
   * JavaScript: `number` (texture unit index)
   * WebGL: `uniform1i`
   */
  USampler3D = 'usampler3D',

  /**
   * Cube unsigned integer texture sampler
   *
   * GLSL: `usamplerCube`
   * JavaScript: `number` (texture unit index)
   * WebGL: `uniform1i`
   */
  USamplerCube = 'usamplerCube',

  /**
   * 2D array unsigned integer texture sampler
   *
   * GLSL: `usampler2DArray`
   * JavaScript: `number` (texture unit index)
   * WebGL: `uniform1i`
   */
  USampler2DArray = 'usampler2DArray',
}

/**
 * Helper to check if a GLSLType is a sampler type
 *
 * Samplers require special handling - they're set as integers (texture unit index)
 * rather than the actual texture data.
 *
 * @param type - The GLSLType to check
 * @returns true if the type is any sampler variant
 */
export function isSamplerType(type: GLSLType): boolean {
  return type.toLowerCase().includes('sampler');
}

/**
 * Helper to check if a GLSLType is a matrix type
 *
 * Matrices require `uniformMatrix*fv` methods and column-major data.
 *
 * @param type - The GLSLType to check
 * @returns true if the type is any matrix variant
 */
export function isMatrixType(type: GLSLType): boolean {
  return type.startsWith('mat');
}

/**
 * Helper to check if a GLSLType is a vector type
 *
 * @param type - The GLSLType to check
 * @returns true if the type is any vector variant (vec, ivec, uvec, bvec)
 */
export function isVectorType(type: GLSLType): boolean {
  return type.includes('vec');
}

/**
 * Helper to get the component count for a vector or matrix type
 *
 * @param type - The GLSLType to check
 * @returns Number of components (e.g., vec3 → 3, mat4 → 16)
 */
export function getComponentCount(type: GLSLType): number {
  switch (type) {
    // Scalars
    case GLSLType.Float:
    case GLSLType.Int:
    case GLSLType.UInt:
    case GLSLType.Bool:
      return 1;

    // 2-component vectors
    case GLSLType.Vec2:
    case GLSLType.IVec2:
    case GLSLType.UVec2:
    case GLSLType.BVec2:
      return 2;

    // 3-component vectors
    case GLSLType.Vec3:
    case GLSLType.IVec3:
    case GLSLType.UVec3:
    case GLSLType.BVec3:
      return 3;

    // 4-component vectors
    case GLSLType.Vec4:
    case GLSLType.IVec4:
    case GLSLType.UVec4:
    case GLSLType.BVec4:
      return 4;

    // Square matrices
    case GLSLType.Mat2:
      return 4;
    case GLSLType.Mat3:
      return 9;
    case GLSLType.Mat4:
      return 16;

    // Non-square matrices
    case GLSLType.Mat2x3:
    case GLSLType.Mat3x2:
      return 6;
    case GLSLType.Mat2x4:
    case GLSLType.Mat4x2:
      return 8;
    case GLSLType.Mat3x4:
    case GLSLType.Mat4x3:
      return 12;

    // Samplers (not applicable, but return 1 for texture unit)
    default:
      return 1;
  }
}
