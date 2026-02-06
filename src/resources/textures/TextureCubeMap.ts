/**
 * TextureCubeMap - Cube map texture (TEXTURE_CUBE_MAP)
 *
 * A cube map consists of 6 square faces, one for each direction (+X, -X, +Y, -Y, +Z, -Z).
 * Commonly used for environment maps, skyboxes, and reflections.
 */

import { GLContext } from '../../core/GLContext.js';
import { AppError } from '../../errors/AppError.js';
import { ErrorCode } from '../../errors/ErrorCodes.js';
import { Texture, BaseDataOptions, BaseImageOptions, BaseSubDataOptions } from './Texture.js';

/**
 * Cube map face identifiers
 */
export enum CubeMapFace {
  POSITIVE_X = 0x8515,
  NEGATIVE_X = 0x8516,
  POSITIVE_Y = 0x8517,
  NEGATIVE_Y = 0x8518,
  POSITIVE_Z = 0x8519,
  NEGATIVE_Z = 0x851a,
}

/**
 * Options for uploading image data to a cube map face
 */
export interface CubeMapImageOptions extends BaseImageOptions {}

/**
 * Options for uploading raw data to a cube map face
 */
export interface CubeMapDataOptions extends BaseDataOptions {
  generateMipmaps?: never;
}

/**
 * Options for uploading sub-region data to a cube map face
 */
export interface CubeMapSubDataOptions extends BaseSubDataOptions {}

/**
 * TextureCubeMap - Cube map for environment mapping and skyboxes
 *
 * @example
 * ```typescript
 * const cubeMap = new TextureCubeMap(ctx);
 *
 * // Upload each face
 * cubeMap
 *   .setFaceImageData(CubeMapFace.POSITIVE_X, rightImage)
 *   .setFaceImageData(CubeMapFace.NEGATIVE_X, leftImage)
 *   .setFaceImageData(CubeMapFace.POSITIVE_Y, topImage)
 *   .setFaceImageData(CubeMapFace.NEGATIVE_Y, bottomImage)
 *   .setFaceImageData(CubeMapFace.POSITIVE_Z, frontImage)
 *   .setFaceImageData(CubeMapFace.NEGATIVE_Z, backImage)
 *   .setParameters({
 *     minFilter: gl.LINEAR_MIPMAP_LINEAR,
 *     magFilter: gl.LINEAR,
 *   })
 *   .generateMipmaps();
 * ```
 */
export class TextureCubeMap extends Texture {
  private static readonly VALID_FACES = new Set<GLenum>([
    CubeMapFace.POSITIVE_X,
    CubeMapFace.NEGATIVE_X,
    CubeMapFace.POSITIVE_Y,
    CubeMapFace.NEGATIVE_Y,
    CubeMapFace.POSITIVE_Z,
    CubeMapFace.NEGATIVE_Z,
  ]);

  /**
   * Creates a new cube map texture
   * @param ctx - The GLContext
   */
  constructor(ctx: GLContext) {
    super(ctx, ctx.gl.TEXTURE_CUBE_MAP);
  }

  protected override get _resourceName(): string {
    return 'TextureCubeMap';
  }

  /**
   * Queries the currently bound cube map texture at a texture unit
   * @param ctx - The GLContext
   * @param unit - Texture unit to query (default: 0)
   * @returns The bound texture or null
   */
  static queryBinding(ctx: GLContext, unit: number = 0): WebGLTexture | null {
    ctx.gl.activeTexture(ctx.gl.TEXTURE0 + unit);
    return ctx.gl.getParameter(ctx.gl.TEXTURE_BINDING_CUBE_MAP) as WebGLTexture | null;
  }

  /**
   * Validates that a face is a valid cube map face
   */
  private _validateFace(face: CubeMapFace, methodName: string): void {
    if (!TextureCubeMap.VALID_FACES.has(face)) {
      throw new AppError(ErrorCode.RES_INVALID_ARG, {
        resource: this._resourceName,
        method: methodName,
        detail: `invalid cube map face: ${face}`,
      });
    }
  }

  /**
   * Uploads image data to a cube map face
   * @param face - The cube map face
   * @param image - The image source
   * @param options - Upload options
   * @returns this for method chaining
   */
  setFaceImageData(
    face: CubeMapFace,
    image: TexImageSource,
    options: CubeMapImageOptions = {},
  ): this {
    if (this._disposed) {
      throw new AppError(ErrorCode.RES_DISPOSED, { resource: this._resourceName });
    }

    this._validateFace(face, 'setFaceImageData');

    const gl = this._ctx.gl;
    const {
      level = 0,
      internalFormat = gl.RGBA,
      format = gl.RGBA,
      type = gl.UNSIGNED_BYTE,
      flipY,
      premultiplyAlpha,
      alignment,
    } = options;

    this._validateNonNegativeInt(level, 'setFaceImageData', 'level');
    this._validateAlignment(alignment, 'setFaceImageData');

    this._withPixelStore({ flipY, premultiplyAlpha, alignment }, () => {
      this._ctx.bindTexture(this._target, this._texture);
      gl.texImage2D(face, level, internalFormat, format, type, image);
      this._ctx.unbindTexture(this._target);
      this._ctx['_checkError']('TextureCubeMap.setFaceImageData()');
    });

    this._setImageMetadataFromSource(image, {
      level,
      internalFormat,
      format,
      type,
    });

    return this;
  }

  /**
   * Uploads raw pixel data to a cube map face
   * @param face - The cube map face
   * @param width - Face width (must equal height for cube maps)
   * @param height - Face height (must equal width for cube maps)
   * @param data - Pixel data (or null to allocate without data)
   * @param options - Upload options
   * @returns this for method chaining
   */
  setFaceData(
    face: CubeMapFace,
    width: number,
    height: number,
    data: ArrayBufferView | null,
    options: CubeMapDataOptions = {},
  ): this {
    if (this._disposed) {
      throw new AppError(ErrorCode.RES_DISPOSED, { resource: this._resourceName });
    }

    this._validateFace(face, 'setFaceData');

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
    } = options;

    this._validateNonNegativeInt(level, 'setFaceData', 'level');
    this._validateDimensions('setFaceData', { width, height });
    this._validateAlignment(alignment, 'setFaceData');

    this._withPixelStore({ flipY, premultiplyAlpha, alignment }, () => {
      this._ctx.bindTexture(this._target, this._texture);
      gl.texImage2D(face, level, internalFormat, width, height, border, format, type, data);
      this._ctx.unbindTexture(this._target);
      this._ctx['_checkError']('TextureCubeMap.setFaceData()');
    });

    this._setImageMetadata(width, height, {
      level,
      internalFormat,
      format,
      type,
    });

    return this;
  }

  /**
   * Uploads raw pixel data to a sub-region of a cube map face
   * @param face - The cube map face
   * @param xoffset - X offset in pixels
   * @param yoffset - Y offset in pixels
   * @param width - Width of the region
   * @param height - Height of the region
   * @param data - Pixel data
   * @param options - Upload options
   * @returns this for method chaining
   */
  setFaceSubData(
    face: CubeMapFace,
    xoffset: number,
    yoffset: number,
    width: number,
    height: number,
    data: ArrayBufferView,
    options: CubeMapSubDataOptions = {},
  ): this {
    if (this._disposed) {
      throw new AppError(ErrorCode.RES_DISPOSED, { resource: this._resourceName });
    }

    this._validateFace(face, 'setFaceSubData');

    const gl = this._ctx.gl;
    const {
      level = 0,
      format = gl.RGBA,
      type = gl.UNSIGNED_BYTE,
      flipY,
      premultiplyAlpha,
      alignment,
    } = options;

    this._validateNonNegativeInt(level, 'setFaceSubData', 'level');
    this._validateDimensions('setFaceSubData', { xoffset, yoffset, width, height });
    this._validateAlignment(alignment, 'setFaceSubData');

    this._withPixelStore({ flipY, premultiplyAlpha, alignment }, () => {
      this._ctx.bindTexture(this._target, this._texture);
      gl.texSubImage2D(face, level, xoffset, yoffset, width, height, format, type, data);
      this._ctx.unbindTexture(this._target);
      this._ctx['_checkError']('TextureCubeMap.setFaceSubData()');
    });

    this._markMipmapsDirty();

    return this;
  }

  /**
   * Uploads image data to all 6 faces at once
   * @param images - Object with images for each face
   * @param options - Upload options (applied to all faces)
   * @returns this for method chaining
   */
  setAllFaces(
    images: {
      positiveX: TexImageSource;
      negativeX: TexImageSource;
      positiveY: TexImageSource;
      negativeY: TexImageSource;
      positiveZ: TexImageSource;
      negativeZ: TexImageSource;
    },
    options: CubeMapImageOptions = {},
  ): this {
    this.setFaceImageData(CubeMapFace.POSITIVE_X, images.positiveX, options);
    this.setFaceImageData(CubeMapFace.NEGATIVE_X, images.negativeX, options);
    this.setFaceImageData(CubeMapFace.POSITIVE_Y, images.positiveY, options);
    this.setFaceImageData(CubeMapFace.NEGATIVE_Y, images.negativeY, options);
    this.setFaceImageData(CubeMapFace.POSITIVE_Z, images.positiveZ, options);
    this.setFaceImageData(CubeMapFace.NEGATIVE_Z, images.negativeZ, options);
    return this;
  }

  /**
   * Allocates immutable storage for the cube map
   * @param levels - Number of mipmap levels
   * @param internalFormat - Internal format
   * @param size - Face width/height
   * @returns this for method chaining
   */
  allocateStorage(levels: number, internalFormat: GLenum, size: number): this {
    if (this._disposed) {
      throw new AppError(ErrorCode.RES_DISPOSED, { resource: this._resourceName });
    }

    this._validateNonNegativeInt(levels, 'allocateStorage', 'levels');
    this._validateNonNegativeInt(size, 'allocateStorage', 'size');

    this._ctx.texStorage2D(this._target, this._texture, levels, internalFormat, size, size);

    this._metadata.width = size;
    this._metadata.height = size;
    this._metadata.internalFormat = internalFormat;
    this._metadata.immutable = true;
    this._metadata.storageLevels = levels;
    this._markMipmapsDirty();

    return this;
  }
}
