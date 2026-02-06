/**
 * Texture - Abstract base class for WebGL textures (Layer 2 GPU resource)
 *
 * Provides common functionality for all texture types:
 * - Texture2D: Standard 2D textures
 * - TextureCubeMap: Cube map textures (6 faces)
 * - Texture3D: 3D volume textures
 * - Texture2DArray: Array of 2D textures
 *
 * Each texture type has a fixed target that cannot be changed after creation.
 * Use the appropriate subclass for your use case.
 */

import { GLContext } from '../../core/GLContext.js';
import { AppError } from '../../errors/AppError.js';
import { ErrorCode } from '../../errors/ErrorCodes.js';

/**
 * Minification filter modes
 *
 * Controls how texture is sampled when rendered smaller than its native size.
 * Mipmap variants provide better quality for distant/small objects.
 */
export enum TextureMinFilter {
  /** Nearest neighbor - fast, pixelated */
  NEAREST = 0x2600,
  /** Bilinear interpolation - smooth */
  LINEAR = 0x2601,
  /** Nearest from nearest mipmap */
  NEAREST_MIPMAP_NEAREST = 0x2700,
  /** Linear from nearest mipmap */
  LINEAR_MIPMAP_NEAREST = 0x2701,
  /** Nearest from interpolated mipmaps */
  NEAREST_MIPMAP_LINEAR = 0x2702,
  /** Trilinear - highest quality */
  LINEAR_MIPMAP_LINEAR = 0x2703,
}

/**
 * Magnification filter modes
 *
 * Controls how texture is sampled when rendered larger than its native size.
 * Only NEAREST and LINEAR are valid for magnification (no mipmaps).
 */
export enum TextureMagFilter {
  /** Nearest neighbor - fast, pixelated */
  NEAREST = 0x2600,
  /** Bilinear interpolation - smooth */
  LINEAR = 0x2601,
}

/**
 * Texture wrap modes
 *
 * Controls what happens when texture coordinates exceed [0, 1] range.
 */
export enum TextureWrap {
  /** Tile the texture */
  REPEAT = 0x2901,
  /** Clamp to edge pixels */
  CLAMP_TO_EDGE = 0x812f,
  /** Tile with mirroring */
  MIRRORED_REPEAT = 0x8370,
}

/**
 * Common texture parameters supported by all texture types
 */
export interface TextureParameters {
  minFilter?: GLenum;
  magFilter?: GLenum;
  wrapS?: GLenum;
  wrapT?: GLenum;
  compareMode?: GLenum;
  compareFunc?: GLenum;
  baseLevel?: GLint;
  maxLevel?: GLint;
}

export interface TextureMetadata {
  width?: number;
  height?: number;
  depth?: number;
  layers?: number;
  level?: number;
  internalFormat?: GLenum;
  format?: GLenum;
  type?: GLenum;
  mipmapsGenerated?: boolean;
  immutable?: boolean;
  storageLevels?: number;
}

/**
 * Pixel store options for texture data upload
 */
export interface PixelStoreOptions {
  flipY?: boolean;
  premultiplyAlpha?: boolean;
  alignment?: number;
}

/**
 * Common options for uploading image sources
 */
export interface BaseImageOptions extends PixelStoreOptions {
  level?: number;
  internalFormat?: GLenum;
  format?: GLenum;
  type?: GLenum;
}

/**
 * Common options for uploading raw texture data
 */
export interface BaseDataOptions extends PixelStoreOptions {
  level?: number;
  internalFormat?: GLenum;
  format?: GLenum;
  type?: GLenum;
  border?: number;
  generateMipmaps?: boolean;
}

/**
 * Common options for uploading sub-region texture data
 */
export interface BaseSubDataOptions extends PixelStoreOptions {
  level?: number;
  format?: GLenum;
  type?: GLenum;
}

/**
 * Abstract base class for all WebGL texture types
 */
export abstract class Texture {
  protected readonly _ctx: GLContext;
  protected readonly _texture: WebGLTexture;
  protected readonly _target: GLenum;
  protected _disposed: boolean;
  protected _metadata: TextureMetadata;

  /**
   * Creates a new texture
   * @param ctx - The GLContext
   * @param target - The texture target (TEXTURE_2D, TEXTURE_CUBE_MAP, etc.)
   */
  protected constructor(ctx: GLContext, target: GLenum) {
    this._ctx = ctx;
    this._target = target;
    this._disposed = false;
    this._metadata = {};

    this._texture = ctx.createTexture();
    ctx.registerTexture(this._texture);
  }

  /**
   * The underlying WebGL texture object
   * @throws AppError if texture is disposed
   */
  get texture(): WebGLTexture {
    if (this._disposed) {
      throw new AppError(ErrorCode.RES_DISPOSED, { resource: this._resourceName });
    }
    return this._texture;
  }

  /**
   * The texture target (TEXTURE_2D, TEXTURE_CUBE_MAP, etc.)
   */
  get target(): GLenum {
    return this._target;
  }

  /**
   * Whether this texture has been disposed
   */
  get isDisposed(): boolean {
    return this._disposed;
  }

  /**
   * Metadata about the last known allocation/upload for this texture
   */
  get metadata(): TextureMetadata {
    return { ...this._metadata };
  }

  /**
   * The GLContext this texture belongs to
   */
  protected get ctx(): GLContext {
    return this._ctx;
  }

  /**
   * Resource name for error messages (override in subclasses)
   */
  protected get _resourceName(): string {
    return 'Texture';
  }

  /**
   * Binds this texture to the specified texture unit
   * @param unit - Texture unit (0-31)
   * @returns this for method chaining
   */
  bind(unit: number = 0): this {
    if (this._disposed) {
      throw new AppError(ErrorCode.RES_DISPOSED, { resource: this._resourceName });
    }
    this._validateNonNegativeInt(unit, 'bind', 'unit');
    this._ctx.bindTexture(this._target, this._texture, unit);
    return this;
  }

  /**
   * Unbinds this texture from the specified texture unit
   * @param unit - Texture unit (0-31)
   * @returns this for method chaining
   */
  unbind(unit: number = 0): this {
    if (this._disposed) {
      throw new AppError(ErrorCode.RES_DISPOSED, { resource: this._resourceName });
    }
    this._validateNonNegativeInt(unit, 'unbind', 'unit');
    this._ctx.unbindTexture(this._target, unit);
    return this;
  }

  /**
   * Sets a single integer texture parameter
   *
   * **Note:** This affects the currently active texture unit. If you need
   * deterministic behavior, bind this texture to a specific unit first.
   *
   * @example
   * texture.bind(2).setParameteri(gl.TEXTURE_MIN_FILTER, gl.LINEAR);
   *
   * @example
   * texture.bind(2);
   * texture.setParameteri(gl.TEXTURE_MIN_FILTER, gl.LINEAR);
   * @param pname - Parameter name
   * @param param - Parameter value
   * @returns this for method chaining
   */
  setParameteri(pname: GLenum, param: GLint): this {
    if (this._disposed) {
      throw new AppError(ErrorCode.RES_DISPOSED, { resource: this._resourceName });
    }
    this._ctx.texParameteri(this._target, this._texture, pname, param);
    return this;
  }

  /**
   * Sets a single float texture parameter
   *
   * **Note:** This affects the currently active texture unit. If you need
   * deterministic behavior, bind this texture to a specific unit first.
   *
   * @example
   * texture.bind(1).setParameterf(gl.TEXTURE_LOD_BIAS, 0.5);
   *
   * @example
   * texture.bind(1);
   * texture.setParameterf(gl.TEXTURE_LOD_BIAS, 0.5);
   * @param pname - Parameter name
   * @param param - Parameter value
   * @returns this for method chaining
   */
  setParameterf(pname: GLenum, param: GLfloat): this {
    if (this._disposed) {
      throw new AppError(ErrorCode.RES_DISPOSED, { resource: this._resourceName });
    }
    this._ctx.texParameterf(this._target, this._texture, pname, param);
    return this;
  }

  /**
   * Sets multiple texture parameters at once
   *
   * **Note:** This affects the currently active texture unit. If you need
   * deterministic behavior, bind this texture to a specific unit first.
   *
   * @example
   * texture.bind(0).setParameters({ minFilter: gl.LINEAR, wrapS: gl.CLAMP_TO_EDGE });
   *
   * @example
   * texture.bind(0);
   * texture.setParameters({ minFilter: gl.LINEAR, wrapS: gl.CLAMP_TO_EDGE });
   * @param params - Object with parameter values
   * @returns this for method chaining
   */
  setParameters(params: TextureParameters): this {
    if (this._disposed) {
      throw new AppError(ErrorCode.RES_DISPOSED, { resource: this._resourceName });
    }

    const gl = this._ctx.gl;
    if (params.minFilter !== undefined) {
      this._ctx.texParameteri(this._target, this._texture, gl.TEXTURE_MIN_FILTER, params.minFilter);
    }
    if (params.magFilter !== undefined) {
      this._ctx.texParameteri(this._target, this._texture, gl.TEXTURE_MAG_FILTER, params.magFilter);
    }
    if (params.wrapS !== undefined) {
      this._ctx.texParameteri(this._target, this._texture, gl.TEXTURE_WRAP_S, params.wrapS);
    }
    if (params.wrapT !== undefined) {
      this._ctx.texParameteri(this._target, this._texture, gl.TEXTURE_WRAP_T, params.wrapT);
    }
    if (params.compareMode !== undefined) {
      this._ctx.texParameteri(this._target, this._texture, gl.TEXTURE_COMPARE_MODE, params.compareMode);
    }
    if (params.compareFunc !== undefined) {
      this._ctx.texParameteri(this._target, this._texture, gl.TEXTURE_COMPARE_FUNC, params.compareFunc);
    }
    if (params.baseLevel !== undefined) {
      this._ctx.texParameteri(this._target, this._texture, gl.TEXTURE_BASE_LEVEL, params.baseLevel);
    }
    if (params.maxLevel !== undefined) {
      this._ctx.texParameteri(this._target, this._texture, gl.TEXTURE_MAX_LEVEL, params.maxLevel);
    }

    return this;
  }

  /**
   * Sets multiple texture parameters with a single bind/unbind
   *
   * **Note:** This affects the currently active texture unit. If you need
   * deterministic behavior, bind this texture to a specific unit first.
   *
   * @example
   * texture.bind(3).setParametersBound({ wrapS: gl.REPEAT, wrapT: gl.REPEAT });
   *
   * @example
   * texture.bind(3);
   * texture.setParametersBound({ wrapS: gl.REPEAT, wrapT: gl.REPEAT });
   * @param params - Object with parameter values
   * @returns this for method chaining
   */
  setParametersBound(params: TextureParameters): this {
    if (this._disposed) {
      throw new AppError(ErrorCode.RES_DISPOSED, { resource: this._resourceName });
    }

    this._ctx.bindTexture(this._target, this._texture);
    this._applyParametersBound(params);
    this._ctx.unbindTexture(this._target);
    this._ctx['_checkError'](`${this._resourceName}.setParametersBound()`);

    return this;
  }

  /**
   * Applies texture parameters while texture is already bound.
   * Override in subclasses to add additional parameters (call super first).
   * @param params - Object with parameter values
   */
  protected _applyParametersBound(params: TextureParameters): void {
    const gl = this._ctx.gl;
    if (params.minFilter !== undefined) {
      gl.texParameteri(this._target, gl.TEXTURE_MIN_FILTER, params.minFilter);
    }
    if (params.magFilter !== undefined) {
      gl.texParameteri(this._target, gl.TEXTURE_MAG_FILTER, params.magFilter);
    }
    if (params.wrapS !== undefined) {
      gl.texParameteri(this._target, gl.TEXTURE_WRAP_S, params.wrapS);
    }
    if (params.wrapT !== undefined) {
      gl.texParameteri(this._target, gl.TEXTURE_WRAP_T, params.wrapT);
    }
    if (params.compareMode !== undefined) {
      gl.texParameteri(this._target, gl.TEXTURE_COMPARE_MODE, params.compareMode);
    }
    if (params.compareFunc !== undefined) {
      gl.texParameteri(this._target, gl.TEXTURE_COMPARE_FUNC, params.compareFunc);
    }
    if (params.baseLevel !== undefined) {
      gl.texParameteri(this._target, gl.TEXTURE_BASE_LEVEL, params.baseLevel);
    }
    if (params.maxLevel !== undefined) {
      gl.texParameteri(this._target, gl.TEXTURE_MAX_LEVEL, params.maxLevel);
    }
  }

  /**
   * Sets the minification filter
   * @param filter - The minification filter mode
   * @returns this for method chaining
   */
  setMinFilter(filter: TextureMinFilter): this {
    if (this._disposed) {
      throw new AppError(ErrorCode.RES_DISPOSED, { resource: this._resourceName });
    }
    this._ctx.texParameteri(this._target, this._texture, this._ctx.gl.TEXTURE_MIN_FILTER, filter);
    return this;
  }

  /**
   * Sets the magnification filter
   * @param filter - The magnification filter mode
   * @returns this for method chaining
   */
  setMagFilter(filter: TextureMagFilter): this {
    if (this._disposed) {
      throw new AppError(ErrorCode.RES_DISPOSED, { resource: this._resourceName });
    }
    this._ctx.texParameteri(this._target, this._texture, this._ctx.gl.TEXTURE_MAG_FILTER, filter);
    return this;
  }

  /**
   * Sets both minification and magnification filters
   * @param minFilter - The minification filter mode
   * @param magFilter - The magnification filter mode (defaults to LINEAR if minFilter uses LINEAR, NEAREST otherwise)
   * @returns this for method chaining
   */
  setFilter(minFilter: TextureMinFilter, magFilter?: TextureMagFilter): this {
    if (this._disposed) {
      throw new AppError(ErrorCode.RES_DISPOSED, { resource: this._resourceName });
    }
    const gl = this._ctx.gl;
    this._ctx.texParameteri(this._target, this._texture, gl.TEXTURE_MIN_FILTER, minFilter);
    // Default mag filter based on whether min filter uses linear sampling
    const defaultMag =
      minFilter === TextureMinFilter.LINEAR ||
      minFilter === TextureMinFilter.LINEAR_MIPMAP_NEAREST ||
      minFilter === TextureMinFilter.LINEAR_MIPMAP_LINEAR
        ? TextureMagFilter.LINEAR
        : TextureMagFilter.NEAREST;
    this._ctx.texParameteri(this._target, this._texture, gl.TEXTURE_MAG_FILTER, magFilter ?? defaultMag);
    return this;
  }

  /**
   * Sets the wrap mode for the S (horizontal) texture coordinate
   * @param mode - The wrap mode
   * @returns this for method chaining
   */
  setWrapS(mode: TextureWrap): this {
    if (this._disposed) {
      throw new AppError(ErrorCode.RES_DISPOSED, { resource: this._resourceName });
    }
    this._ctx.texParameteri(this._target, this._texture, this._ctx.gl.TEXTURE_WRAP_S, mode);
    return this;
  }

  /**
   * Sets the wrap mode for the T (vertical) texture coordinate
   * @param mode - The wrap mode
   * @returns this for method chaining
   */
  setWrapT(mode: TextureWrap): this {
    if (this._disposed) {
      throw new AppError(ErrorCode.RES_DISPOSED, { resource: this._resourceName });
    }
    this._ctx.texParameteri(this._target, this._texture, this._ctx.gl.TEXTURE_WRAP_T, mode);
    return this;
  }

  /**
   * Sets the wrap mode for S and T coordinates
   * @param mode - The wrap mode to apply to S and T
   * @returns this for method chaining
   */
  setWrap(mode: TextureWrap): this {
    if (this._disposed) {
      throw new AppError(ErrorCode.RES_DISPOSED, { resource: this._resourceName });
    }
    const gl = this._ctx.gl;
    this._ctx.texParameteri(this._target, this._texture, gl.TEXTURE_WRAP_S, mode);
    this._ctx.texParameteri(this._target, this._texture, gl.TEXTURE_WRAP_T, mode);
    return this;
  }

  /**
   * Generates mipmaps for this texture
   * @returns this for method chaining
   */
  generateMipmaps(): this {
    if (this._disposed) {
      throw new AppError(ErrorCode.RES_DISPOSED, { resource: this._resourceName });
    }

    const gl = this._ctx.gl;
    this._ctx.bindTexture(this._target, this._texture);
    gl.generateMipmap(this._target);
    this._ctx.unbindTexture(this._target);
    this._ctx['_checkError'](`${this._resourceName}.generateMipmaps()`);
    this._metadata.mipmapsGenerated = true;

    return this;
  }

  /**
   * Disposes this texture and releases GPU resources
   */
  dispose(): void {
    if (this._disposed) {
      return;
    }
    this._ctx.gl.deleteTexture(this._texture);
    this._ctx['_checkError'](`${this._resourceName}.dispose()`);
    this._disposed = true;
  }

  /**
   * Executes a function with pixel store options set, then restores previous values
   */
  protected _withPixelStore(options: PixelStoreOptions, fn: () => void): void {
    const gl = this._ctx.gl;
    const prevFlipY = gl.getParameter(gl.UNPACK_FLIP_Y_WEBGL);
    const prevPremultiply = gl.getParameter(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL);
    const prevAlignment = gl.getParameter(gl.UNPACK_ALIGNMENT);

    if (options.flipY !== undefined) {
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, options.flipY ? 1 : 0);
    }
    if (options.premultiplyAlpha !== undefined) {
      gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, options.premultiplyAlpha ? 1 : 0);
    }
    if (options.alignment !== undefined) {
      gl.pixelStorei(gl.UNPACK_ALIGNMENT, options.alignment);
    }

    try {
      fn();
    } finally {
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, prevFlipY);
      gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, prevPremultiply);
      gl.pixelStorei(gl.UNPACK_ALIGNMENT, prevAlignment);
    }
  }

  /**
   * Validates that a value is a non-negative integer
   */
  protected _validateNonNegativeInt(
    value: number,
    methodName: string,
    label: string,
  ): void {
    if (!Number.isFinite(value)) {
      throw new AppError(ErrorCode.RES_INVALID_ARG, {
        resource: this._resourceName,
        method: methodName,
        detail: `${label} must be a finite number, got ${value}`,
      });
    }
    if (!Number.isInteger(value)) {
      throw new AppError(ErrorCode.RES_INVALID_ARG, {
        resource: this._resourceName,
        method: methodName,
        detail:
          `${label} must be an integer, got ${value}. ` +
          `Use Math.floor(), Math.round(), or Math.trunc() to convert.`,
      });
    }
    if (value < 0) {
      throw new AppError(ErrorCode.RES_INVALID_ARG, {
        resource: this._resourceName,
        method: methodName,
        detail: `${label} must be a non-negative integer, got ${value}`,
      });
    }
  }

  /**
   * Validates that alignment is 1, 2, 4, or 8
   */
  protected _validateAlignment(alignment: number | undefined, methodName: string): void {
    if (alignment === undefined) {
      return;
    }
    if (![1, 2, 4, 8].includes(alignment)) {
      throw new AppError(ErrorCode.RES_INVALID_ARG, {
        resource: this._resourceName,
        method: methodName,
        detail: `alignment must be 1, 2, 4, or 8, got ${alignment}`,
      });
    }
  }

  protected _setImageMetadata(
    width: number | undefined,
    height: number | undefined,
    details: {
      level?: number;
      internalFormat?: GLenum;
      format?: GLenum;
      type?: GLenum;
    },
  ): void {
    this._markMipmapsDirty();
    if (width !== undefined) {
      this._metadata.width = width;
    }
    if (height !== undefined) {
      this._metadata.height = height;
    }
    if (details.level !== undefined) {
      this._metadata.level = details.level;
    }
    if (details.internalFormat !== undefined) {
      this._metadata.internalFormat = details.internalFormat;
    }
    if (details.format !== undefined) {
      this._metadata.format = details.format;
    }
    if (details.type !== undefined) {
      this._metadata.type = details.type;
    }
  }

  protected _setImageMetadataFromSource(
    source: TexImageSource,
    details: {
      level?: number;
      internalFormat?: GLenum;
      format?: GLenum;
      type?: GLenum;
    },
  ): void {
    const size = this._extractSourceSize(source);
    this._setImageMetadata(size.width, size.height, details);
  }

  protected _setVolumeMetadata(
    dimensions: {
      width?: number;
      height?: number;
      depth?: number;
      layers?: number;
    },
    details: {
      level?: number;
      internalFormat?: GLenum;
      format?: GLenum;
      type?: GLenum;
    },
  ): void {
    this._markMipmapsDirty();
    if (dimensions.width !== undefined) {
      this._metadata.width = dimensions.width;
    }
    if (dimensions.height !== undefined) {
      this._metadata.height = dimensions.height;
    }
    if (dimensions.depth !== undefined) {
      this._metadata.depth = dimensions.depth;
    }
    if (dimensions.layers !== undefined) {
      this._metadata.layers = dimensions.layers;
    }
    if (details.level !== undefined) {
      this._metadata.level = details.level;
    }
    if (details.internalFormat !== undefined) {
      this._metadata.internalFormat = details.internalFormat;
    }
    if (details.format !== undefined) {
      this._metadata.format = details.format;
    }
    if (details.type !== undefined) {
      this._metadata.type = details.type;
    }
  }

  protected _extractSourceSize(
    source: TexImageSource,
  ): { width?: number; height?: number } {
    const anySource = source as any;
    if (typeof anySource.width === 'number' && typeof anySource.height === 'number') {
      return { width: anySource.width, height: anySource.height };
    }
    if (typeof anySource.videoWidth === 'number' && typeof anySource.videoHeight === 'number') {
      return { width: anySource.videoWidth, height: anySource.videoHeight };
    }
    return {};
  }

  protected _validateDimensions(
    methodName: string,
    dimensions: Record<string, number>,
  ): void {
    for (const [label, value] of Object.entries(dimensions)) {
      this._validateNonNegativeInt(value, methodName, label);
    }
  }

  protected _markMipmapsDirty(): void {
    this._metadata.mipmapsGenerated = false;
  }
}
