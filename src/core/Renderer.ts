/**
 * Renderer - Abstract base renderer interface
 *
 * This abstract class defines the interface for all renderers in the library.
 * Provides common rendering methods and state management abstraction.
 *
 * Use this class to create renderer implementations for different rendering
 * backends (WebGL, WebGPU, etc.) while maintaining a consistent API.
 *
 * @abstract
 */

import { GLContext } from './GLContext.js';
import { ErrorCode } from '../errors/ErrorCodes.js';
import { validate } from '../utils/validate.js';

/**
 * Base renderer class providing common rendering interface
 *
 * All concrete renderers should extend this class and implement
 * the abstract methods specific to their rendering backend.
 *
 * @abstract
 */
export abstract class Renderer {
  /**
   * The rendering context (backend-specific)
   */
  protected _context: GLContext;

  /**
   * Viewport width in pixels
   */
  protected _width: number;

  /**
   * Viewport height in pixels
   */
  protected _height: number;

  /**
   * Clear color for the rendering surface
   */
  protected _clearColor: { r: number; g: number; b: number; a: number };

  /**
   * Creates a new Renderer
   *
   * @param context - The rendering context
   * @param width - Initial viewport width
   * @param height - Initial viewport height
   * @throws Error if width or height is invalid
   */
  constructor(context: GLContext, width: number, height: number) {
    this._context = context;
    this._width = width;
    this._height = height;
    this._clearColor = { r: 0, g: 0, b: 0, a: 1 };

    const validationContext = {
      code: ErrorCode.CORE_INVALID_ARG,
      resource: 'Renderer',
      method: 'constructor',
    };
    validate.number.positive(width, validationContext, {
      detail: `Invalid width: ${width}. Width must be a positive number.`,
    });
    validate.number.positive(height, validationContext, {
      detail: `Invalid height: ${height}. Height must be a positive number.`,
    });
  }

  /**
   * Gets the rendering context
   */
  get context(): GLContext {
    return this._context;
  }

  /**
   * Gets the viewport width
   */
  get width(): number {
    return this._width;
  }

  /**
   * Gets the viewport height
   */
  get height(): number {
    return this._height;
  }

  /**
   * Gets the clear color
   */
  get clearColor(): { r: number; g: number; b: number; a: number } {
    return { ...this._clearColor };
  }

  /**
   * Sets the viewport size
   *
   * @param width - New viewport width
   * @param height - New viewport height
   * @throws Error if dimensions are invalid
   *
   * @example
   * renderer.setSize(1024, 768);
   */
  setSize(width: number, height: number): void {
    const context = {
      code: ErrorCode.CORE_INVALID_ARG,
      resource: 'Renderer',
      method: 'setSize',
    };
    validate.number.positive(width, context, {
      detail: `Invalid width: ${width}. Width must be a positive number.`,
    });
    validate.number.positive(height, context, {
      detail: `Invalid height: ${height}. Height must be a positive number.`,
    });
    this._width = width;
    this._height = height;
    this._context.setSize(width, height);
  }

  /**
   * Sets the clear color
   *
   * @param r - Red component (0-1)
   * @param g - Green component (0-1)
   * @param b - Blue component (0-1)
   * @param a - Alpha component (0-1), default 1.0
   *
   * @example
   * renderer.setClearColor(0.2, 0.2, 0.2, 1.0);
   */
  setClearColor(r: number, g: number, b: number, a: number = 1.0): void {
    const colors = { r, g, b, a };
    const context = {
      code: ErrorCode.CORE_INVALID_ARG,
      resource: 'Renderer',
      method: 'setClearColor',
    };
    for (const [name, value] of Object.entries(colors)) {
      validate.number.inRange(value, context, 0, 1, {
        detail: `Invalid color component ${name}: ${value}. Must be between 0 and 1.`,
      });
    }
    this._clearColor = { r, g, b, a };
    this._context.setClearColor(r, g, b, a);
  }

  /**
   * Clears the rendering surface
   *
   * Clears both color and depth buffers.
   *
   * @example
   * renderer.clear();
   */
  clear(): void {
    this._context.clear();
  }

  /**
   * Renders a frame
   *
   * This method should be implemented by concrete renderer classes.
   * It should handle all rendering for a single frame.
   *
   * @abstract
   */
  abstract render(): void;

  /**
   * Disposes of renderer resources
   *
   * This method should be implemented by concrete renderer classes.
   * It should clean up any renderer-specific resources.
   *
   * @abstract
   */
  abstract dispose(): void;

}
