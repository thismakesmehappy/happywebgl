/**
 * Texture2D - Standard 2D texture (TEXTURE_2D)
 *
 * The most common texture type, used for applying images to 3D surfaces.
 * Supports mipmaps, various filtering modes, and wrap modes.
 */

import { GLContext } from '../../core/GLContext.js';
import { AppError } from '../../errors/AppError.js';
import { ErrorCode } from '../../errors/ErrorCodes.js';
import {Texture, BaseDataOptions, BaseImageOptions, BaseSubDataOptions } from './Texture.js';

/**
 * Options for uploading image data to a 2D texture
 */
export interface Texture2DImageOptions extends BaseImageOptions {
  generateMipmaps?: boolean;
}

/**
 * Options for uploading raw data to a 2D texture
 */
export interface Texture2DDataOptions extends BaseDataOptions {}

/**
 * Options for uploading sub-region data to a 2D texture
 */
export interface Texture2DSubDataOptions extends BaseSubDataOptions {}

/**
 * Texture2D - Standard 2D texture for applying images to surfaces
 *
 * @example
 * ```typescript
 * const texture = new Texture2D(ctx);
 * texture
 *   .setData(256, 256, null)  // Allocate empty texture
 *   .setParameters({
 *     minFilter: gl.LINEAR_MIPMAP_LINEAR,
 *     magFilter: gl.LINEAR,
 *     wrapS: gl.REPEAT,
 *     wrapT: gl.REPEAT,
 *   })
 *   .generateMipmaps();
 * ```
 */
export class Texture2D extends Texture {
  /**
   * Creates a new 2D texture
   * @param ctx - The GLContext
   */
  constructor(ctx: GLContext) {
    super(ctx, ctx.gl.TEXTURE_2D);
  }

  protected override get _resourceName(): string {
    return 'Texture2D';
  }

  /**
   * Queries the currently bound 2D texture at a texture unit
   * @param ctx - The GLContext
   * @param unit - Texture unit to query (default: 0)
   * @returns The bound texture or null
   */
  static queryBinding(ctx: GLContext, unit: number = 0): WebGLTexture | null {
    ctx.gl.activeTexture(ctx.gl.TEXTURE0 + unit);
    return ctx.gl.getParameter(ctx.gl.TEXTURE_BINDING_2D) as WebGLTexture | null;
  }

  /**
   * Uploads image data (HTMLImageElement, HTMLCanvasElement, etc.) to the texture
   * @param image - The image source
   * @param options - Upload options
   * @returns this for method chaining
   */
  setImageData(image: TexImageSource, options: Texture2DImageOptions = {}): this {
    if (this._disposed) {
      throw new AppError(ErrorCode.RES_DISPOSED, { resource: this._resourceName });
    }

    const gl = this._ctx.gl;
    const {
      level = 0,
      internalFormat = gl.RGBA,
      format = gl.RGBA,
      type = gl.UNSIGNED_BYTE,
      flipY,
      premultiplyAlpha,
      alignment,
      generateMipmaps = false,
    } = options;

    this._validateNonNegativeInt(level, 'setImageData', 'level');
    this._validateAlignment(alignment, 'setImageData');

    this._withPixelStore({ flipY, premultiplyAlpha, alignment }, () => {
      this._ctx.texImage2DSource(
        this._target,
        this._texture,
        level,
        internalFormat,
        format,
        type,
        image,
      );
    });

    this._setImageMetadataFromSource(image, {
      level,
      internalFormat,
      format,
      type,
    });

    if (generateMipmaps) {
      this.generateMipmaps();
    }

    return this;
  }

  /**
   * Uploads raw pixel data to the texture
   * @param width - Texture width
   * @param height - Texture height
   * @param data - Pixel data (or null to allocate without data)
   * @param options - Upload options
   * @returns this for method chaining
   */
  setData(
    width: number,
    height: number,
    data: ArrayBufferView | null,
    options: Texture2DDataOptions = {},
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
    this._validateDimensions('setData', { width, height });
    this._validateAlignment(alignment, 'setData');

    this._withPixelStore({ flipY, premultiplyAlpha, alignment }, () => {
      this._ctx.texImage2D(
        this._target,
        this._texture,
        level,
        internalFormat,
        width,
        height,
        border,
        format,
        type,
        data,
      );
    });

    this._setImageMetadata(width, height, {
      level,
      internalFormat,
      format,
      type,
    });

    if (generateMipmaps) {
      this.generateMipmaps();
    }

    return this;
  }

  /**
   * Allocates immutable storage for the texture
   * @param levels - Number of mipmap levels
   * @param internalFormat - Internal format
   * @param width - Texture width
   * @param height - Texture height
   * @returns this for method chaining
   */
  allocateStorage(
    levels: number,
    internalFormat: GLenum,
    width: number,
    height: number,
  ): this {
    if (this._disposed) {
      throw new AppError(ErrorCode.RES_DISPOSED, { resource: this._resourceName });
    }

    this._validateNonNegativeInt(levels, 'allocateStorage', 'levels');
    this._validateNonNegativeInt(width, 'allocateStorage', 'width');
    this._validateNonNegativeInt(height, 'allocateStorage', 'height');

    this._ctx.texStorage2D(this._target, this._texture, levels, internalFormat, width, height);

    this._metadata.width = width;
    this._metadata.height = height;
    this._metadata.internalFormat = internalFormat;
    this._metadata.immutable = true;
    this._metadata.storageLevels = levels;
    this._markMipmapsDirty();

    return this;
  }

  /**
   * Uploads raw pixel data to a sub-region of the texture
   * @param xoffset - X offset in pixels
   * @param yoffset - Y offset in pixels
   * @param width - Width of the region
   * @param height - Height of the region
   * @param data - Pixel data
   * @param options - Upload options
   * @returns this for method chaining
   */
  setSubData(
    xoffset: number,
    yoffset: number,
    width: number,
    height: number,
    data: ArrayBufferView,
    options: Texture2DSubDataOptions = {},
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
    this._validateDimensions('setSubData', { xoffset, yoffset, width, height });
    this._validateAlignment(alignment, 'setSubData');

    this._withPixelStore({ flipY, premultiplyAlpha, alignment }, () => {
      this._ctx.texSubImage2D(
        this._target,
        this._texture,
        level,
        xoffset,
        yoffset,
        width,
        height,
        format,
        type,
        data,
      );
    });

    this._markMipmapsDirty();

    return this;
  }
}
