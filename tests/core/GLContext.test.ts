import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { GLContext } from '../../src/core/GLContext.js';

/**
 * Test suite for GLContext
 *
 * Tests WebGL 2.0 context wrapper functionality including:
 * - Context creation and initialization
 * - Canvas sizing
 * - Color management
 * - Program/shader compilation
 * - Buffer creation and management
 * - Texture and vertex array creation
 * - Resource cleanup
 * - Error handling
 */

describe('GLContext', () => {
  let canvas: HTMLCanvasElement;
  let mockGL: Partial<WebGL2RenderingContext>;

  beforeEach(() => {
    // Create mock canvas
    canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 600;

    // Create comprehensive mock WebGL context
    mockGL = {
      // State management
      NO_ERROR: 0,
      INVALID_ENUM: 0x0500,
      INVALID_VALUE: 0x0501,
      INVALID_OPERATION: 0x0502,
      INVALID_FRAMEBUFFER_OPERATION: 0x0506,
      OUT_OF_MEMORY: 0x0505,
      CONTEXT_LOST_WEBGL: 0x9242,

      // Capabilities
      DEPTH_TEST: 0x0b71,
      CULL_FACE: 0x0b44,
      BLEND: 0x0be2,
      BACK: 1029,
      SRC_ALPHA: 0x0302,
      ONE_MINUS_SRC_ALPHA: 0x0303,

      // Buffer targets
      ARRAY_BUFFER: 0x8892,
      ELEMENT_ARRAY_BUFFER: 0x8893,
      STATIC_DRAW: 0x88e4,

      // Shader types
      VERTEX_SHADER: 0x8b31,
      FRAGMENT_SHADER: 0x8b30,
      COMPILE_STATUS: 0x8b81,
      LINK_STATUS: 0x8b82,

      // Buffer operations
      COLOR_BUFFER_BIT: 0x4000,
      DEPTH_BUFFER_BIT: 0x0100,

      // Texture targets and bindings
      TEXTURE_2D: 0x0de1,
      TEXTURE0: 0x84c0,
      ARRAY_BUFFER_BINDING: 0x8894,
      ELEMENT_ARRAY_BUFFER_BINDING: 0x8895,
      VERTEX_ARRAY_BINDING: 0x85b5,
      CURRENT_PROGRAM: 0x8b8d,
      TEXTURE_BINDING_2D: 0x8069,

      // Mock methods
      activeTexture: vi.fn(),
      enable: vi.fn(),
      cullFace: vi.fn(),
      blendFunc: vi.fn(),
      clearColor: vi.fn(),
      clear: vi.fn(),
      viewport: vi.fn(),
      getError: vi.fn(() => 0), // NO_ERROR by default
      createShader: vi.fn((type: GLenum) => {
        if (type === mockGL.VERTEX_SHADER || type === mockGL.FRAGMENT_SHADER) {
          return { id: Math.random() } as WebGLShader;
        }
        return null;
      }),
      shaderSource: vi.fn(),
      compileShader: vi.fn(),
      getShaderParameter: vi.fn((shader: WebGLShader, pname: GLenum) => {
        if (pname === mockGL.COMPILE_STATUS) {
          return true;
        }
        return false;
      }),
      getShaderInfoLog: vi.fn(() => null),
      deleteShader: vi.fn(),
      createProgram: vi.fn(() => ({ id: Math.random() } as WebGLProgram)),
      attachShader: vi.fn(),
      linkProgram: vi.fn(),
      getProgramParameter: vi.fn((program: WebGLProgram, pname: GLenum) => {
        if (pname === mockGL.LINK_STATUS) {
          return true;
        }
        return false;
      }),
      getProgramInfoLog: vi.fn(() => null),
      deleteProgram: vi.fn(),
      createBuffer: vi.fn(() => ({ id: Math.random() } as WebGLBuffer)),
      bindBuffer: vi.fn(),
      bufferData: vi.fn(),
      bufferSubData: vi.fn(),
      deleteBuffer: vi.fn(),
      getBufferParameter: vi.fn(),
      createTexture: vi.fn(() => ({ id: Math.random() } as WebGLTexture)),
      bindTexture: vi.fn(),
      deleteTexture: vi.fn(),
      texParameteri: vi.fn(),
      texParameterf: vi.fn(),
      texImage2D: vi.fn(),
      texSubImage2D: vi.fn(),
      texImage3D: vi.fn(),
      texSubImage3D: vi.fn(),
      texStorage2D: vi.fn(),
      texStorage3D: vi.fn(),
      getTexParameter: vi.fn(),
      createVertexArray: vi.fn(() => ({
        id: Math.random(),
      } as WebGLVertexArrayObject)),
      bindVertexArray: vi.fn(),
      deleteVertexArray: vi.fn(),
      vertexAttribPointer: vi.fn(),
      enableVertexAttribArray: vi.fn(),
      disableVertexAttribArray: vi.fn(),
      getVertexAttrib: vi.fn(),
    };

    // Mock canvas.getContext to return our mock GL context
    vi.spyOn(canvas, 'getContext').mockReturnValue(mockGL as WebGL2RenderingContext);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('constructor', () => {
    it('creates a GLContext with valid canvas', () => {
      const glContext = new GLContext(canvas);
      expect(glContext).toBeDefined();
      expect(glContext.canvas).toBe(canvas);
    });

    it('sets initial WebGL capabilities', () => {
      new GLContext(canvas);

      expect(mockGL.enable).toHaveBeenCalledWith(mockGL.DEPTH_TEST);
      expect(mockGL.enable).toHaveBeenCalledWith(mockGL.CULL_FACE);
      expect(mockGL.enable).toHaveBeenCalledWith(mockGL.BLEND);
      expect(mockGL.cullFace).toHaveBeenCalledWith(mockGL.BACK);
      expect(mockGL.blendFunc).toHaveBeenCalledWith(
        mockGL.SRC_ALPHA,
        mockGL.ONE_MINUS_SRC_ALPHA,
      );
    });

    it('requests WebGL2 context with correct options', () => {
      new GLContext(canvas, { antialias: false });

      expect(canvas.getContext).toHaveBeenCalledWith('webgl2', {
        antialias: false,
        alpha: true,
        depth: true,
        stencil: false,
        powerPreference: 'high-performance',
      });
    });

    it('throws error when WebGL 2.0 is not supported', () => {
      vi.spyOn(canvas, 'getContext').mockReturnValue(null);

      expect(() => new GLContext(canvas)).toThrow(
        /WebGL 2.0 is not supported/,
      );
    });

    it('uses default context options when none provided', () => {
      new GLContext(canvas);

      expect(canvas.getContext).toHaveBeenCalledWith(
        'webgl2',
        expect.objectContaining({
          antialias: true,
          alpha: true,
          depth: true,
          stencil: false,
          powerPreference: 'high-performance',
        }),
      );
    });

    it('supports method chaining with constructor', () => {
      const ctx = new GLContext(canvas)
        .setSize(1024, 768)
        .setClearColor(0.2, 0.2, 0.2, 1.0)
        .setViewport(50, 50, 400, 400);

      expect(canvas.width).toBe(1024);
      expect(canvas.height).toBe(768);
      expect(ctx.viewportX).toBe(50);
      expect(ctx.viewportY).toBe(50);
      expect(ctx.viewportWidth).toBe(400);
      expect(ctx.viewportHeight).toBe(400);
      expect(mockGL.clearColor).toHaveBeenCalledWith(0.2, 0.2, 0.2, 1.0);
    });

    describe('constructor with multiple input types', () => {
      it('accepts HTMLCanvasElement directly', () => {
        const glContext = new GLContext(canvas);
        expect(glContext.canvas).toBe(canvas);
      });

      it('accepts string canvas element ID', () => {
        // Create a canvas with ID in DOM
        const testCanvas = document.createElement('canvas');
        testCanvas.id = 'test-canvas-id';
        document.body.appendChild(testCanvas);
        vi.spyOn(testCanvas, 'getContext').mockReturnValue(mockGL);

        const glContext = new GLContext('test-canvas-id');
        expect(glContext.canvas).toBe(testCanvas);

        // Cleanup
        document.body.removeChild(testCanvas);
      });

      it('throws error when canvas element ID not found', () => {
        expect(() => new GLContext('non-existent-canvas-id')).toThrow(
          /Canvas element with ID "non-existent-canvas-id" not found in the DOM/,
        );
      });

      it('throws error when element with ID is not a canvas', () => {
        const notCanvas = document.createElement('div');
        notCanvas.id = 'not-a-canvas';
        document.body.appendChild(notCanvas);

        expect(() => new GLContext('not-a-canvas')).toThrow(
          /Element with ID "not-a-canvas" is not an HTMLCanvasElement/,
        );

        // Cleanup
        document.body.removeChild(notCanvas);
      });

      it('accepts Canvas wrapper object', () => {
        // Create a mock Canvas object with .element property
        const testCanvasElement = document.createElement('canvas');
        testCanvasElement.width = 800;
        testCanvasElement.height = 600;
        vi.spyOn(testCanvasElement, 'getContext').mockReturnValue(mockGL);

        const mockCanvasWrapper = {
          element: testCanvasElement,
        };

        const glContext = new GLContext(mockCanvasWrapper as any);
        expect(glContext.canvas).toBe(testCanvasElement);
      });

      it('throws error when Canvas object has invalid element property', () => {
        const invalidCanvas = {
          element: document.createElement('div'), // Not an HTMLCanvasElement
        };

        expect(() => new GLContext(invalidCanvas as any)).toThrow(
          /Canvas object must have an .element property that is an HTMLCanvasElement/,
        );
      });
    });
  });

  describe('fromElementId', () => {
    it('creates GLContext from canvas element ID', () => {
      // Setup: Add canvas to DOM with ID
      canvas.id = 'test-canvas';
      document.body.appendChild(canvas);

      const glContext = GLContext.fromElementId('test-canvas');
      expect(glContext).toBeDefined();
      expect(glContext.canvas.id).toBe('test-canvas');

      // Cleanup
      document.body.removeChild(canvas);
    });

    it('throws error when element not found', () => {
      expect(() => GLContext.fromElementId('nonexistent-canvas')).toThrow(
        /Canvas element with ID "nonexistent-canvas" not found/,
      );
    });

    it('throws error when element is not a canvas', () => {
      // Setup: Create a non-canvas element with ID
      const div = document.createElement('div');
      div.id = 'not-a-canvas';
      document.body.appendChild(div);

      expect(() => GLContext.fromElementId('not-a-canvas')).toThrow(
        /Element with ID "not-a-canvas" is not an HTMLCanvasElement/,
      );

      // Cleanup
      document.body.removeChild(div);
    });

    it('accepts context creation options', () => {
      canvas.id = 'test-canvas-2';
      document.body.appendChild(canvas);

      const glContext = GLContext.fromElementId('test-canvas-2', {
        antialias: false,
        powerPreference: 'low-power',
      });

      expect(glContext).toBeDefined();
      expect(canvas.getContext).toHaveBeenCalledWith(
        'webgl2',
        expect.objectContaining({
          antialias: false,
          powerPreference: 'low-power',
        }),
      );

      // Cleanup
      document.body.removeChild(canvas);
    });

    it('initializes WebGL state same as constructor', () => {
      canvas.id = 'test-canvas-3';
      document.body.appendChild(canvas);

      // Clear previous calls
      vi.clearAllMocks();
      vi.spyOn(canvas, 'getContext').mockReturnValue(mockGL as WebGL2RenderingContext);

      GLContext.fromElementId('test-canvas-3');

      expect(mockGL.enable).toHaveBeenCalledWith(mockGL.DEPTH_TEST);
      expect(mockGL.enable).toHaveBeenCalledWith(mockGL.CULL_FACE);
      expect(mockGL.enable).toHaveBeenCalledWith(mockGL.BLEND);

      // Cleanup
      document.body.removeChild(canvas);
    });

    it('supports method chaining with factory method', () => {
      canvas.id = 'test-canvas-4';
      document.body.appendChild(canvas);

      const ctx = GLContext.fromElementId('test-canvas-4')
        .setSize(800, 600)
        .setClearColor(0.1, 0.15, 0.2, 1.0)
        .setViewport(25, 25, 300, 300);

      expect(canvas.width).toBe(800);
      expect(canvas.height).toBe(600);
      expect(ctx.viewportX).toBe(25);
      expect(ctx.viewportY).toBe(25);
      expect(ctx.viewportWidth).toBe(300);
      expect(ctx.viewportHeight).toBe(300);
      expect(mockGL.clearColor).toHaveBeenCalledWith(0.1, 0.15, 0.2, 1.0);

      // Cleanup
      document.body.removeChild(canvas);
    });
  });

  describe('properties', () => {
    let glContext: GLContext;

    beforeEach(() => {
      glContext = new GLContext(canvas);
    });

    it('provides access to underlying WebGL context', () => {
      expect(glContext.gl).toBe(mockGL);
    });

    it('provides access to canvas', () => {
      expect(glContext.canvas).toBe(canvas);
    });

    it('provides access to WebGL state manager', () => {
      const state = glContext.state;
      expect(state).toBeDefined();
      expect(state).not.toBeNull();
      // Verify it's a WebGLState instance by checking for expected methods
      expect(typeof state.enableDepthTest).toBe('function');
    });

    it('returns correct canvasWidth', () => {
      canvas.width = 1920;
      expect(glContext.canvasWidth).toBe(1920);
    });

    it('returns correct canvasHeight', () => {
      canvas.height = 1080;
      expect(glContext.canvasHeight).toBe(1080);
    });
  });

  describe('viewport management', () => {
    let glContext: GLContext;

    beforeEach(() => {
      glContext = new GLContext(canvas);
      vi.clearAllMocks();
      vi.spyOn(canvas, 'getContext').mockReturnValue(mockGL as WebGL2RenderingContext);
    });

    describe('initial viewport', () => {
      it('sets default viewport to full canvas in constructor', () => {
        expect(glContext.viewportX).toBe(0);
        expect(glContext.viewportY).toBe(0);
        expect(glContext.viewportWidth).toBe(canvas.width);
        expect(glContext.viewportHeight).toBe(canvas.height);
      });

      it('calls gl.viewport in constructor', () => {
        // Create new context (previous one already called it)
        const newContext = new GLContext(canvas);
        expect(mockGL.viewport).toHaveBeenCalledWith(0, 0, canvas.width, canvas.height);
      });
    });

    describe('viewport getters', () => {
      it('returns correct viewportX', () => {
        expect(glContext.viewportX).toBe(0);
      });

      it('returns correct viewportY', () => {
        expect(glContext.viewportY).toBe(0);
      });

      it('returns correct viewportWidth', () => {
        expect(glContext.viewportWidth).toBe(canvas.width);
      });

      it('returns correct viewportHeight', () => {
        expect(glContext.viewportHeight).toBe(canvas.height);
      });
    });
  });

  describe('setSize', () => {
    let glContext: GLContext;

    beforeEach(() => {
      glContext = new GLContext(canvas);
      vi.clearAllMocks();
      vi.spyOn(canvas, 'getContext').mockReturnValue(mockGL as WebGL2RenderingContext);
    });

    it('updates canvas dimensions', () => {
      glContext.setSize(1024, 768);
      expect(canvas.width).toBe(1024);
      expect(canvas.height).toBe(768);
    });

    it('updates viewport to full canvas', () => {
      glContext.setSize(800, 600);
      expect(mockGL.viewport).toHaveBeenCalledWith(0, 0, 800, 600);
    });

    it('updates viewport getters', () => {
      glContext.setSize(1024, 768);
      expect(glContext.viewportWidth).toBe(1024);
      expect(glContext.viewportHeight).toBe(768);
      expect(glContext.viewportX).toBe(0);
      expect(glContext.viewportY).toBe(0);
    });

    it('handles zero dimensions', () => {
      glContext.setSize(0, 0);
      expect(canvas.width).toBe(0);
      expect(canvas.height).toBe(0);
      expect(mockGL.viewport).toHaveBeenCalledWith(0, 0, 0, 0);
    });

    it('handles large dimensions', () => {
      glContext.setSize(4096, 2160);
      expect(canvas.width).toBe(4096);
      expect(canvas.height).toBe(2160);
    });

    it('returns this for chaining', () => {
      const result = glContext.setSize(800, 600);
      expect(result).toBe(glContext);
    });

    it('can be chained with other methods', () => {
      glContext.setSize(800, 600).setClearColor(0.1, 0.1, 0.1, 1.0);
      expect(canvas.width).toBe(800);
      expect(canvas.height).toBe(600);
      expect(mockGL.clearColor).toHaveBeenCalledWith(0.1, 0.1, 0.1, 1.0);
    });
  });

  describe('setCanvasSize', () => {
    let glContext: GLContext;

    beforeEach(() => {
      glContext = new GLContext(canvas);
      vi.clearAllMocks();
      vi.spyOn(canvas, 'getContext').mockReturnValue(mockGL as WebGL2RenderingContext);
    });

    it('updates canvas dimensions', () => {
      glContext.setCanvasSize(1024, 768);
      expect(canvas.width).toBe(1024);
      expect(canvas.height).toBe(768);
    });

    it('does NOT update viewport', () => {
      const originalViewportWidth = glContext.viewportWidth;
      const originalViewportHeight = glContext.viewportHeight;

      glContext.setCanvasSize(1024, 768);
      // Viewport should still be at original values
      expect(glContext.viewportX).toBe(0);
      expect(glContext.viewportY).toBe(0);
      expect(glContext.viewportWidth).toBe(originalViewportWidth);
      expect(glContext.viewportHeight).toBe(originalViewportHeight);
    });

    it('does NOT call gl.viewport', () => {
      glContext.setCanvasSize(800, 600);
      expect(mockGL.viewport).not.toHaveBeenCalled();
    });

    it('returns this for chaining', () => {
      const result = glContext.setCanvasSize(800, 600);
      expect(result).toBe(glContext);
    });

    it('can be chained with viewport changes', () => {
      const initialWidth = canvas.width;
      const initialHeight = canvas.height;

      glContext.setCanvasSize(800, 600).setViewport(100, 100, 300, 200);

      expect(canvas.width).toBe(800);
      expect(canvas.height).toBe(600);
      expect(glContext.viewportX).toBe(100);
      expect(glContext.viewportY).toBe(100);
      expect(glContext.viewportWidth).toBe(300);
      expect(glContext.viewportHeight).toBe(200);
    });
  });

  describe('setViewport', () => {
    let glContext: GLContext;

    beforeEach(() => {
      glContext = new GLContext(canvas);
      vi.clearAllMocks();
      vi.spyOn(canvas, 'getContext').mockReturnValue(mockGL as WebGL2RenderingContext);
    });

    it('sets viewport x, y, width, height', () => {
      glContext.setViewport(100, 50, 400, 300);
      expect(glContext.viewportX).toBe(100);
      expect(glContext.viewportY).toBe(50);
      expect(glContext.viewportWidth).toBe(400);
      expect(glContext.viewportHeight).toBe(300);
    });

    it('calls gl.viewport with correct params', () => {
      glContext.setViewport(100, 50, 400, 300);
      expect(mockGL.viewport).toHaveBeenCalledWith(100, 50, 400, 300);
    });

    it('does NOT change canvas size', () => {
      const originalWidth = canvas.width;
      const originalHeight = canvas.height;

      glContext.setViewport(100, 100, 300, 200);

      expect(canvas.width).toBe(originalWidth);
      expect(canvas.height).toBe(originalHeight);
    });

    it('allows viewport smaller than canvas', () => {
      glContext.setViewport(50, 50, 200, 150);
      expect(glContext.viewportWidth).toBe(200);
      expect(glContext.viewportHeight).toBe(150);
    });

    it('allows viewport larger than canvas', () => {
      glContext.setViewport(0, 0, 2000, 2000);
      expect(glContext.viewportWidth).toBe(2000);
      expect(glContext.viewportHeight).toBe(2000);
    });

    it('handles zero viewport dimensions', () => {
      glContext.setViewport(100, 100, 0, 0);
      expect(glContext.viewportWidth).toBe(0);
      expect(glContext.viewportHeight).toBe(0);
    });

    it('returns this for chaining', () => {
      const result = glContext.setViewport(100, 100, 300, 200);
      expect(result).toBe(glContext);
    });

    it('can be chained with other methods', () => {
      glContext
        .setViewport(100, 100, 400, 300)
        .setClearColor(0.2, 0.2, 0.2, 1.0)
        .setCanvasSize(1024, 768);

      expect(glContext.viewportX).toBe(100);
      expect(canvas.width).toBe(1024);
      expect(mockGL.clearColor).toHaveBeenCalledWith(0.2, 0.2, 0.2, 1.0);
    });
  });

  describe('withViewport (factory method)', () => {
    let glContext: GLContext;

    beforeEach(() => {
      canvas.id = 'test-canvas-viewport';
      document.body.appendChild(canvas);
      glContext = GLContext.fromElementId('test-canvas-viewport');
      vi.clearAllMocks();
      vi.spyOn(canvas, 'getContext').mockReturnValue(mockGL as WebGL2RenderingContext);
    });

    afterEach(() => {
      if (document.body.contains(canvas)) {
        document.body.removeChild(canvas);
      }
    });

    it('sets viewport like setViewport', () => {
      glContext.withViewport(100, 50, 400, 300);
      expect(glContext.viewportX).toBe(100);
      expect(glContext.viewportY).toBe(50);
      expect(glContext.viewportWidth).toBe(400);
      expect(glContext.viewportHeight).toBe(300);
    });

    it('returns this for chaining', () => {
      const result = glContext.withViewport(100, 100, 300, 200);
      expect(result).toBe(glContext);
    });

    it('can be chained after fromElementId', () => {
      canvas.id = 'test-canvas-chain';
      document.body.appendChild(canvas);

      const ctx = GLContext.fromElementId('test-canvas-chain').withViewport(
        100,
        100,
        400,
        400,
      );

      expect(ctx.viewportX).toBe(100);
      expect(ctx.viewportY).toBe(100);
      expect(ctx.viewportWidth).toBe(400);
      expect(ctx.viewportHeight).toBe(400);

      document.body.removeChild(canvas);
    });

    it('can be chained in any order', () => {
      canvas.id = 'test-canvas-order';
      document.body.appendChild(canvas);

      const ctx = GLContext.fromElementId('test-canvas-order')
        .setClearColor(0.1, 0.1, 0.1, 1.0)
        .withViewport(50, 50, 300, 300)
        .setCanvasSize(1024, 768);

      expect(ctx.viewportX).toBe(50);
      expect(canvas.width).toBe(1024);
      expect(mockGL.clearColor).toHaveBeenCalledWith(0.1, 0.1, 0.1, 1.0);

      document.body.removeChild(canvas);
    });
  });

  describe('setClearColor', () => {
    let glContext: GLContext;

    beforeEach(() => {
      glContext = new GLContext(canvas);
    });

    it('sets clear color with default alpha', () => {
      glContext.setClearColor(0.5, 0.6, 0.7);
      expect(mockGL.clearColor).toHaveBeenCalledWith(0.5, 0.6, 0.7, 1.0);
    });

    it('sets clear color with custom alpha', () => {
      glContext.setClearColor(0.2, 0.3, 0.4, 0.8);
      expect(mockGL.clearColor).toHaveBeenCalledWith(0.2, 0.3, 0.4, 0.8);
    });

    it('handles black color', () => {
      glContext.setClearColor(0, 0, 0, 1);
      expect(mockGL.clearColor).toHaveBeenCalledWith(0, 0, 0, 1);
    });

    it('handles white color', () => {
      glContext.setClearColor(1, 1, 1, 1);
      expect(mockGL.clearColor).toHaveBeenCalledWith(1, 1, 1, 1);
    });

    it('handles out-of-range values (valid in WebGL)', () => {
      glContext.setClearColor(2.0, -0.5, 0.5, 1.5);
      expect(mockGL.clearColor).toHaveBeenCalledWith(2.0, -0.5, 0.5, 1.5);
    });
  });

  describe('clear', () => {
    let glContext: GLContext;

    beforeEach(() => {
      glContext = new GLContext(canvas);
    });

    it('clears color and depth buffers', () => {
      glContext.clear();
      expect(mockGL.clear).toHaveBeenCalledWith(
        mockGL.COLOR_BUFFER_BIT | mockGL.DEPTH_BUFFER_BIT,
      );
    });

    it('can be called multiple times', () => {
      glContext.clear();
      glContext.clear();
      expect(mockGL.clear).toHaveBeenCalledTimes(2);
    });
  });

  describe('createProgram', () => {
    let glContext: GLContext;
    const vertexShader = 'void main() {}';
    const fragmentShader = 'void main() {}';

    beforeEach(() => {
      glContext = new GLContext(canvas);
    });

    it('creates a shader program from sources', () => {
      const program = glContext.createProgram(vertexShader, fragmentShader);
      expect(program).toBeDefined();
    });

    it('compiles vertex and fragment shaders', () => {
      glContext.createProgram(vertexShader, fragmentShader);

      expect(mockGL.shaderSource).toHaveBeenCalledWith(
        expect.any(Object),
        vertexShader,
      );
      expect(mockGL.shaderSource).toHaveBeenCalledWith(
        expect.any(Object),
        fragmentShader,
      );
      expect(mockGL.compileShader).toHaveBeenCalledTimes(2);
    });

    it('links program and cleans up shaders', () => {
      glContext.createProgram(vertexShader, fragmentShader);

      expect(mockGL.attachShader).toHaveBeenCalledTimes(2);
      expect(mockGL.linkProgram).toHaveBeenCalled();
      expect(mockGL.deleteShader).toHaveBeenCalledTimes(2);
    });

    it('throws error on vertex shader compilation failure', () => {
      mockGL.getShaderParameter = vi.fn((shader: WebGLShader, pname: GLenum) => {
        if (pname === mockGL.COMPILE_STATUS) {
          return false;
        }
        return false;
      });

      mockGL.getShaderInfoLog = vi.fn(() => 'Compilation error');

      expect(() =>
        glContext.createProgram(vertexShader, fragmentShader),
      ).toThrow(/Vertex shader compilation failed/);
    });

    it('throws error on fragment shader compilation failure', () => {
      let shaderCount = 0;
      mockGL.createShader = vi.fn(() => {
        shaderCount++;
        return { id: shaderCount } as WebGLShader;
      });

      mockGL.getShaderParameter = vi.fn((shader: WebGLShader, pname: GLenum) => {
        if (pname === mockGL.COMPILE_STATUS) {
          // First shader (vertex) passes, second (fragment) fails
          return (shader as any).id === 1;
        }
        return false;
      });

      mockGL.getShaderInfoLog = vi.fn(() => 'Compilation error');

      expect(() =>
        glContext.createProgram(vertexShader, fragmentShader),
      ).toThrow(/Fragment shader compilation failed/);
    });

    it('throws error on program linking failure', () => {
      mockGL.getProgramParameter = vi.fn((program: WebGLProgram, pname: GLenum) => {
        if (pname === mockGL.LINK_STATUS) {
          return false;
        }
        return false;
      });

      mockGL.getProgramInfoLog = vi.fn(() => 'Linking error');

      expect(() =>
        glContext.createProgram(vertexShader, fragmentShader),
      ).toThrow(/Program linking failed/);
    });

    it('handles shader creation failure', () => {
      mockGL.createShader = vi.fn(() => null);

      expect(() =>
        glContext.createProgram(vertexShader, fragmentShader),
      ).toThrow();
    });

    it('handles program creation failure', () => {
      mockGL.createProgram = vi.fn(() => null);

      expect(() =>
        glContext.createProgram(vertexShader, fragmentShader),
      ).toThrow(/Failed to create program/);
    });

    it('tracks created programs for cleanup', () => {
      const program1 = glContext.createProgram(vertexShader, fragmentShader);
      const program2 = glContext.createProgram(vertexShader, fragmentShader);

      // Verify programs are tracked in internal set before disposal
      expect(glContext.trackedProgramCount).toBe(2);
      expect(mockGL.deleteProgram).not.toHaveBeenCalled();

      glContext.dispose();

      // Verify programs were deleted and set was cleared
      expect(glContext.trackedProgramCount).toBe(0);
      expect(mockGL.deleteProgram).toHaveBeenCalledWith(program1);
      expect(mockGL.deleteProgram).toHaveBeenCalledWith(program2);
      expect(mockGL.deleteProgram).toHaveBeenCalledTimes(2);
    });
  });

  describe('createBuffer', () => {
    let glContext: GLContext;

    beforeEach(() => {
      glContext = new GLContext(canvas);
    });

    it('creates an empty buffer', () => {
      const buffer = glContext.createBuffer(mockGL.ARRAY_BUFFER!);
      expect(buffer).toBeDefined();
    });

    it('does NOT bind or upload data in createBuffer', () => {
      const buffer = glContext.createBuffer(mockGL.ARRAY_BUFFER!);

      // createBuffer should NOT call bindBuffer or bufferData
      expect(mockGL.bindBuffer).not.toHaveBeenCalled();
      expect(mockGL.bufferData).not.toHaveBeenCalled();
    });

    it('bufferData binds, uploads, and unbinds', () => {
      const buffer = glContext.createBuffer(mockGL.ARRAY_BUFFER!);
      const data = new Float32Array([1, 2, 3]);
      glContext.bufferData(mockGL.ARRAY_BUFFER!, buffer, data);

      expect(mockGL.bindBuffer).toHaveBeenCalledWith(
        mockGL.ARRAY_BUFFER,
        buffer,
      );
      expect(mockGL.bufferData).toHaveBeenCalledWith(
        mockGL.ARRAY_BUFFER,
        data,
        mockGL.STATIC_DRAW,
      );
      // Verify unbind (second bindBuffer call with null)
      expect(mockGL.bindBuffer).toHaveBeenCalledWith(
        mockGL.ARRAY_BUFFER,
        null,
      );
    });

    it('uses custom usage hint with bufferData', () => {
      const buffer = glContext.createBuffer(mockGL.ARRAY_BUFFER!);
      const data = new Float32Array([1, 2, 3]);
      const DYNAMIC_DRAW = 0x88e8;
      glContext.bufferData(mockGL.ARRAY_BUFFER!, buffer, data, DYNAMIC_DRAW);

      expect(mockGL.bufferData).toHaveBeenCalledWith(
        mockGL.ARRAY_BUFFER,
        data,
        DYNAMIC_DRAW,
      );
    });

    it('supports element array buffer', () => {
      const buffer = glContext.createBuffer(mockGL.ELEMENT_ARRAY_BUFFER!);

      expect(buffer).toBeDefined();
      // createBuffer doesn't bind - binding is done separately via bindBuffer or bufferData
      expect(mockGL.bindBuffer).not.toHaveBeenCalled();
    });

    it('throws error when buffer creation fails', () => {
      mockGL.createBuffer = vi.fn(() => null);

      expect(() =>
        glContext.createBuffer(mockGL.ARRAY_BUFFER!),
      ).toThrow(/Failed to create WebGL buffer/);
    });

    it('tracks created buffers for cleanup', () => {
      const buffer1 = glContext.createBuffer(mockGL.ARRAY_BUFFER!);
      const buffer2 = glContext.createBuffer(mockGL.ARRAY_BUFFER!);

      // Verify buffers are tracked in internal set before disposal
      expect(glContext.trackedBufferCount).toBe(2);
      expect(mockGL.deleteBuffer).not.toHaveBeenCalled();

      glContext.dispose();

      // Verify buffers were deleted and set was cleared
      expect(glContext.trackedBufferCount).toBe(0);
      expect(mockGL.deleteBuffer).toHaveBeenCalledWith(buffer1);
      expect(mockGL.deleteBuffer).toHaveBeenCalledWith(buffer2);
      expect(mockGL.deleteBuffer).toHaveBeenCalledTimes(2);
    });
  });

  describe('createTexture', () => {
    let glContext: GLContext;

    beforeEach(() => {
      glContext = new GLContext(canvas);
    });

    it('creates a texture with default target', () => {
      const texture = glContext.createTexture();
      expect(texture).toBeDefined();
    });

    it('creates a texture with custom target', () => {
      const TEXTURE_CUBE_MAP = 0x8513;
      const texture = glContext.createTexture(TEXTURE_CUBE_MAP);
      expect(texture).toBeDefined();
    });

    it('throws error when texture creation fails', () => {
      mockGL.createTexture = vi.fn(() => null);

      expect(() => glContext.createTexture()).toThrow(
        /Failed to create WebGL texture/,
      );
    });

    it('tracks created textures for cleanup', () => {
      const texture1 = glContext.createTexture();
      const texture2 = glContext.createTexture();

      // Verify textures are tracked in internal set before disposal
      expect(glContext.trackedTextureCount).toBe(2);
      expect(glContext.trackedTextures.has(texture1)).toBe(true);
      expect(glContext.trackedTextures.has(texture2)).toBe(true);
      expect(mockGL.deleteTexture).not.toHaveBeenCalled();

      glContext.dispose();

      // Verify textures were deleted and set was cleared
      expect(glContext.trackedTextureCount).toBe(0);
      expect(mockGL.deleteTexture).toHaveBeenCalledWith(texture1);
      expect(mockGL.deleteTexture).toHaveBeenCalledWith(texture2);
      expect(mockGL.deleteTexture).toHaveBeenCalledTimes(2);
    });
  });

  describe('createVertexArray', () => {
    let glContext: GLContext;

    beforeEach(() => {
      glContext = new GLContext(canvas);
    });

    it('creates a vertex array object', () => {
      const vao = glContext.createVertexArray();
      expect(vao).toBeDefined();
    });

    it('throws error when VAO creation fails', () => {
      mockGL.createVertexArray = vi.fn(() => null);

      expect(() => glContext.createVertexArray()).toThrow(
        /Failed to create vertex array object/,
      );
    });

    it('tracks created vertex arrays for cleanup', () => {
      const vao1 = glContext.createVertexArray();
      const vao2 = glContext.createVertexArray();

      // Verify vertex arrays are tracked in internal set before disposal
      expect(glContext.trackedVertexArrayCount).toBe(2);
      expect(glContext.trackedVertexArrays.has(vao1)).toBe(true);
      expect(glContext.trackedVertexArrays.has(vao2)).toBe(true);
      expect(mockGL.deleteVertexArray).not.toHaveBeenCalled();

      glContext.dispose();

      // Verify vertex arrays were deleted and set was cleared
      expect(glContext.trackedVertexArrayCount).toBe(0);
      expect(mockGL.deleteVertexArray).toHaveBeenCalledWith(vao1);
      expect(mockGL.deleteVertexArray).toHaveBeenCalledWith(vao2);
      expect(mockGL.deleteVertexArray).toHaveBeenCalledTimes(2);
    });
  });

  describe('setDebugMode', () => {
    let glContext: GLContext;

    beforeEach(() => {
      glContext = new GLContext(canvas);
    });

    it('enables debug mode', () => {
      glContext.setDebugMode(true);
      // Debug mode doesn't have a public getter, but we can verify it doesn't throw
      expect(() => glContext.setDebugMode(true)).not.toThrow();
    });

    it('disables debug mode', () => {
      glContext.setDebugMode(false);
      expect(() => glContext.setDebugMode(false)).not.toThrow();
    });
  });

  describe('dispose', () => {
    let glContext: GLContext;

    beforeEach(() => {
      glContext = new GLContext(canvas);
    });

    it('deletes all created programs', () => {
      const program = glContext.createProgram('', '');
      glContext.dispose();

      expect(mockGL.deleteProgram).toHaveBeenCalledWith(program);
    });

    it('deletes all created buffers', () => {
      const buffer = glContext.createBuffer(mockGL.ARRAY_BUFFER!);
      glContext.dispose();

      expect(mockGL.deleteBuffer).toHaveBeenCalledWith(buffer);
    });

    it('deletes all created textures', () => {
      const texture = glContext.createTexture();
      glContext.dispose();

      expect(mockGL.deleteTexture).toHaveBeenCalledWith(texture);
    });

    it('deletes all created vertex arrays', () => {
      const vao = glContext.createVertexArray();
      glContext.dispose();

      expect(mockGL.deleteVertexArray).toHaveBeenCalledWith(vao);
    });

    it('clears all resource tracking sets', () => {
      glContext.createProgram('', '');
      glContext.createBuffer(mockGL.ARRAY_BUFFER!);
      glContext.createTexture();
      glContext.createVertexArray();

      glContext.dispose();

      // Create new resources after dispose and verify they start at count 1
      const program = glContext.createProgram('', '');
      glContext.dispose();

      // Should only be called once if properly cleared
      expect(mockGL.deleteProgram).toHaveBeenCalledTimes(2); // Once from first dispose, once from second
    });

    it('can be called multiple times safely', () => {
      glContext.createProgram('', '');
      glContext.dispose();
      expect(() => glContext.dispose()).not.toThrow();
    });
  });

  describe('error handling', () => {
    let glContext: GLContext;
    let consoleSpy: any;

    beforeEach(() => {
      glContext = new GLContext(canvas);
      consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
      consoleSpy.mockRestore();
    });

    it('does not log errors when debug mode is off', () => {
      mockGL.getError = vi.fn(() => mockGL.INVALID_OPERATION!);
      glContext.setDebugMode(false);
      glContext.clear();

      expect(consoleSpy).not.toHaveBeenCalled();
    });

    it('logs errors when debug mode is on', () => {
      mockGL.getError = vi.fn(() => mockGL.INVALID_OPERATION!);
      glContext.setDebugMode(true);
      glContext.clear();

      expect(consoleSpy).toHaveBeenCalled();
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('WebGL Error'),
      );
    });

    it('shows correct error names for known errors', () => {
      mockGL.getError = vi.fn(() => mockGL.OUT_OF_MEMORY!);
      glContext.setDebugMode(true);
      glContext.clear();

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('OUT_OF_MEMORY'),
      );
    });
  });

  describe('integration', () => {
    let glContext: GLContext;

    beforeEach(() => {
      glContext = new GLContext(canvas);
    });

    it('complete render setup workflow', () => {
      // Setup
      glContext.setSize(1024, 768);
      glContext.setClearColor(0.1, 0.1, 0.1, 1.0);

      // Create resources
      const vertexData = new Float32Array([-1, 1, 1, 1, 0, -1]);
      const indexData = new Uint16Array([0, 1, 2]);

      const vertexBuffer = glContext.createBuffer(mockGL.ARRAY_BUFFER!);
      glContext.bufferData(mockGL.ARRAY_BUFFER!, vertexBuffer, vertexData);

      const indexBuffer = glContext.createBuffer(mockGL.ELEMENT_ARRAY_BUFFER!);
      glContext.bufferData(mockGL.ELEMENT_ARRAY_BUFFER!, indexBuffer, indexData);

      const program = glContext.createProgram('', '');
      const vao = glContext.createVertexArray();

      // Render
      glContext.clear();

      // Cleanup
      glContext.dispose();

      // Verify all operations completed without error
      expect(glContext.canvasWidth).toBe(1024);
      expect(glContext.canvasHeight).toBe(768);
      expect(mockGL.deleteProgram).toHaveBeenCalledWith(program);
      expect(mockGL.deleteBuffer).toHaveBeenCalledWith(vertexBuffer);
      expect(mockGL.deleteBuffer).toHaveBeenCalledWith(indexBuffer);
      expect(mockGL.deleteVertexArray).toHaveBeenCalledWith(vao);
    });
  });

  describe('queryCurrentBuffer', () => {
    let glContext: GLContext;

    beforeEach(() => {
      glContext = new GLContext(canvas);
      vi.clearAllMocks();
      vi.spyOn(canvas, 'getContext').mockReturnValue(mockGL as WebGL2RenderingContext);
    });

    it('queries ARRAY_BUFFER_BINDING by default', () => {
      const mockBuffer = { id: 'mock-buffer' } as WebGLBuffer;
      mockGL.getParameter = vi.fn((param: GLenum) => {
        if (param === mockGL.ARRAY_BUFFER_BINDING) {
          return mockBuffer;
        }
        return null;
      });

      const result = glContext.queryCurrentBuffer();
      expect(result).toBe(mockBuffer);
      expect(mockGL.getParameter).toHaveBeenCalledWith(mockGL.ARRAY_BUFFER_BINDING);
    });

    it('queries ELEMENT_ARRAY_BUFFER_BINDING when specified', () => {
      const mockBuffer = { id: 'mock-ebo' } as WebGLBuffer;
      mockGL.getParameter = vi.fn((param: GLenum) => {
        if (param === mockGL.ELEMENT_ARRAY_BUFFER_BINDING) {
          return mockBuffer;
        }
        return null;
      });

      const result = glContext.queryCurrentBuffer(mockGL.ELEMENT_ARRAY_BUFFER!);
      expect(result).toBe(mockBuffer);
      expect(mockGL.getParameter).toHaveBeenCalledWith(mockGL.ELEMENT_ARRAY_BUFFER_BINDING);
    });

    it('returns null when no buffer is bound', () => {
      mockGL.getParameter = vi.fn(() => null);
      const result = glContext.queryCurrentBuffer();
      expect(result).toBeNull();
    });
  });

  describe('queryCurrentProgram', () => {
    let glContext: GLContext;

    beforeEach(() => {
      glContext = new GLContext(canvas);
      vi.clearAllMocks();
      vi.spyOn(canvas, 'getContext').mockReturnValue(mockGL as WebGL2RenderingContext);
    });

    it('queries CURRENT_PROGRAM', () => {
      const mockProgram = { id: 'mock-program' } as WebGLProgram;
      mockGL.getParameter = vi.fn((param: GLenum) => {
        if (param === mockGL.CURRENT_PROGRAM) {
          return mockProgram;
        }
        return null;
      });

      const result = glContext.queryCurrentProgram();
      expect(result).toBe(mockProgram);
      expect(mockGL.getParameter).toHaveBeenCalledWith(mockGL.CURRENT_PROGRAM);
    });

    it('returns null when no program is active', () => {
      mockGL.getParameter = vi.fn(() => null);
      const result = glContext.queryCurrentProgram();
      expect(result).toBeNull();
    });
  });

  describe('queryCurrentVAO', () => {
    let glContext: GLContext;

    beforeEach(() => {
      glContext = new GLContext(canvas);
      vi.clearAllMocks();
      vi.spyOn(canvas, 'getContext').mockReturnValue(mockGL as WebGL2RenderingContext);
    });

    it('queries VERTEX_ARRAY_BINDING', () => {
      const mockVAO = { id: 'mock-vao' } as WebGLVertexArrayObject;
      mockGL.getParameter = vi.fn((param: GLenum) => {
        if (param === mockGL.VERTEX_ARRAY_BINDING) {
          return mockVAO;
        }
        return null;
      });

      const result = glContext.queryCurrentVAO();
      expect(result).toBe(mockVAO);
      expect(mockGL.getParameter).toHaveBeenCalledWith(mockGL.VERTEX_ARRAY_BINDING);
    });

    it('returns null when no VAO is bound', () => {
      mockGL.getParameter = vi.fn(() => null);
      const result = glContext.queryCurrentVAO();
      expect(result).toBeNull();
    });
  });

  describe('queryCurrentTexture', () => {
    let glContext: GLContext;

    beforeEach(() => {
      glContext = new GLContext(canvas);
      vi.clearAllMocks();
      vi.spyOn(canvas, 'getContext').mockReturnValue(mockGL as WebGL2RenderingContext);
    });

    it('queries TEXTURE_BINDING_2D for default unit 0', () => {
      const mockTexture = { id: 'mock-texture' } as WebGLTexture;
      mockGL.getParameter = vi.fn((param: GLenum) => {
        if (param === mockGL.TEXTURE_BINDING_2D) {
          return mockTexture;
        }
        return null;
      });

      const result = glContext.queryCurrentTexture();
      expect(result).toBe(mockTexture);
      expect(mockGL.activeTexture).toHaveBeenCalledWith(mockGL.TEXTURE0);
      expect(mockGL.getParameter).toHaveBeenCalledWith(mockGL.TEXTURE_BINDING_2D);
    });

    it('queries specific texture unit', () => {
      const mockTexture = { id: 'mock-texture' } as WebGLTexture;
      mockGL.getParameter = vi.fn((param: GLenum) => {
        if (param === mockGL.TEXTURE_BINDING_2D) {
          return mockTexture;
        }
        return null;
      });

      const result = glContext.queryCurrentTexture(3);
      expect(result).toBe(mockTexture);
      expect(mockGL.activeTexture).toHaveBeenCalledWith(mockGL.TEXTURE0 + 3);
    });

    it('returns null when no texture is bound', () => {
      mockGL.getParameter = vi.fn(() => null);
      const result = glContext.queryCurrentTexture(0);
      expect(result).toBeNull();
    });
  });

  describe('queryCurrentFramebuffer', () => {
    let glContext: GLContext;

    beforeEach(() => {
      glContext = new GLContext(canvas);
      vi.clearAllMocks();
      vi.spyOn(canvas, 'getContext').mockReturnValue(mockGL as WebGL2RenderingContext);
    });

    it('returns null (Phase 5+ reserved)', () => {
      const result = glContext.queryCurrentFramebuffer();
      expect(result).toBeNull();
    });
  });

  describe('checkError', () => {
    let glContext: GLContext;

    beforeEach(() => {
      glContext = new GLContext(canvas);
      vi.clearAllMocks();
      vi.spyOn(canvas, 'getContext').mockReturnValue(mockGL as WebGL2RenderingContext);
    });

    it('delegates to internal error checker', () => {
      const spy = vi.spyOn(glContext as any, '_checkError');
      glContext.checkError('test-context');
      expect(spy).toHaveBeenCalledWith('test-context');
    });
  });

  describe('queryCurrentRenderbuffer', () => {
    let glContext: GLContext;

    beforeEach(() => {
      glContext = new GLContext(canvas);
      vi.clearAllMocks();
      vi.spyOn(canvas, 'getContext').mockReturnValue(mockGL as WebGL2RenderingContext);
    });

    it('returns null (Phase 5+ reserved)', () => {
      const result = glContext.queryCurrentRenderbuffer();
      expect(result).toBeNull();
    });
  });

  describe('debugValidateBindings', () => {
    let glContext: GLContext;

    beforeEach(() => {
      glContext = new GLContext(canvas);
      vi.clearAllMocks();
      vi.spyOn(canvas, 'getContext').mockReturnValue(mockGL as WebGL2RenderingContext);
      mockGL.getParameter = vi.fn(() => null);
    });

    it('returns validation results object', () => {
      const result = glContext.debugValidateBindings();
      expect(result).toHaveProperty('buffer');
      expect(result).toHaveProperty('program');
      expect(result).toHaveProperty('vao');
      expect(result).toHaveProperty('texture');
    });

    it('returns all true for validation results', () => {
      const result = glContext.debugValidateBindings();
      expect(result.buffer).toBe(true);
      expect(result.program).toBe(true);
      expect(result.vao).toBe(true);
      expect(result.texture).toBe(true);
    });

    it('does NOT log when debug mode is off', () => {
      const consoleSpy = vi.spyOn(console, 'log');
      glContext.setDebugMode(false);
      glContext.debugValidateBindings();
      expect(consoleSpy).not.toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it('logs current bindings when debug mode is on', () => {
      const consoleSpy = vi.spyOn(console, 'log');
      glContext.setDebugMode(true);
      glContext.debugValidateBindings();
      expect(consoleSpy).toHaveBeenCalledWith(
        'Current GPU Bindings:',
        expect.objectContaining({
          buffer: null,
          program: null,
          vao: null,
          texture: null,
        }),
      );
      consoleSpy.mockRestore();
    });
  });

  describe('tracked resource accessors', () => {
    let glContext: GLContext;

    beforeEach(() => {
      glContext = new GLContext(canvas);
    });

    describe('trackedPrograms', () => {
      it('returns ReadonlySet of tracked programs', () => {
        const program1 = glContext.createProgram('', '');
        const program2 = glContext.createProgram('', '');

        const tracked = glContext.trackedPrograms;
        expect(tracked.has(program1)).toBe(true);
        expect(tracked.has(program2)).toBe(true);
        expect(tracked.size).toBe(2);
      });

      it('returns ReadonlySet type (modification prevented at compile time)', () => {
        const program = glContext.createProgram('', '');
        const tracked = glContext.trackedPrograms;

        // Type is ReadonlySet<WebGLProgram> - prevents modification at TypeScript compile time
        // Verify it's a Set by checking for Set methods at runtime
        expect(typeof tracked.has).toBe('function');
        expect(typeof tracked.forEach).toBe('function');
        expect(tracked.size).toBe(1);
      });
    });

    describe('trackedBuffers', () => {
      it('returns ReadonlySet of tracked buffers', () => {
        const buffer1 = glContext.createBuffer(mockGL.ARRAY_BUFFER!);
        const buffer2 = glContext.createBuffer(mockGL.ARRAY_BUFFER!);

        const tracked = glContext.trackedBuffers;
        expect(tracked.has(buffer1)).toBe(true);
        expect(tracked.has(buffer2)).toBe(true);
        expect(tracked.size).toBe(2);
      });

      it('allows inspection via Set interface', () => {
        const buffer = glContext.createBuffer(mockGL.ARRAY_BUFFER!);
        const tracked = glContext.trackedBuffers;

        // Type is ReadonlySet<WebGLBuffer> - provides read-only access
        // Verify it's a Set by checking for Set methods at runtime
        expect(typeof tracked.has).toBe('function');
        expect(typeof tracked.forEach).toBe('function');
        expect(tracked.size).toBe(1);
      });
    });

    describe('trackedTextures', () => {
      it('returns ReadonlySet of tracked textures', () => {
        const texture1 = glContext.createTexture();
        const texture2 = glContext.createTexture();

        const tracked = glContext.trackedTextures;
        expect(tracked.has(texture1)).toBe(true);
        expect(tracked.has(texture2)).toBe(true);
        expect(tracked.size).toBe(2);
      });

      it('allows inspection via Set interface', () => {
        const texture = glContext.createTexture();
        const tracked = glContext.trackedTextures;

        // Type is ReadonlySet<WebGLTexture> - provides read-only access
        // Verify it's a Set by checking for Set methods at runtime
        expect(typeof tracked.has).toBe('function');
        expect(typeof tracked.forEach).toBe('function');
        expect(tracked.size).toBe(1);
      });
    });

    describe('trackedVertexArrays', () => {
      it('returns ReadonlySet of tracked vertex arrays', () => {
        const vao1 = glContext.createVertexArray();
        const vao2 = glContext.createVertexArray();

        const tracked = glContext.trackedVertexArrays;
        expect(tracked.has(vao1)).toBe(true);
        expect(tracked.has(vao2)).toBe(true);
        expect(tracked.size).toBe(2);
      });

      it('allows inspection via Set interface', () => {
        const vao = glContext.createVertexArray();
        const tracked = glContext.trackedVertexArrays;

        // Type is ReadonlySet<WebGLVertexArrayObject> - provides read-only access
        // Verify it's a Set by checking for Set methods at runtime
        expect(typeof tracked.has).toBe('function');
        expect(typeof tracked.forEach).toBe('function');
        expect(tracked.size).toBe(1);
      });
    });
  });

  describe('texture methods', () => {
    let glContext: GLContext;

    beforeEach(() => {
      glContext = new GLContext(canvas);
      vi.clearAllMocks();
      vi.spyOn(canvas, 'getContext').mockReturnValue(mockGL as WebGL2RenderingContext);
    });

    describe('bindTexture', () => {
      it('activates texture unit and binds texture', () => {
        const texture = glContext.createTexture();
        glContext.bindTexture(mockGL.TEXTURE_2D!, texture, 1);

        expect(mockGL.activeTexture).toHaveBeenCalledWith(mockGL.TEXTURE0! + 1);
        expect(mockGL.bindTexture).toHaveBeenCalledWith(mockGL.TEXTURE_2D, texture);
      });

      it('uses texture unit 0 by default', () => {
        const texture = glContext.createTexture();
        glContext.bindTexture(mockGL.TEXTURE_2D!, texture);

        expect(mockGL.activeTexture).toHaveBeenCalledWith(mockGL.TEXTURE0);
      });

      it('can bind null to unbind', () => {
        glContext.bindTexture(mockGL.TEXTURE_2D!, null);

        expect(mockGL.activeTexture).toHaveBeenCalled();
        expect(mockGL.bindTexture).toHaveBeenCalledWith(mockGL.TEXTURE_2D, null);
      });
    });

    describe('setActiveTextureUnit', () => {
      it('sets the active texture unit', () => {
        glContext.setActiveTextureUnit(3);
        expect(mockGL.activeTexture).toHaveBeenCalledWith(mockGL.TEXTURE0! + 3);
      });
    });

    describe('unbindTexture', () => {
      it('activates texture unit and unbinds', () => {
        glContext.unbindTexture(mockGL.TEXTURE_2D!, 2);

        expect(mockGL.activeTexture).toHaveBeenCalledWith(mockGL.TEXTURE0! + 2);
        expect(mockGL.bindTexture).toHaveBeenCalledWith(mockGL.TEXTURE_2D, null);
      });

      it('uses texture unit 0 by default', () => {
        glContext.unbindTexture(mockGL.TEXTURE_2D!);

        expect(mockGL.activeTexture).toHaveBeenCalledWith(mockGL.TEXTURE0);
        expect(mockGL.bindTexture).toHaveBeenCalledWith(mockGL.TEXTURE_2D, null);
      });
    });

    describe('texParameteri', () => {
      it('binds, sets parameter, and unbinds', () => {
        const texture = glContext.createTexture();
        const LINEAR = 0x2601;
        glContext.texParameteri(
          mockGL.TEXTURE_2D!,
          texture,
          0x2801, // TEXTURE_MIN_FILTER
          LINEAR,
        );

        expect(mockGL.bindTexture).toHaveBeenCalledWith(mockGL.TEXTURE_2D, texture);
        expect(mockGL.texParameteri).toHaveBeenCalledWith(mockGL.TEXTURE_2D, 0x2801, LINEAR);
        expect(mockGL.bindTexture).toHaveBeenCalledWith(mockGL.TEXTURE_2D, null);
      });

      it('handles different texture targets', () => {
        const texture = glContext.createTexture();
        const TEXTURE_CUBE_MAP = 0x8513;
        glContext.texParameteri(TEXTURE_CUBE_MAP, texture, 0x2801, 0x2601);

        expect(mockGL.bindTexture).toHaveBeenCalledWith(TEXTURE_CUBE_MAP, texture);
      });
    });

    describe('texParameterf', () => {
      it('binds, sets float parameter, and unbinds', () => {
        const texture = glContext.createTexture();
        glContext.texParameterf(mockGL.TEXTURE_2D!, texture, 0x84ef, 0.5); // TEXTURE_LOD_BIAS

        expect(mockGL.bindTexture).toHaveBeenCalledWith(mockGL.TEXTURE_2D, texture);
        expect(mockGL.texParameterf).toHaveBeenCalledWith(mockGL.TEXTURE_2D, 0x84ef, 0.5);
        expect(mockGL.bindTexture).toHaveBeenCalledWith(mockGL.TEXTURE_2D, null);
      });
    });

    describe('texImage3D', () => {
      it('binds, uploads data, and unbinds', () => {
        const texture = glContext.createTexture();
        const data = new Uint8Array(8);
        glContext.texImage3D(
          mockGL.TEXTURE_2D!,
          texture,
          0,
          0x1908,
          2,
          2,
          2,
          0,
          0x1908,
          0x1401,
          data,
        );

        expect(mockGL.bindTexture).toHaveBeenCalledWith(mockGL.TEXTURE_2D, texture);
        expect(mockGL.texImage3D).toHaveBeenCalledWith(
          mockGL.TEXTURE_2D,
          0,
          0x1908,
          2,
          2,
          2,
          0,
          0x1908,
          0x1401,
          data,
        );
        expect(mockGL.bindTexture).toHaveBeenCalledWith(mockGL.TEXTURE_2D, null);
      });
    });

    describe('texSubImage3D', () => {
      it('binds, uploads sub data, and unbinds', () => {
        const texture = glContext.createTexture();
        const data = new Uint8Array(4);
        glContext.texSubImage3D(
          mockGL.TEXTURE_2D!,
          texture,
          0,
          1,
          2,
          3,
          4,
          5,
          6,
          0x1908,
          0x1401,
          data,
        );

        expect(mockGL.bindTexture).toHaveBeenCalledWith(mockGL.TEXTURE_2D, texture);
        expect(mockGL.texSubImage3D).toHaveBeenCalledWith(
          mockGL.TEXTURE_2D,
          0,
          1,
          2,
          3,
          4,
          5,
          6,
          0x1908,
          0x1401,
          data,
        );
        expect(mockGL.bindTexture).toHaveBeenCalledWith(mockGL.TEXTURE_2D, null);
      });
    });

    describe('texStorage2D', () => {
      it('binds, allocates storage, and unbinds', () => {
        const texture = glContext.createTexture();
        glContext.texStorage2D(mockGL.TEXTURE_2D!, texture, 3, 0x1908, 64, 32);

        expect(mockGL.bindTexture).toHaveBeenCalledWith(mockGL.TEXTURE_2D, texture);
        expect(mockGL.texStorage2D).toHaveBeenCalledWith(
          mockGL.TEXTURE_2D,
          3,
          0x1908,
          64,
          32,
        );
        expect(mockGL.bindTexture).toHaveBeenCalledWith(mockGL.TEXTURE_2D, null);
      });
    });

    describe('texStorage3D', () => {
      it('binds, allocates storage, and unbinds', () => {
        const texture = glContext.createTexture();
        glContext.texStorage3D(mockGL.TEXTURE_2D!, texture, 2, 0x1908, 8, 8, 4);

        expect(mockGL.bindTexture).toHaveBeenCalledWith(mockGL.TEXTURE_2D, texture);
        expect(mockGL.texStorage3D).toHaveBeenCalledWith(
          mockGL.TEXTURE_2D,
          2,
          0x1908,
          8,
          8,
          4,
        );
        expect(mockGL.bindTexture).toHaveBeenCalledWith(mockGL.TEXTURE_2D, null);
      });
    });

    describe('texImage2D', () => {
      it('binds, uploads image data, and unbinds', () => {
        const texture = glContext.createTexture();
        const imageData = new Uint8Array(256 * 256 * 4);
        const RGBA = 0x1908;
        const UNSIGNED_BYTE = 0x1401;

        glContext.texImage2D(
          mockGL.TEXTURE_2D!,
          texture,
          0,
          RGBA,
          256,
          256,
          0,
          RGBA,
          UNSIGNED_BYTE,
          imageData,
        );

        expect(mockGL.bindTexture).toHaveBeenCalledWith(mockGL.TEXTURE_2D, texture);
        expect(mockGL.texImage2D).toHaveBeenCalledWith(
          mockGL.TEXTURE_2D,
          0,
          RGBA,
          256,
          256,
          0,
          RGBA,
          UNSIGNED_BYTE,
          imageData,
        );
        expect(mockGL.bindTexture).toHaveBeenCalledWith(mockGL.TEXTURE_2D, null);
      });

      it('handles null data (allocate without upload)', () => {
        const texture = glContext.createTexture();
        const RGBA = 0x1908;
        const UNSIGNED_BYTE = 0x1401;

        glContext.texImage2D(
          mockGL.TEXTURE_2D!,
          texture,
          0,
          RGBA,
          256,
          256,
          0,
          RGBA,
          UNSIGNED_BYTE,
        );

        expect(mockGL.texImage2D).toHaveBeenCalledWith(
          mockGL.TEXTURE_2D,
          0,
          RGBA,
          256,
          256,
          0,
          RGBA,
          UNSIGNED_BYTE,
          null,
        );
      });
    });

    describe('texSubImage2D', () => {
      it('binds, updates partial texture, and unbinds', () => {
        const texture = glContext.createTexture();
        const imageData = new Uint8Array(128 * 128 * 4);
        const RGBA = 0x1908;
        const UNSIGNED_BYTE = 0x1401;

        glContext.texSubImage2D(
          mockGL.TEXTURE_2D!,
          texture,
          0,
          64,
          64,
          128,
          128,
          RGBA,
          UNSIGNED_BYTE,
          imageData,
        );

        expect(mockGL.bindTexture).toHaveBeenCalledWith(mockGL.TEXTURE_2D, texture);
        expect(mockGL.texSubImage2D).toHaveBeenCalledWith(
          mockGL.TEXTURE_2D,
          0,
          64,
          64,
          128,
          128,
          RGBA,
          UNSIGNED_BYTE,
          imageData,
        );
        expect(mockGL.bindTexture).toHaveBeenCalledWith(mockGL.TEXTURE_2D, null);
      });
    });

    describe('getTexParameter', () => {
      it('queries texture parameters', () => {
        const LINEAR = 0x2601;
        mockGL.getTexParameter = vi.fn(() => LINEAR);

        const result = glContext.getTexParameter(mockGL.TEXTURE_2D!, 0x2801); // TEXTURE_MIN_FILTER

        expect(result).toBe(LINEAR);
        expect(mockGL.getTexParameter).toHaveBeenCalledWith(mockGL.TEXTURE_2D, 0x2801);
      });

      it('returns null for unset parameters', () => {
        mockGL.getTexParameter = vi.fn(() => null);

        const result = glContext.getTexParameter(mockGL.TEXTURE_2D!, 0x2801);

        expect(result).toBeNull();
      });
    });

    describe('texImage2DSource', () => {
      it('binds, uploads image source, and unbinds', () => {
        const texture = glContext.createTexture();
        const imageSource = {} as TexImageSource;
        const RGBA = 0x1908;
        const UNSIGNED_BYTE = 0x1401;

        glContext.texImage2DSource(
          mockGL.TEXTURE_2D!,
          texture,
          0,
          RGBA,
          RGBA,
          UNSIGNED_BYTE,
          imageSource,
        );

        expect(mockGL.bindTexture).toHaveBeenCalledWith(mockGL.TEXTURE_2D, texture);
        expect(mockGL.texImage2D).toHaveBeenCalledWith(
          mockGL.TEXTURE_2D,
          0,
          RGBA,
          RGBA,
          UNSIGNED_BYTE,
          imageSource,
        );
        expect(mockGL.bindTexture).toHaveBeenCalledWith(mockGL.TEXTURE_2D, null);
      });
    });

    describe('isTexture', () => {
      it('returns true for valid texture', () => {
        const texture = glContext.createTexture();
        mockGL.isTexture = vi.fn(() => true);

        const result = glContext.isTexture(texture);

        expect(result).toBe(true);
        expect(mockGL.isTexture).toHaveBeenCalledWith(texture);
      });

      it('returns false for null', () => {
        mockGL.isTexture = vi.fn(() => false);

        const result = glContext.isTexture(null);

        expect(result).toBe(false);
        expect(mockGL.isTexture).toHaveBeenCalledWith(null);
      });

      it('returns false for deleted texture', () => {
        const texture = glContext.createTexture();
        mockGL.deleteTexture(texture);
        mockGL.isTexture = vi.fn(() => false);

        const result = glContext.isTexture(texture);

        expect(result).toBe(false);
      });
    });
  });

  describe('vertex array methods', () => {
    let glContext: GLContext;

    beforeEach(() => {
      glContext = new GLContext(canvas);
      vi.clearAllMocks();
      vi.spyOn(canvas, 'getContext').mockReturnValue(mockGL as WebGL2RenderingContext);
      mockGL.bindVertexArray = vi.fn();
      mockGL.vertexAttribPointer = vi.fn();
      mockGL.enableVertexAttribArray = vi.fn();
      mockGL.disableVertexAttribArray = vi.fn();
      mockGL.getVertexAttrib = vi.fn();
    });

    describe('bindVertexArray', () => {
      it('binds vertex array object', () => {
        const vao = glContext.createVertexArray();
        glContext.bindVertexArray(vao);

        expect(mockGL.bindVertexArray).toHaveBeenCalledWith(vao);
      });

      it('can bind null to unbind', () => {
        glContext.bindVertexArray(null);

        expect(mockGL.bindVertexArray).toHaveBeenCalledWith(null);
      });
    });

    describe('unbindVertexArray', () => {
      it('unbinds current vertex array', () => {
        glContext.unbindVertexArray();

        expect(mockGL.bindVertexArray).toHaveBeenCalledWith(null);
      });
    });

    describe('vertexAttribPointer', () => {
      it('defines vertex attribute layout', () => {
        glContext.vertexAttribPointer(0, 3, mockGL.FLOAT!, false, 12, 0);

        expect(mockGL.vertexAttribPointer).toHaveBeenCalledWith(0, 3, mockGL.FLOAT, false, 12, 0);
      });

      it('handles different data types and strides', () => {
        glContext.vertexAttribPointer(1, 4, mockGL.UNSIGNED_BYTE!, true, 8, 4);

        expect(mockGL.vertexAttribPointer).toHaveBeenCalledWith(
          1,
          4,
          mockGL.UNSIGNED_BYTE,
          true,
          8,
          4,
        );
      });

      it('supports tight packing (stride = 0)', () => {
        glContext.vertexAttribPointer(0, 2, mockGL.FLOAT!, false, 0, 0);

        expect(mockGL.vertexAttribPointer).toHaveBeenCalledWith(0, 2, mockGL.FLOAT, false, 0, 0);
      });
    });

    describe('enableVertexAttribArray', () => {
      it('enables vertex attribute array', () => {
        glContext.enableVertexAttribArray(0);

        expect(mockGL.enableVertexAttribArray).toHaveBeenCalledWith(0);
      });

      it('can enable multiple attributes', () => {
        glContext.enableVertexAttribArray(0);
        glContext.enableVertexAttribArray(1);
        glContext.enableVertexAttribArray(2);

        expect(mockGL.enableVertexAttribArray).toHaveBeenCalledTimes(3);
      });
    });

    describe('disableVertexAttribArray', () => {
      it('disables vertex attribute array', () => {
        glContext.disableVertexAttribArray(0);

        expect(mockGL.disableVertexAttribArray).toHaveBeenCalledWith(0);
      });

      it('can disable multiple attributes', () => {
        glContext.disableVertexAttribArray(0);
        glContext.disableVertexAttribArray(1);

        expect(mockGL.disableVertexAttribArray).toHaveBeenCalledTimes(2);
      });
    });

    describe('getVertexAttrib', () => {
      it('queries vertex attribute value', () => {
        mockGL.getVertexAttrib = vi.fn(() => true);

        const result = glContext.getVertexAttrib(0, 0x8622); // VERTEX_ATTRIB_ARRAY_ENABLED

        expect(result).toBe(true);
        expect(mockGL.getVertexAttrib).toHaveBeenCalledWith(0, 0x8622);
      });

      it('returns null for unset attributes', () => {
        mockGL.getVertexAttrib = vi.fn(() => null);

        const result = glContext.getVertexAttrib(0, 0x8622);

        expect(result).toBeNull();
      });

      it('queries different attribute parameters', () => {
        mockGL.getVertexAttrib = vi.fn(() => 4);

        const result = glContext.getVertexAttrib(0, 0x8623); // VERTEX_ATTRIB_ARRAY_SIZE

        expect(result).toBe(4);
        expect(mockGL.getVertexAttrib).toHaveBeenCalledWith(0, 0x8623);
      });
    });

    describe('buffer binding methods', () => {
      it('bindBuffer binds buffer to target', () => {
        const buffer = glContext.createBuffer(mockGL.ARRAY_BUFFER!);
        glContext.bindBuffer(mockGL.ARRAY_BUFFER!, buffer);

        expect(mockGL.bindBuffer).toHaveBeenCalledWith(mockGL.ARRAY_BUFFER, buffer);
      });

      it('unbindBuffer unbinds buffer from target', () => {
        glContext.unbindBuffer(mockGL.ARRAY_BUFFER!);

        expect(mockGL.bindBuffer).toHaveBeenCalledWith(mockGL.ARRAY_BUFFER, null);
      });

      it('getBufferParameter queries buffer', () => {
        mockGL.getBufferParameter = vi.fn(() => 1024);

        const size = glContext.getBufferParameter(mockGL.ARRAY_BUFFER!, 0x8764); // BUFFER_SIZE

        expect(size).toBe(1024);
        expect(mockGL.getBufferParameter).toHaveBeenCalledWith(mockGL.ARRAY_BUFFER, 0x8764);
      });
    });

    describe('bufferSubData', () => {
      it('binds, updates, and unbinds buffer', () => {
        const buffer = glContext.createBuffer(mockGL.ARRAY_BUFFER!);
        const data = new Float32Array([1, 2, 3, 4]);

        glContext.bufferSubData(mockGL.ARRAY_BUFFER!, buffer, 0, data);

        expect(mockGL.bindBuffer).toHaveBeenCalledWith(mockGL.ARRAY_BUFFER, buffer);
        expect(mockGL.bufferSubData).toHaveBeenCalledWith(mockGL.ARRAY_BUFFER, 0, data);
        expect(mockGL.bindBuffer).toHaveBeenCalledWith(mockGL.ARRAY_BUFFER, null);
      });

      it('handles non-zero offset updates', () => {
        const buffer = glContext.createBuffer(mockGL.ARRAY_BUFFER!);
        const data = new Float32Array([5, 6]);

        glContext.bufferSubData(mockGL.ARRAY_BUFFER!, buffer, 16, data);

        expect(mockGL.bufferSubData).toHaveBeenCalledWith(mockGL.ARRAY_BUFFER, 16, data);
      });
    });
  });
});
