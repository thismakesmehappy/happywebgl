import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { VertexBuffer, BufferUsage } from '../../../src/resources/index.js';
import { GLContext } from '../../../src/core/GLContext.js';

/**
 * Test suite for VertexBuffer (vertex attribute data specialization)
 *
 * Tests VertexBuffer-specific functionality:
 * - Construction with componentSize validation
 * - Getting and setting componentSize
 * - Integration with Buffer's shared methods
 */

describe('VertexBuffer', () => {
  let mockGLContext: Partial<GLContext>;
  let mockGL: any;

  beforeEach(() => {
    // Create mock GL object with all required methods
    mockGL = {
      NO_ERROR: 0,
      ARRAY_BUFFER: 0x8892,
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
    it('creates VertexBuffer with componentSize', () => {
      const vbo = new VertexBuffer(mockGLContext as GLContext, 3);
      expect(vbo).toBeDefined();
      expect(vbo.componentSize).toBe(3);
    });

    it('creates with default usage', () => {
      const vbo = new VertexBuffer(mockGLContext as GLContext, 2);
      expect(vbo.usage).toBe(BufferUsage.STATIC_DRAW);
    });

    it('creates with specified usage', () => {
      const vbo = new VertexBuffer(
        mockGLContext as GLContext,
        3,
        BufferUsage.DYNAMIC_DRAW,
      );
      expect(vbo.usage).toBe(BufferUsage.DYNAMIC_DRAW);
    });

    it.each([1, 2, 3, 4])('validates componentSize (%s)', (size) => {
      const vbo = new VertexBuffer(mockGLContext as GLContext, size);
      expect(vbo.componentSize).toBe(size);
    });

    it.each([
      ['0', 0],
      ['5', 5],
      ['negative', -1],
      ['non-integer', 3.5],
    ])('throws error for componentSize %s', (_label, size) => {
      expect(() => {
        new VertexBuffer(mockGLContext as GLContext, size);
      }).toThrow(/componentSize must be 1, 2, 3, or 4/);
    });
  });

  describe('componentSize property', () => {
    let vbo: VertexBuffer;

    beforeEach(() => {
      vbo = new VertexBuffer(mockGLContext as GLContext, 3);
    });

    it('returns initial componentSize', () => {
      expect(vbo.componentSize).toBe(3);
    });

    it('is readable after construction', () => {
      expect(vbo.componentSize).toBe(3);
      expect(typeof vbo.componentSize).toBe('number');
    });
  });

  describe('setComponentSize', () => {
    let vbo: VertexBuffer;

    beforeEach(() => {
      vbo = new VertexBuffer(mockGLContext as GLContext, 3);
    });

    it('stores component size after setComponentSize', () => {
      vbo.setComponentSize(3);
      expect(vbo.componentSize).toBe(3);
    });

    it.each([1, 2, 3, 4])('supports valid component size %s', (size) => {
      vbo.setComponentSize(size);
      expect(vbo.componentSize).toBe(size);
    });

    it.each([
      ['0', 0],
      ['5', 5],
      ['negative', -1],
      ['non-integer', 3.5],
    ])('throws error for invalid component size %s', (_label, size) => {
      expect(() => {
        vbo.setComponentSize(size);
      }).toThrow(/componentSize must be 1, 2, 3, or 4/);
    });

    it('returns this for chaining', () => {
      const result = vbo.setComponentSize(3);
      expect(result).toBe(vbo);
    });

    it('chainable with setData', () => {
      const vertices = new Float32Array([0, 0, 0, 1, 0, 0, 0, 1, 0]);
      vbo.setComponentSize(3).setData(vertices);

      expect(vbo.componentSize).toBe(3);
      expect(vbo.length).toBe(9);
    });

    it('chainable with setDataRaw', () => {
      const data = new ArrayBuffer(12);
      vbo.setComponentSize(2).setDataRaw(data, 4);

      expect(vbo.componentSize).toBe(2);
      expect(vbo.length).toBe(3);
    });

    it('can be set multiple times', () => {
      vbo.setComponentSize(2);
      expect(vbo.componentSize).toBe(2);

      vbo.setComponentSize(4);
      expect(vbo.componentSize).toBe(4);

      vbo.setComponentSize(1);
      expect(vbo.componentSize).toBe(1);
    });
  });

  describe('inherits Buffer functionality', () => {
    let vbo: VertexBuffer;

    beforeEach(() => {
      vbo = new VertexBuffer(mockGLContext as GLContext, 3);
      mockGL.getBufferParameter = vi.fn(() => 36); // For byteLength queries
    });

    it('uploads data correctly', () => {
      const vertices = new Float32Array([0, 0, 0, 1, 0, 0]);
      vbo.setData(vertices);

      expect(mockGL.bufferData).toHaveBeenCalled();
      expect(vbo.length).toBe(6);
    });

    it('binds buffer', () => {
      vbo.bind();
      expect(mockGL.bindBuffer).toHaveBeenCalledWith(0x8892, vbo.buffer);
    });

    it('unbinds buffer', () => {
      vbo.unbind();
      expect(mockGL.bindBuffer).toHaveBeenCalledWith(0x8892, null);
    });

    it('updates buffer data', () => {
      const initialData = new Float32Array([1, 2, 3, 4, 5, 6]);
      vbo.setData(initialData);

      mockGL.bufferSubData.mockClear();

      const newData = new Float32Array([10, 11, 12]);
      vbo.updateData(0, newData);

      expect(mockGL.bufferSubData).toHaveBeenCalled();
    });

    it('disposes buffer', () => {
      const bufferRef = vbo.buffer;
      vbo.dispose();

      expect(mockGL.deleteBuffer).toHaveBeenCalledWith(bufferRef);
    });
  });

  describe('integration', () => {
    it('complete VBO workflow with componentSize', () => {
      const vbo = new VertexBuffer(
        mockGLContext as GLContext,
        3,
        BufferUsage.STATIC_DRAW,
      );

      // Upload 3D vertex data
      const vertices = new Float32Array([0, 0, 0, 1, 0, 0, 0, 1, 0]);
      vbo.setData(vertices);

      expect(vbo.componentSize).toBe(3);
      expect(vbo.length).toBe(9);

      // Bind for use
      mockGL.bindBuffer.mockClear();
      vbo.bind();
      expect(mockGL.bindBuffer).toHaveBeenCalled();

      // Change component size if needed (e.g., reinterpreting data)
      vbo.setComponentSize(2);
      expect(vbo.componentSize).toBe(2);

      // Cleanup
      vbo.dispose();
      expect(mockGL.deleteBuffer).toHaveBeenCalled();
    });

    it('supports switching between vertex formats', () => {
      const vbo = new VertexBuffer(mockGLContext as GLContext, 3);

      // Start with 3D
      expect(vbo.componentSize).toBe(3);

      // Switch to 2D
      vbo.setComponentSize(2);
      expect(vbo.componentSize).toBe(2);

      // Switch to 4D for color
      vbo.setComponentSize(4);
      expect(vbo.componentSize).toBe(4);

      // Back to 3D for positions
      vbo.setComponentSize(3);
      expect(vbo.componentSize).toBe(3);
    });
  });
});
