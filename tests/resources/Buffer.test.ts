import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  Buffer,
  BufferTarget,
  BufferUsage,
  ElementType,
} from '../../src/resources/buffers/Buffer.js';
import { VertexBuffer } from '../../src/resources/buffers/VertexBuffer.js';
import { IndexBuffer } from '../../src/resources/buffers/IndexBuffer.js';
import { GLContext } from '../../src/core/GLContext.js';

/**
 * Test suite for Buffer (GPU buffer abstraction)
 *
 * Tests buffer functionality including:
 * - Construction and initialization
 * - Data upload and updates
 * - Binding and unbinding
 * - Error handling
 * - Resource cleanup
 */

/**
 * TestBuffer: Concrete implementation of abstract Buffer class for testing
 * Follows the same pattern as TestVector in math tests
 */
class TestBuffer extends Buffer {
  constructor(
    ctx: GLContext,
    target: BufferTarget,
    usage: BufferUsage = BufferUsage.STATIC_DRAW,
  ) {
    super(ctx, target, usage);
  }
}

describe('Buffer', () => {
  let mockGLContext: Partial<GLContext>;
  let mockGL: any;

  beforeEach(() => {
    // Create mock GL object with all required methods
    mockGL = {
      NO_ERROR: 0,
      ARRAY_BUFFER: 0x8892,
      ELEMENT_ARRAY_BUFFER: 0x8893,
      STATIC_DRAW: 0x88e4,
      DYNAMIC_DRAW: 0x88e8,
      STREAM_DRAW: 0x88e0,
      BUFFER_SIZE: 0x8764,
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

  describe('constructor', () => {
    it('creates buffer with default usage', () => {
      const buffer = new TestBuffer(
        mockGLContext as GLContext,
        BufferTarget.ARRAY_BUFFER,
      );
      expect(buffer).toBeDefined();
      expect(buffer.target).toBe(BufferTarget.ARRAY_BUFFER);
      expect(buffer.usage).toBe(BufferUsage.STATIC_DRAW);
    });

    it('creates buffer with specified usage', () => {
      const buffer = new TestBuffer(
        mockGLContext as GLContext,
        BufferTarget.ELEMENT_ARRAY_BUFFER,
        BufferUsage.DYNAMIC_DRAW,
      );
      expect(buffer).toBeDefined();
      expect(buffer.target).toBe(BufferTarget.ELEMENT_ARRAY_BUFFER);
      expect(buffer.usage).toBe(BufferUsage.DYNAMIC_DRAW);
    });

    it('throws error if context is null', () => {
      expect(() => {
        new TestBuffer(null as any, BufferTarget.ARRAY_BUFFER);
      }).toThrow(/GLContext is required/);
    });

    it('throws error if context is undefined', () => {
      expect(() => {
        new TestBuffer(undefined as any, BufferTarget.ARRAY_BUFFER);
      }).toThrow(/GLContext is required/);
    });

    it('throws error if buffer creation fails', () => {
      mockGL.createBuffer.mockReturnValueOnce(null);
      expect(() => {
        new TestBuffer(mockGLContext as GLContext, BufferTarget.ARRAY_BUFFER);
      }).toThrow(/Failed to create WebGL buffer/);
    });

    it('creates both VBO and IBO', () => {
      const vbo = new TestBuffer(
        mockGLContext as GLContext,
        BufferTarget.ARRAY_BUFFER,
      );
      const ibo = new TestBuffer(
        mockGLContext as GLContext,
        BufferTarget.ELEMENT_ARRAY_BUFFER,
      );

      expect(vbo.target).toBe(BufferTarget.ARRAY_BUFFER);
      expect(ibo.target).toBe(BufferTarget.ELEMENT_ARRAY_BUFFER);
    });
  });

  describe('properties', () => {
    let buffer: Buffer;

    beforeEach(() => {
      buffer = new TestBuffer(
        mockGLContext as GLContext,
        BufferTarget.ARRAY_BUFFER,
      );
    });

    it('returns correct target', () => {
      expect(buffer.target).toBe(BufferTarget.ARRAY_BUFFER);
    });

    it('returns correct usage', () => {
      expect(buffer.usage).toBe(BufferUsage.STATIC_DRAW);
    });

    it('returns initial length of 0', () => {
      expect(buffer.length).toBe(0);
    });

    it('has buffer property for WebGL use', () => {
      expect(buffer.buffer).toBeDefined();
    });
  });

  describe('setData', () => {
    let buffer: Buffer;

    beforeEach(() => {
      buffer = new TestBuffer(
        mockGLContext as GLContext,
        BufferTarget.ARRAY_BUFFER,
      );
    });

    it('uploads Float32Array data', () => {
      const data = new Float32Array([1, 2, 3, 4, 5, 6]);
      buffer.setData(data);

      expect(mockGL.bindBuffer).toHaveBeenCalledWith(
        BufferTarget.ARRAY_BUFFER,
        buffer.buffer,
      );
      expect(mockGL.bufferData).toHaveBeenCalledWith(
        BufferTarget.ARRAY_BUFFER,
        data,
        BufferUsage.STATIC_DRAW,
      );
      expect(mockGL.bindBuffer).toHaveBeenCalledWith(
        BufferTarget.ARRAY_BUFFER,
        null,
      );
      expect(buffer.length).toBe(6);
    });

    it.each([
      ['Uint16Array', new Uint16Array([0, 1, 2, 3]), 4],
      ['Uint32Array', new Uint32Array([0, 1, 2, 3, 4]), 5],
    ])('uploads %s data', (_label, data, expectedLength) => {
      buffer.setData(data);

      expect(mockGL.bufferData).toHaveBeenCalledWith(
        BufferTarget.ARRAY_BUFFER,
        data,
        BufferUsage.STATIC_DRAW,
      );
      expect(buffer.length).toBe(expectedLength);
    });

    it('respects custom usage hint', () => {
      const data = new Float32Array([1, 2, 3]);
      buffer.setData(data, BufferUsage.DYNAMIC_DRAW);

      expect(mockGL.bufferData).toHaveBeenCalledWith(
        BufferTarget.ARRAY_BUFFER,
        data,
        BufferUsage.DYNAMIC_DRAW,
      );
      expect(buffer.usage).toBe(BufferUsage.DYNAMIC_DRAW);
    });

    it('handles null data', () => {
      buffer.setData(null);

      expect(mockGL.bufferData).toHaveBeenCalledWith(
        BufferTarget.ARRAY_BUFFER,
        null,
        BufferUsage.STATIC_DRAW,
      );
      expect(buffer.length).toBe(0);
    });

    it('throws error on WebGL error', () => {
      mockGL.getError.mockReturnValueOnce(1280); // GL_INVALID_ENUM

      const data = new Float32Array([1, 2, 3]);
      expect(() => {
        buffer.setData(data);
      }).toThrow(/failed with WebGL error/);
    });

    it('binds and unbinds buffer around data upload', () => {
      const data = new Float32Array([1, 2, 3]);
      buffer.setData(data);

      // Check binding sequence
      const bindCalls = mockGL.bindBuffer.mock.calls;
      expect(bindCalls[0]).toEqual([BufferTarget.ARRAY_BUFFER, buffer.buffer]);
      expect(bindCalls[bindCalls.length - 1]).toEqual([
        BufferTarget.ARRAY_BUFFER,
        null,
      ]);
    });

    it('handles multiple data uploads', () => {
      const data1 = new Float32Array([1, 2, 3]);
      const data2 = new Float32Array([4, 5, 6, 7]);

      buffer.setData(data1);
      expect(buffer.length).toBe(3);

      mockGL.bufferData.mockClear();
      buffer.setData(data2);
      expect(buffer.length).toBe(4);
    });

    it('supports index buffer with element array target', () => {
      const buffer = new TestBuffer(
        mockGLContext as GLContext,
        BufferTarget.ELEMENT_ARRAY_BUFFER,
      );
      const indices = new Uint16Array([0, 1, 2, 1, 3, 2]);

      buffer.setData(indices);

      expect(mockGL.bindBuffer).toHaveBeenCalledWith(
        BufferTarget.ELEMENT_ARRAY_BUFFER,
        buffer.buffer,
      );
      expect(buffer.length).toBe(6);
    });
  });

  describe('bind and unbind', () => {
    let buffer: Buffer;

    beforeEach(() => {
      buffer = new TestBuffer(
        mockGLContext as GLContext,
        BufferTarget.ARRAY_BUFFER,
      );
    });

    it('binds buffer to target', () => {
      buffer.bind();

      expect(mockGL.bindBuffer).toHaveBeenCalledWith(
        BufferTarget.ARRAY_BUFFER,
        buffer.buffer,
      );
    });

    it('unbinds buffer from target', () => {
      buffer.unbind();

      expect(mockGL.bindBuffer).toHaveBeenCalledWith(
        BufferTarget.ARRAY_BUFFER,
        null,
      );
    });

    it('multiple bind/unbind cycles', () => {
      for (let i = 0; i < 3; i++) {
        buffer.bind();
        buffer.unbind();
      }

      expect(mockGL.bindBuffer).toHaveBeenCalledTimes(6);
    });
  });

  describe('updateData', () => {
    let buffer: Buffer;

    beforeEach(() => {
      buffer = new TestBuffer(
        mockGLContext as GLContext,
        BufferTarget.ARRAY_BUFFER,
      );
      const initialData = new Float32Array([1, 2, 3, 4, 5, 6]);
      buffer.setData(initialData);

      // Mock byteLength query to return 24 bytes (6 floats * 4 bytes)
      mockGL.getBufferParameter = vi.fn(() => 24);

      // Reset mocks after initial setup
      mockGL.bindBuffer.mockClear();
      mockGL.bufferSubData.mockClear();
    });

    it('updates buffer data at offset', () => {
      const newData = new Float32Array([10, 11, 12]);
      buffer.updateData(0, newData);

      expect(mockGL.bindBuffer).toHaveBeenCalledWith(
        BufferTarget.ARRAY_BUFFER,
        buffer.buffer,
      );
      expect(mockGL.bufferSubData).toHaveBeenCalledWith(
        BufferTarget.ARRAY_BUFFER,
        0,
        newData,
      );
      expect(mockGL.bindBuffer).toHaveBeenCalledWith(
        BufferTarget.ARRAY_BUFFER,
        null,
      );
    });

    it('updates data at non-zero offset', () => {
      const newData = new Float32Array([99, 100]);
      buffer.updateData(12, newData); // 12 bytes = 3 floats offset

      expect(mockGL.bufferSubData).toHaveBeenCalledWith(
        BufferTarget.ARRAY_BUFFER,
        12,
        newData,
      );
    });

    it('throws error if buffer has no data', () => {
      const emptyBuffer = new TestBuffer(
        mockGLContext as GLContext,
        BufferTarget.ARRAY_BUFFER,
      );
      const data = new Float32Array([1, 2, 3]);

      expect(() => {
        emptyBuffer.updateData(0, data);
      }).toThrow(/Buffer has no data/);
    });

    it('throws error for negative offset', () => {
      const data = new Float32Array([1, 2, 3]);

      expect(() => {
        buffer.updateData(-1, data);
      }).toThrow(/Offset must be non-negative/);
    });

    it('throws error for data type mismatch', () => {
      const data = new Uint16Array([1, 2, 3]);

      expect(() => {
        buffer.updateData(0, data);
      }).toThrow(/Data type mismatch/);
    });

    it('throws error for unsupported data type', () => {
      const arrayBuf = new ArrayBuffer(12);
      const dataView = new DataView(arrayBuf);

      expect(() => {
        buffer.updateData(0, dataView as any);
      }).toThrow(/Cannot infer type/);
    });

    it('throws error on buffer overflow', () => {
      const data = new Float32Array([1, 2, 3, 4, 5, 6, 7]); // 28 bytes

      expect(() => {
        buffer.updateData(0, data); // 24 bytes available, need 28 bytes - overflow
      }).toThrow(/overflow/);
    });

    it('throws error on offset overflow', () => {
      const data = new Float32Array([1, 2]); // 8 bytes

      expect(() => {
        buffer.updateData(20, data); // offset 20 + 8 bytes = 28 > 24 available
      }).toThrow(/overflow/);
    });

    it('throws error on WebGL error', () => {
      mockGL.getError.mockReturnValueOnce(1282); // GL_INVALID_OPERATION

      const data = new Float32Array([1, 2, 3]);

      expect(() => {
        buffer.updateData(0, data);
      }).toThrow(/failed with WebGL error/);
    });
  });

  describe('updateDataUnsafe', () => {
    let buffer: Buffer;

    beforeEach(() => {
      buffer = new TestBuffer(
        mockGLContext as GLContext,
        BufferTarget.ARRAY_BUFFER,
      );
      const initialData = new Float32Array([1, 2, 3, 4, 5, 6]);
      buffer.setData(initialData);

      // Reset mocks after initial setup
      mockGL.bindBuffer.mockClear();
      mockGL.bufferSubData.mockClear();
    });

    it('allows type reinterpretation without validation', () => {
      // Float32 buffer, but update with Uint8Array
      const data = new Uint8Array([0xFF, 0x00, 0xFF, 0x00]);
      buffer.updateDataUnsafe(0, data);

      expect(mockGL.bufferSubData).toHaveBeenCalledWith(
        BufferTarget.ARRAY_BUFFER,
        0,
        data,
      );
    });

    it('allows arbitrary offset without bounds checking', () => {
      // No bounds validation - unsafe
      const data = new Uint8Array([1, 2, 3]);
      buffer.updateDataUnsafe(1000, data); // Far past buffer end

      expect(mockGL.bufferSubData).toHaveBeenCalledWith(
        BufferTarget.ARRAY_BUFFER,
        1000,
        data,
      );
    });

    it('allows DataView without type inference', () => {
      const arrayBuf = new ArrayBuffer(12);
      const dataView = new DataView(arrayBuf);
      buffer.updateDataUnsafe(0, dataView);

      expect(mockGL.bufferSubData).toHaveBeenCalledWith(
        BufferTarget.ARRAY_BUFFER,
        0,
        dataView,
      );
    });

    it('still requires buffer to have data', () => {
      const emptyBuffer = new TestBuffer(
        mockGLContext as GLContext,
        BufferTarget.ARRAY_BUFFER,
      );
      const data = new Uint8Array([1, 2, 3]);

      expect(() => {
        emptyBuffer.updateDataUnsafe(0, data);
      }).toThrow(/Buffer has no data/);
    });

    it('still requires non-negative offset', () => {
      const data = new Uint8Array([1, 2, 3]);

      expect(() => {
        buffer.updateDataUnsafe(-1, data);
      }).toThrow(/Offset must be non-negative/);
    });

    it('throws error on WebGL API failure', () => {
      mockGL.getError.mockReturnValueOnce(1282);

      const data = new Uint8Array([1, 2, 3]);

      expect(() => {
        buffer.updateDataUnsafe(0, data);
      }).toThrow(/failed with WebGL error/);
    });
  });

  describe('dispose', () => {
    let buffer: Buffer;

    beforeEach(() => {
      buffer = new TestBuffer(
        mockGLContext as GLContext,
        BufferTarget.ARRAY_BUFFER,
      );
    });

    it('deletes WebGL buffer', () => {
      const bufferRef = buffer.buffer;
      buffer.dispose();

      expect(mockGL.deleteBuffer).toHaveBeenCalledWith(bufferRef);
    });

    it('clears buffer reference after disposal', () => {
      const bufferRef = buffer.buffer;
      buffer.dispose();

      // After dispose, buffer property should be null
      expect((buffer as any)._buffer).toBeNull();
    });

    it('can dispose multiple times safely', () => {
      buffer.dispose();
      buffer.dispose(); // Should not throw

      expect(mockGL.deleteBuffer).toHaveBeenCalled();
    });
  });

  describe('element type metadata', () => {
    let buffer: Buffer;

    beforeEach(() => {
      buffer = new TestBuffer(
        mockGLContext as GLContext,
        BufferTarget.ARRAY_BUFFER,
      );
    });

    it('stores Int8Array metadata', () => {
      const data = new Int8Array([1, 2, 3]);
      buffer.setData(data);
      expect(buffer.elementByteSize).toBe(1);
      expect(buffer.elementType).toBe(ElementType.BYTE);
      expect(buffer.length).toBe(3);
    });

    it('stores Uint8Array metadata', () => {
      const data = new Uint8Array([255, 128, 64]);
      buffer.setData(data);
      expect(buffer.elementByteSize).toBe(1);
      expect(buffer.elementType).toBe(ElementType.UBYTE);
      expect(buffer.length).toBe(3);
    });

    it('stores Uint8ClampedArray metadata', () => {
      const data = new Uint8ClampedArray([255, 128, 64]);
      buffer.setData(data);
      expect(buffer.elementByteSize).toBe(1);
      expect(buffer.elementType).toBe(ElementType.UBYTE_CLAMPED);
      expect(buffer.length).toBe(3);
    });

    it('stores Int16Array metadata', () => {
      const data = new Int16Array([1000, -1000, 500]);
      buffer.setData(data);
      expect(buffer.elementByteSize).toBe(2);
      expect(buffer.elementType).toBe(ElementType.SHORT);
      expect(buffer.length).toBe(3);
    });

    it('stores Uint16Array metadata', () => {
      const data = new Uint16Array([65535, 32768, 16384]);
      buffer.setData(data);
      expect(buffer.elementByteSize).toBe(2);
      expect(buffer.elementType).toBe(ElementType.USHORT);
      expect(buffer.length).toBe(3);
    });

    it('stores Int32Array metadata', () => {
      const data = new Int32Array([1000000, -1000000, 500000]);
      buffer.setData(data);
      expect(buffer.elementByteSize).toBe(4);
      expect(buffer.elementType).toBe(ElementType.INT);
      expect(buffer.length).toBe(3);
    });

    it('stores Uint32Array metadata', () => {
      const data = new Uint32Array([4000000000, 2000000000, 1000000000]);
      buffer.setData(data);
      expect(buffer.elementByteSize).toBe(4);
      expect(buffer.elementType).toBe(ElementType.UINT);
      expect(buffer.length).toBe(3);
    });

    it('stores Float32Array metadata', () => {
      const data = new Float32Array([1.5, 2.5, 3.5]);
      buffer.setData(data);
      expect(buffer.elementByteSize).toBe(4);
      expect(buffer.elementType).toBe(ElementType.FLOAT);
      expect(buffer.length).toBe(3);
    });

    it('stores Float64Array metadata', () => {
      const data = new Float64Array([1.5, 2.5, 3.5]);
      buffer.setData(data);
      expect(buffer.elementByteSize).toBe(8);
      expect(buffer.elementType).toBe(ElementType.DOUBLE);
      expect(buffer.length).toBe(3);
    });

    it('stores BigInt64Array metadata', () => {
      const data = new BigInt64Array([BigInt(1), BigInt(2), BigInt(3)]);
      buffer.setData(data);
      expect(buffer.elementByteSize).toBe(8);
      expect(buffer.elementType).toBe(ElementType.BIGINT64);
      expect(buffer.length).toBe(3);
    });

    it('stores BigUint64Array metadata', () => {
      const data = new BigUint64Array([BigInt(1), BigInt(2), BigInt(3)]);
      buffer.setData(data);
      expect(buffer.elementByteSize).toBe(8);
      expect(buffer.elementType).toBe(ElementType.BIGUINT64);
      expect(buffer.length).toBe(3);
    });

    it('clears metadata when setting null data', () => {
      buffer.setData(new Float32Array([1, 2, 3]));
      expect(buffer.elementByteSize).toBe(4);
      expect(buffer.elementType).toBe(ElementType.FLOAT);

      buffer.setData(null);
      expect(buffer.elementByteSize).toBe(0);
      expect(buffer.elementType).toBeNull();
      expect(buffer.length).toBe(0);
    });

    it('throws error for unsupported data type (DataView)', () => {
      const arrayBuf = new ArrayBuffer(24);
      const dataView = new DataView(arrayBuf);
      expect(() => {
        buffer.setData(dataView as any);
      }).toThrow(/Cannot infer element type/);
    });

    it('stores metadata after multiple setData calls', () => {
      buffer.setData(new Float32Array([1, 2, 3]));
      expect(buffer.elementType).toBe(ElementType.FLOAT);
      expect(buffer.elementByteSize).toBe(4);

      buffer.setData(new Uint16Array([0, 1, 2, 3]));
      expect(buffer.elementType).toBe(ElementType.USHORT);
      expect(buffer.elementByteSize).toBe(2);
      expect(buffer.length).toBe(4);
    });
  });

  describe('setDataRaw', () => {
    let buffer: Buffer;

    beforeEach(() => {
      buffer = new TestBuffer(
        mockGLContext as GLContext,
        BufferTarget.ARRAY_BUFFER,
      );
    });

    it('sets data with explicit element byte size', () => {
      const data = new ArrayBuffer(16); // 16 bytes
      buffer.setDataRaw(data, 4); // 4 bytes per element = 4 elements

      expect(buffer.length).toBe(4);
      expect(buffer.elementByteSize).toBe(4);
      expect(buffer.elementType).toBeNull();
    });

    it('sets data with element type', () => {
      const data = new ArrayBuffer(12);
      buffer.setDataRaw(data, 2, ElementType.USHORT);

      expect(buffer.length).toBe(6);
      expect(buffer.elementByteSize).toBe(2);
      expect(buffer.elementType).toBe(ElementType.USHORT);
    });

    it('handles DataView with element byte size', () => {
      const arrayBuf = new ArrayBuffer(32);
      const dataView = new DataView(arrayBuf);
      buffer.setDataRaw(dataView, 8);

      expect(buffer.length).toBe(4);
      expect(buffer.elementByteSize).toBe(8);
    });

    it('validates element byte size', () => {
      const data = new ArrayBuffer(16);
      expect(() => {
        buffer.setDataRaw(data, 0);
      }).toThrow(/elementByteSize must be 1, 2, 4, or 8/);

      expect(() => {
        buffer.setDataRaw(data, 3);
      }).toThrow(/elementByteSize must be 1, 2, 4, or 8/);

      expect(() => {
        buffer.setDataRaw(data, 16);
      }).toThrow(/elementByteSize must be 1, 2, 4, or 8/);
    });

    it('validates data size is multiple of element byte size', () => {
      const data = new ArrayBuffer(15); // Not divisible by 4
      expect(() => {
        buffer.setDataRaw(data, 4);
      }).toThrow(/not a multiple of/);
    });

    it('handles null data', () => {
      buffer.setDataRaw(null, 4);
      expect(buffer.length).toBe(0);
      expect(buffer.elementByteSize).toBe(4);
    });

    it('throws error on WebGL error in setDataRaw', () => {
      mockGL.getError.mockReturnValueOnce(1280);
      const data = new ArrayBuffer(16);
      expect(() => {
        buffer.setDataRaw(data, 4);
      }).toThrow(/failed with WebGL error/);
    });

    it('respects custom usage hint in setDataRaw', () => {
      const data = new ArrayBuffer(16);
      buffer.setDataRaw(data, 4, undefined, BufferUsage.DYNAMIC_DRAW);

      expect(mockGL.bufferData).toHaveBeenCalledWith(
        BufferTarget.ARRAY_BUFFER,
        data,
        BufferUsage.DYNAMIC_DRAW,
      );
      expect(buffer.usage).toBe(BufferUsage.DYNAMIC_DRAW);
    });
  });

  describe('buffer targets and usage', () => {
    it('BufferTarget enum has correct values', () => {
      expect(BufferTarget.ARRAY_BUFFER).toBe(0x8892);
      expect(BufferTarget.ELEMENT_ARRAY_BUFFER).toBe(0x8893);
    });

    it('BufferUsage enum has correct values', () => {
      expect(BufferUsage.STATIC_DRAW).toBe(0x88e4);
      expect(BufferUsage.DYNAMIC_DRAW).toBe(0x88e8);
      expect(BufferUsage.STREAM_DRAW).toBe(0x88e0);
    });

    it('ElementType enum has correct values', () => {
      expect(ElementType.BYTE).toBe('int8');
      expect(ElementType.UBYTE).toBe('uint8');
      expect(ElementType.UBYTE_CLAMPED).toBe('uint8_clamped');
      expect(ElementType.SHORT).toBe('int16');
      expect(ElementType.USHORT).toBe('uint16');
      expect(ElementType.INT).toBe('int32');
      expect(ElementType.UINT).toBe('uint32');
      expect(ElementType.FLOAT).toBe('float32');
      expect(ElementType.DOUBLE).toBe('float64');
      expect(ElementType.BIGINT64).toBe('bigint64');
      expect(ElementType.BIGUINT64).toBe('biguint64');
    });
  });

  describe('byteLength calculation', () => {
    it('calculates byteLength from length and elementByteSize', () => {
      const vbo = new VertexBuffer(mockGLContext as GLContext, 3);

      vbo.setData(new Float32Array([1, 2, 3, 4, 5, 6])); // 6 elements, 4 bytes each

      // byteLength should be calculated, not queried from GPU
      expect(vbo.length).toBe(6);
      expect(vbo.elementByteSize).toBe(4);
      expect(vbo.byteLength).toBe(24);
    });

    it('byteLength matches wrapper state, not GPU state if mixing with raw GL', () => {
      const vbo = new VertexBuffer(mockGLContext as GLContext, 3);

      vbo.setData(new Float32Array([1, 2, 3])); // 3 elements, 4 bytes each
      expect(vbo.byteLength).toBe(12);

      // If user bypasses wrapper and changes GPU buffer, wrapper state becomes stale
      // This is expected per "Escape Hatches & Wrapper Purity" contract
      // vbo.buffer now has different data in GPU, but wrapper doesn't know

      // User can resync state
      vbo.setMetadata(2, 1); // 2 elements, 1 byte each
      expect(vbo.byteLength).toBe(2);
    });

    it('setMetadata validates inputs', () => {
      const buffer = new IndexBuffer(mockGLContext as GLContext);

      // Valid
      expect(() => buffer.setMetadata(10, 4)).not.toThrow();

      // Invalid length
      expect(() => buffer.setMetadata(-1, 4)).toThrow();
      expect(() => buffer.setMetadata(NaN, 4)).toThrow();
      expect(() => buffer.setMetadata(3.5, 4)).toThrow();

      // Invalid elementByteSize
      expect(() => buffer.setMetadata(10, 3)).toThrow();
      expect(() => buffer.setMetadata(10, 0)).toThrow();
      expect(() => buffer.setMetadata(10, -1)).toThrow();
    });
  });

  describe('integration', () => {
    it('complete buffer workflow', () => {
      const buffer = new TestBuffer(
        mockGLContext as GLContext,
        BufferTarget.ARRAY_BUFFER,
        BufferUsage.STATIC_DRAW,
      );

      // Upload data
      const vertices = new Float32Array([
        0, 0, 0, 1, 0, 0, 0, 1, 0,
      ]);
      buffer.setData(vertices);
      expect(buffer.length).toBe(9);

      // Bind for use
      mockGL.bindBuffer.mockClear();
      buffer.bind();
      expect(mockGL.bindBuffer).toHaveBeenCalledWith(
        BufferTarget.ARRAY_BUFFER,
        buffer.buffer,
      );

      // Unbind when done
      mockGL.bindBuffer.mockClear();
      buffer.unbind();
      expect(mockGL.bindBuffer).toHaveBeenCalledWith(
        BufferTarget.ARRAY_BUFFER,
        null,
      );

      // Dispose
      buffer.dispose();
      expect(mockGL.deleteBuffer).toHaveBeenCalled();
    });

    it('vertex and index buffer pair', () => {
      const vbo = new TestBuffer(
        mockGLContext as GLContext,
        BufferTarget.ARRAY_BUFFER,
      );
      const ibo = new TestBuffer(
        mockGLContext as GLContext,
        BufferTarget.ELEMENT_ARRAY_BUFFER,
      );

      const vertices = new Float32Array([
        0, 0, 0, 1, 0, 0, 0, 1, 0,
      ]);
      const indices = new Uint16Array([0, 1, 2]);

      vbo.setData(vertices);
      ibo.setData(indices);

      expect(vbo.length).toBe(9);
      expect(ibo.length).toBe(3);

      vbo.bind();
      ibo.bind();

      vbo.unbind();
      ibo.unbind();

      vbo.dispose();
      ibo.dispose();
    });

    it('updating vertex buffer data', () => {
      const buffer = new TestBuffer(
        mockGLContext as GLContext,
        BufferTarget.ARRAY_BUFFER,
      );

      // Initial upload
      const initialData = new Float32Array([0, 0, 0, 1, 0, 0, 0, 1, 0]);
      buffer.setData(initialData);

      // Mock byteLength query for updateData bounds checking
      mockGL.getBufferParameter = vi.fn(() => 36); // 9 floats * 4 bytes

      mockGL.bufferSubData.mockClear();

      // Update part of buffer
      const newPosition = new Float32Array([2, 3, 4]);
      buffer.updateData(0, newPosition);

      expect(mockGL.bufferSubData).toHaveBeenCalled();
    });
  });
});
