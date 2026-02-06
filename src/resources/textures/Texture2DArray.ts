/**
 * Texture2DArray - Array of 2D textures (TEXTURE_2D_ARRAY)
 *
 * A 2D array texture is a collection of 2D images with identical dimensions.
 * Each layer is a separate 2D texture that can be sampled using a layer index.
 * Commonly used for texture atlases, sprite sheets, and terrain textures.
 */

import { GLContext } from '../../core/GLContext.js';
import { AppError } from '../../errors/AppError.js';
import { ErrorCode } from '../../errors/ErrorCodes.js';
import { Texture, BaseDataOptions, BaseSubDataOptions, TextureParameters, TextureWrap } from './Texture.js';

/**
 * Options for uploading raw data to a 2D array texture
 */
export interface Texture2DArrayDataOptions extends BaseDataOptions {}

/**
 * Options for uploading sub-region data to a 2D array texture
 */
export interface Texture2DArraySubDataOptions extends BaseSubDataOptions {}

/**
 * Options for uploading a single layer from raw data
 */
export interface Texture2DArrayLayerDataOptions extends BaseSubDataOptions {}

/**
 * Texture parameter options for 2D array textures
 */
export interface Texture2DArrayParameters extends TextureParameters {
  wrapR?: GLenum;
}

/**
 * Texture2DArray - Array of 2D textures for efficient batched rendering
 *
 * @example
 * ```typescript
 * const texture = new Texture2DArray(ctx);
 *
 * // Create a 256x256 array with 4 layers
 * texture
 *   .setData(256, 256, 4, null)  // Allocate without data
 *   .setLayerData(0, 256, 256, layer0Data)  // Upload layer 0
 *   .setLayerData(1, 256, 256, layer1Data)  // Upload layer 1
 *   .setLayerData(2, 256, 256, layer2Data)  // Upload layer 2
 *   .setLayerData(3, 256, 256, layer3Data)  // Upload layer 3
 *   .setParameters({
 *     minFilter: gl.LINEAR_MIPMAP_LINEAR,
 *     magFilter: gl.LINEAR,
 *   })
 *   .generateMipmaps();
 * ```
 */
export class Texture2DArray extends Texture {
  /**
   * Creates a new 2D array texture
   * @param ctx - The GLContext
   */
  constructor(ctx: GLContext) {
    super(ctx, ctx.gl.TEXTURE_2D_ARRAY);
  }

  protected override get _resourceName(): string {
    return 'Texture2DArray';
  }

  /**
   * Queries the currently bound 2D array texture at a texture unit
   * @param ctx - The GLContext
   * @param unit - Texture unit to query (default: 0)
   * @returns The bound texture or null
   */
  static queryBinding(ctx: GLContext, unit: number = 0): WebGLTexture | null {
    ctx.gl.activeTexture(ctx.gl.TEXTURE0 + unit);
    return ctx.gl.getParameter(ctx.gl.TEXTURE_BINDING_2D_ARRAY) as WebGLTexture | null;
  }

  /**
   * Sets multiple texture parameters at once (including wrapR)
   * @param params - Object with parameter values
   * @returns this for method chaining
   */
  override setParameters(params: Texture2DArrayParameters): this {
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
  protected override _applyParametersBound(params: Texture2DArrayParameters): void {
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
   * Uploads raw pixel data to the entire 2D array texture
   * @param width - Texture width
   * @param height - Texture height
   * @param layers - Number of layers
   * @param data - Pixel data (or null to allocate without data)
   * @param options - Upload options
   * @returns this for method chaining
   */
  setData(
    width: number,
    height: number,
    layers: number,
    data: ArrayBufferView | null,
    options: Texture2DArrayDataOptions = {},
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
    this._validateDimensions('setData', { width, height, layers });
    this._validateAlignment(alignment, 'setData');

    this._withPixelStore({ flipY, premultiplyAlpha, alignment }, () => {
      this._ctx.texImage3D(
        this._target,
        this._texture,
        level,
        internalFormat,
        width,
        height,
        layers,
        border,
        format,
        type,
        data,
      );
    });

    this._setVolumeMetadata(
      { width, height, layers },
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
   * Uploads raw pixel data to a sub-region of the 2D array texture
   * @param xoffset - X offset in pixels
   * @param yoffset - Y offset in pixels
   * @param layerOffset - Starting layer index
   * @param width - Width of the region
   * @param height - Height of the region
   * @param layerCount - Number of layers to update
   * @param data - Pixel data
   * @param options - Upload options
   * @returns this for method chaining
   */
  setSubData(
    xoffset: number,
    yoffset: number,
    layerOffset: number,
    width: number,
    height: number,
    layerCount: number,
    data: ArrayBufferView,
    options: Texture2DArraySubDataOptions = {},
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
      layerOffset,
      width,
      height,
      layerCount,
    });
    this._validateAlignment(alignment, 'setSubData');

    this._withPixelStore({ flipY, premultiplyAlpha, alignment }, () => {
      this._ctx.texSubImage3D(
        this._target,
        this._texture,
        level,
        xoffset,
        yoffset,
        layerOffset,
        width,
        height,
        layerCount,
        format,
        type,
        data,
      );
    });

    this._markMipmapsDirty();

    return this;
  }

  /**
   * Uploads raw pixel data to a single layer of the array
   * The texture must first be allocated with setData()
   * @param layer - Layer index
   * @param width - Width of the layer
   * @param height - Height of the layer
   * @param data - Pixel data
   * @param options - Upload options
   * @returns this for method chaining
   */
  setLayerData(
    layer: number,
    width: number,
    height: number,
    data: ArrayBufferView,
    options: Texture2DArrayLayerDataOptions = {},
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

    this._validateNonNegativeInt(level, 'setLayerData', 'level');
    this._validateDimensions('setLayerData', { layer, width, height });
    this._validateAlignment(alignment, 'setLayerData');

    this._withPixelStore({ flipY, premultiplyAlpha, alignment }, () => {
      this._ctx.texSubImage3D(
        this._target,
        this._texture,
        level,
        0, // xoffset
        0, // yoffset
        layer, // zoffset (layer index)
        width,
        height,
        1, // depth (single layer)
        format,
        type,
        data,
      );
    });

    this._markMipmapsDirty();

    return this;
  }

  /**
   * Allocates immutable storage for the 2D array texture
   * @param levels - Number of mipmap levels
   * @param internalFormat - Internal format
   * @param width - Texture width
   * @param height - Texture height
   * @param layers - Number of layers
   * @returns this for method chaining
   */
  allocateStorage(
    levels: number,
    internalFormat: GLenum,
    width: number,
    height: number,
    layers: number,
  ): this {
    if (this._disposed) {
      throw new AppError(ErrorCode.RES_DISPOSED, { resource: this._resourceName });
    }

    this._validateNonNegativeInt(levels, 'allocateStorage', 'levels');
    this._validateNonNegativeInt(width, 'allocateStorage', 'width');
    this._validateNonNegativeInt(height, 'allocateStorage', 'height');
    this._validateNonNegativeInt(layers, 'allocateStorage', 'layers');

    this._ctx.texStorage3D(
      this._target,
      this._texture,
      levels,
      internalFormat,
      width,
      height,
      layers,
    );

    this._metadata.width = width;
    this._metadata.height = height;
    this._metadata.layers = layers;
    this._metadata.internalFormat = internalFormat;
    this._metadata.immutable = true;
    this._metadata.storageLevels = levels;
    this._markMipmapsDirty();

    return this;
  }
}
