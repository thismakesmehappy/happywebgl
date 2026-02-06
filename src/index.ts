/**
 * WebGL Graphics Library
 * 
 * Main entry point for the library.
 * This file will export all public APIs once modules are implemented.
 * 
 * Currently, all modules are placeholders and will be implemented in phases.
 */

// Core modules - Phase 1
export * from './core/index.js';
export * from './math/index.js';  // Vector3 implemented
export * from './resources/index.js';

// Scene and rendering - Phase 1 & 3
// export * from './scene/index.js';
// export * from './renderer/index.js';
// export * from './camera/index.js';

// Geometry and materials - Phase 1, 2, 4
// export * from './geometry/index.js';
// export * from './materials/index.js';

// Lighting and animation - Phase 4 & 5
// export * from './lights/index.js';
// export * from './animation/index.js';

// Utilities and loaders - Phase 2 & 6
// export * from './utils/index.js';
// export * from './loaders/index.js';

// Temporary export to make this a valid module
export const VERSION = '0.1.0';
