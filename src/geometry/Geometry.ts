import { GLContext } from '../core/GLContext';
import { Program } from '../resources/Program';
import { VertexBuffer } from '../resources/buffers/VertexBuffer';
import { IndexBuffer } from '../resources/buffers/IndexBuffer';
import { ElementType } from '../resources/buffers/Buffer';
import { VertexArray } from '../resources/VertexArray';
import { AppError } from '../errors/AppError.js';
import { ErrorCode } from '../errors/ErrorCodes.js';
import { validate } from '../utils/validate.js';
import { Vector3 } from '../math/vectors/Vector3.js';
import { BoundingBox } from './spacial/BoundingBox.js';
import { BoundingSphere } from './spacial/BoundingSphere.js';

/**
 * WebGL draw modes
 */
export enum DrawMode {
  POINTS = 0x0000,
  LINES = 0x0001,
  LINE_LOOP = 0x0002,
  LINE_STRIP = 0x0003,
  TRIANGLES = 0x0004,
  TRIANGLE_STRIP = 0x0005,
  TRIANGLE_FAN = 0x0006,
}

/**
 * Attribute kinds for vertex data
 */
export type AttributeKind = 'float' | 'integer' | 'matrix';

/**
 * Base attribute configuration for vertex data
 */
export interface BaseAttributeConfig {
  /** Attribute name in the shader (e.g., 'aPosition', 'aNormal') */
  name: string;
  /** Attribute kind (float, integer, matrix) */
  kind?: AttributeKind;
  /** Data type (e.g., gl.FLOAT) */
  type?: GLenum;
  /**
   * Whether integer attribute data should be normalized by the GPU.
   * This does not validate or modify the CPU-side values.
   */
  normalized?: boolean;
  /** Byte offset between consecutive attributes (0 = tightly packed) */
  stride?: number;
  /** Byte offset of the first component */
  offset?: number;
  /** Explicit attribute location override */
  location?: number;
  /** Attribute divisor for instanced rendering */
  divisor?: number;
}

/**
 * Attribute configuration for float/normalized data
 */
export interface FloatAttributeConfig extends BaseAttributeConfig {
  kind?: 'float';
  /** Number of components per vertex (1-4) */
  size?: number;
}

/**
 * Attribute configuration for integer data
 */
export interface IntegerAttributeConfig extends BaseAttributeConfig {
  kind: 'integer';
  /** Number of components per vertex (1-4) */
  size?: number;
}

/**
 * Attribute configuration for matrix data
 */
export interface MatrixAttributeConfig extends BaseAttributeConfig {
  kind: 'matrix';
  /** Matrix row count */
  rows: 2 | 3 | 4;
  /** Matrix column count */
  columns: 2 | 3 | 4;
}

/**
 * Attribute configuration union
 */
export type AttributeConfig =
  | FloatAttributeConfig
  | IntegerAttributeConfig
  | MatrixAttributeConfig;

export type AttributeConfigInput =
  | Omit<FloatAttributeConfig, 'name'>
  | Omit<IntegerAttributeConfig, 'name'>
  | Omit<MatrixAttributeConfig, 'name'>;

/**
 * Raw attribute buffer escape hatch
 *
 * Note: length must be the element count for this attribute. Geometry cannot
 * infer counts from GPU-only data. CPU-side operations (e.g., toNonIndexed,
 * computeVertexNormals) require TypedArray data.
 */
export interface RawAttributeBuffer {
  buffer: WebGLBuffer;
  length: number;
}

/**
 * Raw index buffer escape hatch
 *
 * Note: count must be the index count. Geometry cannot infer counts from
 * GPU-only data. CPU-side operations (e.g., toNonIndexed) require TypedArray data.
 */
export interface RawIndexBuffer {
  buffer: WebGLBuffer;
  count: number;
  type: GLenum;
}

/**
 * Stored attribute data
 */
export interface AttributeData {
  buffer: VertexBuffer | WebGLBuffer;
  config: AttributeConfig;
  owned: boolean;
  elementCount: number;
  data?: ArrayBufferView;
}

interface IndexData {
  buffer: IndexBuffer | WebGLBuffer;
  owned: boolean;
  count: number;
  type: GLenum;
  data?: ArrayBufferView;
}

type AttributeInput = VertexBuffer | RawAttributeBuffer | ArrayBufferView | number[];

type NumericTypedArray =
  | Int8Array
  | Uint8Array
  | Uint8ClampedArray
  | Int16Array
  | Uint16Array
  | Int32Array
  | Uint32Array
  | Float32Array
  | Float64Array;

type NumericTypedArrayConstructor = {
  new (length: number): NumericTypedArray;
  new (values: ArrayLike<number>): NumericTypedArray;
};
type IndexInput = IndexBuffer | RawIndexBuffer | ArrayBufferView | number[];
type AttributeLayout = {
  size: number;
  stride: number;
  offset: number;
};

/**
 * Geometry - Base class for vertex data (Layer 3)
 *
 * Geometry holds vertex data (positions, normals, UVs, etc.) and index data
 * for rendering. It manages VertexBuffers, IndexBuffer, and VertexArray
 * internally.
 *
 * **Design:**
 * - Stores vertex attributes in VertexBuffers
 * - Optionally stores indices in IndexBuffer
 * - Uses VertexArray for attribute state
 * - Supports both indexed and non-indexed rendering
 *
 * **Usage:**
 * ```typescript
 * const geometry = new Geometry(ctx);
 * geometry.setAttribute('aPosition', positions, { size: 3 });
 * geometry.setAttribute('aNormal', normals, { size: 3 });
 * geometry.setIndex(indices);
 *
 * // During rendering
 * geometry.bind(program);
 * if (geometry.isIndexed) {
 *   ctx.gl.drawElements(geometry.drawMode, geometry.count, geometry.indexType!, 0);
 * } else {
 *   ctx.gl.drawArrays(geometry.drawMode, 0, geometry.count);
 * }
 * geometry.unbind();
 * ```
 *
 * @see VertexArray for VAO management
 * @see VertexBuffer for vertex data storage
 * @see IndexBuffer for index data storage
 */
export class Geometry {
  // TODO: Add normalize() method — rescale vertex positions to fit a unit
  // bounding box (or -1..1 range), opt-in only. Useful for importing meshes
  // at arbitrary scales. Should be applied before scene graph transforms.

  /**
   * The rendering context
   * @internal
   */
  protected _ctx: GLContext;

  /**
   * Vertex array objects for attribute state (per program).
   * Cached and rebuilt when attribute/index layout changes.
   * @internal
   */
  protected _vaos: Map<Program, VertexArray> = new Map();

  /**
   * Program disposal callbacks for cached VAOs
   * @internal
   */
  protected _programDisposeCallbacks: Map<Program, () => void> = new Map();

  /**
   * Vertex buffers for each attribute
   * @internal
   */
  protected _attributes: Map<string, AttributeData> = new Map();

  /**
   * Index buffer for indexed rendering
   * @internal
   */
  protected _index: IndexData | null = null;

  /**
   * Number of vertices (computed from attributes)
   * @internal
   */
  protected _vertexCount: number = 0;

  /**
   * Draw mode for rendering
   * @internal
   */
  protected _drawMode: DrawMode = DrawMode.TRIANGLES;

  /**
   * Tracks if this geometry has been disposed
   * @internal
   */
  protected _disposed: boolean = false;

  /**
   * Tracks if cached VAOs are stale and need rebuilding.
   * Set to true when attribute/index layout changes.
   * @internal
   */
  protected _vaosDirty: boolean = true;

  /**
   * Cached bounding box (null if not computed)
   * @internal
   */
  protected _boundingBox: BoundingBox | null = null;

  /**
   * Cached bounding sphere (null if not computed)
   * @internal
   */
  protected _boundingSphere: BoundingSphere | null = null;

  /**
   * Creates a new Geometry
   *
   * @param ctx - GLContext to use for buffer creation
   */
  constructor(ctx: GLContext) {
    this._ctx = ctx;
  }

  /**
   * Resource name for error messages (override in subclasses)
   */
  protected get _resourceName(): string {
    return 'Geometry';
  }

  /**
   * Whether this geometry has been disposed
   */
  get isDisposed(): boolean {
    return this._disposed;
  }

  /**
   * Gets the number of vertices
   */
  get vertexCount(): number {
    this._assertVertexCountKnown('vertexCount');
    return this._vertexCount;
  }

  /**
   * Gets the number of indices (0 if not indexed)
   */
  get indexCount(): number {
    return this._index ? this._index.count : 0;
  }

  /**
   * Gets the index type for drawElements (null if not indexed)
   */
  get indexType(): GLenum | null {
    return this._index ? this._index.type : null;
  }

  /**
   * Gets the count to use for draw calls
   *
   * Returns indexCount if indexed, vertexCount otherwise.
   * Use isIndexed, indexCount, and vertexCount for explicit control.
   *
   * Throws if per-vertex counts cannot be inferred (e.g., GPU-only data without
   * buffer metadata or explicit lengths).
   */
  get count(): number {
    this._assertVertexCountKnown('count');
    return this._index ? this._index.count : this._vertexCount;
  }

  /**
   * Returns true if this geometry uses indexed rendering
   */
  get isIndexed(): boolean {
    return this._index !== null;
  }

  /**
   * Gets the draw mode (TRIANGLES, LINES, etc.)
   */
  get drawMode(): DrawMode {
    return this._drawMode;
  }

  /**
   * Sets the draw mode
   */
  set drawMode(mode: DrawMode) {
    this._drawMode = mode;
  }

  /**
   * Gets the names of all declared attributes
   */
  get attributeNames(): string[] {
    return Array.from(this._attributes.keys());
  }

  /**
   * Checks if an attribute exists
   *
   * @param name - Attribute name
   * @returns true if the attribute exists
   */
  hasAttribute(name: string): boolean {
    return this._attributes.has(name);
  }

  /**
   * Gets an attribute's buffer and config
   *
   * @param name - Attribute name
   * @returns The attribute data or undefined if not found
   */
  getAttribute(name: string): AttributeData | undefined {
    return this._attributes.get(name);
  }

  /**
   * Sets a vertex attribute
   *
   * @param name - Attribute name (e.g., 'aPosition')
   * @param data - Vertex data or buffer
   * @param config - Attribute configuration
   * @returns this for method chaining
   * @throws AppError if geometry has been disposed
   */
  setAttribute(
    name: string,
    data: AttributeInput,
    config: AttributeConfigInput,
  ): this {
    if (this._disposed) {
      throw new AppError(ErrorCode.RES_DISPOSED, { resource: this._resourceName });
    }

    const context = this._getValidationContext('setAttribute');
    const kind: AttributeKind = config.kind ?? 'float';

    if (config.location !== undefined) {
      validate.number.nonNegativeInt(config.location, context, 'location');
    }
    if (config.stride !== undefined) {
      validate.number.nonNegativeInt(config.stride, context, 'stride');
    }
    if (config.offset !== undefined) {
      validate.number.nonNegativeInt(config.offset, context, 'offset');
    }
    if (config.divisor !== undefined) {
      validate.number.nonNegativeInt(config.divisor, context, 'divisor');
    }

    let resolvedSize: number | undefined;
    let rows: 2 | 3 | 4 | undefined;
    let columns: 2 | 3 | 4 | undefined;

    if (config.kind === 'matrix') {
      rows = config.rows;
      columns = config.columns;
      if (rows === undefined || columns === undefined) {
        throw new AppError(ErrorCode.RES_INVALID_ARG, {
          resource: this._resourceName,
          method: 'setAttribute',
          detail: 'matrix attributes require rows and columns',
        });
      }
      validate.number.inRange(rows, context, 2, 4, { label: 'rows' });
      validate.number.inRange(columns, context, 2, 4, { label: 'columns' });
    } else {
      if (config.size !== undefined) {
        resolvedSize = config.size;
      } else if (data instanceof VertexBuffer) {
        resolvedSize = data.componentSize;
      }
      if (resolvedSize === undefined) {
        throw new AppError(ErrorCode.RES_INVALID_ARG, {
          resource: this._resourceName,
          method: 'setAttribute',
          detail: 'size is required for non-matrix attributes',
        });
      }
      validate.number.inRange(resolvedSize, context, 1, 4, { label: 'size' });
    }

    const inferredType = this._inferAttributeTypeFromData(data, 'setAttribute');
    if (config.type !== undefined && inferredType !== undefined && config.type !== inferredType) {
      throw new AppError(ErrorCode.RES_INVALID_ARG, {
        resource: this._resourceName,
        method: 'setAttribute',
        detail: `data type does not match config.type (got ${inferredType}, expected ${config.type})`,
      });
    }

    let resolvedType = config.type ?? inferredType;
    if (resolvedType === undefined) {
      resolvedType = kind === 'integer' ? this._ctx.gl.INT : this._ctx.gl.FLOAT;
    }
    this._validateAttributeType(kind, resolvedType, 'setAttribute');

    let buffer: VertexBuffer | WebGLBuffer;
    let owned = false;
    let elementCount = 0;
    let attributeData: ArrayBufferView | undefined;

    if (data instanceof VertexBuffer) {
      buffer = data;
      elementCount = data.length;
    } else if (this._isRawAttributeBuffer(data)) {
      validate.number.nonNegativeInt(data.length, context, 'length');
      buffer = data.buffer;
      elementCount = data.length;
    } else {
      const arrayView = this._coerceAttributeDataToArrayView(
        data,
        resolvedType,
        'setAttribute',
      );
      const componentSize = kind === 'matrix' ? rows! : resolvedSize!;
      const vertexBuffer = new VertexBuffer(this._ctx, componentSize);
      vertexBuffer.setData(arrayView);
      buffer = vertexBuffer;
      owned = true;
      elementCount = vertexBuffer.length;
      attributeData = arrayView;
    }

    const resolvedConfig = this._buildAttributeConfig(
      name,
      kind,
      resolvedType,
      resolvedSize,
      rows,
      columns,
      config,
    );

    const existing = this._attributes.get(name);
    if (existing && existing.owned && existing.buffer instanceof VertexBuffer) {
      existing.buffer.dispose();
    }

    this._attributes.set(name, {
      buffer,
      config: resolvedConfig,
      owned,
      elementCount,
      data: attributeData,
    });

    this._recalculateVertexCount();
    this._vaosDirty = true;

    return this;
  }

  /**
   * Removes a vertex attribute
   *
   * @param name - Attribute name to remove
   * @returns this for method chaining
   * @throws AppError if geometry has been disposed
   */
  removeAttribute(name: string): this {
    if (this._disposed) {
      throw new AppError(ErrorCode.RES_DISPOSED, { resource: this._resourceName });
    }

    const attr = this._attributes.get(name);
    if (attr) {
      if (attr.owned && attr.buffer instanceof VertexBuffer) {
        attr.buffer.dispose();
      }
      this._attributes.delete(name);
      this._recalculateVertexCount();
      this._vaosDirty = true;
    }

    return this;
  }

  /**
   * Removes all vertex attributes
   *
   * @returns this for method chaining
   * @throws AppError if geometry has been disposed
   */
  clearAttributes(): this {
    if (this._disposed) {
      throw new AppError(ErrorCode.RES_DISPOSED, { resource: this._resourceName });
    }

    for (const attr of this._attributes.values()) {
      if (attr.owned && attr.buffer instanceof VertexBuffer) {
        attr.buffer.dispose();
      }
    }
    this._attributes.clear();
    this._recalculateVertexCount();
    this._vaosDirty = true;

    return this;
  }

  /**
   * Sets the index buffer for indexed rendering
   *
   * @param indices - Index data as Uint16Array, Uint32Array, Uint8Array, number array, or buffer
   * @returns this for method chaining
   * @throws AppError if geometry has been disposed
   */
  setIndex(indices: IndexInput): this {
    if (this._disposed) {
      throw new AppError(ErrorCode.RES_DISPOSED, { resource: this._resourceName });
    }

    const context = this._getValidationContext('setIndex');

    let buffer: IndexBuffer | WebGLBuffer;
    let owned = false;
    let count = 0;
    let type: GLenum;
    let indexData: ArrayBufferView | undefined;

    if (indices instanceof IndexBuffer) {
      const inferredType = this._getIndexTypeFromElementType(indices.elementType, 'setIndex');
      buffer = indices;
      count = indices.length;
      type = inferredType;
    } else if (this._isRawIndexBuffer(indices)) {
      validate.number.nonNegativeInt(indices.count, context, 'count');
      this._validateIndexType(indices.type, 'setIndex');
      buffer = indices.buffer;
      count = indices.count;
      type = indices.type;
    } else {
      let arrayView: ArrayBufferView;
      if (Array.isArray(indices)) {
        let maxIndex = 0;
        for (const value of indices) {
          if (!Number.isInteger(value) || value < 0) {
            throw new AppError(ErrorCode.RES_INVALID_ARG, {
              resource: this._resourceName,
              method: 'setIndex',
              detail: `index values must be non-negative integers, got ${value}`,
            });
          }
          if (value > maxIndex) {
            maxIndex = value;
          }
        }
        if (maxIndex <= 0xff) {
          arrayView = new Uint8Array(indices);
        } else if (maxIndex <= 0xffff) {
          arrayView = new Uint16Array(indices);
        } else if (maxIndex <= 0xffffffff) {
          arrayView = new Uint32Array(indices);
        } else {
          throw new AppError(ErrorCode.RES_INVALID_ARG, {
            resource: this._resourceName,
            method: 'setIndex',
            detail: `index value exceeds 32-bit unsigned range, got ${maxIndex}`,
          });
        }
      } else {
        arrayView = indices;
      }

      type = this._getIndexTypeFromArrayView(arrayView, 'setIndex');
      const indexBuffer = new IndexBuffer(this._ctx);
      indexBuffer.setData(arrayView);
      buffer = indexBuffer;
      owned = true;
      count = indexBuffer.length;
      indexData = arrayView;
    }

    if (this._index && this._index.owned && this._index.buffer instanceof IndexBuffer) {
      this._index.buffer.dispose();
    }

    this._index = { buffer, owned, count, type, data: indexData };
    this._vaosDirty = true;

    return this;
  }

  /**
   * Removes the index buffer (switches to non-indexed rendering)
   *
   * @returns this for method chaining
   * @throws AppError if geometry has been disposed
   */
  removeIndex(): this {
    if (this._disposed) {
      throw new AppError(ErrorCode.RES_DISPOSED, { resource: this._resourceName });
    }

    if (this._index) {
      if (this._index.owned && this._index.buffer instanceof IndexBuffer) {
        this._index.buffer.dispose();
      }
      this._index = null;
      this._vaosDirty = true;
    }

    return this;
  }

  /**
   * Creates a non-indexed copy of this geometry.
   *
   * Indexed, per-vertex attributes are expanded in index order. This requires
   * CPU-side attribute and index data (TypedArrays). Per-instance attributes
   * are copied as-is. Raw WebGL buffers or GPU-only data will throw.
   */
  toNonIndexed(): Geometry {
    if (this._disposed) {
      throw new AppError(ErrorCode.RES_DISPOSED, { resource: this._resourceName });
    }

    const geometry = new Geometry(this._ctx);
    geometry.drawMode = this._drawMode;

    const indices = this._getIndexData('toNonIndexed');
    const hasIndices = indices !== null;

    for (const [name, attr] of this._attributes) {
      const { name: _name, ...configInput } = attr.config as AttributeConfig;
      const divisor = attr.config.divisor ?? 0;
      const bufferData = attr.buffer instanceof VertexBuffer ? attr.buffer.data : null;
      if (!attr.data && !bufferData) {
        throw new AppError(ErrorCode.RES_INVALID_ARG, {
          resource: this._resourceName,
          method: 'toNonIndexed',
          detail:
            `attribute "${name}" has no CPU data; re-set it with a TypedArray ` +
            `or setDataRaw() with elementType to enable deindexing`,
        });
      }
      const { data } = this._requireAttributeData(name, 'toNonIndexed');
      const typed = this._requireNumericArray(data, 'toNonIndexed', name);
      const ctor = typed.constructor as NumericTypedArrayConstructor;

      if (!hasIndices || divisor !== 0) {
        const cloned = new ctor(typed as ArrayLike<number>);
        geometry.setAttribute(name, cloned, configInput as AttributeConfigInput);
        continue;
      }

      const componentCount = attr.config.kind === 'matrix'
        ? attr.config.rows * attr.config.columns
        : (attr.config.size ?? 0);

      if (componentCount <= 0) {
        throw new AppError(ErrorCode.RES_INVALID_ARG, {
          resource: this._resourceName,
          method: 'toNonIndexed',
          detail: `attribute "${name}" has invalid component count`,
        });
      }

      const layout = this._resolveAttributeLayoutForComponentCount(
        typed,
        componentCount,
        attr.config,
        'toNonIndexed',
        name,
      );

      const expanded = new ctor(indices.length * componentCount);
      let outOffset = 0;

      for (let i = 0; i < indices.length; i += 1) {
        const index = indices[i]!;
        this._assertIndexRange(index, this._vertexCount, 'toNonIndexed');
        const base = layout.offset + index * layout.stride;

        for (let c = 0; c < componentCount; c += 1) {
          expanded[outOffset] = typed[base + c]!;
          outOffset += 1;
        }
      }

      geometry.setAttribute(name, expanded, {
        ...(configInput as AttributeConfigInput),
        stride: 0,
        offset: 0,
      });
    }

    return geometry;
  }

  /**
   * Releases the cached VAO for a specific program, if present.
   *
   * Use this when a Program is disposed to avoid retaining stale VAOs.
   *
   * @example
   * program.dispose();
   * geometry.releaseProgram(program);
   */
  releaseProgram(program: Program): this {
    if (this._disposed) {
      throw new AppError(ErrorCode.RES_DISPOSED, { resource: this._resourceName });
    }

    const callback = this._programDisposeCallbacks.get(program);
    if (callback) {
      program.unregisterDisposeCallback(callback);
      this._programDisposeCallbacks.delete(program);
    }

    const vao = this._vaos.get(program);
    if (vao) {
      vao.dispose();
      this._vaos.delete(program);
    }

    return this;
  }

  /**
   * Binds the geometry for rendering
   *
   * This binds the VAO which includes all vertex attributes and the index buffer.
   * VAOs are cached per program and rebuilt after attribute/index changes.
   *
   * @returns this for method chaining
   * @throws AppError if geometry has been disposed
   */
  bind(program: Program): this {
    if (this._disposed) {
      throw new AppError(ErrorCode.RES_DISPOSED, { resource: this._resourceName });
    }
    if (program.isDisposed) {
      this.releaseProgram(program);
      throw new AppError(ErrorCode.RES_DISPOSED, {
        resource: 'Program',
        method: 'bind',
        detail: 'program has been disposed',
      });
    }

    if (this._vaosDirty) {
      for (const vao of this._vaos.values()) {
        vao.dispose();
      }
      this._vaos.clear();
    }

    let vao = this._vaos.get(program);
    if (!vao) {
      vao = new VertexArray(this._ctx);
      this._configureVAO(vao, program);
      this._vaos.set(program, vao);
      if (!this._programDisposeCallbacks.has(program)) {
        const onDispose = () => {
          if (this._disposed) {
            return;
          }
          this.releaseProgram(program);
        };
        this._programDisposeCallbacks.set(program, onDispose);
        program.registerDisposeCallback(onDispose);
      }
      this._vaosDirty = false;
    }

    vao.bind();
    return this;
  }

  /**
   * Unbinds the geometry
   *
   * @returns this for method chaining
   * @throws AppError if geometry has been disposed
   */
  unbind(): this {
    if (this._disposed) {
      throw new AppError(ErrorCode.RES_DISPOSED, { resource: this._resourceName });
    }

    this._ctx.unbindVertexArray();
    return this;
  }

  // ===========================================================================
  // Attribute Generation Helpers
  // ===========================================================================

  /**
   * Computes per-vertex (smooth) normals from positions and optional indices
   */
  computeVertexNormals(options: { position?: string; normal?: string } = {}): this {
    if (this._disposed) {
      throw new AppError(ErrorCode.RES_DISPOSED, { resource: this._resourceName });
    }

    this._assertTriangleMode('computeVertexNormals');

    const positionName = options.position ?? 'aPosition';
    const normalName = options.normal ?? 'aNormal';
    const { data: positionData, config: positionConfig } = this._requireAttributeData(
      positionName,
      'computeVertexNormals',
    );

    this._ensurePerVertexAttribute(positionConfig, positionName, 'computeVertexNormals');

    const positionLayout = this._resolveAttributeLayout(
      positionData,
      positionConfig,
      3,
      'computeVertexNormals',
      positionName,
    );

    const vertexCount = this._vertexCount;
    if (vertexCount === 0) {
      throw new AppError(ErrorCode.RES_INVALID_ARG, {
        resource: this._resourceName,
        method: 'computeVertexNormals',
        detail: 'geometry has no vertices',
      });
    }

    const normals = new Float32Array(vertexCount * 3);
    const positions = this._requireNumericArray(
      positionData,
      'computeVertexNormals',
      positionName,
    );
    const indices = this._getIndexData('computeVertexNormals');

    if (indices) {
      const indexCount = indices.length;
      if (indexCount % 3 !== 0) {
        throw new AppError(ErrorCode.RES_INVALID_ARG, {
          resource: this._resourceName,
          method: 'computeVertexNormals',
          detail: `index count ${indexCount} is not divisible by 3`,
        });
      }
      for (let i = 0; i < indexCount; i += 3) {
        const i0 = indices[i]!;
        const i1 = indices[i + 1]!;
        const i2 = indices[i + 2]!;

        this._accumulateTriangleNormal(
          positions,
          positionLayout,
          normals,
          i0,
          i1,
          i2,
          vertexCount,
        );
      }
    } else {
      if (vertexCount % 3 !== 0) {
        throw new AppError(ErrorCode.RES_INVALID_ARG, {
          resource: this._resourceName,
          method: 'computeVertexNormals',
          detail: `vertex count ${vertexCount} is not divisible by 3`,
        });
      }
      for (let i = 0; i < vertexCount; i += 3) {
        this._accumulateTriangleNormal(
          positions,
          positionLayout,
          normals,
          i,
          i + 1,
          i + 2,
          vertexCount,
        );
      }
    }

    for (let i = 0; i < vertexCount; i += 1) {
      const nx = normals[i * 3]!;
      const ny = normals[i * 3 + 1]!;
      const nz = normals[i * 3 + 2]!;
      const length = Math.sqrt(nx * nx + ny * ny + nz * nz);
      if (length > 0) {
        normals[i * 3] = nx / length;
        normals[i * 3 + 1] = ny / length;
        normals[i * 3 + 2] = nz / length;
      }
    }

    return this.setAttribute(normalName, normals, {
      size: 3,
      type: this._ctx.gl.FLOAT,
    });
  }

  /**
   * Computes per-face (flat) normals for non-indexed triangle geometry
   */
  computeFaceNormals(options: { position?: string; normal?: string } = {}): this {
    if (this._disposed) {
      throw new AppError(ErrorCode.RES_DISPOSED, { resource: this._resourceName });
    }

    this._assertTriangleMode('computeFaceNormals');

    if (this._index) {
      throw new AppError(ErrorCode.RES_INVALID_ARG, {
        resource: this._resourceName,
        method: 'computeFaceNormals',
        detail: 'computeFaceNormals() requires non-indexed geometry',
      });
    }

    const positionName = options.position ?? 'aPosition';
    const normalName = options.normal ?? 'aNormal';
    const { data: positionData, config: positionConfig } = this._requireAttributeData(
      positionName,
      'computeFaceNormals',
    );

    this._ensurePerVertexAttribute(positionConfig, positionName, 'computeFaceNormals');

    const positionLayout = this._resolveAttributeLayout(
      positionData,
      positionConfig,
      3,
      'computeFaceNormals',
      positionName,
    );

    const vertexCount = this._vertexCount;
    if (vertexCount === 0) {
      throw new AppError(ErrorCode.RES_INVALID_ARG, {
        resource: this._resourceName,
        method: 'computeFaceNormals',
        detail: 'geometry has no vertices',
      });
    }

    if (vertexCount % 3 !== 0) {
      throw new AppError(ErrorCode.RES_INVALID_ARG, {
        resource: this._resourceName,
        method: 'computeFaceNormals',
        detail: `vertex count ${vertexCount} is not divisible by 3`,
      });
    }

    const normals = new Float32Array(vertexCount * 3);
    const positions = this._requireNumericArray(
      positionData,
      'computeFaceNormals',
      positionName,
    );

    for (let i = 0; i < vertexCount; i += 3) {
      const normal = this._computeTriangleNormal(
        positions,
        positionLayout,
        i,
        i + 1,
        i + 2,
      );

      for (let v = 0; v < 3; v += 1) {
        const index = (i + v) * 3;
        normals[index] = normal[0];
        normals[index + 1] = normal[1];
        normals[index + 2] = normal[2];
      }
    }

    return this.setAttribute(normalName, normals, {
      size: 3,
      type: this._ctx.gl.FLOAT,
    });
  }

  /**
   * Computes per-vertex tangents from positions, normals, and UVs
   */
  computeTangents(options: {
    position?: string;
    normal?: string;
    uv?: string;
    tangent?: string;
  } = {}): this {
    if (this._disposed) {
      throw new AppError(ErrorCode.RES_DISPOSED, { resource: this._resourceName });
    }

    this._assertTriangleMode('computeTangents');

    const positionName = options.position ?? 'aPosition';
    const normalName = options.normal ?? 'aNormal';
    const uvName = options.uv ?? 'aTexCoord';
    const tangentName = options.tangent ?? 'aTangent';

    const { data: positionData, config: positionConfig } = this._requireAttributeData(
      positionName,
      'computeTangents',
    );
    const { data: normalData, config: normalConfig } = this._requireAttributeData(
      normalName,
      'computeTangents',
    );
    const { data: uvData, config: uvConfig } = this._requireAttributeData(
      uvName,
      'computeTangents',
    );

    this._ensurePerVertexAttribute(positionConfig, positionName, 'computeTangents');
    this._ensurePerVertexAttribute(normalConfig, normalName, 'computeTangents');
    this._ensurePerVertexAttribute(uvConfig, uvName, 'computeTangents');

    const positionLayout = this._resolveAttributeLayout(
      positionData,
      positionConfig,
      3,
      'computeTangents',
      positionName,
    );
    const normalLayout = this._resolveAttributeLayout(
      normalData,
      normalConfig,
      3,
      'computeTangents',
      normalName,
    );
    const uvLayout = this._resolveAttributeLayout(
      uvData,
      uvConfig,
      2,
      'computeTangents',
      uvName,
    );

    const vertexCount = this._vertexCount;
    if (vertexCount === 0) {
      throw new AppError(ErrorCode.RES_INVALID_ARG, {
        resource: this._resourceName,
        method: 'computeTangents',
        detail: 'geometry has no vertices',
      });
    }

    const tangents = new Float32Array(vertexCount * 3);
    const bitangents = new Float32Array(vertexCount * 3);
    const positions = this._requireNumericArray(
      positionData,
      'computeTangents',
      positionName,
    );
    const normals = this._requireNumericArray(
      normalData,
      'computeTangents',
      normalName,
    );
    const uvs = this._requireNumericArray(uvData, 'computeTangents', uvName);
    const indices = this._getIndexData('computeTangents');

    if (indices) {
      const indexCount = indices.length;
      if (indexCount % 3 !== 0) {
        throw new AppError(ErrorCode.RES_INVALID_ARG, {
          resource: this._resourceName,
          method: 'computeTangents',
          detail: `index count ${indexCount} is not divisible by 3`,
        });
      }
      for (let i = 0; i < indexCount; i += 3) {
        const i0 = indices[i]!;
        const i1 = indices[i + 1]!;
        const i2 = indices[i + 2]!;

        this._accumulateTriangleTangent(
          positions,
          positionLayout,
          uvs,
          uvLayout,
          tangents,
          bitangents,
          i0,
          i1,
          i2,
          vertexCount,
        );
      }
    } else {
      if (vertexCount % 3 !== 0) {
        throw new AppError(ErrorCode.RES_INVALID_ARG, {
          resource: this._resourceName,
          method: 'computeTangents',
          detail: `vertex count ${vertexCount} is not divisible by 3`,
        });
      }
      for (let i = 0; i < vertexCount; i += 3) {
        this._accumulateTriangleTangent(
          positions,
          positionLayout,
          uvs,
          uvLayout,
          tangents,
          bitangents,
          i,
          i + 1,
          i + 2,
          vertexCount,
        );
      }
    }

    const tangentData = new Float32Array(vertexCount * 4);
    for (let i = 0; i < vertexCount; i += 1) {
      const nBase = normalLayout.offset + i * normalLayout.stride;
      const tBase = i * 3;
      const nx = normals[nBase]!;
      const ny = normals[nBase + 1]!;
      const nz = normals[nBase + 2]!;

      let tx = tangents[tBase]!;
      let ty = tangents[tBase + 1]!;
      let tz = tangents[tBase + 2]!;

      const dotNT = nx * tx + ny * ty + nz * tz;
      tx -= nx * dotNT;
      ty -= ny * dotNT;
      tz -= nz * dotNT;

      const length = Math.sqrt(tx * tx + ty * ty + tz * tz);
      if (length > 0) {
        tx /= length;
        ty /= length;
        tz /= length;
      }

      const bx = bitangents[tBase]!;
      const by = bitangents[tBase + 1]!;
      const bz = bitangents[tBase + 2]!;

      const cx = ny * tz - nz * ty;
      const cy = nz * tx - nx * tz;
      const cz = nx * ty - ny * tx;
      const w = (cx * bx + cy * by + cz * bz) < 0 ? -1 : 1;

      const outBase = i * 4;
      tangentData[outBase] = tx;
      tangentData[outBase + 1] = ty;
      tangentData[outBase + 2] = tz;
      tangentData[outBase + 3] = w;
    }

    return this.setAttribute(tangentName, tangentData, {
      size: 4,
      type: this._ctx.gl.FLOAT,
    });
  }

  // ===========================================================================
  // Bounding Volume Methods
  // ===========================================================================

  /**
   * Gets the cached bounding box
   *
   * Returns null if `computeBoundingBox()` has not been called.
   *
   * @see computeBoundingBox to compute the bounding box
   */
  get boundingBox(): BoundingBox | null {
    return this._boundingBox;
  }

  /**
   * Gets the cached bounding sphere
   *
   * Returns null if `computeBoundingSphere()` has not been called.
   *
   * @see computeBoundingSphere to compute the bounding sphere
   */
  get boundingSphere(): BoundingSphere | null {
    return this._boundingSphere;
  }

  /**
   * Computes the axis-aligned bounding box from position data
   *
   * The bounding box is cached and can be retrieved with the `boundingBox`
   * property. Call this method again if positions change.
   *
   * @param options - Options for position attribute name
   * @returns this for method chaining
   * @throws AppError if geometry has been disposed or position data unavailable
   *
   * @example
   * ```typescript
   * geometry.computeBoundingBox();
   * const box = geometry.boundingBox!;
   * console.log(box.min, box.max);
   * console.log(box.center, box.size);
   * ```
   */
  computeBoundingBox(options: { position?: string } = {}): this {
    if (this._disposed) {
      throw new AppError(ErrorCode.RES_DISPOSED, { resource: this._resourceName });
    }

    const positionName = options.position ?? 'aPosition';
    const { data: positionData, config: positionConfig } = this._requireAttributeData(
      positionName,
      'computeBoundingBox',
    );

    this._ensurePerVertexAttribute(positionConfig, positionName, 'computeBoundingBox');

    const positionLayout = this._resolveAttributeLayout(
      positionData,
      positionConfig,
      3,
      'computeBoundingBox',
      positionName,
    );

    const vertexCount = this._vertexCount;
    if (vertexCount === 0) {
      this._boundingBox = BoundingBox.empty();
      return this;
    }

    const positions = this._requireNumericArray(
      positionData,
      'computeBoundingBox',
      positionName,
    );

    let minX = Infinity;
    let minY = Infinity;
    let minZ = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    let maxZ = -Infinity;

    for (let i = 0; i < vertexCount; i += 1) {
      const base = positionLayout.offset + i * positionLayout.stride;
      const x = positions[base]!;
      const y = positions[base + 1]!;
      const z = positions[base + 2]!;

      if (x < minX) minX = x;
      if (y < minY) minY = y;
      if (z < minZ) minZ = z;
      if (x > maxX) maxX = x;
      if (y > maxY) maxY = y;
      if (z > maxZ) maxZ = z;
    }

    this._boundingBox = new BoundingBox(
      new Vector3(minX, minY, minZ),
      new Vector3(maxX, maxY, maxZ),
    );

    return this;
  }

  /**
   * Computes the bounding sphere from position data
   *
   * The bounding sphere is cached and can be retrieved with the `boundingSphere`
   * property. Call this method again if positions change.
   *
   * This method computes a tight bounding sphere using Ritter's algorithm:
   * 1. Find the AABB (or use existing boundingBox)
   * 2. Create initial sphere from AABB center and diagonal
   * 3. Expand to include all points
   *
   * @param options - Options for position attribute name
   * @returns this for method chaining
   * @throws AppError if geometry has been disposed or position data unavailable
   *
   * @example
   * ```typescript
   * geometry.computeBoundingSphere();
   * const sphere = geometry.boundingSphere!;
   * console.log(sphere.center, sphere.radius);
   * ```
   */
  computeBoundingSphere(options: { position?: string } = {}): this {
    if (this._disposed) {
      throw new AppError(ErrorCode.RES_DISPOSED, { resource: this._resourceName });
    }

    const positionName = options.position ?? 'aPosition';
    const { data: positionData, config: positionConfig } = this._requireAttributeData(
      positionName,
      'computeBoundingSphere',
    );

    this._ensurePerVertexAttribute(positionConfig, positionName, 'computeBoundingSphere');

    const positionLayout = this._resolveAttributeLayout(
      positionData,
      positionConfig,
      3,
      'computeBoundingSphere',
      positionName,
    );

    const vertexCount = this._vertexCount;
    if (vertexCount === 0) {
      this._boundingSphere = BoundingSphere.empty();
      return this;
    }

    const positions = this._requireNumericArray(
      positionData,
      'computeBoundingSphere',
      positionName,
    );

    // First pass: compute AABB to get initial center
    let minX = Infinity;
    let minY = Infinity;
    let minZ = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    let maxZ = -Infinity;

    for (let i = 0; i < vertexCount; i += 1) {
      const base = positionLayout.offset + i * positionLayout.stride;
      const x = positions[base]!;
      const y = positions[base + 1]!;
      const z = positions[base + 2]!;

      if (x < minX) minX = x;
      if (y < minY) minY = y;
      if (z < minZ) minZ = z;
      if (x > maxX) maxX = x;
      if (y > maxY) maxY = y;
      if (z > maxZ) maxZ = z;
    }

    // Initial sphere from AABB center
    const centerX = (minX + maxX) * 0.5;
    const centerY = (minY + maxY) * 0.5;
    const centerZ = (minZ + maxZ) * 0.5;

    // Find the point farthest from the center
    let maxDistSq = 0;
    for (let i = 0; i < vertexCount; i += 1) {
      const base = positionLayout.offset + i * positionLayout.stride;
      const dx = positions[base]! - centerX;
      const dy = positions[base + 1]! - centerY;
      const dz = positions[base + 2]! - centerZ;
      const distSq = dx * dx + dy * dy + dz * dz;
      if (distSq > maxDistSq) {
        maxDistSq = distSq;
      }
    }

    this._boundingSphere = new BoundingSphere(
      new Vector3(centerX, centerY, centerZ),
      Math.sqrt(maxDistSq),
    );

    return this;
  }

  /**
   * Cleans up all WebGL resources
   */
  dispose(): void {
    if (this._disposed) {
      return;
    }

    // Dispose all vertex buffers
    for (const attr of this._attributes.values()) {
      if (attr.owned && attr.buffer instanceof VertexBuffer) {
        attr.buffer.dispose();
      }
    }
    this._attributes.clear();

    // Dispose index buffer if exists
    if (this._index && this._index.owned && this._index.buffer instanceof IndexBuffer) {
      this._index.buffer.dispose();
    }
    this._index = null;

    // Dispose VAOs
    for (const vao of this._vaos.values()) {
      vao.dispose();
    }
    this._vaos.clear();
    for (const [program, callback] of this._programDisposeCallbacks) {
      program.unregisterDisposeCallback(callback);
    }
    this._programDisposeCallbacks.clear();

    this._disposed = true;
  }

  // ===========================================================================
  // Internal Helpers
  // ===========================================================================

  private _getValidationContext(method: string) {
    return {
      code: ErrorCode.RES_INVALID_ARG,
      resource: this._resourceName,
      method,
    };
  }

  private _buildAttributeConfig(
    name: string,
    kind: AttributeKind,
    type: GLenum,
    size: number | undefined,
    rows: 2 | 3 | 4 | undefined,
    columns: 2 | 3 | 4 | undefined,
    config: AttributeConfigInput,
  ): AttributeConfig {
    if (kind === 'matrix') {
      return {
        ...config,
        name,
        kind,
        type,
        rows: rows!,
        columns: columns!,
      } as AttributeConfig;
    }
    if (kind === 'integer') {
      return {
        ...config,
        name,
        kind,
        type,
        size,
      } as AttributeConfig;
    }
    return {
      ...config,
      name,
      kind: 'float',
      type,
      size,
    } as AttributeConfig;
  }

  private _recalculateVertexCount(): void {
    let baseCount: number | null = null;

    for (const attr of this._attributes.values()) {
      const divisor = attr.config.divisor ?? 0;
      if (divisor !== 0) {
        continue;
      }

      const count = this._getAttributeVertexCount(attr);
      if (count === 0) {
        baseCount = 0;
        continue;
      }
      if (baseCount === null) {
        baseCount = count;
      } else if (baseCount !== count) {
        throw new AppError(ErrorCode.RES_INVALID_ARG, {
          resource: this._resourceName,
          method: 'setAttribute',
          detail: `attribute "${attr.config.name}" count ${count} does not match existing vertex count ${baseCount}`,
        });
      }
    }

    this._vertexCount = baseCount ?? 0;
  }

  private _assertTriangleMode(methodName: string): void {
    if (this._drawMode !== DrawMode.TRIANGLES) {
      throw new AppError(ErrorCode.RES_INVALID_ARG, {
        resource: this._resourceName,
        method: methodName,
        detail: `operation requires TRIANGLES draw mode, got ${this._drawMode}`,
      });
    }
  }

  private _requireAttributeData(
    name: string,
    methodName: string,
  ): { data: ArrayBufferView; config: AttributeConfig } {
    const attr = this._attributes.get(name);
    if (!attr) {
      throw new AppError(ErrorCode.RES_INVALID_ARG, {
        resource: this._resourceName,
        method: methodName,
        detail: `attribute "${name}" is not defined`,
      });
    }

    let data = attr.data;
    if (!data && attr.buffer instanceof VertexBuffer) {
      data = attr.buffer.data ?? undefined;
    }

    if (!data) {
      throw new AppError(ErrorCode.RES_INVALID_ARG, {
        resource: this._resourceName,
        method: methodName,
        detail:
          `attribute "${name}" has no CPU data; re-set it with a TypedArray ` +
          `or setDataRaw() with elementType to enable computation`,
      });
    }

    if (!this._isTypedArray(data)) {
      throw new AppError(ErrorCode.RES_INVALID_ARG, {
        resource: this._resourceName,
        method: methodName,
        detail: `attribute "${name}" data must be a TypedArray`,
      });
    }

    if (data instanceof BigInt64Array || data instanceof BigUint64Array) {
      throw new AppError(ErrorCode.RES_INVALID_ARG, {
        resource: this._resourceName,
        method: methodName,
        detail: `attribute "${name}" data must be numeric, not BigInt`,
      });
    }

    return { data, config: attr.config };
  }

  private _ensurePerVertexAttribute(
    config: AttributeConfig,
    name: string,
    methodName: string,
  ): void {
    if (config.kind === 'matrix') {
      throw new AppError(ErrorCode.RES_INVALID_ARG, {
        resource: this._resourceName,
        method: methodName,
        detail: `attribute "${name}" cannot be a matrix attribute`,
      });
    }
    if (config.kind === 'integer') {
      throw new AppError(ErrorCode.RES_INVALID_ARG, {
        resource: this._resourceName,
        method: methodName,
        detail: `attribute "${name}" must be float-based for computation`,
      });
    }
    if (config.divisor && config.divisor !== 0) {
      throw new AppError(ErrorCode.RES_INVALID_ARG, {
        resource: this._resourceName,
        method: methodName,
        detail: `attribute "${name}" must be per-vertex (divisor 0)`,
      });
    }
  }

  private _resolveAttributeLayout(
    data: ArrayBufferView,
    config: AttributeConfig,
    requiredSize: number,
    methodName: string,
    name: string,
  ): AttributeLayout {
    const size = config.kind === 'matrix' ? 0 : config.size ?? 0;
    if (size < requiredSize) {
      throw new AppError(ErrorCode.RES_INVALID_ARG, {
        resource: this._resourceName,
        method: methodName,
        detail: `attribute "${name}" size must be at least ${requiredSize}, got ${size}`,
      });
    }

    const bytesPerElement = (data as { BYTES_PER_ELEMENT?: number }).BYTES_PER_ELEMENT;
    if (!bytesPerElement) {
      throw new AppError(ErrorCode.RES_INVALID_ARG, {
        resource: this._resourceName,
        method: methodName,
        detail: `attribute "${name}" data must be a TypedArray`,
      });
    }

    const strideBytes = config.stride ?? 0;
    const offsetBytes = config.offset ?? 0;

    if (strideBytes % bytesPerElement !== 0 || offsetBytes % bytesPerElement !== 0) {
      throw new AppError(ErrorCode.RES_INVALID_ARG, {
        resource: this._resourceName,
        method: methodName,
        detail: `attribute "${name}" stride/offset must align to element size`,
      });
    }

    const stride = strideBytes === 0 ? size : strideBytes / bytesPerElement;
    const offset = offsetBytes / bytesPerElement;

    if (stride < size) {
      throw new AppError(ErrorCode.RES_INVALID_ARG, {
        resource: this._resourceName,
        method: methodName,
        detail: `attribute "${name}" stride must be >= size`,
      });
    }

    return { size, stride, offset };
  }

  private _resolveAttributeLayoutForComponentCount(
    data: ArrayBufferView,
    componentCount: number,
    config: AttributeConfig,
    methodName: string,
    name: string,
  ): AttributeLayout {
    if (componentCount <= 0) {
      throw new AppError(ErrorCode.RES_INVALID_ARG, {
        resource: this._resourceName,
        method: methodName,
        detail: `attribute "${name}" has invalid component count`,
      });
    }

    const bytesPerElement = (data as { BYTES_PER_ELEMENT?: number }).BYTES_PER_ELEMENT;
    if (!bytesPerElement) {
      throw new AppError(ErrorCode.RES_INVALID_ARG, {
        resource: this._resourceName,
        method: methodName,
        detail: `attribute "${name}" data must be a TypedArray`,
      });
    }

    const strideBytes = config.stride ?? 0;
    const offsetBytes = config.offset ?? 0;

    if (strideBytes % bytesPerElement !== 0 || offsetBytes % bytesPerElement !== 0) {
      throw new AppError(ErrorCode.RES_INVALID_ARG, {
        resource: this._resourceName,
        method: methodName,
        detail: `attribute "${name}" stride/offset must align to element size`,
      });
    }

    const stride = strideBytes === 0 ? componentCount : strideBytes / bytesPerElement;
    const offset = offsetBytes / bytesPerElement;

    if (stride < componentCount) {
      throw new AppError(ErrorCode.RES_INVALID_ARG, {
        resource: this._resourceName,
        method: methodName,
        detail: `attribute "${name}" stride must be >= component count`,
      });
    }

    return { size: componentCount, stride, offset };
  }

  private _requireNumericArray(
    data: ArrayBufferView,
    methodName: string,
    label: string,
  ): NumericTypedArray {
    if (!this._isTypedArray(data)) {
      throw new AppError(ErrorCode.RES_INVALID_ARG, {
        resource: this._resourceName,
        method: methodName,
        detail: `attribute "${label}" data must be a TypedArray`,
      });
    }

    if (data instanceof BigInt64Array || data instanceof BigUint64Array) {
      throw new AppError(ErrorCode.RES_INVALID_ARG, {
        resource: this._resourceName,
        method: methodName,
        detail: `attribute "${label}" data must be numeric, not BigInt`,
      });
    }

    return data as NumericTypedArray;
  }

  private _getIndexData(
    methodName: string,
  ): Uint8Array | Uint16Array | Uint32Array | null {
    if (!this._index) {
      return null;
    }

    let data = this._index.data;
    if (!data && this._index.buffer instanceof IndexBuffer) {
      data = this._index.buffer.data ?? undefined;
    }

    if (!data) {
      throw new AppError(ErrorCode.RES_INVALID_ARG, {
        resource: this._resourceName,
        method: methodName,
        detail:
          'index data is not available on CPU; re-set indices with a TypedArray ' +
          'or setDataRaw() with elementType to enable computation',
      });
    }

    if (!this._isTypedArray(data)) {
      throw new AppError(ErrorCode.RES_INVALID_ARG, {
        resource: this._resourceName,
        method: methodName,
        detail: 'index data must be a TypedArray',
      });
    }

    if (data instanceof BigInt64Array || data instanceof BigUint64Array) {
      throw new AppError(ErrorCode.RES_INVALID_ARG, {
        resource: this._resourceName,
        method: methodName,
        detail: 'index data must be numeric, not BigInt',
      });
    }

    if (data instanceof Uint8Array || data instanceof Uint16Array || data instanceof Uint32Array) {
      return data;
    }

    throw new AppError(ErrorCode.RES_INVALID_ARG, {
      resource: this._resourceName,
      method: methodName,
      detail: 'index data must be Uint8Array, Uint16Array, or Uint32Array',
    });
  }

  private _accumulateTriangleNormal(
    positions: ArrayLike<number>,
    layout: AttributeLayout,
    normals: Float32Array,
    i0: number,
    i1: number,
    i2: number,
    vertexCount: number,
  ): void {
    this._assertIndexRange(i0, vertexCount, 'computeVertexNormals');
    this._assertIndexRange(i1, vertexCount, 'computeVertexNormals');
    this._assertIndexRange(i2, vertexCount, 'computeVertexNormals');

    const base0 = layout.offset + i0 * layout.stride;
    const base1 = layout.offset + i1 * layout.stride;
    const base2 = layout.offset + i2 * layout.stride;

    const p0x = positions[base0]!;
    const p0y = positions[base0 + 1]!;
    const p0z = positions[base0 + 2]!;
    const p1x = positions[base1]!;
    const p1y = positions[base1 + 1]!;
    const p1z = positions[base1 + 2]!;
    const p2x = positions[base2]!;
    const p2y = positions[base2 + 1]!;
    const p2z = positions[base2 + 2]!;

    const e1x = p1x - p0x;
    const e1y = p1y - p0y;
    const e1z = p1z - p0z;
    const e2x = p2x - p0x;
    const e2y = p2y - p0y;
    const e2z = p2z - p0z;

    const nx = e1y * e2z - e1z * e2y;
    const ny = e1z * e2x - e1x * e2z;
    const nz = e1x * e2y - e1y * e2x;

    const normalIndex0 = i0 * 3;
    const normalIndex1 = i1 * 3;
    const normalIndex2 = i2 * 3;
    normals[normalIndex0] = normals[normalIndex0]! + nx;
    normals[normalIndex0 + 1] = normals[normalIndex0 + 1]! + ny;
    normals[normalIndex0 + 2] = normals[normalIndex0 + 2]! + nz;
    normals[normalIndex1] = normals[normalIndex1]! + nx;
    normals[normalIndex1 + 1] = normals[normalIndex1 + 1]! + ny;
    normals[normalIndex1 + 2] = normals[normalIndex1 + 2]! + nz;
    normals[normalIndex2] = normals[normalIndex2]! + nx;
    normals[normalIndex2 + 1] = normals[normalIndex2 + 1]! + ny;
    normals[normalIndex2 + 2] = normals[normalIndex2 + 2]! + nz;
  }

  private _computeTriangleNormal(
    positions: ArrayLike<number>,
    layout: AttributeLayout,
    i0: number,
    i1: number,
    i2: number,
  ): [number, number, number] {
    const base0 = layout.offset + i0 * layout.stride;
    const base1 = layout.offset + i1 * layout.stride;
    const base2 = layout.offset + i2 * layout.stride;

    const p0x = positions[base0]!;
    const p0y = positions[base0 + 1]!;
    const p0z = positions[base0 + 2]!;
    const p1x = positions[base1]!;
    const p1y = positions[base1 + 1]!;
    const p1z = positions[base1 + 2]!;
    const p2x = positions[base2]!;
    const p2y = positions[base2 + 1]!;
    const p2z = positions[base2 + 2]!;

    const e1x = p1x - p0x;
    const e1y = p1y - p0y;
    const e1z = p1z - p0z;
    const e2x = p2x - p0x;
    const e2y = p2y - p0y;
    const e2z = p2z - p0z;

    let nx = e1y * e2z - e1z * e2y;
    let ny = e1z * e2x - e1x * e2z;
    let nz = e1x * e2y - e1y * e2x;

    const length = Math.sqrt(nx * nx + ny * ny + nz * nz);
    if (length > 0) {
      nx /= length;
      ny /= length;
      nz /= length;
    }

    return [nx, ny, nz];
  }

  private _accumulateTriangleTangent(
    positions: ArrayLike<number>,
    positionLayout: AttributeLayout,
    uvs: ArrayLike<number>,
    uvLayout: AttributeLayout,
    tangents: Float32Array,
    bitangents: Float32Array,
    i0: number,
    i1: number,
    i2: number,
    vertexCount: number,
  ): void {
    this._assertIndexRange(i0, vertexCount, 'computeTangents');
    this._assertIndexRange(i1, vertexCount, 'computeTangents');
    this._assertIndexRange(i2, vertexCount, 'computeTangents');

    const base0 = positionLayout.offset + i0 * positionLayout.stride;
    const base1 = positionLayout.offset + i1 * positionLayout.stride;
    const base2 = positionLayout.offset + i2 * positionLayout.stride;

    const p0x = positions[base0]!;
    const p0y = positions[base0 + 1]!;
    const p0z = positions[base0 + 2]!;
    const p1x = positions[base1]!;
    const p1y = positions[base1 + 1]!;
    const p1z = positions[base1 + 2]!;
    const p2x = positions[base2]!;
    const p2y = positions[base2 + 1]!;
    const p2z = positions[base2 + 2]!;

    const uvBase0 = uvLayout.offset + i0 * uvLayout.stride;
    const uvBase1 = uvLayout.offset + i1 * uvLayout.stride;
    const uvBase2 = uvLayout.offset + i2 * uvLayout.stride;

    const u0 = uvs[uvBase0]!;
    const v0 = uvs[uvBase0 + 1]!;
    const u1 = uvs[uvBase1]!;
    const v1 = uvs[uvBase1 + 1]!;
    const u2 = uvs[uvBase2]!;
    const v2 = uvs[uvBase2 + 1]!;

    const x1 = p1x - p0x;
    const y1 = p1y - p0y;
    const z1 = p1z - p0z;
    const x2 = p2x - p0x;
    const y2 = p2y - p0y;
    const z2 = p2z - p0z;

    const s1 = u1 - u0;
    const t1 = v1 - v0;
    const s2 = u2 - u0;
    const t2 = v2 - v0;

    const r = s1 * t2 - s2 * t1;
    if (r === 0) {
      return;
    }

    const invR = 1.0 / r;
    const tx = (x1 * t2 - x2 * t1) * invR;
    const ty = (y1 * t2 - y2 * t1) * invR;
    const tz = (z1 * t2 - z2 * t1) * invR;
    const bx = (x2 * s1 - x1 * s2) * invR;
    const by = (y2 * s1 - y1 * s2) * invR;
    const bz = (z2 * s1 - z1 * s2) * invR;

    const tangentIndex0 = i0 * 3;
    const tangentIndex1 = i1 * 3;
    const tangentIndex2 = i2 * 3;
    tangents[tangentIndex0] = tangents[tangentIndex0]! + tx;
    tangents[tangentIndex0 + 1] = tangents[tangentIndex0 + 1]! + ty;
    tangents[tangentIndex0 + 2] = tangents[tangentIndex0 + 2]! + tz;
    tangents[tangentIndex1] = tangents[tangentIndex1]! + tx;
    tangents[tangentIndex1 + 1] = tangents[tangentIndex1 + 1]! + ty;
    tangents[tangentIndex1 + 2] = tangents[tangentIndex1 + 2]! + tz;
    tangents[tangentIndex2] = tangents[tangentIndex2]! + tx;
    tangents[tangentIndex2 + 1] = tangents[tangentIndex2 + 1]! + ty;
    tangents[tangentIndex2 + 2] = tangents[tangentIndex2 + 2]! + tz;

    bitangents[tangentIndex0] = bitangents[tangentIndex0]! + bx;
    bitangents[tangentIndex0 + 1] = bitangents[tangentIndex0 + 1]! + by;
    bitangents[tangentIndex0 + 2] = bitangents[tangentIndex0 + 2]! + bz;
    bitangents[tangentIndex1] = bitangents[tangentIndex1]! + bx;
    bitangents[tangentIndex1 + 1] = bitangents[tangentIndex1 + 1]! + by;
    bitangents[tangentIndex1 + 2] = bitangents[tangentIndex1 + 2]! + bz;
    bitangents[tangentIndex2] = bitangents[tangentIndex2]! + bx;
    bitangents[tangentIndex2 + 1] = bitangents[tangentIndex2 + 1]! + by;
    bitangents[tangentIndex2 + 2] = bitangents[tangentIndex2 + 2]! + bz;
  }

  private _assertIndexRange(index: number, vertexCount: number, methodName: string): void {
    if (index < 0 || index >= vertexCount) {
      throw new AppError(ErrorCode.RES_INVALID_ARG, {
        resource: this._resourceName,
        method: methodName,
        detail: `index ${index} out of range (vertex count ${vertexCount})`,
      });
    }
  }

  private _isTypedArray(data: ArrayBufferView): boolean {
    return ArrayBuffer.isView(data) && !(data instanceof DataView);
  }

  private _getAttributeComponentCount(config: AttributeConfig): number {
    if (config.kind === 'matrix') {
      return config.rows * config.columns;
    }
    return config.size ?? 0;
  }

  private _assertVertexCountKnown(methodName: string): void {
    for (const attr of this._attributes.values()) {
      const divisor = attr.config.divisor ?? 0;
      if (divisor !== 0) {
        continue;
      }

      if (this._isVertexCountUnknown(attr)) {
        throw new AppError(ErrorCode.RES_INVALID_ARG, {
          resource: this._resourceName,
          method: methodName,
          detail:
            `attribute "${attr.config.name}" has no CPU data and no buffer metadata; ` +
            `call setData(), setMetadata(), or provide a RawAttributeBuffer length`,
        });
      }
    }
  }

  private _isVertexCountUnknown(attr: AttributeData): boolean {
    if (!(attr.buffer instanceof VertexBuffer)) {
      return false;
    }
    if (attr.data) {
      return false;
    }
    return attr.buffer.elementByteSize === 0 && attr.buffer.length === 0;
  }

  private _getAttributeVertexCount(attr: AttributeData): number {
    const components = this._getAttributeComponentCount(attr.config);
    if (components === 0) {
      return 0;
    }

    let bytesPerElement: number | null = null;
    let byteLength: number | null = null;

    if (attr.buffer instanceof VertexBuffer) {
      if (attr.buffer.elementByteSize > 0) {
        bytesPerElement = attr.buffer.elementByteSize;
        byteLength = attr.buffer.byteLength;
      }
    } else if (attr.data && this._isTypedArray(attr.data)) {
      const view = attr.data as unknown as { BYTES_PER_ELEMENT: number; byteLength: number };
      bytesPerElement = view.BYTES_PER_ELEMENT;
      byteLength = view.byteLength;
    }

    if (bytesPerElement !== null && byteLength !== null) {
      const strideBytes = attr.config.stride ?? 0;
      const offsetBytes = attr.config.offset ?? 0;
      const attributeBytes = components * bytesPerElement;

      if (byteLength === 0) {
        return 0;
      }

      if (byteLength < offsetBytes + attributeBytes) {
        throw new AppError(ErrorCode.RES_INVALID_ARG, {
          resource: this._resourceName,
          method: 'setAttribute',
          detail:
            `attribute "${attr.config.name}" offset ${offsetBytes} with size ` +
            `${attributeBytes} exceeds buffer size ${byteLength}`,
        });
      }

      if (strideBytes > 0) {
        if (offsetBytes + attributeBytes > strideBytes) {
          throw new AppError(ErrorCode.RES_INVALID_ARG, {
            resource: this._resourceName,
            method: 'setAttribute',
            detail:
              `attribute "${attr.config.name}" offset ${offsetBytes} with size ` +
              `${attributeBytes} exceeds stride ${strideBytes}`,
          });
        }
        if (byteLength % strideBytes !== 0) {
          throw new AppError(ErrorCode.RES_INVALID_ARG, {
            resource: this._resourceName,
            method: 'setAttribute',
            detail:
              `attribute "${attr.config.name}" data length ${byteLength} is not aligned to stride ${strideBytes}`,
          });
        }
        return byteLength / strideBytes;
      }

      const remaining = byteLength - offsetBytes;
      if (remaining % attributeBytes !== 0) {
        throw new AppError(ErrorCode.RES_INVALID_ARG, {
          resource: this._resourceName,
          method: 'setAttribute',
          detail:
            `attribute "${attr.config.name}" data length ${byteLength} is not aligned to size ${attributeBytes}`,
        });
      }

      return remaining / attributeBytes;
    }

    const elements = attr.buffer instanceof VertexBuffer
      ? attr.buffer.length
      : attr.elementCount;

    if (elements === 0) {
      return 0;
    }

    if (elements % components !== 0) {
      throw new AppError(ErrorCode.RES_INVALID_ARG, {
        resource: this._resourceName,
        method: 'setAttribute',
        detail: `attribute "${attr.config.name}" length ${elements} is not divisible by component count ${components}`,
      });
    }

    return elements / components;
  }

  private _inferAttributeTypeFromData(
    data: AttributeInput,
    methodName: string,
  ): GLenum | undefined {
    if (data instanceof VertexBuffer) {
      return this._getGLTypeFromElementType(
        data.elementType,
        methodName,
        'attribute buffer',
      );
    }
    if (ArrayBuffer.isView(data)) {
      return this._getGLTypeFromArrayView(data, methodName);
    }
    return undefined;
  }

  private _getGLTypeFromElementType(
    elementType: ElementType | null,
    methodName: string,
    label: string,
  ): GLenum | undefined {
    if (elementType === null) {
      return undefined;
    }

    const gl = this._ctx.gl;
    switch (elementType) {
      case ElementType.BYTE:
        return gl.BYTE;
      case ElementType.UBYTE:
      case ElementType.UBYTE_CLAMPED:
        return gl.UNSIGNED_BYTE;
      case ElementType.SHORT:
        return gl.SHORT;
      case ElementType.USHORT:
        return gl.UNSIGNED_SHORT;
      case ElementType.INT:
        return gl.INT;
      case ElementType.UINT:
        return gl.UNSIGNED_INT;
      case ElementType.FLOAT:
        return gl.FLOAT;
      default:
        throw new AppError(ErrorCode.RES_INVALID_ARG, {
          resource: this._resourceName,
          method: methodName,
          detail: `${label} has unsupported element type ${elementType}`,
        });
    }
  }

  private _getGLTypeFromArrayView(
    data: ArrayBufferView,
    methodName: string,
  ): GLenum {
    const gl = this._ctx.gl;
    if (data instanceof Int8Array) return gl.BYTE;
    if (data instanceof Uint8Array || data instanceof Uint8ClampedArray) return gl.UNSIGNED_BYTE;
    if (data instanceof Int16Array) return gl.SHORT;
    if (data instanceof Uint16Array) return gl.UNSIGNED_SHORT;
    if (data instanceof Int32Array) return gl.INT;
    if (data instanceof Uint32Array) return gl.UNSIGNED_INT;
    if (data instanceof Float32Array) return gl.FLOAT;

    throw new AppError(ErrorCode.RES_INVALID_ARG, {
      resource: this._resourceName,
      method: methodName,
      detail: `unsupported TypedArray type ${data.constructor.name}`,
    });
  }

  private _validateAttributeType(
    kind: AttributeKind,
    glType: GLenum,
    methodName: string,
  ): void {
    const gl = this._ctx.gl;
    const context = this._getValidationContext(methodName);
    const integerTypes = [
      gl.BYTE,
      gl.UNSIGNED_BYTE,
      gl.SHORT,
      gl.UNSIGNED_SHORT,
      gl.INT,
      gl.UNSIGNED_INT,
    ];

    if (kind === 'integer') {
      validate.set.oneOf(glType, integerTypes, context, {
        detail: `type must be an integer attribute type, got ${glType}`,
      });
      return;
    }

    validate.set.oneOf(glType, [...integerTypes, gl.FLOAT], context, {
      detail: `type must be a valid attribute type, got ${glType}`,
    });
  }

  private _coerceAttributeDataToArrayView(
    data: ArrayBufferView | number[],
    glType: GLenum,
    methodName: string,
  ): ArrayBufferView {
    if (ArrayBuffer.isView(data)) {
      return data;
    }
    return this._createTypedArrayFromNumbers(data, glType, methodName);
  }

  private _createTypedArrayFromNumbers(
    values: number[],
    glType: GLenum,
    methodName: string,
  ): ArrayBufferView {
    const gl = this._ctx.gl;
    switch (glType) {
      case gl.BYTE:
        return new Int8Array(values);
      case gl.UNSIGNED_BYTE:
        return new Uint8Array(values);
      case gl.SHORT:
        return new Int16Array(values);
      case gl.UNSIGNED_SHORT:
        return new Uint16Array(values);
      case gl.INT:
        return new Int32Array(values);
      case gl.UNSIGNED_INT:
        return new Uint32Array(values);
      case gl.FLOAT:
        return new Float32Array(values);
      default:
        throw new AppError(ErrorCode.RES_INVALID_ARG, {
          resource: this._resourceName,
          method: methodName,
          detail: `unsupported type for attribute data, got ${glType}`,
        });
    }
  }

  private _getIndexTypeFromArrayView(
    data: ArrayBufferView,
    methodName: string,
  ): GLenum {
    const gl = this._ctx.gl;
    if (data instanceof Uint8Array) return gl.UNSIGNED_BYTE;
    if (data instanceof Uint16Array) return gl.UNSIGNED_SHORT;
    if (data instanceof Uint32Array) return gl.UNSIGNED_INT;

    throw new AppError(ErrorCode.RES_INVALID_ARG, {
      resource: this._resourceName,
      method: methodName,
      detail: `index data must be Uint8Array, Uint16Array, or Uint32Array, got ${data.constructor.name}`,
    });
  }

  private _getIndexTypeFromElementType(
    elementType: ElementType | null,
    methodName: string,
  ): GLenum {
    if (elementType === null) {
      throw new AppError(ErrorCode.RES_INVALID_ARG, {
        resource: this._resourceName,
        method: methodName,
        detail: 'index buffer has no element type; call setData() first',
      });
    }

    const gl = this._ctx.gl;
    switch (elementType) {
      case ElementType.UBYTE:
      case ElementType.UBYTE_CLAMPED:
        return gl.UNSIGNED_BYTE;
      case ElementType.USHORT:
        return gl.UNSIGNED_SHORT;
      case ElementType.UINT:
        return gl.UNSIGNED_INT;
      default:
        throw new AppError(ErrorCode.RES_INVALID_ARG, {
          resource: this._resourceName,
          method: methodName,
          detail: `index buffer element type must be unsigned, got ${elementType}`,
        });
    }
  }

  private _validateIndexType(glType: GLenum, methodName: string): void {
    const gl = this._ctx.gl;
    const context = this._getValidationContext(methodName);
    validate.set.oneOf(
      glType,
      [gl.UNSIGNED_BYTE, gl.UNSIGNED_SHORT, gl.UNSIGNED_INT],
      context,
      {
        detail: `index type must be UNSIGNED_BYTE, UNSIGNED_SHORT, or UNSIGNED_INT, got ${glType}`,
      },
    );
  }

  private _getByteSizeForGLType(glType: GLenum, methodName: string): number {
    const gl = this._ctx.gl;
    switch (glType) {
      case gl.BYTE:
      case gl.UNSIGNED_BYTE:
        return 1;
      case gl.SHORT:
      case gl.UNSIGNED_SHORT:
        return 2;
      case gl.INT:
      case gl.UNSIGNED_INT:
      case gl.FLOAT:
        return 4;
      default:
        throw new AppError(ErrorCode.RES_INVALID_ARG, {
          resource: this._resourceName,
          method: methodName,
          detail: `unsupported type for attribute data, got ${glType}`,
        });
    }
  }

  private _configureVAO(vao: VertexArray, program: Program): void {
    const missing: string[] = [];
    for (const [name] of program.vertexShader.attributes) {
      const location = program.getAttributeLocation(name);
      if (location >= 0 && !this._attributes.has(name)) {
        missing.push(name);
      }
    }

    if (missing.length > 0) {
      throw new AppError(ErrorCode.RES_INVALID_ARG, {
        resource: this._resourceName,
        method: 'bind',
        detail: `program requires missing attribute(s): ${missing.join(', ')}`,
      });
    }

    for (const [name, attr] of this._attributes) {
      const config = attr.config;
      const programLocation = program.getAttributeLocation(name);
      if (programLocation === -1) {
        continue;
      }

      if (config.location !== undefined && config.location !== programLocation) {
        throw new AppError(ErrorCode.RES_INVALID_ARG, {
          resource: this._resourceName,
          method: 'bind',
          detail: `attribute "${name}" location mismatch (program ${programLocation}, config ${config.location})`,
        });
      }

      const location = config.location ?? programLocation;
      const stride = config.stride ?? 0;
      const offset = config.offset ?? 0;

      if (config.kind === 'integer') {
        if (attr.buffer instanceof VertexBuffer) {
          vao.setIntegerAttribute(location, attr.buffer, {
            size: config.size ?? attr.buffer.componentSize,
            type: config.type,
            stride,
            offset,
          });
        } else {
          vao.bind();
          this._ctx.bindBuffer(this._ctx.gl.ARRAY_BUFFER, attr.buffer);
          this._ctx.gl.vertexAttribIPointer(
            location,
            config.size ?? 0,
            config.type ?? this._ctx.gl.INT,
            stride,
            offset,
          );
          this._ctx.checkError('Geometry.bind()');
          this._ctx.enableVertexAttribArray(location);
          this._ctx.bindBuffer(this._ctx.gl.ARRAY_BUFFER, null);
          vao.unbind();
        }
        if (config.divisor !== undefined) {
          vao.setAttributeDivisor(location, config.divisor);
        }
        continue;
      }

      if (config.kind === 'matrix') {
        if (attr.buffer instanceof VertexBuffer) {
          vao.setMatrixAttribute(
            location,
            attr.buffer,
            config.rows,
            config.columns,
            {
              type: config.type,
              normalized: config.normalized ?? false,
              stride,
              offset,
              divisor: config.divisor,
            },
          );
        } else {
          const bytesPerComponent = this._getByteSizeForGLType(
            config.type ?? this._ctx.gl.FLOAT,
            'bind',
          );
          vao.bind();
          this._ctx.bindBuffer(this._ctx.gl.ARRAY_BUFFER, attr.buffer);
          for (let col = 0; col < config.columns; col += 1) {
            const columnOffset = offset + col * config.rows * bytesPerComponent;
            this._ctx.vertexAttribPointer(
              location + col,
              config.rows,
              config.type ?? this._ctx.gl.FLOAT,
              config.normalized ?? false,
              stride,
              columnOffset,
            );
            this._ctx.enableVertexAttribArray(location + col);
            if (config.divisor !== undefined) {
              this._ctx.gl.vertexAttribDivisor(location + col, config.divisor);
              this._ctx.checkError('Geometry.bind()');
            }
          }
          this._ctx.bindBuffer(this._ctx.gl.ARRAY_BUFFER, null);
          vao.unbind();
        }
        continue;
      }

      if (attr.buffer instanceof VertexBuffer) {
        vao.setAttribute(location, attr.buffer, {
          size: config.size ?? attr.buffer.componentSize,
          type: config.type,
          normalized: config.normalized ?? false,
          stride,
          offset,
        });
      } else {
        vao.bind();
        this._ctx.bindBuffer(this._ctx.gl.ARRAY_BUFFER, attr.buffer);
        this._ctx.vertexAttribPointer(
          location,
          config.size ?? 0,
          config.type ?? this._ctx.gl.FLOAT,
          config.normalized ?? false,
          stride,
          offset,
        );
        this._ctx.enableVertexAttribArray(location);
        this._ctx.bindBuffer(this._ctx.gl.ARRAY_BUFFER, null);
        vao.unbind();
      }

      if (config.divisor !== undefined) {
        vao.setAttributeDivisor(location, config.divisor);
      }
    }

    if (this._index) {
      if (this._index.buffer instanceof IndexBuffer) {
        vao.setIndexBuffer(this._index.buffer);
      } else {
        vao.bind();
        this._ctx.bindBuffer(this._ctx.gl.ELEMENT_ARRAY_BUFFER, this._index.buffer);
        vao.unbind();
      }
    }
  }

  private _isRawAttributeBuffer(value: unknown): value is RawAttributeBuffer {
    if (!value || typeof value !== 'object') {
      return false;
    }
    if (ArrayBuffer.isView(value)) {
      return false;
    }
    return 'buffer' in value && 'length' in value;
  }

  private _isRawIndexBuffer(value: unknown): value is RawIndexBuffer {
    if (!value || typeof value !== 'object') {
      return false;
    }
    if (ArrayBuffer.isView(value)) {
      return false;
    }
    return 'buffer' in value && 'count' in value && 'type' in value;
  }
}
