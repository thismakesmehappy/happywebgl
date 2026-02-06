/**
 * Texture3D - 3D volume texture (TEXTURE_3D)
 *
 * A 3D texture is a volume of pixels with width, height, and depth.
 * Commonly used for volumetric effects, 3D noise, and lookup tables.
 */

import { GLContext } from '../../core/GLContext.js';
import { AppError } from '../../errors/AppError.js';
import { ErrorCode } from '../../errors/ErrorCodes.js';
import { Texture, BaseDataOptions, BaseSubDataOptions, TextureParameters, TextureWrap } from './Texture.js';

/**
 * Options for uploading raw data to a 3D texture
 */
export interface Texture3DDataOptions extends BaseDataOptions {}

/**
 * Texture parameter options for 3D textures
 */
export interface Texture3DParameters extends TextureParameters {
  wrapR?: GLenum;
}

/**
 * Options for uploading sub-region data to a 3D texture
 */
export interface Texture3DSubDataOptions extends BaseSubDataOptions {}

/**
 * Texture3D - 3D volume texture for volumetric data
 *
 * @example
 * ```typescript
 * const texture = new Texture3D(ctx);
 *
 * // Create a 64x64x64 volume texture
 * const volumeData = new Uint8Array(64 * 64 * 64 * 4);
 * // ... fill volumeData ...
 *
 * texture
 *   .setData(64, 64, 64, volumeData)
 *   .setParameters({
 *     minFilter: gl.LINEAR,
 *     magFilter: gl.LINEAR,
 *     wrapS: gl.CLAMP_TO_EDGE,
 *     wrapT: gl.CLAMP_TO_EDGE,
 *     wrapR: gl.CLAMP_TO_EDGE,
 *   });
 * ```
 */
export class Texture3D extends Texture {
  /**
   * Creates a new 3D texture
   * @param ctx - The GLContext
   */
  constructor(ctx: GLContext) {
    super(ctx, ctx.gl.TEXTURE_3D);
  }

  protected override get _resourceName(): string {
    return 'Texture3D';
  }

  /**
   * Queries the currently bound 3D texture at a texture unit
   * @param ctx - The GLContext
   * @param unit - Texture unit to query (default: 0)
   * @returns The bound texture or null
   */
  static queryBinding(ctx: GLContext, unit: number = 0): WebGLTexture | null {
    ctx.gl.activeTexture(ctx.gl.TEXTURE0 + unit);
    return ctx.gl.getParameter(ctx.gl.TEXTURE_BINDING_3D) as WebGLTexture | null;
  }

  /**
   * Sets multiple texture parameters at once (including wrapR)
   * @param params - Object with parameter values
   * @returns this for method chaining
   */
  override setParameters(params: Texture3DParameters): this {
    super.setParameters(params);
    if (params.wrapR !== undefined) {
      this._ctx.texParameteri(this._target, this._texture, this._ctx.gl.TEXTURE_WRAP_R, params.wrapR);
    }
    return this;
  }

  /**
   * Applies texture parameters while texture is already bound (including wrapR)
   * @param params - Object with parameter values
   */
  protected override _applyParametersBound(params: Texture3DParameters): void {
    super._applyParametersBound(params);
    if (params.wrapR !== undefined) {
      this._ctx.gl.texParameteri(this._target, this._ctx.gl.TEXTURE_WRAP_R, params.wrapR);
    }
  }

  /**
   * Sets the wrap mode for the R (depth) texture coordinate
   * @param mode - The wrap mode
   * @returns this for method chaining
   */
  setWrapR(mode: TextureWrap): this {
    if (this._disposed) {
      throw new AppError(ErrorCode.RES_DISPOSED, { resource: this._resourceName });
    }
    this._ctx.texParameteri(this._target, this._texture, this._ctx.gl.TEXTURE_WRAP_R, mode);
    return this;
  }

  /**
   * Sets the wrap mode for S, T, and R coordinates
   * @param mode - The wrap mode to apply to all axes
   * @returns this for method chaining
   */
  override setWrap(mode: TextureWrap): this {
    super.setWrap(mode);
    return this.setWrapR(mode);
  }

  /**
   * Uploads raw pixel data to the 3D texture
   * @param width - Texture width
   * @param height - Texture height
   * @param depth - Texture depth
   * @param data - Pixel data (or null to allocate without data)
   * @param options - Upload options
   * @returns this for method chaining
   */
  setData(
    width: number,
    height: number,
    depth: number,
    data: ArrayBufferView | null,
    options: Texture3DDataOptions = {},
  ): this {
    if (this._disposed) {
      throw new AppError(ErrorCode.RES_DISPOSED, { resource: this._resourceName });
    }

    const gl = this._ctx.gl;
    const {
      level = 0,
      internalFormat = gl.RGBA,
      format = gl.RGBA,
      type = gl.UNSIGNED_BYTE,
      border = 0,
      flipY,
      premultiplyAlpha,
      alignment,
      generateMipmaps = false,
    } = options;

    this._validateNonNegativeInt(level, 'setData', 'level');
    this._validateDimensions('setData', { width, height, depth });
    this._validateAlignment(alignment, 'setData');

    this._withPixelStore({ flipY, premultiplyAlpha, alignment }, () => {
      this._ctx.texImage3D(
        this._target,
        this._texture,
        level,
        internalFormat,
        width,
        height,
        depth,
        border,
        format,
        type,
        data,
      );
    });

    this._setVolumeMetadata(
      { width, height, depth },
      {
        level,
        internalFormat,
        format,
        type,
      },
    );

    if (generateMipmaps) {
      this.generateMipmaps();
    }

    return this;
  }

  /**
   * Uploads raw pixel data to a sub-region of the 3D texture
   * @param xoffset - X offset in pixels
   * @param yoffset - Y offset in pixels
   * @param zoffset - Z offset in pixels
   * @param width - Width of the region
   * @param height - Height of the region
   * @param depth - Depth of the region
   * @param data - Pixel data
   * @param options - Upload options
   * @returns this for method chaining
   */
  setSubData(
    xoffset: number,
    yoffset: number,
    zoffset: number,
    width: number,
    height: number,
    depth: number,
    data: ArrayBufferView,
    options: Texture3DSubDataOptions = {},
  ): this {
    if (this._disposed) {
      throw new AppError(ErrorCode.RES_DISPOSED, { resource: this._resourceName });
    }

    const gl = this._ctx.gl;
    const {
      level = 0,
      format = gl.RGBA,
      type = gl.UNSIGNED_BYTE,
      flipY,
      premultiplyAlpha,
      alignment,
    } = options;

    this._validateNonNegativeInt(level, 'setSubData', 'level');
    this._validateDimensions('setSubData', {
      xoffset,
      yoffset,
      zoffset,
      width,
      height,
      depth,
    });
    this._validateAlignment(alignment, 'setSubData');

    this._withPixelStore({ flipY, premultiplyAlpha, alignment }, () => {
      this._ctx.texSubImage3D(
        this._target,
        this._texture,
        level,
        xoffset,
        yoffset,
        zoffset,
        width,
        height,
        depth,
        format,
        type,
        data,
      );
    });

    this._markMipmapsDirty();

    return this;
  }

  /**
   * Allocates immutable storage for the 3D texture
   * @param levels - Number of mipmap levels
   * @param internalFormat - Internal format
   * @param width - Texture width
   * @param height - Texture height
   * @param depth - Texture depth
   * @returns this for method chaining
   */
  allocateStorage(
    levels: number,
    internalFormat: GLenum,
    width: number,
    height: number,
    depth: number,
  ): this {
    if (this._disposed) {
      throw new AppError(ErrorCode.RES_DISPOSED, { resource: this._resourceName });
    }

    this._validateNonNegativeInt(levels, 'allocateStorage', 'levels');
    this._validateNonNegativeInt(width, 'allocateStorage', 'width');
    this._validateNonNegativeInt(height, 'allocateStorage', 'height');
    this._validateNonNegativeInt(depth, 'allocateStorage', 'depth');

    this._ctx.texStorage3D(
      this._target,
      this._texture,
      levels,
      internalFormat,
      width,
      height,
      depth,
    );

    this._metadata.width = width;
    this._metadata.height = height;
    this._metadata.depth = depth;
    this._metadata.internalFormat = internalFormat;
    this._metadata.immutable = true;
    this._metadata.storageLevels = levels;
    this._markMipmapsDirty();

    return this;
  }
}
