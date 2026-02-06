/**
 * Buffer - GPU Buffer abstraction
 *
 * Provides abstraction for WebGL Buffer Objects.
 * Handles buffer creation, data upload, binding, and cleanup.
 *
 * Use factory methods to create specific buffer types:
 * - Buffer.createVertexBuffer() for vertex attribute data (VBO)
 * - Buffer.createIndexBuffer() for vertex indices (IBO)
 * - Buffer.createUniformBuffer() for shader uniforms
 * - etc.
 *
 * @class Buffer
 */

import { GLContext } from '../../core/GLContext';
import { AppError } from '../../errors/AppError.js';
import { ErrorCode } from '../../errors/ErrorCodes.js';

/**
 * Enumeration of buffer targets
 * Used to specify what type of buffer data is being stored
 *
 * WebGL 2.0 supports eight different buffer binding targets, each with specific use cases:
 * - ARRAY_BUFFER: Vertex attribute data (VBO)
 * - ELEMENT_ARRAY_BUFFER: Vertex index data (IBO)
 * - COPY_READ_BUFFER: Source for buffer-to-buffer copy operations
 * - COPY_WRITE_BUFFER: Destination for buffer-to-buffer copy operations
 * - PIXEL_PACK_BUFFER: Pixel data readback from GPU to CPU
 * - PIXEL_UNPACK_BUFFER: Pixel data upload from CPU to GPU
 * - TRANSFORM_FEEDBACK_BUFFER: Output buffer for transform feedback operations
 * - UNIFORM_BUFFER: Shader uniform block data
 */
export enum BufferTarget {
  ARRAY_BUFFER = 0x8892, // For vertex attribute data (VBO)
  ELEMENT_ARRAY_BUFFER = 0x8893, // For vertex index data (IBO)
  COPY_READ_BUFFER = 0x8f36, // Source for buffer-to-buffer copies
  COPY_WRITE_BUFFER = 0x8f37, // Destination for buffer-to-buffer copies
  PIXEL_PACK_BUFFER = 0x88d2, // For GPU-to-CPU pixel data readback
  PIXEL_UNPACK_BUFFER = 0x88d4, // For CPU-to-GPU pixel data upload
  TRANSFORM_FEEDBACK_BUFFER = 0x8c8e, // For transform feedback output
  UNIFORM_BUFFER = 0x8a11, // For shader uniform block data
}

/**
 * Enumeration of buffer usage hints
 *
 * Helps WebGL optimize buffer memory usage and access patterns.
 * Each hint indicates how the buffer data is updated and accessed.
 *
 * WebGL 2.0 provides nine usage patterns across three categories:
 *
 * **DRAW Usage (Data written by application, read by GPU):**
 * - STATIC_DRAW: Data set once, used many times for drawing
 * - DYNAMIC_DRAW: Data changed frequently, used for drawing
 * - STREAM_DRAW: Data specified once, used a few times for drawing
 *
 * **READ Usage (Data read from GPU, queried by application):**
 * - STATIC_READ: Data read from GPU once, queried many times by app
 * - DYNAMIC_READ: Data read from GPU repeatedly, queried many times by app
 * - STREAM_READ: Data read from GPU once, queried a few times by app
 *
 * **COPY Usage (Data read from GPU, used for drawing/images):**
 * - STATIC_COPY: Data read from GPU once, used many times for drawing
 * - DYNAMIC_COPY: Data read from GPU repeatedly, used many times for drawing
 * - STREAM_COPY: Data read from GPU once, used a few times for drawing
 */
export enum BufferUsage {
  // DRAW Usage (GPU reads data written by application)
  STATIC_DRAW = 0x88e4, // Data set once, used many times for drawing
  DYNAMIC_DRAW = 0x88e8, // Data changed frequently, used for drawing
  STREAM_DRAW = 0x88e0, // Data specified once, used a few times for drawing

  // READ Usage (Application reads data copied from GPU)
  STATIC_READ = 0x8b81, // Data read from GPU once, queried many times by app
  DYNAMIC_READ = 0x88e9, // Data read from GPU repeatedly, queried many times
  STREAM_READ = 0x88e1, // Data read from GPU once, queried a few times by app

  // COPY Usage (GPU reads data copied from GPU, for drawing/images)
  STATIC_COPY = 0x8b82, // Data read from GPU once, used many times for drawing
  DYNAMIC_COPY = 0x88ea, // Data read from GPU repeatedly, used many times
  STREAM_COPY = 0x88e2, // Data read from GPU once, used a few times for drawing
}

/**
 * Type information for typed array elements
 *
 * Each TypedArray type has an associated byte size per element:
 * - BYTE / UBYTE / UBYTE_CLAMPED: 1 byte each
 * - SHORT / USHORT: 2 bytes each
 * - INT / UINT / FLOAT: 4 bytes each
 * - DOUBLE / BIGINT64 / BIGUINT64: 8 bytes each
 */
export enum ElementType {
  BYTE = 'int8',
  UBYTE = 'uint8',
  UBYTE_CLAMPED = 'uint8_clamped',
  SHORT = 'int16',
  USHORT = 'uint16',
  INT = 'int32',
  UINT = 'uint32',
  FLOAT = 'float32',
  DOUBLE = 'float64',
  BIGINT64 = 'bigint64',
  BIGUINT64 = 'biguint64',
}

/**
 * Map from TypedArray constructor to ElementType and byte size
 * Used to automatically infer element type and byte size from data
 */
const TYPED_ARRAY_INFO = new Map<
  Function,
  { type: ElementType; byteSize: number }
>([
  [Int8Array, { type: ElementType.BYTE, byteSize: 1 }],
  [Uint8Array, { type: ElementType.UBYTE, byteSize: 1 }],
  [Uint8ClampedArray, { type: ElementType.UBYTE_CLAMPED, byteSize: 1 }],
  [Int16Array, { type: ElementType.SHORT, byteSize: 2 }],
  [Uint16Array, { type: ElementType.USHORT, byteSize: 2 }],
  [Int32Array, { type: ElementType.INT, byteSize: 4 }],
  [Uint32Array, { type: ElementType.UINT, byteSize: 4 }],
  [Float32Array, { type: ElementType.FLOAT, byteSize: 4 }],
  [Float64Array, { type: ElementType.DOUBLE, byteSize: 8 }],
  [BigInt64Array, { type: ElementType.BIGINT64, byteSize: 8 }],
  [BigUint64Array, { type: ElementType.BIGUINT64, byteSize: 8 }],
]);

/**
 * Abstract base class for GPU buffers
 *
 * Provides common functionality for all WebGL buffer types (vertex, index, uniform, etc.).
 * Each buffer is associated with a specific target and usage pattern.
 * The data is stored on the GPU and can be efficiently accessed by shaders during rendering.
 *
 * Use factory methods to create specific buffer types:
 * - Buffer.createVertexBuffer() for vertex attribute data
 * - Buffer.createIndexBuffer() for vertex indices
 * - Buffer.createUniformBuffer() for shader uniform blocks
 * - etc.
 */
export abstract class Buffer {
  /**
   * The rendering context this buffer belongs to
   */
  protected readonly _context: GLContext;

  /**
   * The WebGL buffer object
   */
  protected _buffer: WebGLBuffer;

  /**
   * The target for this buffer (see BufferTarget enum for all 8 types)
   * Set by subclasses and never changes
   */
  protected readonly _target: BufferTarget;

  /**
   * The number of elements in the buffer
   * (Not the same as byte size - depends on data type)
   */
  protected _length: number = 0;

  /**
   * The byte size of each element in the buffer
   * Used to convert between element count and byte size
   */
  protected _elementByteSize: number = 0;

  /**
   * The type of elements stored in the buffer
   * Tracks which TypedArray type was used for setData()
   */
  protected _elementType: ElementType | null = null;

  /**
   * The WebGL usage hint for this buffer
   */
  protected _usage: BufferUsage;

  /**
   * Factory method: Creates a VertexBuffer (ARRAY_BUFFER)
   * Uses dynamic import to avoid circular dependencies
   *
   * @param context - The GLContext this buffer belongs to
   * @param componentSize - Number of components per vertex (1-4)
   * @param usage - Buffer usage hint (default: STATIC_DRAW)
   * @returns A new VertexBuffer instance
   * @throws Error if componentSize is not 1-4
   *
   * @example
   * const vbo = Buffer.createVertexBuffer(ctx, 3)
   *   .setData(vertices);
   */
  static async createVertexBuffer(
    context: GLContext,
    componentSize: number,
    usage: BufferUsage = BufferUsage.STATIC_DRAW,
  ) {
    const { VertexBuffer } = await import('./VertexBuffer.js');
    return new VertexBuffer(context, componentSize, usage);
  }

  /**
   * Factory method: Creates an IndexBuffer (ELEMENT_ARRAY_BUFFER)
   * Uses dynamic import to avoid circular dependencies
   *
   * @param context - The GLContext this buffer belongs to
   * @param usage - Buffer usage hint (default: STATIC_DRAW)
   * @returns A new IndexBuffer instance
   *
   * @example
   * const ibo = Buffer.createIndexBuffer(ctx)
   *   .setData(indices);
   */
  static async createIndexBuffer(
    context: GLContext,
    usage: BufferUsage = BufferUsage.STATIC_DRAW,
  ) {
    const { IndexBuffer } = await import('./IndexBuffer.js');
    return new IndexBuffer(context, usage);
  }

  /**
   * Factory method: Creates a CopyReadBuffer (COPY_READ_BUFFER)
   * Uses dynamic import to avoid circular dependencies
   *
   * @param context - The GLContext this buffer belongs to
   * @param usage - Buffer usage hint (default: STATIC_COPY)
   * @returns A new CopyReadBuffer instance
   */
  static async createCopyReadBuffer(
    context: GLContext,
    usage: BufferUsage = BufferUsage.STATIC_COPY,
  ) {
    const { CopyReadBuffer } = await import('./CopyReadBuffer.js');
    return new CopyReadBuffer(context, usage);
  }

  /**
   * Factory method: Creates a CopyWriteBuffer (COPY_WRITE_BUFFER)
   * Uses dynamic import to avoid circular dependencies
   *
   * @param context - The GLContext this buffer belongs to
   * @param usage - Buffer usage hint (default: STATIC_COPY)
   * @returns A new CopyWriteBuffer instance
   */
  static async createCopyWriteBuffer(
    context: GLContext,
    usage: BufferUsage = BufferUsage.STATIC_COPY,
  ) {
    const { CopyWriteBuffer } = await import('./CopyWriteBuffer.js');
    return new CopyWriteBuffer(context, usage);
  }

  /**
   * Factory method: Creates a PixelPackBuffer (PIXEL_PACK_BUFFER)
   * Uses dynamic import to avoid circular dependencies
   *
   * @param context - The GLContext this buffer belongs to
   * @param usage - Buffer usage hint (default: STATIC_READ)
   * @returns A new PixelPackBuffer instance
   */
  static async createPixelPackBuffer(
    context: GLContext,
    usage: BufferUsage = BufferUsage.STATIC_READ,
  ) {
    const { PixelPackBuffer } = await import('./PixelPackBuffer.js');
    return new PixelPackBuffer(context, usage);
  }

  /**
   * Factory method: Creates a PixelUnpackBuffer (PIXEL_UNPACK_BUFFER)
   * Uses dynamic import to avoid circular dependencies
   *
   * @param context - The GLContext this buffer belongs to
   * @param usage - Buffer usage hint (default: STATIC_DRAW)
   * @returns A new PixelUnpackBuffer instance
   */
  static async createPixelUnpackBuffer(
    context: GLContext,
    usage: BufferUsage = BufferUsage.STATIC_DRAW,
  ) {
    const { PixelUnpackBuffer } = await import('./PixelUnpackBuffer.js');
    return new PixelUnpackBuffer(context, usage);
  }

  /**
   * Factory method: Creates a TransformFeedbackBuffer (TRANSFORM_FEEDBACK_BUFFER)
   * Uses dynamic import to avoid circular dependencies
   *
   * @param context - The GLContext this buffer belongs to
   * @param usage - Buffer usage hint (default: STATIC_COPY)
   * @returns A new TransformFeedbackBuffer instance
   */
  static async createTransformFeedbackBuffer(
    context: GLContext,
    usage: BufferUsage = BufferUsage.STATIC_COPY,
  ) {
    const { TransformFeedbackBuffer } = await import('./TransformFeedbackBuffer.js');
    return new TransformFeedbackBuffer(context, usage);
  }

  /**
   * Factory method: Creates a UniformBuffer (UNIFORM_BUFFER)
   * Uses dynamic import to avoid circular dependencies
   *
   * @param context - The GLContext this buffer belongs to
   * @param usage - Buffer usage hint (default: STATIC_DRAW)
   * @returns A new UniformBuffer instance
   */
  static async createUniformBuffer(
    context: GLContext,
    usage: BufferUsage = BufferUsage.STATIC_DRAW,
  ) {
    const { UniformBuffer } = await import('./UniformBuffer.js');
    return new UniformBuffer(context, usage);
  }

  /**
   * Creates a new buffer object (protected - use factory methods instead)
   *
   * @param context - The GLContext this buffer belongs to
   * @param target - The buffer target (set by subclasses)
   * @param usage - The buffer usage hint (default: STATIC_DRAW)
   * @throws Error if context is invalid or buffer creation fails
   *
   * @internal This is protected because subclasses call it via super()
   */
  protected constructor(
    context: GLContext,
    target: BufferTarget,
    usage: BufferUsage = BufferUsage.STATIC_DRAW,
  ) {
    if (!context) {
      throw new AppError(ErrorCode.RES_INVALID_ARG, {
        resource: 'Buffer',
        method: 'constructor',
        detail: 'GLContext is required',
      });
    }

    this._context = context;
    this._target = target;
    this._usage = usage;

    // Create the WebGL buffer
    const gl = this._context.gl;
    const buffer = gl.createBuffer();
    if (!buffer) {
      throw new AppError(ErrorCode.RES_GL_ERROR, {
        resource: 'Buffer',
        method: 'constructor',
        detail: 'Failed to create WebGL buffer',
      });
    }
    this._buffer = buffer;

    // Register with GLContext for automatic cleanup on context disposal
    this._context.registerBuffer(this._buffer);
  }

  /**
   * Gets the WebGL buffer object
   *
   * @internal
   */
  get buffer(): WebGLBuffer {
    return this._buffer;
  }

  /**
   * Gets the buffer target
   */
  get target(): BufferTarget {
    return this._target;
  }

  /**
   * Gets the number of elements in the buffer
   *
   * For vertex buffers, this is the number of vertices.
   * For index buffers, this is the number of indices.
   */
  get length(): number {
    return this._length;
  }

  /**
   * Gets the total byte size of the buffer data
   *
   * Calculated as `length * elementByteSize`.
   * Reflects the state from the most recent `setData()` or `setDataRaw()` call.
   *
   * **Important Contract - Pure Wrapper Usage:**
   * This value reflects the data you uploaded via the Buffer API. It will NOT
   * reflect changes made by raw WebGL calls (mixing APIs). See CLAUDE.md
   * "Escape Hatches & Wrapper Purity" for details.
   *
   * **If You Mix with Raw GL:**
   * If you bypass the Buffer API and use raw `ctx.gl` calls on this buffer,
   * you must call `setMetadata()` to keep this value synchronized:
   * ```typescript
   * buffer.setData(new Float32Array([1, 2, 3])); // byteLength = 12
   * ctx.gl.bindBuffer(ctx.gl.ARRAY_BUFFER, buffer.buffer);
   * ctx.gl.bufferData(ctx.gl.ARRAY_BUFFER, newData, ctx.gl.STATIC_DRAW);
   * buffer.setMetadata(newLength, newElementByteSize); // Sync state
   * ```
   *
   * @returns Total byte size of the buffer (length × elementByteSize)
   * @example
   * const buffer = new VertexBuffer(ctx, 3);
   * buffer.setData(new Float32Array([1, 2, 3, 4, 5, 6])); // 6 elements, 4 bytes each
   * console.log(buffer.byteLength); // 24 bytes
   */
  get byteLength(): number {
    return this._length * this._elementByteSize;
  }

  /**
   * Gets the buffer usage hint
   */
  get usage(): BufferUsage {
    return this._usage;
  }

  /**
   * Gets the byte size of each element in the buffer
   *
   * Returns 0 if no data has been set yet.
   * This is inferred from the TypedArray type passed to setData().
   *
   * @example
   * const buffer = Buffer.createVertexBuffer(ctx, 3);
   * buffer.setData(new Float32Array([1, 2, 3]));
   * console.log(buffer.elementByteSize); // 4 (Float32 = 4 bytes)
   */
  get elementByteSize(): number {
    return this._elementByteSize;
  }

  /**
   * Gets the type of elements stored in the buffer
   *
   * Returns null if no data has been set yet.
   * This is inferred from the TypedArray type passed to setData().
   *
   * @example
   * const buffer = Buffer.createIndexBuffer(ctx);
   * buffer.setData(new Uint16Array([0, 1, 2]));
   * console.log(buffer.elementType); // 'uint16'
   */
  get elementType(): ElementType | null {
    return this._elementType;
  }

  /**
   * Sets buffer data from a TypedArray, automatically inferring element metadata
   *
   * This is the recommended method for most use cases. It automatically detects
   * the TypedArray type and stores element metadata (byte size, type information).
   * Supports all 11 WebGL TypedArray types.
   *
   * Can be called multiple times to update buffer contents, though frequent updates
   * are inefficient for buffers created with STATIC_DRAW usage.
   *
   * **Side Effect - Binding State:** This method binds this buffer, uploads data,
   * then unbinds it (sets binding to null). After completion, this buffer is NOT
   * bound. This is intentional cleanup to prevent accidental use of stale bindings.
   *
   * If you need to upload data AND immediately use the buffer for rendering:
   * ```typescript
   * buffer.setData(vertices);
   * buffer.bind();  // Explicitly bind for rendering
   * // ... render ...
   * ```
   *
   * @param data - TypedArray or null to allocate empty buffer
   * @param usage - Optional usage hint (if not provided, uses constructor default)
   * @returns this for chaining
   * @throws Error if data is not a recognized TypedArray type or WebGL error occurs
   *
   * @example
   * // Float32 vertices with chaining
   * const vbo = Buffer.createVertexBuffer(ctx, 3)
   *   .setData(new Float32Array([0, 0, 0, 1, 0, 0, 0, 1, 0]));
   *
   * // Uint16 indices
   * const ibo = Buffer.createIndexBuffer(ctx)
   *   .setData(new Uint16Array([0, 1, 2]));
   *
   * // All 11 TypedArray types are supported
   * buffer.setData(new Int8Array([1, 2, 3]));
   * buffer.setData(new Float64Array([1.5, 2.5, 3.5]));
   * buffer.setData(new BigInt64Array([BigInt(1), BigInt(2)]));
   */
  setData(data: ArrayBufferView | null, usage?: BufferUsage): this {
    const gl = this._context.gl;

    // Use provided usage or fall back to instance usage
    const bufferUsage = usage ?? this._usage;
    if (usage) {
      this._usage = usage;
    }

    // Bind buffer to target
    gl.bindBuffer(this._target, this._buffer);

    // Infer element metadata from TypedArray type
    if (data) {
      const info = TYPED_ARRAY_INFO.get(data.constructor);
      if (info) {
        // Known TypedArray type - store metadata
        this._length = (data as any).length;
        this._elementByteSize = info.byteSize;
        this._elementType = info.type;
      } else {
        // Unknown ArrayBufferView type (e.g., DataView)
        // We cannot infer element count without additional information
        throw new AppError(ErrorCode.RES_INVALID_ARG, {
          resource: 'Buffer',
          method: 'setData',
          detail:
            `Cannot infer element type from ${data.constructor.name}. ` +
            `Supported types: Int8Array, Uint8Array, Uint8ClampedArray, Int16Array, Uint16Array, ` +
            `Int32Array, Uint32Array, Float32Array, Float64Array, BigInt64Array, BigUint64Array. ` +
            `Use setDataRaw() for ArrayBuffer or DataView.`,
        });
      }
    } else {
      this._length = 0;
      this._elementByteSize = 0;
      this._elementType = null;
    }

    // Upload data to GPU
    gl.bufferData(this._target, data, bufferUsage);

    // Unbind buffer
    gl.bindBuffer(this._target, null);

    // Check for errors
    const error = gl.getError();
    if (error !== gl.NO_ERROR) {
      throw new AppError(ErrorCode.RES_GL_ERROR, {
        resource: 'Buffer',
        method: 'setData',
        detail:
          `Buffer.setData failed with WebGL error: ${error}. ` +
          `Target: ${this._target}, Data size: ${data?.byteLength ?? 0} bytes`,
      });
    }

    return this;
  }

  /**
   * Sets buffer data from an ArrayBuffer or DataView with explicit element metadata
   *
   * Use this method when you have raw binary data (ArrayBuffer or DataView) where
   * element type cannot be automatically inferred. You must specify the element
   * byte size so we can calculate element count correctly.
   *
   * **Side Effect - Binding State:** This method binds this buffer, uploads data,
   * then unbinds it (sets binding to null). After completion, this buffer is NOT
   * bound. This is intentional cleanup to prevent accidental use of stale bindings.
   * See `setData()` for usage example.
   *
   * @param data - ArrayBuffer, DataView, or null
   * @param elementByteSize - Byte size of each element (1, 2, 4, or 8)
   * @param elementType - Optional element type name for documentation
   * @param usage - Optional usage hint (if not provided, uses constructor default)
   * @returns this for method chaining
   * @throws Error if elementByteSize is invalid or WebGL error occurs
   *
   * @example
   * // Raw binary data with 4-byte elements (Float32 compatible), with chaining
   * const buffer = Buffer.createVertexBuffer(ctx, 3)
   *   .setDataRaw(new ArrayBuffer(48), 4);
   *
   * // Specify element type for documentation
   * buffer.setDataRaw(dataView, 2, ElementType.USHORT);
   */
  setDataRaw(
    data: ArrayBuffer | DataView | null,
    elementByteSize: number,
    elementType?: ElementType,
    usage?: BufferUsage,
  ): this {
    if (elementByteSize <= 0 || ![1, 2, 4, 8].includes(elementByteSize)) {
      throw new AppError(ErrorCode.RES_INVALID_ARG, {
        resource: 'Buffer',
        method: 'setDataRaw',
        detail: `elementByteSize must be 1, 2, 4, or 8, got ${elementByteSize}`,
      });
    }

    const gl = this._context.gl;

    // Use provided usage or fall back to instance usage
    const bufferUsage = usage ?? this._usage;
    if (usage) {
      this._usage = usage;
    }

    // Bind buffer to target
    gl.bindBuffer(this._target, this._buffer);

    // Calculate element count and store metadata
    if (data) {
      const byteLength = data.byteLength;
      if (byteLength % elementByteSize !== 0) {
        throw new AppError(ErrorCode.RES_INVALID_ARG, {
          resource: 'Buffer',
          method: 'setDataRaw',
          detail:
            `Data size (${byteLength} bytes) is not a multiple of ` +
            `elementByteSize (${elementByteSize} bytes)`,
        });
      }
      this._length = byteLength / elementByteSize;
      this._elementByteSize = elementByteSize;
      this._elementType = elementType ?? null;
    } else {
      this._length = 0;
      this._elementByteSize = elementByteSize;
      this._elementType = elementType ?? null;
    }

    // Upload data to GPU
    gl.bufferData(this._target, data, bufferUsage);

    // Unbind buffer
    gl.bindBuffer(this._target, null);

    // Check for errors
    const error = gl.getError();
    if (error !== gl.NO_ERROR) {
      throw new AppError(ErrorCode.RES_GL_ERROR, {
        resource: 'Buffer',
        method: 'setDataRaw',
        detail:
          `Buffer.setDataRaw failed with WebGL error: ${error}. ` +
          `Target: ${this._target}, Data size: ${data?.byteLength ?? 0} bytes`,
      });
    }

    return this;
  }

  /**
   * Binds this buffer to its target
   *
   * After binding, subsequent WebGL operations on this buffer's target
   * will affect this buffer.
   *
   * @example
   * buffer.bind();
   * // Operations that use buffers now operate on this buffer
   * buffer.unbind();
   */
  bind(): void {
    const gl = this._context.gl;
    gl.bindBuffer(this._target, this._buffer);
  }

  /**
   * Unbinds this buffer from its target
   *
   * After unbinding, subsequent WebGL operations on this buffer's target
   * will not affect this buffer.
   *
   * @example
   * buffer.bind();
   * // Use buffer
   * buffer.unbind();
   */
  unbind(): void {
    const gl = this._context.gl;
    gl.bindBuffer(this._target, null);
  }

  /**
   * Manually updates buffer metadata after direct WebGL calls
   *
   * Use this method to resynchronize wrapper state after mixing the Buffer API
   * with raw WebGL calls. This validates the provided values and updates the
   * internal state tracked by length, elementByteSize, and byteLength.
   *
   * **When to Use:**
   * If you call raw `ctx.gl` methods directly on this buffer (bypassing the
   * Buffer wrapper), you must call this method to keep the wrapper's cached
   * state synchronized.
   *
   * **Example:**
   * ```typescript
   * const buffer = new VertexBuffer(ctx, 3);
   * buffer.setData(new Float32Array([1, 2, 3])); // length=3, elementByteSize=4
   *
   * // Mix with raw GL
   * ctx.gl.bindBuffer(BufferTarget.ARRAY_BUFFER, buffer.buffer);
   * ctx.gl.bufferData(BufferTarget.ARRAY_BUFFER, newData, ctx.gl.STATIC_DRAW);
   *
   * // Resync wrapper state
   * buffer.setMetadata(newLength, newElementByteSize);
   * ```
   *
   * @param length - Number of elements in the buffer
   * @param elementByteSize - Byte size per element (1, 2, 4, or 8)
   * @throws Error if values are invalid
   *
   * @example
   * buffer.setMetadata(10, 4); // 10 elements, 4 bytes each = 40 bytes total
   */
  setMetadata(length: number, elementByteSize: number): void {
    // Validate length
    if (length < 0 || !Number.isFinite(length) || !Number.isInteger(length)) {
      throw new AppError(ErrorCode.RES_INVALID_ARG, {
        resource: 'Buffer',
        method: 'setMetadata',
        detail:
          `Invalid length: ${length}. ` +
          `Must be a non-negative integer.`,
      });
    }

    // Validate elementByteSize
    if (elementByteSize <= 0 || ![1, 2, 4, 8].includes(elementByteSize)) {
      throw new AppError(ErrorCode.RES_INVALID_ARG, {
        resource: 'Buffer',
        method: 'setMetadata',
        detail:
          `Invalid elementByteSize: ${elementByteSize}. ` +
          `Must be 1, 2, 4, or 8.`,
      });
    }

    this._length = length;
    this._elementByteSize = elementByteSize;
  }

  /**
   * Updates a portion of the buffer data with type safety
   *
   * More efficient than setData() when only updating part of the buffer.
   * Only works if the buffer already has data allocated.
   *
   * **Type Safety:** Validates that the new data type matches the original type
   * to prevent silent semantic corruption. This ensures your buffer data remains
   * interpretable as the intended element type.
   *
   * **Bounds Checking:** Validates that the update fits within the buffer to
   * prevent accidental overflow that could corrupt adjacent GPU memory.
   *
   * @param offset - The byte offset in the buffer to start updating
   * @param data - The new data to write (must match original TypedArray type)
   * @throws Error if buffer has no data, offset is invalid, or data type mismatches
   * @throws Error if offset + data size exceeds buffer size
   *
   * @example
   * // Update first 12 bytes (3 floats) of buffer with matching type
   * const buffer = Buffer.createVertexBuffer(ctx, 3);
   * buffer.setData(new Float32Array([1, 2, 3]));
   * buffer.updateData(0, new Float32Array([10, 20, 30])); // ✅ Same type
   *
   * @example
   * // Type mismatch error
   * buffer.setData(new Float32Array([1, 2, 3]));
   * buffer.updateData(0, new Uint16Array([1, 2])); // ❌ Throws error
   *
   * @example
   * // Bounds error
   * buffer.setData(new Float32Array([1, 2, 3])); // 12 bytes
   * buffer.updateData(0, new Float32Array([1, 2, 3, 4, 5])); // ❌ 20 bytes - overflow
   */
  updateData(offset: number, data: ArrayBufferView): void {
    if (this._length === 0) {
      throw new AppError(ErrorCode.RES_INVALID_ARG, {
        resource: 'Buffer',
        method: 'updateData',
        detail: 'Buffer has no data. Call setData first.',
      });
    }

    if (offset < 0) {
      throw new AppError(ErrorCode.RES_INVALID_ARG, {
        resource: 'Buffer',
        method: 'updateData',
        detail: `Offset must be non-negative, got ${offset}`,
      });
    }

    // Type safety: validate data type matches original
    const info = TYPED_ARRAY_INFO.get(data.constructor);
    if (!info) {
      throw new AppError(ErrorCode.RES_INVALID_ARG, {
        resource: 'Buffer',
        method: 'updateData',
        detail:
          `Cannot infer type from ${data.constructor.name}. ` +
          `Ensure data is a recognized TypedArray. ` +
          `Use updateDataUnsafe() if you need to bypass type checking.`,
      });
    }

    if (info.type !== this._elementType) {
      throw new AppError(ErrorCode.RES_INVALID_ARG, {
        resource: 'Buffer',
        method: 'updateData',
        detail:
          `Data type mismatch. ` +
          `Buffer contains ${this._elementType} elements, ` +
          `but received ${info.type}. ` +
          `Use updateDataUnsafe() to override type checking at your own risk.`,
      });
    }

    // Bounds checking: ensure update fits in buffer
    const byteLength = this.byteLength;
    const requiredBytes = offset + data.byteLength;
    if (requiredBytes > byteLength) {
      throw new AppError(ErrorCode.RES_INVALID_ARG, {
        resource: 'Buffer',
        method: 'updateData',
        detail:
          `Update would overflow buffer. ` +
          `Buffer size: ${byteLength} bytes, ` +
          `offset: ${offset}, data: ${data.byteLength} bytes. ` +
          `Total needed: ${requiredBytes} bytes.`,
      });
    }

    this._uploadDataToBuffer(offset, data);
  }

  /**
   * Updates buffer data WITHOUT type or bounds validation (expert use only)
   *
   * **⚠️ DANGER ZONE:** This method bypasses all safety checks:
   * - Does NOT validate data type compatibility
   * - Does NOT check buffer bounds
   * - Does NOT validate offset alignment
   *
   * Use this ONLY when:
   * - You are reinterpreting buffer data as a different type intentionally
   * - You have manually verified bounds and alignment
   * - You are an expert understanding the consequences
   *
   * Misuse can cause:
   * - Silent data corruption (misinterpreted types)
   * - GPU memory access violations
   * - Undefined behavior if data overflows buffer
   *
   * @param offset - The byte offset in the buffer to start updating
   * @param data - The data to write (any ArrayBufferView)
   * @throws Error only on WebGL API failures, not on validation
   *
   * @example
   * // Intentional type reinterpretation (expert use only)
   * const buffer = Buffer.createVertexBuffer(ctx, 3);
   * buffer.setData(new Float32Array(12)); // 48 bytes
   *
   * // Reinterpret as bytes - expert knows what they're doing
   * const bytes = new Uint8Array([0xFF, 0x00, 0xFF, 0x00]);
   * buffer.updateDataUnsafe(0, bytes);
   */
  updateDataUnsafe(offset: number, data: ArrayBufferView): void {
    if (this._length === 0) {
      throw new AppError(ErrorCode.RES_INVALID_ARG, {
        resource: 'Buffer',
        method: 'updateDataUnsafe',
        detail: 'Buffer has no data. Call setData first.',
      });
    }

    if (offset < 0) {
      throw new AppError(ErrorCode.RES_INVALID_ARG, {
        resource: 'Buffer',
        method: 'updateDataUnsafe',
        detail: `Offset must be non-negative, got ${offset}`,
      });
    }

    this._uploadDataToBuffer(offset, data);
  }

  /**
   * Internal helper: uploads data to GPU without public validation
   * @internal
   */
  private _uploadDataToBuffer(offset: number, data: ArrayBufferView): void {
    const gl = this._context.gl;

    // Bind buffer
    gl.bindBuffer(this._target, this._buffer);

    // Update data
    gl.bufferSubData(this._target, offset, data);

    // Unbind
    gl.bindBuffer(this._target, null);

    // Check for errors
    const error = gl.getError();
    if (error !== gl.NO_ERROR) {
      throw new AppError(ErrorCode.RES_GL_ERROR, {
        resource: 'Buffer',
        method: '_uploadDataToBuffer',
        detail: `Buffer data upload failed with WebGL error: ${error}`,
      });
    }
  }

  /**
   * Disposes of the buffer and frees GPU memory
   *
   * After disposal, this buffer cannot be used. The buffer is removed
   * from the context's resource tracking.
   *
   * @example
   * buffer.dispose();
   */
  dispose(): void {
    const gl = this._context.gl;
    if (this._buffer) {
      gl.deleteBuffer(this._buffer);
      (this._buffer as any) = null;
    }
  }
}
