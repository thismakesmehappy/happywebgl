import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { WebGLState } from '../../src/core/WebGLState.js';

/**
 * Test suite for WebGLState
 *
 * Tests comprehensive WebGL state management including:
 * - Binary capabilities (enable/disable toggles)
 * - Non-binary capabilities (enable/disable + parameter configuration)
 * - State parameters (value-setting functions)
 * - State querying and redundancy detection
 * - Named helper methods vs generic escape hatches
 * - Error handling and validation
 */

describe('WebGLState', () => {
  let mockGL: Partial<WebGL2RenderingContext>;

  beforeEach(() => {
    // Create comprehensive mock WebGL context
    mockGL = {
      // Error constants
      NO_ERROR: 0,
      INVALID_ENUM: 0x0500,
      INVALID_VALUE: 0x0501,
      INVALID_OPERATION: 0x0502,

      // Binary capability constants
      BLEND: 0x0be2,
      DEPTH_TEST: 0x0b71,
      CULL_FACE: 0x0b44,
      DITHER: 0x0bd0,
      POLYGON_OFFSET_FILL: 0x8037,
      SAMPLE_ALPHA_TO_COVERAGE: 0x809e,
      SAMPLE_COVERAGE: 0x80a0,
      SCISSOR_TEST: 0x0c11,
      STENCIL_TEST: 0x0b90,
      RASTERIZER_DISCARD: 0x8c89,
      PRIMITIVE_RESTART_FIXED_INDEX: 0x8d69,

      // Non-binary capability constants
      FRONT: 0x0404,
      BACK: 0x0405,
      FRONT_AND_BACK: 0x0408,

      // Depth test modes
      NEVER: 0x0200,
      LESS: 0x0201,
      EQUAL: 0x0202,
      LEQUAL: 0x0203,
      GREATER: 0x0204,
      NOTEQUAL: 0x0205,
      GEQUAL: 0x0206,
      ALWAYS: 0x0207,

      // Winding order
      CW: 0x0900,
      CCW: 0x0901,

      // Blend factors
      ZERO: 0x0,
      ONE: 0x1,
      SRC_COLOR: 0x0300,
      ONE_MINUS_SRC_COLOR: 0x0301,
      SRC_ALPHA: 0x0302,
      ONE_MINUS_SRC_ALPHA: 0x0303,
      DST_ALPHA: 0x0304,
      ONE_MINUS_DST_ALPHA: 0x0305,
      DST_COLOR: 0x0306,
      ONE_MINUS_DST_COLOR: 0x0307,
      CONSTANT_COLOR: 0x8001,
      ONE_MINUS_CONSTANT_COLOR: 0x8002,
      CONSTANT_ALPHA: 0x8003,
      ONE_MINUS_CONSTANT_ALPHA: 0x8004,

      // Blend equations
      FUNC_ADD: 0x8006,
      FUNC_SUBTRACT: 0x800a,
      FUNC_REVERSE_SUBTRACT: 0x800b,

      // Stencil operations
      KEEP: 0x1e00,
      REPLACE: 0x1e01,
      INCR: 0x1e02,
      INCR_WRAP: 0x8507,
      DECR: 0x1e03,
      DECR_WRAP: 0x8508,
      INVERT: 0x150a,

      // Hint targets
      FRAGMENT_SHADER_DERIVATIVE_HINT: 0x8b8b,
      GENERATE_MIPMAP_HINT: 0x8192,

      // Hint modes
      FASTEST: 0x1101,
      NICEST: 0x1102,
      DONT_CARE: 0x1100,

      // Pixel storage parameters
      UNPACK_ALIGNMENT: 0x0cf5,
      PACK_ALIGNMENT: 0x0d05,
      UNPACK_FLIP_Y_WEBGL: 0x9240,
      UNPACK_PREMULTIPLY_ALPHA_WEBGL: 0x9241,

      // Mock methods
      enable: vi.fn(),
      disable: vi.fn(),
      cullFace: vi.fn(),
      blendFunc: vi.fn(),
      blendFuncSeparate: vi.fn(),
      blendEquation: vi.fn(),
      blendEquationSeparate: vi.fn(),
      blendColor: vi.fn(),
      depthFunc: vi.fn(),
      depthMask: vi.fn(),
      depthRange: vi.fn(),
      scissor: vi.fn(),
      viewport: vi.fn(),
      frontFace: vi.fn(),
      lineWidth: vi.fn(),
      polygonOffset: vi.fn(),
      stencilFunc: vi.fn(),
      stencilOp: vi.fn(),
      stencilMask: vi.fn(),
      clearDepth: vi.fn(),
      clearStencil: vi.fn(),
      colorMask: vi.fn(),
      hint: vi.fn(),
      pixelStorei: vi.fn(),
    };
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // Constructor Tests
  // ═══════════════════════════════════════════════════════════════════════════

  describe('constructor', () => {
    it('creates WebGLState with valid WebGL context', () => {
      const state = new WebGLState(mockGL as WebGL2RenderingContext);
      expect(state).toBeDefined();
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // Binary Capabilities: Enable/Disable
  // ═══════════════════════════════════════════════════════════════════════════

  describe('binary capabilities', () => {
    let state: WebGLState;

    beforeEach(() => {
      state = new WebGLState(mockGL as WebGL2RenderingContext);
    });

    describe('enableCapability', () => {
      it('enables a binary capability', () => {
        state.enableCapability('BLEND');
        expect(mockGL.enable).toHaveBeenCalledWith(mockGL.BLEND);
      });

      it('throws error for invalid capability name', () => {
        expect(() => state.enableCapability('INVALID_CAP')).toThrow(
          /Invalid binary capability/,
        );
      });

      it('skips redundant enable calls (performance optimization)', () => {
        state.enableCapability('BLEND');
        state.enableCapability('BLEND');

        // Should only be called once due to redundancy detection
        expect(mockGL.enable).toHaveBeenCalledTimes(1);
      });

      it('enables multiple different capabilities', () => {
        state.enableCapability('BLEND');
        state.enableCapability('DEPTH_TEST');
        state.enableCapability('CULL_FACE');

        expect(mockGL.enable).toHaveBeenCalledWith(mockGL.BLEND);
        expect(mockGL.enable).toHaveBeenCalledWith(mockGL.DEPTH_TEST);
        expect(mockGL.enable).toHaveBeenCalledWith(mockGL.CULL_FACE);
      });

      it('enables after being disabled', () => {
        state.disableCapability('BLEND');
        expect(mockGL.disable).toHaveBeenCalledTimes(1);

        state.enableCapability('BLEND');
        expect(mockGL.enable).toHaveBeenCalledWith(mockGL.BLEND);
        expect(mockGL.enable).toHaveBeenCalledTimes(1);
      });
    });

    describe('disableCapability', () => {
      it('disables a binary capability', () => {
        state.disableCapability('BLEND');
        expect(mockGL.disable).toHaveBeenCalledWith(mockGL.BLEND);
      });

      it('throws error for invalid capability name', () => {
        expect(() => state.disableCapability('INVALID_CAP')).toThrow(
          /Invalid binary capability/,
        );
      });

      it('skips redundant disable calls', () => {
        state.disableCapability('BLEND');
        state.disableCapability('BLEND');

        // Should only be called once due to redundancy detection
        expect(mockGL.disable).toHaveBeenCalledTimes(1);
      });

      it('disables after being enabled', () => {
        state.enableCapability('BLEND');
        expect(mockGL.enable).toHaveBeenCalledTimes(1);

        state.disableCapability('BLEND');
        expect(mockGL.disable).toHaveBeenCalledWith(mockGL.BLEND);
      });
    });

    describe('isCapabilityEnabled', () => {
      it('returns true for enabled capability', () => {
        state.enableCapability('BLEND');
        expect(state.isCapabilityEnabled('BLEND')).toBe(true);
      });

      it('returns false for disabled capability', () => {
        state.disableCapability('BLEND');
        expect(state.isCapabilityEnabled('BLEND')).toBe(false);
      });

      it('returns undefined for never-set capability', () => {
        expect(state.isCapabilityEnabled('BLEND')).toBeUndefined();
      });

      it('reflects state changes', () => {
        expect(state.isCapabilityEnabled('BLEND')).toBeUndefined();
        state.enableCapability('BLEND');
        expect(state.isCapabilityEnabled('BLEND')).toBe(true);
        state.disableCapability('BLEND');
        expect(state.isCapabilityEnabled('BLEND')).toBe(false);
      });
    });

    // ─────────────────────────────────────────────────────────────────────────
    // Named Helper Methods for Binary Capabilities
    // ─────────────────────────────────────────────────────────────────────────

    describe('enableBlend / disableBlend', () => {
      it('enables blending via helper', () => {
        state.enableBlend();
        expect(mockGL.enable).toHaveBeenCalledWith(mockGL.BLEND);
      });

      it('disables blending via helper', () => {
        state.disableBlend();
        expect(mockGL.disable).toHaveBeenCalledWith(mockGL.BLEND);
      });

      it('blend helpers skip redundant calls', () => {
        state.enableBlend();
        state.enableBlend();
        expect(mockGL.enable).toHaveBeenCalledTimes(1);
      });
    });

    describe('enableDepthTest / disableDepthTest', () => {
      it('enables depth testing via helper', () => {
        state.enableDepthTest();
        expect(mockGL.enable).toHaveBeenCalledWith(mockGL.DEPTH_TEST);
      });

      it('disables depth testing via helper', () => {
        state.disableDepthTest();
        expect(mockGL.disable).toHaveBeenCalledWith(mockGL.DEPTH_TEST);
      });
    });

    describe('enableCullFace / disableCullFace', () => {
      it('enables face culling via helper', () => {
        state.enableCullFace();
        expect(mockGL.enable).toHaveBeenCalledWith(mockGL.CULL_FACE);
      });

      it('disables face culling via helper', () => {
        state.disableCullFace();
        expect(mockGL.disable).toHaveBeenCalledWith(mockGL.CULL_FACE);
      });
    });

    describe('enableScissor / disableScissor', () => {
      it('enables scissor testing via helper', () => {
        state.enableScissor();
        expect(mockGL.enable).toHaveBeenCalledWith(mockGL.SCISSOR_TEST);
      });

      it('disables scissor testing via helper', () => {
        state.disableScissor();
        expect(mockGL.disable).toHaveBeenCalledWith(mockGL.SCISSOR_TEST);
      });
    });

    describe('enableStencil / disableStencil', () => {
      it('enables stencil testing via helper', () => {
        state.enableStencil();
        expect(mockGL.enable).toHaveBeenCalledWith(mockGL.STENCIL_TEST);
      });

      it('disables stencil testing via helper', () => {
        state.disableStencil();
        expect(mockGL.disable).toHaveBeenCalledWith(mockGL.STENCIL_TEST);
      });
    });

    describe('enablePolygonOffset / disablePolygonOffset', () => {
      it('enables polygon offset via helper', () => {
        state.enablePolygonOffset();
        expect(mockGL.enable).toHaveBeenCalledWith(mockGL.POLYGON_OFFSET_FILL);
      });

      it('disables polygon offset via helper', () => {
        state.disablePolygonOffset();
        expect(mockGL.disable).toHaveBeenCalledWith(mockGL.POLYGON_OFFSET_FILL);
      });
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // Non-Binary Capabilities: Enable/Disable + Parameter
  // ═══════════════════════════════════════════════════════════════════════════

  describe('non-binary capabilities', () => {
    let state: WebGLState;

    beforeEach(() => {
      state = new WebGLState(mockGL as WebGL2RenderingContext);
    });

    describe('setCapability', () => {
      it('sets non-binary capability value', () => {
        state.setCapability('CULL_FACE', mockGL.BACK as GLenum);
        expect(mockGL.cullFace).toHaveBeenCalledWith(mockGL.BACK);
      });

      it('enables capability when setting it', () => {
        state.setCapability('CULL_FACE', mockGL.BACK as GLenum);
        expect(mockGL.enable).toHaveBeenCalledWith(mockGL.CULL_FACE);
      });

      it('throws error for invalid capability name', () => {
        expect(() =>
          state.setCapability('INVALID_CAP', mockGL.BACK as GLenum),
        ).toThrow(/Invalid non-binary capability/);
      });

      it('skips redundant calls with same value', () => {
        state.setCapability('CULL_FACE', mockGL.BACK as GLenum);
        state.setCapability('CULL_FACE', mockGL.BACK as GLenum);

        // Should only call cullFace once
        expect(mockGL.cullFace).toHaveBeenCalledTimes(1);
      });

      it('allows changing to different value', () => {
        state.setCapability('CULL_FACE', mockGL.BACK as GLenum);
        state.setCapability('CULL_FACE', mockGL.FRONT as GLenum);

        expect(mockGL.cullFace).toHaveBeenCalledWith(mockGL.BACK);
        expect(mockGL.cullFace).toHaveBeenCalledWith(mockGL.FRONT);
        expect(mockGL.cullFace).toHaveBeenCalledTimes(2);
      });

      it('only enables once when capability already enabled', () => {
        state.setCapability('CULL_FACE', mockGL.BACK as GLenum);
        expect(mockGL.enable).toHaveBeenCalledTimes(1);

        state.setCapability('CULL_FACE', mockGL.FRONT as GLenum);
        // Should not enable again, just set parameter
        expect(mockGL.enable).toHaveBeenCalledTimes(1);
        expect(mockGL.cullFace).toHaveBeenCalledTimes(2);
      });
    });

    describe('getCapability', () => {
      it('returns set capability value', () => {
        state.setCapability('CULL_FACE', mockGL.BACK as GLenum);
        expect(state.getCapability('CULL_FACE')).toBe(mockGL.BACK);
      });

      it('returns undefined for never-set capability', () => {
        expect(state.getCapability('CULL_FACE')).toBeUndefined();
      });

      it('reflects value changes', () => {
        state.setCapability('CULL_FACE', mockGL.BACK as GLenum);
        expect(state.getCapability('CULL_FACE')).toBe(mockGL.BACK);

        state.setCapability('CULL_FACE', mockGL.FRONT as GLenum);
        expect(state.getCapability('CULL_FACE')).toBe(mockGL.FRONT);
      });
    });

    // ─────────────────────────────────────────────────────────────────────────
    // Named Helper Methods for Non-Binary Capabilities
    // ─────────────────────────────────────────────────────────────────────────

    describe('setCullFaceBack', () => {
      it('sets cull face to back via helper', () => {
        state.setCullFaceBack();
        expect(mockGL.cullFace).toHaveBeenCalledWith(mockGL.BACK);
      });

      it('enables cull face capability', () => {
        state.setCullFaceBack();
        expect(mockGL.enable).toHaveBeenCalledWith(mockGL.CULL_FACE);
      });
    });

    describe('setCullFaceFront', () => {
      it('sets cull face to front via helper', () => {
        state.setCullFaceFront();
        expect(mockGL.cullFace).toHaveBeenCalledWith(mockGL.FRONT);
      });
    });

    describe('setCullFaceFrontAndBack', () => {
      it('sets cull face to front and back via helper', () => {
        state.setCullFaceFrontAndBack();
        expect(mockGL.cullFace).toHaveBeenCalledWith(mockGL.FRONT_AND_BACK);
      });
    });

    describe('disableCullFace', () => {
      it('disables cull face when explicitly called', () => {
        state.enableCullFace();
        state.disableCullFace();
        expect(mockGL.disable).toHaveBeenCalledWith(mockGL.CULL_FACE);
      });
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // State Parameters: Value-Setting Functions
  // ═══════════════════════════════════════════════════════════════════════════

  describe('state parameters', () => {
    let state: WebGLState;

    beforeEach(() => {
      state = new WebGLState(mockGL as WebGL2RenderingContext);
    });

    describe('setParameter / getParameter', () => {
      it('sets parameter with escape hatch', () => {
        state.setParameter('blendFunc', mockGL.SRC_ALPHA, mockGL.ONE_MINUS_SRC_ALPHA);
        expect(mockGL.blendFunc).toHaveBeenCalledWith(
          mockGL.SRC_ALPHA,
          mockGL.ONE_MINUS_SRC_ALPHA,
        );
      });

      it('throws error for invalid parameter name', () => {
        expect(() =>
          state.setParameter('invalidFunc', mockGL.SRC_ALPHA),
        ).toThrow(/Invalid state parameter/);
      });

      it('skips redundant calls with same arguments', () => {
        state.setParameter('blendFunc', mockGL.SRC_ALPHA, mockGL.ONE_MINUS_SRC_ALPHA);
        state.setParameter('blendFunc', mockGL.SRC_ALPHA, mockGL.ONE_MINUS_SRC_ALPHA);

        expect(mockGL.blendFunc).toHaveBeenCalledTimes(1);
      });

      it('calls when arguments change', () => {
        state.setParameter('blendFunc', mockGL.SRC_ALPHA, mockGL.ONE_MINUS_SRC_ALPHA);
        state.setParameter('blendFunc', mockGL.ONE, mockGL.ZERO);

        expect(mockGL.blendFunc).toHaveBeenCalledTimes(2);
      });

      it('returns set parameter arguments', () => {
        state.setParameter('blendFunc', mockGL.SRC_ALPHA, mockGL.ONE_MINUS_SRC_ALPHA);
        const args = state.getParameter('blendFunc');

        expect(args).toEqual([mockGL.SRC_ALPHA, mockGL.ONE_MINUS_SRC_ALPHA]);
      });

      it('returns undefined for never-set parameter', () => {
        expect(state.getParameter('blendFunc')).toBeUndefined();
      });

      it('handles parameters with different argument counts', () => {
        state.setParameter('scissor', 0, 0, 800, 600);
        expect(mockGL.scissor).toHaveBeenCalledWith(0, 0, 800, 600);

        state.setParameter('depthFunc', mockGL.LESS);
        expect(mockGL.depthFunc).toHaveBeenCalledWith(mockGL.LESS);
      });
    });

    // ─────────────────────────────────────────────────────────────────────────
    // Named Helper Methods for State Parameters
    // ─────────────────────────────────────────────────────────────────────────

    describe('setBlendFunc', () => {
      it('sets blend function via helper', () => {
        state.setBlendFunc(mockGL.SRC_ALPHA as GLenum, mockGL.ONE_MINUS_SRC_ALPHA as GLenum);
        expect(mockGL.blendFunc).toHaveBeenCalledWith(
          mockGL.SRC_ALPHA,
          mockGL.ONE_MINUS_SRC_ALPHA,
        );
      });

      it('detects redundant blend function calls', () => {
        state.setBlendFunc(mockGL.SRC_ALPHA as GLenum, mockGL.ONE_MINUS_SRC_ALPHA as GLenum);
        state.setBlendFunc(mockGL.SRC_ALPHA as GLenum, mockGL.ONE_MINUS_SRC_ALPHA as GLenum);
        expect(mockGL.blendFunc).toHaveBeenCalledTimes(1);
      });
    });

    describe('setBlendEquation', () => {
      it('sets blend equation via helper', () => {
        state.setBlendEquation(mockGL.FUNC_ADD as GLenum);
        expect(mockGL.blendEquation).toHaveBeenCalledWith(mockGL.FUNC_ADD);
      });
    });

    describe('setBlendColor', () => {
      it('sets blend color via helper', () => {
        state.setBlendColor(1.0, 0.0, 0.0, 0.5);
        expect(mockGL.blendColor).toHaveBeenCalledWith(1.0, 0.0, 0.0, 0.5);
      });

      it('detects redundant blend color calls', () => {
        state.setBlendColor(1.0, 0.0, 0.0, 0.5);
        state.setBlendColor(1.0, 0.0, 0.0, 0.5);
        expect(mockGL.blendColor).toHaveBeenCalledTimes(1);
      });
    });

    describe('setDepthFunc', () => {
      it('sets depth function via helper', () => {
        state.setDepthFunc(mockGL.LESS as GLenum);
        expect(mockGL.depthFunc).toHaveBeenCalledWith(mockGL.LESS);
      });
    });

    describe('setDepthMask', () => {
      it('enables depth mask via helper', () => {
        state.setDepthMask(true);
        expect(mockGL.depthMask).toHaveBeenCalledWith(true);
      });

      it('disables depth mask via helper', () => {
        state.setDepthMask(false);
        expect(mockGL.depthMask).toHaveBeenCalledWith(false);
      });
    });

    describe('setDepthRange', () => {
      it('sets depth range via helper', () => {
        state.setDepthRange(0.0, 1.0);
        expect(mockGL.depthRange).toHaveBeenCalledWith(0.0, 1.0);
      });
    });

    describe('setScissor', () => {
      it('sets scissor rectangle via helper', () => {
        state.setScissor(0, 0, 400, 300);
        expect(mockGL.scissor).toHaveBeenCalledWith(0, 0, 400, 300);
      });

      it('detects redundant scissor calls', () => {
        state.setScissor(0, 0, 400, 300);
        state.setScissor(0, 0, 400, 300);
        expect(mockGL.scissor).toHaveBeenCalledTimes(1);
      });

      it('allows different scissor rectangles', () => {
        state.setScissor(0, 0, 400, 300);
        state.setScissor(100, 100, 300, 200);
        expect(mockGL.scissor).toHaveBeenCalledTimes(2);
      });
    });

    describe('setViewport', () => {
      it('sets viewport via helper', () => {
        state.setViewport(0, 0, 800, 600);
        expect(mockGL.viewport).toHaveBeenCalledWith(0, 0, 800, 600);
      });

      it('detects redundant viewport calls', () => {
        state.setViewport(0, 0, 800, 600);
        state.setViewport(0, 0, 800, 600);
        expect(mockGL.viewport).toHaveBeenCalledTimes(1);
      });
    });

    describe('setFrontFace', () => {
      it('sets front face winding order via helper', () => {
        state.setFrontFace(mockGL.CCW as GLenum);
        expect(mockGL.frontFace).toHaveBeenCalledWith(mockGL.CCW);
      });
    });

    describe('setLineWidth', () => {
      it('sets line width via helper', () => {
        state.setLineWidth(2.0);
        expect(mockGL.lineWidth).toHaveBeenCalledWith(2.0);
      });
    });

    describe('setPolygonOffset', () => {
      it('sets polygon offset via helper', () => {
        state.setPolygonOffset(1.0, 1.0);
        expect(mockGL.polygonOffset).toHaveBeenCalledWith(1.0, 1.0);
      });
    });

    describe('setStencilFunc', () => {
      it('sets stencil function via helper', () => {
        state.setStencilFunc(mockGL.ALWAYS as GLenum, 1, 0xff);
        expect(mockGL.stencilFunc).toHaveBeenCalledWith(mockGL.ALWAYS, 1, 0xff);
      });
    });

    describe('setStencilOp', () => {
      it('sets stencil operation via helper', () => {
        state.setStencilOp(
          mockGL.KEEP as GLenum,
          mockGL.KEEP as GLenum,
          mockGL.REPLACE as GLenum,
        );
        expect(mockGL.stencilOp).toHaveBeenCalledWith(
          mockGL.KEEP,
          mockGL.KEEP,
          mockGL.REPLACE,
        );
      });
    });

    describe('setStencilMask', () => {
      it('sets stencil mask via helper', () => {
        state.setStencilMask(0xff);
        expect(mockGL.stencilMask).toHaveBeenCalledWith(0xff);
      });
    });

    describe('setClearDepth', () => {
      it('sets clear depth via helper', () => {
        state.setClearDepth(1.0);
        expect(mockGL.clearDepth).toHaveBeenCalledWith(1.0);
      });
    });

    describe('setClearStencil', () => {
      it('sets clear stencil via helper', () => {
        state.setClearStencil(0);
        expect(mockGL.clearStencil).toHaveBeenCalledWith(0);
      });
    });

    describe('setColorMask', () => {
      it('sets color mask via helper', () => {
        state.setColorMask(true, true, true, true);
        expect(mockGL.colorMask).toHaveBeenCalledWith(true, true, true, true);
      });

      it('handles individual channel masking', () => {
        state.setColorMask(true, true, true, false);
        expect(mockGL.colorMask).toHaveBeenCalledWith(true, true, true, false);
      });
    });

    describe('setHint', () => {
      it('sets hint via helper', () => {
        state.setHint(
          mockGL.FRAGMENT_SHADER_DERIVATIVE_HINT as GLenum,
          mockGL.FASTEST as GLenum,
        );
        expect(mockGL.hint).toHaveBeenCalledWith(
          mockGL.FRAGMENT_SHADER_DERIVATIVE_HINT,
          mockGL.FASTEST,
        );
      });
    });

    describe('setPixelStorei', () => {
      it('sets pixel storage parameter via helper', () => {
        state.setPixelStorei(mockGL.UNPACK_ALIGNMENT as GLenum, 1);
        expect(mockGL.pixelStorei).toHaveBeenCalledWith(mockGL.UNPACK_ALIGNMENT, 1);
      });

      it('handles boolean pixel storage parameters', () => {
        state.setPixelStorei(mockGL.UNPACK_FLIP_Y_WEBGL as GLenum, true);
        expect(mockGL.pixelStorei).toHaveBeenCalledWith(
          mockGL.UNPACK_FLIP_Y_WEBGL,
          true,
        );
      });
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // Complex Workflows and Combinations
  // ═══════════════════════════════════════════════════════════════════════════

  describe('complex workflows', () => {
    let state: WebGLState;

    beforeEach(() => {
      state = new WebGLState(mockGL as WebGL2RenderingContext);
    });

    it('enables blending with custom blend function', () => {
      state.enableBlend();
      state.setBlendFunc(mockGL.SRC_ALPHA as GLenum, mockGL.ONE_MINUS_SRC_ALPHA as GLenum);

      expect(mockGL.enable).toHaveBeenCalledWith(mockGL.BLEND);
      expect(mockGL.blendFunc).toHaveBeenCalledWith(
        mockGL.SRC_ALPHA,
        mockGL.ONE_MINUS_SRC_ALPHA,
      );
    });

    it('configures depth testing properly', () => {
      state.enableDepthTest();
      state.setDepthFunc(mockGL.LESS as GLenum);
      state.setDepthMask(true);

      expect(mockGL.enable).toHaveBeenCalledWith(mockGL.DEPTH_TEST);
      expect(mockGL.depthFunc).toHaveBeenCalledWith(mockGL.LESS);
      expect(mockGL.depthMask).toHaveBeenCalledWith(true);
    });

    it('configures stencil operations', () => {
      state.enableStencil();
      state.setStencilFunc(mockGL.ALWAYS as GLenum, 1, 0xff);
      state.setStencilOp(
        mockGL.KEEP as GLenum,
        mockGL.KEEP as GLenum,
        mockGL.REPLACE as GLenum,
      );

      expect(mockGL.enable).toHaveBeenCalledWith(mockGL.STENCIL_TEST);
      expect(mockGL.stencilFunc).toHaveBeenCalled();
      expect(mockGL.stencilOp).toHaveBeenCalled();
    });

    it('handles mixed named helpers and escape hatches', () => {
      state.enableBlend();
      state.setParameter('blendFunc', mockGL.SRC_ALPHA, mockGL.ONE_MINUS_SRC_ALPHA);
      state.setCullFaceBack();

      expect(mockGL.enable).toHaveBeenCalledWith(mockGL.BLEND);
      expect(mockGL.blendFunc).toHaveBeenCalled();
      expect(mockGL.cullFace).toHaveBeenCalledWith(mockGL.BACK);
    });

    it('tracks independent capability and parameter state', () => {
      state.enableBlend();
      state.setBlendFunc(mockGL.SRC_ALPHA as GLenum, mockGL.ONE_MINUS_SRC_ALPHA as GLenum);
      state.enableDepthTest();
      state.setDepthFunc(mockGL.LESS as GLenum);

      expect(state.isCapabilityEnabled('BLEND')).toBe(true);
      expect(state.isCapabilityEnabled('DEPTH_TEST')).toBe(true);
      expect(state.getParameter('blendFunc')).toEqual([
        mockGL.SRC_ALPHA,
        mockGL.ONE_MINUS_SRC_ALPHA,
      ]);
      expect(state.getParameter('depthFunc')).toEqual([mockGL.LESS]);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // State Snapshot
  // ═══════════════════════════════════════════════════════════════════════════

  describe('getStateSnapshot', () => {
    let state: WebGLState;

    beforeEach(() => {
      state = new WebGLState(mockGL as WebGL2RenderingContext);
    });

    it('returns snapshot of all state', () => {
      state.enableBlend();
      state.setBlendFunc(mockGL.SRC_ALPHA as GLenum, mockGL.ONE_MINUS_SRC_ALPHA as GLenum);
      state.setCullFaceBack();

      const snapshot = state.getStateSnapshot();

      expect(snapshot.capabilities.get('BLEND')).toBe(true);
      expect(snapshot.nonBinaryCapabilities.get('CULL_FACE')).toBe(mockGL.BACK);
      expect(snapshot.parameters.get('blendFunc')).toEqual([
        mockGL.SRC_ALPHA,
        mockGL.ONE_MINUS_SRC_ALPHA,
      ]);
    });

    it('returns independent copy of state', () => {
      state.enableBlend();
      const snapshot1 = state.getStateSnapshot();
      state.disableBlend();
      const snapshot2 = state.getStateSnapshot();

      expect(snapshot1.capabilities.get('BLEND')).toBe(true);
      expect(snapshot2.capabilities.get('BLEND')).toBe(false);
    });

    it('includes all tracked state categories', () => {
      const snapshot = state.getStateSnapshot();

      expect(snapshot).toHaveProperty('capabilities');
      expect(snapshot).toHaveProperty('nonBinaryCapabilities');
      expect(snapshot).toHaveProperty('parameters');
      expect(snapshot.capabilities instanceof Map).toBe(true);
      expect(snapshot.nonBinaryCapabilities instanceof Map).toBe(true);
      expect(snapshot.parameters instanceof Map).toBe(true);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // Error Handling and Edge Cases
  // ═══════════════════════════════════════════════════════════════════════════

  describe('error handling and edge cases', () => {
    let state: WebGLState;

    beforeEach(() => {
      state = new WebGLState(mockGL as WebGL2RenderingContext);
    });

    it('validates capability names in enableCapability', () => {
      expect(() => state.enableCapability('BLEND_MODE')).toThrow();
      expect(() => state.enableCapability('')).toThrow();
      expect(() => state.enableCapability('blend')).toThrow(); // case sensitive
    });

    it('validates capability names in disableCapability', () => {
      expect(() => state.disableCapability('INVALID')).toThrow();
    });

    it('validates parameter names in setParameter', () => {
      expect(() => state.setParameter('blendFnc')).toThrow(); // typo
      expect(() => state.setParameter('someRandomFunc')).toThrow();
    });

    it('handles zero values in parameters', () => {
      state.setScissor(0, 0, 0, 0);
      expect(mockGL.scissor).toHaveBeenCalledWith(0, 0, 0, 0);
    });

    it('handles negative values in parameters', () => {
      state.setBlendColor(-1.0, -0.5, 0.5, 1.5);
      expect(mockGL.blendColor).toHaveBeenCalledWith(-1.0, -0.5, 0.5, 1.5);
    });

    it('handles large values in parameters', () => {
      state.setLineWidth(100.0);
      expect(mockGL.lineWidth).toHaveBeenCalledWith(100.0);
    });

    it('handles boolean values in color mask', () => {
      state.setColorMask(true, false, true, false);
      expect(mockGL.colorMask).toHaveBeenCalledWith(true, false, true, false);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // Constants Validation (CI verification tests)
  // ═══════════════════════════════════════════════════════════════════════════

  describe('constants validation (CI tests)', () => {
    let state: WebGLState;

    beforeEach(() => {
      state = new WebGLState(mockGL as WebGL2RenderingContext);
    });

    it('validates that BINARY_CAPABILITIES exist in WebGL context', () => {
      // This test ensures that all binary capability constants are valid
      // If this fails, it means the constants file is out of sync with WebGL spec
      const binaryCapabilities = [
        'BLEND',
        'DEPTH_TEST',
        'CULL_FACE',
        'SCISSOR_TEST',
        'STENCIL_TEST',
      ];

      binaryCapabilities.forEach((cap) => {
        // Should not throw
        expect(() => state.enableCapability(cap)).not.toThrow();
      });
    });

    it('validates that NON_BINARY_CAPABILITIES have setters in WebGL context', () => {
      // CULL_FACE should have cullFace setter
      expect(() =>
        state.setCapability('CULL_FACE', mockGL.BACK as GLenum),
      ).not.toThrow();
    });

    it('validates that STATE_PARAMETERS exist as methods in WebGL context', () => {
      // These should not throw
      expect(() => state.setParameter('blendFunc', mockGL.ONE, mockGL.ZERO)).not.toThrow();
      expect(() => state.setParameter('depthFunc', mockGL.LESS)).not.toThrow();
      expect(() => state.setParameter('scissor', 0, 0, 100, 100)).not.toThrow();
    });

    it('throws error when non-binary capability setter not found on WebGL context', () => {
      // Create a state with a mock GL context missing the cullFace method
      const incompleteGL = {
        ...mockGL,
        cullFace: undefined, // Remove the setter
      };

      const stateWithIncompleteGL = new WebGLState(
        incompleteGL as unknown as WebGL2RenderingContext,
      );

      expect(() =>
        stateWithIncompleteGL.setCapability('CULL_FACE', mockGL.BACK as GLenum),
      ).toThrow(/Setter function 'cullFace' not found on WebGL context/);
    });

    it('throws error when state parameter function not found on WebGL context', () => {
      // Create a state with a mock GL context missing the blendFunc method
      const incompleteGL = {
        ...mockGL,
        blendFunc: undefined, // Remove the function
      };

      const stateWithIncompleteGL = new WebGLState(
        incompleteGL as unknown as WebGL2RenderingContext,
      );

      expect(() =>
        stateWithIncompleteGL.setParameter('blendFunc', mockGL.ONE, mockGL.ZERO),
      ).toThrow(/Parameter function 'blendFunc' not found on WebGL context/);
    });
  });

  // ===========================================================================
  // State Stack: Push/Pop
  // ===========================================================================

  describe('push/pop', () => {
    it('push saves current state', () => {
      const state = new WebGLState(mockGL as WebGL2RenderingContext);
      state.enableBlend();
      state.enableDepthTest();

      expect(state.stackDepth).toBe(0);
      state.push();
      expect(state.stackDepth).toBe(1);
    });

    it('pop restores binary capabilities', () => {
      const state = new WebGLState(mockGL as WebGL2RenderingContext);

      // Set initial state
      state.enableBlend();
      state.enableDepthTest();
      state.push();

      // Change state
      state.disableBlend();
      state.disableDepthTest();
      expect(state.isCapabilityEnabled('BLEND')).toBe(false);
      expect(state.isCapabilityEnabled('DEPTH_TEST')).toBe(false);

      // Restore
      state.pop();
      expect(state.isCapabilityEnabled('BLEND')).toBe(true);
      expect(state.isCapabilityEnabled('DEPTH_TEST')).toBe(true);
      expect(state.stackDepth).toBe(0);
    });

    it('pop restores non-binary capabilities', () => {
      const state = new WebGLState(mockGL as WebGL2RenderingContext);

      state.setCullFaceBack();
      state.push();

      state.setCullFaceFront();
      expect(state.getCapability('CULL_FACE')).toBe(mockGL.FRONT);

      state.pop();
      expect(state.getCapability('CULL_FACE')).toBe(mockGL.BACK);
    });

    it('pop restores parameters', () => {
      const state = new WebGLState(mockGL as WebGL2RenderingContext);

      state.setBlendFunc(mockGL.SRC_ALPHA!, mockGL.ONE_MINUS_SRC_ALPHA!);
      state.setViewport(0, 0, 800, 600);
      state.push();

      state.setBlendFunc(mockGL.ONE!, mockGL.ZERO!);
      state.setViewport(0, 0, 400, 300);

      state.pop();

      expect(state.getParameter('blendFunc')).toEqual([
        mockGL.SRC_ALPHA,
        mockGL.ONE_MINUS_SRC_ALPHA,
      ]);
      expect(state.getParameter('viewport')).toEqual([0, 0, 800, 600]);
    });

    it('supports nested push/pop', () => {
      const state = new WebGLState(mockGL as WebGL2RenderingContext);

      state.enableBlend();
      state.push(); // depth 1

      state.disableBlend();
      state.enableDepthTest();
      state.push(); // depth 2

      state.disableDepthTest();
      expect(state.isCapabilityEnabled('BLEND')).toBe(false);
      expect(state.isCapabilityEnabled('DEPTH_TEST')).toBe(false);
      expect(state.stackDepth).toBe(2);

      state.pop(); // back to depth 1
      expect(state.isCapabilityEnabled('BLEND')).toBe(false);
      expect(state.isCapabilityEnabled('DEPTH_TEST')).toBe(true);
      expect(state.stackDepth).toBe(1);

      state.pop(); // back to depth 0
      expect(state.isCapabilityEnabled('BLEND')).toBe(true);
      expect(state.stackDepth).toBe(0);
    });

    it('pop throws on empty stack', () => {
      const state = new WebGLState(mockGL as WebGL2RenderingContext);
      expect(() => state.pop()).toThrow(/stack underflow/);
    });

    it('push throws when stack depth exceeds limit', () => {
      const state = new WebGLState(mockGL as WebGL2RenderingContext);

      // Push 32 times (the limit)
      for (let i = 0; i < 32; i++) {
        state.push();
      }
      expect(state.stackDepth).toBe(32);

      // 33rd push should throw
      expect(() => state.push()).toThrow(/stack overflow/);
    });

    it('disables new capabilities that were enabled after push', () => {
      const state = new WebGLState(mockGL as WebGL2RenderingContext);

      // No capabilities enabled initially
      state.push();

      // Enable some capabilities
      state.enableBlend();
      state.enableScissor();
      expect(state.isCapabilityEnabled('BLEND')).toBe(true);
      expect(state.isCapabilityEnabled('SCISSOR_TEST')).toBe(true);

      // Pop should disable them (they weren't in snapshot)
      state.pop();
      expect(state.isCapabilityEnabled('BLEND')).toBe(false);
      expect(state.isCapabilityEnabled('SCISSOR_TEST')).toBe(false);
    });

    it('makes actual WebGL calls on restore', () => {
      const state = new WebGLState(mockGL as WebGL2RenderingContext);

      state.enableBlend();
      state.push();
      state.disableBlend();

      // Clear mock call history
      vi.mocked(mockGL.enable!).mockClear();

      state.pop();

      // Should have called gl.enable(BLEND)
      expect(mockGL.enable).toHaveBeenCalledWith(mockGL.BLEND);
    });
  });

  // ===========================================================================
  // scoped()
  // ===========================================================================

  describe('scoped()', () => {
    it('automatically pushes and pops', () => {
      const state = new WebGLState(mockGL as WebGL2RenderingContext);

      state.enableBlend();

      state.scoped(() => {
        expect(state.stackDepth).toBe(1);
        state.disableBlend();
        expect(state.isCapabilityEnabled('BLEND')).toBe(false);
      });

      expect(state.stackDepth).toBe(0);
      expect(state.isCapabilityEnabled('BLEND')).toBe(true);
    });

    it('returns the callback result', () => {
      const state = new WebGLState(mockGL as WebGL2RenderingContext);

      const result = state.scoped(() => {
        return 42;
      });

      expect(result).toBe(42);
    });

    it('restores state even if callback throws', () => {
      const state = new WebGLState(mockGL as WebGL2RenderingContext);

      state.enableBlend();

      expect(() => {
        state.scoped(() => {
          state.disableBlend();
          throw new Error('test error');
        });
      }).toThrow('test error');

      // State should still be restored
      expect(state.stackDepth).toBe(0);
      expect(state.isCapabilityEnabled('BLEND')).toBe(true);
    });

    it('can be nested', () => {
      const state = new WebGLState(mockGL as WebGL2RenderingContext);

      state.enableBlend();

      state.scoped(() => {
        state.disableBlend();
        state.enableDepthTest();

        state.scoped(() => {
          state.disableDepthTest();
          expect(state.isCapabilityEnabled('BLEND')).toBe(false);
          expect(state.isCapabilityEnabled('DEPTH_TEST')).toBe(false);
        });

        expect(state.isCapabilityEnabled('DEPTH_TEST')).toBe(true);
      });

      expect(state.isCapabilityEnabled('BLEND')).toBe(true);
    });
  });

  // ===========================================================================
  // stackDepth
  // ===========================================================================

  describe('stackDepth', () => {
    it('returns 0 initially', () => {
      const state = new WebGLState(mockGL as WebGL2RenderingContext);
      expect(state.stackDepth).toBe(0);
    });

    it('increments on push', () => {
      const state = new WebGLState(mockGL as WebGL2RenderingContext);
      state.push();
      expect(state.stackDepth).toBe(1);
      state.push();
      expect(state.stackDepth).toBe(2);
    });

    it('decrements on pop', () => {
      const state = new WebGLState(mockGL as WebGL2RenderingContext);
      state.push();
      state.push();
      state.pop();
      expect(state.stackDepth).toBe(1);
    });
  });
});
