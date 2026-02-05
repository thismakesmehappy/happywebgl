/**
 * GPU resource management
 *
 * This module handles WebGL buffers, shaders, textures, and vertex arrays.
 */

// Buffers
export * from './buffers/Buffer.js';
export * from './buffers/VertexBuffer.js';
export * from './buffers/IndexBuffer.js';
export * from './buffers/CopyReadBuffer.js';
export * from './buffers/CopyWriteBuffer.js';
export * from './buffers/PixelPackBuffer.js';
export * from './buffers/PixelUnpackBuffer.js';
export * from './buffers/TransformFeedbackBuffer.js';
export * from './buffers/UniformBuffer.js';

// Placeholder - will be implemented in Phase 1
// export * from './shaders/Shader.js';
// export * from './textures/Texture.js';
export * from './VertexArray.js';
