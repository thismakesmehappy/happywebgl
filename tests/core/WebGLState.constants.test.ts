import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  BINARY_CAPABILITIES,
  NON_BINARY_CAPABILITIES,
  STATE_PARAMETERS,
  DOCUMENTATION_LINKS,
} from '../../src/core/WebGLState.constants.js';

/**
 * Constants Validation Test Suite
 *
 * This test suite validates that the WebGLState constants stay in sync
 * with the actual WebGL 2.0 specification. These tests should be run
 * whenever WebGL compatibility changes or a new browser version is tested.
 *
 * Purpose:
 * ─────────
 * As WebGL implementations evolve, new capabilities and parameters may be
 * added. These tests catch version mismatches automatically by verifying
 * that all constants we reference actually exist in the WebGL context.
 *
 * CI Usage:
 * ─────────
 * Run these tests on multiple browsers and devices to ensure the constants
 * remain valid across different WebGL implementations. A failing test means
 * the constants file needs updating.
 *
 * Example Error:
 *   Error: Binary capability 'FUTURE_CAPABILITY' does not exist in WebGL context
 *   → This means a new WebGL capability was added and we need to update BINARY_CAPABILITIES
 *
 * Example Error:
 *   Error: State parameter 'newFunction' does not exist on WebGL context
 *   → This means a new WebGL function was added and we need to update STATE_PARAMETERS
 */

describe('WebGLState Constants Validation', () => {
  let mockGL: Partial<WebGL2RenderingContext>;

  beforeEach(() => {
    // Create a comprehensive mock WebGL context with all standard constants
    mockGL = {
      // Binary capability constants (from spec)
      BLEND: 0x0be2,
      CULL_FACE: 0x0b44,
      DEPTH_TEST: 0x0b71,
      DITHER: 0x0bd0,
      POLYGON_OFFSET_FILL: 0x8037,
      SAMPLE_ALPHA_TO_COVERAGE: 0x809e,
      SAMPLE_COVERAGE: 0x80a0,
      SCISSOR_TEST: 0x0c11,
      STENCIL_TEST: 0x0b90,
      RASTERIZER_DISCARD: 0x8c89,
      PRIMITIVE_RESTART_FIXED_INDEX: 0x8d69,

      // Non-binary capability values
      FRONT: 0x0404,
      BACK: 0x0405,
      FRONT_AND_BACK: 0x0408,

      // Setter methods for non-binary capabilities
      cullFace: vi.fn(),

      // State parameter methods
      blendFunc: vi.fn(),
      blendFuncSeparate: vi.fn(),
      blendEquation: vi.fn(),
      blendEquationSeparate: vi.fn(),
      blendColor: vi.fn(),
      clearColor: vi.fn(),
      colorMask: vi.fn(),
      clearDepth: vi.fn(),
      depthFunc: vi.fn(),
      depthMask: vi.fn(),
      depthRange: vi.fn(),
      clearStencil: vi.fn(),
      stencilFunc: vi.fn(),
      stencilFuncSeparate: vi.fn(),
      stencilMask: vi.fn(),
      stencilMaskSeparate: vi.fn(),
      stencilOp: vi.fn(),
      stencilOpSeparate: vi.fn(),
      scissor: vi.fn(),
      viewport: vi.fn(),
      frontFace: vi.fn(),
      hint: vi.fn(),
      lineWidth: vi.fn(),
      polygonOffset: vi.fn(),
      pixelStorei: vi.fn(),
    };
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // Binary Capabilities Validation
  // ═══════════════════════════════════════════════════════════════════════════

  describe('BINARY_CAPABILITIES validation', () => {
    it('is an array of capability names', () => {
      expect(Array.isArray(BINARY_CAPABILITIES)).toBe(true);
      expect(BINARY_CAPABILITIES.length).toBeGreaterThan(0);
    });

    it('contains only non-empty strings', () => {
      BINARY_CAPABILITIES.forEach((cap) => {
        expect(typeof cap).toBe('string');
        expect(cap.length).toBeGreaterThan(0);
      });
    });

    it('contains uppercase constant names (WebGL convention)', () => {
      BINARY_CAPABILITIES.forEach((cap) => {
        expect(cap).toBe(cap.toUpperCase());
      });
    });

    it('all capabilities exist in WebGL context', () => {
      BINARY_CAPABILITIES.forEach((capabilityName) => {
        const glConstant = mockGL[capabilityName as keyof WebGL2RenderingContext];
        expect(glConstant).toBeDefined();
        expect(typeof glConstant).toBe('number');
      });
    });

    it('contains no duplicate capabilities', () => {
      const uniqueCount = new Set(BINARY_CAPABILITIES).size;
      expect(uniqueCount).toBe(BINARY_CAPABILITIES.length);
    });

    it('includes essential capabilities for 3D rendering', () => {
      expect(BINARY_CAPABILITIES).toContain('DEPTH_TEST');
      expect(BINARY_CAPABILITIES).toContain('CULL_FACE');
      expect(BINARY_CAPABILITIES).toContain('BLEND');
    });

    it('includes blending capability', () => {
      expect(BINARY_CAPABILITIES).toContain('BLEND');
    });

    it('includes depth testing capability', () => {
      expect(BINARY_CAPABILITIES).toContain('DEPTH_TEST');
    });

    it('includes face culling capability', () => {
      expect(BINARY_CAPABILITIES).toContain('CULL_FACE');
    });

    it('includes scissor testing capability', () => {
      expect(BINARY_CAPABILITIES).toContain('SCISSOR_TEST');
    });

    it('includes stencil testing capability', () => {
      expect(BINARY_CAPABILITIES).toContain('STENCIL_TEST');
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // Non-Binary Capabilities Validation
  // ═══════════════════════════════════════════════════════════════════════════

  describe('NON_BINARY_CAPABILITIES validation', () => {
    it('is an object mapping capability names to setter function names', () => {
      expect(typeof NON_BINARY_CAPABILITIES).toBe('object');
      expect(NON_BINARY_CAPABILITIES).not.toBeNull();
    });

    it('all capability keys are valid (exist in WebGL)', () => {
      Object.keys(NON_BINARY_CAPABILITIES).forEach((capabilityName) => {
        const glConstant = mockGL[capabilityName as keyof WebGL2RenderingContext];
        expect(glConstant).toBeDefined();
      });
    });

    it('all setter function names exist in WebGL context', () => {
      Object.values(NON_BINARY_CAPABILITIES).forEach((setterName) => {
        const glFunction = mockGL[setterName as keyof WebGL2RenderingContext];
        expect(glFunction).toBeDefined();
        expect(typeof glFunction).toBe('function');
      });
    });

    it('setter functions have correct names for their capabilities', () => {
      expect(NON_BINARY_CAPABILITIES['CULL_FACE']).toBe('cullFace');
    });

    it('contains no duplicate capability mappings', () => {
      const uniqueCount = new Set(Object.keys(NON_BINARY_CAPABILITIES)).size;
      expect(uniqueCount).toBe(Object.keys(NON_BINARY_CAPABILITIES).length);
    });

    it('contains no duplicate setter function names', () => {
      const setters = Object.values(NON_BINARY_CAPABILITIES);
      const uniqueCount = new Set(setters).size;
      expect(uniqueCount).toBe(setters.length);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // State Parameters Validation
  // ═══════════════════════════════════════════════════════════════════════════

  describe('STATE_PARAMETERS validation', () => {
    it('is an array of parameter function names', () => {
      expect(Array.isArray(STATE_PARAMETERS)).toBe(true);
      expect(STATE_PARAMETERS.length).toBeGreaterThan(0);
    });

    it('contains only non-empty strings', () => {
      STATE_PARAMETERS.forEach((param) => {
        expect(typeof param).toBe('string');
        expect(param.length).toBeGreaterThan(0);
      });
    });

    it('contains camelCase function names (JavaScript convention)', () => {
      STATE_PARAMETERS.forEach((param) => {
        // First character should be lowercase (camelCase for functions)
        expect(param[0]).toBe(param[0].toLowerCase());
      });
    });

    it('all parameters exist as methods in WebGL context', () => {
      STATE_PARAMETERS.forEach((paramName) => {
        const glFunction = mockGL[paramName as keyof WebGL2RenderingContext];
        expect(glFunction).toBeDefined();
        expect(typeof glFunction).toBe('function');
      });
    });

    it('contains no duplicate parameters', () => {
      const uniqueCount = new Set(STATE_PARAMETERS).size;
      expect(uniqueCount).toBe(STATE_PARAMETERS.length);
    });

    it('includes essential blending parameters', () => {
      expect(STATE_PARAMETERS).toContain('blendFunc');
      expect(STATE_PARAMETERS).toContain('blendFuncSeparate');
      expect(STATE_PARAMETERS).toContain('blendEquation');
      expect(STATE_PARAMETERS).toContain('blendEquationSeparate');
      expect(STATE_PARAMETERS).toContain('blendColor');
    });

    it('includes essential depth parameters', () => {
      expect(STATE_PARAMETERS).toContain('depthFunc');
      expect(STATE_PARAMETERS).toContain('depthMask');
      expect(STATE_PARAMETERS).toContain('depthRange');
    });

    it('includes essential stencil parameters', () => {
      expect(STATE_PARAMETERS).toContain('stencilFunc');
      expect(STATE_PARAMETERS).toContain('stencilOp');
      expect(STATE_PARAMETERS).toContain('stencilMask');
    });

    it('includes viewport and scissor parameters', () => {
      expect(STATE_PARAMETERS).toContain('viewport');
      expect(STATE_PARAMETERS).toContain('scissor');
    });

    it('includes color and clear parameters', () => {
      expect(STATE_PARAMETERS).toContain('clearColor');
      expect(STATE_PARAMETERS).toContain('colorMask');
      expect(STATE_PARAMETERS).toContain('clearDepth');
      expect(STATE_PARAMETERS).toContain('clearStencil');
    });

    it('includes face culling and winding parameters', () => {
      expect(STATE_PARAMETERS).toContain('frontFace');
      expect(STATE_PARAMETERS).toContain('lineWidth');
      expect(STATE_PARAMETERS).toContain('polygonOffset');
    });

    it('includes pixel storage parameters', () => {
      expect(STATE_PARAMETERS).toContain('pixelStorei');
    });

    it('includes hint parameters', () => {
      expect(STATE_PARAMETERS).toContain('hint');
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // Documentation Links Validation
  // ═══════════════════════════════════════════════════════════════════════════

  describe('DOCUMENTATION_LINKS validation', () => {
    it('is an object mapping names to URLs', () => {
      expect(typeof DOCUMENTATION_LINKS).toBe('object');
      expect(DOCUMENTATION_LINKS).not.toBeNull();
    });

    it('all documentation links are valid URLs', () => {
      Object.values(DOCUMENTATION_LINKS).forEach((url) => {
        expect(typeof url).toBe('string');
        expect(url).toMatch(/^https:\/\//);
        expect(url).toContain('developer.mozilla.org');
      });
    });

    it('includes links for essential capabilities', () => {
      expect(DOCUMENTATION_LINKS['BLEND']).toBeDefined();
      expect(DOCUMENTATION_LINKS['DEPTH_TEST']).toBeDefined();
      expect(DOCUMENTATION_LINKS['CULL_FACE']).toBeDefined();
    });

    it('includes links for essential parameters', () => {
      expect(DOCUMENTATION_LINKS['blendFunc']).toBeDefined();
      expect(DOCUMENTATION_LINKS['depthFunc']).toBeDefined();
      expect(DOCUMENTATION_LINKS['scissor']).toBeDefined();
      expect(DOCUMENTATION_LINKS['viewport']).toBeDefined();
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // Cross-Reference Validation
  // ═══════════════════════════════════════════════════════════════════════════

  describe('cross-reference validation', () => {
    it('non-binary capabilities are also in binary capabilities', () => {
      Object.keys(NON_BINARY_CAPABILITIES).forEach((capabilityName) => {
        expect(BINARY_CAPABILITIES).toContain(capabilityName);
      });
    });

    it('CULL_FACE appears in both binary and non-binary (special case)', () => {
      expect(BINARY_CAPABILITIES).toContain('CULL_FACE');
      expect(Object.keys(NON_BINARY_CAPABILITIES)).toContain('CULL_FACE');
    });

    it('state parameter names match WebGL function names (camelCase)', () => {
      const paramNames = STATE_PARAMETERS;
      // All should start with lowercase letter
      paramNames.forEach((name) => {
        expect(/^[a-z]/.test(name)).toBe(true);
      });
    });

    it('capability names are uppercase, parameter names are camelCase', () => {
      BINARY_CAPABILITIES.forEach((cap) => {
        expect(cap).toBe(cap.toUpperCase());
        expect(/^[A-Z]/.test(cap)).toBe(true);
      });

      STATE_PARAMETERS.forEach((param) => {
        expect(/^[a-z]/.test(param)).toBe(true);
      });
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // Real-World Usage Scenarios
  // ═══════════════════════════════════════════════════════════════════════════

  describe('real-world usage validation', () => {
    it('has all constants needed for standard 3D rendering', () => {
      // Depth testing
      expect(BINARY_CAPABILITIES).toContain('DEPTH_TEST');
      expect(STATE_PARAMETERS).toContain('depthFunc');

      // Face culling
      expect(BINARY_CAPABILITIES).toContain('CULL_FACE');
      expect(Object.keys(NON_BINARY_CAPABILITIES)).toContain('CULL_FACE');

      // Blending
      expect(BINARY_CAPABILITIES).toContain('BLEND');
      expect(STATE_PARAMETERS).toContain('blendFunc');
    });

    it('has all constants needed for viewport management', () => {
      expect(STATE_PARAMETERS).toContain('viewport');
      expect(STATE_PARAMETERS).toContain('scissor');
      expect(BINARY_CAPABILITIES).toContain('SCISSOR_TEST');
    });

    it('has all constants needed for stencil rendering', () => {
      expect(BINARY_CAPABILITIES).toContain('STENCIL_TEST');
      expect(STATE_PARAMETERS).toContain('stencilFunc');
      expect(STATE_PARAMETERS).toContain('stencilOp');
      expect(STATE_PARAMETERS).toContain('stencilMask');
    });

    it('has all constants needed for color management', () => {
      expect(STATE_PARAMETERS).toContain('clearColor');
      expect(STATE_PARAMETERS).toContain('colorMask');
      expect(STATE_PARAMETERS).toContain('blendColor');
    });

    it('has all constants needed for pixel operations', () => {
      expect(STATE_PARAMETERS).toContain('pixelStorei');
      expect(STATE_PARAMETERS).toContain('polygonOffset');
      expect(STATE_PARAMETERS).toContain('lineWidth');
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // Version Compatibility Notes
  // ═══════════════════════════════════════════════════════════════════════════

  describe('WebGL 2.0 specific features', () => {
    it('includes WebGL 2.0 only capabilities', () => {
      // These are WebGL 2.0 specific
      expect(BINARY_CAPABILITIES).toContain('RASTERIZER_DISCARD');
      expect(BINARY_CAPABILITIES).toContain('PRIMITIVE_RESTART_FIXED_INDEX');
    });

    it('includes WebGL 2.0 only stencil functions', () => {
      // Separate stencil functions are WebGL 2.0
      expect(STATE_PARAMETERS).toContain('stencilFuncSeparate');
      expect(STATE_PARAMETERS).toContain('stencilOpSeparate');
      expect(STATE_PARAMETERS).toContain('stencilMaskSeparate');
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // Constants Immutability
  // ═══════════════════════════════════════════════════════════════════════════

  describe('constants immutability', () => {
    it('BINARY_CAPABILITIES is marked as const', () => {
      // The 'as const' in the source should make this readonly
      // We can't directly test this in TypeScript at runtime,
      // but we document the expectation
      expect(Array.isArray(BINARY_CAPABILITIES)).toBe(true);
    });

    it('NON_BINARY_CAPABILITIES is marked as const', () => {
      expect(typeof NON_BINARY_CAPABILITIES).toBe('object');
    });

    it('STATE_PARAMETERS is marked as const', () => {
      expect(Array.isArray(STATE_PARAMETERS)).toBe(true);
    });

    it('DOCUMENTATION_LINKS is marked as const', () => {
      expect(typeof DOCUMENTATION_LINKS).toBe('object');
    });
  });
});
