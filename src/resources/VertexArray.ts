import { GLContext } from '../core';
import { AppError } from '../errors/AppError.js';
import { ErrorCode } from '../errors/ErrorCodes.js';
import { BufferTarget } from './buffers/Buffer.js';
import { IndexBuffer } from './buffers/IndexBuffer.js';
import { VertexBuffer } from './buffers/VertexBuffer.js';

export interface VertexAttributeOptions {
  size?: number;
  type?: GLenum;
  normalized?: boolean;
  stride?: number;
  offset?: number;
}

export interface VertexIntegerAttributeOptions {
  size?: number;
  type?: GLenum;
  stride?: number;
  offset?: number;
}

export interface VertexMatrixAttributeOptions {
  type?: GLenum;
  normalized?: boolean;
  stride?: number;
  offset?: number;
  divisor?: number;
}

/**
 * VertexArray - VAO abstraction (WebGL 2)
 *
 * Encapsulates vertex attribute state and index buffer binding.
 * Use this to configure how vertex buffers are interpreted by the GPU.
 */
export class VertexArray {
  /**
   * The rendering context this VAO belongs to
   * @internal
   */
  private _ctx: GLContext;

  /**
   * The underlying WebGL vertex array object
   * @internal
   */
  private _vao: WebGLVertexArrayObject;

  /**
   * Tracks if this VAO has been disposed
   * @internal
   */
  private _disposed: boolean;


  /**
   * Creates a new VertexArray object
   *
   * @param ctx - GLContext to use for VAO creation
   * @throws Error if VAO creation fails
   */
  constructor(ctx: GLContext) {
    this._ctx = ctx;
    this._disposed = false;

    this._vao = ctx.createVertexArray();
    ctx.registerVertexArray(this._vao);
  }

  /**
   * Gets the underlying WebGL VAO
   *
   * @throws Error if VAO has been disposed
   */
  get vao(): WebGLVertexArrayObject {
    if (this._disposed) {
      throw new AppError(ErrorCode.RES_DISPOSED, { resource: 'VertexArray' });
    }
    return this._vao;
  }

  /**
   * Query the currently bound VAO from WebGL (source of truth)
   *
   * @param ctx - GLContext to query
   * @returns The currently bound VAO or null if none is bound
   */
  static queryBinding(ctx: GLContext): WebGLVertexArrayObject | null {
    return ctx.queryCurrentVAO();
  }

  /**
   * Binds this VAO
   *
   * @throws Error if VAO has been disposed
   */
  bind(): void {
    if (this._disposed) {
      throw new AppError(ErrorCode.RES_DISPOSED, { resource: 'VertexArray' });
    }

    this._ctx.bindVertexArray(this._vao);
  }

  /**
   * Unbinds the currently bound VAO
   *
   * @throws Error if VAO has been disposed
   */
  unbind(): void {
    if (this._disposed) {
      throw new AppError(ErrorCode.RES_DISPOSED, { resource: 'VertexArray' });
    }

    this._ctx.bindVertexArray(null);
  }

  /**
   * Sets up a vertex attribute for this VAO
   *
   * This binds the VAO, binds the buffer, configures the attribute pointer,
   * enables the attribute, then unbinds the ARRAY_BUFFER and VAO.
   */
  setAttribute(
    location: number,
    buffer: VertexBuffer,
    options: VertexAttributeOptions = {},
  ): this {
    if (this._disposed) {
      throw new AppError(ErrorCode.RES_DISPOSED, { resource: 'VertexArray' });
    }

    const { size, type, normalized = false, stride = 0, offset = 0 } = options;

    this._validateNonNegativeInt(location, 'setAttribute', 'location');

    if (!buffer) {
      throw new AppError(ErrorCode.RES_INVALID_ARG, {
        resource: 'VertexArray',
        method: 'setAttribute',
        detail: 'buffer is required',
      });
    }

    if (buffer.target !== BufferTarget.ARRAY_BUFFER) {
      throw new AppError(ErrorCode.RES_INVALID_ARG, {
        resource: 'VertexArray',
        method: 'setAttribute',
        detail: `buffer target must be ARRAY_BUFFER, got ${buffer.target}`,
      });
    }

    const resolvedSize = size ?? buffer.componentSize;
    this._validateComponentSize(resolvedSize, 'setAttribute');
    this._validateNonNegativeInt(stride, 'setAttribute', 'stride');
    this._validateNonNegativeInt(offset, 'setAttribute', 'offset');

    const glType = type ?? this._ctx.gl.FLOAT;

    this.bind();
    buffer.bind();
    this._ctx.vertexAttribPointer(
      location,
      resolvedSize,
      glType,
      normalized,
      stride,
      offset,
    );
    this._ctx.enableVertexAttribArray(location);
    buffer.unbind();
    this.unbind();

    return this;
  }

  /**
   * Sets up an integer vertex attribute for this VAO
   *
   * Uses vertexAttribIPointer for integer types.
   */
  setIntegerAttribute(
    location: number,
    buffer: VertexBuffer,
    options: VertexIntegerAttributeOptions = {},
  ): this {
    if (this._disposed) {
      throw new AppError(ErrorCode.RES_DISPOSED, { resource: 'VertexArray' });
    }

    const { size, type, stride = 0, offset = 0 } = options;

    this._validateNonNegativeInt(location, 'setIntegerAttribute', 'location');

    if (!buffer) {
      throw new AppError(ErrorCode.RES_INVALID_ARG, {
        resource: 'VertexArray',
        method: 'setIntegerAttribute',
        detail: 'buffer is required',
      });
    }

    if (buffer.target !== BufferTarget.ARRAY_BUFFER) {
      throw new AppError(ErrorCode.RES_INVALID_ARG, {
        resource: 'VertexArray',
        method: 'setIntegerAttribute',
        detail: `buffer target must be ARRAY_BUFFER, got ${buffer.target}`,
      });
    }

    const resolvedSize = size ?? buffer.componentSize;
    this._validateComponentSize(resolvedSize, 'setIntegerAttribute');
    this._validateNonNegativeInt(stride, 'setIntegerAttribute', 'stride');
    this._validateNonNegativeInt(offset, 'setIntegerAttribute', 'offset');

    const glType = type ?? this._ctx.gl.INT;
    this._validateIntegerAttributeType(glType, 'setIntegerAttribute');

    this.bind();
    buffer.bind();
    this._ctx.gl.vertexAttribIPointer(
      location,
      resolvedSize,
      glType,
      stride,
      offset,
    );
    this._ctx.checkError('VertexArray.setIntegerAttribute()');
    this._ctx.enableVertexAttribArray(location);
    buffer.unbind();
    this.unbind();

    return this;
  }

  /**
   * Sets up a matrix attribute (mat2/mat3/mat4) for this VAO
   *
   * A matrix attribute occupies multiple attribute locations (one per column).
   */
  setMatrixAttribute(
    location: number,
    buffer: VertexBuffer,
    rows: 2 | 3 | 4,
    columns: 2 | 3 | 4,
    options: VertexMatrixAttributeOptions = {},
  ): this {
    if (this._disposed) {
      throw new AppError(ErrorCode.RES_DISPOSED, { resource: 'VertexArray' });
    }

    const { type, normalized = false, stride = 0, offset = 0, divisor } = options;

    this._validateNonNegativeInt(location, 'setMatrixAttribute', 'location');

    if (!buffer) {
      throw new AppError(ErrorCode.RES_INVALID_ARG, {
        resource: 'VertexArray',
        method: 'setMatrixAttribute',
        detail: 'buffer is required',
      });
    }

    if (buffer.target !== BufferTarget.ARRAY_BUFFER) {
      throw new AppError(ErrorCode.RES_INVALID_ARG, {
        resource: 'VertexArray',
        method: 'setMatrixAttribute',
        detail: `buffer target must be ARRAY_BUFFER, got ${buffer.target}`,
      });
    }

    this._validateNonNegativeInt(stride, 'setMatrixAttribute', 'stride');
    this._validateNonNegativeInt(offset, 'setMatrixAttribute', 'offset');

    const glType = type ?? this._ctx.gl.FLOAT;
    const bytesPerComponent = this._getByteSizeForGLType(glType);

    this.bind();
    buffer.bind();

    for (let col = 0; col < columns; col += 1) {
      const columnOffset = offset + col * rows * bytesPerComponent;
      this._ctx.vertexAttribPointer(
        location + col,
        rows,
        glType,
        normalized,
        stride,
        columnOffset,
      );
      this._ctx.enableVertexAttribArray(location + col);
      if (divisor !== undefined) {
        this._validateNonNegativeInt(
          divisor,
          'setMatrixAttribute',
          'divisor',
        );
        this._ctx.gl.vertexAttribDivisor(location + col, divisor);
        this._ctx.checkError('VertexArray.setMatrixAttribute()');
      }
    }

    buffer.unbind();
    this.unbind();

    return this;
  }

  /**
   * Enables a vertex attribute array
   */
  enableAttribute(location: number): this {
    if (this._disposed) {
      throw new AppError(ErrorCode.RES_DISPOSED, { resource: 'VertexArray' });
    }

    this._validateNonNegativeInt(location, 'enableAttribute', 'location');
    this.bind();
    this._ctx.enableVertexAttribArray(location);
    this.unbind();

    return this;
  }

  /**
   * Disables a vertex attribute array
   */
  disableAttribute(location: number): this {
    if (this._disposed) {
      throw new AppError(ErrorCode.RES_DISPOSED, { resource: 'VertexArray' });
    }

    this._validateNonNegativeInt(location, 'disableAttribute', 'location');
    this.bind();
    this._ctx.disableVertexAttribArray(location);
    this.unbind();

    return this;
  }

  /**
   * Sets the index buffer for this VAO
   *
   * Binds the VAO and binds ELEMENT_ARRAY_BUFFER. Do not unbind the index
   * buffer while the VAO is bound, otherwise it will clear the VAO's binding.
   */
  setIndexBuffer(indexBuffer: IndexBuffer): this {
    if (this._disposed) {
      throw new AppError(ErrorCode.RES_DISPOSED, { resource: 'VertexArray' });
    }

    if (!indexBuffer) {
      throw new AppError(ErrorCode.RES_INVALID_ARG, {
        resource: 'VertexArray',
        method: 'setIndexBuffer',
        detail: 'indexBuffer is required',
      });
    }

    if (indexBuffer.target !== BufferTarget.ELEMENT_ARRAY_BUFFER) {
      throw new AppError(ErrorCode.RES_INVALID_ARG, {
        resource: 'VertexArray',
        method: 'setIndexBuffer',
        detail: `buffer target must be ELEMENT_ARRAY_BUFFER, got ${indexBuffer.target}`,
      });
    }

    this.bind();
    indexBuffer.bind();
    this.unbind();

    return this;
  }

  /**
   * Sets the attribute divisor for instanced rendering
   *
   * @param location - Attribute location index
   * @param divisor - 0 for per-vertex, 1+ for per-instance
   */
  setAttributeDivisor(location: number, divisor: number): this {
    if (this._disposed) {
      throw new AppError(ErrorCode.RES_DISPOSED, { resource: 'VertexArray' });
    }

    this._validateNonNegativeInt(location, 'setAttributeDivisor', 'location');
    this._validateNonNegativeInt(divisor, 'setAttributeDivisor', 'divisor');

    this.bind();
    this._ctx.gl.vertexAttribDivisor(location, divisor);
    this._ctx.checkError('VertexArray.setAttributeDivisor()');
    this.unbind();

    return this;
  }

  /**
   * Deletes the VAO and marks it as disposed
   */
  dispose(): void {
    if (this._disposed) {
      return;
    }

    this._ctx.gl.deleteVertexArray(this._vao);
    this._ctx.checkError('VertexArray.dispose()');

    this._disposed = true;

  }

  /**
   * Validates that a value is a non-negative integer
   * @internal
   */
  private _validateNonNegativeInt(
    value: number,
    methodName: string,
    label: string,
  ): void {
    if (!Number.isFinite(value)) {
      throw new AppError(ErrorCode.RES_INVALID_ARG, {
        resource: 'VertexArray',
        method: methodName,
        detail: `${label} must be a finite number, got ${value}`,
      });
    }
    if (!Number.isInteger(value)) {
      throw new AppError(ErrorCode.RES_INVALID_ARG, {
        resource: 'VertexArray',
        method: methodName,
        detail:
          `${label} must be an integer, got ${value}. ` +
          `Use Math.floor(), Math.round(), or Math.trunc() to convert.`,
      });
    }
    if (value < 0) {
      throw new AppError(ErrorCode.RES_INVALID_ARG, {
        resource: 'VertexArray',
        method: methodName,
        detail: `${label} must be a non-negative integer, got ${value}`,
      });
    }
  }

  /**
   * Validates that a value is a valid component size (1-4)
   * @internal
   */
  private _validateComponentSize(value: number, methodName: string): void {
    if (!Number.isFinite(value)) {
      throw new AppError(ErrorCode.RES_INVALID_ARG, {
        resource: 'VertexArray',
        method: methodName,
        detail: `size must be a finite number, got ${value}`,
      });
    }
    if (!Number.isInteger(value) || value < 1 || value > 4) {
      throw new AppError(ErrorCode.RES_INVALID_ARG, {
        resource: 'VertexArray',
        method: methodName,
        detail: `size must be 1, 2, 3, or 4, got ${value}`,
      });
    }
  }

  /**
   * Validates that a value is a valid integer attribute type
   * @internal
   */
  private _validateIntegerAttributeType(
    glType: GLenum,
    methodName: string,
  ): void {
    const gl = this._ctx.gl;
    if (
      glType !== gl.BYTE &&
      glType !== gl.UNSIGNED_BYTE &&
      glType !== gl.SHORT &&
      glType !== gl.UNSIGNED_SHORT &&
      glType !== gl.INT &&
      glType !== gl.UNSIGNED_INT
    ) {
      throw new AppError(ErrorCode.RES_INVALID_ARG, {
        resource: 'VertexArray',
        method: methodName,
        detail: `type must be an integer type (BYTE, UNSIGNED_BYTE, SHORT, UNSIGNED_SHORT, INT, UNSIGNED_INT), got ${glType}`,
      });
    }
  }

  /**
   * Returns byte size for a given GL attribute type
   * @internal
   */
  private _getByteSizeForGLType(glType: GLenum): number {
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
          resource: 'VertexArray',
          method: 'setMatrixAttribute',
          detail: `unsupported type for matrix attribute, got ${glType}`,
        });
    }
  }
}
