import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Renderer } from '../../src/core/Renderer.js';
import { GLContext } from '../../src/core/GLContext.js';

/**
 * Test suite for Renderer (abstract base class)
 *
 * Tests renderer functionality including:
 * - Constructor initialization
 * - Viewport sizing
 * - Clear color management
 * - Abstract method interface
 * - Input validation
 * - Resource cleanup
 */

describe('Renderer', () => {
  let container: HTMLDivElement;
  let mockGLContext: GLContext;

  beforeEach(() => {
    // Create a container div for tests
    container = document.createElement('div');
    container.id = 'test-container';
    document.body.appendChild(container);

    // Mock WebGL context for canvas tests
    const mockGL: Partial<WebGL2RenderingContext> = {
      NO_ERROR: 0,
      DEPTH_TEST: 0x0b71,
      CULL_FACE: 0x0b44,
      BLEND: 0x0be2,
      BACK: 1029,
      SRC_ALPHA: 0x0302,
      ONE_MINUS_SRC_ALPHA: 0x0303,
      enable: vi.fn(),
      cullFace: vi.fn(),
      blendFunc: vi.fn(),
      viewport: vi.fn(),
      clearColor: vi.fn(),
      clear: vi.fn(),
      getError: vi.fn(() => 0),
      setSize: vi.fn(),
      dispose: vi.fn(),
    };

    // Mock HTMLCanvasElement.prototype.getContext
    HTMLCanvasElement.prototype.getContext = vi.fn(() =>
      mockGL as WebGL2RenderingContext,
    );

    // Create a real canvas element and GLContext for testing
    const canvas = document.createElement('canvas');
    mockGLContext = new GLContext(canvas);
  });

  afterEach(() => {
    // Clean up container
    if (container.parentElement) {
      container.parentElement.removeChild(container);
    }
    vi.clearAllMocks();
  });

  describe('constructor', () => {
    it('creates renderer with valid dimensions', () => {
      class TestRenderer extends Renderer {
        render(): void {}
        dispose(): void {}
      }

      const renderer = new TestRenderer(mockGLContext, 800, 600);
      expect(renderer).toBeDefined();
      expect(renderer.width).toBe(800);
      expect(renderer.height).toBe(600);
    });

    it('initializes with default clear color', () => {
      class TestRenderer extends Renderer {
        render(): void {}
        dispose(): void {}
      }

      const renderer = new TestRenderer(mockGLContext, 800, 600);
      const clearColor = renderer.clearColor;
      expect(clearColor.r).toBe(0);
      expect(clearColor.g).toBe(0);
      expect(clearColor.b).toBe(0);
      expect(clearColor.a).toBe(1);
    });

    it('throws error for invalid width', () => {
      class TestRenderer extends Renderer {
        render(): void {}
        dispose(): void {}
      }

      expect(() => new TestRenderer(mockGLContext, 0, 600)).toThrow(
        /Invalid width/,
      );
      expect(() => new TestRenderer(mockGLContext, -100, 600)).toThrow(
        /Invalid width/,
      );
      expect(() => new TestRenderer(mockGLContext, NaN, 600)).toThrow(
        /Invalid width/,
      );
      expect(() => new TestRenderer(mockGLContext, Infinity, 600)).toThrow(
        /Invalid width/,
      );
    });

    it('throws error for invalid height', () => {
      class TestRenderer extends Renderer {
        render(): void {}
        dispose(): void {}
      }

      expect(() => new TestRenderer(mockGLContext, 800, 0)).toThrow(
        /Invalid height/,
      );
      expect(() => new TestRenderer(mockGLContext, 800, -100)).toThrow(
        /Invalid height/,
      );
      expect(() => new TestRenderer(mockGLContext, 800, NaN)).toThrow(
        /Invalid height/,
      );
      expect(() => new TestRenderer(mockGLContext, 800, Infinity)).toThrow(
        /Invalid height/,
      );
    });
  });

  describe('properties', () => {
    let renderer: Renderer;

    beforeEach(() => {
      class TestRenderer extends Renderer {
        render(): void {}
        dispose(): void {}
      }
      renderer = new TestRenderer(mockGLContext, 1024, 768);
    });

    it('provides access to context', () => {
      expect(renderer.context).toBe(mockGLContext);
    });

    it('returns correct width', () => {
      expect(renderer.width).toBe(1024);
    });

    it('returns correct height', () => {
      expect(renderer.height).toBe(768);
    });

    it('returns copy of clear color', () => {
      const color1 = renderer.clearColor;
      const color2 = renderer.clearColor;

      // Should be different objects (defensive copy)
      expect(color1).not.toBe(color2);
      // But with same values
      expect(color1).toEqual(color2);
    });
  });

  describe('setSize', () => {
    let renderer: Renderer;

    beforeEach(() => {
      class TestRenderer extends Renderer {
        render(): void {}
        dispose(): void {}
      }
      renderer = new TestRenderer(mockGLContext, 800, 600);
    });

    it('updates renderer dimensions', () => {
      renderer.setSize(1024, 768);
      expect(renderer.width).toBe(1024);
      expect(renderer.height).toBe(768);
    });

    it('calls context setSize', () => {
      const contextSetSizeSpy = vi.spyOn(mockGLContext, 'setSize');
      renderer.setSize(1024, 768);
      expect(contextSetSizeSpy).toHaveBeenCalledWith(1024, 768);
    });

    it('throws error for invalid width', () => {
      expect(() => renderer.setSize(0, 600)).toThrow(/Invalid width/);
      expect(() => renderer.setSize(-100, 600)).toThrow(/Invalid width/);
      expect(() => renderer.setSize(NaN, 600)).toThrow(/Invalid width/);
    });

    it('throws error for invalid height', () => {
      expect(() => renderer.setSize(800, 0)).toThrow(/Invalid height/);
      expect(() => renderer.setSize(800, -100)).toThrow(/Invalid height/);
      expect(() => renderer.setSize(800, NaN)).toThrow(/Invalid height/);
    });

    it('handles very large dimensions', () => {
      renderer.setSize(4096, 2160);
      expect(renderer.width).toBe(4096);
      expect(renderer.height).toBe(2160);
    });

    it('handles decimal dimensions', () => {
      renderer.setSize(1920.5, 1080.5);
      expect(renderer.width).toBe(1920.5);
      expect(renderer.height).toBe(1080.5);
    });
  });

  describe('setClearColor', () => {
    let renderer: Renderer;

    beforeEach(() => {
      class TestRenderer extends Renderer {
        render(): void {}
        dispose(): void {}
      }
      renderer = new TestRenderer(mockGLContext, 800, 600);
    });

    it('sets clear color with alpha', () => {
      renderer.setClearColor(0.5, 0.5, 0.5, 0.8);
      const color = renderer.clearColor;
      expect(color.r).toBe(0.5);
      expect(color.g).toBe(0.5);
      expect(color.b).toBe(0.5);
      expect(color.a).toBe(0.8);
    });

    it('sets clear color without alpha (defaults to 1.0)', () => {
      renderer.setClearColor(0.2, 0.3, 0.4);
      const color = renderer.clearColor;
      expect(color.r).toBe(0.2);
      expect(color.g).toBe(0.3);
      expect(color.b).toBe(0.4);
      expect(color.a).toBe(1.0);
    });

    it('calls context setClearColor', () => {
      const contextSetClearColorSpy = vi.spyOn(
        mockGLContext,
        'setClearColor',
      );
      renderer.setClearColor(0.2, 0.3, 0.4, 0.9);
      expect(contextSetClearColorSpy).toHaveBeenCalledWith(0.2, 0.3, 0.4, 0.9);
    });

    it('throws error for out-of-range red', () => {
      expect(() => renderer.setClearColor(-0.1, 0.5, 0.5)).toThrow(
        /Invalid color component r/,
      );
      expect(() => renderer.setClearColor(1.1, 0.5, 0.5)).toThrow(
        /Invalid color component r/,
      );
    });

    it('throws error for out-of-range green', () => {
      expect(() => renderer.setClearColor(0.5, -0.1, 0.5)).toThrow(
        /Invalid color component g/,
      );
      expect(() => renderer.setClearColor(0.5, 1.1, 0.5)).toThrow(
        /Invalid color component g/,
      );
    });

    it('throws error for out-of-range blue', () => {
      expect(() => renderer.setClearColor(0.5, 0.5, -0.1)).toThrow(
        /Invalid color component b/,
      );
      expect(() => renderer.setClearColor(0.5, 0.5, 1.1)).toThrow(
        /Invalid color component b/,
      );
    });

    it('throws error for out-of-range alpha', () => {
      expect(() => renderer.setClearColor(0.5, 0.5, 0.5, -0.1)).toThrow(
        /Invalid color component a/,
      );
      expect(() => renderer.setClearColor(0.5, 0.5, 0.5, 1.1)).toThrow(
        /Invalid color component a/,
      );
    });

    it('throws error for NaN color components', () => {
      expect(() => renderer.setClearColor(NaN, 0.5, 0.5)).toThrow(
        /Invalid color component/,
      );
      expect(() => renderer.setClearColor(0.5, NaN, 0.5)).toThrow(
        /Invalid color component/,
      );
      expect(() => renderer.setClearColor(0.5, 0.5, NaN)).toThrow(
        /Invalid color component/,
      );
      expect(() => renderer.setClearColor(0.5, 0.5, 0.5, NaN)).toThrow(
        /Invalid color component/,
      );
    });

    it('throws error for Infinity color components', () => {
      expect(() => renderer.setClearColor(Infinity, 0.5, 0.5)).toThrow(
        /Invalid color component/,
      );
      expect(() => renderer.setClearColor(0.5, Infinity, 0.5)).toThrow(
        /Invalid color component/,
      );
    });

    it('accepts boundary values 0 and 1', () => {
      renderer.setClearColor(0, 0, 0, 0);
      let color = renderer.clearColor;
      expect(color.r).toBe(0);
      expect(color.a).toBe(0);

      renderer.setClearColor(1, 1, 1, 1);
      color = renderer.clearColor;
      expect(color.r).toBe(1);
      expect(color.a).toBe(1);
    });
  });

  describe('clear', () => {
    let renderer: Renderer;

    beforeEach(() => {
      class TestRenderer extends Renderer {
        render(): void {}
        dispose(): void {}
      }
      renderer = new TestRenderer(mockGLContext, 800, 600);
    });

    it('calls context clear', () => {
      const contextClearSpy = vi.spyOn(mockGLContext, 'clear');
      renderer.clear();
      expect(contextClearSpy).toHaveBeenCalled();
    });
  });

  describe('abstract methods', () => {
    it('render is abstract and must be implemented', () => {
      // This test verifies the abstract method exists
      class TestRenderer extends Renderer {
        render(): void {
          // Implementation for test
        }
        dispose(): void {
          // Implementation for test
        }
      }

      const renderer = new TestRenderer(mockGLContext, 800, 600);
      expect(() => renderer.render()).not.toThrow();
    });

    it('dispose is abstract and must be implemented', () => {
      // This test verifies the abstract method exists
      class TestRenderer extends Renderer {
        render(): void {
          // Implementation for test
        }
        dispose(): void {
          // Implementation for test
        }
      }

      const renderer = new TestRenderer(mockGLContext, 800, 600);
      expect(() => renderer.dispose()).not.toThrow();
    });

    it('requires concrete implementation of abstract methods', () => {
      // TypeScript enforces that abstract methods must be implemented
      // in concrete subclasses. This test documents that requirement.
      class IncompleteRenderer extends Renderer {
        // Only implements render, not dispose
        render(): void {}
        // Missing dispose implementation - would cause TypeScript error
        dispose(): void {}
      }

      const renderer = new IncompleteRenderer(mockGLContext, 800, 600);
      expect(renderer).toBeDefined();
      expect(typeof renderer.render).toBe('function');
      expect(typeof renderer.dispose).toBe('function');
    });
  });

  describe('integration', () => {
    it('complete renderer workflow', () => {
      class TestRenderer extends Renderer {
        render(): void {
          this.clear();
        }
        dispose(): void {
          // Cleanup
        }
      }

      // Create renderer
      const renderer = new TestRenderer(mockGLContext, 800, 600);
      expect(renderer.width).toBe(800);
      expect(renderer.height).toBe(600);

      // Set clear color
      renderer.setClearColor(0.2, 0.3, 0.4, 1.0);
      expect(renderer.clearColor).toEqual({
        r: 0.2,
        g: 0.3,
        b: 0.4,
        a: 1.0,
      });

      // Resize
      renderer.setSize(1024, 768);
      expect(renderer.width).toBe(1024);
      expect(renderer.height).toBe(768);

      // Render
      const contextClearSpy = vi.spyOn(mockGLContext, 'clear');
      renderer.render();
      expect(contextClearSpy).toHaveBeenCalled();

      // Cleanup
      renderer.dispose();
    });

    it('multiple dimension and color changes', () => {
      class TestRenderer extends Renderer {
        render(): void {}
        dispose(): void {}
      }

      const renderer = new TestRenderer(mockGLContext, 800, 600);

      // Multiple size changes
      for (let i = 0; i < 5; i++) {
        const width = 400 + i * 100;
        const height = 300 + i * 100;
        renderer.setSize(width, height);
        expect(renderer.width).toBe(width);
        expect(renderer.height).toBe(height);
      }

      // Multiple color changes
      const colors = [
        [0.0, 0.0, 0.0],
        [1.0, 0.0, 0.0],
        [0.0, 1.0, 0.0],
        [0.0, 0.0, 1.0],
        [1.0, 1.0, 1.0],
      ];

      for (const [r, g, b] of colors) {
        renderer.setClearColor(r, g, b);
        const color = renderer.clearColor;
        expect(color.r).toBe(r);
        expect(color.g).toBe(g);
        expect(color.b).toBe(b);
        expect(color.a).toBe(1.0);
      }
    });
  });
});
