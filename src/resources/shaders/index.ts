/**
 * Shader Definitions Module
 *
 * This module provides shader definition classes that represent GLSL source
 * code and metadata. Shaders are separate from compiled Programs - they
 * describe *what* the GPU code does and *what it expects*.
 *
 * **Architecture:**
 * ```
 * VertexShader + FragmentShader → Program (compiled) → Material (+ values)
 * ```
 *
 * **Key Classes:**
 * - `VertexShader`: Vertex shader definition with attributes
 * - `FragmentShader`: Fragment shader definition with outputs
 * - `Shader`: Abstract base with uniforms and varyings
 * - `GLSLType`: Enum of all GLSL data types
 *
 * **Usage:**
 * ```typescript
 * import {
 *   VertexShader,
 *   FragmentShader,
 *   GLSLType
 * } from './resources/shaders';
 *
 * const vertexShader = new VertexShader(vertexSource)
 *   .declareAttribute('aPosition', GLSLType.Vec3)
 *   .declareUniform('uMVP', GLSLType.Mat4);
 *
 * const fragmentShader = new FragmentShader(fragmentSource)
 *   .declareUniform('uColor', GLSLType.Vec4)
 *   .declareOutput('fragColor', GLSLType.Vec4);
 *
 * const program = new Program(ctx, vertexShader, fragmentShader);
 * ```
 *
 * @see Program for the compiled GPU resource
 * @see Material for combining a program with uniform values
 */

// Types and utilities
export * from './GLSLType.js';

// Base class (exported for advanced use cases)
export * from './Shader.js';

// Concrete shader classes
export * from './VertexShader.js';
export * from './FragmentShader.js';