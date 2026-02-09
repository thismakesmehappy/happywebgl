import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  BufferTarget,
  BufferUsage,
} from '../../../src/resources/buffers/Buffer.js';
import { CopyReadBuffer } from '../../../src/resources/buffers/CopyReadBuffer.js';
import { CopyWriteBuffer } from '../../../src/resources/buffers/CopyWriteBuffer.js';
import { PixelPackBuffer } from '../../../src/resources/buffers/PixelPackBuffer.js';
import { PixelUnpackBuffer } from '../../../src/resources/buffers/PixelUnpackBuffer.js';
import { TransformFeedbackBuffer } from '../../../src/resources/buffers/TransformFeedbackBuffer.js';
import { UniformBuffer } from '../../../src/resources/buffers/UniformBuffer.js';
import { GLContext } from '../../../src/core/GLContext.js';

/**
 * Test suite for specialized Buffer subclasses
 *
 * Tests that each specialized buffer type:
 * - Has the correct target
 * - Has the correct default usage
 * - Properly inherits Buffer functionality
 *
 * Covers:
 * - CopyReadBuffer (COPY_READ_BUFFER, STATIC_COPY)
 * - CopyWriteBuffer (COPY_WRITE_BUFFER, STATIC_COPY)
 * - PixelPackBuffer (PIXEL_PACK_BUFFER, STATIC_READ)
 * - PixelUnpackBuffer (PIXEL_UNPACK_BUFFER, STATIC_DRAW)
 * - TransformFeedbackBuffer (TRANSFORM_FEEDBACK_BUFFER, STATIC_COPY)
 * - UniformBuffer (UNIFORM_BUFFER, STATIC_DRAW)
 */

describe('Specialized Buffer Types', () => {
  let mockGLContext: Partial<GLContext>;
  let mockGL: any;

  beforeEach(() => {
    // Create mock GL object with all required methods
    mockGL = {
      NO_ERROR: 0,
      COPY_READ_BUFFER: 0x8f36,
      COPY_WRITE_BUFFER: 0x8f37,
      PIXEL_PACK_BUFFER: 0x88d2,
      PIXEL_UNPACK_BUFFER: 0x88d4,
      TRANSFORM_FEEDBACK_BUFFER: 0x8c8e,
      UNIFORM_BUFFER: 0x8a11,
      STATIC_DRAW: 0x88e4,
      STATIC_COPY: 0x8b82,
      STATIC_READ: 0x8b81,
      createBuffer: vi.fn(() => ({})),
      bindBuffer: vi.fn(),
      bufferData: vi.fn(),
      bufferSubData: vi.fn(),
      deleteBuffer: vi.fn(),
      getError: vi.fn(() => 0),
    };

    // Create mock GLContext
    mockGLContext = {
      gl: mockGL as WebGL2RenderingContext,
      registerBuffer: vi.fn(),
    };
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('CopyReadBuffer', () => {
    it('has correct target (COPY_READ_BUFFER)', () => {
      const buffer = new CopyReadBuffer(mockGLContext as GLContext);
      expect(buffer.target).toBe(BufferTarget.COPY_READ_BUFFER);
    });

    it('has correct default usage (STATIC_COPY)', () => {
      const buffer = new CopyReadBuffer(mockGLContext as GLContext);
      expect(buffer.usage).toBe(BufferUsage.STATIC_COPY);
    });

    it('accepts custom usage', () => {
      const buffer = new CopyReadBuffer(
        mockGLContext as GLContext,
        BufferUsage.DYNAMIC_COPY,
      );
      expect(buffer.usage).toBe(BufferUsage.DYNAMIC_COPY);
    });

    it('supports setData for data upload', () => {
      const buffer = new CopyReadBuffer(mockGLContext as GLContext);
      const data = new Float32Array([1, 2, 3, 4, 5, 6]);

      buffer.setData(data);

      expect(mockGL.bindBuffer).toHaveBeenCalledWith(
        BufferTarget.COPY_READ_BUFFER,
        buffer.buffer,
      );
      expect(mockGL.bufferData).toHaveBeenCalledWith(
        BufferTarget.COPY_READ_BUFFER,
        data,
        BufferUsage.STATIC_COPY,
      );
      expect(buffer.length).toBe(6);
      expect(buffer.byteLength).toBe(24);
    });

    it('supports bind and unbind', () => {
      const buffer = new CopyReadBuffer(mockGLContext as GLContext);
      buffer.bind();
      expect(mockGL.bindBuffer).toHaveBeenCalledWith(
        BufferTarget.COPY_READ_BUFFER,
        buffer.buffer,
      );

      mockGL.bindBuffer.mockClear();
      buffer.unbind();
      expect(mockGL.bindBuffer).toHaveBeenCalledWith(
        BufferTarget.COPY_READ_BUFFER,
        null,
      );
    });
  });

  describe('CopyWriteBuffer', () => {
    it('has correct target (COPY_WRITE_BUFFER)', () => {
      const buffer = new CopyWriteBuffer(mockGLContext as GLContext);
      expect(buffer.target).toBe(BufferTarget.COPY_WRITE_BUFFER);
    });

    it('has correct default usage (STATIC_COPY)', () => {
      const buffer = new CopyWriteBuffer(mockGLContext as GLContext);
      expect(buffer.usage).toBe(BufferUsage.STATIC_COPY);
    });

    it('accepts custom usage', () => {
      const buffer = new CopyWriteBuffer(
        mockGLContext as GLContext,
        BufferUsage.DYNAMIC_COPY,
      );
      expect(buffer.usage).toBe(BufferUsage.DYNAMIC_COPY);
    });

    it('supports setData for data upload', () => {
      const buffer = new CopyWriteBuffer(mockGLContext as GLContext);
      const data = new Float32Array([1, 2, 3]);

      buffer.setData(data);

      expect(mockGL.bindBuffer).toHaveBeenCalledWith(
        BufferTarget.COPY_WRITE_BUFFER,
        buffer.buffer,
      );
      expect(mockGL.bufferData).toHaveBeenCalledWith(
        BufferTarget.COPY_WRITE_BUFFER,
        data,
        BufferUsage.STATIC_COPY,
      );
      expect(buffer.length).toBe(3);
    });
  });

  describe('PixelPackBuffer', () => {
    it('has correct target (PIXEL_PACK_BUFFER)', () => {
      const buffer = new PixelPackBuffer(mockGLContext as GLContext);
      expect(buffer.target).toBe(BufferTarget.PIXEL_PACK_BUFFER);
    });

    it('has correct default usage (STATIC_READ)', () => {
      const buffer = new PixelPackBuffer(mockGLContext as GLContext);
      expect(buffer.usage).toBe(BufferUsage.STATIC_READ);
    });

    it('accepts custom usage', () => {
      const buffer = new PixelPackBuffer(
        mockGLContext as GLContext,
        BufferUsage.DYNAMIC_READ,
      );
      expect(buffer.usage).toBe(BufferUsage.DYNAMIC_READ);
    });

    it('supports setData for buffer allocation', () => {
      const buffer = new PixelPackBuffer(mockGLContext as GLContext);
      const data = new Uint8Array([255, 128, 64, 32]);

      buffer.setData(data);

      expect(mockGL.bindBuffer).toHaveBeenCalledWith(
        BufferTarget.PIXEL_PACK_BUFFER,
        buffer.buffer,
      );
      expect(mockGL.bufferData).toHaveBeenCalledWith(
        BufferTarget.PIXEL_PACK_BUFFER,
        data,
        BufferUsage.STATIC_READ,
      );
      expect(buffer.length).toBe(4);
    });
  });

  describe('PixelUnpackBuffer', () => {
    it('has correct target (PIXEL_UNPACK_BUFFER)', () => {
      const buffer = new PixelUnpackBuffer(mockGLContext as GLContext);
      expect(buffer.target).toBe(BufferTarget.PIXEL_UNPACK_BUFFER);
    });

    it('has correct default usage (STATIC_DRAW)', () => {
      const buffer = new PixelUnpackBuffer(mockGLContext as GLContext);
      expect(buffer.usage).toBe(BufferUsage.STATIC_DRAW);
    });

    it('accepts custom usage', () => {
      const buffer = new PixelUnpackBuffer(
        mockGLContext as GLContext,
        BufferUsage.DYNAMIC_DRAW,
      );
      expect(buffer.usage).toBe(BufferUsage.DYNAMIC_DRAW);
    });

    it('supports setData for pixel data upload', () => {
      const buffer = new PixelUnpackBuffer(mockGLContext as GLContext);
      const data = new Uint8Array([255, 0, 255, 0]);

      buffer.setData(data);

      expect(mockGL.bindBuffer).toHaveBeenCalledWith(
        BufferTarget.PIXEL_UNPACK_BUFFER,
        buffer.buffer,
      );
      expect(mockGL.bufferData).toHaveBeenCalledWith(
        BufferTarget.PIXEL_UNPACK_BUFFER,
        data,
        BufferUsage.STATIC_DRAW,
      );
      expect(buffer.length).toBe(4);
      expect(buffer.elementByteSize).toBe(1);
    });
  });

  describe('TransformFeedbackBuffer', () => {
    it('has correct target (TRANSFORM_FEEDBACK_BUFFER)', () => {
      const buffer = new TransformFeedbackBuffer(mockGLContext as GLContext);
      expect(buffer.target).toBe(BufferTarget.TRANSFORM_FEEDBACK_BUFFER);
    });

    it('has correct default usage (STATIC_COPY)', () => {
      const buffer = new TransformFeedbackBuffer(mockGLContext as GLContext);
      expect(buffer.usage).toBe(BufferUsage.STATIC_COPY);
    });

    it('accepts custom usage', () => {
      const buffer = new TransformFeedbackBuffer(
        mockGLContext as GLContext,
        BufferUsage.DYNAMIC_COPY,
      );
      expect(buffer.usage).toBe(BufferUsage.DYNAMIC_COPY);
    });

    it('supports setData for transform feedback output', () => {
      const buffer = new TransformFeedbackBuffer(mockGLContext as GLContext);
      const data = new Float32Array([1.5, 2.5, 3.5, 4.5]);

      buffer.setData(data);

      expect(mockGL.bindBuffer).toHaveBeenCalledWith(
        BufferTarget.TRANSFORM_FEEDBACK_BUFFER,
        buffer.buffer,
      );
      expect(mockGL.bufferData).toHaveBeenCalledWith(
        BufferTarget.TRANSFORM_FEEDBACK_BUFFER,
        data,
        BufferUsage.STATIC_COPY,
      );
      expect(buffer.length).toBe(4);
      expect(buffer.byteLength).toBe(16);
    });

    it('supports bind and unbind', () => {
      const buffer = new TransformFeedbackBuffer(mockGLContext as GLContext);
      buffer.bind();
      expect(mockGL.bindBuffer).toHaveBeenCalledWith(
        BufferTarget.TRANSFORM_FEEDBACK_BUFFER,
        buffer.buffer,
      );

      mockGL.bindBuffer.mockClear();
      buffer.unbind();
      expect(mockGL.bindBuffer).toHaveBeenCalledWith(
        BufferTarget.TRANSFORM_FEEDBACK_BUFFER,
        null,
      );
    });
  });

  describe('UniformBuffer', () => {
    it('has correct target (UNIFORM_BUFFER)', () => {
      const buffer = new UniformBuffer(mockGLContext as GLContext);
      expect(buffer.target).toBe(BufferTarget.UNIFORM_BUFFER);
    });

    it('has correct default usage (STATIC_DRAW)', () => {
      const buffer = new UniformBuffer(mockGLContext as GLContext);
      expect(buffer.usage).toBe(BufferUsage.STATIC_DRAW);
    });

    it('accepts custom usage', () => {
      const buffer = new UniformBuffer(
        mockGLContext as GLContext,
        BufferUsage.DYNAMIC_DRAW,
      );
      expect(buffer.usage).toBe(BufferUsage.DYNAMIC_DRAW);
    });

    it('supports setData for uniform block data', () => {
      const buffer = new UniformBuffer(mockGLContext as GLContext);
      // Typical uniform block: 4x4 matrix (16 floats = 64 bytes)
      const data = new Float32Array(16);
      for (let i = 0; i < 16; i++) {
        data[i] = i;
      }

      buffer.setData(data);

      expect(mockGL.bindBuffer).toHaveBeenCalledWith(
        BufferTarget.UNIFORM_BUFFER,
        buffer.buffer,
      );
      expect(mockGL.bufferData).toHaveBeenCalledWith(
        BufferTarget.UNIFORM_BUFFER,
        data,
        BufferUsage.STATIC_DRAW,
      );
      expect(buffer.length).toBe(16);
      expect(buffer.byteLength).toBe(64);
    });

    it('supports updateData for uniform updates', () => {
      const buffer = new UniformBuffer(mockGLContext as GLContext);
      const initialData = new Float32Array(16);
      buffer.setData(initialData);

      mockGL.bindBuffer.mockClear();
      mockGL.bufferSubData.mockClear();

      // Update a subset of uniform data
      const updateData = new Float32Array([1.0, 2.0, 3.0, 4.0]);
      buffer.updateData(0, updateData);

      expect(mockGL.bindBuffer).toHaveBeenCalledWith(
        BufferTarget.UNIFORM_BUFFER,
        buffer.buffer,
      );
      expect(mockGL.bufferSubData).toHaveBeenCalledWith(
        BufferTarget.UNIFORM_BUFFER,
        0,
        updateData,
      );
    });
  });

  describe('Buffer target constants', () => {
    it('all targets have correct enum values', () => {
      expect(BufferTarget.COPY_READ_BUFFER).toBe(0x8f36);
      expect(BufferTarget.COPY_WRITE_BUFFER).toBe(0x8f37);
      expect(BufferTarget.PIXEL_PACK_BUFFER).toBe(0x88d2);
      expect(BufferTarget.PIXEL_UNPACK_BUFFER).toBe(0x88d4);
      expect(BufferTarget.TRANSFORM_FEEDBACK_BUFFER).toBe(0x8c8e);
      expect(BufferTarget.UNIFORM_BUFFER).toBe(0x8a11);
    });
  });

  describe('Buffer usage constants for specialized types', () => {
    it('STATIC_COPY has correct value', () => {
      expect(BufferUsage.STATIC_COPY).toBe(0x8b82);
    });

    it('DYNAMIC_COPY has correct value', () => {
      expect(BufferUsage.DYNAMIC_COPY).toBe(0x88ea);
    });

    it('STREAM_COPY has correct value', () => {
      expect(BufferUsage.STREAM_COPY).toBe(0x88e2);
    });

    it('STATIC_READ has correct value', () => {
      expect(BufferUsage.STATIC_READ).toBe(0x8b81);
    });

    it('DYNAMIC_READ has correct value', () => {
      expect(BufferUsage.DYNAMIC_READ).toBe(0x88e9);
    });

    it('STREAM_READ has correct value', () => {
      expect(BufferUsage.STREAM_READ).toBe(0x88e1);
    });
  });

  describe('Integration: multiple specialized buffers together', () => {
    it('can create and use multiple different buffer types', () => {
      const copyRead = new CopyReadBuffer(mockGLContext as GLContext);
      const pixelPack = new PixelPackBuffer(mockGLContext as GLContext);
      const uniform = new UniformBuffer(mockGLContext as GLContext);

      // Each should have different targets
      expect(copyRead.target).not.toBe(pixelPack.target);
      expect(pixelPack.target).not.toBe(uniform.target);
      expect(uniform.target).not.toBe(copyRead.target);

      // Each should have different or same default usages
      expect(copyRead.usage).toBe(BufferUsage.STATIC_COPY);
      expect(pixelPack.usage).toBe(BufferUsage.STATIC_READ);
      expect(uniform.usage).toBe(BufferUsage.STATIC_DRAW);
    });

    it('specialized buffers can be used in parallel', () => {
      const tfBuffer = new TransformFeedbackBuffer(mockGLContext as GLContext);
      const uniformBuffer = new UniformBuffer(mockGLContext as GLContext);

      const tfData = new Float32Array([1, 2, 3, 4]);
      const uniformData = new Float32Array([0.5, 0.5, 0.5, 0.5]);

      tfBuffer.setData(tfData);
      uniformBuffer.setData(uniformData);

      expect(tfBuffer.length).toBe(4);
      expect(uniformBuffer.length).toBe(4);
      expect(tfBuffer.target).not.toBe(uniformBuffer.target);
    });
  });
});