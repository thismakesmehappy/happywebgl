# WebGL Graphics Library - Development Plan & Process

> **For Claude development sessions:** See **CLAUDE.md** for the development workflow, current status, and how to request features with proper review flow.

## Overview

This document outlines the complete plan for building a modular TypeScript WebGL graphics library from scratch. The library will be similar to three.js but built from the ground up, focusing on learning and modularity.

## Project Goals

- Create a TypeScript library for WebGL graphics programming
- Modular architecture allowing selective imports
- Educational focus with extensive documentation
- Progressive development: start small, build incrementally
- Production-ready library usable in other projects

## Course Integration & Learning Outcomes

This library serves dual purposes:

1. **CSI699 (Real-Time WebGL Graphics)** - Interactive 3D rendering, shading, camera systems
2. **CS536 (Computer Graphics Fundamentals)** - Parametric geometry, mathematical foundations
3. **Production Library** - Professional-grade 3D graphics engine for real-world applications

### Learning Path Progression

The 10-phase roadmap aligns with both courses while building toward production-readiness:

- **Phases 1-3:** Core rendering (CSI699 A1-A4, foundations)
- **Phases 4-6:** Advanced rendering & parametric geometry (CSI699 A5-A6, CS536 A1-A6)
- **Phases 7-8:** Advanced techniques (CSI699 A9, CS536 A7 concepts)
- **Phases 9-10:** Production integration and optimization

All features include:
- Educational explanations of underlying graphics concepts
- Multiple usage tiers (beginner API → expert access)
- Direct comparisons to course material and assignments

## Tech Stack

### Build System: **Vite**
**Rationale:**
- Better ecosystem and plugin support than Bun
- Excellent TypeScript integration
- Fast HMR for development
- Industry-standard tooling (more transferable skills)
- Library mode for building distributable packages
- Can use Bun as runtime later if desired

### Core Technologies
- **TypeScript** (strict mode) - Type safety for graphics programming
- **WebGL 2.0** - Primary rendering API (with WebGL 1.0 fallback consideration)
- **ES Modules** - Modern module system for tree-shaking
- **Vitest** - Testing framework (Vite-native)
- **GLSL** - Shader language (embedded as template strings initially)

### Output & Node.js Dependencies (Phase 9+)
- **gl** or **headless-gl** - WebGL context in Node.js
- **node-glfw** or **glfw** - Window management for Node.js
- **sharp** or **canvas** - Image encoding (PNG, JPEG)
- **fluent-ffmpeg** - Video encoding (wrapper around ffmpeg)
- **ffmpeg** - System dependency for video encoding

### Library Name
**Decision:** Library name is **deferred** - we'll use a placeholder in code examples (e.g., `@webgl-lib/core` or `mygfx`) and decide the final name during Phase 8 (Packaging). This allows flexibility and doesn't lock us into a name early. All import examples in documentation use placeholders that can be easily find-replaced when the final name is chosen.

## Architecture & Module Structure

The library is organized into clear, modular packages:

```
src/
├── core/              # Core rendering infrastructure
│   ├── Canvas.ts      # Canvas initialization & WebGL context management
│   ├── GLContext.ts   # WebGL wrapper with error handling
│   ├── WebGLState.ts  # Comprehensive WebGL state management
│   └── Renderer.ts    # Base renderer interface
├── math/              # Mathematical primitives (hierarchical organization)
│   ├── vectors/
│   │   ├── Vector.ts  # Abstract base class
│   │   ├── Vector2.ts # 2D vector
│   │   ├── Vector3.ts # 3D vector
│   │   ├── Vector4.ts # 4D vector
│   │   └── index.ts
│   ├── matrices/
│   │   ├── Matrix.ts      # Abstract base class
│   │   ├── SquareMatrix.ts # Square matrix base
│   │   ├── Matrix2.ts      # 2×2 matrix
│   │   ├── Matrix3.ts      # 3×3 matrix
│   │   ├── Matrix4.ts      # 4×4 matrix (primary for 3D graphics)
│   │   └── index.ts
│   ├── quaternions/
│   │   ├── Quaternion.ts # Rotation representation
│   │   └── index.ts
│   └── index.ts         # Re-exports concrete implementations only
├── resources/         # GPU resource management (hierarchical organization)
│   ├── buffers/
│   │   ├── Buffer.ts              # Abstract base class
│   │   ├── VertexBuffer.ts        # Vertex data storage
│   │   ├── IndexBuffer.ts         # Index/element data
│   │   ├── CopyReadBuffer.ts      # Copy source buffer
│   │   ├── CopyWriteBuffer.ts     # Copy destination buffer
│   │   ├── PixelPackBuffer.ts     # Pixel read operations
│   │   ├── PixelUnpackBuffer.ts   # Pixel write operations
│   │   ├── TransformFeedbackBuffer.ts # Transform feedback data
│   │   ├── UniformBuffer.ts       # Uniform data blocks
│   │   └── index.ts
│   ├── Program.ts      # Shader program compilation & linking
│   ├── Shader.ts       # User-facing shader wrapper
│   ├── Texture.ts      # Texture loading & management
│   ├── VertexArray.ts  # VAO abstraction (WebGL 2)
│   └── index.ts
├── geometry/          # Geometry generation & management (hierarchical organization)
│   ├── Geometry.ts    # Abstract base class
│   ├── BufferGeometry.ts # Concrete: geometry with buffer data
│   ├── spacial/       # Spatial proxies
│   │   ├── BoundingBox.ts
│   │   ├── BoundingSphere.ts
│   │   └── index.ts
│   ├── primitives/    # Primitive shape generators
│   │   ├── Primitive.ts # Abstract base
│   │   ├── Box.ts
│   │   ├── Sphere.ts
│   │   ├── Plane.ts
│   │   ├── Cylinder.ts
│   │   ├── Torus.ts
│   │   └── index.ts
│   ├── curves/        # Curve generation
│   │   ├── Curve.ts   # Abstract base
│   │   ├── BezierCurve.ts
│   │   ├── CatmullRomSpline.ts
│   │   ├── BSpline.ts
│   │   ├── CurveGeometry.ts
│   │   └── index.ts
│   ├── surfaces/      # Surface generation
│   │   ├── Surface.ts # Abstract base
│   │   ├── BezierPatch.ts
│   │   ├── SurfaceOfRevolution.ts
│   │   ├── Superellipsoid.ts
│   │   ├── SurfaceGeometry.ts
│   │   └── index.ts
│   └── index.ts       # Re-exports only concrete implementations
├── scene/             # Scene graph & objects
│   ├── Object3D.ts    # Base class for all scene objects
│   ├── Scene.ts       # Root scene container
│   ├── Group.ts       # Container for grouping objects
│   ├── Mesh.ts        # Renderable mesh object
│   └── index.ts
├── camera/            # Camera implementations (hierarchical organization)
│   ├── Camera.ts      # Abstract base camera class
│   ├── PerspectiveCamera.ts # Perspective projection
│   ├── OrthographicCamera.ts # Orthographic projection
│   ├── OrbitCamera.ts  # Orbital camera control
│   ├── FirstPersonCamera.ts # First-person camera
│   └── index.ts       # Re-exports only concrete implementations
├── lights/            # Lighting system (hierarchical organization)
│   ├── Light.ts       # Abstract base light class
│   ├── AmbientLight.ts # Ambient illumination
│   ├── DirectionalLight.ts # Directional light (sun)
│   ├── PointLight.ts   # Point light with attenuation
│   ├── SpotLight.ts    # Spotlight with falloff
│   ├── LightManager.ts # Multi-light state management
│   └── index.ts       # Re-exports only concrete light types
├── materials/         # Material system (hierarchical organization)
│   ├── Material.ts    # Abstract base material class
│   ├── BasicMaterial.ts # Simple flat color material
│   ├── LambertMaterial.ts # Lambert diffuse shading
│   ├── PhongMaterial.ts # Phong specular shading
│   ├── GouraudMaterial.ts # Per-vertex lighting
│   ├── PBRMaterial.ts  # Physically-based rendering
│   └── index.ts       # Re-exports only concrete material types
├── animation/         # Animation system
│   ├── AnimationMixer.ts # Animation mixer for managing multiple animations
│   ├── AnimationClip.ts  # Keyframe animation clips
│   ├── KeyframeTrack.ts  # Individual property tracks
│   ├── Clock.ts          # Time management for animations
│   └── index.ts
├── renderer/          # Rendering implementations
│   ├── WebGLRenderer.ts # Main WebGL renderer
│   └── index.ts
├── output/            # Output targets and formats
│   ├── OutputTarget.ts      # Abstract base class for output targets
│   ├── CanvasOutput.ts       # Browser canvas output
│   ├── NodeWindowOutput.ts   # Node.js window output
│   ├── ImageOutput.ts        # Image export (PNG, JPEG)
│   ├── VideoOutput.ts        # Video export (MP4, WebM)
│   ├── FrameCapture.ts      # Frame-by-frame capture utilities
│   └── index.ts
├── interactivity/     # Input handling (optional module)
│   ├── InputManager.ts       # Main input manager
│   ├── MouseHandler.ts       # Mouse event handling
│   ├── KeyboardHandler.ts    # Keyboard event handling
│   ├── VideoCaptureHandler.ts # WebRTC video capture
│   ├── EventTypes.ts         # Type definitions for events
│   └── index.ts
├── loaders/           # Asset loading
│   ├── OBJLoader.ts
│   ├── GLTFLoader.ts
│   └── index.ts
├── utils/             # Utilities & helpers
│   ├── Transform.ts   # Transform helpers (translate, rotate, scale, shear)
│   ├── Color.ts
│   ├── MathUtils.ts
│   └── index.ts
└── index.ts           # Main library entry point
```

## Development Roadmap

### Phase 1: Core MVP (Weeks 1-4)
**Goal:** Get basic rendering working with minimal features

**Architecture:** See `ARCHITECTURE.md` for complete design rationale and layer descriptions.

**Layer Structure:**
- **Layer 1:** GLContext, WebGLState, Canvas (low-level APIs)
- **Layer 2:** Program, Buffer, VertexArray, Texture (GPU resources)
- **Layer 2.5:** Shader (user-friendly wrapper, Phase 4+ utilities reserved)
- **Layer 3:** Geometry, Material, BasicMaterial (high-level concepts)
- **Layer 4:** Object3D, Scene, Mesh, WebGLRenderer (scene graph)

**Program vs Shader:**
- **Program** (Layer 2): Direct WebGL program wrapper
  - Compilation and linking of shader source
  - Location caching for uniforms and attributes
  - For advanced users needing direct control
- **Shader** (Layer 2.5): User-friendly wrapper around Program
  - Phase 1: Delegates to Program
  - Phase 4+: Adds utilities (load from file, validate, cache)
  - Material takes Shader (not Program) for future-proof design

**Deliverables:**
- Canvas initialization and WebGL 2 context setup
- `OutputTarget` abstraction for output targets (foundation for multi-platform support)
- Basic math library (Vector3, Matrix4, Quaternion)
- Buffer management (VBO, IBO)
- Shader compilation and program linking
- Simple geometry (triangle, quad)
- Basic material (flat color)
- Simple renderer that can draw a mesh
- Object3D base class with transform (position, rotation, scale)
- Basic image export capability (browser: `toDataURL()`, Node.js: basic)
- Demo: Rotating colored triangle/cube

**API Example:**
```typescript
// Note: Library name is a placeholder - will be finalized in Phase 8
import { Canvas, WebGLRenderer } from '@webgl-lib/renderer';
import { Scene, Mesh } from '@webgl-lib/scene';
import { BoxGeometry } from '@webgl-lib/geometry';
import { BasicMaterial } from '@webgl-lib/materials';

const canvas = new Canvas('#app');
const renderer = new WebGLRenderer(canvas);
const scene = new Scene();
const mesh = new Mesh(new BoxGeometry(), new BasicMaterial({ color: 0xff0000 }));
scene.add(mesh);
renderer.render(scene);
```

### Phase 2: Geometry & Primitives (Weeks 5-8)
**Goal:** Rich geometry generation capabilities for quick visual wins

**Early Phase 2: Error Handling Infrastructure**
Before diving into geometry, centralize error handling across the codebase:
- Create `src/errors/ErrorCodes.ts` with centralized error code enum
- Create `src/errors/AppError.ts` custom error class with error code + context
- Create `src/errors/messages.ts` with i18n-ready error messages (single source of truth)
- Refactor Phase 1 errors (Canvas, GLContext, Buffer, Program) to use centralized system
- Eliminates duplicates (e.g., "Canvas element with ID not found" appears 3x currently)
- Prepares codebase for future i18n support and better error tracking

**Geometry Implementation:**

**Deliverables:**
- Primitive shapes: Box, Sphere, Plane, Cylinder, Torus
- Bezier curves and surfaces
- Catmull-Rom splines
- Superellipsoids
- Rotational solids (lathe)
- Transform helpers: translate, rotate, scale, shear
- Geometry utilities for combining and modifying shapes
- Demo: Procedurally generated shapes gallery

**Learning Focus:**
- Understanding vertex attributes (position, normal, UV)
- Index buffers and triangle winding
- Parametric surface generation
- Curve interpolation algorithms

### Phase 2B: Parametric Curves (Weeks 9-11) - Parallel or Sequential
**Goal:** Foundation for parametric geometry (CS536 A1-A2, CSI699 A7)

**Status:** Can be implemented in parallel with Phase 2 or folded into Phase 3 depending on timeline.

**Deliverables:**
- `Curve.ts` (abstract) - Base class for all curve types
- `BezierCurve.ts` - Arbitrary-degree Bezier curves
  - De Casteljau's algorithm for evaluation
  - Support for arbitrary control point count
  - Configurable segment tessellation
  - Control point visualization
- `CatmullRomSpline.ts` - C1 piecewise splines
  - Hermite curve conversion from interpolation points
  - Kochanek-Bartels tension parameter
  - Smooth interpolation through control points
- `BSpline.ts` - B-spline curves
  - Knot vector management
  - Arbitrary degree support
  - Foundation for NURBS
- `CurveGeometry.ts` - Convert curves to polyline geometry

**Learning Focus (CS536 A1-A2, CSI699 A7):**
- Parametric curve evaluation and approximation
- Control point-based geometry definition
- Continuity concepts (C0, C1, C2)
- Derivative computation for tangent vectors and animation paths
- De Casteljau's algorithm vs. basis function evaluation
- Polyline tessellation and rendering quality
- Tension and parameter control for smooth curves

**Capabilities:**
- Define arbitrary curves from control points
- Interactive control point manipulation
- Animation paths for cameras and objects
- Smooth interpolation with tension control
- Curve simplification and evaluation

**Implementation Pattern:**
De Casteljau's algorithm should be emphasized for educational value—it demonstrates recursive/iterative evaluation clearly. This is foundational understanding for Phase 3 (surfaces).

### Phase 3: Scene Graph, Cameras & Parametric Surfaces (Weeks 12-16)
**Goal:** Hierarchical scene management, camera system, and parametric surface generation

**Deliverables - Scene Graph & Cameras:**
- Complete scene graph with parent/child relationships
- Transform hierarchy (local/world matrices)
- PerspectiveCamera and OrthographicCamera
- Camera controls (basic orbit controls)
- Frustum culling (basic implementation)

**Deliverables - Parametric Surfaces (CS536 A3-A6, CSI699 A7):**
- `Surface.ts` (abstract) - Base surface class
- `BezierPatch.ts` - Bicubic Bezier surfaces
  - Biparametric evaluation (u-v parameterization)
  - Iterative tessellation (not recursive)
  - Exact normal computation via partial derivatives: ∂S/∂u × ∂S/∂v
  - Flat and smooth shading support
  - Control point visualization
- `SurfaceOfRevolution.ts` - Rotate 2D curves around axis
  - Profile-based surface generation from curves
  - Smooth surface capping for closed surfaces
  - u parameter: position along profile curve
  - v parameter: rotation angle around Z-axis (0 to 2π)
- `Superellipsoid.ts` - Generalized ellipsoid surfaces
  - Arbitrary shape parameters (s1, s2)
  - Scale factors (A, B, C) for dimensions
  - Smooth pole handling
  - Parametric evaluation with sign function
- `SurfaceGeometry.ts` - Generate triangle meshes from surfaces

**Learning Focus:**
- **Scene Graph & Cameras:**
  - Scene graph architecture patterns
  - Matrix multiplication order (local vs world space)
  - View and projection matrices
  - Camera transformations and coordinate systems
- **Parametric Surfaces (CS536 A3-A6):**
  - Surface patch evaluation and biparametric tessellation
  - Partial derivatives for exact normal computation
  - Smooth vs. flat shading on complex surfaces
  - Parameter space (u,v) vs. 3D space (x,y,z)
  - Tessellation quality vs. memory trade-offs
  - Iterative evaluation efficiency vs. recursive clarity
  - Normal continuity and smooth shading quality

**Capabilities:**
- Define surfaces from control point grids or parametric equations
- Interactive tessellation level control
- Smooth normal interpolation for realistic lighting
- Memory-efficient mesh generation
- Camera-based scene navigation

**Demo:** Scene with multiple parametric surfaces, interactive camera, tessellation control

**Implementation Note:**
Emphasis on exact normal computation (via partial derivatives) rather than mesh-derived approximations—this is critical for realistic lighting on curved surfaces and directly maps to CS536 requirements.

### Phase 4: Lighting & Materials (Weeks 12-15)
**Goal:** Realistic lighting and material system

**Deliverables:**
- Light types: Ambient, Directional, Point, Spot
- Lambert and Phong shading models
- Material system with uniforms management
- Texture loading and binding
- Basic shadow mapping (optional)
- Demo: Lit scene with multiple lights and materials

**Learning Focus:**
- Lighting models (diffuse, specular, ambient)
- Normal vectors and lighting calculations
- Material properties (albedo, shininess, etc.)
- Texture mapping and UV coordinates

### Phase 5: Animation System (Weeks 16-18)
**Goal:** Time-based and interactive animations

**Deliverables:**
- Clock class for time management
- Keyframe animation system
- Animation clips and tracks
- Animation mixer for managing multiple animations
- Property interpolation (linear, ease-in-out, etc.)
- Interactive animation helpers (start, pause, stop)
- Demo: Animated objects with keyframe animations

**Learning Focus:**
- Interpolation techniques (linear, cubic, etc.)
- Animation timing and easing functions
- Keyframe data structures
- Animation blending concepts

**Note:** Animation helpers belong in the library as they're core to graphics programming. Interactive animations (user-triggered) can be handled by the consuming project, but time-based animations and keyframe systems are fundamental library features.

### Phase 6: Asset Loading (Weeks 19-21)
**Goal:** Load external 3D models

**Deliverables:**
- OBJ loader with material support
- glTF 2.0 loader (basic)
- Texture loading from images
- Resource management and cleanup
- Demo: Load and display external models

### Phase 7: Advanced Effects (Weeks 22-26)
**Goal:** Advanced rendering features

**Deliverables:**
- Mirror/reflective surfaces (environment mapping)
- Render-to-texture
- Post-processing effects (basic)
- Instanced rendering
- Performance optimizations
- Demo: Reflective surfaces, post-processing

### Phase 8: Polish & Packaging (Weeks 27-28)
**Goal:** Production-ready library

**Deliverables:**
- Complete TypeScript definitions
- Documentation (API docs, examples)
- npm package setup
- Tree-shaking support
- Example projects
- Performance benchmarks
- WebGL 1.0 fallback (optional)

### Phase 9: Output Capabilities (Weeks 29-32)
**Goal:** Support multiple output targets and formats

**Deliverables:**
- `OutputTarget` abstract base class (refine from Phase 1)
- `CanvasOutput` (browser) - wraps existing Canvas
- `NodeWindowOutput` (Node.js) - window rendering using gl + node-glfw
- `ImageOutput` - PNG/JPEG export with `sharp` or `canvas`
- `VideoOutput` - MP4/WebM export with two modes:
  - Real-time interactive capture (capture frames during rendering loop)
  - Frame-by-frame from animations (capture each animation frame)
- `FrameCapture` - frame capture utilities
- Integration with renderer (renderer accepts `OutputTarget` instead of `Canvas`)
- Integration with animation system for frame-by-frame capture
- Demo: Export animated scene to video file

**Learning Focus:**
- WebGL context creation in Node.js
- Image encoding formats (PNG, JPEG)
- Video encoding (H.264, VP9)
- Frame buffer reading and conversion
- Async file I/O in Node.js
- Coordinate system transformations (flipping Y-axis for image export)

**Dependencies:**
- `gl` or `headless-gl` for Node.js WebGL
- `node-glfw` or `glfw` for window management
- `sharp` or `canvas` for image encoding
- `fluent-ffmpeg` for video encoding
- `ffmpeg` (system dependency)

**API Example:**
```typescript
// Browser canvas output
import { CanvasOutput, WebGLRenderer } from '@webgl-lib/renderer';
const canvas = new CanvasOutput('#app');
const renderer = new WebGLRenderer(canvas);

// Node.js window output
import { NodeWindowOutput } from '@webgl-lib/output';
const window = new NodeWindowOutput(800, 600);
const renderer = new WebGLRenderer(window);

// Image export
import { ImageOutput } from '@webgl-lib/output';
const imageOutput = new ImageOutput(renderer);
await imageOutput.exportPNG('screenshot.png');

// Video export (real-time capture)
import { VideoOutput } from '@webgl-lib/output';
const videoOutput = new VideoOutput(renderer);
videoOutput.startCapture('output.mp4', 60);
function renderLoop() {
  renderer.render(scene);
  videoOutput.captureFrame();
  requestAnimationFrame(renderLoop);
}
videoOutput.stopCapture();

// Video export (frame-by-frame from animation)
const videoOutput = new VideoOutput(renderer);
videoOutput.startCapture('animation.mp4', 30);
const clock = new Clock();
clock.onFrame(() => {
  animationMixer.update(clock.getDelta());
  renderer.render(scene);
  videoOutput.captureFrame();
});
videoOutput.stopCapture();
```

### Phase 10: Interactivity Module (Weeks 33-34)
**Goal:** Optional input handling for interactive applications

**Deliverables:**
- `InputManager` - unified input management
- `MouseHandler` - mouse events and position tracking
  - Position, delta, buttons, wheel
  - Events: `mousedown`, `mouseup`, `mousemove`, `wheel`
- `KeyboardHandler` - keyboard state and events
  - Key state tracking
  - Events: `keydown`, `keyup`, `keypress`
- `VideoCaptureHandler` - WebRTC video capture
  - `getUserMedia()` integration
  - Stream management
- Event system for input callbacks
- Integration examples
- Demo: Interactive scene with mouse/keyboard controls

**Learning Focus:**
- Event-driven architecture
- Input state management
- WebRTC APIs (`getUserMedia`)
- Coordinate system transformations (screen to world space)
- Event delegation patterns

**Note:** This is an optional module - users import only if needed:
```typescript
import { InputManager, MouseHandler, KeyboardHandler } from '@webgl-lib/interactivity';

const inputManager = new InputManager(canvas);
const mouse = new MouseHandler(inputManager);
const keyboard = new KeyboardHandler(inputManager);

mouse.on('mousemove', (event) => {
  const worldPos = camera.unproject(event.position);
});

keyboard.on('keydown', (event) => {
  if (event.key === 'Space') {
    animationMixer.play();
  }
});
```

## Implementation Strategy

### Development Principles

1. **Modularity First:** Each module should be independently importable
2. **Type Safety:** Leverage TypeScript for compile-time safety
3. **Resource Management:** Proper cleanup of WebGL resources
4. **Performance:** Minimize state changes, batch operations
5. **Extensibility:** Design for future features (WebGPU, etc.)

### Key Design Decisions

- **Object-Oriented:** Use classes for objects, materials, geometries
- **Scene Graph:** Hierarchical structure similar to Three.js
- **Material System:** Shader-based with uniform management
- **Geometry Separation:** Geometry and material are separate (allows reuse)
- **Renderer Abstraction:** Renderer handles all WebGL state management
- **Output Abstraction:** `OutputTarget` interface allows multiple output formats (browser canvas, Node.js window, image, video)
- **Optional Modules:** Interactivity module is separate import - users only include what they need
- **Multi-Platform:** Library works in both browser and Node.js environments

### File Structure

```
webgl/
├── src/              # Source code (as outlined above)
├── examples/         # Example projects
│   ├── basic/
│   ├── lighting/
│   └── advanced/
├── tests/            # Unit tests
├── docs/             # Documentation
│   ├── concepts/     # Educational content on graphics concepts
│   │   ├── webgl-pipeline.md
│   │   ├── coordinate-systems.md
│   │   ├── transforms.md
│   │   ├── lighting.md
│   │   └── glossary.md
│   └── api/          # API documentation
├── dist/             # Build output
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

## Educational Components

### Documentation Strategy

1. **Inline Comments:** Extensive comments explaining graphics concepts, terminology, and "why" not just "what"

2. **Concept Docs:** Create `docs/concepts/` directory with markdown files explaining:
  - WebGL pipeline (vertex shader → fragment shader)
  - Coordinate systems (model, view, world, screen space)
  - Transform matrices and their composition
  - Lighting models and calculations
  - Texture mapping and UV coordinates
  - Scene graph traversal
  - Animation interpolation methods

3. **Glossary:** Maintain a glossary of graphics terminology

4. **Code Examples:** Each module includes example usage with explanations

5. **Visual Learning:** Examples demonstrate concepts visually (e.g., show normals, show coordinate axes)

### Key Terminology to Document

- **Buffers:** VBO (Vertex Buffer Object), IBO (Index Buffer Object), VAO (Vertex Array Object)
- **Shaders:** Vertex shader, fragment shader, uniform, attribute, varying
- **Transforms:** Model matrix, view matrix, projection matrix, MVP (Model-View-Projection)
- **Lighting:** Ambient, diffuse, specular, Phong, Lambert, normal vector
- **Geometry:** Vertex, face, normal, UV coordinates, tangent, bitangent
- **Rendering:** Draw call, render pass, framebuffer, render target
- **Animation:** Keyframe, interpolation, easing, animation clip, track
- **Output:** Output target, frame capture, image export, video encoding
- **Input:** Event handler, input state, coordinate transformation

## Learning Opportunities

### Why Vite
- Understanding modern build tools and bundling
- ES module system and tree-shaking
- TypeScript compilation pipeline
- Development vs production builds
- Plugin ecosystem (useful for shader preprocessing)

### Graphics Programming Learning
- WebGL 2.0 API and best practices
- Graphics programming concepts
- 3D mathematics (matrices, quaternions)
- Scene graph architecture
- Resource management patterns
- Performance optimization techniques

## Success Metrics

- Can render a simple scene with lighting
- Modular imports work correctly
- TypeScript types are complete and helpful
- Library can be used in external projects
- Performance is acceptable (60fps for simple scenes)
- Code is maintainable and well-documented

## Development Process

### Getting Started

1. **Initialize Project**
  - Set up Vite with TypeScript
  - Configure strict TypeScript settings
  - Set up project structure
  - Initialize git repository

2. **Phase 1 Implementation**
  - Start with math library (foundation)
  - Implement WebGL context wrapper
  - Build buffer and shader systems
  - Create first working demo

3. **Iterative Development**
  - Implement features phase by phase
  - Create demos for each phase
  - Document as you go
  - Test thoroughly

### Best Practices

- **Commit Frequently:** Small, focused commits
- **Document Early:** Write comments and docs as you code
- **Test Visually:** Create demos to verify functionality
- **Refactor When Needed:** Don't be afraid to improve architecture
- **Learn Continuously:** Reference graphics programming resources

## Next Steps

1. Set up project structure with Vite + TypeScript
2. Implement Phase 1 core components
3. Create first working demo
4. Iterate based on usage patterns

---

**Last Updated:** [Current Date]
**Status:** Planning Complete - Ready for Implementation

## Output Capabilities & Interactivity

The library supports multiple output targets and formats, enabling use in both browser and Node.js environments. Output capabilities are built on an abstraction layer (`OutputTarget`) that allows the renderer to work with different backends seamlessly.

### Output Targets

- **Browser Canvas** (`CanvasOutput`): Standard HTML5 canvas element
- **Node.js Window** (`NodeWindowOutput`): Native window rendering using glfw
- **Image Export** (`ImageOutput`): Export frames as PNG or JPEG
- **Video Export** (`VideoOutput`): Export animations as MP4 or WebM with two capture modes:
  - Real-time interactive capture (capture during rendering loop)
  - Frame-by-frame from time-based animations

### Interactivity Module

An optional module (`@webgl-lib/interactivity`) provides input handling:
- Mouse events and position tracking
- Keyboard state and events
- WebRTC video capture integration
- Event-driven architecture for input callbacks

See Phase 9 and Phase 10 for detailed implementation plans.

---

## Future Patterns: Opinionated Helpers (Phase 4+ Consideration)

As the library matures and usage patterns emerge, we may add convenience helpers to reduce boilerplate for common scenarios. These are documented here as "future patterns" to defer implementation until we have real-world evidence they're needed.

### Rationale for Deferral

- **Don't know patterns yet** - Core functionality (Phase 1-3) needs to be built first
- **Avoid over-engineering** - Better to implement helpers when 3+ use cases clearly need them
- **Material system first** - Materials (Layer 3) are where abstraction should live initially
- **Can ship MVP without them** - Core library is complete and useful at Phase 3

### Potential Helper Categories (if implemented Phase 4+)

#### 1. Shader Composition / Includes

Reusable GLSL code modules using the Three.js ShaderChunk pattern:

```typescript
// Register reusable chunks
ShaderChunks.register('lighting', `
  vec3 calculateDiffuse(vec3 normal, vec3 lightDir, vec3 lightColor) {
    float diff = max(dot(normal, lightDir), 0.0);
    return diff * lightColor;
  }
  vec3 calculateSpecular(vec3 normal, vec3 lightDir, vec3 viewDir, float shininess) {
    vec3 reflectDir = reflect(-lightDir, normal);
    float spec = pow(max(dot(viewDir, reflectDir), 0.0), shininess);
    return spec * vec3(1.0);
  }
`);

ShaderChunks.register('fog', `
  vec3 applyFog(vec3 color, float distance, vec3 fogColor, float fogDensity) {
    float fogFactor = exp(-fogDensity * distance);
    return mix(fogColor, color, fogFactor);
  }
`);

// Use in shaders with #include directive
const fragmentSource = `#version 300 es
  precision highp float;
  #include <lighting>
  #include <fog>

  void main() {
    vec3 lit = calculateDiffuse(vNormal, uLightDir, uLightColor);
    fragColor = vec4(applyFog(lit, vDistance, uFogColor, uFogDensity), 1.0);
  }
`;

// Resolve includes before compilation
const resolved = ShaderChunks.resolve(fragmentSource);
const shader = new FragmentShader(resolved);
```

**Common chunks to implement:**
- `lighting` - diffuse, specular, Phong/Blinn-Phong calculations
- `fog` - linear, exponential, exponential squared
- `normals` - normal mapping, TBN matrix construction
- `skinning` - bone transforms for skeletal animation
- `shadows` - shadow mapping, PCF filtering

**Implementation:** `src/resources/shaders/ShaderChunks.ts`

**Reference:** Three.js ShaderChunk pattern

#### 2. GLContext State Presets

Common rendering scenarios that bundle state configurations:

```typescript
// Transparency/blending scenario
const ctx = GLContext.forTransparency(canvas);
// Enables: blending with SRC_ALPHA/ONE_MINUS_SRC_ALPHA
// Disables: depth write (keeps depth test for ordering)

// Post-processing scenario
const ctx = GLContext.forPostProcessing(canvas);
// Disables: depth test, depth write (full-screen effects)

// Particle effects scenario
const ctx = GLContext.forParticles(canvas);
// Enables: additive blending, disables depth test
// Appropriate for many particles overlapping

// Alternative: Preset enum
const ctx = new GLContext(canvas, GLContext.Preset.TRANSPARENCY);
```

#### 2. Material Recipe Builders

Pre-configured material classes for common use cases:

```typescript
// Instead of manually setting up shader + uniforms
const material = TransparencyMaterial.create(ctx, {
  color: [1, 0, 0, 0.5],
  refraction: 1.33
});

const material = ParticleMaterial.create(ctx, {
  emission: [1, 1, 0],
  fadeWithAge: true
});

const material = SkybxMaterial.create(ctx, {
  cubeTexture: skyboxTexture
});
```

#### 3. Program Factories

Specialized programs for common rendering tasks:

```typescript
// Full-screen blit (copying texture to screen)
const blitProgram = Program.createBlit(ctx);

// Point sprite rendering (particles, stars)
const pointProgram = Program.createPointSprite(ctx);

// Skybox rendering (special depth handling)
const skyboxProgram = Program.createSkybox(ctx);

// Screen-space effects
const bloomProgram = Program.createBloom(ctx);
```

#### 4. Context + Canvas + Program Bundles

Pre-configured "recipe" combinations for specific effects:

```typescript
// Bundle for transparent objects
class TransparencyContext {
  canvas: Canvas;
  glContext: GLContext;
  material: Material;
  // Pre-configured for rendering transparent geometry
}

// Bundle for particle simulation
class ParticleContext {
  canvas: Canvas;
  glContext: GLContext;
  program: Program;
  positionBuffer: Buffer;
  velocityBuffer: Buffer;
  // Pre-configured for particle rendering
}
```

### Implementation Decision Criteria

Add helpers when ALL of these are true:

1. **Pattern Maturity** - Same configuration appears in 3+ complete examples/projects
2. **Boilerplate Cost** - Requires 5+ lines of setup code to use correctly
3. **Benefit Clear** - Significant reduction in user code complexity
4. **No Duplication** - Pattern not already covered by Material classes
5. **Stable API** - Underlying APIs have proven stable over time

### Timeline

- **Phase 1-3:** Build core materials and basic examples
- **Phase 4:** Review usage patterns, decide if helpers needed
- **Phase 5+:** Implement helpers as needed based on evidence

### Philosophy

**Ship the MVP without helpers.** The core library (Phases 1-3) provides:
- Clear abstractions (Material, Shader, Program)
- Composable components (Buffer, VertexArray, Texture)
- Escape hatches (direct GLContext access)

Users can compose these to create any effect. If patterns emerge that repeatedly require the same combinations, helpers can be added without changing the core API.
