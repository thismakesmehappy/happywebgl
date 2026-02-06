import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Texture2D } from '../../../src/resources/textures/Texture2D.js';
import {
  TextureMinFilter,
  TextureMagFilter,
  TextureWrap,
} from '../../../src/resources/textures/Texture.js';
import { GLContext } from '../../../src/core/GLContext.js';

describe('Texture2D', () => {
  let mockGLContext: Partial<GLContext>;
  let mockGL: any;
  let mockTexture: WebGLTexture;

  beforeEach(() => {
    mockTexture = {} as WebGLTexture;
    mockGL = {
      TEXTURE0: 0x84c0,
      TEXTURE_2D: 0x0de1,
      TEXTURE_BINDING_2D: 0x8069,
      TEXTURE_MIN_FILTER: 0x2801,
      TEXTURE_MAG_FILTER: 0x2800,
      TEXTURE_WRAP_S: 0x2802,
      TEXTURE_WRAP_T: 0x2803,
      TEXTURE_WRAP_R: 0x8072,
      TEXTURE_COMPARE_MODE: 0x884c,
      TEXTURE_COMPARE_FUNC: 0x884d,
      TEXTURE_BASE_LEVEL: 0x813c,
      TEXTURE_MAX_LEVEL: 0x813d,
      RGBA: 0x1908,
      RGBA8: 0x8058,
      UNSIGNED_BYTE: 0x1401,
      UNPACK_FLIP_Y_WEBGL: 0x9240,
      UNPACK_PREMULTIPLY_ALPHA_WEBGL: 0x9241,
      UNPACK_ALIGNMENT: 0x0cf5,
      createTexture: vi.fn(() => mockTexture),
      deleteTexture: vi.fn(),
      bindTexture: vi.fn(),
      activeTexture: vi.fn(),
      texImage2D: vi.fn(),
      texSubImage2D: vi.fn(),
      texParameteri: vi.fn(),
      texParameterf: vi.fn(),
      generateMipmap: vi.fn(),
      pixelStorei: vi.fn(),
      getParameter: vi.fn((pname: number) => {
        if (pname === 0x8069) return mockTexture;
        if (pname === 0x9240) return 0;
        if (pname === 0x9241) return 0;
        if (pname === 0x0cf5) return 4;
        return null;
      }),
      getError: vi.fn(() => 0),
    };

    mockGLContext = {
      gl: mockGL as WebGL2RenderingContext,
      createTexture: vi.fn(() => mockTexture),
      registerTexture: vi.fn(),
      bindTexture: vi.fn(),
      unbindTexture: vi.fn(),
      texParameteri: vi.fn(),
      texParameterf: vi.fn(),
      texImage2D: vi.fn(),
      texImage2DSource: vi.fn(),
      texSubImage2D: vi.fn(),
      texStorage2D: vi.fn(),
      _checkError: vi.fn(),
    };
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('constructor', () => {
    it('creates and registers a texture with TEXTURE_2D target', () => {
      const texture = new Texture2D(mockGLContext as GLContext);
      expect(mockGLContext.createTexture).toHaveBeenCalledTimes(1);
      expect(mockGLContext.registerTexture).toHaveBeenCalledWith(mockTexture);
      expect(texture.texture).toBe(mockTexture);
      expect(texture.target).toBe(mockGL.TEXTURE_2D);
    });
  });

  describe('isDisposed', () => {
    it('returns false initially', () => {
      const texture = new Texture2D(mockGLContext as GLContext);
      expect(texture.isDisposed).toBe(false);
    });

    it('returns true after dispose', () => {
      const texture = new Texture2D(mockGLContext as GLContext);
      texture.dispose();
      expect(texture.isDisposed).toBe(true);
    });
  });

  describe('queryBinding', () => {
    it('queries 2D texture binding with defaults', () => {
      const bound = Texture2D.queryBinding(mockGLContext as GLContext);
      expect(mockGL.activeTexture).toHaveBeenCalledWith(mockGL.TEXTURE0);
      expect(bound).toBe(mockTexture);
    });

    it('queries 2D texture binding at specific unit', () => {
      Texture2D.queryBinding(mockGLContext as GLContext, 3);
      expect(mockGL.activeTexture).toHaveBeenCalledWith(mockGL.TEXTURE0 + 3);
    });
  });

  describe('binding', () => {
    it('binds with default unit', () => {
      const texture = new Texture2D(mockGLContext as GLContext);
      texture.bind();
      expect(mockGLContext.bindTexture).toHaveBeenCalledWith(
        mockGL.TEXTURE_2D,
        mockTexture,
        0,
      );
    });

    it('binds and unbinds with unit', () => {
      const texture = new Texture2D(mockGLContext as GLContext);
      texture.bind(1);
      expect(mockGLContext.bindTexture).toHaveBeenCalledWith(
        mockGL.TEXTURE_2D,
        mockTexture,
        1,
      );
      texture.unbind(1);
      expect(mockGLContext.unbindTexture).toHaveBeenCalledWith(
        mockGL.TEXTURE_2D,
        1,
      );
    });

    it('returns this for chaining', () => {
      const texture = new Texture2D(mockGLContext as GLContext);
      expect(texture.bind(0)).toBe(texture);
      expect(texture.unbind(0)).toBe(texture);
    });

    it('throws for invalid unit', () => {
      const texture = new Texture2D(mockGLContext as GLContext);
      expect(() => texture.bind(-1)).toThrow(/\[RES_002\]/);
      expect(() => texture.unbind(1.5)).toThrow(/\[RES_002\]/);
    });

    it('throws when disposed', () => {
      const texture = new Texture2D(mockGLContext as GLContext);
      texture.dispose();
      expect(() => texture.bind()).toThrow(/\[RES_001\]/);
      expect(() => texture.unbind()).toThrow(/\[RES_001\]/);
    });
  });

  describe('parameters', () => {
    it('sets individual parameters', () => {
      const texture = new Texture2D(mockGLContext as GLContext);
      texture.setParameteri(mockGL.TEXTURE_MIN_FILTER, 123);
      texture.setParameterf(mockGL.TEXTURE_MAX_LEVEL, 4.5);
      expect(mockGLContext.texParameteri).toHaveBeenCalledWith(
        mockGL.TEXTURE_2D,
        mockTexture,
        mockGL.TEXTURE_MIN_FILTER,
        123,
      );
      expect(mockGLContext.texParameterf).toHaveBeenCalledWith(
        mockGL.TEXTURE_2D,
        mockTexture,
        mockGL.TEXTURE_MAX_LEVEL,
        4.5,
      );
    });

    it('sets parameter batch', () => {
      const texture = new Texture2D(mockGLContext as GLContext);
      texture.setParameters({
        minFilter: 1,
        magFilter: 2,
        wrapS: 3,
        wrapT: 4,
        compareMode: 6,
        compareFunc: 7,
        baseLevel: 0,
        maxLevel: 2,
      });
      // Note: Texture2D base class only handles 8 params (no wrapR)
      expect(mockGLContext.texParameteri).toHaveBeenCalledTimes(8);
    });

    it('handles empty parameter batch', () => {
      const texture = new Texture2D(mockGLContext as GLContext);
      const result = texture.setParameters({});
      expect(mockGLContext.texParameteri).not.toHaveBeenCalled();
      expect(result).toBe(texture);
    });

    it('throws when disposed', () => {
      const texture = new Texture2D(mockGLContext as GLContext);
      texture.dispose();
      expect(() => texture.setParameteri(mockGL.TEXTURE_MIN_FILTER, 1)).toThrow(
        /\[RES_001\]/,
      );
      expect(() => texture.setParameterf(mockGL.TEXTURE_MIN_FILTER, 1.0)).toThrow(
        /\[RES_001\]/,
      );
      expect(() => texture.setParameters({ minFilter: 1 })).toThrow(/\[RES_001\]/);
    });
  });

  describe('setParametersBound', () => {
    it('sets all parameters with single bind/unbind', () => {
      const texture = new Texture2D(mockGLContext as GLContext);
      const result = texture.setParametersBound({
        minFilter: 1,
        magFilter: 2,
        wrapS: 3,
        wrapT: 4,
        compareMode: 5,
        compareFunc: 6,
        baseLevel: 0,
        maxLevel: 4,
      });
      // Should bind once
      expect(mockGLContext.bindTexture).toHaveBeenCalledTimes(1);
      // Should set params directly on gl (8 params)
      expect(mockGL.texParameteri).toHaveBeenCalledTimes(8);
      expect(mockGL.texParameteri).toHaveBeenCalledWith(
        mockGL.TEXTURE_2D,
        mockGL.TEXTURE_MIN_FILTER,
        1,
      );
      expect(mockGL.texParameteri).toHaveBeenCalledWith(
        mockGL.TEXTURE_2D,
        mockGL.TEXTURE_MAG_FILTER,
        2,
      );
      expect(mockGL.texParameteri).toHaveBeenCalledWith(
        mockGL.TEXTURE_2D,
        mockGL.TEXTURE_WRAP_S,
        3,
      );
      expect(mockGL.texParameteri).toHaveBeenCalledWith(
        mockGL.TEXTURE_2D,
        mockGL.TEXTURE_WRAP_T,
        4,
      );
      expect(mockGL.texParameteri).toHaveBeenCalledWith(
        mockGL.TEXTURE_2D,
        mockGL.TEXTURE_COMPARE_MODE,
        5,
      );
      expect(mockGL.texParameteri).toHaveBeenCalledWith(
        mockGL.TEXTURE_2D,
        mockGL.TEXTURE_COMPARE_FUNC,
        6,
      );
      expect(mockGL.texParameteri).toHaveBeenCalledWith(
        mockGL.TEXTURE_2D,
        mockGL.TEXTURE_BASE_LEVEL,
        0,
      );
      expect(mockGL.texParameteri).toHaveBeenCalledWith(
        mockGL.TEXTURE_2D,
        mockGL.TEXTURE_MAX_LEVEL,
        4,
      );
      // Should unbind once
      expect(mockGLContext.unbindTexture).toHaveBeenCalledTimes(1);
      expect(result).toBe(texture);
    });

    it('skips undefined parameters', () => {
      const texture = new Texture2D(mockGLContext as GLContext);
      texture.setParametersBound({ minFilter: 1 });
      expect(mockGL.texParameteri).toHaveBeenCalledTimes(1);
    });

    it('throws when disposed', () => {
      const texture = new Texture2D(mockGLContext as GLContext);
      texture.dispose();
      expect(() => texture.setParametersBound({ minFilter: 1 })).toThrow(/\[RES_001\]/);
    });
  });

  describe('setImageData', () => {
    it('uploads image data with default options', () => {
      const texture = new Texture2D(mockGLContext as GLContext);
      const image = {} as TexImageSource;
      texture.setImageData(image);
      expect(mockGLContext.texImage2DSource).toHaveBeenCalledWith(
        mockGL.TEXTURE_2D,
        mockTexture,
        0,
        mockGL.RGBA,
        mockGL.RGBA,
        mockGL.UNSIGNED_BYTE,
        image,
      );
    });

    it('extracts size from image with width/height properties', () => {
      const texture = new Texture2D(mockGLContext as GLContext);
      const image = { width: 256, height: 128 } as TexImageSource;
      texture.setImageData(image);
      const metadata = texture.metadata;
      expect(metadata.width).toBe(256);
      expect(metadata.height).toBe(128);
    });

    it('extracts size from video with videoWidth/videoHeight properties', () => {
      const texture = new Texture2D(mockGLContext as GLContext);
      const video = { videoWidth: 1920, videoHeight: 1080 } as TexImageSource;
      texture.setImageData(video);
      const metadata = texture.metadata;
      expect(metadata.width).toBe(1920);
      expect(metadata.height).toBe(1080);
    });

    it('handles source without size properties', () => {
      const texture = new Texture2D(mockGLContext as GLContext);
      const source = {} as TexImageSource;
      texture.setImageData(source);
      const metadata = texture.metadata;
      // Should not have width/height set (undefined)
      expect(metadata.width).toBeUndefined();
      expect(metadata.height).toBeUndefined();
    });

    it('stores metadata for level, internalFormat, format, and type', () => {
      const texture = new Texture2D(mockGLContext as GLContext);
      const image = { width: 64, height: 64 } as TexImageSource;
      texture.setImageData(image, {
        level: 2,
        internalFormat: 0x8051, // RGB8
        format: 0x1907, // RGB
        type: 0x1403, // UNSIGNED_SHORT
      });
      const metadata = texture.metadata;
      expect(metadata.level).toBe(2);
      expect(metadata.internalFormat).toBe(0x8051);
      expect(metadata.format).toBe(0x1907);
      expect(metadata.type).toBe(0x1403);
    });

    it('uploads image data with pixel store overrides', () => {
      const texture = new Texture2D(mockGLContext as GLContext);
      const image = {} as TexImageSource;
      texture.setImageData(image, {
        flipY: true,
        premultiplyAlpha: true,
        alignment: 1,
      });
      expect(mockGL.pixelStorei).toHaveBeenCalledWith(mockGL.UNPACK_FLIP_Y_WEBGL, 1);
      expect(mockGL.pixelStorei).toHaveBeenCalledWith(
        mockGL.UNPACK_PREMULTIPLY_ALPHA_WEBGL,
        1,
      );
      expect(mockGL.pixelStorei).toHaveBeenCalledWith(mockGL.UNPACK_ALIGNMENT, 1);
    });

    it('generates mipmaps when requested', () => {
      const texture = new Texture2D(mockGLContext as GLContext);
      const image = {} as TexImageSource;
      texture.setImageData(image, { generateMipmaps: true });
      expect(mockGL.generateMipmap).toHaveBeenCalledWith(mockGL.TEXTURE_2D);
    });

    it('returns this for chaining', () => {
      const texture = new Texture2D(mockGLContext as GLContext);
      const image = {} as TexImageSource;
      expect(texture.setImageData(image)).toBe(texture);
    });

    it('throws for invalid level', () => {
      const texture = new Texture2D(mockGLContext as GLContext);
      const image = {} as TexImageSource;
      expect(() => texture.setImageData(image, { level: -1 })).toThrow(/\[RES_002\]/);
    });

    it('throws when disposed', () => {
      const texture = new Texture2D(mockGLContext as GLContext);
      texture.dispose();
      const image = {} as TexImageSource;
      expect(() => texture.setImageData(image)).toThrow(/\[RES_001\]/);
    });
  });

  describe('setData', () => {
    it('uploads raw data with defaults', () => {
      const texture = new Texture2D(mockGLContext as GLContext);
      const data = new Uint8Array([0, 0, 0, 0]);
      texture.setData(1, 1, data);
      expect(mockGLContext.texImage2D).toHaveBeenCalled();
    });

    it('uploads null data to allocate texture', () => {
      const texture = new Texture2D(mockGLContext as GLContext);
      texture.setData(256, 256, null);
      expect(mockGLContext.texImage2D).toHaveBeenCalled();
    });

    it('generates mipmaps when requested', () => {
      const texture = new Texture2D(mockGLContext as GLContext);
      texture.setData(1, 1, null, { generateMipmaps: true });
      expect(mockGL.generateMipmap).toHaveBeenCalledWith(mockGL.TEXTURE_2D);
    });

    it('returns this for chaining', () => {
      const texture = new Texture2D(mockGLContext as GLContext);
      expect(texture.setData(1, 1, null)).toBe(texture);
    });

    it('throws for invalid dimensions', () => {
      const texture = new Texture2D(mockGLContext as GLContext);
      expect(() => texture.setData(-1, 1, null)).toThrow(/\[RES_002\]/);
      expect(() => texture.setData(1, -1, null)).toThrow(/\[RES_002\]/);
      expect(() => texture.setData(1.5, 1, null)).toThrow(/\[RES_002\]/);
    });

    it('throws when disposed', () => {
      const texture = new Texture2D(mockGLContext as GLContext);
      texture.dispose();
      expect(() => texture.setData(1, 1, null)).toThrow(/\[RES_001\]/);
    });
  });

  describe('setSubData', () => {
    it('uploads sub data', () => {
      const texture = new Texture2D(mockGLContext as GLContext);
      const data = new Uint8Array([0, 0, 0, 0]);
      texture.setSubData(0, 0, 1, 1, data);
      expect(mockGLContext.texSubImage2D).toHaveBeenCalled();
    });

    it('returns this for chaining', () => {
      const texture = new Texture2D(mockGLContext as GLContext);
      const data = new Uint8Array([0, 0, 0, 0]);
      expect(texture.setSubData(0, 0, 1, 1, data)).toBe(texture);
    });

    it('throws for invalid offsets', () => {
      const texture = new Texture2D(mockGLContext as GLContext);
      const data = new Uint8Array([0, 0, 0, 0]);
      expect(() => texture.setSubData(-1, 0, 1, 1, data)).toThrow(/\[RES_002\]/);
      expect(() => texture.setSubData(0, -1, 1, 1, data)).toThrow(/\[RES_002\]/);
    });

    it('throws when disposed', () => {
      const texture = new Texture2D(mockGLContext as GLContext);
      texture.dispose();
      const data = new Uint8Array([0, 0, 0, 0]);
      expect(() => texture.setSubData(0, 0, 1, 1, data)).toThrow(/\[RES_001\]/);
    });
  });

  describe('generateMipmaps', () => {
    it('generates mipmaps', () => {
      const texture = new Texture2D(mockGLContext as GLContext);
      texture.generateMipmaps();
      expect(mockGL.generateMipmap).toHaveBeenCalledWith(mockGL.TEXTURE_2D);
      expect(mockGLContext._checkError).toHaveBeenCalledWith(
        'Texture2D.generateMipmaps()',
      );
    });

    it('returns this for chaining', () => {
      const texture = new Texture2D(mockGLContext as GLContext);
      expect(texture.generateMipmaps()).toBe(texture);
    });

    it('throws when disposed', () => {
      const texture = new Texture2D(mockGLContext as GLContext);
      texture.dispose();
      expect(() => texture.generateMipmaps()).toThrow(/\[RES_001\]/);
    });
  });

  describe('dispose', () => {
    it('deletes texture and marks disposed', () => {
      const texture = new Texture2D(mockGLContext as GLContext);
      texture.dispose();
      expect(mockGL.deleteTexture).toHaveBeenCalledWith(mockTexture);
      expect(mockGLContext._checkError).toHaveBeenCalledWith('Texture2D.dispose()');
      expect(() => texture.bind()).toThrow(/\[RES_001\]/);
    });

    it('is safe to dispose multiple times', () => {
      const texture = new Texture2D(mockGLContext as GLContext);
      texture.dispose();
      expect(() => texture.dispose()).not.toThrow();
      expect(mockGL.deleteTexture).toHaveBeenCalledTimes(1);
    });

    it('throws on texture getter after dispose', () => {
      const texture = new Texture2D(mockGLContext as GLContext);
      texture.dispose();
      expect(() => texture.texture).toThrow(/\[RES_001\]/);
    });
  });

  describe('validation', () => {
    it('rejects invalid alignment values', () => {
      const texture = new Texture2D(mockGLContext as GLContext);
      expect(() => texture.setData(1, 1, null, { alignment: 3 })).toThrow(/\[RES_002\]/);
    });

    it('accepts valid alignment values', () => {
      const texture = new Texture2D(mockGLContext as GLContext);
      expect(() => texture.setData(1, 1, null, { alignment: 1 })).not.toThrow();
      expect(() => texture.setData(1, 1, null, { alignment: 2 })).not.toThrow();
      expect(() => texture.setData(1, 1, null, { alignment: 4 })).not.toThrow();
      expect(() => texture.setData(1, 1, null, { alignment: 8 })).not.toThrow();
    });

    it('rejects NaN values', () => {
      const texture = new Texture2D(mockGLContext as GLContext);
      expect(() => texture.bind(NaN)).toThrow(/finite number/);
      expect(() => texture.setData(NaN, 1, null)).toThrow(/finite number/);
    });

    it('rejects Infinity values', () => {
      const texture = new Texture2D(mockGLContext as GLContext);
      expect(() => texture.bind(Infinity)).toThrow(/finite number/);
      expect(() => texture.setData(1, -Infinity, null)).toThrow(/finite number/);
    });
  });

  describe('filter convenience methods', () => {
    it('setMinFilter sets minification filter', () => {
      const texture = new Texture2D(mockGLContext as GLContext);
      const result = texture.setMinFilter(TextureMinFilter.LINEAR_MIPMAP_LINEAR);
      expect(mockGLContext.texParameteri).toHaveBeenCalledWith(
        mockGL.TEXTURE_2D,
        mockTexture,
        mockGL.TEXTURE_MIN_FILTER,
        TextureMinFilter.LINEAR_MIPMAP_LINEAR,
      );
      expect(result).toBe(texture);
    });

    it('setMagFilter sets magnification filter', () => {
      const texture = new Texture2D(mockGLContext as GLContext);
      const result = texture.setMagFilter(TextureMagFilter.NEAREST);
      expect(mockGLContext.texParameteri).toHaveBeenCalledWith(
        mockGL.TEXTURE_2D,
        mockTexture,
        mockGL.TEXTURE_MAG_FILTER,
        TextureMagFilter.NEAREST,
      );
      expect(result).toBe(texture);
    });

    it('setFilter sets both filters with explicit mag filter', () => {
      const texture = new Texture2D(mockGLContext as GLContext);
      const result = texture.setFilter(
        TextureMinFilter.LINEAR_MIPMAP_LINEAR,
        TextureMagFilter.NEAREST,
      );
      expect(mockGLContext.texParameteri).toHaveBeenCalledWith(
        mockGL.TEXTURE_2D,
        mockTexture,
        mockGL.TEXTURE_MIN_FILTER,
        TextureMinFilter.LINEAR_MIPMAP_LINEAR,
      );
      expect(mockGLContext.texParameteri).toHaveBeenCalledWith(
        mockGL.TEXTURE_2D,
        mockTexture,
        mockGL.TEXTURE_MAG_FILTER,
        TextureMagFilter.NEAREST,
      );
      expect(result).toBe(texture);
    });

    it('setFilter defaults mag to LINEAR for linear min filters', () => {
      const texture = new Texture2D(mockGLContext as GLContext);
      texture.setFilter(TextureMinFilter.LINEAR);
      expect(mockGLContext.texParameteri).toHaveBeenCalledWith(
        mockGL.TEXTURE_2D,
        mockTexture,
        mockGL.TEXTURE_MAG_FILTER,
        TextureMagFilter.LINEAR,
      );
    });

    it('setFilter defaults mag to LINEAR for LINEAR_MIPMAP_NEAREST', () => {
      const texture = new Texture2D(mockGLContext as GLContext);
      texture.setFilter(TextureMinFilter.LINEAR_MIPMAP_NEAREST);
      expect(mockGLContext.texParameteri).toHaveBeenCalledWith(
        mockGL.TEXTURE_2D,
        mockTexture,
        mockGL.TEXTURE_MAG_FILTER,
        TextureMagFilter.LINEAR,
      );
    });

    it('setFilter defaults mag to LINEAR for LINEAR_MIPMAP_LINEAR', () => {
      const texture = new Texture2D(mockGLContext as GLContext);
      texture.setFilter(TextureMinFilter.LINEAR_MIPMAP_LINEAR);
      expect(mockGLContext.texParameteri).toHaveBeenCalledWith(
        mockGL.TEXTURE_2D,
        mockTexture,
        mockGL.TEXTURE_MAG_FILTER,
        TextureMagFilter.LINEAR,
      );
    });

    it('setFilter defaults mag to NEAREST for nearest min filters', () => {
      const texture = new Texture2D(mockGLContext as GLContext);
      texture.setFilter(TextureMinFilter.NEAREST);
      expect(mockGLContext.texParameteri).toHaveBeenCalledWith(
        mockGL.TEXTURE_2D,
        mockTexture,
        mockGL.TEXTURE_MAG_FILTER,
        TextureMagFilter.NEAREST,
      );
    });

    it('setFilter defaults mag to NEAREST for NEAREST_MIPMAP_NEAREST', () => {
      const texture = new Texture2D(mockGLContext as GLContext);
      texture.setFilter(TextureMinFilter.NEAREST_MIPMAP_NEAREST);
      expect(mockGLContext.texParameteri).toHaveBeenCalledWith(
        mockGL.TEXTURE_2D,
        mockTexture,
        mockGL.TEXTURE_MAG_FILTER,
        TextureMagFilter.NEAREST,
      );
    });

    it('setFilter defaults mag to NEAREST for NEAREST_MIPMAP_LINEAR', () => {
      const texture = new Texture2D(mockGLContext as GLContext);
      texture.setFilter(TextureMinFilter.NEAREST_MIPMAP_LINEAR);
      expect(mockGLContext.texParameteri).toHaveBeenCalledWith(
        mockGL.TEXTURE_2D,
        mockTexture,
        mockGL.TEXTURE_MAG_FILTER,
        TextureMagFilter.NEAREST,
      );
    });

    it('filter methods throw when disposed', () => {
      const texture = new Texture2D(mockGLContext as GLContext);
      texture.dispose();
      expect(() => texture.setMinFilter(TextureMinFilter.LINEAR)).toThrow(/\[RES_001\]/);
      expect(() => texture.setMagFilter(TextureMagFilter.LINEAR)).toThrow(/\[RES_001\]/);
      expect(() => texture.setFilter(TextureMinFilter.LINEAR)).toThrow(/\[RES_001\]/);
    });
  });

  describe('wrap convenience methods', () => {
    it('setWrapS sets S wrap mode', () => {
      const texture = new Texture2D(mockGLContext as GLContext);
      const result = texture.setWrapS(TextureWrap.CLAMP_TO_EDGE);
      expect(mockGLContext.texParameteri).toHaveBeenCalledWith(
        mockGL.TEXTURE_2D,
        mockTexture,
        mockGL.TEXTURE_WRAP_S,
        TextureWrap.CLAMP_TO_EDGE,
      );
      expect(result).toBe(texture);
    });

    it('setWrapT sets T wrap mode', () => {
      const texture = new Texture2D(mockGLContext as GLContext);
      const result = texture.setWrapT(TextureWrap.MIRRORED_REPEAT);
      expect(mockGLContext.texParameteri).toHaveBeenCalledWith(
        mockGL.TEXTURE_2D,
        mockTexture,
        mockGL.TEXTURE_WRAP_T,
        TextureWrap.MIRRORED_REPEAT,
      );
      expect(result).toBe(texture);
    });

    it('setWrap sets S and T wrap modes', () => {
      const texture = new Texture2D(mockGLContext as GLContext);
      const result = texture.setWrap(TextureWrap.CLAMP_TO_EDGE);
      expect(mockGLContext.texParameteri).toHaveBeenCalledWith(
        mockGL.TEXTURE_2D,
        mockTexture,
        mockGL.TEXTURE_WRAP_S,
        TextureWrap.CLAMP_TO_EDGE,
      );
      expect(mockGLContext.texParameteri).toHaveBeenCalledWith(
        mockGL.TEXTURE_2D,
        mockTexture,
        mockGL.TEXTURE_WRAP_T,
        TextureWrap.CLAMP_TO_EDGE,
      );
      // Note: Texture2D does NOT have TEXTURE_WRAP_R - only Texture3D and Texture2DArray do
      expect(mockGLContext.texParameteri).toHaveBeenCalledTimes(2);
      expect(result).toBe(texture);
    });

    it('wrap methods throw when disposed', () => {
      const texture = new Texture2D(mockGLContext as GLContext);
      texture.dispose();
      expect(() => texture.setWrapS(TextureWrap.REPEAT)).toThrow(/\[RES_001\]/);
      expect(() => texture.setWrapT(TextureWrap.REPEAT)).toThrow(/\[RES_001\]/);
      expect(() => texture.setWrap(TextureWrap.REPEAT)).toThrow(/\[RES_001\]/);
    });
  });

  describe('allocateStorage', () => {
    it('allocates immutable 2D storage', () => {
      const texture = new Texture2D(mockGLContext as GLContext);
      const result = texture.allocateStorage(4, mockGL.RGBA8, 256, 256);
      expect(mockGLContext.texStorage2D).toHaveBeenCalledWith(
        mockGL.TEXTURE_2D,
        mockTexture,
        4,
        mockGL.RGBA8,
        256,
        256,
      );
      expect(result).toBe(texture);
    });

    it('updates metadata after allocation', () => {
      const texture = new Texture2D(mockGLContext as GLContext);
      texture.allocateStorage(4, mockGL.RGBA8, 512, 512);
      const metadata = texture.metadata;
      expect(metadata.width).toBe(512);
      expect(metadata.height).toBe(512);
      expect(metadata.internalFormat).toBe(mockGL.RGBA8);
      expect(metadata.immutable).toBe(true);
      expect(metadata.storageLevels).toBe(4);
    });

    it('throws for invalid levels', () => {
      const texture = new Texture2D(mockGLContext as GLContext);
      expect(() => texture.allocateStorage(-1, mockGL.RGBA8, 256, 256)).toThrow(
        /\[RES_002\]/,
      );
    });

    it('throws for invalid dimensions', () => {
      const texture = new Texture2D(mockGLContext as GLContext);
      expect(() => texture.allocateStorage(1, mockGL.RGBA8, -1, 256)).toThrow(
        /\[RES_002\]/,
      );
      expect(() => texture.allocateStorage(1, mockGL.RGBA8, 256, -1)).toThrow(
        /\[RES_002\]/,
      );
    });

    it('throws when disposed', () => {
      const texture = new Texture2D(mockGLContext as GLContext);
      texture.dispose();
      expect(() => texture.allocateStorage(1, mockGL.RGBA8, 256, 256)).toThrow(
        /\[RES_001\]/,
      );
    });
  });
});