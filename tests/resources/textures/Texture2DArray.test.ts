import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Texture2DArray } from '../../../src/resources/textures/Texture2DArray.js';
import { TextureWrap } from '../../../src/resources/textures/Texture.js';
import { GLContext } from '../../../src/core/GLContext.js';

describe('Texture2DArray', () => {
  let mockGLContext: Partial<GLContext>;
  let mockGL: any;
  let mockTexture: WebGLTexture;

  beforeEach(() => {
    mockTexture = {} as WebGLTexture;
    mockGL = {
      TEXTURE0: 0x84c0,
      TEXTURE_2D_ARRAY: 0x8c1a,
      TEXTURE_BINDING_2D_ARRAY: 0x8c1d,
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
      texParameteri: vi.fn(),
      generateMipmap: vi.fn(),
      pixelStorei: vi.fn(),
      getParameter: vi.fn((pname: number) => {
        if (pname === 0x8c1d) return mockTexture;
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
      texImage3D: vi.fn(),
      texSubImage3D: vi.fn(),
      texStorage3D: vi.fn(),
      texParameteri: vi.fn(),
      texParameterf: vi.fn(),
      _checkError: vi.fn(),
    };
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('constructor', () => {
    it('creates and registers a texture with TEXTURE_2D_ARRAY target', () => {
      const texture = new Texture2DArray(mockGLContext as GLContext);
      expect(mockGLContext.createTexture).toHaveBeenCalledTimes(1);
      expect(mockGLContext.registerTexture).toHaveBeenCalledWith(mockTexture);
      expect(texture.texture).toBe(mockTexture);
      expect(texture.target).toBe(mockGL.TEXTURE_2D_ARRAY);
    });
  });

  describe('queryBinding', () => {
    it('queries 2D array texture binding with defaults', () => {
      const bound = Texture2DArray.queryBinding(mockGLContext as GLContext);
      expect(mockGL.activeTexture).toHaveBeenCalledWith(mockGL.TEXTURE0);
      expect(bound).toBe(mockTexture);
    });

    it('queries 2D array texture binding at specific unit', () => {
      Texture2DArray.queryBinding(mockGLContext as GLContext, 4);
      expect(mockGL.activeTexture).toHaveBeenCalledWith(mockGL.TEXTURE0 + 4);
    });
  });

  describe('setData', () => {
    it('uploads raw data for all layers', () => {
      const texture = new Texture2DArray(mockGLContext as GLContext);
      const data = new Uint8Array(4 * 4 * 3 * 4); // 4x4, 3 layers, RGBA
      texture.setData(4, 4, 3, data);
      expect(mockGLContext.texImage3D).toHaveBeenCalledWith(
        mockGL.TEXTURE_2D_ARRAY,
        mockTexture,
        0,
        mockGL.RGBA,
        4,
        4,
        3,
        0,
        mockGL.RGBA,
        mockGL.UNSIGNED_BYTE,
        data,
      );
    });

    it('uploads null data to allocate texture', () => {
      const texture = new Texture2DArray(mockGLContext as GLContext);
      texture.setData(256, 256, 4, null);
      expect(mockGLContext.texImage3D).toHaveBeenCalled();
    });

    it('generates mipmaps when requested', () => {
      const texture = new Texture2DArray(mockGLContext as GLContext);
      texture.setData(4, 4, 2, null, { generateMipmaps: true });
      expect(mockGL.generateMipmap).toHaveBeenCalledWith(mockGL.TEXTURE_2D_ARRAY);
    });

    it('returns this for chaining', () => {
      const texture = new Texture2DArray(mockGLContext as GLContext);
      expect(texture.setData(1, 1, 1, null)).toBe(texture);
    });

    it('throws for invalid dimensions', () => {
      const texture = new Texture2DArray(mockGLContext as GLContext);
      expect(() => texture.setData(-1, 1, 1, null)).toThrow(/\[RES_002\]/);
      expect(() => texture.setData(1, -1, 1, null)).toThrow(/\[RES_002\]/);
      expect(() => texture.setData(1, 1, -1, null)).toThrow(/\[RES_002\]/);
    });

    it('throws when disposed', () => {
      const texture = new Texture2DArray(mockGLContext as GLContext);
      texture.dispose();
      expect(() => texture.setData(1, 1, 1, null)).toThrow(/\[RES_001\]/);
    });
  });

  describe('setSubData', () => {
    it('uploads sub-region data', () => {
      const texture = new Texture2DArray(mockGLContext as GLContext);
      const data = new Uint8Array(2 * 2 * 2 * 4); // 2x2, 2 layers, RGBA
      texture.setSubData(0, 0, 0, 2, 2, 2, data);
      expect(mockGLContext.texSubImage3D).toHaveBeenCalledWith(
        mockGL.TEXTURE_2D_ARRAY,
        mockTexture,
        0,
        0,
        0,
        0,
        2,
        2,
        2,
        mockGL.RGBA,
        mockGL.UNSIGNED_BYTE,
        data,
      );
    });

    it('returns this for chaining', () => {
      const texture = new Texture2DArray(mockGLContext as GLContext);
      const data = new Uint8Array(4);
      expect(texture.setSubData(0, 0, 0, 1, 1, 1, data)).toBe(texture);
    });

    it('throws for invalid offsets', () => {
      const texture = new Texture2DArray(mockGLContext as GLContext);
      const data = new Uint8Array(4);
      expect(() => texture.setSubData(-1, 0, 0, 1, 1, 1, data)).toThrow(/\[RES_002\]/);
      expect(() => texture.setSubData(0, -1, 0, 1, 1, 1, data)).toThrow(/\[RES_002\]/);
      expect(() => texture.setSubData(0, 0, -1, 1, 1, 1, data)).toThrow(/\[RES_002\]/);
    });

    it('throws for invalid dimensions', () => {
      const texture = new Texture2DArray(mockGLContext as GLContext);
      const data = new Uint8Array(4);
      expect(() => texture.setSubData(0, 0, 0, -1, 1, 1, data)).toThrow(/\[RES_002\]/);
      expect(() => texture.setSubData(0, 0, 0, 1, -1, 1, data)).toThrow(/\[RES_002\]/);
      expect(() => texture.setSubData(0, 0, 0, 1, 1, -1, data)).toThrow(/\[RES_002\]/);
    });

    it('throws when disposed', () => {
      const texture = new Texture2DArray(mockGLContext as GLContext);
      texture.dispose();
      const data = new Uint8Array(4);
      expect(() => texture.setSubData(0, 0, 0, 1, 1, 1, data)).toThrow(/\[RES_001\]/);
    });
  });

  describe('setLayerData', () => {
    it('uploads data to a single layer', () => {
      const texture = new Texture2DArray(mockGLContext as GLContext);
      const data = new Uint8Array(4 * 4 * 4); // 4x4, RGBA
      texture.setLayerData(2, 4, 4, data);
      expect(mockGLContext.texSubImage3D).toHaveBeenCalledWith(
        mockGL.TEXTURE_2D_ARRAY,
        mockTexture,
        0,
        0, // xoffset
        0, // yoffset
        2, // layer (zoffset)
        4, // width
        4, // height
        1, // depth (single layer)
        mockGL.RGBA,
        mockGL.UNSIGNED_BYTE,
        data,
      );
    });

    it('returns this for chaining', () => {
      const texture = new Texture2DArray(mockGLContext as GLContext);
      const data = new Uint8Array(4);
      expect(texture.setLayerData(0, 1, 1, data)).toBe(texture);
    });

    it('throws for invalid layer', () => {
      const texture = new Texture2DArray(mockGLContext as GLContext);
      const data = new Uint8Array(4);
      expect(() => texture.setLayerData(-1, 1, 1, data)).toThrow(/\[RES_002\]/);
    });

    it('throws for invalid dimensions', () => {
      const texture = new Texture2DArray(mockGLContext as GLContext);
      const data = new Uint8Array(4);
      expect(() => texture.setLayerData(0, -1, 1, data)).toThrow(/\[RES_002\]/);
      expect(() => texture.setLayerData(0, 1, -1, data)).toThrow(/\[RES_002\]/);
    });

    it('throws when disposed', () => {
      const texture = new Texture2DArray(mockGLContext as GLContext);
      texture.dispose();
      const data = new Uint8Array(4);
      expect(() => texture.setLayerData(0, 1, 1, data)).toThrow(/\[RES_001\]/);
    });
  });

  describe('generateMipmaps', () => {
    it('generates mipmaps for 2D array texture', () => {
      const texture = new Texture2DArray(mockGLContext as GLContext);
      texture.generateMipmaps();
      expect(mockGL.generateMipmap).toHaveBeenCalledWith(mockGL.TEXTURE_2D_ARRAY);
      expect(mockGLContext._checkError).toHaveBeenCalledWith(
        'Texture2DArray.generateMipmaps()',
      );
    });
  });

  describe('dispose', () => {
    it('deletes texture and marks disposed', () => {
      const texture = new Texture2DArray(mockGLContext as GLContext);
      texture.dispose();
      expect(mockGL.deleteTexture).toHaveBeenCalledWith(mockTexture);
      expect(mockGLContext._checkError).toHaveBeenCalledWith('Texture2DArray.dispose()');
      expect(texture.isDisposed).toBe(true);
    });
  });

  describe('setParameters', () => {
    it('sets base parameters plus wrapR', () => {
      const texture = new Texture2DArray(mockGLContext as GLContext);
      const result = texture.setParameters({
        minFilter: mockGL.TEXTURE_MIN_FILTER,
        wrapR: TextureWrap.CLAMP_TO_EDGE,
      });
      // Base class handles minFilter
      expect(mockGLContext.texParameteri).toHaveBeenCalledWith(
        mockGL.TEXTURE_2D_ARRAY,
        mockTexture,
        mockGL.TEXTURE_MIN_FILTER,
        mockGL.TEXTURE_MIN_FILTER,
      );
      // Texture2DArray override handles wrapR
      expect(mockGLContext.texParameteri).toHaveBeenCalledWith(
        mockGL.TEXTURE_2D_ARRAY,
        mockTexture,
        mockGL.TEXTURE_WRAP_R,
        TextureWrap.CLAMP_TO_EDGE,
      );
      expect(result).toBe(texture);
    });

    it('skips wrapR if not provided', () => {
      const texture = new Texture2DArray(mockGLContext as GLContext);
      texture.setParameters({ minFilter: mockGL.TEXTURE_MIN_FILTER });
      expect(mockGLContext.texParameteri).toHaveBeenCalledTimes(1);
      expect(mockGLContext.texParameteri).not.toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        mockGL.TEXTURE_WRAP_R,
        expect.anything(),
      );
    });

    it('throws when disposed', () => {
      const texture = new Texture2DArray(mockGLContext as GLContext);
      texture.dispose();
      expect(() => texture.setParameters({ wrapR: TextureWrap.REPEAT })).toThrow(
        /\[RES_001\]/,
      );
    });
  });

  describe('setParametersBound', () => {
    it('sets parameters with single bind/unbind including wrapR', () => {
      const texture = new Texture2DArray(mockGLContext as GLContext);
      const result = texture.setParametersBound({
        minFilter: mockGL.TEXTURE_MIN_FILTER,
        wrapR: TextureWrap.MIRRORED_REPEAT,
      });
      // Should bind once
      expect(mockGLContext.bindTexture).toHaveBeenCalledTimes(1);
      expect(mockGLContext.bindTexture).toHaveBeenCalledWith(
        mockGL.TEXTURE_2D_ARRAY,
        mockTexture,
      );
      // Should set params directly on gl (not via context wrapper)
      expect(mockGL.texParameteri).toHaveBeenCalledWith(
        mockGL.TEXTURE_2D_ARRAY,
        mockGL.TEXTURE_MIN_FILTER,
        mockGL.TEXTURE_MIN_FILTER,
      );
      expect(mockGL.texParameteri).toHaveBeenCalledWith(
        mockGL.TEXTURE_2D_ARRAY,
        mockGL.TEXTURE_WRAP_R,
        TextureWrap.MIRRORED_REPEAT,
      );
      // Should unbind once
      expect(mockGLContext.unbindTexture).toHaveBeenCalledTimes(1);
      expect(mockGLContext._checkError).toHaveBeenCalledWith(
        'Texture2DArray.setParametersBound()',
      );
      expect(result).toBe(texture);
    });

    it('throws when disposed', () => {
      const texture = new Texture2DArray(mockGLContext as GLContext);
      texture.dispose();
      expect(() => texture.setParametersBound({ wrapR: TextureWrap.REPEAT })).toThrow(
        /\[RES_001\]/,
      );
    });
  });

  describe('wrap methods', () => {
    it('setWrapR sets R wrap mode', () => {
      const texture = new Texture2DArray(mockGLContext as GLContext);
      const result = texture.setWrapR(TextureWrap.REPEAT);
      expect(mockGLContext.texParameteri).toHaveBeenCalledWith(
        mockGL.TEXTURE_2D_ARRAY,
        mockTexture,
        mockGL.TEXTURE_WRAP_R,
        TextureWrap.REPEAT,
      );
      expect(result).toBe(texture);
    });

    it('setWrapR throws when disposed', () => {
      const texture = new Texture2DArray(mockGLContext as GLContext);
      texture.dispose();
      expect(() => texture.setWrapR(TextureWrap.REPEAT)).toThrow(/\[RES_001\]/);
    });

    it('setWrap sets S, T, and R wrap modes', () => {
      const texture = new Texture2DArray(mockGLContext as GLContext);
      const result = texture.setWrap(TextureWrap.CLAMP_TO_EDGE);
      expect(mockGLContext.texParameteri).toHaveBeenCalledWith(
        mockGL.TEXTURE_2D_ARRAY,
        mockTexture,
        mockGL.TEXTURE_WRAP_S,
        TextureWrap.CLAMP_TO_EDGE,
      );
      expect(mockGLContext.texParameteri).toHaveBeenCalledWith(
        mockGL.TEXTURE_2D_ARRAY,
        mockTexture,
        mockGL.TEXTURE_WRAP_T,
        TextureWrap.CLAMP_TO_EDGE,
      );
      expect(mockGLContext.texParameteri).toHaveBeenCalledWith(
        mockGL.TEXTURE_2D_ARRAY,
        mockTexture,
        mockGL.TEXTURE_WRAP_R,
        TextureWrap.CLAMP_TO_EDGE,
      );
      expect(mockGLContext.texParameteri).toHaveBeenCalledTimes(3);
      expect(result).toBe(texture);
    });

    it('setWrap throws when disposed', () => {
      const texture = new Texture2DArray(mockGLContext as GLContext);
      texture.dispose();
      expect(() => texture.setWrap(TextureWrap.REPEAT)).toThrow(/\[RES_001\]/);
    });
  });

  describe('allocateStorage', () => {
    it('allocates immutable 2D array storage', () => {
      const texture = new Texture2DArray(mockGLContext as GLContext);
      const result = texture.allocateStorage(4, mockGL.RGBA8, 256, 256, 8);
      expect(mockGLContext.texStorage3D).toHaveBeenCalledWith(
        mockGL.TEXTURE_2D_ARRAY,
        mockTexture,
        4,
        mockGL.RGBA8,
        256,
        256,
        8,
      );
      expect(result).toBe(texture);
    });

    it('updates metadata after allocation', () => {
      const texture = new Texture2DArray(mockGLContext as GLContext);
      texture.allocateStorage(4, mockGL.RGBA8, 128, 128, 4);
      const metadata = texture.metadata;
      expect(metadata.width).toBe(128);
      expect(metadata.height).toBe(128);
      expect(metadata.layers).toBe(4);
      expect(metadata.internalFormat).toBe(mockGL.RGBA8);
      expect(metadata.immutable).toBe(true);
      expect(metadata.storageLevels).toBe(4);
    });

    it('throws for invalid levels', () => {
      const texture = new Texture2DArray(mockGLContext as GLContext);
      expect(() => texture.allocateStorage(-1, mockGL.RGBA8, 256, 256, 4)).toThrow(
        /\[RES_002\]/,
      );
    });

    it('throws for invalid dimensions', () => {
      const texture = new Texture2DArray(mockGLContext as GLContext);
      expect(() => texture.allocateStorage(1, mockGL.RGBA8, -1, 256, 4)).toThrow(
        /\[RES_002\]/,
      );
      expect(() => texture.allocateStorage(1, mockGL.RGBA8, 256, -1, 4)).toThrow(
        /\[RES_002\]/,
      );
      expect(() => texture.allocateStorage(1, mockGL.RGBA8, 256, 256, -1)).toThrow(
        /\[RES_002\]/,
      );
    });

    it('throws when disposed', () => {
      const texture = new Texture2DArray(mockGLContext as GLContext);
      texture.dispose();
      expect(() => texture.allocateStorage(1, mockGL.RGBA8, 256, 256, 4)).toThrow(
        /\[RES_001\]/,
      );
    });
  });
});
