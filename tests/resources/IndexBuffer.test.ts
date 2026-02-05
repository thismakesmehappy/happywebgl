import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { IndexBuffer, BufferUsage, BufferTarget } from '../../src/resources/index.js';
import { GLContext } from '../../src/core/GLContext.js';

/**
 * Test suite for IndexBuffer (vertex index data specialization)
 *
 * Tests IndexBuffer-specific functionality:
 * - Construction with ELEMENT_ARRAY_BUFFER target
 * - Verifies NO componentSize on IndexBuffer
 * - Integration with Buffer's shared methods
 */

describe('IndexBuffer', () => {
  let mockGLContext: Partial<GLContext>;
  let mockGL: any;

  beforeEach(() => {
    // Create mock GL object with all required methods
    mockGL = {
      NO_ERROR: 0,
      ELEMENT_ARRAY_BUFFER: 0x8893,
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
    it('creates IndexBuffer', () => {
      const ibo = new IndexBuffer(mockGLContext as GLContext);
      expect(ibo).toBeDefined();
    });

    it('creates with default usage', () => {
      const ibo = new IndexBuffer(mockGLContext as GLContext);
      expect(ibo.usage).toBe(BufferUsage.STATIC_DRAW);
    });

    it('creates with specified usage', () => {
      const ibo = new IndexBuffer(
        mockGLContext as GLContext,
        BufferUsage.DYNAMIC_DRAW,
      );
      expect(ibo.usage).toBe(BufferUsage.DYNAMIC_DRAW);
    });

    it('has ELEMENT_ARRAY_BUFFER target', () => {
      const ibo = new IndexBuffer(mockGLContext as GLContext);
      expect(ibo.target).toBe(BufferTarget.ELEMENT_ARRAY_BUFFER);
    });
  });

  describe('no componentSize', () => {
    let ibo: IndexBuffer;

    beforeEach(() => {
      ibo = new IndexBuffer(mockGLContext as GLContext);
    });

    it('does NOT have componentSize property', () => {
      // componentSize should not exist on IndexBuffer
      expect((ibo as any).componentSize).toBeUndefined();
    });

    it('does NOT have setComponentSize method', () => {
      // setComponentSize should not be available on IndexBuffer
      expect((ibo as any).setComponentSize).toBeUndefined();
    });

    it('cannot set componentSize', () => {
      // Attempting to call setComponentSize should fail
      expect(() => {
        (ibo as any).setComponentSize(2);
      }).toThrow();
    });
  });

  describe('inherits Buffer functionality', () => {
    let ibo: IndexBuffer;

    beforeEach(() => {
      ibo = new IndexBuffer(mockGLContext as GLContext);
      mockGL.getBufferParameter = vi.fn(() => 24); // For byteLength queries
    });

    it('uploads index data correctly', () => {
      const indices = new Uint16Array([0, 1, 2, 1, 3, 2]);
      ibo.setData(indices);

      expect(mockGL.bufferData).toHaveBeenCalled();
      expect(ibo.length).toBe(6);
    });

    it.each([
      ['Uint32', new Uint32Array([0, 1, 2, 1, 3, 2]), 6],
      ['Int8', new Int8Array([0, 1, 2]), 3],
    ])('uploads %s indices', (_label, indices, expectedLength) => {
      ibo.setData(indices);
      expect(ibo.length).toBe(expectedLength);
    });

    it('binds buffer to ELEMENT_ARRAY_BUFFER', () => {
      ibo.bind();
      expect(mockGL.bindBuffer).toHaveBeenCalledWith(0x8893, ibo.buffer);
    });

    it('unbinds buffer', () => {
      ibo.unbind();
      expect(mockGL.bindBuffer).toHaveBeenCalledWith(0x8893, null);
    });

    it('updates index data', () => {
      const initialIndices = new Uint16Array([0, 1, 2, 3, 4, 5]);
      ibo.setData(initialIndices);

      mockGL.bufferSubData.mockClear();

      const newIndices = new Uint16Array([10, 11, 12]);
      ibo.updateData(0, newIndices);

      expect(mockGL.bufferSubData).toHaveBeenCalled();
    });

    it('disposes buffer', () => {
      const bufferRef = ibo.buffer;
      ibo.dispose();

      expect(mockGL.deleteBuffer).toHaveBeenCalledWith(bufferRef);
    });
  });

  describe('integration', () => {
    it('complete IBO workflow', () => {
      const ibo = new IndexBuffer(
        mockGLContext as GLContext,
        BufferUsage.STATIC_DRAW,
      );

      // Upload triangle indices
      const indices = new Uint16Array([0, 1, 2]);
      ibo.setData(indices);

      expect(ibo.length).toBe(3);
      expect(ibo.target).toBe(BufferTarget.ELEMENT_ARRAY_BUFFER);

      // Bind for use
      mockGL.bindBuffer.mockClear();
      ibo.bind();
      expect(mockGL.bindBuffer).toHaveBeenCalled();

      // Use with drawElements
      // ctx.gl.drawElements(ctx.gl.TRIANGLES, 3, ctx.gl.UNSIGNED_SHORT, 0);

      // Cleanup
      ibo.dispose();
      expect(mockGL.deleteBuffer).toHaveBeenCalled();
    });

    it.each([
      ['Uint8', new Uint8Array([0, 1, 2]), 3],
      ['Uint16', new Uint16Array([0, 1, 2, 65535]), 4],
      ['Uint32', new Uint32Array([0, 1, 2, 4294967295]), 4],
    ])('supports %s index types', (_label, data, expectedLength) => {
      const ibo = new IndexBuffer(mockGLContext as GLContext);
      ibo.setData(data);
      expect(ibo.length).toBe(expectedLength);
    });
  });
});
