import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BasicMaterial, BasicMaterialOptions } from '../../src/materials/BasicMaterial.js';
import { Side, BlendMode } from '../../src/materials/Material.js';
import { GLContext } from '../../src/core/GLContext.js';
import { WebGLState } from '../../src/core/WebGLState.js';

describe('BasicMaterial', () => {
  let mockGL: any;
  let mockState: Partial<WebGLState>;
  let mockProgram: any;
  let mockCtx: Partial<GLContext>;
  let mockWebGLProgram: WebGLProgram;
  let mockVertexShader: WebGLShader;
  let mockFragmentShader: WebGLShader;

  beforeEach(() => {
    mockWebGLProgram = {} as WebGLProgram;
    mockVertexShader = {} as WebGLShader;
    mockFragmentShader = {} as WebGLShader;

    mockGL = {
      // Constants
      BACK: 0x0405,
      FRONT: 0x0404,
      SRC_ALPHA: 0x0302,
      ONE_MINUS_SRC_ALPHA: 0x0303,
      ONE_MINUS_SRC_COLOR: 0x0301,
      ONE: 1,
      DST_COLOR: 0x0306,
      ZERO: 0,
      FUNC_ADD: 0x8006,
      VERTEX_SHADER: 0x8b31,
      FRAGMENT_SHADER: 0x8b30,
      COMPILE_STATUS: 0x8b81,
      LINK_STATUS: 0x8b82,
      ACTIVE_UNIFORMS: 0x8b86,
      ACTIVE_ATTRIBUTES: 0x8b89,
      CURRENT_PROGRAM: 0x8b8d,
      NO_ERROR: 0,

      // Shader/program creation
      createShader: vi.fn((type) => (type === 0x8b31 ? mockVertexShader : mockFragmentShader)),
      shaderSource: vi.fn(),
      compileShader: vi.fn(),
      getShaderParameter: vi.fn(() => true),
      getShaderInfoLog: vi.fn(() => ''),
      createProgram: vi.fn(() => mockWebGLProgram),
      attachShader: vi.fn(),
      linkProgram: vi.fn(),
      getProgramParameter: vi.fn((program, pname) => {
        if (pname === 0x8b82) return true; // LINK_STATUS
        if (pname === 0x8b86) return 0; // ACTIVE_UNIFORMS
        if (pname === 0x8b89) return 0; // ACTIVE_ATTRIBUTES
        return false;
      }),
      getProgramInfoLog: vi.fn(() => ''),
      getAttribLocation: vi.fn(() => 0),
      getUniformLocation: vi.fn(() => ({})),
      deleteShader: vi.fn(),
      deleteProgram: vi.fn(),
      useProgram: vi.fn(),
      uniform1f: vi.fn(),
      uniform1i: vi.fn(),
      uniform2f: vi.fn(),
      uniform3f: vi.fn(),
      uniform4f: vi.fn(),
      uniform4fv: vi.fn(),
      uniformMatrix4fv: vi.fn(),
      getError: vi.fn(() => 0),
    };

    mockState = {
      enableDepthTest: vi.fn(),
      disableDepthTest: vi.fn(),
      setDepthMask: vi.fn(),
      enableCullFace: vi.fn(),
      disableCullFace: vi.fn(),
      setCullFaceBack: vi.fn(),
      setCullFaceFront: vi.fn(),
      enableBlend: vi.fn(),
      disableBlend: vi.fn(),
      setBlendFunc: vi.fn(),
      setBlendFuncSeparate: vi.fn(),
      setBlendEquation: vi.fn(),
      setBlendEquationSeparate: vi.fn(),
      setBlendColor: vi.fn(),
    };

    mockCtx = {
      gl: mockGL as WebGL2RenderingContext,
      state: mockState as WebGLState,
      createProgram: vi.fn(() => mockWebGLProgram),
      registerProgram: vi.fn(),
      checkError: vi.fn(),
      queryCurrentProgram: vi.fn(() => mockWebGLProgram),
    };
  });

  const createMaterial = (options?: BasicMaterialOptions) =>
    new BasicMaterial(mockCtx as GLContext, options);

  // ===========================================================================
  // Construction
  // ===========================================================================

  describe('construction', () => {
    it('creates with default white color', () => {
      const material = createMaterial();
      expect(material.color).toEqual([1, 1, 1, 1]);
    });

    it('creates with hex color', () => {
      const material = createMaterial({ color: 0xff0000 });
      expect(material.color).toEqual([1, 0, 0, 1]);
    });

    it('creates with RGBA array', () => {
      const material = createMaterial({ color: [0.5, 0.5, 0.5, 0.8] });
      expect(material.color).toEqual([0.5, 0.5, 0.5, 0.8]);
    });

    it('creates with vertexColors enabled', () => {
      const material = createMaterial({ vertexColors: true });
      expect(material.vertexColors).toBe(true);
    });

    it('creates with vertexColorFactor', () => {
      const material = createMaterial({ vertexColorFactor: 0.25 });
      expect(material.vertexColorFactor).toBeCloseTo(0.25);
    });

    it('creates its own program', () => {
      createMaterial();
      expect(mockCtx.createProgram).toHaveBeenCalled();
    });

    it('has wireframe property defaulting to false', () => {
      const material = createMaterial();
      expect(material.wireframe).toBe(false);
    });

    it('inherits Material default properties', () => {
      const material = createMaterial();
      expect(material.visible).toBe(true);
      expect(material.transparent).toBe(false);
      expect(material.side).toBe(Side.Front);
      expect(material.depthTest).toBe(true);
      expect(material.depthWrite).toBe(true);
      expect(material.blendMode).toBe(BlendMode.None);
    });
  });

  // ===========================================================================
  // Color Parsing
  // ===========================================================================

  describe('color parsing', () => {
    it('parses hex 0x00ff00 to green', () => {
      const material = createMaterial({ color: 0x00ff00 });
      expect(material.color).toEqual([0, 1, 0, 1]);
    });

    it('parses hex 0x0000ff to blue', () => {
      const material = createMaterial({ color: 0x0000ff });
      expect(material.color).toEqual([0, 0, 1, 1]);
    });

    it('parses hex 0x808080 to gray', () => {
      const material = createMaterial({ color: 0x808080 });
      expect(material.color[0]).toBeCloseTo(0.502, 2);
      expect(material.color[1]).toBeCloseTo(0.502, 2);
      expect(material.color[2]).toBeCloseTo(0.502, 2);
    });

    it('respects alpha in RGBA array', () => {
      const material = createMaterial({ color: [1, 0, 0, 0.3] });
      expect(material.color[3]).toBe(0.3);
    });

    it('uses default opacity 1.0 when not specified', () => {
      const material = createMaterial({ color: 0xff0000 });
      expect(material.color[3]).toBe(1.0);
    });

    it('defaults alpha to 1.0 when RGBA array is missing alpha', () => {
      const material = createMaterial({
        color: [0.2, 0.4, 0.6] as unknown as [number, number, number, number],
      });
      expect(material.color[3]).toBe(1.0);
    });
  });

  // ===========================================================================
  // Property Getters/Setters
  // ===========================================================================

  describe('property getters/setters', () => {
    it('color setter accepts hex number', () => {
      const material = createMaterial();
      material.color = 0x00ff00;
      expect(material.color).toEqual([0, 1, 0, 1]);
    });

    it('color setter accepts RGBA array', () => {
      const material = createMaterial();
      material.color = [0.2, 0.4, 0.6, 0.8];
      expect(material.color).toEqual([0.2, 0.4, 0.6, 0.8]);
    });

    it('opacity getter returns alpha component', () => {
      const material = createMaterial({ color: [1, 0, 0, 0.7] });
      expect(material.opacity).toBe(0.7);
    });

    it('opacity setter updates alpha component', () => {
      const material = createMaterial();
      material.opacity = 0.3;
      expect(material.opacity).toBe(0.3);
      expect(material.color[3]).toBe(0.3);
    });

    it('opacity is clamped to 0-1 range', () => {
      const material = createMaterial();
      material.opacity = 1.5;
      expect(material.opacity).toBe(1.0);
      material.opacity = -0.5;
      expect(material.opacity).toBe(0.0);
    });

    it('vertexColors getter/setter works', () => {
      const material = createMaterial();
      expect(material.vertexColors).toBe(false);
      material.vertexColors = true;
      expect(material.vertexColors).toBe(true);
    });

    it('vertexColorFactor getter/setter works', () => {
      const material = createMaterial();
      material.vertexColorFactor = 0.6;
      expect(material.vertexColorFactor).toBeCloseTo(0.6);
    });

    it('vertexColorFactor is clamped to 0-1 range', () => {
      const material = createMaterial();
      material.vertexColorFactor = 2;
      expect(material.vertexColorFactor).toBe(1);
      material.vertexColorFactor = -1;
      expect(material.vertexColorFactor).toBe(0);
    });

    it('wireframe property can be set', () => {
      const material = createMaterial();
      material.wireframe = true;
      expect(material.wireframe).toBe(true);
    });

    it('color getter returns copy of internal array', () => {
      const material = createMaterial({ color: [1, 0, 0, 1] });
      const color1 = material.color;
      const color2 = material.color;
      expect(color1).not.toBe(color2);
      expect(color1).toEqual(color2);
    });
  });

  // ===========================================================================
  // use()
  // ===========================================================================

  describe('use()', () => {
    it('activates the program', () => {
      const material = createMaterial();
      material.use();
      expect(mockGL.useProgram).toHaveBeenCalledWith(mockWebGLProgram);
    });

    it('returns this for chaining', () => {
      const material = createMaterial();
      expect(material.use()).toBe(material);
    });

    it('throws when disposed', () => {
      const material = createMaterial();
      material.dispose();
      expect(() => material.use()).toThrow(/\[RES_001\]/);
    });

    it('applies depth test state', () => {
      const material = createMaterial();
      material.depthTest = true;
      material.use();
      expect(mockState.enableDepthTest).toHaveBeenCalled();
    });

    it('applies depth write state', () => {
      const material = createMaterial();
      material.depthWrite = false;
      material.use();
      expect(mockState.setDepthMask).toHaveBeenCalledWith(false);
    });

    it('applies face culling for Side.Front', () => {
      const material = createMaterial();
      material.side = Side.Front;
      material.use();
      expect(mockState.setCullFaceBack).toHaveBeenCalled();
    });

    it('applies face culling for Side.Double', () => {
      const material = createMaterial();
      material.side = Side.Double;
      material.use();
      expect(mockState.disableCullFace).toHaveBeenCalled();
    });

    it('applies blending for BlendMode.Normal', () => {
      const material = createMaterial();
      material.blendMode = BlendMode.Normal;
      material.use();
      expect(mockState.enableBlend).toHaveBeenCalled();
      expect(mockState.setBlendFunc).toHaveBeenCalledWith(
        mockGL.SRC_ALPHA,
        mockGL.ONE_MINUS_SRC_ALPHA,
      );
    });

    it('uploads uColor uniform', () => {
      const material = createMaterial({ color: [0.5, 0.2, 0.8, 1.0] });
      material.use();
      expect(mockGL.uniform4f).toHaveBeenCalled();
    });

    it('uploads uVertexColorFactor uniform', () => {
      const material = createMaterial({ vertexColors: true });
      material.use();
      // Should upload 1 for true
      expect(mockGL.uniform1f).toHaveBeenCalled();
    });
  });

  // ===========================================================================
  // dispose()
  // ===========================================================================

  describe('dispose()', () => {
    it('disposes the owned program', () => {
      const material = createMaterial();
      material.dispose();
      expect(mockGL.deleteProgram).toHaveBeenCalledWith(mockWebGLProgram);
    });

    it('sets disposed flag', () => {
      const material = createMaterial();
      expect(material.isDisposed).toBe(false);
      material.dispose();
      expect(material.isDisposed).toBe(true);
    });

    it('is idempotent', () => {
      const material = createMaterial();
      material.dispose();
      material.dispose(); // Should not throw
      expect(material.isDisposed).toBe(true);
    });

    it('program getter throws after disposal', () => {
      const material = createMaterial();
      material.dispose();
      expect(() => material.program).toThrow(/\[RES_001\]/);
    });
  });

  // ===========================================================================
  // Uniform Updates
  // ===========================================================================

  describe('uniform updates', () => {
    it('color setter updates uColor uniform', () => {
      const material = createMaterial();
      material.color = 0x00ff00;
      expect(material.hasUniform('uColor')).toBe(true);
      expect(material.getUniform('uColor')).toEqual([0, 1, 0, 1]);
    });

    it('opacity setter updates uColor uniform', () => {
      const material = createMaterial({ color: [1, 0, 0, 1] });
      material.opacity = 0.5;
      const color = material.getUniform('uColor') as number[];
      expect(color[3]).toBe(0.5);
    });

    it('vertexColors setter updates uVertexColorFactor uniform', () => {
      const material = createMaterial();
      material.vertexColors = true;
      expect(material.getUniform('uVertexColorFactor')).toBe(1);
      material.vertexColors = false;
      expect(material.getUniform('uVertexColorFactor')).toBe(0);
    });
  });

  // ===========================================================================
  // Resource Name
  // ===========================================================================

  describe('resource name', () => {
    it('reports BasicMaterial in error messages', () => {
      const material = createMaterial();
      material.dispose();
      try {
        material.use();
      } catch (e: any) {
        expect(e.message).toContain('BasicMaterial');
      }
    });
  });
});
