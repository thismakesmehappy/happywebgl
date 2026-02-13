/**
 * WebGLState - Comprehensive WebGL state management system
 *
 * This class provides a complete interface for managing WebGL state, including:
 * - Binary capabilities (enable/disable via gl.enable() and gl.disable())
 * - Non-binary capabilities (enable/disable + parameter configuration)
 * - State parameters (functions that set WebGL behavior values)
 * - State querying and tracking to prevent redundant operations
 *
 * Design Philosophy:
 * ─────────────────
 * This class follows the principle of "explicit is better than implicit":
 *
 * 1. **Never expose raw WebGL context for state changes**
 *    - All state mutations go through this class
 *    - Prevents hidden state changes that could cause bugs
 *    - Allows centralized state tracking and validation
 *
 * 2. **Provide both named helpers and generic escape hatches**
 *    - Named helpers: `setCullFaceBack()` - clear intent, discoverable
 *    - Escape hatches: `setParameter(name, ...args)` - covers 100% of WebGL
 *    - Balance between API completeness and usability
 *
 * 3. **Track all state changes internally**
 *    - Redundancy detection prevents unnecessary GPU calls
 *    - State queries available without calling WebGL
 *    - Easier debugging and understanding of current state
 *
 * Capabilities vs Parameters:
 * ──────────────────────────
 * WebGL state falls into two categories:
 *
 * **Binary Capabilities**: Simple on/off toggles
 *   - Controlled by: gl.enable(capability) / gl.disable(capability)
 *   - No parameters - just enabled or disabled
 *   - Examples: BLEND, DEPTH_TEST, CULL_FACE (on/off only)
 *   - Use: `state.enableBlend()`, `state.disableBlend()`
 *
 * **Non-Binary Capabilities**: On/off + parameter configuration
 *   - Controlled by: gl.enable() / gl.disable() PLUS a setter function
 *   - Example: CULL_FACE is enabled via enable(), configured via cullFace(mode)
 *   - The parameter value determines HOW the capability behaves
 *   - Use: `state.setCullFace('back')` enables it AND sets the mode
 *
 * **State Parameters**: Value-setting functions (not enable/disable)
 *   - Controlled by: Various setter functions like gl.blendFunc(), gl.depthFunc()
 *   - No enable/disable - they're always active once set
 *   - Set values that affect rendering behavior
 *   - Examples: blendFunc, depthFunc, scissor, viewport
 *   - Use: `state.setBlendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)`
 *
 * State Redundancy Detection:
 * ──────────────────────────
 * This class tracks what state was last set to avoid redundant GPU calls.
 * Example: Calling `state.enableBlend()` twice only calls gl.enable(BLEND) once.
 * This optimization reduces GPU overhead in tight render loops.
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/API/WebGL2RenderingContext
 * @see WebGLState.constants.ts for the complete list of capabilities and parameters
 */

import {
  BINARY_CAPABILITIES,
  NON_BINARY_CAPABILITIES,
  STATE_PARAMETERS,
} from './WebGLState.constants.js';
import { AppError } from '../errors/AppError.js';
import { ErrorCode } from '../errors/ErrorCodes.js';

/**
 * A snapshot of WebGLState at a point in time
 * Used by push/pop for state preservation
 */
interface StateSnapshot {
  capabilities: Map<string, boolean>;
  nonBinaryCapabilities: Map<string, GLenum>;
  parameters: Map<string, any[]>;
}

/**
 * Maximum depth of the state stack to prevent memory leaks
 * from unbalanced push/pop calls
 */
const MAX_STATE_STACK_DEPTH = 32;

export class WebGLState {
  /**
   * Underlying WebGL 2.0 context
   * @internal
   */
  private _gl: WebGL2RenderingContext;

  /**
   * Tracks enabled/disabled status of binary capabilities
   * Maps capability name to enabled status
   * @internal
   */
  private _enabledCapabilities: Map<string, boolean> = new Map();

  /**
   * Tracks the current value of non-binary capabilities
   * Maps capability name to its parameter value (as GLenum)
   * @internal
   */
  private _nonBinaryCapabilities: Map<string, GLenum> = new Map();

  /**
   * Tracks the current values of state parameters
   * Maps parameter name to its arguments (as any array)
   * Examples:
   *   - 'blendFunc': [gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA]
   *   - 'scissor': [0, 0, 800, 600]
   *   - 'depthFunc': [gl.LESS]
   * @internal
   */
  private _parameters: Map<string, any[]> = new Map();

  /**
   * Stack of saved state snapshots for push/pop functionality
   * @internal
   */
  private _stateStack: StateSnapshot[] = [];

  /**
   * Creates a new WebGLState manager
   *
   * @param gl - The WebGL 2.0 context to manage state for
   *
   * @example
   * const state = new WebGLState(glContext.gl);
   * state.enableBlend();
   * state.setBlendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
   */
  constructor(gl: WebGL2RenderingContext) {
    this._gl = gl;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Binary Capabilities: Simple on/off toggles
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Enables a binary capability
   *
   * Binary capabilities are simple toggles controlled by gl.enable().
   * This is the escape hatch for any binary capability that doesn't have
   * a named helper method.
   *
   * @param name - Capability name (e.g., 'BLEND', 'DEPTH_TEST', 'SCISSOR_TEST')
   *               Must be one of the BINARY_CAPABILITIES constants
   * @throws Error if capability name is invalid
   *
   * @see BINARY_CAPABILITIES for valid capability names
   *
   * @example
   * state.enableCapability('BLEND');
   * state.enableCapability('SCISSOR_TEST');
   */
  enableCapability(name: string): void {
    // Validate the capability name
    if (!BINARY_CAPABILITIES.includes(name as any)) {
      throw new AppError(ErrorCode.CORE_INVALID_ARG, {
        resource: 'WebGLState',
        method: 'enableCapability',
        detail: `Invalid binary capability: '${name}'. Must be one of: ${BINARY_CAPABILITIES.join(', ')}`,
      });
    }

    // Check if already enabled (redundancy detection)
    if (this._enabledCapabilities.get(name) === true) {
      return;
    }

    // Enable in WebGL and track state
    this._gl.enable(this._gl[name as keyof WebGL2RenderingContext] as GLenum);
    this._enabledCapabilities.set(name, true);
  }

  /**
   * Disables a binary capability
   *
   * Binary capabilities are simple toggles controlled by gl.disable().
   * This is the escape hatch for any binary capability that doesn't have
   * a named helper method.
   *
   * @param name - Capability name (e.g., 'BLEND', 'DEPTH_TEST', 'SCISSOR_TEST')
   *               Must be one of the BINARY_CAPABILITIES constants
   * @throws Error if capability name is invalid
   *
   * @see BINARY_CAPABILITIES for valid capability names
   *
   * @example
   * state.disableCapability('BLEND');
   * state.disableCapability('SCISSOR_TEST');
   */
  disableCapability(name: string): void {
    // Validate the capability name
    if (!BINARY_CAPABILITIES.includes(name as any)) {
      throw new AppError(ErrorCode.CORE_INVALID_ARG, {
        resource: 'WebGLState',
        method: 'disableCapability',
        detail: `Invalid binary capability: '${name}'. Must be one of: ${BINARY_CAPABILITIES.join(', ')}`,
      });
    }

    // Check if already disabled (redundancy detection)
    if (this._enabledCapabilities.get(name) === false) {
      return;
    }

    // Disable in WebGL and track state
    this._gl.disable(this._gl[name as keyof WebGL2RenderingContext] as GLenum);
    this._enabledCapabilities.set(name, false);
  }

  /**
   * Queries if a binary capability is currently enabled
   *
   * This checks the internal state tracking without calling WebGL,
   * so it's fast and doesn't require GPU access.
   *
   * @param name - Capability name to query
   * @returns True if enabled, false if disabled, undefined if never set
   *
   * @example
   * if (state.isCapabilityEnabled('BLEND')) {
   *   console.log('Blending is currently enabled');
   * }
   */
  isCapabilityEnabled(name: string): boolean | undefined {
    return this._enabledCapabilities.get(name);
  }

  // ───────────────────────────────────────────────────────────────────────────
  // Named helpers for binary capabilities (discoverable, intent-clear)
  // ───────────────────────────────────────────────────────────────────────────

  /**
   * Enables alpha blending
   *
   * Blending allows transparent objects to be rendered correctly over
   * opaque objects. When enabled, colors are blended according to the
   * blend function (set with setBlendFunc()).
   *
   * @example
   * state.enableBlend();
   * state.setBlendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
   * // Now transparent objects will blend correctly with the background
   *
   * @see setBlendFunc() to configure HOW blending occurs
   */
  enableBlend(): void {
    this.enableCapability('BLEND');
  }

  /**
   * Disables alpha blending
   *
   * When disabled, the alpha channel is ignored during rendering.
   * Fully opaque colors are written regardless of the alpha value.
   *
   * @example
   * state.disableBlend();
   * // Alpha channel is now ignored
   */
  disableBlend(): void {
    this.disableCapability('BLEND');
  }

  /**
   * Enables depth testing
   *
   * Depth testing is essential for correct 3D rendering. It ensures that
   * objects closer to the camera are drawn in front of objects further away.
   *
   * How it works:
   * 1. For each pixel, WebGL stores the depth (distance from camera)
   * 2. When drawing a new pixel, it compares the new depth to the stored depth
   * 3. The pixel is only drawn if it passes the depth test (e.g., is closer)
   * 4. The depth test function is set with setDepthFunc() (default: LESS)
   *
   * Without depth testing, triangles are drawn in the order they're submitted,
   * which can cause visual artifacts (like a distant object appearing in front
   * of a nearby object because it was drawn last).
   *
   * @example
   * state.enableDepthTest();
   * // Now 3D objects will have correct depth ordering
   *
   * @see setDepthFunc() to change the depth comparison function
   */
  enableDepthTest(): void {
    this.enableCapability('DEPTH_TEST');
  }

  /**
   * Disables depth testing
   *
   * When disabled, pixels are drawn in order, ignoring depth.
   * Useful for 2D UIs or special effects where you want to override
   * normal 3D depth ordering.
   *
   * @example
   * state.disableDepthTest();
   * // Pixels are now drawn in order, depth is ignored
   */
  disableDepthTest(): void {
    this.disableCapability('DEPTH_TEST');
  }

  /**
   * Enables face culling
   *
   * Face culling discards triangles that face away from the camera.
   * This is an optimization that prevents rendering hidden geometry,
   * and also prevents "backface flickering" on thin geometry.
   *
   * Most 3D models are closed meshes where you only see the front faces.
   * By culling back faces, you reduce GPU work by ~50%.
   *
   * Default Behavior:
   * ────────────────
   * When you enable face culling WITHOUT calling a cull mode setter, it defaults
   * to culling BACK faces (the most common case). This is per the WebGL specification.
   * So `enableCullFace()` alone is sufficient for the typical use case.
   *
   * To change which faces are culled, use the mode-specific methods:
   * - `setCullFaceBack()` - Cull back-facing triangles (default)
   * - `setCullFaceFront()` - Cull front-facing triangles (unusual, debugging)
   * - `setCullFaceFrontAndBack()` - Cull both sides (nothing visible)
   *
   * The mode-specific methods automatically enable culling, so you don't need
   * to call `enableCullFace()` first if you're using them.
   *
   * @example
   * // Most common: enable with default BACK culling
   * state.enableCullFace();
   * // Now back-facing triangles are culled (default behavior)
   *
   * @example
   * // If you need non-default culling modes, use the specific setters
   * state.setCullFaceFront();  // Automatically enables and sets to FRONT
   * state.setCullFaceBack();   // Automatically enables and sets to BACK
   *
   * @see setCullFaceBack() for explicit back-face culling
   * @see setCullFaceFront() for front-face culling
   * @see https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/cullFace
   */
  enableCullFace(): void {
    this.enableCapability('CULL_FACE');
  }

  /**
   * Disables face culling
   *
   * When disabled, all faces are rendered regardless of which way they face.
   * Useful for debugging geometry, or when you have special materials that
   * need to render both sides (like cloth that shows from both sides).
   *
   * @example
   * state.disableCullFace();
   * // Both front and back faces of triangles are now rendered
   */
  disableCullFace(): void {
    this.disableCapability('CULL_FACE');
  }

  /**
   * Enables scissor testing
   *
   * Scissor testing restricts rendering to a rectangular region of the canvas.
   * Any pixels outside this rectangle are discarded.
   *
   * This is useful for:
   * - Viewport separation (render different views in different areas)
   * - UI clipping (prevent UI from rendering outside its bounds)
   * - Performance optimization (only render relevant areas)
   *
   * @example
   * state.enableScissor();
   * state.setScissor(0, 0, 400, 300); // Only render top-left 400x300 area
   *
   * @see setScissor() to configure the scissor rectangle
   */
  enableScissor(): void {
    this.enableCapability('SCISSOR_TEST');
  }

  /**
   * Disables scissor testing
   *
   * When disabled, rendering is not restricted to any region.
   *
   * @example
   * state.disableScissor();
   * // Rendering now covers entire canvas again
   */
  disableScissor(): void {
    this.disableCapability('SCISSOR_TEST');
  }

  /**
   * Enables stencil testing
   *
   * Stencil testing uses a separate buffer (the stencil buffer) to control
   * which pixels are rendered. It's a powerful but complex feature.
   *
   * Common use cases:
   * - Mirror/reflection rendering
   * - Portals and portaling effects
   * - Complex clipping regions
   * - Outlined object effects
   *
   * Basic workflow:
   * 1. Render to stencil buffer with special rules (e.g., mark inside a region)
   * 2. Configure stencil test to only render where marked
   * 3. Render normal geometry - only visible where marked
   *
   * @example
   * state.enableStencil();
   * state.setStencilFunc(gl.EQUAL, 1, 0xff);
   * // Now only pixels matching the stencil buffer are rendered
   *
   * @see setStencilFunc() to configure the stencil test
   */
  enableStencil(): void {
    this.enableCapability('STENCIL_TEST');
  }

  /**
   * Disables stencil testing
   *
   * When disabled, stencil buffer values don't affect rendering.
   *
   * @example
   * state.disableStencil();
   * // Stencil testing is now disabled
   */
  disableStencil(): void {
    this.disableCapability('STENCIL_TEST');
  }

  /**
   * Enables polygon offset
   *
   * Polygon offset adds a small depth offset to rendered geometry.
   * This is useful for rendering coplanar geometry without fighting
   * (z-fighting is when two surfaces at the same depth flicker).
   *
   * Common use cases:
   * - Rendering outline over solid geometry
   * - Drawing wireframe over solid mesh
   * - UI elements on top of 3D scene
   *
   * The offset is configured with setPolygonOffset().
   *
   * @example
   * state.enablePolygonOffset();
   * state.setPolygonOffset(1.0, 1.0);
   * // Render solid geometry first (with polygon offset)
   * // Then render wireframe on top (without polygon offset)
   *
   * @see setPolygonOffset() to configure the offset amount
   */
  enablePolygonOffset(): void {
    this.enableCapability('POLYGON_OFFSET_FILL');
  }

  /**
   * Disables polygon offset
   *
   * When disabled, no depth offset is applied.
   *
   * @example
   * state.disablePolygonOffset();
   */
  disablePolygonOffset(): void {
    this.disableCapability('POLYGON_OFFSET_FILL');
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Non-Binary Capabilities: Enable/disable + parameter configuration
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Sets a non-binary capability to a specific value
   *
   * Non-binary capabilities are enabled/disabled AND have a parameter value
   * that controls HOW they behave. This is the escape hatch for setting any
   * non-binary capability that doesn't have a named helper.
   *
   * Currently only CULL_FACE is non-binary in WebGL 2.0, but this system
   * is designed to easily accommodate future additions.
   *
   * @param name - Capability name (e.g., 'CULL_FACE')
   * @param value - The parameter value (e.g., gl.BACK, gl.FRONT)
   * @throws Error if capability name is invalid
   *
   * @example
   * state.setCapability('CULL_FACE', gl.FRONT);
   * // Culls front-facing triangles instead of back-facing
   */
  setCapability(name: string, value: GLenum): void {
    // Validate the capability name
    if (!Object.prototype.hasOwnProperty.call(NON_BINARY_CAPABILITIES, name)) {
      throw new AppError(ErrorCode.CORE_INVALID_ARG, {
        resource: 'WebGLState',
        method: 'setCapability',
        detail: `Invalid non-binary capability: '${name}'. Must be one of: ${Object.keys(NON_BINARY_CAPABILITIES).join(', ')}`,
      });
    }

    // Check for redundancy (already set to this value)
    if (this._nonBinaryCapabilities.get(name) === value) {
      return;
    }

    // Enable the capability first if not already enabled
    if (this._enabledCapabilities.get(name) !== true) {
      this.enableCapability(name);
    }

    // Get the setter function name (e.g., 'CULL_FACE' -> 'cullFace')
    const setterName = NON_BINARY_CAPABILITIES[name];

    // Call the setter function with the value
    const setter = this._gl[setterName as keyof WebGL2RenderingContext] as
      | ((value: GLenum) => void)
      | undefined;

    if (!setter || typeof setter !== 'function') {
      throw new AppError(ErrorCode.CORE_STATE_ERROR, {
        resource: 'WebGLState',
        method: 'setCapability',
        detail: `Setter function '${setterName}' not found on WebGL context`,
      });
    }

    setter.call(this._gl, value);
    this._nonBinaryCapabilities.set(name, value);
  }

  /**
   * Gets the current value of a non-binary capability
   *
   * Returns the parameter value without calling WebGL,
   * using the internally tracked state.
   *
   * @param name - Capability name to query
   * @returns The parameter value (e.g., gl.BACK), or undefined if not set
   *
   * @example
   * const cullMode = state.getCapability('CULL_FACE');
   * if (cullMode === gl.BACK) {
   *   console.log('Back faces are being culled');
   * }
   */
  getCapability(name: string): GLenum | undefined {
    return this._nonBinaryCapabilities.get(name);
  }

  // ───────────────────────────────────────────────────────────────────────────
  // Named helpers for non-binary capabilities (discoverable, intent-clear)
  // ───────────────────────────────────────────────────────────────────────────

  /**
   * Sets face culling mode to cull back-facing triangles
   *
   * Back-facing triangles are those where the normal vector points away
   * from the camera. For closed meshes, these are always hidden,
   * so culling them is both an optimization and prevents artifacts.
   *
   * This is the most common culling mode and is suitable for:
   * - Regular 3D objects (characters, buildings, props)
   * - Any closed mesh geometry
   * - Performance-critical scenes
   *
   * @example
   * state.setCullFaceBack();
   * // Back-facing triangles are now culled (not rendered)
   */
  setCullFaceBack(): void {
    this.setCapability('CULL_FACE', this._gl.BACK);
  }

  /**
   * Sets face culling mode to cull front-facing triangles
   *
   * Front-facing triangles are those where the normal vector points toward
   * the camera. Culling them is unusual and mostly used for debugging,
   * or special effects.
   *
   * This is rarely used in normal rendering, but can be helpful for:
   * - Debugging geometry orientation
   * - Special effects (inverted rendering)
   * - Testing backface handling
   *
   * @example
   * state.setCullFaceFront();
   * // Front-facing triangles are now culled (back sides visible)
   */
  setCullFaceFront(): void {
    this.setCapability('CULL_FACE', this._gl.FRONT);
  }

  /**
   * Sets face culling mode to cull both front and back faces
   *
   * This culls all triangles, rendering nothing.
   * Not useful for normal rendering, but used for:
   * - Render-to-texture operations where you don't need visible output
   * - Stencil-only passes (write to stencil, don't write to color)
   * - Testing specific rendering passes
   *
   * @example
   * state.setCullFaceFrontAndBack();
   * // All geometry is now culled (nothing visible)
   */
  setCullFaceFrontAndBack(): void {
    this.setCapability('CULL_FACE', this._gl.FRONT_AND_BACK);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // State Parameters: Value-setting functions
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Sets a WebGL state parameter with generic escape hatch
   *
   * This allows setting ANY state parameter that doesn't have a named helper.
   * The arguments depend on which parameter you're setting.
   *
   * This is the complete escape hatch - it can set any WebGL parameter.
   *
   * @param name - Parameter function name (e.g., 'blendFunc', 'depthFunc')
   *               Must be one of the STATE_PARAMETERS constants
   * @param args - Arguments to pass to the parameter function
   * @throws Error if parameter name is invalid
   *
   * @example
   * // Set custom stencil function
   * state.setParameter('stencilFunc', gl.EQUAL, 0x01, 0xff);
   *
   * @see STATE_PARAMETERS for valid parameter names
   */
  setParameter(name: string, ...args: any[]): void {
    // Validate the parameter name
    if (!STATE_PARAMETERS.includes(name as any)) {
      throw new AppError(ErrorCode.CORE_INVALID_ARG, {
        resource: 'WebGLState',
        method: 'setParameter',
        detail: `Invalid state parameter: '${name}'. Must be one of: ${STATE_PARAMETERS.join(', ')}`,
      });
    }

    // Check for redundancy (already set with these exact arguments)
    const existingArgs = this._parameters.get(name);
    if (
      existingArgs &&
      existingArgs.length === args.length &&
      existingArgs.every((val, idx) => val === args[idx])
    ) {
      return;
    }

    // Get the function from WebGL context
    const fn = this._gl[name as keyof WebGL2RenderingContext] as
      | ((...args: any[]) => void)
      | undefined;

    if (!fn || typeof fn !== 'function') {
      throw new AppError(ErrorCode.CORE_STATE_ERROR, {
        resource: 'WebGLState',
        method: 'setParameter',
        detail: `Parameter function '${name}' not found on WebGL context`,
      });
    }

    // Call the function with provided arguments
    fn.apply(this._gl, args);

    // Track the parameter and its arguments
    this._parameters.set(name, args);
  }

  /**
   * Gets the currently set values for a state parameter
   *
   * Returns the arguments that were last passed to the parameter function,
   * without calling WebGL. This requires the state to have been set through
   * this WebGLState object.
   *
   * @param name - Parameter name to query
   * @returns Array of arguments, or undefined if not set through this object
   *
   * @example
   * state.setScissor(0, 0, 400, 300);
   * const scissorArgs = state.getParameter('scissor');
   * console.log(scissorArgs); // [0, 0, 400, 300]
   */
  getParameter(name: string): any[] | undefined {
    return this._parameters.get(name);
  }

  // ───────────────────────────────────────────────────────────────────────────
  // Named helpers for state parameters (discoverable, intent-clear)
  // ───────────────────────────────────────────────────────────────────────────

  /**
   * Sets the blend function for alpha blending
   *
   * The blend function controls HOW colors are combined during blending.
   * It uses source factor (how much of the new color) and destination factor
   * (how much of the existing color).
   *
   * Standard alpha blending formula:
   *   result = (new × srcFactor) + (existing × dstFactor)
   *
   * Most common configuration for transparency:
   *   setBlendFunc(SRC_ALPHA, ONE_MINUS_SRC_ALPHA)
   *   result = (new × newAlpha) + (existing × (1 - newAlpha))
   *
   * This means: the new color's alpha controls how much it shows through
   * (fully opaque alpha = new color shows fully, zero alpha = color disappears).
   *
   * @param srcFactor - Source factor (e.g., gl.SRC_ALPHA)
   * @param dstFactor - Destination factor (e.g., gl.ONE_MINUS_SRC_ALPHA)
   *
   * @example
   * // Standard transparency
   * state.setBlendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
   *
   * @example
   * // Additive blending (for lights, fire)
   * state.setBlendFunc(gl.SRC_ALPHA, gl.ONE);
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/blendFunc
   */
  setBlendFunc(srcFactor: GLenum, dstFactor: GLenum): void {
    this.setParameter('blendFunc', srcFactor, dstFactor);
  }

  /**
   * Sets separate blend functions for RGB and alpha
   *
   * This allows different blending for color and alpha channels.
   *
   * @param srcRGB - Source factor for RGB
   * @param dstRGB - Destination factor for RGB
   * @param srcAlpha - Source factor for alpha
   * @param dstAlpha - Destination factor for alpha
   *
   * @example
   * // Premultiplied alpha (common for textures)
   * state.setBlendFuncSeparate(gl.ONE, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/blendFuncSeparate
   */
  setBlendFuncSeparate(
    srcRGB: GLenum,
    dstRGB: GLenum,
    srcAlpha: GLenum,
    dstAlpha: GLenum,
  ): void {
    this.setParameter('blendFuncSeparate', srcRGB, dstRGB, srcAlpha, dstAlpha);
  }

  /**
   * Sets the blend equation
   *
   * The blend equation controls the mathematical operation used to combine
   * the source and destination colors.
   *
   * Common modes:
   * - ADD (default): Combines colors additively
   * - SUBTRACT: Subtracts source from destination
   * - REVERSE_SUBTRACT: Subtracts destination from source
   *
   * Combined with blend factors for flexible color combining.
   *
   * @param equation - The blend equation (e.g., gl.FUNC_ADD)
   *
   * @example
   * state.setBlendEquation(gl.FUNC_ADD);
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/blendEquation
   */
  setBlendEquation(equation: GLenum): void {
    this.setParameter('blendEquation', equation);
  }

  /**
   * Sets separate blend equations for RGB and alpha
   *
   * @param modeRGB - Blend equation for RGB
   * @param modeAlpha - Blend equation for alpha
   *
   * @example
   * state.setBlendEquationSeparate(gl.FUNC_ADD, gl.FUNC_ADD);
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/blendEquationSeparate
   */
  setBlendEquationSeparate(modeRGB: GLenum, modeAlpha: GLenum): void {
    this.setParameter('blendEquationSeparate', modeRGB, modeAlpha);
  }

  /**
   * Sets the blend color
   *
   * The blend color is a constant color used in blend operations.
   * When a blend factor uses CONSTANT_COLOR or CONSTANT_ALPHA,
   * this color value is used.
   *
   * @param r - Red component (0-1)
   * @param g - Green component (0-1)
   * @param b - Blue component (0-1)
   * @param a - Alpha component (0-1)
   *
   * @example
   * state.setBlendColor(1.0, 0.0, 0.0, 0.5); // Semi-transparent red
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/blendColor
   */
  setBlendColor(r: number, g: number, b: number, a: number): void {
    this.setParameter('blendColor', r, g, b, a);
  }

  /**
   * Sets the depth comparison function
   *
   * The depth function determines how the depth test compares the new pixel's
   * depth with the existing depth in the depth buffer.
   *
   * Common modes:
   * - LESS (default): Pixel closer than existing depth → pass (use this usually)
   * - LEQUAL: Pixel closer or equal → pass
   * - GREATER: Pixel further than existing → pass (inverted, unusual)
   * - ALWAYS: Always pass (disables depth testing)
   * - NEVER: Never pass (nothing visible)
   *
   * For normal 3D rendering, use LESS: pixels that are closer to the camera
   * appear in front of pixels that are further away.
   *
   * @param func - The comparison function (e.g., gl.LESS)
   *
   * @example
   * state.setDepthFunc(gl.LESS); // Normal depth ordering
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/depthFunc
   */
  setDepthFunc(func: GLenum): void {
    this.setParameter('depthFunc', func);
  }

  /**
   * Sets whether depth values can be written to the depth buffer
   *
   * When depth writes are enabled, rendered pixels update the depth buffer.
   * When disabled, pixels don't change the depth buffer (but still fail the
   * depth test if they're behind existing pixels).
   *
   * Use cases for disabling depth writes:
   * - Rendering transparent objects (don't block what's behind them)
   * - Sky domes (shouldn't occlude other objects)
   * - UI overlays (for layering)
   *
   * @param enabled - Whether to enable depth writes
   *
   * @example
   * state.setDepthMask(true);  // Pixels update the depth buffer
   * state.setDepthMask(false); // Pixels don't update depth buffer
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/depthMask
   */
  setDepthMask(enabled: boolean): void {
    this.setParameter('depthMask', enabled);
  }

  /**
   * Sets the depth range
   *
   * Maps normalized depth values (-1 to 1 in WebGL) to depth buffer values.
   * Typically you don't need to change this, but it's useful for:
   * - Adjusting precision in specific depth ranges
   * - Custom depth mapping for special effects
   *
   * @param near - Near depth value (usually 0.0)
   * @param far - Far depth value (usually 1.0)
   *
   * @example
   * state.setDepthRange(0.0, 1.0); // Default
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/depthRange
   */
  setDepthRange(near: number, far: number): void {
    this.setParameter('depthRange', near, far);
  }

  /**
   * Sets the scissor rectangle
   *
   * Scissor testing restricts rendering to a rectangular region.
   * Only pixels within this rectangle can be rendered (others are discarded).
   *
   * Commonly used for:
   * - Split-screen rendering
   * - UI viewport clipping
   * - Performance optimization (only render relevant areas)
   *
   * @param x - Left edge of scissor rectangle in pixels
   * @param y - Bottom edge of scissor rectangle in pixels
   * @param width - Width of scissor rectangle
   * @param height - Height of scissor rectangle
   *
   * @example
   * state.setScissor(0, 0, 400, 300); // Render to top-left 400x300 area
   *
   * @note Scissor coordinates use origin at bottom-left (WebGL convention)
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/scissor
   */
  setScissor(x: number, y: number, width: number, height: number): void {
    this.setParameter('scissor', x, y, width, height);
  }

  /**
   * Sets the viewport rectangle
   *
   * The viewport controls which region of the canvas the rendering appears in.
   * This is different from scissor: scissor clips rendering, viewport scales it.
   *
   * When you resize the canvas, you should update the viewport to match.
   *
   * @param x - Left edge of viewport in pixels
   * @param y - Bottom edge of viewport in pixels
   * @param width - Width of viewport
   * @param height - Height of viewport
   *
   * @example
   * state.setViewport(0, 0, canvas.width, canvas.height); // Full canvas
   *
   * @note Viewport coordinates use origin at bottom-left (WebGL convention)
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/viewport
   */
  setViewport(x: number, y: number, width: number, height: number): void {
    this.setParameter('viewport', x, y, width, height);
  }

  /**
   * Sets the front face winding order
   *
   * Winding order determines which way is "front" on triangles.
   * WebGL uses the right-hand rule: if your finger curl in the direction of
   * vertex ordering, your thumb points in the normal direction.
   *
   * Common modes:
   * - CCW (counter-clockwise, default): Front face is when vertices go counter-clockwise
   * - CW (clockwise): Front face is when vertices go clockwise
   *
   * Most models use CCW (the default). Change this if your model normals
   * are pointing inward instead of outward.
   *
   * @param mode - The winding order (e.g., gl.CCW, gl.CW)
   *
   * @example
   * state.setFrontFace(gl.CCW); // Standard counter-clockwise
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/frontFace
   */
  setFrontFace(mode: GLenum): void {
    this.setParameter('frontFace', mode);
  }

  /**
   * Sets line width for line rendering
   *
   * Controls the width of lines drawn with gl.LINES or gl.LINE_STRIP.
   * Most WebGL implementations support widths from 0.0 to ~10.0 (varies by device).
   *
   * @param width - Line width in pixels (default 1.0)
   *
   * @example
   * state.setLineWidth(2.0); // Draw thicker lines
   *
   * @note Line width > 1 has limited support on some platforms
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/lineWidth
   */
  setLineWidth(width: number): void {
    this.setParameter('lineWidth', width);
  }

  /**
   * Sets polygon offset for fighting prevention
   *
   * Polygon offset adds a small offset to the depth of geometry.
   * This prevents z-fighting (flickering) when rendering coplanar surfaces.
   *
   * Common use cases:
   * - Outline + solid geometry (outline rendered with offset on top)
   * - Wireframe over solid
   * - UI on top of 3D scene
   *
   * Formula: offset = (m × slopeFactor) + (r × unitFactor)
   *   where m is the change in depth, r is the smallest representable depth difference
   *
   * @param slopeFactor - Scale factor for depth slope (usually 1.0)
   * @param unitFactor - Scale factor for unit depth difference (usually 1.0)
   *
   * @example
   * state.enablePolygonOffset();
   * state.setPolygonOffset(1.0, 1.0);
   * // Render solid geometry with offset
   * state.disablePolygonOffset();
   * // Render wireframe or outline on top
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/polygonOffset
   */
  setPolygonOffset(slopeFactor: number, unitFactor: number): void {
    this.setParameter('polygonOffset', slopeFactor, unitFactor);
  }

  /**
   * Sets the stencil function
   *
   * The stencil function determines how the stencil test compares a reference
   * value with the stencil buffer value.
   *
   * Common modes:
   * - ALWAYS: Always pass stencil test (writes to buffer based on stencilOp)
   * - EQUAL: Pass if stencil buffer == reference value
   * - NOTEQUAL: Pass if stencil buffer != reference value
   * - LESS/GREATER: Compare stencil buffer against reference
   *
   * Basic workflow:
   * 1. setStencilFunc(ALWAYS, 1, 0xff) - always pass, write 1 to buffer
   * 2. Render geometry that marks stencil buffer
   * 3. setStencilFunc(EQUAL, 1, 0xff) - only pass where buffer == 1
   * 4. Render final geometry
   *
   * @param func - The comparison function (e.g., gl.ALWAYS)
   * @param ref - Reference value (compared against stencil buffer)
   * @param mask - Mask for bitwise AND with both reference and buffer value
   *
   * @example
   * state.setStencilFunc(gl.ALWAYS, 1, 0xff);
   *
   * @see setStencilOp() to configure what happens on pass/fail
   * @see https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/stencilFunc
   */
  setStencilFunc(func: GLenum, ref: number, mask: number): void {
    this.setParameter('stencilFunc', func, ref, mask);
  }

  /**
   * Sets the stencil operation
   *
   * The stencil operation determines what happens to the stencil buffer value
   * when the stencil test passes or fails.
   *
   * Operations available:
   * - KEEP: Don't change stencil value
   * - ZERO: Set to 0
   * - REPLACE: Set to reference value
   * - INCR/DECR: Increment or decrement (wraps)
   * - INVERT: Bitwise NOT
   *
   * Parameters:
   * - fail: What to do if stencil test fails
   * - zfail: What to do if stencil passes but depth test fails
   * - zpass: What to do if both tests pass
   *
   * Typical stencil writing (mark regions):
   *   setStencilOp(KEEP, KEEP, REPLACE)
   *   - If stencil passes and depth passes → replace buffer with ref value
   *
   * Typical stencil testing (render where marked):
   *   setStencilOp(KEEP, KEEP, KEEP)
   *   - Don't change buffer, just test against it
   *
   * @param fail - Operation if stencil test fails
   * @param zfail - Operation if stencil passes but depth fails
   * @param zpass - Operation if both tests pass
   *
   * @example
   * // Write reference value to stencil buffer on pass
   * state.setStencilOp(gl.KEEP, gl.KEEP, gl.REPLACE);
   *
   * @see setStencilFunc() to configure the test
   * @see https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/stencilOp
   */
  setStencilOp(fail: GLenum, zfail: GLenum, zpass: GLenum): void {
    this.setParameter('stencilOp', fail, zfail, zpass);
  }

  /**
   * Sets which bits of the stencil buffer can be written
   *
   * The stencil write mask controls which bits of the stencil buffer can be
   * modified when writing. Bits that are 0 in the mask cannot be changed.
   *
   * @param mask - Bitmask for write (0xFF = all bits can be written, 0x00 = no bits)
   *
   * @example
   * state.setStencilMask(0xFF); // All bits can be written
   * state.setStencilMask(0x0F); // Only lower 4 bits can be written
   * state.setStencilMask(0x00); // No bits can be written (read-only)
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/stencilMask
   */
  setStencilMask(mask: number): void {
    this.setParameter('stencilMask', mask);
  }

  /**
   * Clears the depth buffer to a specific value
   *
   * The depth buffer is typically cleared before each frame to reset
   * depth values. The clear value is usually 1.0 (far plane).
   *
   * @param depth - The value to clear the depth buffer to (usually 1.0)
   *
   * @example
   * state.setClearDepth(1.0); // Clear to far plane
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/clearDepth
   */
  setClearDepth(depth: number): void {
    this.setParameter('clearDepth', depth);
  }

  /**
   * Clears the stencil buffer to a specific value
   *
   * The stencil buffer is typically cleared before each frame or before
   * a new stencil operation sequence.
   *
   * @param value - The value to clear the stencil buffer to (usually 0)
   *
   * @example
   * state.setClearStencil(0); // Clear to 0
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/clearStencil
   */
  setClearStencil(value: number): void {
    this.setParameter('clearStencil', value);
  }

  /**
   * Sets which color channels can be written to the framebuffer
   *
   * The color mask controls which channels (red, green, blue, alpha) can be
   * written to the framebuffer. Masked-out channels are not modified.
   *
   * Common use cases:
   * - Render to only specific channels
   * - Render to RGB but not alpha (for compositing)
   * - Debugging (e.g., render only red channel)
   *
   * @param r - Whether red channel can be written
   * @param g - Whether green channel can be written
   * @param b - Whether blue channel can be written
   * @param a - Whether alpha channel can be written
   *
   * @example
   * state.setColorMask(true, true, true, true);   // Write all channels
   * state.setColorMask(true, true, true, false);  // Don't write alpha
   * state.setColorMask(false, false, false, true); // Only write alpha
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/colorMask
   */
  setColorMask(r: boolean, g: boolean, b: boolean, a: boolean): void {
    this.setParameter('colorMask', r, g, b, a);
  }

  /**
   * Sets hint for implementation-specific behavior
   *
   * Hints allow you to request how WebGL should handle certain operations.
   * The implementation may or may not honor your hint.
   *
   * Common hints:
   * - FRAGMENT_SHADER_DERIVATIVE_HINT: How to compute dFdx/dFdy in shaders
   * - GENERATE_MIPMAP_HINT: How to generate mipmaps
   *
   * @param target - Which operation to hint about (e.g., FRAGMENT_SHADER_DERIVATIVE_HINT)
   * @param mode - The hint mode (FASTEST, NICEST, DONT_CARE)
   *
   * @example
   * state.setHint(gl.FRAGMENT_SHADER_DERIVATIVE_HINT, gl.FASTEST);
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/hint
   */
  setHint(target: GLenum, mode: GLenum): void {
    this.setParameter('hint', target, mode);
  }

  /**
   * Sets pixel storage parameters for texture/image operations
   *
   * Pixel storage parameters control how pixel data is unpacked when
   * uploading textures or packed when reading pixels.
   *
   * Common parameters:
   * - UNPACK_ALIGNMENT: Alignment of pixel rows in memory (1, 2, 4, or 8)
   * - UNPACK_FLIP_Y_WEBGL: Flip Y axis when uploading
   * - UNPACK_PREMULTIPLY_ALPHA_WEBGL: Premultiply alpha when uploading
   *
   * @param pname - The pixel storage parameter
   * @param param - The value to set
   *
   * @example
   * state.setPixelStorei(gl.UNPACK_ALIGNMENT, 1); // Tight packing
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/pixelStorei
   */
  setPixelStorei(pname: GLenum, param: number | boolean): void {
    this.setParameter('pixelStorei', pname, param);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // State Stack: Push/Pop for Temporary State Changes
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Pushes the current state onto the stack
   *
   * This saves a snapshot of all tracked state (capabilities, parameters)
   * so it can be restored later with `pop()`. Useful for:
   * - Temporary render passes with different settings
   * - UI overlays that need different state
   * - Debug visualizations
   * - Post-processing effects
   *
   * The stack has a maximum depth of 32 to catch unbalanced push/pop calls.
   *
   * @throws AppError if the stack depth exceeds MAX_STATE_STACK_DEPTH
   *
   * @example
   * // Save current state
   * state.push();
   *
   * // Modify state for overlay
   * state.disableDepthTest();
   * state.enableBlend();
   * state.setBlendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
   *
   * // Render overlay...
   *
   * // Restore previous state
   * state.pop();
   *
   * @see pop() to restore the saved state
   * @see scoped() for automatic push/pop with a callback
   */
  push(): void {
    if (this._stateStack.length >= MAX_STATE_STACK_DEPTH) {
      throw new AppError(ErrorCode.CORE_STATE_ERROR, {
        resource: 'WebGLState',
        method: 'push',
        detail: `State stack overflow: maximum depth of ${MAX_STATE_STACK_DEPTH} exceeded. Check for unbalanced push/pop calls.`,
      });
    }

    // Deep copy the current state
    const snapshot: StateSnapshot = {
      capabilities: new Map(this._enabledCapabilities),
      nonBinaryCapabilities: new Map(this._nonBinaryCapabilities),
      parameters: new Map(
        Array.from(this._parameters.entries()).map(([key, args]) => [
          key,
          [...args], // Copy the args array
        ]),
      ),
    };

    this._stateStack.push(snapshot);
  }

  /**
   * Pops the most recently pushed state and restores it
   *
   * This restores all tracked state (capabilities, parameters) to what
   * they were when `push()` was last called. State that was changed
   * between push and pop will be reset.
   *
   * @throws AppError if the stack is empty (no matching push)
   *
   * @example
   * state.push();
   * state.disableDepthTest();
   * // ... render with depth test disabled ...
   * state.pop(); // Depth test is restored to previous value
   *
   * @see push() to save state to the stack
   * @see scoped() for automatic push/pop with a callback
   */
  pop(): void {
    const snapshot = this._stateStack.pop();
    if (!snapshot) {
      throw new AppError(ErrorCode.CORE_STATE_ERROR, {
        resource: 'WebGLState',
        method: 'pop',
        detail: 'State stack underflow: pop() called without matching push().',
      });
    }

    this._restoreSnapshot(snapshot);
  }

  /**
   * Executes a callback with temporary state, automatically restoring afterward
   *
   * This is a convenience wrapper around push/pop that ensures state is
   * always restored, even if the callback throws an exception.
   *
   * @param fn - The callback to execute with temporary state
   * @returns The return value of the callback
   *
   * @example
   * // Render UI with temporary state
   * state.scoped(() => {
   *   state.disableDepthTest();
   *   state.enableBlend();
   *   renderUI();
   * }); // State automatically restored here
   *
   * @example
   * // Get a value while using temporary state
   * const result = state.scoped(() => {
   *   state.setViewport(0, 0, 100, 100);
   *   return renderThumbnail();
   * });
   */
  scoped<T>(fn: () => T): T {
    this.push();
    try {
      return fn();
    } finally {
      this.pop();
    }
  }

  /**
   * Returns the current depth of the state stack
   *
   * Useful for debugging unbalanced push/pop calls.
   *
   * @returns The number of saved states on the stack
   *
   * @example
   * console.log(state.stackDepth); // 0
   * state.push();
   * console.log(state.stackDepth); // 1
   * state.push();
   * console.log(state.stackDepth); // 2
   * state.pop();
   * console.log(state.stackDepth); // 1
   */
  get stackDepth(): number {
    return this._stateStack.length;
  }

  /**
   * Restores state from a snapshot
   * @internal
   */
  private _restoreSnapshot(snapshot: StateSnapshot): void {
    // Restore binary capabilities
    // First, disable capabilities that were not in the snapshot
    for (const [name, enabled] of this._enabledCapabilities) {
      const wasEnabled = snapshot.capabilities.get(name);
      if (wasEnabled === undefined) {
        // This capability wasn't tracked before - disable it
        if (enabled) {
          this._gl.disable(
            this._gl[name as keyof WebGL2RenderingContext] as GLenum,
          );
          this._enabledCapabilities.set(name, false);
        }
      }
    }

    // Then restore all capabilities from snapshot
    for (const [name, wasEnabled] of snapshot.capabilities) {
      const isEnabled = this._enabledCapabilities.get(name);
      if (isEnabled !== wasEnabled) {
        if (wasEnabled) {
          this._gl.enable(
            this._gl[name as keyof WebGL2RenderingContext] as GLenum,
          );
        } else {
          this._gl.disable(
            this._gl[name as keyof WebGL2RenderingContext] as GLenum,
          );
        }
        this._enabledCapabilities.set(name, wasEnabled);
      }
    }

    // Restore non-binary capabilities
    for (const [name, value] of snapshot.nonBinaryCapabilities) {
      const currentValue = this._nonBinaryCapabilities.get(name);
      if (currentValue !== value) {
        const setterName = NON_BINARY_CAPABILITIES[name];
        const setter = this._gl[setterName as keyof WebGL2RenderingContext] as (
          value: GLenum,
        ) => void;
        if (setter && typeof setter === 'function') {
          setter.call(this._gl, value);
        }
        this._nonBinaryCapabilities.set(name, value);
      }
    }

    // Restore parameters
    for (const [name, args] of snapshot.parameters) {
      const currentArgs = this._parameters.get(name);
      const argsMatch =
        currentArgs &&
        currentArgs.length === args.length &&
        currentArgs.every((val, idx) => val === args[idx]);

      if (!argsMatch) {
        const fn = this._gl[name as keyof WebGL2RenderingContext] as (
          ...args: any[]
        ) => void;
        if (fn && typeof fn === 'function') {
          fn.apply(this._gl, args);
        }
        this._parameters.set(name, args);
      }
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // State Query and Debugging
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Gets a summary of the currently managed state
   *
   * Useful for debugging and understanding what state is currently active.
   * This is a snapshot of the internally tracked state (doesn't query WebGL).
   *
   * @returns Object with three properties:
   *   - capabilities: Map of enabled/disabled binary capabilities
   *   - nonBinaryCapabilities: Map of non-binary capability values
   *   - parameters: Map of set parameters with their arguments
   *
   * @example
   * const state = glState.getStateSnapshot();
   * console.log('Enabled capabilities:', state.capabilities);
   * console.log('Currently set parameters:', state.parameters);
   */
  getStateSnapshot(): {
    capabilities: Map<string, boolean>;
    nonBinaryCapabilities: Map<string, GLenum>;
    parameters: Map<string, any[]>;
  } {
    return {
      capabilities: new Map(this._enabledCapabilities),
      nonBinaryCapabilities: new Map(this._nonBinaryCapabilities),
      parameters: new Map(this._parameters),
    };
  }
}
