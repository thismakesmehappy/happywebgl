/**
 * Canvas - Canvas element wrapper with WebGL initialization
 *
 * This class manages:
 * - Canvas creation and sizing
 * - DPI-aware rendering (device pixel ratio)
 * - Responsive resizing
 * - Canvas-to-container attachment
 * - Canvas to image export
 *
 * Canvas does NOT create GLContext. Instead, you create Canvas for DOM management,
 * then create GLContext separately. This provides clean separation of concerns:
 * - Canvas: Manages the HTML canvas element (sizing, DOM, DPI)
 * - GLContext: Manages the WebGL context (rendering, state, resources)
 *
 * For convenience, use Canvas.createWithGLContext() to create both together.
 *
 * @example
 * // Convenience: Create both Canvas and GLContext together
 * const { canvas, glContext } = Canvas.createWithGLContext({
 *   width: 800,
 *   height: 600,
 *   container: '#app'
 * });
 *
 * @example
 * // Separate: Create Canvas for DOM, then GLContext for rendering
 * const canvas = Canvas.create({ width: 800, height: 600, container: '#app' });
 * const glContext = new GLContext(canvas);
 *
 * @example
 * // Wrap existing canvas
 * const canvas = Canvas.fromElement('my-canvas');
 * const glContext = new GLContext(canvas.element);
 */

import { GLContext } from './GLContext.js';
import { AppError } from '../errors/AppError.js';
import { ErrorCode } from '../errors/ErrorCodes.js';

export interface CanvasOptions {
  /**
   * Canvas width in CSS pixels
   * @default 800
   */
  width?: number;

  /**
   * Canvas height in CSS pixels
   * @default 600
   */
  height?: number;

  /**
   * Whether to use device pixel ratio for sharp rendering
   * @default true
   */
  useDevicePixelRatio?: boolean;

  /**
   * Container element to append canvas to (optional)
   * - HTMLElement: Append to this element
   * - string: CSS selector to find element
   * - undefined/null: Create in-memory (not attached to DOM)
   */
  container?: HTMLElement | string;

  /**
   * CSS class to apply to canvas element
   */
  className?: string;

  /**
   * WebGL context creation options
   */
  contextOptions?: WebGLContextAttributes;
}

/**
 * Canvas class manages an HTML canvas element with DOM and sizing utilities
 *
 * This class handles:
 * - Canvas element creation or wrapping
 * - Sizing with DPI-aware rendering
 * - Container attachment and removal
 * - Responsive resizing helpers
 * - Image export
 *
 * @example
 * // Create new canvas in container
 * const canvas = Canvas.create({
 *   width: 1024,
 *   height: 768,
 *   container: '#app'
 * });
 *
 * // Get the HTML element
 * const htmlCanvas = canvas.element;
 */
export class Canvas {
  /**
   * The HTML canvas element
   */
  private _element: HTMLCanvasElement;

  /**
   * Whether we own (created) the canvas element
   * If true, dispose() will remove it from DOM
   * If false, dispose() will only clean up resources, not remove it
   */
  private _ownsElement: boolean;

  /**
   * Whether to maintain device pixel ratio
   */
  private _useDevicePixelRatio: boolean;

  /**
   * Store original CSS dimensions for DPI-aware rendering
   */
  private _cssWidth: number;
  private _cssHeight: number;

  /**
   * Store the canvas size before fillWindow() was called
   * Used to revert dimensions when stopFillWindow(true) is called
   */
  private _previousSize?: { width: number; height: number };

  /**
   * Store the resize handler function for fillWindow()
   * Needed to remove the event listener when stopping
   */
  private _fillWindowHandler?: () => void;

  /**
   * Creates a new Canvas
   *
   * Use this constructor when you already have an HTMLCanvasElement.
   * For convenience, use the static factory methods:
   * - Canvas.create() - Create a new canvas we own
   * - Canvas.fromElement() - Wrap an existing canvas we don't own
   * - Canvas.createWithGLContext() - Create canvas + GLContext together
   *
   * @param element - HTMLCanvasElement to manage
   * @param ownsElement - Whether we own this element (default: true). If true, dispose() removes from DOM
   * @param options - Canvas configuration
   * @throws Error if options are invalid
   *
   * @example
   * // Direct constructor - assumes you own the element
   * const element = document.createElement('canvas');
   * const canvas = new Canvas(element, true, { width: 800, height: 600 });
   *
   * @example
   * // Factory method for clarity
   * const canvas = Canvas.create({ width: 800, height: 600 });
   */
  constructor(
    element: HTMLCanvasElement,
    ownsElement: boolean = true,
    options: CanvasOptions = {},
  ) {
    const {
      width = 800,
      height = 600,
      useDevicePixelRatio = true,
      className,
    } = options;

    this._element = element;
    this._ownsElement = ownsElement;
    this._useDevicePixelRatio = useDevicePixelRatio;
    this._cssWidth = width;
    this._cssHeight = height;

    // Set CSS classes if provided
    if (className) {
      this._element.className = className;
    }

    // Set CSS size (logical size)
    this._element.style.width = `${width}px`;
    this._element.style.height = `${height}px`;

    // Set drawingBuffer size with DPI awareness
    this._setDrawingBufferSize();
  }

  /**
   * Creates a new Canvas element that we own
   *
   * @param options - Canvas configuration
   * @returns New Canvas instance with owned element
   * @throws Error if options are invalid
   *
   * @example
   * const canvas = Canvas.create({ width: 800, height: 600, container: '#app' });
   */
  static create(options: CanvasOptions = {}): Canvas {
    const element = document.createElement('canvas');
    const canvas = new Canvas(element, true, options);

    // Append to container if provided
    const { container } = options;
    if (container !== undefined && container !== null) {
      canvas._appendToContainer(container);
    }

    return canvas;
  }

  /**
   * Wraps an existing canvas element
   *
   * Use this when you have an existing HTMLCanvasElement in your DOM
   * that you want to manage with Canvas utilities.
   *
   * @param element - HTMLElement (by reference) or element ID string
   * @param options - Canvas configuration
   * @returns New Canvas instance wrapping the element
   * @throws Error if element not found or is not a canvas
   *
   * @example
   * // Wrap by reference
   * const htmlCanvas = document.getElementById('my-canvas') as HTMLCanvasElement;
   * const canvas = Canvas.fromElement(htmlCanvas);
   *
   * @example
   * // Wrap by ID string
   * const canvas = Canvas.fromElement('my-canvas');
   */
  static fromElement(
    element: HTMLElement | string,
    options: CanvasOptions = {},
  ): Canvas {
    let htmlCanvas: HTMLCanvasElement;

    if (typeof element === 'string') {
      // ID string - look up in DOM
      const found = document.getElementById(element);
      if (!found) {
        throw new AppError(ErrorCode.CORE_NOT_FOUND, {
          resource: 'Canvas',
          method: 'fromElement',
          detail: `Canvas element with ID "${element}" not found in the DOM.`,
        });
      }
      if (!(found instanceof HTMLCanvasElement)) {
        throw new AppError(ErrorCode.CORE_INVALID_ARG, {
          resource: 'Canvas',
          method: 'fromElement',
          detail: `Element with ID "${element}" is not an HTMLCanvasElement.`,
        });
      }
      htmlCanvas = found;
    } else {
      // Direct element reference
      if (!(element instanceof HTMLCanvasElement)) {
        throw new AppError(ErrorCode.CORE_INVALID_ARG, {
          resource: 'Canvas',
          method: 'fromElement',
          detail: 'Element must be an HTMLCanvasElement.',
        });
      }
      htmlCanvas = element;
    }

    // We don't own this element - we're just wrapping it
    return new Canvas(htmlCanvas, false, options);
  }

  /**
   * Creates a Canvas and GLContext together (convenience method)
   *
   * This is the easiest way to set up both Canvas and WebGL rendering.
   *
   * @param options - Canvas configuration
   * @param contextOptions - WebGL context options
   * @returns Object with canvas and glContext
   * @throws Error if canvas creation or WebGL context fails
   *
   * @example
   * const { canvas, glContext } = Canvas.createWithGLContext({
   *   width: 800,
   *   height: 600,
   *   container: '#app'
   * });
   *
   * @example
   * // With WebGL options
   * const { canvas, glContext } = Canvas.createWithGLContext(
   *   { width: 800, height: 600, container: '#app' },
   *   { antialias: false, powerPreference: 'low-power' }
   * );
   */
  static createWithGLContext(
    options: CanvasOptions = {},
    contextOptions?: WebGLContextAttributes,
  ): {
    canvas: Canvas;
    glContext: GLContext;
  } {
    const canvas = Canvas.create(options);
    const glContext = new GLContext(canvas, contextOptions);
    return { canvas, glContext };
  }

  /**
   * Gets the HTML canvas element
   *
   * Use this to:
   * - Pass to GLContext constructor
   * - Access raw canvas API
   * - Use with other libraries
   *
   * @example
   * const glContext = new GLContext(canvas.element);
   */
  get element(): HTMLCanvasElement {
    return this._element;
  }

  /**
   * Gets the canvas width in CSS pixels
   */
  get width(): number {
    return this._cssWidth;
  }

  /**
   * Gets the canvas height in CSS pixels
   */
  get height(): number {
    return this._cssHeight;
  }

  /**
   * Gets the device pixel ratio being used
   */
  get devicePixelRatio(): number {
    if (!this._useDevicePixelRatio) {
      return 1;
    }
    return window.devicePixelRatio ?? 1;
  }

  /**
   * Sets the canvas size in CSS pixels and updates drawingBuffer
   *
   * @param width - Width in CSS pixels
   * @param height - Height in CSS pixels
   * @returns this for method chaining
   *
   * @example
   * canvas.setSize(1024, 768);
   *
   * @example
   * // Respond to window resize
   * window.addEventListener('resize', () => {
   *   canvas.setSize(window.innerWidth, window.innerHeight);
   * });
   */
  setSize(width: number, height: number): this {
    this._cssWidth = width;
    this._cssHeight = height;

    // Update CSS dimensions
    this._element.style.width = `${width}px`;
    this._element.style.height = `${height}px`;

    // Update actual drawingBuffer size
    this._updateCanvasSize();

    return this;
  }

  /**
   * Fills entire browser window and listens for resize events
   *
   * Sets canvas size to window dimensions and listens for resize events
   * to keep it full-screen. Useful for full-screen applications.
   *
   * **Important:** This only resizes the canvas element. If using WebGL,
   * you must manually sync the viewport after calling fillWindow():
   *
   * ```typescript
   * canvas.fillWindow();
   * glContext.setViewport(0, 0, canvas.width, canvas.height);
   * ```
   *
   * Or use a higher-level Renderer class that handles this coordination.
   * This separation keeps Canvas independent of rendering context.
   *
   * Stores the current size before filling so it can be reverted with
   * stopFillWindow(true).
   *
   * @returns this for method chaining
   *
   * @example
   * canvas.setSize(1024, 768);
   * canvas.fillWindow();
   * // Canvas fills the window and resizes with it
   *
   * @example
   * // With WebGL - manually sync viewport
   * const { canvas, glContext } = Canvas.createWithGLContext();
   * canvas.fillWindow();
   * glContext.setViewport(0, 0, canvas.width, canvas.height);
   *
   * @example
   * // Stop listening and revert to previous size
   * canvas.stopFillWindow(true);  // Back to 1024x768
   */
  fillWindow(): this {
    // Store the current size before filling the window (for stopFillWindow revert)
    this._previousSize = { width: this._cssWidth, height: this._cssHeight };

    // Remove previous listener if it exists (prevent duplicate listeners)
    if (this._fillWindowHandler) {
      window.removeEventListener('resize', this._fillWindowHandler);
    }

    this._fillWindowHandler = () => {
      this.setSize(window.innerWidth, window.innerHeight);
    };

    // Set initial size to window dimensions
    this.setSize(window.innerWidth, window.innerHeight);

    // Listen for resize
    window.addEventListener('resize', this._fillWindowHandler);

    return this;
  }

  /**
   * Stops listening for window resize events
   *
   * Removes the resize listener added by fillWindow(). Optionally reverts
   * the canvas to its size before fillWindow() was called.
   *
   * Can be called multiple times safely - after first stop, subsequent calls
   * with revert=true will be no-ops.
   *
   * @param revert - If true, revert to size before fillWindow() was called (default: false)
   * @returns this for method chaining
   *
   * @example
   * canvas.setSize(1024, 768);
   * canvas.fillWindow();
   * // Later...
   * canvas.stopFillWindow(true);  // Stop and revert to 1024x768
   *
   * @example
   * // Stop and set new size with chaining
   * canvas.stopFillWindow().setSize(800, 600);
   *
   * @example
   * // Stop without reverting, keep current size
   * canvas.stopFillWindow();
   */
  stopFillWindow(revert: boolean = false): this {
    if (this._fillWindowHandler) {
      window.removeEventListener('resize', this._fillWindowHandler);
      this._fillWindowHandler = undefined;
    }

    // Revert to previous size if requested and available
    if (revert && this._previousSize) {
      this.setSize(this._previousSize.width, this._previousSize.height);
    }

    // Clear the stored previous size since we're no longer in fillWindow mode
    this._previousSize = undefined;

    return this;
  }

  /**
   * Sets the drawing buffer size (called during initialization)
   *
   * This ensures sharp rendering on high-DPI displays by accounting
   * for device pixel ratio.
   *
   * @internal
   */
  private _setDrawingBufferSize(): void {
    const dpi = this.devicePixelRatio;

    // Set the drawingBuffer size (in device pixels)
    this._element.width = this._cssWidth * dpi;
    this._element.height = this._cssHeight * dpi;

    // Scale WebGL canvas to match CSS size on high-DPI displays
    if (dpi !== 1) {
      this._element.style.transformOrigin = '0 0';
      this._element.style.transform = `scale(${1 / dpi})`;
      this._element.style.width = `${this._cssWidth * dpi}px`;
      this._element.style.height = `${this._cssHeight * dpi}px`;
    }
  }

  /**
   * Updates the drawing buffer size based on CSS size and DPI
   *
   * @internal
   */
  private _updateCanvasSize(): void {
    this._setDrawingBufferSize();
  }

  /**
   * Appends canvas to container element
   *
   * @param container - Element or CSS selector
   * @internal
   * @throws Error if container not found
   */
  private _appendToContainer(container: HTMLElement | string): void {
    let parent: HTMLElement | null = null;

    if (typeof container === 'string') {
      // CSS selector - must not be empty
      if (!container) {
        throw new AppError(ErrorCode.CORE_INVALID_ARG, {
          resource: 'Canvas',
          method: '_appendToContainer',
          detail: 'Container selector cannot be empty',
        });
      }
      parent = document.querySelector(container);
      if (!parent) {
        throw new AppError(ErrorCode.CORE_NOT_FOUND, {
          resource: 'Canvas',
          method: '_appendToContainer',
          detail: `Container not found: ${container}`,
        });
      }
    } else {
      // Direct element reference
      parent = container;
    }

    parent.appendChild(this._element);
  }

  /**
   * Sets the canvas element ID
   *
   * @param id - Element ID to set
   * @returns this for method chaining
   *
   * @example
   * canvas.setId('game-canvas');
   */
  setId(id: string): this {
    this._element.id = id;
    return this;
  }

  /**
   * Gets the canvas element ID
   *
   * @returns Current element ID
   *
   * @example
   * const id = canvas.getId();
   */
  getId(): string {
    return this._element.id;
  }

  /**
   * Adds CSS classes to the canvas element
   *
   * Supports both space-separated strings and multiple arguments:
   * - canvas.addClass('fullscreen high-res')  // Auto-splits on whitespace
   * - canvas.addClass('fullscreen', 'high-res')  // Multiple arguments
   * - canvas.addClass('foo bar', 'baz')  // Mix both styles
   *
   * @param classes - One or more class names (space-separated or separate arguments)
   * @returns this for method chaining
   *
   * @example
   * canvas.addClass('fullscreen', 'high-res');
   *
   * @example
   * canvas.addClass('fullscreen high-res');  // Space-separated also works
   *
   * @example
   * // Chained with other methods
   * Canvas.create({ width: 800, height: 600 })
   *   .setId('game-canvas')
   *   .addClass('fullscreen high-res')
   *   .appendTo('#app');
   */
  addClass(...classes: string[]): this {
    for (const classArg of classes) {
      // Split on whitespace and add each class individually
      const parts = classArg.trim().split(/\s+/).filter(Boolean);
      this._element.classList.add(...parts);
    }
    return this;
  }

  /**
   * Removes CSS classes from the canvas element
   *
   * Supports both space-separated strings and multiple arguments:
   * - canvas.removeClass('fullscreen high-res')  // Auto-splits on whitespace
   * - canvas.removeClass('fullscreen', 'high-res')  // Multiple arguments
   * - canvas.removeClass('foo bar', 'baz')  // Mix both styles
   *
   * @param classes - One or more class names (space-separated or separate arguments)
   * @returns this for method chaining
   *
   * @example
   * canvas.removeClass('fullscreen');
   *
   * @example
   * canvas.removeClass('fullscreen high-res');  // Space-separated also works
   */
  removeClass(...classes: string[]): this {
    for (const classArg of classes) {
      // Split on whitespace and remove each class individually
      const parts = classArg.trim().split(/\s+/).filter(Boolean);
      this._element.classList.remove(...parts);
    }
    return this;
  }

  /**
   * Checks if canvas has a CSS class
   *
   * @param className - Class name to check
   * @returns True if canvas has the class, false otherwise
   *
   * @example
   * if (canvas.hasClass('fullscreen')) {
   *   // Handle fullscreen mode
   * }
   */
  hasClass(className: string): boolean {
    return this._element.classList.contains(className);
  }

  /**
   * Appends canvas to a container element
   *
   * Useful for delayed attachment or dynamic container selection.
   *
   * @param container - HTMLElement or CSS selector
   * @returns this for method chaining
   * @throws Error if container not found or selector invalid
   *
   * @example
   * const canvas = Canvas.create({ width: 800, height: 600 });
   * canvas.appendTo('#app');
   *
   * @example
   * // Full chained setup
   * Canvas.create({ width: 800, height: 600 })
   *   .setId('game-canvas')
   *   .addClass('fullscreen')
   *   .appendTo('#app');
   */
  appendTo(container: HTMLElement | string): this {
    this._appendToContainer(container);
    return this;
  }

  /**
   * Captures canvas to data URL for downloading
   *
   * Useful for saving rendered images without WebGL texture access.
   * Note: This captures what's currently rendered to the canvas.
   *
   * @param type - Image type (default: 'image/png')
   * @param quality - JPEG quality 0-1 (default: 0.95)
   * @returns Data URL string ready for download
   *
   * @example
   * const url = canvas.toDataURL();
   * const link = document.createElement('a');
   * link.href = url;
   * link.download = 'render.png';
   * link.click();
   *
   * @example
   * // Export as JPEG
   * const jpegUrl = canvas.toDataURL('image/jpeg', 0.8);
   */
  toDataURL(type: string = 'image/png', quality: number = 0.95): string {
    return this._element.toDataURL(type, quality);
  }

  /**
   * Cleans up canvas and removes from DOM if we created it
   *
   * If we created the canvas element, it will be removed from the DOM.
   * If we wrapped an existing element, it will be left in the DOM.
   *
   * Call this when the canvas is no longer needed to clean up
   * DOM references.
   *
   * Note: GLContext cleanup is NOT done here. You must dispose
   * the GLContext separately:
   *
   * @example
   * const { canvas, glContext } = Canvas.createWithGLContext(...);
   * // ... use canvas and glContext ...
   * glContext.dispose();  // Clean up WebGL
   * canvas.dispose();     // Clean up DOM
   *
   * @example
   * // If you created canvas and context separately
   * const canvas = Canvas.create(...);
   * const glContext = new GLContext(canvas);
   * glContext.dispose();  // First: clean up WebGL
   * canvas.dispose();     // Second: clean up DOM
   */
  dispose(): void {
    // Only remove from DOM if we created it
    if (this._ownsElement && this._element.parentElement) {
      this._element.parentElement.removeChild(this._element);
    }

    // Note: We don't dispose GLContext here because Canvas doesn't create it.
    // User must dispose GLContext separately.
  }
}
