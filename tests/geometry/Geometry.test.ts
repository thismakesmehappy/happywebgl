import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Geometry, DrawMode } from '../../src/geometry/Geometry.js';
import { Vector3 } from '../../src/math/vectors/Vector3.js';
import { VertexBuffer } from '../../src/resources/buffers/VertexBuffer.js';
import { IndexBuffer } from '../../src/resources/buffers/IndexBuffer.js';
import { GLContext } from '../../src/core/GLContext.js';
import { Program } from '../../src/resources/Program.js';

describe('Geometry', () => {
  let mockGL: any;
  let mockCtx: Partial<GLContext>;
  let mockVAO: WebGLVertexArrayObject;

  beforeEach(() => {
    mockVAO = {} as WebGLVertexArrayObject;
    mockGL = {
      NO_ERROR: 0,
      ARRAY_BUFFER: 0x8892,
      ELEMENT_ARRAY_BUFFER: 0x8893,
      FLOAT: 0x1406,
      INT: 0x1404,
      UNSIGNED_INT: 0x1405,
      UNSIGNED_SHORT: 0x1403,
      UNSIGNED_BYTE: 0x1401,
      BYTE: 0x1400,
      SHORT: 0x1402,
      createBuffer: vi.fn(() => ({})),
      bindBuffer: vi.fn(),
      bufferData: vi.fn(),
      bufferSubData: vi.fn(),
      getError: vi.fn(() => 0),
      deleteBuffer: vi.fn(),
      createVertexArray: vi.fn(() => mockVAO),
      bindVertexArray: vi.fn(),
      deleteVertexArray: vi.fn(),
      vertexAttribIPointer: vi.fn(),
      vertexAttribDivisor: vi.fn(),
    };

    mockCtx = {
      gl: mockGL as WebGL2RenderingContext,
      createVertexArray: vi.fn(() => mockVAO),
      bindVertexArray: vi.fn(),
      unbindVertexArray: vi.fn(),
      registerVertexArray: vi.fn(),
      registerBuffer: vi.fn(),
      bindBuffer: vi.fn(),
      vertexAttribPointer: vi.fn(),
      enableVertexAttribArray: vi.fn(),
      disableVertexAttribArray: vi.fn(),
      checkError: vi.fn(),
      queryCurrentVAO: vi.fn(() => null),
    };
  });

  const createGeometry = () => new Geometry(mockCtx as GLContext);

  const createProgramStub = (
    attributeInput: string[] | Record<string, number>,
  ) => {
    const entries = Array.isArray(attributeInput)
      ? attributeInput.map((name) => [name, 0] as const)
      : Object.entries(attributeInput);
    const locationMap = new Map(entries);
    const attributeNames = entries.map(([name]) => name);
    let disposeCallback: (() => void) | null = null;
    const program = {
      isDisposed: false,
      vertexShader: {
        attributes: new Map(attributeNames.map((name) => [name, { name }])),
      },
      getAttributeLocation: vi.fn((name: string) => {
        return locationMap.has(name) ? (locationMap.get(name) as number) : -1;
      }),
      registerDisposeCallback: vi.fn((callback: () => void) => {
        disposeCallback = callback;
      }),
      unregisterDisposeCallback: vi.fn(),
      __dispose: () => {
        if (disposeCallback) {
          disposeCallback();
        }
      },
    } as unknown as Program;
    return program;
  };

  it('initializes with default state only', () => {
    const geometry = createGeometry();
    expect(geometry.isDisposed).toBe(false);
    expect(geometry.drawMode).toBe(DrawMode.TRIANGLES);
    expect(geometry.attributeNames).toEqual([]);
    expect(geometry.hasAttribute('aPosition')).toBe(false);
    expect(geometry.getAttribute('aPosition')).toBeUndefined();
    expect(geometry.isIndexed).toBe(false);
    expect(geometry.indexCount).toBe(0);
    expect(geometry.indexType).toBeNull();
    expect(geometry.count).toBe(0);
    expect(geometry.boundingBox).toBeNull();
    expect(geometry.boundingSphere).toBeNull();
  });

  it('sets attributes and computes vertex count', () => {
    const geometry = createGeometry();
    const positions = new Float32Array([0, 0, 0, 1, 0, 0, 0, 1, 0]);
    geometry.setAttribute('aPosition', positions, { size: 3 });

    expect(geometry.vertexCount).toBe(3);
    expect(geometry.count).toBe(3);
    expect(geometry.isIndexed).toBe(false);
    expect(geometry.attributeNames).toEqual(['aPosition']);
  });

  it('computes vertex count for non-interleaved buffers', () => {
    const geometry = createGeometry();
    const buffer = new VertexBuffer(mockCtx as GLContext, 3);
    buffer.setData(new Float32Array([0, 0, 0, 1, 0, 0, 0, 1, 0]));

    geometry.setAttribute('aPosition', buffer, {});

    expect(geometry.vertexCount).toBe(3);
    expect(geometry.count).toBe(3);
  });

  it('computes counts for interleaved data using stride', () => {
    const geometry = createGeometry();
    const interleaved = new Float32Array([
      0, 0, 0, 0, 0, 1,
      1, 0, 0, 0, 0, 1,
    ]);
    const buffer = new VertexBuffer(mockCtx as GLContext, 3);
    buffer.setData(interleaved);

    geometry.setAttribute('aPosition', buffer, { size: 3, stride: 24, offset: 0 });
    geometry.setAttribute('aNormal', buffer, { size: 3, stride: 24, offset: 12 });

    expect(geometry.vertexCount).toBe(2);
    geometry.computeBoundingBox();
    const box = geometry.boundingBox!;
    expect(box.min.equals(new Vector3(0, 0, 0))).toBe(true);
    expect(box.max.equals(new Vector3(1, 0, 0))).toBe(true);
  });

  it('exposes attribute metadata and index info', () => {
    const geometry = createGeometry();
    expect(geometry.attributeNames).toEqual([]);
    expect(geometry.hasAttribute('aPosition')).toBe(false);
    expect(geometry.indexCount).toBe(0);
    expect(geometry.indexType).toBeNull();

    const positions = new Float32Array([0, 0, 0, 1, 0, 0, 0, 1, 0]);
    geometry.setAttribute('aPosition', positions, { size: 3 });
    expect(geometry.attributeNames).toEqual(['aPosition']);
    expect(geometry.hasAttribute('aPosition')).toBe(true);
    const attr = geometry.getAttribute('aPosition');
    expect(attr).toBeDefined();
    expect(Array.from(attr!.data as Float32Array)).toEqual(Array.from(positions));

    geometry.setIndex([0, 1, 2]);
    expect(geometry.indexCount).toBe(3);
    expect(geometry.indexType).toBe(mockGL.UNSIGNED_BYTE);
    expect(geometry.isIndexed).toBe(true);
    expect(geometry.count).toBe(3);
  });

  it('uses VertexBuffer componentSize when size is omitted', () => {
    const geometry = createGeometry();
    const buffer = new VertexBuffer(mockCtx as GLContext, 2);
    buffer.setData(new Float32Array([0, 0, 1, 1]));

    geometry.setAttribute('aUV', buffer, {});
    expect(geometry.vertexCount).toBe(2);
  });

  it('accepts raw attribute buffers and raw index buffers', () => {
    const geometry = createGeometry();
    geometry.setAttribute('aPosition', { buffer: {} as WebGLBuffer, length: 6 }, { size: 3 });
    expect(geometry.vertexCount).toBe(2);

    geometry.setIndex({ buffer: {} as WebGLBuffer, count: 3, type: mockGL.UNSIGNED_SHORT });
    expect(geometry.indexCount).toBe(3);
    expect(geometry.indexType).toBe(mockGL.UNSIGNED_SHORT);
  });

  it('coerces number arrays to typed arrays using config.type', () => {
    const geometry = createGeometry();
    geometry.setAttribute('aPosition', [0, 1, 2, 3], { size: 2, type: mockGL.UNSIGNED_SHORT });
    const attr = geometry.getAttribute('aPosition')!;
    expect(attr.data).toBeInstanceOf(Uint16Array);
  });

  it('defaults integer attributes to INT when type is omitted', () => {
    const geometry = createGeometry();
    geometry.setAttribute('aId', { buffer: {} as WebGLBuffer, length: 3 }, { kind: 'integer', size: 1 });
    const attr = geometry.getAttribute('aId')!;
    expect(attr.config.type).toBe(mockGL.INT);
  });

  it('disposes owned buffers when replacing attributes', () => {
    const geometry = createGeometry();
    geometry.setAttribute('aPosition', new Float32Array([0, 0, 0]), { size: 3 });
    const attr = geometry.getAttribute('aPosition')!;
    const buffer = attr.buffer as VertexBuffer;
    const disposeSpy = vi.spyOn(buffer, 'dispose');

    geometry.setAttribute('aPosition', new Float32Array([1, 1, 1]), { size: 3 });
    expect(disposeSpy).toHaveBeenCalledTimes(1);
  });

  it('clears all attributes and resets counts', () => {
    const geometry = createGeometry();
    geometry.setAttribute('aPosition', new Float32Array([0, 0, 0, 1, 0, 0, 0, 1, 0]), { size: 3 });
    geometry.setAttribute('aNormal', new Float32Array([0, 0, 1, 0, 0, 1, 0, 0, 1]), { size: 3 });

    const positionBuffer = geometry.getAttribute('aPosition')!.buffer as VertexBuffer;
    const normalBuffer = geometry.getAttribute('aNormal')!.buffer as VertexBuffer;
    const positionDisposeSpy = vi.spyOn(positionBuffer, 'dispose');
    const normalDisposeSpy = vi.spyOn(normalBuffer, 'dispose');

    geometry.clearAttributes();

    expect(geometry.attributeNames).toEqual([]);
    expect(geometry.hasAttribute('aPosition')).toBe(false);
    expect(geometry.vertexCount).toBe(0);
    expect(positionDisposeSpy).toHaveBeenCalledTimes(1);
    expect(normalDisposeSpy).toHaveBeenCalledTimes(1);
  });

  it('disposes index buffers, VAOs, and program callbacks', () => {
    const geometry = createGeometry();
    geometry.setAttribute('aPosition', new Float32Array([0, 0, 0]), { size: 3 });
    geometry.setIndex([0, 1, 2]);
    const program = createProgramStub({ aPosition: 0 });

    geometry.bind(program);

    const indexBuffer = (geometry as any)._index.buffer as IndexBuffer;
    const indexDisposeSpy = vi.spyOn(indexBuffer, 'dispose');

    geometry.dispose();

    expect(indexDisposeSpy).toHaveBeenCalledTimes(1);
    expect(mockGL.deleteVertexArray).toHaveBeenCalledTimes(1);
    expect(program.unregisterDisposeCallback).toHaveBeenCalledTimes(1);

    indexDisposeSpy.mockRestore();
  });

  it('rejects mismatched vertex counts across attributes', () => {
    const geometry = createGeometry();
    geometry.setAttribute('aPosition', new Float32Array([0, 0, 0, 1, 0, 0]), { size: 3 });
    expect(() =>
      geometry.setAttribute('aNormal', new Float32Array([0, 0, 1]), { size: 3 }),
    ).toThrow(/\[RES_002\]/);
  });

  it('rejects raw attribute lengths that are not divisible by size', () => {
    const geometry = createGeometry();
    expect(() => geometry.setAttribute(
      'aPosition',
      { buffer: {} as WebGLBuffer, length: 5 },
      { size: 2 },
    )).toThrow(/\[RES_002\]/);
  });

  it('rejects stride definitions that do not align with buffer lengths', () => {
    const geometry = createGeometry();
    const buffer = new VertexBuffer(mockCtx as GLContext, 3);
    buffer.setData(new Float32Array([0, 0, 0, 1, 0]));
    expect(() => geometry.setAttribute('aPosition', buffer, { size: 3, stride: 16 })).toThrow(/\[RES_002\]/);
  });

  it('throws when computing bounds without a position attribute', () => {
    const geometry = createGeometry();
    expect(() => geometry.computeBoundingBox()).toThrow(/\[RES_002\]/);
  });

  it('throws when computing bounds without CPU data on buffers', () => {
    const geometry = createGeometry();
    const buffer = new VertexBuffer(mockCtx as GLContext, 3);
    geometry.setAttribute('aPosition', buffer, { size: 3 });
    expect(() => geometry.computeBoundingBox()).toThrow(/\[RES_002\]/);
  });

  it('throws when mutating a disposed geometry', () => {
    const geometry = createGeometry();
    geometry.dispose();
    expect(() => geometry.setAttribute('aPosition', new Float32Array([0, 0, 0]), { size: 3 }))
      .toThrow(/\[RES_001\]/);
  });

  it('exposes drawMode and dispose state', () => {
    const geometry = createGeometry();
    expect(geometry.isDisposed).toBe(false);
    geometry.drawMode = DrawMode.LINES;
    expect(geometry.drawMode).toBe(DrawMode.LINES);
    geometry.dispose();
    expect(geometry.isDisposed).toBe(true);
    geometry.dispose();
  });

  it('rejects operations on disposed geometries', () => {
    const geometry = createGeometry();
    const program = createProgramStub({ aPosition: 0 });
    geometry.dispose();
    expect(() => geometry.removeAttribute('aPosition')).toThrow(/\[RES_001\]/);
    expect(() => geometry.clearAttributes()).toThrow(/\[RES_001\]/);
    expect(() => geometry.setIndex([0])).toThrow(/\[RES_001\]/);
    expect(() => geometry.removeIndex()).toThrow(/\[RES_001\]/);
    expect(() => geometry.toNonIndexed()).toThrow(/\[RES_001\]/);
    expect(() => geometry.releaseProgram(program)).toThrow(/\[RES_001\]/);
    expect(() => geometry.bind(program)).toThrow(/\[RES_001\]/);
    expect(() => geometry.unbind()).toThrow(/\[RES_001\]/);
  });

  it('rejects stride/offset alignment errors during attribute setup', () => {
    const geometry = createGeometry();
    expect(() => geometry.setAttribute(
      'aPosition',
      new Float32Array([0, 0, 0, 1, 1, 1]),
      { size: 3, stride: 2 },
    )).toThrow(/\[RES_002\]/);
  });

  it('rejects strides smaller than attribute size during attribute setup', () => {
    const geometry = createGeometry();
    expect(() => geometry.setAttribute(
      'aPosition',
      new Float32Array([0, 0, 0, 1, 1, 1]),
      { size: 3, stride: 8 },
    )).toThrow(/\[RES_002\]/);
  });

  it('rejects attribute offsets that exceed the buffer size', () => {
    const geometry = createGeometry();
    const buffer = new VertexBuffer(mockCtx as GLContext, 3);
    buffer.setData(new Float32Array([0, 0, 0]));
    expect(() => geometry.setAttribute('aPosition', buffer, { size: 3, offset: 4 }))
      .toThrow(/\[RES_002\]/);
  });

  it('rejects attribute lengths that are not aligned to size', () => {
    const geometry = createGeometry();
    expect(() => geometry.setAttribute(
      'aPosition',
      new Float32Array([0, 1, 2, 3, 4]),
      { size: 2 },
    )).toThrow(/\[RES_002\]/);
  });

  it('rejects matrix attributes with out-of-range rows or columns', () => {
    const geometry = createGeometry();
    const data = new Float32Array(8);
    expect(() => geometry.setAttribute('aMatrix', data, {
      kind: 'matrix',
      rows: 5 as any,
      columns: 2,
    })).toThrow(/\[RES_002\]/);
  });

  it('binds matrix attributes stored in VertexBuffers', () => {
    const geometry = createGeometry();
    const data = new Float32Array([
      1, 0, 0, 1,
      1, 0, 0, 1,
    ]);
    geometry.setAttribute('aMatrix', data, { kind: 'matrix', rows: 2, columns: 2 });
    const program = createProgramStub(['aMatrix']);
    geometry.bind(program);
  });

  it('binds matrix attributes stored in raw buffers', () => {
    const geometry = createGeometry();
    geometry.setAttribute(
      'aMatrix',
      { buffer: {} as WebGLBuffer, length: 8 },
      { kind: 'matrix', rows: 2, columns: 2, type: mockGL.SHORT, stride: 16, divisor: 1 },
    );
    const program = createProgramStub({ aMatrix: 1 });
    geometry.bind(program);
    expect(mockGL.vertexAttribDivisor).toHaveBeenCalled();
  });

  it('binds matrix attributes using byte-sized types', () => {
    const geometry = createGeometry();
    geometry.setAttribute(
      'aMatrix',
      { buffer: {} as WebGLBuffer, length: 4 },
      { kind: 'matrix', rows: 2, columns: 2, type: mockGL.BYTE, stride: 4 },
    );
    const program = createProgramStub({ aMatrix: 0 });
    geometry.bind(program);
    expect(mockCtx.vertexAttribPointer).toHaveBeenCalled();
  });

  it('binds matrix attributes using 4-byte types', () => {
    const geometry = createGeometry();
    geometry.setAttribute(
      'aMatrix',
      { buffer: {} as WebGLBuffer, length: 4 },
      { kind: 'matrix', rows: 2, columns: 2, type: mockGL.INT, stride: 16 },
    );
    const program = createProgramStub({ aMatrix: 0 });
    geometry.bind(program);
    expect(mockCtx.vertexAttribPointer).toHaveBeenCalled();
  });

  it('rejects unsupported GL types when resolving byte sizes', () => {
    const geometry = createGeometry() as any;
    expect(() => geometry._getByteSizeForGLType(0x9999, 'bind')).toThrow(/\[RES_002\]/);
  });

  it('binds integer attributes stored in VertexBuffers', () => {
    const geometry = createGeometry();
    geometry.setAttribute('aId', new Int16Array([1, 2]), { kind: 'integer', size: 1 });
    const program = createProgramStub({ aId: 0 });
    geometry.bind(program);
    expect(mockGL.vertexAttribIPointer).toHaveBeenCalled();
  });

  it('binds integer attributes using componentSize when config size is cleared', () => {
    const geometry = createGeometry();
    const buffer = new VertexBuffer(mockCtx as GLContext, 2);
    buffer.setData(new Int16Array([1, 2, 3, 4]));
    geometry.setAttribute('aId', buffer, { kind: 'integer' });
    const attr = geometry.getAttribute('aId')!;
    (attr.config as any).size = undefined;

    const program = createProgramStub({ aId: 0 });
    geometry.bind(program);

    const call = mockGL.vertexAttribIPointer.mock.calls[0];
    expect(call[1]).toBe(2);
  });

  it('binds integer attributes stored in raw buffers', () => {
    const geometry = createGeometry();
    geometry.setAttribute(
      'aId',
      { buffer: {} as WebGLBuffer, length: 4 },
      { kind: 'integer', size: 2, type: mockGL.SHORT, divisor: 1 },
    );
    const program = createProgramStub({ aId: 0 });
    geometry.bind(program);
    expect(mockGL.vertexAttribIPointer).toHaveBeenCalled();
  });

  it('binds integer raw buffers with default size and type when config cleared', () => {
    const geometry = createGeometry();
    geometry.setAttribute(
      'aId',
      { buffer: {} as WebGLBuffer, length: 2 },
      { kind: 'integer', size: 1, type: mockGL.UNSIGNED_SHORT },
    );
    const attr = geometry.getAttribute('aId')!;
    (attr.config as any).size = undefined;
    (attr.config as any).type = undefined;

    const program = createProgramStub({ aId: 0 });
    geometry.bind(program);

    const call = mockGL.vertexAttribIPointer.mock.calls[0];
    expect(call[1]).toBe(0);
    expect(call[2]).toBe(mockGL.INT);
  });

  it('binds float attributes stored in raw buffers', () => {
    const geometry = createGeometry();
    geometry.setAttribute(
      'aPosition',
      { buffer: {} as WebGLBuffer, length: 6 },
      { size: 3, type: mockGL.FLOAT, normalized: true, divisor: 2 },
    );
    const program = createProgramStub({ aPosition: 0 });
    geometry.bind(program);
    expect(mockCtx.vertexAttribPointer).toHaveBeenCalled();
    expect(mockGL.vertexAttribDivisor).toHaveBeenCalled();
  });

  it('binds float attributes using componentSize and default type when config cleared', () => {
    const geometry = createGeometry();
    const buffer = new VertexBuffer(mockCtx as GLContext, 3);
    buffer.setData(new Float32Array([0, 0, 0, 1, 0, 0]));
    geometry.setAttribute('aPosition', buffer, { size: 3 });
    const attr = geometry.getAttribute('aPosition')!;
    (attr.config as any).size = undefined;
    (attr.config as any).type = undefined;

    const program = createProgramStub({ aPosition: 0 });
    geometry.bind(program);

    const call = mockCtx.vertexAttribPointer.mock.calls[0];
    expect(call[1]).toBe(3);
    expect(call[2]).toBe(mockGL.FLOAT);
  });

  it('binds float raw buffers with default size, type, and normalized', () => {
    const geometry = createGeometry();
    geometry.setAttribute('aPosition', { buffer: {} as WebGLBuffer, length: 6 }, { size: 3 });
    const attr = geometry.getAttribute('aPosition')!;
    (attr.config as any).size = undefined;
    (attr.config as any).type = undefined;
    (attr.config as any).normalized = undefined;

    const program = createProgramStub({ aPosition: 0 });
    geometry.bind(program);

    const call = mockCtx.vertexAttribPointer.mock.calls[0];
    expect(call[1]).toBe(0);
    expect(call[2]).toBe(mockGL.FLOAT);
    expect(call[3]).toBe(false);
  });

  it('binds matrix raw buffers with default float type', () => {
    const geometry = createGeometry();
    geometry.setAttribute(
      'aMatrix',
      { buffer: {} as WebGLBuffer, length: 4 },
      { kind: 'matrix', rows: 2, columns: 2 },
    );
    const attr = geometry.getAttribute('aMatrix')!;
    (attr.config as any).type = undefined;

    const program = createProgramStub({ aMatrix: 0 });
    geometry.bind(program);

    const call = mockCtx.vertexAttribPointer.mock.calls[0];
    expect(call[2]).toBe(mockGL.FLOAT);
    expect(call[3]).toBe(false);
  });

  it('binds index buffers using IndexBuffer instances', () => {
    const geometry = createGeometry();
    geometry.setAttribute('aPosition', new Float32Array([0, 0, 0]), { size: 3 });
    geometry.setIndex([0, 1, 2]);
    const program = createProgramStub({ aPosition: 0 });
    geometry.bind(program);
    expect(mockGL.bindBuffer).toHaveBeenCalledWith(mockGL.ELEMENT_ARRAY_BUFFER, expect.anything());
  });

  it('binds index buffers using raw WebGL buffers', () => {
    const geometry = createGeometry();
    geometry.setAttribute('aPosition', new Float32Array([0, 0, 0]), { size: 3 });
    geometry.setIndex({ buffer: {} as WebGLBuffer, count: 3, type: mockGL.UNSIGNED_SHORT });
    const program = createProgramStub({ aPosition: 0 });
    geometry.bind(program);
    expect(mockCtx.bindBuffer).toHaveBeenCalledWith(mockGL.ELEMENT_ARRAY_BUFFER, expect.anything());
  });

  it('unbinds geometry state', () => {
    const geometry = createGeometry();
    geometry.unbind();
    expect(mockCtx.unbindVertexArray).toHaveBeenCalled();
  });

  it('rebuilds cached VAOs when attributes change', () => {
    const geometry = createGeometry();
    geometry.setAttribute('aPosition', new Float32Array([0, 0, 0]), { size: 3 });
    const program = createProgramStub({ aPosition: 0 });

    geometry.bind(program);
    geometry.setAttribute('aNormal', new Float32Array([0, 0, 1]), { size: 3 });
    geometry.bind(program);

    expect(mockGL.deleteVertexArray).toHaveBeenCalledTimes(1);
  });

  it('throws when attribute location overrides mismatch program locations', () => {
    const geometry = createGeometry();
    geometry.setAttribute('aPosition', new Float32Array([0, 0, 0]), { size: 3, location: 1 });
    const program = createProgramStub({ aPosition: 0 });
    expect(() => geometry.bind(program)).toThrow(/\[RES_002\]/);
  });

  it('skips geometry attributes that are not active in the program', () => {
    const geometry = createGeometry();
    geometry.setAttribute('aPosition', new Float32Array([0, 0, 0]), { size: 3 });
    geometry.setAttribute('aNormal', new Float32Array([0, 0, 1]), { size: 3 });
    const program = createProgramStub({ aPosition: 0, aNormal: -1 });
    geometry.bind(program);
    expect(mockCtx.vertexAttribPointer).toHaveBeenCalledTimes(1);
  });

  it('ignores program attributes optimized out by the linker', () => {
    const geometry = createGeometry();
    geometry.setAttribute('aPosition', new Float32Array([0, 0, 0]), { size: 3 });
    const program = createProgramStub({ aPosition: 0, aUnused: -1 });
    geometry.bind(program);
  });

  it('throws when size is missing for non-matrix attributes', () => {
    const geometry = createGeometry();
    const positions = new Float32Array([0, 0, 0]);
    expect(() => geometry.setAttribute('aPosition', positions, {})).toThrow(/\[RES_002\]/);
  });

  it('throws when matrix attributes are missing rows or columns', () => {
    const geometry = createGeometry();
    const data = new Float32Array([1, 0, 0, 1]);
    expect(() => geometry.setAttribute('aMatrix', data, { kind: 'matrix', rows: 2 as any })).toThrow(/\[RES_002\]/);
  });

  it('rejects type mismatches between data and config', () => {
    const geometry = createGeometry();
    const data = new Uint16Array([1, 2, 3, 4]);
    expect(() =>
      geometry.setAttribute('aPosition', data, { size: 2, type: mockGL.FLOAT }),
    ).toThrow(/\[RES_002\]/);
  });

  it('validates integer attribute types', () => {
    const geometry = createGeometry();
    const data = new Int16Array([1, 2, 3, 4]);
    expect(() =>
      geometry.setAttribute('aIndices', data, { kind: 'integer', size: 2, type: mockGL.FLOAT }),
    ).toThrow(/\[RES_002\]/);
  });

  it('rejects unsupported typed arrays for attribute data', () => {
    const geometry = createGeometry();
    const data = new Float64Array([0, 1, 2, 3]);
    expect(() => geometry.setAttribute('aPosition', data, { size: 2 })).toThrow(/\[RES_002\]/);
  });

  it('infers GL types from VertexBuffer element types', () => {
    const cases = [
      { data: new Int8Array([1]), glType: mockGL.BYTE },
      { data: new Uint8Array([1]), glType: mockGL.UNSIGNED_BYTE },
      { data: new Uint8ClampedArray([1]), glType: mockGL.UNSIGNED_BYTE },
      { data: new Int16Array([1]), glType: mockGL.SHORT },
      { data: new Uint16Array([1]), glType: mockGL.UNSIGNED_SHORT },
      { data: new Int32Array([1]), glType: mockGL.INT },
      { data: new Uint32Array([1]), glType: mockGL.UNSIGNED_INT },
      { data: new Float32Array([1]), glType: mockGL.FLOAT },
    ];
    for (const [index, entry] of cases.entries()) {
      const geometry = createGeometry();
      const buffer = new VertexBuffer(mockCtx as GLContext, 1);
      buffer.setData(entry.data);
      const name = `aAttr${index}`;
      geometry.setAttribute(name, buffer, {});
      expect(geometry.getAttribute(name)!.config.type).toBe(entry.glType);
    }
  });

  it('infers GL types from TypedArray inputs', () => {
    const cases = [
      { data: new Int8Array([1]), glType: mockGL.BYTE },
      { data: new Uint8Array([1]), glType: mockGL.UNSIGNED_BYTE },
      { data: new Uint8ClampedArray([1]), glType: mockGL.UNSIGNED_BYTE },
      { data: new Int32Array([1]), glType: mockGL.INT },
      { data: new Uint32Array([1]), glType: mockGL.UNSIGNED_INT },
    ];
    for (const [index, entry] of cases.entries()) {
      const geometry = createGeometry();
      const name = `aTyped${index}`;
      geometry.setAttribute(name, entry.data, { size: 1 });
      expect(geometry.getAttribute(name)!.config.type).toBe(entry.glType);
    }
  });

  it('rejects unsupported element types on VertexBuffers', () => {
    const geometry = createGeometry();
    const buffer = new VertexBuffer(mockCtx as GLContext, 1);
    buffer.setData(new Float32Array([1]));
    (buffer as any)._elementType = 999;
    expect(() => geometry.setAttribute('aPosition', buffer, {})).toThrow(/\[RES_002\]/);
  });

  it('creates typed arrays from number data for each GL type', () => {
    const cases = [
      { glType: mockGL.BYTE, ctor: Int8Array },
      { glType: mockGL.UNSIGNED_BYTE, ctor: Uint8Array },
      { glType: mockGL.SHORT, ctor: Int16Array },
      { glType: mockGL.UNSIGNED_SHORT, ctor: Uint16Array },
      { glType: mockGL.INT, ctor: Int32Array },
      { glType: mockGL.UNSIGNED_INT, ctor: Uint32Array },
      { glType: mockGL.FLOAT, ctor: Float32Array },
    ];
    for (const [index, entry] of cases.entries()) {
      const geometry = createGeometry();
      const name = `aNum${index}`;
      geometry.setAttribute(name, [0, 1], { size: 1, type: entry.glType });
      expect(geometry.getAttribute(name)!.data).toBeInstanceOf(entry.ctor);
    }
  });

  it('rejects unsupported GL types when coercing number data', () => {
    const geometry = createGeometry();
    expect(() => geometry.setAttribute('aPosition', [0, 1], { size: 1, type: 0x9999 as any }))
      .toThrow(/\[RES_002\]/);
  });

  it('validates internal attribute layout helpers', () => {
    const geometry = createGeometry() as any;
    const config = { name: 'aPosition', kind: 'float', type: mockGL.FLOAT, size: 3 };

    expect(() => geometry._resolveAttributeLayout(
      {} as ArrayBufferView,
      config,
      3,
      'computeBoundingBox',
      'aPosition',
    )).toThrow(/\[RES_002\]/);

    expect(() => geometry._resolveAttributeLayout(
      new Float32Array([0, 0, 0]),
      { ...config, stride: 2 },
      3,
      'computeBoundingBox',
      'aPosition',
    )).toThrow(/\[RES_002\]/);

    expect(() => geometry._resolveAttributeLayout(
      new Float32Array([0, 0, 0, 1, 0, 0]),
      { ...config, stride: 8 },
      3,
      'computeBoundingBox',
      'aPosition',
    )).toThrow(/\[RES_002\]/);

    expect(() => geometry._resolveAttributeLayout(
      new Float32Array([0, 0, 0, 1]),
      { name: 'aMatrix', kind: 'matrix', type: mockGL.FLOAT, rows: 2, columns: 2 },
      1,
      'computeBoundingBox',
      'aMatrix',
    )).toThrow(/\[RES_002\]/);

    expect(() => geometry._resolveAttributeLayout(
      new Float32Array([0, 0, 0]),
      { ...config, size: undefined },
      1,
      'computeBoundingBox',
      'aPosition',
    )).toThrow(/\[RES_002\]/);

    expect(() => geometry._resolveAttributeLayoutForComponentCount(
      new Float32Array([0, 0, 0]),
      0,
      config,
      'toNonIndexed',
      'aPosition',
    )).toThrow(/\[RES_002\]/);

    expect(() => geometry._resolveAttributeLayoutForComponentCount(
      {} as ArrayBufferView,
      3,
      config,
      'toNonIndexed',
      'aPosition',
    )).toThrow(/\[RES_002\]/);

    expect(() => geometry._resolveAttributeLayoutForComponentCount(
      new Float32Array([0, 0, 0]),
      3,
      { ...config, stride: 2 },
      'toNonIndexed',
      'aPosition',
    )).toThrow(/\[RES_002\]/);

    expect(() => geometry._resolveAttributeLayoutForComponentCount(
      new Float32Array([0, 0, 0, 1, 0, 0]),
      3,
      { ...config, stride: 8 },
      'toNonIndexed',
      'aPosition',
    )).toThrow(/\[RES_002\]/);
  });

  it('validates internal count and coercion helpers', () => {
    const geometry = createGeometry() as any;
    const attr = {
      buffer: {} as WebGLBuffer,
      config: { name: 'aPosition', kind: 'float', type: mockGL.FLOAT, size: 2 },
      owned: false,
      elementCount: 0,
      data: new Float32Array([0, 1, 2, 3]),
    };
    expect(geometry._getAttributeVertexCount(attr)).toBe(2);

    const zeroAttr = {
      buffer: {} as WebGLBuffer,
      config: { name: 'aZero', kind: 'float', type: mockGL.FLOAT, size: 0 },
      owned: false,
      elementCount: 0,
      data: new Float32Array([0]),
    };
    expect(geometry._getAttributeVertexCount(zeroAttr)).toBe(0);

    expect(geometry._getAttributeComponentCount({
      name: 'aMissingSize',
      kind: 'float',
      type: mockGL.FLOAT,
      size: undefined,
    })).toBe(0);

    expect(() => geometry._createTypedArrayFromNumbers([1], 0x9999, 'setAttribute'))
      .toThrow(/\[RES_002\]/);
  });

  it('validates numeric array requirements and index data shapes', () => {
    const geometry = createGeometry() as any;

    expect(() => geometry._requireNumericArray(
      new DataView(new ArrayBuffer(4)),
      'test',
      'aPosition',
    )).toThrow(/\[RES_002\]/);

    expect(() => geometry._requireNumericArray(
      new BigInt64Array(1),
      'test',
      'aPosition',
    )).toThrow(/\[RES_002\]/);

    const indexBuffer = new IndexBuffer(mockCtx as GLContext);
    indexBuffer.setDataRaw(new ArrayBuffer(4), 2);
    geometry._index = {
      buffer: indexBuffer,
      owned: false,
      count: 2,
      type: mockGL.UNSIGNED_SHORT,
      data: null,
    };
    expect(() => geometry._getIndexData('test')).toThrow(/\[RES_002\]/);

    geometry._index = {
      buffer: {} as WebGLBuffer,
      owned: false,
      count: 1,
      type: mockGL.UNSIGNED_SHORT,
      data: new DataView(new ArrayBuffer(2)),
    };
    expect(() => geometry._getIndexData('test')).toThrow(/\[RES_002\]/);

    geometry._index = {
      buffer: {} as WebGLBuffer,
      owned: false,
      count: 1,
      type: mockGL.UNSIGNED_SHORT,
      data: new BigUint64Array(1),
    };
    expect(() => geometry._getIndexData('test')).toThrow(/\[RES_002\]/);

    geometry._index = {
      buffer: {} as WebGLBuffer,
      owned: false,
      count: 1,
      type: mockGL.UNSIGNED_SHORT,
      data: new Int16Array(1),
    };
    expect(() => geometry._getIndexData('test')).toThrow(/\[RES_002\]/);
  });

  it('sets index buffers and infers index type', () => {
    const geometry = createGeometry();
    geometry.setAttribute('aPosition', new Float32Array([0, 0, 0]), { size: 3 });

    geometry.setIndex([0, 1, 2]);
    expect(geometry.isIndexed).toBe(true);
    expect(geometry.indexType).toBe(mockGL.UNSIGNED_BYTE);
    expect(geometry.indexCount).toBe(3);

    geometry.setIndex([0, 300, 2]);
    expect(geometry.indexType).toBe(mockGL.UNSIGNED_SHORT);
  });

  it('infers index types from IndexBuffer element types', () => {
    const geometry = createGeometry();
    const ubyteIndex = new IndexBuffer(mockCtx as GLContext);
    ubyteIndex.setData(new Uint8Array([0, 1, 2]));
    geometry.setIndex(ubyteIndex);
    expect(geometry.indexType).toBe(mockGL.UNSIGNED_BYTE);

    const ubyteClamped = new IndexBuffer(mockCtx as GLContext);
    ubyteClamped.setData(new Uint8ClampedArray([0, 1, 2]));
    geometry.setIndex(ubyteClamped);
    expect(geometry.indexType).toBe(mockGL.UNSIGNED_BYTE);

    const uintIndex = new IndexBuffer(mockCtx as GLContext);
    uintIndex.setData(new Uint32Array([0, 1, 2]));
    geometry.setIndex(uintIndex);
    expect(geometry.indexType).toBe(mockGL.UNSIGNED_INT);
  });

  it('accepts IndexBuffer instances and rejects invalid element types', () => {
    const geometry = createGeometry();
    const indexBuffer = new IndexBuffer(mockCtx as GLContext);
    indexBuffer.setData(new Uint16Array([0, 1, 2]));
    geometry.setIndex(indexBuffer);
    expect(geometry.indexType).toBe(mockGL.UNSIGNED_SHORT);

    const emptyIndexBuffer = new IndexBuffer(mockCtx as GLContext);
    expect(() => geometry.setIndex(emptyIndexBuffer)).toThrow(/\[RES_002\]/);

    const floatIndexBuffer = new IndexBuffer(mockCtx as GLContext);
    floatIndexBuffer.setData(new Float32Array([0, 1, 2]) as any);
    expect(() => geometry.setIndex(floatIndexBuffer)).toThrow(/\[RES_002\]/);
  });

  it('rejects invalid index typed arrays and raw index types', () => {
    const geometry = createGeometry();
    expect(() => geometry.setIndex(new Float32Array([0, 1, 2]) as any)).toThrow(/\[RES_002\]/);
    expect(() => geometry.setIndex({
      buffer: {} as WebGLBuffer,
      count: 3,
      type: mockGL.FLOAT,
    })).toThrow(/\[RES_002\]/);
  });

  it('selects Uint32 indices for large values and rejects oversized indices', () => {
    const geometry = createGeometry();
    geometry.setIndex([0, 70000, 2]);
    expect(geometry.indexType).toBe(mockGL.UNSIGNED_INT);
    expect(() => geometry.setIndex([0, 4294967296])).toThrow(/\[RES_002\]/);
  });

  it('rejects invalid index data', () => {
    const geometry = createGeometry();
    expect(() => geometry.setIndex([-1, 0, 1])).toThrow(/\[RES_002\]/);
    expect(() => geometry.setIndex(new Int16Array([1, 2, 3]) as any)).toThrow(/\[RES_002\]/);
  });

  it('expands indexed geometry with toNonIndexed', () => {
    const geometry = createGeometry();
    const positions = new Float32Array([
      0, 0, 0,
      1, 0, 0,
      0, 1, 0,
      1, 1, 0,
    ]);
    geometry.setAttribute('aPosition', positions, { size: 3 });
    geometry.setIndex([0, 2, 3]);

    const expanded = geometry.toNonIndexed();
    expect(expanded.isIndexed).toBe(false);
    expect(expanded.vertexCount).toBe(3);
    const data = expanded.getAttribute('aPosition')!.data as Float32Array;
    expect(Array.from(data)).toEqual([0, 0, 0, 0, 1, 0, 1, 1, 0]);
  });

  it('preserves per-instance attributes in toNonIndexed', () => {
    const geometry = createGeometry();
    const positions = new Float32Array([0, 0, 0, 1, 0, 0, 0, 1, 0]);
    const instances = new Float32Array([1, 2, 3]);
    geometry.setAttribute('aPosition', positions, { size: 3 });
    geometry.setAttribute('aInstance', instances, { size: 1, divisor: 1 });
    geometry.setIndex([0, 1, 2]);

    const expanded = geometry.toNonIndexed();
    const instanceData = expanded.getAttribute('aInstance')!.data as Float32Array;
    expect(Array.from(instanceData)).toEqual([1, 2, 3]);
  });

  it('throws when toNonIndexed lacks CPU data', () => {
    const geometry = createGeometry();
    const buffer = new VertexBuffer(mockCtx as GLContext, 3);
    geometry.setAttribute('aPosition', buffer, { size: 3 });
    expect(() => geometry.toNonIndexed()).toThrow(/\[RES_002\]/);
  });

  it('clones attributes when toNonIndexed is called without indices', () => {
    const geometry = createGeometry();
    const positions = new Float32Array([0, 0, 0, 1, 0, 0, 0, 1, 0]);
    geometry.setAttribute('aPosition', positions, { size: 3 });

    const clone = geometry.toNonIndexed();
    const data = clone.getAttribute('aPosition')!.data as Float32Array;
    expect(clone.isIndexed).toBe(false);
    expect(data).not.toBe(positions);
    expect(Array.from(data)).toEqual(Array.from(positions));
  });

  it('throws when toNonIndexed lacks CPU index data', () => {
    const geometry = createGeometry();
    geometry.setAttribute('aPosition', new Float32Array([0, 0, 0, 1, 0, 0, 0, 1, 0]), { size: 3 });
    geometry.setIndex({ buffer: {} as WebGLBuffer, count: 3, type: mockGL.UNSIGNED_SHORT });
    expect(() => geometry.toNonIndexed()).toThrow(/\[RES_002\]/);
  });

  it('throws when toNonIndexed sees invalid component counts', () => {
    const geometry = createGeometry();
    geometry.setAttribute('aPosition', new Float32Array([0, 0, 0, 1, 0, 0, 0, 1, 0]), { size: 3 });
    geometry.setIndex([0, 1, 2]);

    const attr = (geometry as any)._attributes.get('aPosition');
    attr.config.size = undefined;

    expect(() => geometry.toNonIndexed()).toThrow(/\[RES_002\]/);
  });

  it('expands matrix attributes in toNonIndexed', () => {
    const geometry = createGeometry();
    const matrices = new Float32Array([
      1, 0,
      0, 1,
      2, 0,
      0, 2,
    ]);
    geometry.setAttribute('aTransform', matrices, { kind: 'matrix', rows: 2, columns: 2 });
    geometry.setIndex([1, 0]);

    const expanded = geometry.toNonIndexed();
    const data = expanded.getAttribute('aTransform')!.data as Float32Array;
    expect(Array.from(data)).toEqual([2, 0, 0, 2, 1, 0, 0, 1]);
  });

  it('guards count when vertex data is GPU-only', () => {
    const geometry = createGeometry();
    const buffer = new VertexBuffer(mockCtx as GLContext, 3);
    geometry.setAttribute('aPosition', buffer, { size: 3 });
    expect(() => geometry.vertexCount).toThrow(/\[RES_002\]/);
    expect(() => geometry.count).toThrow(/\[RES_002\]/);
  });

  it('allows count access when only instanced attributes exist', () => {
    const geometry = createGeometry();
    geometry.setAttribute('aInstance', new Float32Array([1, 2, 3]), { size: 1, divisor: 1 });
    expect(geometry.count).toBe(0);
  });

  it('removes index buffers and switches to non-indexed rendering', () => {
    const geometry = createGeometry();
    geometry.setAttribute('aPosition', new Float32Array([0, 0, 0]), { size: 3 });
    geometry.setIndex([0]);
    geometry.removeIndex();
    expect(geometry.isIndexed).toBe(false);
    expect(geometry.indexCount).toBe(0);
  });

  it('computes bounding volumes and handles empty geometry', () => {
    const geometry = createGeometry();
    geometry.setAttribute('aPosition', new Float32Array([]), { size: 3 });
    geometry.computeBoundingBox().computeBoundingSphere();
    expect(geometry.boundingBox!.isEmpty).toBe(true);
    expect(geometry.boundingSphere!.isEmpty).toBe(true);
  });

  it('computes bounding box and sphere for valid data', () => {
    const geometry = createGeometry();
    const positions = new Float32Array([
      0, 0, 0,
      2, 0, 0,
      0, 2, 0,
    ]);
    geometry.setAttribute('aPosition', positions, { size: 3 });
    geometry.computeBoundingBox().computeBoundingSphere();

    const box = geometry.boundingBox!;
    expect(box.min.equals(new Vector3(0, 0, 0))).toBe(true);
    expect(box.max.equals(new Vector3(2, 2, 0))).toBe(true);

    const sphere = geometry.boundingSphere!;
    expect(sphere.center.equals(new Vector3(1, 1, 0))).toBe(true);
    expect(sphere.radius).toBeCloseTo(Math.sqrt(2));
  });

  it('rejects bounding computations on disposed geometry', () => {
    const geometry = createGeometry();
    geometry.setAttribute('aPosition', new Float32Array([0, 0, 0]), { size: 3 });
    geometry.dispose();
    expect(() => geometry.computeBoundingBox()).toThrow(/\[RES_001\]/);
    expect(() => geometry.computeBoundingSphere()).toThrow(/\[RES_001\]/);
  });

  it('rejects bounding computations without CPU attribute data', () => {
    const geometry = createGeometry();
    geometry.setAttribute('aPosition', { buffer: {} as WebGLBuffer, length: 3 }, { size: 3 });
    expect(() => geometry.computeBoundingBox()).toThrow(/\[RES_002\]/);
  });

  it('rejects bounding computations for matrix position attributes', () => {
    const geometry = createGeometry();
    const data = new Float32Array([1, 0, 0, 1]);
    geometry.setAttribute('aPosition', data, { kind: 'matrix', rows: 2, columns: 2 });
    expect(() => geometry.computeBoundingBox()).toThrow(/\[RES_002\]/);
  });

  it('rejects bounding computations for invalid attribute kinds', () => {
    const geometry = createGeometry();
    const data = new Int16Array([0, 0, 0]);
    geometry.setAttribute('aPosition', data, { kind: 'integer', size: 3, type: mockGL.SHORT });
    expect(() => geometry.computeBoundingBox()).toThrow(/\[RES_002\]/);
  });

  it('rejects bounding computations when position data is not a TypedArray', () => {
    const geometry = createGeometry() as any;
    geometry._attributes.set('aPosition', {
      buffer: {} as WebGLBuffer,
      config: { name: 'aPosition', kind: 'float', type: mockGL.FLOAT, size: 3 },
      owned: false,
      elementCount: 3,
      data: new DataView(new ArrayBuffer(12)),
    });
    geometry._vertexCount = 1;
    expect(() => geometry.computeBoundingBox()).toThrow(/\[RES_002\]/);
  });

  it('rejects bounding computations when position data is BigInt', () => {
    const geometry = createGeometry() as any;
    geometry._attributes.set('aPosition', {
      buffer: {} as WebGLBuffer,
      config: { name: 'aPosition', kind: 'float', type: mockGL.FLOAT, size: 3 },
      owned: false,
      elementCount: 3,
      data: new BigInt64Array([1n, 2n, 3n]),
    });
    geometry._vertexCount = 1;
    expect(() => geometry.computeBoundingBox()).toThrow(/\[RES_002\]/);
  });

  it('rejects bounding computations for instanced position data', () => {
    const geometry = createGeometry();
    geometry.setAttribute('aPosition', new Float32Array([0, 0, 0]), { size: 3, divisor: 1 });
    expect(() => geometry.computeBoundingBox()).toThrow(/\[RES_002\]/);
  });

  it('computes vertex and face normals', () => {
    const geometry = createGeometry();
    const positions = new Float32Array([
      0, 0, 0,
      1, 0, 0,
      0, 1, 0,
    ]);
    geometry.setAttribute('aPosition', positions, { size: 3 });
    geometry.computeVertexNormals();

    const normals = geometry.getAttribute('aNormal')!.data as Float32Array;
    expect(normals[2]).toBeCloseTo(1);

    geometry.removeAttribute('aNormal');
    geometry.computeFaceNormals();
    const faceNormals = geometry.getAttribute('aNormal')!.data as Float32Array;
    expect(faceNormals[2]).toBeCloseTo(1);
  });

  it('computes vertex normals for indexed geometry', () => {
    const geometry = createGeometry();
    const positions = new Float32Array([
      0, 0, 0,
      1, 0, 0,
      0, 1, 0,
    ]);
    geometry.setAttribute('aPosition', positions, { size: 3 });
    geometry.setIndex([0, 1, 2]);
    geometry.computeVertexNormals();
    const normals = geometry.getAttribute('aNormal')!.data as Float32Array;
    expect(normals[2]).toBeCloseTo(1);
  });

  it('throws when computing vertex normals on empty geometry', () => {
    const geometry = createGeometry();
    geometry.setAttribute('aPosition', new Float32Array([]), { size: 3 });
    expect(() => geometry.computeVertexNormals()).toThrow(/\[RES_002\]/);
  });

  it('throws when computing vertex normals on disposed geometry', () => {
    const geometry = createGeometry();
    geometry.setAttribute('aPosition', new Float32Array([0, 0, 0]), { size: 3 });
    geometry.dispose();
    expect(() => geometry.computeVertexNormals()).toThrow(/\[RES_001\]/);
  });

  it('throws when vertex normals indices are out of range', () => {
    const geometry = createGeometry();
    const positions = new Float32Array([
      0, 0, 0,
      1, 0, 0,
      0, 1, 0,
    ]);
    geometry.setAttribute('aPosition', positions, { size: 3 });
    geometry.setIndex([0, 1, 5]);
    expect(() => geometry.computeVertexNormals()).toThrow(/\[RES_002\]/);
  });

  it('throws when computeVertexNormals is used outside triangles', () => {
    const geometry = createGeometry();
    geometry.setAttribute('aPosition', new Float32Array([0, 0, 0]), { size: 3 });
    geometry.drawMode = DrawMode.LINES;
    expect(() => geometry.computeVertexNormals()).toThrow(/\[RES_002\]/);
  });

  it('throws when index count is not divisible by 3 for vertex normals', () => {
    const geometry = createGeometry();
    geometry.setAttribute('aPosition', new Float32Array([0, 0, 0, 1, 0, 0, 0, 1, 0]), { size: 3 });
    geometry.setIndex([0, 1]);
    expect(() => geometry.computeVertexNormals()).toThrow(/\[RES_002\]/);
  });

  it('throws when vertex count is not divisible by 3 for vertex normals', () => {
    const geometry = createGeometry();
    geometry.setAttribute('aPosition', new Float32Array([0, 0, 0, 1, 0, 0]), { size: 3 });
    expect(() => geometry.computeVertexNormals()).toThrow(/\[RES_002\]/);
  });

  it('throws when computing face normals on indexed geometry', () => {
    const geometry = createGeometry();
    const positions = new Float32Array([
      0, 0, 0,
      1, 0, 0,
      0, 1, 0,
    ]);
    geometry.setAttribute('aPosition', positions, { size: 3 });
    geometry.setIndex([0, 1, 2]);
    expect(() => geometry.computeFaceNormals()).toThrow(/\[RES_002\]/);
  });

  it('throws when computing face normals on empty geometry', () => {
    const geometry = createGeometry();
    geometry.setAttribute('aPosition', new Float32Array([]), { size: 3 });
    expect(() => geometry.computeFaceNormals()).toThrow(/\[RES_002\]/);
  });

  it('throws when computing face normals on disposed geometry', () => {
    const geometry = createGeometry();
    geometry.setAttribute('aPosition', new Float32Array([0, 0, 0]), { size: 3 });
    geometry.dispose();
    expect(() => geometry.computeFaceNormals()).toThrow(/\[RES_001\]/);
  });

  it('throws when computing face normals with non-triangle vertex counts', () => {
    const geometry = createGeometry();
    geometry.setAttribute('aPosition', new Float32Array([0, 0, 0, 1, 0, 0]), { size: 3 });
    expect(() => geometry.computeFaceNormals()).toThrow(/\[RES_002\]/);
  });

  it('computes tangents for valid data', () => {
    const geometry = createGeometry();
    const positions = new Float32Array([
      0, 0, 0,
      1, 0, 0,
      0, 1, 0,
    ]);
    const normals = new Float32Array([
      0, 0, 1,
      0, 0, 1,
      0, 0, 1,
    ]);
    const uvs = new Float32Array([
      0, 0,
      1, 0,
      0, 1,
    ]);
    geometry.setAttribute('aPosition', positions, { size: 3 });
    geometry.setAttribute('aNormal', normals, { size: 3 });
    geometry.setAttribute('aTexCoord', uvs, { size: 2 });
    geometry.computeTangents();

    const tangents = geometry.getAttribute('aTangent')!.data as Float32Array;
    expect(tangents[0]).toBeCloseTo(1);
    expect(tangents[1]).toBeCloseTo(0);
    expect(tangents[2]).toBeCloseTo(0);
    expect(tangents[3]).toBe(1);
  });

  it('computes tangents for indexed geometry', () => {
    const geometry = createGeometry();
    const positions = new Float32Array([
      0, 0, 0,
      1, 0, 0,
      0, 1, 0,
    ]);
    const normals = new Float32Array([
      0, 0, 1,
      0, 0, 1,
      0, 0, 1,
    ]);
    const uvs = new Float32Array([
      0, 0,
      1, 0,
      0, 1,
    ]);
    geometry.setAttribute('aPosition', positions, { size: 3 });
    geometry.setAttribute('aNormal', normals, { size: 3 });
    geometry.setAttribute('aTexCoord', uvs, { size: 2 });
    geometry.setIndex([0, 1, 2]);
    geometry.computeTangents();
    const tangents = geometry.getAttribute('aTangent')!.data as Float32Array;
    expect(tangents[0]).toBeCloseTo(1);
  });

  it('computes tangent handedness for mirrored UVs', () => {
    const geometry = createGeometry();
    const positions = new Float32Array([
      0, 0, 0,
      1, 0, 0,
      0, 1, 0,
    ]);
    const normals = new Float32Array([
      0, 0, 1,
      0, 0, 1,
      0, 0, 1,
    ]);
    const uvs = new Float32Array([
      0, 0,
      0, 1,
      1, 0,
    ]);
    geometry.setAttribute('aPosition', positions, { size: 3 });
    geometry.setAttribute('aNormal', normals, { size: 3 });
    geometry.setAttribute('aTexCoord', uvs, { size: 2 });
    geometry.computeTangents();

    const tangents = geometry.getAttribute('aTangent')!.data as Float32Array;
    expect(tangents[3]).toBe(-1);
  });

  it('throws when computing tangents on empty geometry', () => {
    const geometry = createGeometry();
    geometry.setAttribute('aPosition', new Float32Array([]), { size: 3 });
    geometry.setAttribute('aNormal', new Float32Array([]), { size: 3 });
    geometry.setAttribute('aTexCoord', new Float32Array([]), { size: 2 });
    expect(() => geometry.computeTangents()).toThrow(/\[RES_002\]/);
  });

  it('throws when computing tangents on disposed geometry', () => {
    const geometry = createGeometry();
    geometry.setAttribute('aPosition', new Float32Array([0, 0, 0]), { size: 3 });
    geometry.setAttribute('aNormal', new Float32Array([0, 0, 1]), { size: 3 });
    geometry.setAttribute('aTexCoord', new Float32Array([0, 0]), { size: 2 });
    geometry.dispose();
    expect(() => geometry.computeTangents()).toThrow(/\[RES_001\]/);
  });

  it('handles degenerate UVs during tangent computation', () => {
    const geometry = createGeometry();
    const positions = new Float32Array([
      0, 0, 0,
      1, 0, 0,
      0, 1, 0,
    ]);
    const normals = new Float32Array([
      0, 0, 1,
      0, 0, 1,
      0, 0, 1,
    ]);
    const uvs = new Float32Array([
      0, 0,
      0, 0,
      0, 0,
    ]);
    geometry.setAttribute('aPosition', positions, { size: 3 });
    geometry.setAttribute('aNormal', normals, { size: 3 });
    geometry.setAttribute('aTexCoord', uvs, { size: 2 });
    geometry.computeTangents();
    const tangents = geometry.getAttribute('aTangent')!.data as Float32Array;
    expect(tangents.length).toBe(positions.length / 3 * 4);
  });

  it('throws when tangent computation has invalid indices', () => {
    const geometry = createGeometry();
    const positions = new Float32Array([
      0, 0, 0,
      1, 0, 0,
      0, 1, 0,
    ]);
    const normals = new Float32Array([
      0, 0, 1,
      0, 0, 1,
      0, 0, 1,
    ]);
    const uvs = new Float32Array([
      0, 0,
      1, 0,
      0, 1,
    ]);
    geometry.setAttribute('aPosition', positions, { size: 3 });
    geometry.setAttribute('aNormal', normals, { size: 3 });
    geometry.setAttribute('aTexCoord', uvs, { size: 2 });
    geometry.setIndex([0, 1]);
    expect(() => geometry.computeTangents()).toThrow(/\[RES_002\]/);
  });

  it('throws when tangent computation uses too-small UV attributes', () => {
    const geometry = createGeometry();
    const positions = new Float32Array([
      0, 0, 0,
      1, 0, 0,
      0, 1, 0,
    ]);
    const normals = new Float32Array([
      0, 0, 1,
      0, 0, 1,
      0, 0, 1,
    ]);
    const uvs = new Float32Array([0, 1, 0]);
    geometry.setAttribute('aPosition', positions, { size: 3 });
    geometry.setAttribute('aNormal', normals, { size: 3 });
    geometry.setAttribute('aTexCoord', uvs, { size: 1 });
    expect(() => geometry.computeTangents()).toThrow(/\[RES_002\]/);
  });

  it('throws when tangent computation uses non-triangle vertex counts', () => {
    const geometry = createGeometry();
    const positions = new Float32Array([0, 0, 0, 1, 0, 0]);
    const normals = new Float32Array([0, 0, 1, 0, 0, 1]);
    const uvs = new Float32Array([0, 0, 1, 0]);
    geometry.setAttribute('aPosition', positions, { size: 3 });
    geometry.setAttribute('aNormal', normals, { size: 3 });
    geometry.setAttribute('aTexCoord', uvs, { size: 2 });
    expect(() => geometry.computeTangents()).toThrow(/\[RES_002\]/);
  });

  it('binds to a program and releases VAOs on dispose callbacks', () => {
    const geometry = createGeometry();
    geometry.setAttribute('aPosition', new Float32Array([0, 0, 0]), { size: 3 });
    const program = createProgramStub(['aPosition']);

    geometry.bind(program);
    expect(program.registerDisposeCallback).toHaveBeenCalledTimes(1);

    (program as any).__dispose();
    expect(program.unregisterDisposeCallback).toHaveBeenCalledTimes(1);
  });

  it('ignores program dispose callbacks after geometry is disposed', () => {
    const geometry = createGeometry();
    geometry.setAttribute('aPosition', new Float32Array([0, 0, 0]), { size: 3 });
    const program = createProgramStub(['aPosition']);

    geometry.bind(program);
    geometry.dispose();

    expect(() => (program as any).__dispose()).not.toThrow();
  });

  it('throws when program is missing attributes', () => {
    const geometry = createGeometry();
    geometry.setAttribute('aPosition', new Float32Array([0, 0, 0]), { size: 3 });
    const program = createProgramStub(['aNormal']);
    expect(() => geometry.bind(program)).toThrow(/\[RES_002\]/);
  });

  it('throws when binding a disposed program', () => {
    const geometry = createGeometry();
    geometry.setAttribute('aPosition', new Float32Array([0, 0, 0]), { size: 3 });
    const program = createProgramStub(['aPosition']) as any;
    program.isDisposed = true;
    expect(() => geometry.bind(program)).toThrow(/\[RES_001\]/);
  });

  it('detects raw buffer shapes using internal guards', () => {
    const geometry = createGeometry() as any;
    expect(geometry._isRawAttributeBuffer(null)).toBe(false);
    expect(geometry._isRawAttributeBuffer(new DataView(new ArrayBuffer(4)))).toBe(false);
    expect(geometry._isRawAttributeBuffer({ buffer: {} as WebGLBuffer, length: 1 })).toBe(true);
    expect(geometry._isRawIndexBuffer(null)).toBe(false);
    expect(geometry._isRawIndexBuffer(new DataView(new ArrayBuffer(4)))).toBe(false);
    expect(geometry._isRawIndexBuffer({
      buffer: {} as WebGLBuffer,
      count: 1,
      type: mockGL.UNSIGNED_SHORT,
    })).toBe(true);
  });
});
