/**
 * Material system
 *
 * This module provides material classes for shading and rendering.
 *
 * **Materials combine:**
 * - A compiled Program (vertex + fragment shaders)
 * - Uniform values (colors, matrices, textures)
 * - Render state (depth testing, culling, blending)
 *
 * **Usage:**
 * ```typescript
 * // Create a simple flat-color material
 * const material = new BasicMaterial(ctx, { color: 0xff0000 });
 *
 * // During rendering
 * material.use();
 * geometry.bind(material.program);
 * ctx.gl.drawArrays(...)
 * ```
 */

export * from './Material.js';
export * from './BasicMaterial.js';

// Future materials (not yet implemented):
// export * from './LambertMaterial.js';
// export * from './PhongMaterial.js';
// export * from './MirrorMaterial.js';
