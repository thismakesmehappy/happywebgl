/**
 * WebGL State Management Constants
 *
 * This file defines and categorizes all WebGL capabilities and state parameters
 * that WebGLState can manage. Constants are organized by type:
 *
 * - BINARY_CAPABILITIES: Simple on/off toggles (enable/disable)
 * - NON_BINARY_CAPABILITIES: Capabilities with associated parameter setters
 * - STATE_PARAMETERS: Functions that set WebGL state values
 *
 * These constants are validated against the actual WebGL context in tests
 * to ensure they stay in sync as WebGL specifications evolve.
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/API/WebGL2RenderingContext
 */

/**
 * Binary capabilities - simple enable/disable toggles
 *
 * These capabilities can only be turned on or off via gl.enable() and gl.disable().
 * They have no associated parameters.
 *
 * Examples:
 * - BLEND: Enable/disable color blending
 * - DEPTH_TEST: Enable/disable depth buffer comparisons
 * - CULL_FACE: Enable/disable face culling (note: has cullFace() parameter)
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/enable
 */
export const BINARY_CAPABILITIES = [
  'BLEND',
  'CULL_FACE', // Note: also has cullFace(mode) parameter
  'DEPTH_TEST',
  'DITHER',
  'POLYGON_OFFSET_FILL',
  'SAMPLE_ALPHA_TO_COVERAGE',
  'SAMPLE_COVERAGE',
  'SCISSOR_TEST',
  'STENCIL_TEST',
  'RASTERIZER_DISCARD',
  'PRIMITIVE_RESTART_FIXED_INDEX',
] as const;

/**
 * Non-binary capabilities - capabilities with associated parameter setters
 *
 * These are capabilities that, when enabled, have an associated function
 * that sets parameters for how they behave.
 *
 * Example:
 * - CULL_FACE: Enable via gl.enable(), configure via gl.cullFace(mode)
 *
 * Maps capability name to its associated setter function name.
 */
export const NON_BINARY_CAPABILITIES: Record<string, string> = {
  'CULL_FACE': 'cullFace',
  // Add more as needed
} as const;

/**
 * State parameters - functions that configure WebGL behavior
 *
 * These are WebGL functions that set state values. Unlike capabilities,
 * they don't enable/disable anything - they just set parameters.
 *
 * Examples:
 * - blendFunc(srcFactor, dstFactor): Set which blend factors to use
 * - depthFunc(func): Set depth comparison function
 * - scissor(x, y, width, height): Define scissor rectangle
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/API/WebGL2RenderingContext
 */
export const STATE_PARAMETERS = [
  // Blending
  'blendFunc',
  'blendFuncSeparate',
  'blendEquation',
  'blendEquationSeparate',
  'blendColor',

  // Color
  'clearColor',
  'colorMask',

  // Depth
  'clearDepth',
  'depthFunc',
  'depthMask',
  'depthRange',

  // Stencil
  'clearStencil',
  'stencilFunc',
  'stencilFuncSeparate',
  'stencilMask',
  'stencilMaskSeparate',
  'stencilOp',
  'stencilOpSeparate',

  // Viewport and scissor
  'scissor',
  'viewport',

  // Rendering
  'frontFace',
  'hint',
  'lineWidth',
  'polygonOffset',
  'pixelStorei',
] as const;

/**
 * Documentation links for capabilities and parameters
 *
 * Maps WebGL constant/function names to their MDN documentation.
 * Used in error messages to help users learn more about invalid values.
 */
export const DOCUMENTATION_LINKS: Record<string, string> = {
  // Capabilities
  'BLEND': 'https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/enable',
  'CULL_FACE': 'https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/enable',
  'DEPTH_TEST': 'https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/enable',
  'SCISSOR_TEST': 'https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/enable',
  'STENCIL_TEST': 'https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/enable',

  // Parameters
  'blendFunc': 'https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/blendFunc',
  'blendFuncSeparate': 'https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/blendFuncSeparate',
  'blendEquation': 'https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/blendEquation',
  'blendEquationSeparate': 'https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/blendEquationSeparate',
  'blendColor': 'https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/blendColor',
  'clearColor': 'https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/clearColor',
  'depthFunc': 'https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/depthFunc',
  'depthMask': 'https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/depthMask',
  'stencilFunc': 'https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/stencilFunc',
  'stencilOp': 'https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/stencilOp',
  'scissor': 'https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/scissor',
  'viewport': 'https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/viewport',
  'cullFace': 'https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/cullFace',
  'frontFace': 'https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/frontFace',
} as const;
