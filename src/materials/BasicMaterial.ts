import { GLContext } from '../core/GLContext';
import { Program } from '../resources/Program';
import { VertexShader } from '../resources/shaders/VertexShader';
import { FragmentShader } from '../resources/shaders/FragmentShader';
import { GLSLType } from '../resources/shaders/GLSLType';
import { Material } from './Material';

/**
 * Options for BasicMaterial
 */
export interface BasicMaterialOptions {
  /** Color as hex number (e.g., 0xff0000 for red) or [r, g, b, a] array */
  color?: number | [number, number, number, number];
  /** Whether to use vertex colors instead of uniform color */
  vertexColors?: boolean;
  /** Blend factor between uniform color (0) and vertex color (1); overrides vertexColors when provided */
  vertexColorFactor?: number;
}

/**
 * Default vertex shader source for BasicMaterial
 * @internal
 */
const BASIC_VERTEX_SOURCE = `#version 300 es
precision highp float;

in vec3 aPosition;
in vec4 aColor;

uniform mat4 uModelViewProjection;

out vec4 vColor;

void main() {
  gl_Position = uModelViewProjection * vec4(aPosition, 1.0);
  vColor = aColor;
}
`;

/**
 * Default fragment shader source for BasicMaterial
 * @internal
 */
const BASIC_FRAGMENT_SOURCE = `#version 300 es
precision highp float;

uniform vec4 uColor;
uniform float uVertexColorFactor;

in vec4 vColor;
out vec4 fragColor;

void main() {
  fragColor = mix(uColor, vColor, uVertexColorFactor);
}
`;

/**
 * Creates the vertex shader for BasicMaterial with declarations
 * @internal
 */
function createBasicVertexShader(): VertexShader {
  return new VertexShader(BASIC_VERTEX_SOURCE)
    .declareAttribute('aPosition', GLSLType.Vec3)
    .declareAttribute('aColor', GLSLType.Vec4)
    .declareUniform('uModelViewProjection', GLSLType.Mat4)
    .declareVarying('vColor', GLSLType.Vec4);
}

/**
 * Creates the fragment shader for BasicMaterial with declarations
 * @internal
 */
function createBasicFragmentShader(): FragmentShader {
  return new FragmentShader(BASIC_FRAGMENT_SOURCE)
    .declareUniform('uColor', GLSLType.Vec4)
    .declareUniform('uVertexColorFactor', GLSLType.Float)
    .declareVarying('vColor', GLSLType.Vec4)
    .declareOutput('fragColor', GLSLType.Vec4);
}

/**
 * BasicMaterial - Simple flat-color material (Layer 3)
 *
 * BasicMaterial renders geometry with a single flat color, without lighting.
 * This is the simplest material and serves as a good starting point.
 *
 * **Features:**
 * - Single color (uniform or per-vertex)
 * - Alpha via color's vec4
 * - No lighting calculations
 *
 * **Usage:**
 * ```typescript
 * // Using hex color
 * const redMaterial = new BasicMaterial(ctx, { color: 0xff0000 });
 *
 * // Using RGBA array
 * const blueMaterial = new BasicMaterial(ctx, {
 *   color: [0.0, 0.0, 1.0, 1.0]
 * });
 *
 * // With vertex colors
 * const vertexColorMaterial = new BasicMaterial(ctx, {
 *   vertexColorFactor: 1
 * });
 *
 * // Blend vertex and uniform colors
 * const blendedColorMaterial = new BasicMaterial(ctx, {
 *   vertexColorFactor: 0.5
 * });
 * ```
 *
 * @see Material for the base material class
 */
export class BasicMaterial extends Material {
  /**
   * Material color as [r, g, b, a]
   * @internal
   */
  private _color: [number, number, number, number];

  /**
   * Blend factor between uniform color (0) and vertex color (1)
   * @internal
   */
  private _vertexColorFactor: number;

  /**
   * Whether to render as wireframe
   */
  wireframe: boolean = false;

  protected override get _resourceName(): string {
    return 'BasicMaterial';
  }

  /**
   * Creates a new BasicMaterial
   *
   * @param ctx - GLContext to use
   * @param options - Material options
   */
  constructor(ctx: GLContext, options: BasicMaterialOptions = {}) {
    // Create the program from shader definitions
    const vertexShader = createBasicVertexShader();
    const fragmentShader = createBasicFragmentShader();
    const program = new Program(ctx, vertexShader, fragmentShader);
    super(ctx, program);

    // Parse color option
    this._color = BasicMaterial._parseColor(options.color);
    const vertexColorFactor = options.vertexColorFactor ?? (options.vertexColors ? 1 : 0);
    this._vertexColorFactor = Math.max(0, Math.min(1, vertexColorFactor));

    // Set initial uniforms
    this.setUniform('uColor', this._color);
    this.setUniform('uVertexColorFactor', this._vertexColorFactor);
  }

  /**
   * Gets the material color
   */
  get color(): [number, number, number, number] {
    return [...this._color] as [number, number, number, number];
  }

  /**
   * Sets the material color
   *
   * @param value - Color as hex number or [r, g, b, a] array
   */
  set color(value: number | [number, number, number, number]) {
    this._color = BasicMaterial._parseColor(value);
    this.setUniform('uColor', this._color);
  }

  /**
   * Gets the opacity (alpha component)
   */
  get opacity(): number {
    return this._color[3];
  }

  /**
   * Sets the opacity
   *
   * @param value - Opacity (0.0 - 1.0)
   */
  set opacity(value: number) {
    this._color[3] = Math.max(0, Math.min(1, value));
    this.setUniform('uColor', this._color);
  }

  /**
   * Gets whether vertex colors fully override uniform color
   */
  get vertexColors(): boolean {
    return this._vertexColorFactor === 1;
  }

  /**
   * Sets whether vertex colors fully override uniform color
   */
  set vertexColors(value: boolean) {
    this.vertexColorFactor = value ? 1 : 0;
  }

  /**
   * Gets the vertex color blend factor (0 = uniform color, 1 = vertex color)
   */
  get vertexColorFactor(): number {
    return this._vertexColorFactor;
  }

  /**
   * Sets the vertex color blend factor (0 = uniform color, 1 = vertex color)
   */
  set vertexColorFactor(value: number) {
    this._vertexColorFactor = Math.max(0, Math.min(1, value));
    this.setUniform('uVertexColorFactor', this._vertexColorFactor);
  }

  /**
   * Parses a color value into [r, g, b, a] format
   * @internal
   */
  private static _parseColor(
    color?: number | [number, number, number, number],
  ): [number, number, number, number] {
    if (color === undefined) {
      return [1.0, 1.0, 1.0, 1.0];
    }

    if (typeof color === 'number') {
      // Parse hex color (e.g., 0xff0000)
      const r = ((color >> 16) & 0xff) / 255;
      const g = ((color >> 8) & 0xff) / 255;
      const b = (color & 0xff) / 255;
      return [r, g, b, 1.0];
    }

    // Already [r, g, b, a] array
    return [
      color[0],
      color[1],
      color[2],
      color[3] ?? 1.0,
    ];
  }

  /**
   * Activates this material for rendering
   *
   * BasicMaterial uses the parent Material.use() implementation which handles:
   * - Program activation
   * - Render state (depth test, depth write, culling, blending)
   * - Uniform uploading (uColor, uVertexColorFactor are already set)
   *
   * @returns this for method chaining
   */
  override use(): this {
    // Parent handles everything - all uniforms are already stored
    return super.use();
  }

  /**
   * Cleans up resources
   *
   * Note: BasicMaterial owns its program, so it disposes it.
   */
  override dispose(): void {
    if (this._disposed) {
      return;
    }
    this._program.dispose();
    super.dispose();
  }
}
