import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Material, Side, BlendMode } from '../../src/materials/Material.js';
import { GLContext } from '../../src/core/GLContext.js';
import { Program } from '../../src/resources/Program.js';
import { WebGLState } from '../../src/core/WebGLState.js';

describe('Material', () => {
  let mockGL: any;
  let mockState: Partial<WebGLState>;
  let mockProgram: Partial<Program>;
  let mockCtx: Partial<GLContext>;

  beforeEach(() => {
    mockGL = {
      BACK: 0x0405,
      FRONT: 0x0404,
      SRC_ALPHA: 0x0302,
      ONE_MINUS_SRC_ALPHA: 0x0303,
      ONE_MINUS_SRC_COLOR: 0x0301,
      ONE: 1,
      DST_COLOR: 0x0306,
      ZERO: 0,
      FUNC_ADD: 0x8006,
      FUNC_REVERSE_SUBTRACT: 0x800b,
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

    mockProgram = {
      isDisposed: false,
      use: vi.fn().mockReturnThis(),
      setUniform1f: vi.fn().mockReturnThis(),
      setUniform1i: vi.fn().mockReturnThis(),
      setUniform2f: vi.fn().mockReturnThis(),
      setUniform3f: vi.fn().mockReturnThis(),
      setUniform4f: vi.fn().mockReturnThis(),
      setUniform1fv: vi.fn().mockReturnThis(),
      setUniform2fv: vi.fn().mockReturnThis(),
      setUniform3fv: vi.fn().mockReturnThis(),
      setUniform4fv: vi.fn().mockReturnThis(),
      setUniform1iv: vi.fn().mockReturnThis(),
      setUniform2iv: vi.fn().mockReturnThis(),
      setUniform3iv: vi.fn().mockReturnThis(),
      setUniform4iv: vi.fn().mockReturnThis(),
      setUniform1uiv: vi.fn().mockReturnThis(),
      setUniformMatrix3fv: vi.fn().mockReturnThis(),
      setUniformMatrix4fv: vi.fn().mockReturnThis(),
    };

    mockCtx = {
      gl: mockGL as WebGL2RenderingContext,
      state: mockState as WebGLState,
    };
  });

  const createMaterial = () => new Material(mockCtx as GLContext, mockProgram as Program);

  // ===========================================================================
  // Construction
  // ===========================================================================

  describe('construction', () => {
    it('creates with program reference', () => {
      const material = createMaterial();
      expect(material.program).toBe(mockProgram);
    });

    it('has default property values', () => {
      const material = createMaterial();
      expect(material.visible).toBe(true);
      expect(material.transparent).toBe(false);
      expect(material.side).toBe(Side.Front);
      expect(material.depthTest).toBe(true);
      expect(material.depthWrite).toBe(true);
      expect(material.blendMode).toBe(BlendMode.None);
      expect(material.blendState).toBeNull();
      expect(material.renderOrder).toBe(0);
      expect(material.isDisposed).toBe(false);
    });

    it('starts with no uniforms', () => {
      const material = createMaterial();
      expect(material.uniformNames).toEqual([]);
    });
  });

  // ===========================================================================
  // Uniform Management
  // ===========================================================================

  describe('uniform management', () => {
    it('setUniform stores value and returns this', () => {
      const material = createMaterial();
      const result = material.setUniform('uColor', [1, 0, 0, 1]);
      expect(result).toBe(material);
      expect(material.hasUniform('uColor')).toBe(true);
    });

    it('getUniform retrieves stored value', () => {
      const material = createMaterial();
      const color = [1, 0.5, 0, 1];
      material.setUniform('uColor', color);
      expect(material.getUniform('uColor')).toBe(color);
    });

    it('getUniform returns undefined for unknown uniform', () => {
      const material = createMaterial();
      expect(material.getUniform('uUnknown')).toBeUndefined();
    });

    it('hasUniform returns correct boolean', () => {
      const material = createMaterial();
      expect(material.hasUniform('uTest')).toBe(false);
      material.setUniform('uTest', 1.0);
      expect(material.hasUniform('uTest')).toBe(true);
    });

    it('removeUniform removes value and returns this', () => {
      const material = createMaterial();
      material.setUniform('uTest', 1.0);
      const result = material.removeUniform('uTest');
      expect(result).toBe(material);
      expect(material.hasUniform('uTest')).toBe(false);
    });

    it('uniformNames returns all stored uniform names', () => {
      const material = createMaterial();
      material.setUniform('uColor', [1, 0, 0, 1]);
      material.setUniform('uOpacity', 0.5);
      material.setUniform('uMatrix', new Float32Array(16));

      const names = material.uniformNames;
      expect(names).toContain('uColor');
      expect(names).toContain('uOpacity');
      expect(names).toContain('uMatrix');
      expect(names.length).toBe(3);
    });

    it('setUniform throws when disposed', () => {
      const material = createMaterial();
      material.dispose();
      expect(() => material.setUniform('uTest', 1.0)).toThrow(/\[RES_001\]/);
    });
  });

  // ===========================================================================
  // use() - Program Activation
  // ===========================================================================

  describe('use() - program activation', () => {
    it('activates the program', () => {
      const material = createMaterial();
      material.use();
      expect(mockProgram.use).toHaveBeenCalled();
    });

    it('throws when disposed', () => {
      const material = createMaterial();
      material.dispose();
      expect(() => material.use()).toThrow(/\[RES_001\]/);
    });

    it('returns this for chaining', () => {
      const material = createMaterial();
      expect(material.use()).toBe(material);
    });
  });

  // ===========================================================================
  // use() - Depth State
  // ===========================================================================

  describe('use() - depth state', () => {
    it('enables depth test when depthTest is true', () => {
      const material = createMaterial();
      material.depthTest = true;
      material.use();
      expect(mockState.enableDepthTest).toHaveBeenCalled();
    });

    it('disables depth test when depthTest is false', () => {
      const material = createMaterial();
      material.depthTest = false;
      material.use();
      expect(mockState.disableDepthTest).toHaveBeenCalled();
    });

    it('enables depth write when depthWrite is true', () => {
      const material = createMaterial();
      material.depthWrite = true;
      material.use();
      expect(mockState.setDepthMask).toHaveBeenCalledWith(true);
    });

    it('disables depth write when depthWrite is false', () => {
      const material = createMaterial();
      material.depthWrite = false;
      material.use();
      expect(mockState.setDepthMask).toHaveBeenCalledWith(false);
    });
  });

  // ===========================================================================
  // use() - Face Culling
  // ===========================================================================

  describe('use() - face culling', () => {
    it('enables culling and culls back faces for Side.Front', () => {
      const material = createMaterial();
      material.side = Side.Front;
      material.use();
      expect(mockState.setCullFaceBack).toHaveBeenCalled();
    });

    it('enables culling and culls front faces for Side.Back', () => {
      const material = createMaterial();
      material.side = Side.Back;
      material.use();
      expect(mockState.setCullFaceFront).toHaveBeenCalled();
    });

    it('disables culling for Side.Double', () => {
      const material = createMaterial();
      material.side = Side.Double;
      material.use();
      expect(mockState.disableCullFace).toHaveBeenCalled();
    });
  });

  // ===========================================================================
  // use() - Blending
  // ===========================================================================

  describe('use() - blending', () => {
    it('disables blending for BlendMode.None', () => {
      const material = createMaterial();
      material.blendMode = BlendMode.None;
      material.use();
      expect(mockState.disableBlend).toHaveBeenCalled();
    });

    it('enables normal blending for BlendMode.Normal', () => {
      const material = createMaterial();
      material.blendMode = BlendMode.Normal;
      material.use();
      expect(mockState.enableBlend).toHaveBeenCalled();
      expect(mockState.setBlendEquation).toHaveBeenCalledWith(mockGL.FUNC_ADD);
      expect(mockState.setBlendFunc).toHaveBeenCalledWith(
        mockGL.SRC_ALPHA,
        mockGL.ONE_MINUS_SRC_ALPHA,
      );
    });

    it('enables additive blending for BlendMode.Additive', () => {
      const material = createMaterial();
      material.blendMode = BlendMode.Additive;
      material.use();
      expect(mockState.enableBlend).toHaveBeenCalled();
      expect(mockState.setBlendEquation).toHaveBeenCalledWith(mockGL.FUNC_ADD);
      expect(mockState.setBlendFunc).toHaveBeenCalledWith(
        mockGL.SRC_ALPHA,
        mockGL.ONE,
      );
    });

    it('enables multiply blending for BlendMode.Multiply', () => {
      const material = createMaterial();
      material.blendMode = BlendMode.Multiply;
      material.use();
      expect(mockState.enableBlend).toHaveBeenCalled();
      expect(mockState.setBlendEquation).toHaveBeenCalledWith(mockGL.FUNC_ADD);
      expect(mockState.setBlendFunc).toHaveBeenCalledWith(
        mockGL.DST_COLOR,
        mockGL.ZERO,
      );
    });

    it('enables premultiplied blending for BlendMode.Premultiplied', () => {
      const material = createMaterial();
      material.blendMode = BlendMode.Premultiplied;
      material.use();
      expect(mockState.enableBlend).toHaveBeenCalled();
      expect(mockState.setBlendEquation).toHaveBeenCalledWith(mockGL.FUNC_ADD);
      expect(mockState.setBlendFunc).toHaveBeenCalledWith(
        mockGL.ONE,
        mockGL.ONE_MINUS_SRC_ALPHA,
      );
    });

    it('enables screen blending for BlendMode.Screen', () => {
      const material = createMaterial();
      material.blendMode = BlendMode.Screen;
      material.use();
      expect(mockState.enableBlend).toHaveBeenCalled();
      expect(mockState.setBlendEquation).toHaveBeenCalledWith(mockGL.FUNC_ADD);
      expect(mockState.setBlendFunc).toHaveBeenCalledWith(
        mockGL.ONE,
        mockGL.ONE_MINUS_SRC_COLOR,
      );
    });

    it('enables subtractive blending for BlendMode.Subtractive', () => {
      const material = createMaterial();
      material.blendMode = BlendMode.Subtractive;
      material.use();
      expect(mockState.enableBlend).toHaveBeenCalled();
      expect(mockState.setBlendEquation).toHaveBeenCalledWith(mockGL.FUNC_REVERSE_SUBTRACT);
      expect(mockState.setBlendFunc).toHaveBeenCalledWith(
        mockGL.ONE,
        mockGL.ONE,
      );
    });
  });

  // ===========================================================================
  // applyState()
  // ===========================================================================

  describe('applyState()', () => {
    it('returns this for chaining', () => {
      const material = createMaterial();
      expect(material.applyState()).toBe(material);
    });

    it('throws when disposed', () => {
      const material = createMaterial();
      material.dispose();
      expect(() => material.applyState()).toThrow(/\[RES_001\]/);
    });

    it('applies depth test state', () => {
      const material = createMaterial();
      material.depthTest = true;
      material.applyState();
      expect(mockState.enableDepthTest).toHaveBeenCalled();
    });

    it('applies depth mask state', () => {
      const material = createMaterial();
      material.depthWrite = false;
      material.applyState();
      expect(mockState.setDepthMask).toHaveBeenCalledWith(false);
    });

    it('applies face culling for Side.Front', () => {
      const material = createMaterial();
      material.side = Side.Front;
      material.applyState();
      expect(mockState.setCullFaceBack).toHaveBeenCalled();
    });

    it('applies face culling for Side.Back', () => {
      const material = createMaterial();
      material.side = Side.Back;
      material.applyState();
      expect(mockState.setCullFaceFront).toHaveBeenCalled();
    });

    it('disables culling for Side.Double', () => {
      const material = createMaterial();
      material.side = Side.Double;
      material.applyState();
      expect(mockState.disableCullFace).toHaveBeenCalled();
    });

    it('applies blend mode None', () => {
      const material = createMaterial();
      material.blendMode = BlendMode.None;
      material.applyState();
      expect(mockState.disableBlend).toHaveBeenCalled();
    });

    it('applies blend mode Normal', () => {
      const material = createMaterial();
      material.blendMode = BlendMode.Normal;
      material.applyState();
      expect(mockState.enableBlend).toHaveBeenCalled();
      expect(mockState.setBlendEquation).toHaveBeenCalledWith(mockGL.FUNC_ADD);
      expect(mockState.setBlendFunc).toHaveBeenCalledWith(
        mockGL.SRC_ALPHA,
        mockGL.ONE_MINUS_SRC_ALPHA,
      );
    });

    it('uses blendState when provided', () => {
      const material = createMaterial();
      material.blendMode = BlendMode.None;
      material.blendState = {
        blendFunc: { src: mockGL.ONE, dst: mockGL.ZERO },
        blendEquation: mockGL.FUNC_ADD,
      };

      material.applyState();

      expect(mockState.enableBlend).toHaveBeenCalled();
      expect(mockState.setBlendEquation).toHaveBeenCalledWith(mockGL.FUNC_ADD);
      expect(mockState.setBlendFunc).toHaveBeenCalledWith(mockGL.ONE, mockGL.ZERO);
    });

    it('disables blending when blendState.enabled is false', () => {
      const material = createMaterial();
      material.blendMode = BlendMode.Additive;
      material.blendState = { enabled: false };

      material.applyState();

      expect(mockState.disableBlend).toHaveBeenCalled();
      expect(mockState.setBlendFunc).not.toHaveBeenCalled();
    });

    it('applies separate blend functions and equations when provided', () => {
      const material = createMaterial();
      material.blendState = {
        blendFuncSeparate: {
          srcRGB: mockGL.SRC_ALPHA,
          dstRGB: mockGL.ONE_MINUS_SRC_ALPHA,
          srcAlpha: mockGL.ONE,
          dstAlpha: mockGL.ONE_MINUS_SRC_ALPHA,
        },
        blendEquationSeparate: {
          modeRGB: mockGL.FUNC_ADD,
          modeAlpha: mockGL.FUNC_ADD,
        },
        blendColor: { r: 0.1, g: 0.2, b: 0.3, a: 0.4 },
      };

      material.applyState();

      expect(mockState.enableBlend).toHaveBeenCalled();
      expect(mockState.setBlendColor).toHaveBeenCalledWith(0.1, 0.2, 0.3, 0.4);
      expect(mockState.setBlendEquationSeparate).toHaveBeenCalledWith(
        mockGL.FUNC_ADD,
        mockGL.FUNC_ADD,
      );
      expect(mockState.setBlendFuncSeparate).toHaveBeenCalledWith(
        mockGL.SRC_ALPHA,
        mockGL.ONE_MINUS_SRC_ALPHA,
        mockGL.ONE,
        mockGL.ONE_MINUS_SRC_ALPHA,
      );
    });

    it('does not activate the program', () => {
      const material = createMaterial();
      material.applyState();
      expect(mockProgram.use).not.toHaveBeenCalled();
    });

    it('does not upload uniforms', () => {
      const material = createMaterial();
      material.setUniform('uTest', 1.0);
      material.applyState();
      expect(mockProgram.setUniform1f).not.toHaveBeenCalled();
    });
  });

  // ===========================================================================
  // applyUniforms()
  // ===========================================================================

  describe('applyUniforms()', () => {
    it('returns this for chaining', () => {
      const material = createMaterial();
      expect(material.applyUniforms()).toBe(material);
    });

    it('throws when disposed', () => {
      const material = createMaterial();
      material.dispose();
      expect(() => material.applyUniforms()).toThrow(/\[RES_001\]/);
    });

    it('uploads stored uniforms', () => {
      const material = createMaterial();
      material.setUniform('uTime', 1.5);
      material.setUniform('uColor', [1, 0, 0, 1]);
      material.applyUniforms();
      expect(mockProgram.setUniform1f).toHaveBeenCalledWith('uTime', 1.5);
      expect(mockProgram.setUniform4f).toHaveBeenCalledWith('uColor', 1, 0, 0, 1);
    });

    it('calls _updateUniforms hook', () => {
      class TestMaterial extends Material {
        hookCalled = false;
        protected override _updateUniforms(): void {
          this.hookCalled = true;
        }
      }

      const material = new TestMaterial(mockCtx as GLContext, mockProgram as Program);
      material.applyUniforms();
      expect(material.hookCalled).toBe(true);
    });

    it('does not activate the program', () => {
      const material = createMaterial();
      material.applyUniforms();
      expect(mockProgram.use).not.toHaveBeenCalled();
    });

    it('does not change render state', () => {
      const material = createMaterial();
      material.applyUniforms();
      expect(mockState.enableDepthTest).not.toHaveBeenCalled();
      expect(mockState.setDepthMask).not.toHaveBeenCalled();
      expect(mockState.setCullFaceBack).not.toHaveBeenCalled();
      expect(mockState.disableBlend).not.toHaveBeenCalled();
    });
  });

  // ===========================================================================
  // use() calls applyState() and applyUniforms()
  // ===========================================================================

  describe('use() composition', () => {
    it('use() applies state and uniforms together', () => {
      const material = createMaterial();
      material.depthTest = false;
      material.blendMode = BlendMode.Additive;
      material.setUniform('uTime', 2.0);

      material.use();

      // State applied
      expect(mockState.disableDepthTest).toHaveBeenCalled();
      expect(mockState.enableBlend).toHaveBeenCalled();
      // Uniforms uploaded
      expect(mockProgram.setUniform1f).toHaveBeenCalledWith('uTime', 2.0);
    });
  });

  // ===========================================================================
  // use() - Uniform Uploading
  // ===========================================================================

  describe('use() - uniform uploading', () => {
    it('uploads scalar number as float', () => {
      const material = createMaterial();
      material.setUniform('uTime', 1.5);
      material.use();
      expect(mockProgram.setUniform1f).toHaveBeenCalledWith('uTime', 1.5);
    });

    it('uploads integer-flagged value as int', () => {
      const material = createMaterial();
      // Int32Array indicates integer type
      material.setUniform('uCount', new Int32Array([5]));
      material.use();
      expect(mockProgram.setUniform1iv).toHaveBeenCalledWith(
        'uCount',
        expect.any(Int32Array),
      );
    });

    it('uploads vec2 array', () => {
      const material = createMaterial();
      material.setUniform('uResolution', [800, 600]);
      material.use();
      expect(mockProgram.setUniform2f).toHaveBeenCalledWith(
        'uResolution',
        800,
        600,
      );
    });

    it('uploads vec3 array', () => {
      const material = createMaterial();
      material.setUniform('uLightPos', [1, 2, 3]);
      material.use();
      expect(mockProgram.setUniform3f).toHaveBeenCalledWith('uLightPos', 1, 2, 3);
    });

    it('uploads vec4 array', () => {
      const material = createMaterial();
      material.setUniform('uColor', [1, 0, 0, 1]);
      material.use();
      expect(mockProgram.setUniform4f).toHaveBeenCalledWith('uColor', 1, 0, 0, 1);
    });

    it('uploads mat3 from 9-element array', () => {
      const material = createMaterial();
      const mat = [1, 0, 0, 0, 1, 0, 0, 0, 1];
      material.setUniform('uNormalMatrix', mat);
      material.use();
      expect(mockProgram.setUniformMatrix3fv).toHaveBeenCalledWith(
        'uNormalMatrix',
        mat,
      );
    });

    it('uploads mat4 from 16-element array', () => {
      const material = createMaterial();
      const mat = new Array(16).fill(0);
      mat[0] = mat[5] = mat[10] = mat[15] = 1;
      material.setUniform('uMVP', mat);
      material.use();
      expect(mockProgram.setUniformMatrix4fv).toHaveBeenCalledWith('uMVP', mat);
    });

    it('uploads Float32Array vec4', () => {
      const material = createMaterial();
      const color = new Float32Array([0.5, 0.5, 0.5, 1]);
      material.setUniform('uColor', color);
      material.use();
      expect(mockProgram.setUniform4fv).toHaveBeenCalledWith('uColor', color);
    });

    it('uploads Float32Array mat4', () => {
      const material = createMaterial();
      const mat = new Float32Array(16);
      mat[0] = mat[5] = mat[10] = mat[15] = 1;
      material.setUniform('uMVP', mat);
      material.use();
      expect(mockProgram.setUniformMatrix4fv).toHaveBeenCalledWith('uMVP', mat);
    });

    it('uploads Int32Array uniforms', () => {
      const material = createMaterial();
      const indices = new Int32Array([0, 1, 2, 3]);
      material.setUniform('uIndices', indices);
      material.use();
      expect(mockProgram.setUniform4iv).toHaveBeenCalledWith('uIndices', indices);
    });

    it('uploads Uint32Array uniforms', () => {
      const material = createMaterial();
      const counts = new Uint32Array([10, 20]);
      material.setUniform('uCounts', counts);
      material.use();
      expect(mockProgram.setUniform2fv).toHaveBeenCalledWith('uCounts', counts);
    });

    it('uploads multiple uniforms in one use() call', () => {
      const material = createMaterial();
      material.setUniform('uTime', 1.0);
      material.setUniform('uColor', [1, 0, 0, 1]);
      material.use();
      expect(mockProgram.setUniform1f).toHaveBeenCalledWith('uTime', 1.0);
      expect(mockProgram.setUniform4f).toHaveBeenCalledWith('uColor', 1, 0, 0, 1);
    });
  });

  // ===========================================================================
  // use() - _updateUniforms Hook
  // ===========================================================================

  describe('use() - _updateUniforms hook', () => {
    it('calls _updateUniforms before uploading', () => {
      // Create subclass to track _updateUniforms call
      class TestMaterial extends Material {
        updateUniformsCalled = false;
        protected override _updateUniforms(): void {
          this.updateUniformsCalled = true;
          this.setUniform('uFromHook', 42);
        }
      }

      const material = new TestMaterial(mockCtx as GLContext, mockProgram as Program);
      material.use();

      expect(material.updateUniformsCalled).toBe(true);
      expect(mockProgram.setUniform1f).toHaveBeenCalledWith('uFromHook', 42);
    });
  });

  // ===========================================================================
  // dispose()
  // ===========================================================================

  describe('dispose()', () => {
    it('clears uniforms', () => {
      const material = createMaterial();
      material.setUniform('uTest', 1.0);
      material.dispose();
      expect(material.uniformNames).toEqual([]);
    });

    it('sets disposed flag', () => {
      const material = createMaterial();
      expect(material.isDisposed).toBe(false);
      material.dispose();
      expect(material.isDisposed).toBe(true);
    });

    it('does not dispose the program (shared)', () => {
      const disposeSpy = vi.fn();
      mockProgram.dispose = disposeSpy;

      const material = createMaterial();
      material.dispose();
      expect(disposeSpy).not.toHaveBeenCalled();
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
  // Property Setters
  // ===========================================================================

  describe('property setters', () => {
    it('allows setting visible', () => {
      const material = createMaterial();
      material.visible = false;
      expect(material.visible).toBe(false);
    });

    it('allows setting transparent', () => {
      const material = createMaterial();
      material.transparent = true;
      expect(material.transparent).toBe(true);
    });

    it('allows setting side', () => {
      const material = createMaterial();
      material.side = Side.Double;
      expect(material.side).toBe(Side.Double);
    });

    it('allows setting depthTest', () => {
      const material = createMaterial();
      material.depthTest = false;
      expect(material.depthTest).toBe(false);
    });

    it('allows setting depthWrite', () => {
      const material = createMaterial();
      material.depthWrite = false;
      expect(material.depthWrite).toBe(false);
    });

    it('allows setting blendMode', () => {
      const material = createMaterial();
      material.blendMode = BlendMode.Additive;
      expect(material.blendMode).toBe(BlendMode.Additive);
    });

    it('allows setting renderOrder', () => {
      const material = createMaterial();
      material.renderOrder = 10;
      expect(material.renderOrder).toBe(10);
    });
  });

  // ===========================================================================
  // Edge Cases
  // ===========================================================================

  describe('edge cases', () => {
    it('handles empty uniform map gracefully', () => {
      const material = createMaterial();
      // No uniforms set
      expect(() => material.use()).not.toThrow();
    });

    it('handles single-element arrays as scalars', () => {
      const material = createMaterial();
      material.setUniform('uSingle', [42]);
      material.use();
      // Single-element array should be treated as scalar
      expect(mockProgram.setUniform1f).toHaveBeenCalledWith('uSingle', 42);
    });

    it('handles Float32Array single element', () => {
      const material = createMaterial();
      material.setUniform('uSingle', new Float32Array([3.14]));
      material.use();
      expect(mockProgram.setUniform1fv).toHaveBeenCalledWith(
        'uSingle',
        expect.any(Float32Array),
      );
    });

    it('uploads Float32Array mat3 (9 elements)', () => {
      const material = createMaterial();
      const mat = new Float32Array(9).fill(1);
      material.setUniform('uMat3', mat);
      material.use();
      expect(mockProgram.setUniformMatrix3fv).toHaveBeenCalledWith('uMat3', mat);
    });

    it('uploads Int32Array vec2', () => {
      const material = createMaterial();
      const vec = new Int32Array([1, 2]);
      material.setUniform('uVec2i', vec);
      material.use();
      expect(mockProgram.setUniform2iv).toHaveBeenCalledWith('uVec2i', vec);
    });

    it('uploads Int32Array vec3', () => {
      const material = createMaterial();
      const vec = new Int32Array([1, 2, 3]);
      material.setUniform('uVec3i', vec);
      material.use();
      expect(mockProgram.setUniform3iv).toHaveBeenCalledWith('uVec3i', vec);
    });

    it('handles Uint32Array with length 1', () => {
      const material = createMaterial();
      const arr = new Uint32Array([5]);
      material.setUniform('uSingle', arr);
      material.use();
      expect(mockProgram.setUniform1fv).toHaveBeenCalledWith('uSingle', arr);
    });

    it('handles Uint32Array vec3', () => {
      const material = createMaterial();
      const arr = new Uint32Array([1, 2, 3]);
      material.setUniform('uVec3u', arr);
      material.use();
      expect(mockProgram.setUniform3fv).toHaveBeenCalledWith('uVec3u', arr);
    });

    it('handles Uint32Array vec4', () => {
      const material = createMaterial();
      const arr = new Uint32Array([1, 2, 3, 4]);
      material.setUniform('uVec4u', arr);
      material.use();
      expect(mockProgram.setUniform4fv).toHaveBeenCalledWith('uVec4u', arr);
    });

    it('handles Float32Array vec2', () => {
      const material = createMaterial();
      const arr = new Float32Array([1.5, 2.5]);
      material.setUniform('uVec2f', arr);
      material.use();
      expect(mockProgram.setUniform2fv).toHaveBeenCalledWith('uVec2f', arr);
    });

    it('handles Float32Array vec3', () => {
      const material = createMaterial();
      const arr = new Float32Array([1, 2, 3]);
      material.setUniform('uVec3f', arr);
      material.use();
      expect(mockProgram.setUniform3fv).toHaveBeenCalledWith('uVec3f', arr);
    });

    it('uploads Float32Array vec4 array when length divisible by 4', () => {
      const material = createMaterial();
      const arr = new Float32Array(8).fill(1);
      material.setUniform('uVec4Array', arr);
      material.use();
      expect(mockProgram.setUniform4fv).toHaveBeenCalledWith('uVec4Array', arr);
    });

    it('uploads Int32Array vec4 array when length divisible by 4', () => {
      const material = createMaterial();
      const arr = new Int32Array(8).fill(1);
      material.setUniform('uVec4iArray', arr);
      material.use();
      expect(mockProgram.setUniform4iv).toHaveBeenCalledWith('uVec4iArray', arr);
    });

    it('uploads Uint32Array vec4 array when length divisible by 4', () => {
      const material = createMaterial();
      const arr = new Uint32Array(8).fill(1);
      material.setUniform('uVec4uArray', arr);
      material.use();
      expect(mockProgram.setUniform4fv).toHaveBeenCalledWith('uVec4uArray', arr);
    });

    it('uploads number[] vec4 array when length divisible by 4', () => {
      const material = createMaterial();
      const arr = new Array(8).fill(0.5);
      material.setUniform('uVec4Array', arr);
      material.use();
      expect(mockProgram.setUniform4fv).toHaveBeenCalledWith('uVec4Array', arr);
    });

    it('ignores empty number[] arrays gracefully', () => {
      const material = createMaterial();
      material.setUniform('uEmpty', []);
      // Should not throw, but also should not upload anything
      expect(() => material.use()).not.toThrow();
    });

    it('ignores oversized arrays gracefully (length > 16)', () => {
      const material = createMaterial();
      // Arrays larger than mat4 (16) are ignored
      material.setUniform('uLarge', new Array(20).fill(1));
      expect(() => material.use()).not.toThrow();
    });

    it('ignores oversized Float32Array gracefully (length > 16)', () => {
      const material = createMaterial();
      material.setUniform('uLargeFloat', new Float32Array(20));
      expect(() => material.use()).not.toThrow();
    });

    it('ignores oversized Int32Array gracefully (length > 4)', () => {
      const material = createMaterial();
      material.setUniform('uLargeInt', new Int32Array(8));
      expect(() => material.use()).not.toThrow();
    });

    it('ignores oversized Uint32Array gracefully (length > 4)', () => {
      const material = createMaterial();
      material.setUniform('uLargeUint', new Uint32Array(8));
      expect(() => material.use()).not.toThrow();
    });
  });

  // ===========================================================================
  // Validation Helpers
  // ===========================================================================

  describe('validation helpers', () => {
    // Test the protected validation methods through a subclass
    class TestMaterial extends Material {
      testValidateFinite(value: number, method: string, label: string): void {
        this._validateFinite(value, method, label);
      }
      testValidateNonNegativeInt(value: number, method: string, label: string): void {
        this._validateNonNegativeInt(value, method, label);
      }
      testValidatePositiveInt(value: number, method: string, label: string): void {
        this._validatePositiveInt(value, method, label);
      }
    }

    const createTestMaterial = () =>
      new TestMaterial(mockCtx as GLContext, mockProgram as Program);

    describe('_validateFinite', () => {
      it('accepts finite numbers', () => {
        const material = createTestMaterial();
        expect(() => material.testValidateFinite(0, 'test', 'value')).not.toThrow();
        expect(() => material.testValidateFinite(42, 'test', 'value')).not.toThrow();
        expect(() => material.testValidateFinite(-100, 'test', 'value')).not.toThrow();
        expect(() => material.testValidateFinite(3.14, 'test', 'value')).not.toThrow();
      });

      it('rejects Infinity', () => {
        const material = createTestMaterial();
        expect(() => material.testValidateFinite(Infinity, 'test', 'value')).toThrow(/\[RES_002\]/);
        expect(() => material.testValidateFinite(-Infinity, 'test', 'value')).toThrow(/\[RES_002\]/);
      });

      it('rejects NaN', () => {
        const material = createTestMaterial();
        expect(() => material.testValidateFinite(NaN, 'test', 'value')).toThrow(/\[RES_002\]/);
      });
    });

    describe('_validateNonNegativeInt', () => {
      it('accepts non-negative integers', () => {
        const material = createTestMaterial();
        expect(() => material.testValidateNonNegativeInt(0, 'test', 'value')).not.toThrow();
        expect(() => material.testValidateNonNegativeInt(1, 'test', 'value')).not.toThrow();
        expect(() => material.testValidateNonNegativeInt(100, 'test', 'value')).not.toThrow();
      });

      it('rejects negative integers', () => {
        const material = createTestMaterial();
        expect(() => material.testValidateNonNegativeInt(-1, 'test', 'value')).toThrow(/\[RES_002\]/);
      });

      it('rejects non-integers', () => {
        const material = createTestMaterial();
        expect(() => material.testValidateNonNegativeInt(1.5, 'test', 'value')).toThrow(/\[RES_002\]/);
        expect(() => material.testValidateNonNegativeInt(0.1, 'test', 'value')).toThrow(/\[RES_002\]/);
      });

      it('rejects non-finite values', () => {
        const material = createTestMaterial();
        expect(() => material.testValidateNonNegativeInt(Infinity, 'test', 'value')).toThrow(/\[RES_002\]/);
      });
    });

    describe('_validatePositiveInt', () => {
      it('accepts positive integers', () => {
        const material = createTestMaterial();
        expect(() => material.testValidatePositiveInt(1, 'test', 'value')).not.toThrow();
        expect(() => material.testValidatePositiveInt(100, 'test', 'value')).not.toThrow();
      });

      it('rejects zero', () => {
        const material = createTestMaterial();
        expect(() => material.testValidatePositiveInt(0, 'test', 'value')).toThrow(/\[RES_002\]/);
      });

      it('rejects negative integers', () => {
        const material = createTestMaterial();
        expect(() => material.testValidatePositiveInt(-1, 'test', 'value')).toThrow(/\[RES_002\]/);
      });
    });
  });
});
