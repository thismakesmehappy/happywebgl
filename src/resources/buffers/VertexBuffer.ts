/**
 * VertexBuffer - Vertex attribute data buffer (ARRAY_BUFFER)
 *
 * Specialized buffer for storing vertex attribute data.
 * Only buffer type that supports componentSize tracking for vertex attributes.
 *
 * @class VertexBuffer
 */

import { GLContext } from '../../core/GLContext';
import { AppError } from '../../errors/AppError.js';
import { ErrorCode } from '../../errors/ErrorCodes.js';
import { Buffer, BufferTarget, BufferUsage } from './Buffer.js';

/**
 * VertexBuffer - Specialized buffer for vertex attribute data (ARRAY_BUFFER)
 *
 * Extends Buffer with componentSize tracking, which is only relevant for vertex attributes.
 * ComponentSize indicates how many components (1-4) each vertex has for a particular attribute.
 *
 * @example
 * // Create a buffer for 3D vertex positions (3 components per vertex)
 * const vbo = Buffer.createVertexBuffer(ctx, 3)
 *   .setData(new Float32Array([
 *     0, 0, 0,    // Vertex 0: x, y, z
 *     1, 0, 0,    // Vertex 1: x, y, z
 *     0, 1, 0,    // Vertex 2: x, y, z
 *   ]));
 *
 * @example
 * // Update component size if needed
 * vbo.setComponentSize(2);  // Now 2D vertices instead of 3D
 */
export class VertexBuffer extends Buffer {
  /**
   * Number of components per vertex (1-4)
   * For example: 3 for 3D positions, 2 for 2D texture coordinates
   * Private field - set via constructor or setComponentSize()
   */
  private _componentSize: number;

  /**
   * Creates a new VertexBuffer for vertex attribute data
   *
   * @param context - The GLContext this buffer belongs to
   * @param componentSize - Number of components per vertex (1-4)
   * @param usage - Buffer usage hint (default: STATIC_DRAW)
   * @throws Error if componentSize is not 1-4
   *
   * @example
   * const vbo = new VertexBuffer(ctx, 3);  // 3 components per vertex
   */
  constructor(
    context: GLContext,
    componentSize: number,
    usage: BufferUsage = BufferUsage.STATIC_DRAW,
  ) {
    if (!Number.isInteger(componentSize) || componentSize < 1 || componentSize > 4) {
      throw new AppError(ErrorCode.RES_INVALID_ARG, {
        resource: 'VertexBuffer',
        method: 'constructor',
        detail: `componentSize must be 1, 2, 3, or 4, got ${componentSize}`,
      });
    }

    // Initialize parent with ARRAY_BUFFER target
    super(context, BufferTarget.ARRAY_BUFFER, usage);

    this._componentSize = componentSize;
  }

  /**
   * Gets the number of components per vertex
   *
   * @returns Number of components (1-4)
   *
   * @example
   * const vbo = Buffer.createVertexBuffer(ctx, 3);
   * console.log(vbo.componentSize);  // 3
   */
  get componentSize(): number {
    return this._componentSize;
  }

  /**
   * Sets the number of components per vertex
   *
   * Use when you need to reinterpret the same buffer data with different componentSize.
   * For example, switching from 3D positions to 2D texture coordinates.
   *
   * @param componentSize - New number of components (1-4)
   * @returns this for method chaining
   * @throws Error if componentSize is not 1-4
   *
   * @example
   * const vbo = Buffer.createVertexBuffer(ctx, 3);
   * vbo.setComponentSize(2);  // Reinterpret as 2D data
   */
  setComponentSize(componentSize: number): this {
    if (!Number.isInteger(componentSize) || componentSize < 1 || componentSize > 4) {
      throw new AppError(ErrorCode.RES_INVALID_ARG, {
        resource: 'VertexBuffer',
        method: 'setComponentSize',
        detail: `componentSize must be 1, 2, 3, or 4, got ${componentSize}`,
      });
    }

    this._componentSize = componentSize;
    return this;
  }
}
