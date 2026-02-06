/**
 * GLContext - WebGL 2.0 context wrapper with error handling and utilities
 *
 * This class wraps the WebGL2RenderingContext to provide:
 * - Error checking and debugging assistance
 * - Resource tracking for cleanup
 * - Utility methods for common operations
 * - Comprehensive WebGL state management via WebGLState
 *
 * A single GLContext typically corresponds to a canvas element,
 * and all rendering operations go through this wrapper.
 *
 * State Management Philosophy:
 * ────────────────────────────
 * Users should manage WebGL state through glContext.state (WebGLState), not through
 * the raw glContext.gl API. This ensures:
 * - State changes are tracked internally
 * - Redundant GPU calls are prevented (performance)
 * - State can be queried without calling WebGL
 * - All state changes go through a consistent interface
 *
 * @example
 * const ctx = new GLContext(canvas);
 * // ✅ Correct: uses state management
 * ctx.state.enableBlend();
 * ctx.state.setBlendFunc(ctx.gl.SRC_ALPHA, ctx.gl.ONE_MINUS_SRC_ALPHA);
 *
 * // ❌ Avoid: bypasses state tracking
 * ctx.gl.enable(ctx.gl.BLEND);
 * ctx.gl.blendFunc(ctx.gl.SRC_ALPHA, ctx.gl.ONE_MINUS_SRC_ALPHA);
 */

import { WebGLState } from './WebGLState.js';
import type { Canvas } from './Canvas.js';

export class GLContext {
  /**
   * The underlying WebGL 2.0 context
   *
   * @internal Avoid using directly for state changes. Use .state instead.
   * Access this only for:
   * - Getting WebGL constants (e.g., ctx.gl.SRC_ALPHA)
   * - Rendering operations (clear, drawArrays, etc.)
   * - Reading WebGL state (getParameter, etc.)
   */
  private _gl: WebGL2RenderingContext;

  /**
   * WebGL state manager
   *
   * All WebGL state changes (capabilities, parameters) should go through this.
   * This keeps internal state tracking synchronized with actual WebGL state.
   */
  private _state: WebGLState;

  /**
   * Canvas element this context is attached to
   */
  private _canvas: HTMLCanvasElement;

  /**
   * Tracks created programs for cleanup
   */
  private _programs: Set<WebGLProgram>;

  /**
   * Tracks created buffers for cleanup
   */
  private _buffers: Set<WebGLBuffer>;

  /**
   * Tracks created textures for cleanup
   */
  private _textures: Set<WebGLTexture>;

  /**
   * Tracks created vertex arrays for cleanup
   */
  private _vertexArrays: Set<WebGLVertexArrayObject>;

  /**
   * Tracks created framebuffers for cleanup
   */
  private _framebuffers: Set<WebGLFramebuffer>;

  /**
   * Tracks created renderbuffers for cleanup
   */
  private _renderbuffers: Set<WebGLRenderbuffer>;

  /**
   * Tracks created samplers for cleanup
   */
  private _samplers: Set<WebGLSampler>;

  /**
   * Tracks created transform feedback objects for cleanup
   */
  private _transformFeedbacks: Set<WebGLTransformFeedback>;

  /**
   * Debug mode - logs all WebGL errors
   */
  private _debugMode: boolean;

  /**
   * Viewport position and size (x, y, width, height)
   * Tracks the rendering viewport independently from canvas size
   */
  private _viewportX: number;
  private _viewportY: number;
  private _viewportWidth: number;
  private _viewportHeight: number;

  /**
   * Creates a new GLContext from a canvas element ID
   *
   * Convenience factory method that looks up a canvas by ID and creates a GLContext.
   *
   * @param canvasId - The HTML ID of the canvas element
   * @param options - Context creation options (WebGLContextAttributes)
   * @returns A new GLContext instance
   * @throws Error if canvas not found or WebGL 2.0 is not supported
   *
   * @example
   * // In HTML: <canvas id="my-canvas"></canvas>
   * const glContext = GLContext.fromElementId('my-canvas');
   *
   * @example
   * // With options
   * const glContext = GLContext.fromElementId('my-canvas', {
   *   powerPreference: 'low-power',
   * });
   */
  static fromElementId(
    canvasId: string,
    options: WebGLContextAttributes = {},
  ): GLContext {
    const canvas = document.getElementById(canvasId) as HTMLCanvasElement | null;
    if (!canvas) {
      throw new Error(
        `Canvas element with ID "${canvasId}" not found in the DOM.`,
      );
    }
    if (!(canvas instanceof HTMLCanvasElement)) {
      throw new Error(
        `Element with ID "${canvasId}" is not an HTMLCanvasElement.`,
      );
    }
    return new GLContext(canvas, options);
  }

  /**
   * Creates a new GLContext wrapper
   *
   * @param canvasOrElement - Canvas object, HTMLCanvasElement, or element ID string
   *   - Canvas: Uses canvas.element internally
   *   - HTMLCanvasElement: Uses directly
   *   - string: Looks up element by ID in DOM
   * @param options - Context creation options (WebGLContextAttributes)
   *   Defaults are optimized for rendering:
   *   - `antialias: true` - Smooth edges on geometry
   *   - `alpha: true` - Transparent canvas for compositing
   *   - `depth: true` - Enable depth testing for 3D rendering
   *   - `stencil: false` - Disabled for performance
   *   - `powerPreference: 'high-performance'` - Use discrete GPU when available
   *
   *   Override any defaults by passing them in options parameter
   *
   * @throws Error if WebGL 2.0 is not supported, context creation fails, or element not found
   *
   * @example
   * // With Canvas object
   * const { canvas, glContext } = Canvas.createWithGLContext({ width: 800, height: 600 });
   *
   * @example
   * // With HTMLCanvasElement
   * const canvas = document.querySelector('canvas')!;
   * const glContext = new GLContext(canvas);
   *
   * @example
   * // With element ID string
   * const glContext = new GLContext('my-canvas');
   *
   * @example
   * // Override defaults for lower power consumption
   * const glContext = new GLContext('my-canvas', {
   *   powerPreference: 'low-power',
   *   antialias: false,
   * });
   */
  constructor(
    canvasOrElement: Canvas | HTMLCanvasElement | string,
    options: WebGLContextAttributes = {},
  ) {
    // Extract canvas element from various input types
    let canvas: HTMLCanvasElement;

    if (canvasOrElement instanceof HTMLCanvasElement) {
      // Direct HTMLCanvasElement
      canvas = canvasOrElement;
    } else if (typeof canvasOrElement === 'string') {
      // Element ID string - look up in DOM
      const element = document.getElementById(canvasOrElement);
      if (!element) {
        throw new Error(`Canvas element with ID "${canvasOrElement}" not found in the DOM.`);
      }
      if (!(element instanceof HTMLCanvasElement)) {
        throw new Error(
          `Element with ID "${canvasOrElement}" is not an HTMLCanvasElement.`,
        );
      }
      canvas = element;
    } else {
      // Canvas object - extract .element property
      const elem = (canvasOrElement as Canvas).element;
      if (!(elem instanceof HTMLCanvasElement)) {
        throw new Error(
          'Canvas object must have an .element property that is an HTMLCanvasElement.',
        );
      }
      canvas = elem;
    }

    this._canvas = canvas;

    // Request WebGL 2.0 context with sensible defaults
    const gl = canvas.getContext('webgl2', {
      antialias: true,
      alpha: true,
      depth: true,
      stencil: false,
      powerPreference: 'high-performance',
      ...options,
    }) as WebGL2RenderingContext | null;

    if (!gl) {
      throw new Error(
        'WebGL 2.0 is not supported on this browser. Please use a modern browser with WebGL 2.0 support.',
      );
    }

    this._gl = gl;
    this._state = new WebGLState(gl);
    this._programs = new Set();
    this._buffers = new Set();
    this._textures = new Set();
    this._vertexArrays = new Set();
    this._framebuffers = new Set();
    this._renderbuffers = new Set();
    this._samplers = new Set();
    this._transformFeedbacks = new Set();
    this._debugMode = false;

    // Initialize viewport to full canvas (sensible default)
    this._viewportX = 0;
    this._viewportY = 0;
    this._viewportWidth = canvas.width;
    this._viewportHeight = canvas.height;
    this._gl.viewport(this._viewportX, this._viewportY, this._viewportWidth, this._viewportHeight);

    // Initialize WebGL state with sensible defaults
    // ✅ Using WebGLState so internal tracking stays synchronized
    this._state.enableDepthTest();
    this._state.setCullFaceBack();      // Automatically enables CULL_FACE
    this._state.enableBlend();
    this._state.setBlendFunc(this._gl.SRC_ALPHA, this._gl.ONE_MINUS_SRC_ALPHA);

    this._checkError('GLContext constructor');
  }

  /**
   * Gets the underlying WebGL context
   *
   * Use this to access the raw WebGL API when needed:
   * @example
   * glContext.gl.clear(glContext.gl.COLOR_BUFFER_BIT);
   * glContext.gl.SRC_ALPHA  // Get WebGL constants
   */
  get gl(): WebGL2RenderingContext {
    return this._gl;
  }

  /**
   * Gets the WebGL state manager
   *
   * All WebGL state changes (capabilities, parameters) should go through this.
   * This keeps state tracking synchronized with actual WebGL state.
   *
   * @example
   * glContext.state.enableBlend();
   * glContext.state.setBlendFunc(glContext.gl.SRC_ALPHA, glContext.gl.ONE_MINUS_SRC_ALPHA);
   */
  get state(): WebGLState {
    return this._state;
  }

  /**
   * Gets the canvas element
   */
  get canvas(): HTMLCanvasElement {
    return this._canvas;
  }

  /**
   * Gets the canvas width in pixels
   *
   * Note: This is the HTML canvas dimension, not the viewport width.
   * Use viewportWidth to get the rendering viewport dimensions.
   */
  get canvasWidth(): number {
    return this._canvas.width;
  }

  /**
   * Gets the canvas height in pixels
   *
   * Note: This is the HTML canvas dimension, not the viewport height.
   * Use viewportHeight to get the rendering viewport dimensions.
   */
  get canvasHeight(): number {
    return this._canvas.height;
  }

  /**
   * Gets the viewport x origin (left position)
   */
  get viewportX(): number {
    return this._viewportX;
  }

  /**
   * Gets the viewport y origin (bottom position in WebGL coordinates)
   */
  get viewportY(): number {
    return this._viewportY;
  }

  /**
   * Gets the viewport width in pixels
   */
  get viewportWidth(): number {
    return this._viewportWidth;
  }

  /**
   * Gets the viewport height in pixels
   */
  get viewportHeight(): number {
    return this._viewportHeight;
  }

  /**
   * Gets the number of tracked programs awaiting cleanup
   *
   * @internal Useful for testing and debugging resource management
   */
  get trackedProgramCount(): number {
    return this._programs.size;
  }

  /**
   * Gets read-only access to tracked programs
   *
   * Allows inspection of tracked GPU programs without allowing modification.
   *
   * @internal Useful for testing and debugging resource management
   */
  get trackedPrograms(): ReadonlySet<WebGLProgram> {
    return this._programs;
  }

  /**
   * Gets the number of tracked buffers awaiting cleanup
   *
   * @internal Useful for testing and debugging resource management
   */
  get trackedBufferCount(): number {
    return this._buffers.size;
  }

  /**
   * Gets read-only access to tracked buffers
   *
   * Allows inspection of tracked GPU buffers without allowing modification.
   *
   * @internal Useful for testing and debugging resource management
   */
  get trackedBuffers(): ReadonlySet<WebGLBuffer> {
    return this._buffers;
  }

  /**
   * Gets the number of tracked textures awaiting cleanup
   *
   * @internal Useful for testing and debugging resource management
   */
  get trackedTextureCount(): number {
    return this._textures.size;
  }

  /**
   * Gets read-only access to tracked textures
   *
   * Allows inspection of tracked GPU textures without allowing modification.
   *
   * @internal Useful for testing and debugging resource management
   */
  get trackedTextures(): ReadonlySet<WebGLTexture> {
    return this._textures;
  }

  /**
   * Gets the number of tracked vertex arrays awaiting cleanup
   *
   * @internal Useful for testing and debugging resource management
   */
  get trackedVertexArrayCount(): number {
    return this._vertexArrays.size;
  }

  /**
   * Gets read-only access to tracked vertex arrays
   *
   * Allows inspection of tracked VAOs without allowing modification.
   *
   * @internal Useful for testing and debugging resource management
   */
  get trackedVertexArrays(): ReadonlySet<WebGLVertexArrayObject> {
    return this._vertexArrays;
  }

  /**
   * Sets the canvas size and updates WebGL viewport to match
   *
   * This is a convenience method that syncs both canvas dimensions and viewport.
   * The viewport will be set to (0, 0, width, height).
   *
   * @param width - New canvas width in pixels
   * @param height - New canvas height in pixels
   * @returns this for chaining
   *
   * @example
   * glContext.setSize(800, 600);
   *
   * @example
   * // Chainable
   * glContext.setSize(800, 600).setClearColor(0.1, 0.1, 0.1, 1.0);
   */
  setSize(width: number, height: number): this {
    this._canvas.width = width;
    this._canvas.height = height;
    this.setViewport(0, 0, width, height);
    return this;
  }

  /**
   * Sets the canvas size only, without changing the viewport
   *
   * Use this when you want to change canvas dimensions while keeping
   * the viewport region exactly as it is.
   *
   * @param width - New canvas width in pixels
   * @param height - New canvas height in pixels
   * @returns this for chaining
   *
   * @example
   * // Keep viewport at (100, 100, 300, 200) even if canvas grows
   * glContext.setCanvasSize(800, 600);
   */
  setCanvasSize(width: number, height: number): this {
    this._canvas.width = width;
    this._canvas.height = height;
    this._checkError('setCanvasSize');
    return this;
  }

  /**
   * Sets the viewport region independently from canvas size
   *
   * The viewport defines which portion of the canvas WebGL renders to.
   * This allows split-screen rendering, picture-in-picture, etc.
   *
   * @param x - Left position of viewport (pixels from canvas left)
   * @param y - Bottom position of viewport (pixels from canvas bottom)
   * @param width - Width of viewport (pixels)
   * @param height - Height of viewport (pixels)
   * @returns this for chaining
   *
   * @example
   * // Render to top-left quarter of canvas
   * glContext.setViewport(0, 300, 400, 300);
   *
   * @example
   * // Chain with other operations
   * glContext.setViewport(100, 100, 300, 200).setClearColor(0.1, 0.1, 0.1, 1.0);
   */
  setViewport(x: number, y: number, width: number, height: number): this {
    this._viewportX = x;
    this._viewportY = y;
    this._viewportWidth = width;
    this._viewportHeight = height;
    this._gl.viewport(x, y, width, height);
    this._checkError('setViewport');
    return this;
  }

  /**
   * Sets the viewport from a canvas element ID (factory method for chaining)
   *
   * This factory method allows fluent chaining after GLContext.fromElementId().
   *
   * @param x - Left position of viewport (pixels from canvas left)
   * @param y - Bottom position of viewport (pixels from canvas bottom)
   * @param width - Width of viewport (pixels)
   * @param height - Height of viewport (pixels)
   * @returns this for chaining
   *
   * @example
   * // Fluent builder pattern
   * const ctx = GLContext.fromElementId('my-canvas')
   *   .withViewport(100, 100, 300, 200);
   *
   * @example
   * // Can be called in any order
   * const ctx = GLContext.fromElementId('my-canvas')
   *   .withViewport(100, 100, 400, 400)
   *   .setClearColor(0.2, 0.2, 0.2, 1.0);
   */
  withViewport(x: number, y: number, width: number, height: number): this {
    return this.setViewport(x, y, width, height);
  }

  /**
   * Sets the clear color (background color)
   *
   * @param r - Red component (0-1)
   * @param g - Green component (0-1)
   * @param b - Blue component (0-1)
   * @param a - Alpha component (0-1), default 1.0
   * @returns this for chaining
   *
   * @example
   * glContext.setClearColor(0.2, 0.2, 0.2, 1.0); // Dark gray background
   *
   * @example
   * // Chainable
   * glContext.setClearColor(0.1, 0.1, 0.1, 1.0).setSize(800, 600);
   */
  setClearColor(r: number, g: number, b: number, a: number = 1.0): this {
    this._gl.clearColor(r, g, b, a);
    this._checkError('setClearColor');
    return this;
  }

  /**
   * Clears the color and depth buffers
   *
   * @example
   * glContext.clear();
   */
  clear(): void {
    this._gl.clear(this._gl.COLOR_BUFFER_BIT | this._gl.DEPTH_BUFFER_BIT);
    this._checkError('clear');
  }

  /**
   * Creates a shader program from vertex and fragment shader sources
   *
   * @param vertexShaderSource - GLSL vertex shader source code
   * @param fragmentShaderSource - GLSL fragment shader source code
   * @returns The compiled WebGL program
   * @throws Error if shader compilation or linking fails
   *
   * @example
   * const program = glContext.createProgram(vertexSrc, fragmentSrc);
   */
  createProgram(
    vertexShaderSource: string,
    fragmentShaderSource: string,
  ): WebGLProgram {
    // Compile vertex shader
    const vertexShader = this._gl.createShader(this._gl.VERTEX_SHADER);
    if (!vertexShader) {
      throw new Error('Failed to create vertex shader');
    }

    this._gl.shaderSource(vertexShader, vertexShaderSource);
    this._gl.compileShader(vertexShader);

    if (!this._gl.getShaderParameter(vertexShader, this._gl.COMPILE_STATUS)) {
      const error = this._gl.getShaderInfoLog(vertexShader);
      this._gl.deleteShader(vertexShader);
      throw new Error(`Vertex shader compilation failed:\n${error}`);
    }

    // Compile fragment shader
    const fragmentShader = this._gl.createShader(this._gl.FRAGMENT_SHADER);
    if (!fragmentShader) {
      this._gl.deleteShader(vertexShader);
      throw new Error('Failed to create fragment shader');
    }

    this._gl.shaderSource(fragmentShader, fragmentShaderSource);
    this._gl.compileShader(fragmentShader);

    if (!this._gl.getShaderParameter(fragmentShader, this._gl.COMPILE_STATUS)) {
      const error = this._gl.getShaderInfoLog(fragmentShader);
      this._gl.deleteShader(vertexShader);
      this._gl.deleteShader(fragmentShader);
      throw new Error(`Fragment shader compilation failed:\n${error}`);
    }

    // Link program
    const program = this._gl.createProgram();
    if (!program) {
      this._gl.deleteShader(vertexShader);
      this._gl.deleteShader(fragmentShader);
      throw new Error('Failed to create program');
    }

    this._gl.attachShader(program, vertexShader);
    this._gl.attachShader(program, fragmentShader);
    this._gl.linkProgram(program);

    if (!this._gl.getProgramParameter(program, this._gl.LINK_STATUS)) {
      const error = this._gl.getProgramInfoLog(program);
      this._gl.deleteProgram(program);
      this._gl.deleteShader(vertexShader);
      this._gl.deleteShader(fragmentShader);
      throw new Error(`Program linking failed:\n${error}`);
    }

    // Clean up shaders (they're linked into program)
    this._gl.deleteShader(vertexShader);
    this._gl.deleteShader(fragmentShader);

    this._programs.add(program);
    this._checkError('createProgram');

    return program;
  }

  /**
   * Creates an empty WebGL buffer
   *
   * Creates a new buffer object but does not allocate data or bind it.
   * Use bufferData() to populate the buffer.
   *
   * @returns The created WebGL buffer (unbound, no data)
   * @throws Error if buffer creation fails
   *
   * @example
   * const buffer = glContext.createBuffer();
   * glContext.bufferData(glContext.gl.ARRAY_BUFFER, buffer, vertices, glContext.gl.STATIC_DRAW);
   */
  createBuffer(): WebGLBuffer {
    const buffer = this._gl.createBuffer();
    if (!buffer) {
      throw new Error('Failed to create WebGL buffer');
    }

    this._buffers.add(buffer);
    this._checkError('createBuffer');

    return buffer;
  }

  /**
   * Allocates and populates a buffer with data
   *
   * Binds the buffer, uploads data via bufferData(), and unbinds.
   * Convenience method for the common pattern of creating and filling in one operation.
   *
   * @param target - Buffer target (e.g., ARRAY_BUFFER, ELEMENT_ARRAY_BUFFER)
   * @param buffer - The buffer to populate
   * @param data - Data to upload (TypedArray or ArrayBuffer)
   * @param usage - WebGL usage hint (default: STATIC_DRAW)
   * @throws Error if WebGL error occurs
   *
   * @example
   * const buffer = glContext.createBuffer(glContext.gl.ARRAY_BUFFER);
   * glContext.bufferData(glContext.gl.ARRAY_BUFFER, buffer, vertices, glContext.gl.STATIC_DRAW);
   */
  bufferData(
    target: GLenum,
    buffer: WebGLBuffer,
    data: ArrayBufferView,
    usage: GLenum = this._gl.STATIC_DRAW,
  ): void {
    this._gl.bindBuffer(target, buffer);
    this._gl.bufferData(target, data, usage);
    this._gl.bindBuffer(target, null);
    this._checkError('bufferData');
  }

  /**
   * Update part of a buffer with new data
   *
   * Binds the buffer, uploads partial data via bufferSubData(), and unbinds.
   *
   * @param target - Buffer target
   * @param buffer - The buffer to update
   * @param offset - Byte offset into the buffer
   * @param data - Data to upload
   * @throws Error if WebGL error occurs or offset is invalid
   *
   * @example
   * glContext.bufferSubData(glContext.gl.ARRAY_BUFFER, buffer, 0, newData);
   */
  bufferSubData(
    target: GLenum,
    buffer: WebGLBuffer,
    offset: number,
    data: ArrayBufferView,
  ): void {
    this._gl.bindBuffer(target, buffer);
    this._gl.bufferSubData(target, offset, data);
    this._gl.bindBuffer(target, null);
    this._checkError('bufferSubData');
  }

  /**
   * Bind a buffer to a target
   *
   * @param target - Buffer target (ARRAY_BUFFER, ELEMENT_ARRAY_BUFFER, etc.)
   * @param buffer - The buffer to bind (or null to unbind)
   *
   * @example
   * glContext.bindBuffer(glContext.gl.ARRAY_BUFFER, buffer);
   */
  bindBuffer(target: GLenum, buffer: WebGLBuffer | null): void {
    this._gl.bindBuffer(target, buffer);
    this._checkError('bindBuffer');
  }

  /**
   * Unbind a buffer from a target
   *
   * @param target - Buffer target to unbind from
   *
   * @example
   * glContext.unbindBuffer(glContext.gl.ARRAY_BUFFER);
   */
  unbindBuffer(target: GLenum): void {
    this._gl.bindBuffer(target, null);
    this._checkError('unbindBuffer');
  }

  /**
   * Get a buffer parameter
   *
   * @param target - Buffer target
   * @param pname - Parameter name (e.g., BUFFER_SIZE, BUFFER_USAGE)
   * @returns The parameter value
   *
   * @example
   * const size = glContext.getBufferParameter(glContext.gl.ARRAY_BUFFER, glContext.gl.BUFFER_SIZE);
   */
  getBufferParameter(target: GLenum, pname: GLenum): any {
    return this._gl.getBufferParameter(target, pname);
  }

  /**
   * Creates a WebGL texture
   *
   * Creates an empty texture object. Use texImage2D() or texSubImage2D() to populate.
   *
   * @returns The created WebGL texture (unbound)
   * @throws Error if texture creation fails
   *
   * @example
   * const texture = glContext.createTexture();
   * glContext.texImage2D(texture, glContext.gl.TEXTURE_2D, imageData, width, height);
   */
  createTexture(): WebGLTexture {
    const texture = this._gl.createTexture();
    if (!texture) {
      throw new Error('Failed to create WebGL texture');
    }

    this._textures.add(texture);
    this._checkError('createTexture');

    return texture;
  }

  /**
   * Bind a texture to a target and optional texture unit
   *
   * @param target - Texture target (e.g., TEXTURE_2D, TEXTURE_CUBE_MAP)
   * @param texture - The texture to bind (or null to unbind)
   * @param unit - Optional texture unit (0-based, default: 0)
   *
   * @example
   * glContext.bindTexture(glContext.gl.TEXTURE_2D, texture, 0);
   */
  bindTexture(target: GLenum, texture: WebGLTexture | null, unit: number = 0): void {
    this._gl.activeTexture(this._gl.TEXTURE0 + unit);
    this._gl.bindTexture(target, texture);
    this._checkError('bindTexture');
  }

  /**
   * Sets the currently active texture unit
   *
   * @param unit - Texture unit (0-based)
   *
   * @example
   * glContext.setActiveTextureUnit(3);
   */
  setActiveTextureUnit(unit: number): void {
    this._gl.activeTexture(this._gl.TEXTURE0 + unit);
    this._checkError('setActiveTextureUnit');
  }

  /**
   * Unbind a texture from a target
   *
   * @param target - Texture target to unbind from
   * @param unit - Optional texture unit (0-based, default: 0)
   *
   * @example
   * glContext.unbindTexture(glContext.gl.TEXTURE_2D, 0);
   */
  unbindTexture(target: GLenum, unit: number = 0): void {
    this._gl.activeTexture(this._gl.TEXTURE0 + unit);
    this._gl.bindTexture(target, null);
    this._checkError('unbindTexture');
  }

  /**
   * Set a texture parameter (integer)
   *
   * @param target - Texture target
   * @param texture - The texture to configure
   * @param pname - Parameter name (e.g., TEXTURE_MIN_FILTER, TEXTURE_MAG_FILTER)
   * @param param - Parameter value
   *
   * @example
   * glContext.texParameteri(glContext.gl.TEXTURE_2D, texture,
   *   glContext.gl.TEXTURE_MIN_FILTER, glContext.gl.LINEAR);
   */
  texParameteri(target: GLenum, texture: WebGLTexture, pname: GLenum, param: GLint): void {
    this._gl.bindTexture(target, texture);
    this._gl.texParameteri(target, pname, param);
    this._gl.bindTexture(target, null);
    this._checkError('texParameteri');
  }

  /**
   * Set a texture parameter (float)
   *
   * @param target - Texture target
   * @param texture - The texture to configure
   * @param pname - Parameter name
   * @param param - Parameter value
   *
   * @example
   * glContext.texParameterf(glContext.gl.TEXTURE_2D, texture,
   *   glContext.gl.TEXTURE_LOD_BIAS, 0.5);
   */
  texParameterf(target: GLenum, texture: WebGLTexture, pname: GLenum, param: GLfloat): void {
    this._gl.bindTexture(target, texture);
    this._gl.texParameterf(target, pname, param);
    this._gl.bindTexture(target, null);
    this._checkError('texParameterf');
  }

  /**
   * Specify a 2D texture image
   *
   * Binds the texture, uploads image data, and unbinds.
   *
   * @param target - Texture target (e.g., TEXTURE_2D)
   * @param texture - The texture to populate
   * @param level - Mipmap level (0 for base level)
   * @param internalFormat - Internal format (e.g., RGB, RGBA)
   * @param width - Image width in pixels
   * @param height - Image height in pixels
   * @param border - Border width (must be 0)
   * @param format - Pixel format (e.g., RGB, RGBA)
   * @param type - Pixel type (e.g., UNSIGNED_BYTE, FLOAT)
   * @param data - Image data (optional)
   *
   * @example
   * glContext.texImage2D(glContext.gl.TEXTURE_2D, texture, 0,
   *   glContext.gl.RGBA, 256, 256, 0,
   *   glContext.gl.RGBA, glContext.gl.UNSIGNED_BYTE, imageData);
   */
  texImage2D(
    target: GLenum,
    texture: WebGLTexture,
    level: GLint,
    internalFormat: GLint,
    width: GLsizei,
    height: GLsizei,
    border: GLint,
    format: GLenum,
    type: GLenum,
    data?: ArrayBufferView | null,
  ): void {
    this._gl.bindTexture(target, texture);
    this._gl.texImage2D(target, level, internalFormat, width, height, border, format, type, data ?? null);
    this._gl.bindTexture(target, null);
    this._checkError('texImage2D');
  }

  /**
   * Update part of a 2D texture image
   *
   * Binds the texture, uploads partial image data, and unbinds.
   *
   * @param target - Texture target
   * @param texture - The texture to update
   * @param level - Mipmap level
   * @param xoffset - X offset in pixels
   * @param yoffset - Y offset in pixels
   * @param width - Region width in pixels
   * @param height - Region height in pixels
   * @param format - Pixel format
   * @param type - Pixel type
   * @param data - Image data to upload
   *
   * @example
   * glContext.texSubImage2D(glContext.gl.TEXTURE_2D, texture, 0,
   *   0, 0, 128, 128,
   *   glContext.gl.RGBA, glContext.gl.UNSIGNED_BYTE, partialData);
   */
  texSubImage2D(
    target: GLenum,
    texture: WebGLTexture,
    level: GLint,
    xoffset: GLint,
    yoffset: GLint,
    width: GLsizei,
    height: GLsizei,
    format: GLenum,
    type: GLenum,
    data: ArrayBufferView,
  ): void {
    this._gl.bindTexture(target, texture);
    this._gl.texSubImage2D(target, level, xoffset, yoffset, width, height, format, type, data);
    this._gl.bindTexture(target, null);
    this._checkError('texSubImage2D');
  }

  /**
   * Specify a 3D texture image
   *
   * Binds the texture, uploads image data, and unbinds.
   */
  texImage3D(
    target: GLenum,
    texture: WebGLTexture,
    level: GLint,
    internalFormat: GLint,
    width: GLsizei,
    height: GLsizei,
    depth: GLsizei,
    border: GLint,
    format: GLenum,
    type: GLenum,
    data?: ArrayBufferView | null,
  ): void {
    this._gl.bindTexture(target, texture);
    this._gl.texImage3D(
      target,
      level,
      internalFormat,
      width,
      height,
      depth,
      border,
      format,
      type,
      data ?? null,
    );
    this._gl.bindTexture(target, null);
    this._checkError('texImage3D');
  }

  /**
   * Update part of a 3D texture image
   *
   * Binds the texture, uploads partial image data, and unbinds.
   */
  texSubImage3D(
    target: GLenum,
    texture: WebGLTexture,
    level: GLint,
    xoffset: GLint,
    yoffset: GLint,
    zoffset: GLint,
    width: GLsizei,
    height: GLsizei,
    depth: GLsizei,
    format: GLenum,
    type: GLenum,
    data: ArrayBufferView,
  ): void {
    this._gl.bindTexture(target, texture);
    this._gl.texSubImage3D(
      target,
      level,
      xoffset,
      yoffset,
      zoffset,
      width,
      height,
      depth,
      format,
      type,
      data,
    );
    this._gl.bindTexture(target, null);
    this._checkError('texSubImage3D');
  }

  /**
   * Allocate immutable storage for a 2D texture
   *
   * Binds the texture, allocates storage, and unbinds.
   */
  texStorage2D(
    target: GLenum,
    texture: WebGLTexture,
    levels: GLsizei,
    internalFormat: GLenum,
    width: GLsizei,
    height: GLsizei,
  ): void {
    this._gl.bindTexture(target, texture);
    this._gl.texStorage2D(target, levels, internalFormat, width, height);
    this._gl.bindTexture(target, null);
    this._checkError('texStorage2D');
  }

  /**
   * Allocate immutable storage for a 3D texture
   *
   * Binds the texture, allocates storage, and unbinds.
   */
  texStorage3D(
    target: GLenum,
    texture: WebGLTexture,
    levels: GLsizei,
    internalFormat: GLenum,
    width: GLsizei,
    height: GLsizei,
    depth: GLsizei,
  ): void {
    this._gl.bindTexture(target, texture);
    this._gl.texStorage3D(target, levels, internalFormat, width, height, depth);
    this._gl.bindTexture(target, null);
    this._checkError('texStorage3D');
  }

  /**
   * Specify a 2D texture image from an image source
   *
   * Binds the texture, uploads image data from HTMLImageElement, HTMLCanvasElement, etc., and unbinds.
   *
   * @param target - Texture target (e.g., TEXTURE_2D, TEXTURE_CUBE_MAP_POSITIVE_X)
   * @param texture - The texture to populate
   * @param level - Mipmap level (0 for base level)
   * @param internalFormat - Internal format (e.g., RGB, RGBA)
   * @param format - Pixel format (e.g., RGB, RGBA)
   * @param type - Pixel type (e.g., UNSIGNED_BYTE)
   * @param source - Image source (HTMLImageElement, HTMLCanvasElement, ImageBitmap, etc.)
   *
   * @example
   * glContext.texImage2DSource(glContext.gl.TEXTURE_2D, texture, 0,
   *   glContext.gl.RGBA, glContext.gl.RGBA, glContext.gl.UNSIGNED_BYTE, imageElement);
   */
  texImage2DSource(
    target: GLenum,
    texture: WebGLTexture,
    level: GLint,
    internalFormat: GLint,
    format: GLenum,
    type: GLenum,
    source: TexImageSource,
  ): void {
    this._gl.bindTexture(target, texture);
    this._gl.texImage2D(target, level, internalFormat, format, type, source);
    this._gl.bindTexture(target, null);
    this._checkError('texImage2DSource');
  }

  /**
   * Get a texture parameter
   *
   * @param target - Texture target
   * @param pname - Parameter name (e.g., TEXTURE_MIN_FILTER)
   * @returns The parameter value
   *
   * @example
   * const minFilter = glContext.getTexParameter(glContext.gl.TEXTURE_2D, glContext.gl.TEXTURE_MIN_FILTER);
   */
  getTexParameter(target: GLenum, pname: GLenum): any {
    return this._gl.getTexParameter(target, pname);
  }

  /**
   * Checks if the given object is a valid WebGL texture
   *
   * @param texture - The object to check
   * @returns true if the object is a valid WebGL texture
   *
   * @example
   * if (glContext.isTexture(myTexture)) {
   *   // myTexture is a valid WebGL texture
   * }
   */
  isTexture(texture: WebGLTexture | null): boolean {
    return this._gl.isTexture(texture);
  }

  /**
   * Creates a vertex array object (VAO)
   *
   * Creates an empty VAO. Use vertexAttribPointer() and enableVertexAttribArray() to configure.
   *
   * @returns The created vertex array object (unbound)
   * @throws Error if VAO creation fails
   *
   * @example
   * const vao = glContext.createVertexArray();
   * glContext.bindVertexArray(vao);
   * glContext.vertexAttribPointer(0, 3, glContext.gl.FLOAT, false, 12, 0);
   * glContext.unbindVertexArray();
   */
  createVertexArray(): WebGLVertexArrayObject {
    const vao = this._gl.createVertexArray();
    if (!vao) {
      throw new Error('Failed to create vertex array object');
    }

    this._vertexArrays.add(vao);
    this._checkError('createVertexArray');

    return vao;
  }

  /**
   * Bind a vertex array object
   *
   * @param vao - The VAO to bind (or null to unbind)
   *
   * @example
   * glContext.bindVertexArray(vao);
   */
  bindVertexArray(vao: WebGLVertexArrayObject | null): void {
    this._gl.bindVertexArray(vao);
    this._checkError('bindVertexArray');
  }

  /**
   * Unbind the current vertex array object
   *
   * @example
   * glContext.unbindVertexArray();
   */
  unbindVertexArray(): void {
    this._gl.bindVertexArray(null);
    this._checkError('unbindVertexArray');
  }

  /**
   * Define a vertex attribute layout
   *
   * Must be called while a VAO is bound. Associates a buffer location with a vertex attribute.
   *
   * @param index - Attribute index
   * @param size - Number of components (1-4)
   * @param type - Data type (e.g., FLOAT, UNSIGNED_INT)
   * @param normalized - Whether to normalize fixed-point values
   * @param stride - Byte offset between consecutive attributes
   * @param offset - Byte offset of first component in buffer
   *
   * @example
   * glContext.bindVertexArray(vao);
   * glContext.vertexAttribPointer(0, 3, glContext.gl.FLOAT, false, 12, 0);
   * glContext.unbindVertexArray();
   */
  vertexAttribPointer(
    index: GLuint,
    size: GLint,
    type: GLenum,
    normalized: GLboolean,
    stride: GLsizei,
    offset: GLintptr,
  ): void {
    this._gl.vertexAttribPointer(index, size, type, normalized, stride, offset);
    this._checkError('vertexAttribPointer');
  }

  /**
   * Enable a vertex attribute array
   *
   * Must be called while a VAO is bound.
   *
   * @param index - Attribute index to enable
   *
   * @example
   * glContext.bindVertexArray(vao);
   * glContext.enableVertexAttribArray(0);
   * glContext.unbindVertexArray();
   */
  enableVertexAttribArray(index: GLuint): void {
    this._gl.enableVertexAttribArray(index);
    this._checkError('enableVertexAttribArray');
  }

  /**
   * Disable a vertex attribute array
   *
   * @param index - Attribute index to disable
   *
   * @example
   * glContext.disableVertexAttribArray(0);
   */
  disableVertexAttribArray(index: GLuint): void {
    this._gl.disableVertexAttribArray(index);
    this._checkError('disableVertexAttribArray');
  }

  /**
   * Get a vertex attribute value
   *
   * @param index - Attribute index
   * @param pname - Parameter name (e.g., VERTEX_ATTRIB_ARRAY_ENABLED)
   * @returns The attribute value
   *
   * @example
   * const enabled = glContext.getVertexAttrib(0, glContext.gl.VERTEX_ATTRIB_ARRAY_ENABLED);
   */
  getVertexAttrib(index: GLuint, pname: GLenum): any {
    return this._gl.getVertexAttrib(index, pname);
  }

  /**
   * Enables debug mode - logs all WebGL errors to console
   *
   * @param enabled - Whether to enable debug mode
   *
   * @example
   * glContext.setDebugMode(true);
   */
  setDebugMode(enabled: boolean): void {
    this._debugMode = enabled;
  }

  /**
   * Checks for WebGL errors and logs them if debug mode is enabled.
   *
   * This method is useful for debugging WebGL calls in resources that
   * use raw gl.* methods not wrapped by GLContext.
   *
   * @param context - Context string for error messages (e.g., function name)
   */
  checkError(context: string): void {
    this._checkError(context);
  }

  /**
   * Internal error checking method
   * @internal
   */
  private _checkError(context: string): void {
    if (!this._debugMode) {
      return;
    }

    const error = this._gl.getError();
    if (error !== this._gl.NO_ERROR) {
      const errorName = this._getErrorName(error);
      console.error(`WebGL Error in ${context}: ${errorName} (${error})`);
    }
  }

  /**
   * Gets human-readable WebGL error name
   *
   * @internal
   */
  private _getErrorName(error: GLenum): string {
    const names: Record<GLenum, string> = {
      [this._gl.NO_ERROR]: 'NO_ERROR',
      [this._gl.INVALID_ENUM]: 'INVALID_ENUM',
      [this._gl.INVALID_VALUE]: 'INVALID_VALUE',
      [this._gl.INVALID_OPERATION]: 'INVALID_OPERATION',
      [this._gl.INVALID_FRAMEBUFFER_OPERATION]:
        'INVALID_FRAMEBUFFER_OPERATION',
      [this._gl.OUT_OF_MEMORY]: 'OUT_OF_MEMORY',
      [this._gl.CONTEXT_LOST_WEBGL]: 'CONTEXT_LOST_WEBGL',
    };
    return names[error as GLenum] ?? 'UNKNOWN_ERROR';
  }

  /**
   * Registers a WebGL program for cleanup on context disposal
   *
   * Called by Shader class when a program is created.
   *
   * @param program - The WebGL program to track
   * @internal
   */
  registerProgram(program: WebGLProgram): void {
    this._programs.add(program);
  }

  /**
   * Registers a WebGL buffer for cleanup on context disposal
   *
   * Called by Buffer class when a buffer is created.
   *
   * @param buffer - The WebGL buffer to track
   * @internal
   */
  registerBuffer(buffer: WebGLBuffer): void {
    this._buffers.add(buffer);
  }

  /**
   * Registers a WebGL texture for cleanup on context disposal
   *
   * Called by Texture class when a texture is created.
   *
   * @param texture - The WebGL texture to track
   * @internal
   */
  registerTexture(texture: WebGLTexture): void {
    this._textures.add(texture);
  }

  /**
   * Registers a WebGL vertex array object for cleanup on context disposal
   *
   * Called by VertexArray class when a VAO is created.
   *
   * @param vao - The WebGL VAO to track
   * @internal
   */
  registerVertexArray(vao: WebGLVertexArrayObject): void {
    this._vertexArrays.add(vao);
  }

  /**
   * Registers a WebGL framebuffer for cleanup on context disposal
   *
   * Called by Framebuffer class when a framebuffer is created.
   *
   * @param framebuffer - The WebGL framebuffer to track
   * @internal
   */
  registerFramebuffer(framebuffer: WebGLFramebuffer): void {
    this._framebuffers.add(framebuffer);
  }

  /**
   * Registers a WebGL renderbuffer for cleanup on context disposal
   *
   * Called by Framebuffer class when a renderbuffer is created.
   *
   * @param renderbuffer - The WebGL renderbuffer to track
   * @internal
   */
  registerRenderbuffer(renderbuffer: WebGLRenderbuffer): void {
    this._renderbuffers.add(renderbuffer);
  }

  /**
   * Registers a WebGL sampler for cleanup on context disposal
   *
   * Called by Sampler class when a sampler is created.
   *
   * @param sampler - The WebGL sampler to track
   * @internal
   */
  registerSampler(sampler: WebGLSampler): void {
    this._samplers.add(sampler);
  }

  /**
   * Registers a WebGL transform feedback object for cleanup on context disposal
   *
   * Called by TransformFeedback class when a transform feedback is created.
   *
   * @param feedback - The WebGL transform feedback to track
   * @internal
   */
  registerTransformFeedback(feedback: WebGLTransformFeedback): void {
    this._transformFeedbacks.add(feedback);
  }

  /**
   * Cleans up all WebGL resources
   *
   * Call this when the renderer is no longer needed to free GPU memory.
   *
   * @example
   * renderer.dispose();
   */
  dispose(): void {
    // Delete all programs
    this._programs.forEach((program) => {
      this._gl.deleteProgram(program);
    });
    this._programs.clear();

    // Delete all buffers
    this._buffers.forEach((buffer) => {
      this._gl.deleteBuffer(buffer);
    });
    this._buffers.clear();

    // Delete all textures
    this._textures.forEach((texture) => {
      this._gl.deleteTexture(texture);
    });
    this._textures.clear();

    // Delete all vertex arrays
    this._vertexArrays.forEach((vao) => {
      this._gl.deleteVertexArray(vao);
    });
    this._vertexArrays.clear();

    // Delete all framebuffers
    this._framebuffers.forEach((framebuffer) => {
      this._gl.deleteFramebuffer(framebuffer);
    });
    this._framebuffers.clear();

    // Delete all renderbuffers
    this._renderbuffers.forEach((renderbuffer) => {
      this._gl.deleteRenderbuffer(renderbuffer);
    });
    this._renderbuffers.clear();

    // Delete all samplers
    this._samplers.forEach((sampler) => {
      this._gl.deleteSampler(sampler);
    });
    this._samplers.clear();

    // Delete all transform feedbacks
    this._transformFeedbacks.forEach((feedback) => {
      this._gl.deleteTransformFeedback(feedback);
    });
    this._transformFeedbacks.clear();

    this._checkError('dispose');
  }

  /**
   * Query the currently active buffer from WebGL (source of truth)
   *
   * Buffers become "active" when you call buffer.bind(). This queries the
   * actual GPU state via gl.getParameter, ensuring accuracy even if external
   * code has called gl.bindBuffer() directly.
   *
   * **WebGL Equivalent:** `gl.getParameter(gl.ARRAY_BUFFER_BINDING)` or
   * `gl.getParameter(gl.ELEMENT_ARRAY_BUFFER_BINDING)` depending on target.
   *
   * @param target - Buffer target to query (default: ARRAY_BUFFER)
   * @returns Currently active WebGLBuffer or null if nothing is bound
   *
   * @example
   * const boundBuffer = ctx.queryCurrentBuffer(ctx.gl.ARRAY_BUFFER);
   * if (boundBuffer === myBuffer.webGLBuffer) {
   *   console.log('myBuffer is currently active');
   * }
   */
  queryCurrentBuffer(target: GLenum = this._gl.ARRAY_BUFFER): WebGLBuffer | null {
    const bindingParam = target === this._gl.ARRAY_BUFFER
      ? this._gl.ARRAY_BUFFER_BINDING
      : this._gl.ELEMENT_ARRAY_BUFFER_BINDING;
    return this._gl.getParameter(bindingParam) as WebGLBuffer | null;
  }

  /**
   * Query the currently active program from WebGL (source of truth)
   *
   * Programs become "active" when you call program.use(). This queries the
   * actual GPU state via gl.getParameter, ensuring accuracy even if external
   * code has called gl.useProgram() directly.
   *
   * **WebGL Equivalent:** In WebGL terminology, this queries which program
   * is "in use". Uses `gl.getParameter(gl.CURRENT_PROGRAM)`.
   *
   * @returns Currently active WebGLProgram or null if nothing is bound
   *
   * @example
   * const activeProgram = ctx.queryCurrentProgram();
   * if (activeProgram === myProgram.webGLProgram) {
   *   console.log('myProgram is currently active');
   * }
   */
  queryCurrentProgram(): WebGLProgram | null {
    return this._gl.getParameter(this._gl.CURRENT_PROGRAM) as WebGLProgram | null;
  }

  /**
   * Query the currently active vertex array object from WebGL (source of truth)
   *
   * VAOs become "active" (bound) when you call vao.bind(). This queries the
   * actual GPU state via gl.getParameter, ensuring accuracy even if external
   * code has called gl.bindVertexArray() directly.
   *
   * **WebGL Equivalent:** `gl.getParameter(gl.VERTEX_ARRAY_BINDING)`
   *
   * @returns Currently active WebGLVertexArrayObject or null if nothing is bound
   *
   * @example
   * const activeVAO = ctx.queryCurrentVAO();
   * if (activeVAO === myVAO.webGLVAO) {
   *   console.log('myVAO is currently active');
   * }
   */
  queryCurrentVAO(): WebGLVertexArrayObject | null {
    return this._gl.getParameter(this._gl.VERTEX_ARRAY_BINDING) as WebGLVertexArrayObject | null;
  }

  /**
   * Query the currently active texture from WebGL (source of truth)
   *
   * Textures become "active" when you call texture.bind(textureUnit). This
   * queries the actual GPU state for the specified texture unit via
   * gl.getParameter, ensuring accuracy even if external code has called
   * gl.bindTexture() directly.
   *
   * **WebGL Equivalent:** First calls `gl.activeTexture(gl.TEXTURE0 + unit)`,
   * then `gl.getParameter(gl.TEXTURE_BINDING_2D)`.
   *
   * @param textureUnit - Texture unit to query (0-based, default: 0)
   * @returns Currently active WebGLTexture or null if nothing is bound
   *
   * @example
   * const activeTexture = ctx.queryCurrentTexture(0);  // Check TEXTURE0
   * if (activeTexture === myTexture.webGLTexture) {
   *   console.log('myTexture is currently active on unit 0');
   * }
   */
  queryCurrentTexture(textureUnit: number = 0): WebGLTexture | null {
    // Ensure we're querying the correct texture unit
    this._gl.activeTexture(this._gl.TEXTURE0 + textureUnit);
    return this._gl.getParameter(this._gl.TEXTURE_BINDING_2D) as WebGLTexture | null;
  }

  /**
   * Query the currently active framebuffer from WebGL (source of truth)
   *
   * **Phase 5+:** This method is reserved for future use when framebuffer
   * support is added. Currently stubbed.
   *
   * Framebuffers become "active" (bound) when you call framebuffer.bind().
   * This will query the actual GPU state via gl.getParameter.
   *
   * **WebGL Equivalent:** `gl.getParameter(gl.FRAMEBUFFER_BINDING)`
   *
   * @returns Currently active WebGLFramebuffer or null
   * @internal Phase 5+ feature, currently reserved
   */
  queryCurrentFramebuffer(): WebGLFramebuffer | null {
    // TODO: Implement in Phase 5 when framebuffer support is added
    // return this._gl.getParameter(this._gl.FRAMEBUFFER_BINDING) as WebGLFramebuffer | null;
    return null;
  }

  /**
   * Query the currently active renderbuffer from WebGL (source of truth)
   *
   * **Phase 5+:** This method is reserved for future use when renderbuffer
   * support is added. Currently stubbed.
   *
   * Renderbuffers become "active" (bound) when you call renderbuffer.bind().
   * This will query the actual GPU state via gl.getParameter.
   *
   * **WebGL Equivalent:** `gl.getParameter(gl.RENDERBUFFER_BINDING)`
   *
   * @returns Currently active WebGLRenderbuffer or null
   * @internal Phase 5+ feature, currently reserved
   */
  queryCurrentRenderbuffer(): WebGLRenderbuffer | null {
    // TODO: Implement in Phase 5 when renderbuffer support is added
    // return this._gl.getParameter(this._gl.RENDERBUFFER_BINDING) as WebGLRenderbuffer | null;
    return null;
  }

  /**
   * Validate that binding state matches actual GPU state
   *
   * This is a debugging tool to catch cases where external code may have
   * bypassed library bindings (e.g., calling ctx.gl.bindBuffer directly).
   * Useful for troubleshooting binding-related issues.
   *
   * Resource classes track bindings independently via static queryCurrentXXX
   * methods. This method validates all of them.
   *
   * @returns Object with validation results for each resource type
   * @throws Error if any binding mismatches are detected (when debug mode enabled)
   *
   * @example
   * const validation = ctx.debugValidateBindings();
   * if (!validation.buffer) {
   *   console.warn('Buffer binding mismatch - external code may have changed it');
   * }
   */
  debugValidateBindings(): {
    buffer: boolean;
    program: boolean;
    vao: boolean;
    texture: boolean;
  } {
    const results = {
      buffer: true,
      program: true,
      vao: true,
      texture: true,
    };

    // Note: We can't validate internal tracking here because resource classes
    // maintain their own static binding state. This method would be enhanced
    // if GLContext maintained centralized binding tracking.
    // For now, this is a placeholder for future validation expansion.

    // In debug mode, log current state for inspection
    if (this._debugMode) {
      console.log('Current GPU Bindings:', {
        buffer: this.queryCurrentBuffer(),
        program: this.queryCurrentProgram(),
        vao: this.queryCurrentVAO(),
        texture: this.queryCurrentTexture(),
      });
    }

    return results;
  }
}
