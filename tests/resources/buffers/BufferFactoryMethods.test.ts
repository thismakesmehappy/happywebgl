import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  Buffer,
  BufferTarget,
  BufferUsage,
} from '../../../src/resources/buffers/Buffer.js';
import { VertexBuffer } from '../../../src/resources/buffers/VertexBuffer.js';
import { IndexBuffer } from '../../../src/resources/buffers/IndexBuffer.js';
import { CopyReadBuffer } from '../../../src/resources/buffers/CopyReadBuffer.js';
import { CopyWriteBuffer } from '../../../src/resources/buffers/CopyWriteBuffer.js';
import { PixelPackBuffer } from '../../../src/resources/buffers/PixelPackBuffer.js';
import { PixelUnpackBuffer } from '../../../src/resources/buffers/PixelUnpackBuffer.js';
import { TransformFeedbackBuffer } from '../../../src/resources/buffers/TransformFeedbackBuffer.js';
import { UniformBuffer } from '../../../src/resources/buffers/UniformBuffer.js';
import { GLContext } from '../../../src/core/GLContext.js';

/**
 * Test suite for Buffer factory methods
 *
 * Tests static factory methods that create specialized buffer instances:
 * - Buffer.createVertexBuffer()
 * - Buffer.createIndexBuffer()
 * - Buffer.createCopyReadBuffer()
 * - Buffer.createCopyWriteBuffer()
 * - Buffer.createPixelPackBuffer()
 * - Buffer.createPixelUnpackBuffer()
 * - Buffer.createTransformFeedbackBuffer()
 * - Buffer.createUniformBuffer()
 *
 * Factory methods use dynamic imports to avoid circular dependencies
 * and return the correct buffer type with proper default usage.
 */

describe('Buffer Factory Methods', () => {
  let mockGLContext: Partial<GLContext>;
  let mockGL: any;

  beforeEach(() => {
    mockGL = {
      NO_ERROR: 0,
      ARRAY_BUFFER: 0x8892,
      ELEMENT_ARRAY_BUFFER: 0x8893,
      COPY_READ_BUFFER: 0x8f36,
      COPY_WRITE_BUFFER: 0x8f37,
      PIXEL_PACK_BUFFER: 0x88d2,
      PIXEL_UNPACK_BUFFER: 0x88d4,
      TRANSFORM_FEEDBACK_BUFFER: 0x8c8e,
      UNIFORM_BUFFER: 0x8a11,
      STATIC_DRAW: 0x88e4,
      DYNAMIC_DRAW: 0x88e8,
      STREAM_DRAW: 0x88e0,
      STATIC_COPY: 0x8b82,
      DYNAMIC_COPY: 0x88ea,
      STATIC_READ: 0x8b81,
      DYNAMIC_READ: 0x88e9,
      createBuffer: vi.fn(() => ({})),
      bindBuffer: vi.fn(),
      bufferData: vi.fn(),
      bufferSubData: vi.fn(),
      deleteBuffer: vi.fn(),
      getError: vi.fn(() => 0),
    };

    mockGLContext = {
      gl: mockGL as WebGL2RenderingContext,
      registerBuffer: vi.fn(),
    };
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Buffer.createVertexBuffer()', () => {
    it('creates VertexBuffer with correct type and componentSize', async () => {
      const vbo = await Buffer.createVertexBuffer(
        mockGLContext as GLContext,
        3,
      );

      expect(vbo).toBeInstanceOf(VertexBuffer);
      expect(vbo.target).toBe(BufferTarget.ARRAY_BUFFER);
      expect(vbo.componentSize).toBe(3);
    });

    it('creates VertexBuffer with default STATIC_DRAW usage', async () => {
      const vbo = await Buffer.createVertexBuffer(
        mockGLContext as GLContext,
        2,
      );

      expect(vbo.usage).toBe(BufferUsage.STATIC_DRAW);
    });

    it('creates VertexBuffer with custom usage', async () => {
      const vbo = await Buffer.createVertexBuffer(
        mockGLContext as GLContext,
        4,
        BufferUsage.DYNAMIC_DRAW,
      );

      expect(vbo.componentSize).toBe(4);
      expect(vbo.usage).toBe(BufferUsage.DYNAMIC_DRAW);
    });

    it('allows chaining with setData', async () => {
      const vbo = await Buffer.createVertexBuffer(
        mockGLContext as GLContext,
        3,
      );
      const data = new Float32Array([1, 2, 3, 4, 5, 6]);

      vbo.setData(data);

      expect(vbo.length).toBe(6);
      expect(vbo.byteLength).toBe(24);
    });
  });

  describe('Buffer.createIndexBuffer()', () => {
    it('creates IndexBuffer with correct type', async () => {
      const ibo = await Buffer.createIndexBuffer(mockGLContext as GLContext);

      expect(ibo).toBeInstanceOf(IndexBuffer);
      expect(ibo.target).toBe(BufferTarget.ELEMENT_ARRAY_BUFFER);
    });

    it('creates IndexBuffer with default STATIC_DRAW usage', async () => {
      const ibo = await Buffer.createIndexBuffer(mockGLContext as GLContext);

      expect(ibo.usage).toBe(BufferUsage.STATIC_DRAW);
    });

    it('creates IndexBuffer with custom usage', async () => {
      const ibo = await Buffer.createIndexBuffer(
        mockGLContext as GLContext,
        BufferUsage.DYNAMIC_DRAW,
      );

      expect(ibo.usage).toBe(BufferUsage.DYNAMIC_DRAW);
    });

    it('supports typical index data (Uint16Array)', async () => {
      const ibo = await Buffer.createIndexBuffer(mockGLContext as GLContext);
      const indices = new Uint16Array([0, 1, 2, 2, 3, 0]);

      ibo.setData(indices);

      expect(ibo.length).toBe(6);
      expect(ibo.elementByteSize).toBe(2);
    });
  });

  describe('Buffer.createCopyReadBuffer()', () => {
    it('creates CopyReadBuffer with correct type and default usage', async () => {
      const buffer = await Buffer.createCopyReadBuffer(
        mockGLContext as GLContext,
      );

      expect(buffer).toBeInstanceOf(CopyReadBuffer);
      expect(buffer.target).toBe(BufferTarget.COPY_READ_BUFFER);
      expect(buffer.usage).toBe(BufferUsage.STATIC_COPY);
    });

    it('creates CopyReadBuffer with custom usage', async () => {
      const buffer = await Buffer.createCopyReadBuffer(
        mockGLContext as GLContext,
        BufferUsage.DYNAMIC_COPY,
      );

      expect(buffer.usage).toBe(BufferUsage.DYNAMIC_COPY);
    });

    it('supports setData', async () => {
      const buffer = await Buffer.createCopyReadBuffer(
        mockGLContext as GLContext,
      );
      const data = new Float32Array([1, 2, 3, 4]);

      buffer.setData(data);

      expect(buffer.length).toBe(4);
      expect(buffer.byteLength).toBe(16);
    });
  });

  describe('Buffer.createCopyWriteBuffer()', () => {
    it('creates CopyWriteBuffer with correct type and default usage', async () => {
      const buffer = await Buffer.createCopyWriteBuffer(
        mockGLContext as GLContext,
      );

      expect(buffer).toBeInstanceOf(CopyWriteBuffer);
      expect(buffer.target).toBe(BufferTarget.COPY_WRITE_BUFFER);
      expect(buffer.usage).toBe(BufferUsage.STATIC_COPY);
    });

    it('creates CopyWriteBuffer with custom usage', async () => {
      const buffer = await Buffer.createCopyWriteBuffer(
        mockGLContext as GLContext,
        BufferUsage.STREAM_COPY,
      );

      expect(buffer.usage).toBe(BufferUsage.STREAM_COPY);
    });
  });

  describe('Buffer.createPixelPackBuffer()', () => {
    it('creates PixelPackBuffer with correct type and default usage', async () => {
      const buffer = await Buffer.createPixelPackBuffer(
        mockGLContext as GLContext,
      );

      expect(buffer).toBeInstanceOf(PixelPackBuffer);
      expect(buffer.target).toBe(BufferTarget.PIXEL_PACK_BUFFER);
      expect(buffer.usage).toBe(BufferUsage.STATIC_READ);
    });

    it('creates PixelPackBuffer with custom usage', async () => {
      const buffer = await Buffer.createPixelPackBuffer(
        mockGLContext as GLContext,
        BufferUsage.DYNAMIC_READ,
      );

      expect(buffer.usage).toBe(BufferUsage.DYNAMIC_READ);
    });

    it('supports pixel data', async () => {
      const buffer = await Buffer.createPixelPackBuffer(
        mockGLContext as GLContext,
      );
      const pixelData = new Uint8Array([255, 128, 64, 32]);

      buffer.setData(pixelData);

      expect(buffer.length).toBe(4);
      expect(buffer.elementByteSize).toBe(1);
    });
  });

  describe('Buffer.createPixelUnpackBuffer()', () => {
    it('creates PixelUnpackBuffer with correct type and default usage', async () => {
      const buffer = await Buffer.createPixelUnpackBuffer(
        mockGLContext as GLContext,
      );

      expect(buffer).toBeInstanceOf(PixelUnpackBuffer);
      expect(buffer.target).toBe(BufferTarget.PIXEL_UNPACK_BUFFER);
      expect(buffer.usage).toBe(BufferUsage.STATIC_DRAW);
    });

    it('creates PixelUnpackBuffer with custom usage', async () => {
      const buffer = await Buffer.createPixelUnpackBuffer(
        mockGLContext as GLContext,
        BufferUsage.DYNAMIC_DRAW,
      );

      expect(buffer.usage).toBe(BufferUsage.DYNAMIC_DRAW);
    });
  });

  describe('Buffer.createTransformFeedbackBuffer()', () => {
    it('creates TransformFeedbackBuffer with correct type and default usage', async () => {
      const buffer = await Buffer.createTransformFeedbackBuffer(
        mockGLContext as GLContext,
      );

      expect(buffer).toBeInstanceOf(TransformFeedbackBuffer);
      expect(buffer.target).toBe(BufferTarget.TRANSFORM_FEEDBACK_BUFFER);
      expect(buffer.usage).toBe(BufferUsage.STATIC_COPY);
    });

    it('creates TransformFeedbackBuffer with custom usage', async () => {
      const buffer = await Buffer.createTransformFeedbackBuffer(
        mockGLContext as GLContext,
        BufferUsage.DYNAMIC_COPY,
      );

      expect(buffer.usage).toBe(BufferUsage.DYNAMIC_COPY);
    });

    it('supports transform feedback output data', async () => {
      const buffer = await Buffer.createTransformFeedbackBuffer(
        mockGLContext as GLContext,
      );
      const data = new Float32Array([1.0, 2.0, 3.0, 4.0]);

      buffer.setData(data);

      expect(buffer.length).toBe(4);
      expect(buffer.byteLength).toBe(16);
    });
  });

  describe('Buffer.createUniformBuffer()', () => {
    it('creates UniformBuffer with correct type and default usage', async () => {
      const buffer = await Buffer.createUniformBuffer(
        mockGLContext as GLContext,
      );

      expect(buffer).toBeInstanceOf(UniformBuffer);
      expect(buffer.target).toBe(BufferTarget.UNIFORM_BUFFER);
      expect(buffer.usage).toBe(BufferUsage.STATIC_DRAW);
    });

    it('creates UniformBuffer with custom usage', async () => {
      const buffer = await Buffer.createUniformBuffer(
        mockGLContext as GLContext,
        BufferUsage.DYNAMIC_DRAW,
      );

      expect(buffer.usage).toBe(BufferUsage.DYNAMIC_DRAW);
    });

    it('supports uniform block data', async () => {
      const buffer = await Buffer.createUniformBuffer(
        mockGLContext as GLContext,
      );
      const uniformData = new Float32Array(16);
      for (let i = 0; i < 16; i++) {
        uniformData[i] = i * 0.1;
      }

      buffer.setData(uniformData);

      expect(buffer.length).toBe(16);
      expect(buffer.byteLength).toBe(64);
    });
  });

  describe('Factory methods with context validation', () => {
    it('all factory methods reject null context', async () => {
      const nullContext = null as any;

      await expect(
        Buffer.createVertexBuffer(nullContext, 3),
      ).rejects.toThrow();
      await expect(
        Buffer.createIndexBuffer(nullContext),
      ).rejects.toThrow();
      await expect(
        Buffer.createCopyReadBuffer(nullContext),
      ).rejects.toThrow();
    });
  });

  describe('Factory methods return unique instances', () => {
    it('each factory call creates a new buffer instance', async () => {
      const vbo1 = await Buffer.createVertexBuffer(
        mockGLContext as GLContext,
        3,
      );
      const vbo2 = await Buffer.createVertexBuffer(
        mockGLContext as GLContext,
        3,
      );

      // Different instances
      expect(vbo1).not.toBe(vbo2);

      // But same configuration
      expect(vbo1.target).toBe(vbo2.target);
      expect(vbo1.componentSize).toBe(vbo2.componentSize);
      expect(vbo1.usage).toBe(vbo2.usage);
    });

    it('different factory types create different buffer types', async () => {
      const vbo = await Buffer.createVertexBuffer(
        mockGLContext as GLContext,
        3,
      );
      const ibo = await Buffer.createIndexBuffer(mockGLContext as GLContext);
      const uniform = await Buffer.createUniformBuffer(
        mockGLContext as GLContext,
      );

      expect(vbo.target).not.toBe(ibo.target);
      expect(ibo.target).not.toBe(uniform.target);
      expect(uniform.target).not.toBe(vbo.target);
    });
  });

  describe('Factory methods preserve usage defaults across factory calls', () => {
    it('VertexBuffer and IndexBuffer both default to STATIC_DRAW', async () => {
      const vbo = await Buffer.createVertexBuffer(
        mockGLContext as GLContext,
        3,
      );
      const ibo = await Buffer.createIndexBuffer(mockGLContext as GLContext);

      expect(vbo.usage).toBe(BufferUsage.STATIC_DRAW);
      expect(ibo.usage).toBe(BufferUsage.STATIC_DRAW);
    });

    it('Copy buffers default to STATIC_COPY', async () => {
      const read = await Buffer.createCopyReadBuffer(
        mockGLContext as GLContext,
      );
      const write = await Buffer.createCopyWriteBuffer(
        mockGLContext as GLContext,
      );

      expect(read.usage).toBe(BufferUsage.STATIC_COPY);
      expect(write.usage).toBe(BufferUsage.STATIC_COPY);
    });

    it('Pixel buffers have different default usages', async () => {
      const pack = await Buffer.createPixelPackBuffer(
        mockGLContext as GLContext,
      );
      const unpack = await Buffer.createPixelUnpackBuffer(
        mockGLContext as GLContext,
      );

      expect(pack.usage).toBe(BufferUsage.STATIC_READ);
      expect(unpack.usage).toBe(BufferUsage.STATIC_DRAW);
    });
  });

  describe('Factory methods support builder pattern', () => {
    it('VertexBuffer factory result supports method chaining', async () => {
      const vbo = await Buffer.createVertexBuffer(
        mockGLContext as GLContext,
        3,
      );
      const data = new Float32Array([1, 2, 3, 4, 5, 6]);

      // Method chaining should work
      vbo.setData(data).bind();

      expect(vbo.length).toBe(6);
    });

    it('IndexBuffer factory result supports method chaining', async () => {
      const ibo = await Buffer.createIndexBuffer(mockGLContext as GLContext);
      const indices = new Uint16Array([0, 1, 2]);

      // Method chaining should work
      ibo.setData(indices).bind();

      expect(ibo.length).toBe(3);
    });
  });
});