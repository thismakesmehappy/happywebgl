import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Texture3D } from '../../../src/resources/textures/Texture3D.js';
import { TextureWrap } from '../../../src/resources/textures/Texture.js';
import { GLContext } from '../../../src/core/GLContext.js';

describe('Texture3D', () => {
  let mockGLContext: Partial<GLContext>;
  let mockGL: any;
  let mockTexture: WebGLTexture;

  beforeEach(() => {
    mockTexture = {} as WebGLTexture;
    mockGL = {
      TEXTURE0: 0x84c0,
      TEXTURE_3D: 0x806f,
      TEXTURE_BINDING_3D: 0x806a,
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
        if (pname === 0x806a) return mockTexture;
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
    it('creates and registers a texture with TEXTURE_3D target', () => {
      const texture = new Texture3D(mockGLContext as GLContext);
      expect(mockGLContext.createTexture).toHaveBeenCalledTimes(1);
      expect(mockGLContext.registerTexture).toHaveBeenCalledWith(mockTexture);
      expect(texture.texture).toBe(mockTexture);
      expect(texture.target).toBe(mockGL.TEXTURE_3D);
    });
  });

  describe('queryBinding', () => {
    it('queries 3D texture binding with defaults', () => {
      const bound = Texture3D.queryBinding(mockGLContext as GLContext);
      expect(mockGL.activeTexture).toHaveBeenCalledWith(mockGL.TEXTURE0);
      expect(bound).toBe(mockTexture);
    });

    it('queries 3D texture binding at specific unit', () => {
      Texture3D.queryBinding(mockGLContext as GLContext, 5);
      expect(mockGL.activeTexture).toHaveBeenCalledWith(mockGL.TEXTURE0 + 5);
    });
  });

  describe('setData', () => {
    it('uploads raw 3D data', () => {
      const texture = new Texture3D(mockGLContext as GLContext);
      const data = new Uint8Array(4 * 4 * 4 * 4); // 4x4x4 RGBA
      texture.setData(4, 4, 4, data);
      expect(mockGLContext.texImage3D).toHaveBeenCalledWith(
        mockGL.TEXTURE_3D,
        mockTexture,
        0,
        mockGL.RGBA,
        4,
        4,
        4,
        0,
        mockGL.RGBA,
        mockGL.UNSIGNED_BYTE,
        data,
      );
    });

    it('uploads null data to allocate texture', () => {
      const texture = new Texture3D(mockGLContext as GLContext);
      texture.setData(64, 64, 64, null);
      expect(mockGLContext.texImage3D).toHaveBeenCalled();
    });

    it('generates mipmaps when requested', () => {
      const texture = new Texture3D(mockGLContext as GLContext);
      texture.setData(4, 4, 4, null, { generateMipmaps: true });
      expect(mockGL.generateMipmap).toHaveBeenCalledWith(mockGL.TEXTURE_3D);
    });

    it('returns this for chaining', () => {
      const texture = new Texture3D(mockGLContext as GLContext);
      expect(texture.setData(1, 1, 1, null)).toBe(texture);
    });

    it('throws for invalid dimensions', () => {
      const texture = new Texture3D(mockGLContext as GLContext);
      expect(() => texture.setData(-1, 1, 1, null)).toThrow(/\[RES_002\]/);
      expect(() => texture.setData(1, -1, 1, null)).toThrow(/\[RES_002\]/);
      expect(() => texture.setData(1, 1, -1, null)).toThrow(/\[RES_002\]/);
      expect(() => texture.setData(1.5, 1, 1, null)).toThrow(/\[RES_002\]/);
    });

    it('throws when disposed', () => {
      const texture = new Texture3D(mockGLContext as GLContext);
      texture.dispose();
      expect(() => texture.setData(1, 1, 1, null)).toThrow(/\[RES_001\]/);
    });
  });

  describe('setSubData', () => {
    it('uploads sub-region data', () => {
      const texture = new Texture3D(mockGLContext as GLContext);
      const data = new Uint8Array(2 * 2 * 2 * 4); // 2x2x2 RGBA
      texture.setSubData(0, 0, 0, 2, 2, 2, data);
      expect(mockGLContext.texSubImage3D).toHaveBeenCalledWith(
        mockGL.TEXTURE_3D,
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
      const texture = new Texture3D(mockGLContext as GLContext);
      const data = new Uint8Array(4);
      expect(texture.setSubData(0, 0, 0, 1, 1, 1, data)).toBe(texture);
    });

    it('throws for invalid offsets', () => {
      const texture = new Texture3D(mockGLContext as GLContext);
      const data = new Uint8Array(4);
      expect(() => texture.setSubData(-1, 0, 0, 1, 1, 1, data)).toThrow(/\[RES_002\]/);
      expect(() => texture.setSubData(0, -1, 0, 1, 1, 1, data)).toThrow(/\[RES_002\]/);
      expect(() => texture.setSubData(0, 0, -1, 1, 1, 1, data)).toThrow(/\[RES_002\]/);
    });

    it('throws for invalid dimensions', () => {
      const texture = new Texture3D(mockGLContext as GLContext);
      const data = new Uint8Array(4);
      expect(() => texture.setSubData(0, 0, 0, -1, 1, 1, data)).toThrow(/\[RES_002\]/);
      expect(() => texture.setSubData(0, 0, 0, 1, -1, 1, data)).toThrow(/\[RES_002\]/);
      expect(() => texture.setSubData(0, 0, 0, 1, 1, -1, data)).toThrow(/\[RES_002\]/);
    });

    it('throws when disposed', () => {
      const texture = new Texture3D(mockGLContext as GLContext);
      texture.dispose();
      const data = new Uint8Array(4);
      expect(() => texture.setSubData(0, 0, 0, 1, 1, 1, data)).toThrow(/\[RES_001\]/);
    });
  });

  describe('generateMipmaps', () => {
    it('generates mipmaps for 3D texture', () => {
      const texture = new Texture3D(mockGLContext as GLContext);
      texture.generateMipmaps();
      expect(mockGL.generateMipmap).toHaveBeenCalledWith(mockGL.TEXTURE_3D);
      expect(mockGLContext._checkError).toHaveBeenCalledWith(
        'Texture3D.generateMipmaps()',
      );
    });
  });

  describe('dispose', () => {
    it('deletes texture and marks disposed', () => {
      const texture = new Texture3D(mockGLContext as GLContext);
      texture.dispose();
      expect(mockGL.deleteTexture).toHaveBeenCalledWith(mockTexture);
      expect(mockGLContext._checkError).toHaveBeenCalledWith('Texture3D.dispose()');
      expect(texture.isDisposed).toBe(true);
    });
  });

  describe('setParameters', () => {
    it('sets base parameters plus wrapR', () => {
      const texture = new Texture3D(mockGLContext as GLContext);
      const result = texture.setParameters({
        minFilter: mockGL.TEXTURE_MIN_FILTER,
        wrapR: TextureWrap.CLAMP_TO_EDGE,
      });
      // Base class handles minFilter
      expect(mockGLContext.texParameteri).toHaveBeenCalledWith(
        mockGL.TEXTURE_3D,
        mockTexture,
        mockGL.TEXTURE_MIN_FILTER,
        mockGL.TEXTURE_MIN_FILTER,
      );
      // Texture3D override handles wrapR
      expect(mockGLContext.texParameteri).toHaveBeenCalledWith(
        mockGL.TEXTURE_3D,
        mockTexture,
        mockGL.TEXTURE_WRAP_R,
        TextureWrap.CLAMP_TO_EDGE,
      );
      expect(result).toBe(texture);
    });

    it('skips wrapR if not provided', () => {
      const texture = new Texture3D(mockGLContext as GLContext);
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
      const texture = new Texture3D(mockGLContext as GLContext);
      texture.dispose();
      expect(() => texture.setParameters({ wrapR: TextureWrap.REPEAT })).toThrow(
        /\[RES_001\]/,
      );
    });
  });

  describe('setParametersBound', () => {
    it('sets parameters with single bind/unbind including wrapR', () => {
      const texture = new Texture3D(mockGLContext as GLContext);
      const result = texture.setParametersBound({
        minFilter: mockGL.TEXTURE_MIN_FILTER,
        wrapR: TextureWrap.MIRRORED_REPEAT,
      });
      // Should bind once
      expect(mockGLContext.bindTexture).toHaveBeenCalledTimes(1);
      expect(mockGLContext.bindTexture).toHaveBeenCalledWith(
        mockGL.TEXTURE_3D,
        mockTexture,
      );
      // Should set params directly on gl (not via context wrapper)
      expect(mockGL.texParameteri).toHaveBeenCalledWith(
        mockGL.TEXTURE_3D,
        mockGL.TEXTURE_MIN_FILTER,
        mockGL.TEXTURE_MIN_FILTER,
      );
      expect(mockGL.texParameteri).toHaveBeenCalledWith(
        mockGL.TEXTURE_3D,
        mockGL.TEXTURE_WRAP_R,
        TextureWrap.MIRRORED_REPEAT,
      );
      // Should unbind once
      expect(mockGLContext.unbindTexture).toHaveBeenCalledTimes(1);
      expect(mockGLContext._checkError).toHaveBeenCalledWith(
        'Texture3D.setParametersBound()',
      );
      expect(result).toBe(texture);
    });

    it('throws when disposed', () => {
      const texture = new Texture3D(mockGLContext as GLContext);
      texture.dispose();
      expect(() => texture.setParametersBound({ wrapR: TextureWrap.REPEAT })).toThrow(
        /\[RES_001\]/,
      );
    });
  });

  describe('wrap methods', () => {
    it('setWrapR sets R wrap mode', () => {
      const texture = new Texture3D(mockGLContext as GLContext);
      const result = texture.setWrapR(TextureWrap.REPEAT);
      expect(mockGLContext.texParameteri).toHaveBeenCalledWith(
        mockGL.TEXTURE_3D,
        mockTexture,
        mockGL.TEXTURE_WRAP_R,
        TextureWrap.REPEAT,
      );
      expect(result).toBe(texture);
    });

    it('setWrapR throws when disposed', () => {
      const texture = new Texture3D(mockGLContext as GLContext);
      texture.dispose();
      expect(() => texture.setWrapR(TextureWrap.REPEAT)).toThrow(/\[RES_001\]/);
    });

    it('setWrap sets S, T, and R wrap modes', () => {
      const texture = new Texture3D(mockGLContext as GLContext);
      const result = texture.setWrap(TextureWrap.CLAMP_TO_EDGE);
      expect(mockGLContext.texParameteri).toHaveBeenCalledWith(
        mockGL.TEXTURE_3D,
        mockTexture,
        mockGL.TEXTURE_WRAP_S,
        TextureWrap.CLAMP_TO_EDGE,
      );
      expect(mockGLContext.texParameteri).toHaveBeenCalledWith(
        mockGL.TEXTURE_3D,
        mockTexture,
        mockGL.TEXTURE_WRAP_T,
        TextureWrap.CLAMP_TO_EDGE,
      );
      expect(mockGLContext.texParameteri).toHaveBeenCalledWith(
        mockGL.TEXTURE_3D,
        mockTexture,
        mockGL.TEXTURE_WRAP_R,
        TextureWrap.CLAMP_TO_EDGE,
      );
      expect(mockGLContext.texParameteri).toHaveBeenCalledTimes(3);
      expect(result).toBe(texture);
    });

    it('setWrap throws when disposed', () => {
      const texture = new Texture3D(mockGLContext as GLContext);
      texture.dispose();
      expect(() => texture.setWrap(TextureWrap.REPEAT)).toThrow(/\[RES_001\]/);
    });
  });

  describe('allocateStorage', () => {
    it('allocates immutable 3D storage', () => {
      const texture = new Texture3D(mockGLContext as GLContext);
      const result = texture.allocateStorage(4, mockGL.RGBA8, 64, 64, 64);
      expect(mockGLContext.texStorage3D).toHaveBeenCalledWith(
        mockGL.TEXTURE_3D,
        mockTexture,
        4,
        mockGL.RGBA8,
        64,
        64,
        64,
      );
      expect(result).toBe(texture);
    });

    it('updates metadata after allocation', () => {
      const texture = new Texture3D(mockGLContext as GLContext);
      texture.allocateStorage(4, mockGL.RGBA8, 32, 32, 32);
      const metadata = texture.metadata;
      expect(metadata.width).toBe(32);
      expect(metadata.height).toBe(32);
      expect(metadata.depth).toBe(32);
      expect(metadata.internalFormat).toBe(mockGL.RGBA8);
      expect(metadata.immutable).toBe(true);
      expect(metadata.storageLevels).toBe(4);
    });

    it('throws for invalid levels', () => {
      const texture = new Texture3D(mockGLContext as GLContext);
      expect(() => texture.allocateStorage(-1, mockGL.RGBA8, 64, 64, 64)).toThrow(
        /\[RES_002\]/,
      );
    });

    it('throws for invalid dimensions', () => {
      const texture = new Texture3D(mockGLContext as GLContext);
      expect(() => texture.allocateStorage(1, mockGL.RGBA8, -1, 64, 64)).toThrow(
        /\[RES_002\]/,
      );
      expect(() => texture.allocateStorage(1, mockGL.RGBA8, 64, -1, 64)).toThrow(
        /\[RES_002\]/,
      );
      expect(() => texture.allocateStorage(1, mockGL.RGBA8, 64, 64, -1)).toThrow(
        /\[RES_002\]/,
      );
    });

    it('throws when disposed', () => {
      const texture = new Texture3D(mockGLContext as GLContext);
      texture.dispose();
      expect(() => texture.allocateStorage(1, mockGL.RGBA8, 64, 64, 64)).toThrow(
        /\[RES_001\]/,
      );
    });
  });
});
