import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { TextureCubeMap, CubeMapFace } from '../../../src/resources/textures/TextureCubeMap.js';
import { GLContext } from '../../../src/core/GLContext.js';

describe('TextureCubeMap', () => {
  let mockGLContext: Partial<GLContext>;
  let mockGL: any;
  let mockTexture: WebGLTexture;

  beforeEach(() => {
    mockTexture = {} as WebGLTexture;
    mockGL = {
      TEXTURE0: 0x84c0,
      TEXTURE_CUBE_MAP: 0x8513,
      TEXTURE_CUBE_MAP_POSITIVE_X: 0x8515,
      TEXTURE_CUBE_MAP_NEGATIVE_X: 0x8516,
      TEXTURE_CUBE_MAP_POSITIVE_Y: 0x8517,
      TEXTURE_CUBE_MAP_NEGATIVE_Y: 0x8518,
      TEXTURE_CUBE_MAP_POSITIVE_Z: 0x8519,
      TEXTURE_CUBE_MAP_NEGATIVE_Z: 0x851a,
      TEXTURE_BINDING_CUBE_MAP: 0x8514,
      TEXTURE_MIN_FILTER: 0x2801,
      TEXTURE_MAG_FILTER: 0x2800,
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
      generateMipmap: vi.fn(),
      pixelStorei: vi.fn(),
      getParameter: vi.fn((pname: number) => {
        if (pname === 0x8514) return mockTexture;
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
      texStorage2D: vi.fn(),
      _checkError: vi.fn(),
    };
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('constructor', () => {
    it('creates and registers a texture with TEXTURE_CUBE_MAP target', () => {
      const texture = new TextureCubeMap(mockGLContext as GLContext);
      expect(mockGLContext.createTexture).toHaveBeenCalledTimes(1);
      expect(mockGLContext.registerTexture).toHaveBeenCalledWith(mockTexture);
      expect(texture.texture).toBe(mockTexture);
      expect(texture.target).toBe(mockGL.TEXTURE_CUBE_MAP);
    });
  });

  describe('queryBinding', () => {
    it('queries cube map binding with defaults', () => {
      const bound = TextureCubeMap.queryBinding(mockGLContext as GLContext);
      expect(mockGL.activeTexture).toHaveBeenCalledWith(mockGL.TEXTURE0);
      expect(bound).toBe(mockTexture);
    });

    it('queries cube map binding at specific unit', () => {
      TextureCubeMap.queryBinding(mockGLContext as GLContext, 2);
      expect(mockGL.activeTexture).toHaveBeenCalledWith(mockGL.TEXTURE0 + 2);
    });
  });

  describe('setFaceImageData', () => {
    it('uploads image data to a face', () => {
      const texture = new TextureCubeMap(mockGLContext as GLContext);
      const image = {} as TexImageSource;
      texture.setFaceImageData(CubeMapFace.POSITIVE_X, image);
      expect(mockGLContext.bindTexture).toHaveBeenCalledWith(
        mockGL.TEXTURE_CUBE_MAP,
        mockTexture,
      );
      expect(mockGL.texImage2D).toHaveBeenCalledWith(
        CubeMapFace.POSITIVE_X,
        0,
        mockGL.RGBA,
        mockGL.RGBA,
        mockGL.UNSIGNED_BYTE,
        image,
      );
      expect(mockGLContext.unbindTexture).toHaveBeenCalledWith(mockGL.TEXTURE_CUBE_MAP);
    });

    it('uploads to all valid faces', () => {
      const faces = [
        CubeMapFace.POSITIVE_X,
        CubeMapFace.NEGATIVE_X,
        CubeMapFace.POSITIVE_Y,
        CubeMapFace.NEGATIVE_Y,
        CubeMapFace.POSITIVE_Z,
        CubeMapFace.NEGATIVE_Z,
      ];
      const texture = new TextureCubeMap(mockGLContext as GLContext);
      const image = {} as TexImageSource;

      for (const face of faces) {
        texture.setFaceImageData(face, image);
      }
      expect(mockGL.texImage2D).toHaveBeenCalledTimes(6);
    });

    it('returns this for chaining', () => {
      const texture = new TextureCubeMap(mockGLContext as GLContext);
      const image = {} as TexImageSource;
      expect(texture.setFaceImageData(CubeMapFace.POSITIVE_X, image)).toBe(texture);
    });

    it('throws for invalid face', () => {
      const texture = new TextureCubeMap(mockGLContext as GLContext);
      const image = {} as TexImageSource;
      expect(() => texture.setFaceImageData(0x9999 as CubeMapFace, image)).toThrow(
        /\[RES_002\]/,
      );
    });

    it('throws when disposed', () => {
      const texture = new TextureCubeMap(mockGLContext as GLContext);
      texture.dispose();
      const image = {} as TexImageSource;
      expect(() => texture.setFaceImageData(CubeMapFace.POSITIVE_X, image)).toThrow(
        /\[RES_001\]/,
      );
    });
  });

  describe('setFaceData', () => {
    it('uploads raw data to a face', () => {
      const texture = new TextureCubeMap(mockGLContext as GLContext);
      const data = new Uint8Array([0, 0, 0, 0]);
      texture.setFaceData(CubeMapFace.NEGATIVE_Y, 1, 1, data);
      expect(mockGLContext.bindTexture).toHaveBeenCalledWith(
        mockGL.TEXTURE_CUBE_MAP,
        mockTexture,
      );
      expect(mockGL.texImage2D).toHaveBeenCalledWith(
        CubeMapFace.NEGATIVE_Y,
        0,
        mockGL.RGBA,
        1,
        1,
        0,
        mockGL.RGBA,
        mockGL.UNSIGNED_BYTE,
        data,
      );
    });

    it('uploads null data to allocate face', () => {
      const texture = new TextureCubeMap(mockGLContext as GLContext);
      texture.setFaceData(CubeMapFace.POSITIVE_Z, 256, 256, null);
      expect(mockGL.texImage2D).toHaveBeenCalled();
    });

    it('returns this for chaining', () => {
      const texture = new TextureCubeMap(mockGLContext as GLContext);
      expect(texture.setFaceData(CubeMapFace.POSITIVE_X, 1, 1, null)).toBe(texture);
    });

    it('throws for invalid dimensions', () => {
      const texture = new TextureCubeMap(mockGLContext as GLContext);
      expect(() =>
        texture.setFaceData(CubeMapFace.POSITIVE_X, -1, 1, null),
      ).toThrow(/\[RES_002\]/);
    });

    it('throws when disposed', () => {
      const texture = new TextureCubeMap(mockGLContext as GLContext);
      texture.dispose();
      expect(() =>
        texture.setFaceData(CubeMapFace.POSITIVE_X, 1, 1, null),
      ).toThrow(/\[RES_001\]/);
    });
  });

  describe('setFaceSubData', () => {
    it('uploads sub data to a face', () => {
      const texture = new TextureCubeMap(mockGLContext as GLContext);
      const data = new Uint8Array([0, 0, 0, 0]);
      texture.setFaceSubData(CubeMapFace.NEGATIVE_Z, 0, 0, 1, 1, data);
      expect(mockGLContext.bindTexture).toHaveBeenCalledWith(
        mockGL.TEXTURE_CUBE_MAP,
        mockTexture,
      );
      expect(mockGL.texSubImage2D).toHaveBeenCalledWith(
        CubeMapFace.NEGATIVE_Z,
        0,
        0,
        0,
        1,
        1,
        mockGL.RGBA,
        mockGL.UNSIGNED_BYTE,
        data,
      );
    });

    it('returns this for chaining', () => {
      const texture = new TextureCubeMap(mockGLContext as GLContext);
      const data = new Uint8Array([0, 0, 0, 0]);
      expect(texture.setFaceSubData(CubeMapFace.POSITIVE_X, 0, 0, 1, 1, data)).toBe(
        texture,
      );
    });

    it('throws for invalid offsets', () => {
      const texture = new TextureCubeMap(mockGLContext as GLContext);
      const data = new Uint8Array([0, 0, 0, 0]);
      expect(() =>
        texture.setFaceSubData(CubeMapFace.POSITIVE_X, -1, 0, 1, 1, data),
      ).toThrow(/\[RES_002\]/);
    });

    it('throws when disposed', () => {
      const texture = new TextureCubeMap(mockGLContext as GLContext);
      texture.dispose();
      const data = new Uint8Array([0, 0, 0, 0]);
      expect(() =>
        texture.setFaceSubData(CubeMapFace.POSITIVE_X, 0, 0, 1, 1, data),
      ).toThrow(/\[RES_001\]/);
    });
  });

  describe('setAllFaces', () => {
    it('uploads images to all 6 faces', () => {
      const texture = new TextureCubeMap(mockGLContext as GLContext);
      const images = {
        positiveX: {} as TexImageSource,
        negativeX: {} as TexImageSource,
        positiveY: {} as TexImageSource,
        negativeY: {} as TexImageSource,
        positiveZ: {} as TexImageSource,
        negativeZ: {} as TexImageSource,
      };
      texture.setAllFaces(images);
      expect(mockGL.texImage2D).toHaveBeenCalledTimes(6);
    });

    it('returns this for chaining', () => {
      const texture = new TextureCubeMap(mockGLContext as GLContext);
      const images = {
        positiveX: {} as TexImageSource,
        negativeX: {} as TexImageSource,
        positiveY: {} as TexImageSource,
        negativeY: {} as TexImageSource,
        positiveZ: {} as TexImageSource,
        negativeZ: {} as TexImageSource,
      };
      expect(texture.setAllFaces(images)).toBe(texture);
    });
  });

  describe('generateMipmaps', () => {
    it('generates mipmaps for cube map', () => {
      const texture = new TextureCubeMap(mockGLContext as GLContext);
      texture.generateMipmaps();
      expect(mockGL.generateMipmap).toHaveBeenCalledWith(mockGL.TEXTURE_CUBE_MAP);
      expect(mockGLContext._checkError).toHaveBeenCalledWith(
        'TextureCubeMap.generateMipmaps()',
      );
    });
  });

  describe('dispose', () => {
    it('deletes texture and marks disposed', () => {
      const texture = new TextureCubeMap(mockGLContext as GLContext);
      texture.dispose();
      expect(mockGL.deleteTexture).toHaveBeenCalledWith(mockTexture);
      expect(mockGLContext._checkError).toHaveBeenCalledWith('TextureCubeMap.dispose()');
      expect(texture.isDisposed).toBe(true);
    });
  });

  describe('allocateStorage', () => {
    it('allocates immutable cube map storage', () => {
      const texture = new TextureCubeMap(mockGLContext as GLContext);
      const result = texture.allocateStorage(4, mockGL.RGBA8, 256);
      expect(mockGLContext.texStorage2D).toHaveBeenCalledWith(
        mockGL.TEXTURE_CUBE_MAP,
        mockTexture,
        4,
        mockGL.RGBA8,
        256,
        256,
      );
      expect(result).toBe(texture);
    });

    it('updates metadata after allocation', () => {
      const texture = new TextureCubeMap(mockGLContext as GLContext);
      texture.allocateStorage(4, mockGL.RGBA8, 512);
      const metadata = texture.metadata;
      expect(metadata.width).toBe(512);
      expect(metadata.height).toBe(512);
      expect(metadata.internalFormat).toBe(mockGL.RGBA8);
      expect(metadata.immutable).toBe(true);
      expect(metadata.storageLevels).toBe(4);
    });

    it('throws for invalid levels', () => {
      const texture = new TextureCubeMap(mockGLContext as GLContext);
      expect(() => texture.allocateStorage(-1, mockGL.RGBA8, 256)).toThrow(/\[RES_002\]/);
    });

    it('throws for invalid size', () => {
      const texture = new TextureCubeMap(mockGLContext as GLContext);
      expect(() => texture.allocateStorage(1, mockGL.RGBA8, -1)).toThrow(/\[RES_002\]/);
    });

    it('throws when disposed', () => {
      const texture = new TextureCubeMap(mockGLContext as GLContext);
      texture.dispose();
      expect(() => texture.allocateStorage(1, mockGL.RGBA8, 256)).toThrow(/\[RES_001\]/);
    });
  });
});