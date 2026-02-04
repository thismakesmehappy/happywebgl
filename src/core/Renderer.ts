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

    this._validateDimensions(width, height);
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
    this._validateDimensions(width, height);
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
    this._validateColor(r, g, b, a);
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

  /**
   * Validates that dimensions are positive
   *
   * @param width - Width to validate
   * @param height - Height to validate
   * @throws Error if either dimension is invalid
   *
   * @internal
   */
  protected _validateDimensions(width: number, height: number): void {
    if (!Number.isFinite(width) || width <= 0) {
      throw new Error(
        `Invalid width: ${width}. Width must be a positive number.`,
      );
    }
    if (!Number.isFinite(height) || height <= 0) {
      throw new Error(
        `Invalid height: ${height}. Height must be a positive number.`,
      );
    }
  }

  /**
   * Validates that color components are in range [0, 1]
   *
   * @param r - Red component
   * @param g - Green component
   * @param b - Blue component
   * @param a - Alpha component
   * @throws Error if any component is invalid
   *
   * @internal
   */
  protected _validateColor(r: number, g: number, b: number, a: number): void {
    const colors = { r, g, b, a };
    for (const [name, value] of Object.entries(colors)) {
      if (!Number.isFinite(value) || value < 0 || value > 1) {
        throw new Error(
          `Invalid color component ${name}: ${value}. Must be between 0 and 1.`,
        );
      }
    }
  }
}
