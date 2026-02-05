import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { VertexArray } from '../../src/resources/VertexArray.js';
import { BufferTarget } from '../../src/resources/buffers/Buffer.js';
import { GLContext } from '../../src/core/GLContext.js';
import { VertexBuffer } from '../../src/resources/buffers/VertexBuffer.js';
import { IndexBuffer } from '../../src/resources/buffers/IndexBuffer.js';

describe('VertexArray', () => {
  let mockGLContext: Partial<GLContext>;
  let mockGL: any;
  let mockVAO: WebGLVertexArrayObject;

  beforeEach(() => {
    mockVAO = {} as WebGLVertexArrayObject;

    mockGL = {
      FLOAT: 0x1406,
      INT: 0x1404,
      BYTE: 0x1400,
      UNSIGNED_BYTE: 0x1401,
      SHORT: 0x1402,
      UNSIGNED_SHORT: 0x1403,
      UNSIGNED_INT: 0x1405,
      createVertexArray: vi.fn(() => mockVAO),
      bindVertexArray: vi.fn(),
      deleteVertexArray: vi.fn(),
      vertexAttribIPointer: vi.fn(),
      vertexAttribDivisor: vi.fn(),
      getError: vi.fn(() => 0),
    };

    mockGLContext = {
      gl: mockGL as WebGL2RenderingContext,
      createVertexArray: vi.fn(() => mockVAO),
      bindVertexArray: vi.fn(),
      registerVertexArray: vi.fn(),
      vertexAttribPointer: vi.fn(),
      enableVertexAttribArray: vi.fn(),
      disableVertexAttribArray: vi.fn(),
      queryCurrentVAO: vi.fn(() => mockVAO),
      checkError: vi.fn(),
    };
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('constructor', () => {
    it('creates and registers a VAO', () => {
      const vao = new VertexArray(mockGLContext as GLContext);
      expect(mockGLContext.createVertexArray).toHaveBeenCalledTimes(1);
      expect(mockGLContext.registerVertexArray).toHaveBeenCalledWith(mockVAO);
      expect(vao).toBeDefined();
    });
  });

  describe('vao accessor', () => {
    it('returns the underlying VAO', () => {
      const vao = new VertexArray(mockGLContext as GLContext);
      expect(vao.vao).toBe(mockVAO);
    });

    it('throws after dispose', () => {
      const vao = new VertexArray(mockGLContext as GLContext);
      vao.dispose();
      expect(() => vao.vao).toThrow(/\[RES_001\]/);
    });
  });

  describe('binding', () => {
    it('binds and unbinds the VAO', () => {
      const vao = new VertexArray(mockGLContext as GLContext);
      vao.bind();
      expect(mockGLContext.bindVertexArray).toHaveBeenCalledWith(mockVAO);
      vao.unbind();
      expect(mockGLContext.bindVertexArray).toHaveBeenCalledWith(null);
    });

    it('throws on unbind after dispose', () => {
      const vao = new VertexArray(mockGLContext as GLContext);
      vao.dispose();
      expect(() => vao.unbind()).toThrow(/\[RES_001\]/);
    });
  });

  describe('setAttribute', () => {
    it('configures a float attribute with defaults', () => {
      const vao = new VertexArray(mockGLContext as GLContext);
      const buffer = {
        target: BufferTarget.ARRAY_BUFFER,
        componentSize: 3,
        bind: vi.fn(),
        unbind: vi.fn(),
      } as unknown as VertexBuffer;

      const result = vao.setAttribute(2, buffer);

      expect(result).toBe(vao);
      expect(mockGLContext.bindVertexArray).toHaveBeenCalledWith(mockVAO);
      expect(buffer.bind).toHaveBeenCalledTimes(1);
      expect(mockGLContext.vertexAttribPointer).toHaveBeenCalledWith(
        2,
        3,
        mockGL.FLOAT,
        false,
        0,
        0,
      );
      expect(mockGLContext.enableVertexAttribArray).toHaveBeenCalledWith(2);
      expect(buffer.unbind).toHaveBeenCalledTimes(1);
      expect(mockGLContext.bindVertexArray).toHaveBeenCalledWith(null);
    });

    it('throws for invalid location', () => {
      const vao = new VertexArray(mockGLContext as GLContext);
      const buffer = {
        target: BufferTarget.ARRAY_BUFFER,
        componentSize: 3,
        bind: vi.fn(),
        unbind: vi.fn(),
      } as unknown as VertexBuffer;

      expect(() => vao.setAttribute(-1, buffer)).toThrow(/\[RES_002\]/);
    });

    it('throws for non-finite location', () => {
      const vao = new VertexArray(mockGLContext as GLContext);
      const buffer = {
        target: BufferTarget.ARRAY_BUFFER,
        componentSize: 3,
        bind: vi.fn(),
        unbind: vi.fn(),
      } as unknown as VertexBuffer;

      expect(() => vao.setAttribute(NaN, buffer)).toThrow(/\[RES_002\]/);
    });

    it('throws for non-integer location', () => {
      const vao = new VertexArray(mockGLContext as GLContext);
      const buffer = {
        target: BufferTarget.ARRAY_BUFFER,
        componentSize: 3,
        bind: vi.fn(),
        unbind: vi.fn(),
      } as unknown as VertexBuffer;

      expect(() => vao.setAttribute(1.5, buffer)).toThrow(/\[RES_002\]/);
    });

    it('throws when buffer is missing', () => {
      const vao = new VertexArray(mockGLContext as GLContext);
      expect(() => vao.setAttribute(0, null as any)).toThrow(/\[RES_002\]/);
    });

    it('throws for invalid buffer target', () => {
      const vao = new VertexArray(mockGLContext as GLContext);
      const buffer = {
        target: BufferTarget.ELEMENT_ARRAY_BUFFER,
        componentSize: 3,
        bind: vi.fn(),
        unbind: vi.fn(),
      } as unknown as VertexBuffer;

      expect(() => vao.setAttribute(0, buffer)).toThrow(/\[RES_002\]/);
    });

    it('throws for invalid size', () => {
      const vao = new VertexArray(mockGLContext as GLContext);
      const buffer = {
        target: BufferTarget.ARRAY_BUFFER,
        componentSize: 3,
        bind: vi.fn(),
        unbind: vi.fn(),
      } as unknown as VertexBuffer;

      expect(() =>
        vao.setAttribute(0, buffer, { size: 0 }),
      ).toThrow(/\[RES_002\]/);
      expect(() =>
        vao.setAttribute(0, buffer, { size: 5 }),
      ).toThrow(/\[RES_002\]/);
      expect(() =>
        vao.setAttribute(0, buffer, { size: NaN }),
      ).toThrow(/\[RES_002\]/);
    });

    it('throws for invalid stride and offset', () => {
      const vao = new VertexArray(mockGLContext as GLContext);
      const buffer = {
        target: BufferTarget.ARRAY_BUFFER,
        componentSize: 3,
        bind: vi.fn(),
        unbind: vi.fn(),
      } as unknown as VertexBuffer;

      expect(() =>
        vao.setAttribute(0, buffer, { stride: -1 }),
      ).toThrow(/\[RES_002\]/);
      expect(() =>
        vao.setAttribute(0, buffer, { offset: -4 }),
      ).toThrow(/\[RES_002\]/);
      expect(() =>
        vao.setAttribute(0, buffer, { stride: NaN }),
      ).toThrow(/\[RES_002\]/);
      expect(() =>
        vao.setAttribute(0, buffer, { offset: 1.2 }),
      ).toThrow(/\[RES_002\]/);
    });
  });

  describe('setIntegerAttribute', () => {
    it('configures an integer attribute', () => {
      const vao = new VertexArray(mockGLContext as GLContext);
      const buffer = {
        target: BufferTarget.ARRAY_BUFFER,
        componentSize: 2,
        bind: vi.fn(),
        unbind: vi.fn(),
      } as unknown as VertexBuffer;

      vao.setIntegerAttribute(1, buffer, { type: mockGL.UNSIGNED_INT });

      expect(mockGL.vertexAttribIPointer).toHaveBeenCalledWith(
        1,
        2,
        mockGL.UNSIGNED_INT,
        0,
        0,
      );
      expect(mockGLContext.enableVertexAttribArray).toHaveBeenCalledWith(1);
      expect(mockGLContext.checkError).toHaveBeenCalledWith(
        'VertexArray.setIntegerAttribute()',
      );
    });

    it('uses INT as default type', () => {
      const vao = new VertexArray(mockGLContext as GLContext);
      const buffer = {
        target: BufferTarget.ARRAY_BUFFER,
        componentSize: 1,
        bind: vi.fn(),
        unbind: vi.fn(),
      } as unknown as VertexBuffer;

      vao.setIntegerAttribute(0, buffer);

      expect(mockGL.vertexAttribIPointer).toHaveBeenCalledWith(
        0,
        1,
        mockGL.INT,
        0,
        0,
      );
    });

    it('throws for invalid integer type', () => {
      const vao = new VertexArray(mockGLContext as GLContext);
      const buffer = {
        target: BufferTarget.ARRAY_BUFFER,
        componentSize: 2,
        bind: vi.fn(),
        unbind: vi.fn(),
      } as unknown as VertexBuffer;

      expect(() =>
        vao.setIntegerAttribute(0, buffer, { type: mockGL.FLOAT }),
      ).toThrow(/\[RES_002\]/);
    });

    it('throws when buffer is missing', () => {
      const vao = new VertexArray(mockGLContext as GLContext);
      expect(() =>
        vao.setIntegerAttribute(0, null as any),
      ).toThrow(/\[RES_002\]/);
    });

    it('throws for invalid buffer target', () => {
      const vao = new VertexArray(mockGLContext as GLContext);
      const buffer = {
        target: BufferTarget.ELEMENT_ARRAY_BUFFER,
        componentSize: 2,
        bind: vi.fn(),
        unbind: vi.fn(),
      } as unknown as VertexBuffer;

      expect(() => vao.setIntegerAttribute(0, buffer)).toThrow(/\[RES_002\]/);
    });

    it('throws for invalid stride and offset', () => {
      const vao = new VertexArray(mockGLContext as GLContext);
      const buffer = {
        target: BufferTarget.ARRAY_BUFFER,
        componentSize: 2,
        bind: vi.fn(),
        unbind: vi.fn(),
      } as unknown as VertexBuffer;

      expect(() =>
        vao.setIntegerAttribute(0, buffer, { stride: -1 }),
      ).toThrow(/\[RES_002\]/);
      expect(() =>
        vao.setIntegerAttribute(0, buffer, { offset: 1.5 }),
      ).toThrow(/\[RES_002\]/);
    });
  });

  describe('setMatrixAttribute', () => {
    it('configures a mat4 attribute across multiple locations', () => {
      const vao = new VertexArray(mockGLContext as GLContext);
      const buffer = {
        target: BufferTarget.ARRAY_BUFFER,
        componentSize: 4,
        bind: vi.fn(),
        unbind: vi.fn(),
      } as unknown as VertexBuffer;

      vao.setMatrixAttribute(2, buffer, 4, 4, { divisor: 1 });

      expect(mockGLContext.vertexAttribPointer).toHaveBeenCalledTimes(4);
      expect(mockGLContext.enableVertexAttribArray).toHaveBeenCalledTimes(4);
      expect(mockGL.vertexAttribDivisor).toHaveBeenCalledTimes(4);
      expect(mockGL.vertexAttribDivisor).toHaveBeenNthCalledWith(1, 2, 1);
      expect(mockGL.vertexAttribDivisor).toHaveBeenNthCalledWith(2, 3, 1);
      expect(mockGL.vertexAttribDivisor).toHaveBeenNthCalledWith(3, 4, 1);
      expect(mockGL.vertexAttribDivisor).toHaveBeenNthCalledWith(4, 5, 1);
    });

    it('configures a matrix attribute without divisor', () => {
      const vao = new VertexArray(mockGLContext as GLContext);
      const buffer = {
        target: BufferTarget.ARRAY_BUFFER,
        componentSize: 3,
        bind: vi.fn(),
        unbind: vi.fn(),
      } as unknown as VertexBuffer;

      vao.setMatrixAttribute(1, buffer, 3, 3);

      expect(mockGLContext.vertexAttribPointer).toHaveBeenCalledTimes(3);
      expect(mockGL.vertexAttribDivisor).not.toHaveBeenCalled();
    });

    it.each([
      ['BYTE', () => mockGL.BYTE],
      ['UNSIGNED_BYTE', () => mockGL.UNSIGNED_BYTE],
      ['SHORT', () => mockGL.SHORT],
      ['UNSIGNED_SHORT', () => mockGL.UNSIGNED_SHORT],
      ['INT', () => mockGL.INT],
      ['UNSIGNED_INT', () => mockGL.UNSIGNED_INT],
      ['FLOAT', () => mockGL.FLOAT],
    ])('supports %s matrix types', (_label, getType) => {
      const vao = new VertexArray(mockGLContext as GLContext);
      const buffer = {
        target: BufferTarget.ARRAY_BUFFER,
        componentSize: 2,
        bind: vi.fn(),
        unbind: vi.fn(),
      } as unknown as VertexBuffer;

      vao.setMatrixAttribute(0, buffer, 2, 2, { type: getType() });

      expect(mockGLContext.vertexAttribPointer).toHaveBeenCalledTimes(2);
      expect(mockGLContext.enableVertexAttribArray).toHaveBeenCalledTimes(2);
    });

    it('throws for unsupported matrix type', () => {
      const vao = new VertexArray(mockGLContext as GLContext);
      const buffer = {
        target: BufferTarget.ARRAY_BUFFER,
        componentSize: 2,
        bind: vi.fn(),
        unbind: vi.fn(),
      } as unknown as VertexBuffer;

      expect(() =>
        vao.setMatrixAttribute(0, buffer, 2, 2, { type: 0x140b }),
      ).toThrow(/\[RES_002\]/);
    });

    it('throws for invalid stride or offset', () => {
      const vao = new VertexArray(mockGLContext as GLContext);
      const buffer = {
        target: BufferTarget.ARRAY_BUFFER,
        componentSize: 4,
        bind: vi.fn(),
        unbind: vi.fn(),
      } as unknown as VertexBuffer;

      expect(() =>
        vao.setMatrixAttribute(0, buffer, 4, 4, { stride: -4 }),
      ).toThrow(/\[RES_002\]/);
      expect(() =>
        vao.setMatrixAttribute(0, buffer, 4, 4, { offset: -4 }),
      ).toThrow(/\[RES_002\]/);
    });

    it('throws for missing buffer or invalid target', () => {
      const vao = new VertexArray(mockGLContext as GLContext);
      const badBuffer = {
        target: BufferTarget.ELEMENT_ARRAY_BUFFER,
        componentSize: 4,
        bind: vi.fn(),
        unbind: vi.fn(),
      } as unknown as VertexBuffer;

      expect(() =>
        vao.setMatrixAttribute(0, null as any, 4, 4),
      ).toThrow(/\[RES_002\]/);
      expect(() =>
        vao.setMatrixAttribute(0, badBuffer, 4, 4),
      ).toThrow(/\[RES_002\]/);
    });

    it('throws for invalid divisor and unsupported type', () => {
      const vao = new VertexArray(mockGLContext as GLContext);
      const buffer = {
        target: BufferTarget.ARRAY_BUFFER,
        componentSize: 4,
        bind: vi.fn(),
        unbind: vi.fn(),
      } as unknown as VertexBuffer;

      expect(() =>
        vao.setMatrixAttribute(0, buffer, 4, 4, { divisor: -1 }),
      ).toThrow(/\[RES_002\]/);
      expect(() =>
        vao.setMatrixAttribute(0, buffer, 4, 4, { type: 0x140b }),
      ).toThrow(/\[RES_002\]/);
    });
  });

  describe('enable/disable attribute', () => {
    it('enables and disables attribute location', () => {
      const vao = new VertexArray(mockGLContext as GLContext);
      vao.enableAttribute(0);
      expect(mockGLContext.enableVertexAttribArray).toHaveBeenCalledWith(0);
      vao.disableAttribute(1);
      expect(mockGLContext.disableVertexAttribArray).toHaveBeenCalledWith(1);
    });

    it('throws for invalid location', () => {
      const vao = new VertexArray(mockGLContext as GLContext);
      expect(() => vao.enableAttribute(-1)).toThrow(/\[RES_002\]/);
      expect(() => vao.disableAttribute(NaN)).toThrow(/\[RES_002\]/);
    });
  });

  describe('setIndexBuffer', () => {
    it('binds index buffer while VAO is bound', () => {
      const vao = new VertexArray(mockGLContext as GLContext);
      const indexBuffer = {
        target: BufferTarget.ELEMENT_ARRAY_BUFFER,
        bind: vi.fn(),
      } as unknown as IndexBuffer;

      vao.setIndexBuffer(indexBuffer);

      expect(mockGLContext.bindVertexArray).toHaveBeenCalledWith(mockVAO);
      expect(indexBuffer.bind).toHaveBeenCalledTimes(1);
      expect(mockGLContext.bindVertexArray).toHaveBeenCalledWith(null);
    });

    it('throws for invalid index buffer', () => {
      const vao = new VertexArray(mockGLContext as GLContext);
      const badBuffer = {
        target: BufferTarget.ARRAY_BUFFER,
        bind: vi.fn(),
      } as unknown as IndexBuffer;

      expect(() => vao.setIndexBuffer(null as any)).toThrow(/\[RES_002\]/);
      expect(() => vao.setIndexBuffer(badBuffer)).toThrow(/\[RES_002\]/);
    });

    it('throws when disposed', () => {
      const vao = new VertexArray(mockGLContext as GLContext);
      vao.dispose();
      const indexBuffer = {
        target: BufferTarget.ELEMENT_ARRAY_BUFFER,
        bind: vi.fn(),
      } as unknown as IndexBuffer;

      expect(() => vao.setIndexBuffer(indexBuffer)).toThrow(/\[RES_001\]/);
    });
  });

  describe('setAttributeDivisor', () => {
    it('sets the attribute divisor', () => {
      const vao = new VertexArray(mockGLContext as GLContext);
      vao.setAttributeDivisor(3, 2);
      expect(mockGL.vertexAttribDivisor).toHaveBeenCalledWith(3, 2);
      expect(mockGLContext.checkError).toHaveBeenCalledWith(
        'VertexArray.setAttributeDivisor()',
      );
    });

    it('throws for invalid divisor', () => {
      const vao = new VertexArray(mockGLContext as GLContext);
      expect(() => vao.setAttributeDivisor(0, -1)).toThrow(/\[RES_002\]/);
      expect(() => vao.setAttributeDivisor(NaN, 1)).toThrow(/\[RES_002\]/);
      expect(() => vao.setAttributeDivisor(0, 1.5)).toThrow(/\[RES_002\]/);
    });
  });

  describe('queryBinding', () => {
    it('queries current VAO binding via GLContext', () => {
      const bound = VertexArray.queryBinding(mockGLContext as GLContext);
      expect(mockGLContext.queryCurrentVAO).toHaveBeenCalledTimes(1);
      expect(bound).toBe(mockVAO);
    });
  });

  describe('dispose', () => {
    it('deletes VAO and marks disposed', () => {
      const vao = new VertexArray(mockGLContext as GLContext);
      vao.dispose();
      expect(mockGL.deleteVertexArray).toHaveBeenCalledWith(mockVAO);
      expect(mockGLContext.checkError).toHaveBeenCalledWith('VertexArray.dispose()');
      expect(() => vao.bind()).toThrow(/\[RES_001\]/);
    });

    it('is safe to call dispose multiple times', () => {
      const vao = new VertexArray(mockGLContext as GLContext);
      vao.dispose();
      expect(() => vao.dispose()).not.toThrow();
    });

    it('throws on operations after dispose', () => {
      const vao = new VertexArray(mockGLContext as GLContext);
      vao.dispose();
      const buffer = {
        target: BufferTarget.ARRAY_BUFFER,
        componentSize: 3,
        bind: vi.fn(),
        unbind: vi.fn(),
      } as unknown as VertexBuffer;

      expect(() => vao.bind()).toThrow(/\[RES_001\]/);
      expect(() => vao.setAttribute(0, buffer)).toThrow(/\[RES_001\]/);
      expect(() => vao.setIntegerAttribute(0, buffer)).toThrow(/\[RES_001\]/);
      expect(() =>
        vao.setMatrixAttribute(0, buffer, 4, 4),
      ).toThrow(/\[RES_001\]/);
      expect(() => vao.enableAttribute(0)).toThrow(/\[RES_001\]/);
      expect(() => vao.disableAttribute(0)).toThrow(/\[RES_001\]/);
      expect(() => vao.setAttributeDivisor(0, 1)).toThrow(/\[RES_001\]/);
    });
  });
});
