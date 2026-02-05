# WebGL Graphics Library - Cumulative TODO

**Last Updated:** February 4, 2026
**Status:** Phase 1 Implementation - 50% Complete

> **Note:** This is a cumulative TODO list tracking all phases. It evolves as we progress through development, allowing retroactive updates as learning occurs. See `ARCHITECTURE.md` for design rationale and `PLAN.md` for complete roadmap.

---

## Phase 1: Core MVP [ACTIVE]

### Layer 1: Low-Level APIs ✅ (95% Complete)

- [x] `src/core/GLContext.ts` - WebGL 2.0 wrapper with error handling (98.19% coverage)
- [x] `src/core/WebGLState.ts` - Comprehensive state management (100% coverage)
- [x] `src/core/Canvas.ts` - Canvas initialization & context management (100% coverage)
- [x] `src/core/Renderer.ts` - Abstract base renderer interface (100% coverage)

**Status:** Production-quality foundation ready for Layer 2 resources

### Layer 2: GPU Resources 🚧 (50% Complete)

- [x] `src/resources/Buffer.ts` - Vertex/Index buffer abstraction (98.38% coverage)
- [x] `src/resources/Program.ts` - Shader compilation and linking (100% coverage) ✅
- [ ] `src/resources/VertexArray.ts` - VAO abstraction (WebGL 2) [NEXT]
- [ ] `src/resources/Texture.ts` - Texture resource wrapper

**Status:** Buffer and Program complete. VertexArray is next, then Texture.

### Layer 2.5: Shader Wrapper ⏳ (0% Complete)

- [ ] `src/resources/Shader.ts` - User-facing wrapper around Program [BLOCKED: waiting for Program approval]
  - Phase 1: Thin wrapper delegating to Program
  - Phase 4+: Reserves space for utilities (load, validate, cache)

**Status:** Specification complete, blocked until Program and VertexArray ready

### Layer 3: High-Level Concepts ⏳ (0% Complete)

- [ ] `src/geometry/Geometry.ts` - Base geometry class [BLOCKED: needs VertexArray + Shader]
- [ ] `src/materials/Material.ts` - Material system using Design A [BLOCKED: needs Shader]
  - Material = Shader + Uniforms (each material has own shader)
  - Use Design A as documented in ARCHITECTURE.md
- [ ] `src/materials/BasicMaterial.ts` - Default material with flat color [BLOCKED: needs Material]

**Status:** Design finalized (Design A), specification complete, blocked on Layer 2.5

### Layer 4: Scene Graph ⏳ (0% Complete)

- [ ] `src/scene/Object3D.ts` - Base transform hierarchy [BLOCKED: needs Material]
- [ ] `src/scene/Scene.ts` - Object container [BLOCKED: needs Material]
- [ ] `src/scene/Mesh.ts` - Geometry + Material combination [BLOCKED: needs Material]
- [ ] `src/renderer/WebGLRenderer.ts` - Main WebGL rendering orchestration [BLOCKED: needs Mesh]

**Status:** Architecture designed, blocked on Layer 3

### Output & Export

- [ ] `src/output/OutputTarget.ts` - Output abstraction interface [PHASE 1: Light abstraction]
- [ ] `src/output/CanvasOutput.ts` - Canvas implementation of OutputTarget [Phase 1 initial]
- [ ] Browser image export - `canvas.toDataURL()` wrapper [Phase 1]

**Status:** Specification ready, can be added with OutputTarget abstraction

### Demo

- [ ] Phase 1 Demo - Rotating colored cube with camera [BLOCKED: needs WebGLRenderer]

**Status:** Specification ready, depends on complete rendering pipeline

---

## Phase 2: Geometry & Primitives [NOT STARTED]

**Prerequisites:** Complete Phase 1 rendering pipeline

### Infrastructure & Error Handling

- [ ] `src/errors/ErrorCodes.ts` - Centralized error code enum
  - Canvas errors (CANVAS_001, CANVAS_002, CANVAS_003)
  - GLContext errors (GLCTX_001, GLCTX_002, GLCTX_003)
  - Resource errors (RES_001, RES_002)
  - Geometry errors (GEO_001+)
  - Material errors (MAT_001+)

- [ ] `src/errors/AppError.ts` - Custom error class with code + context
  - Extends Error with code: ErrorCode
  - Supports optional context dict for debugging
  - Message format: `[CODE] message`

- [ ] `src/errors/messages.ts` - i18n-ready error messages
  - Single source of truth for all error messages
  - Template strings for dynamic content ({id}, {selector}, etc.)
  - Ready for translation systems (Phase 7+)

- [ ] Refactor Phase 1 errors to use centralized system
  - Canvas.ts, GLContext.ts, Buffer.ts, Program.ts, etc.
  - Eliminates duplicates (e.g., "Canvas element not found" x3)
  - Improves consistency across codebase

**Rationale:** With 30+ unique error messages and duplicates already appearing, centralizing error handling prevents inconsistency, enables better error tracking/logging, and prepares for future i18n support.

**Status:** Infrastructure task, unblocked after Phase 1 complete

### Primitive Shapes
- [ ] `src/geometry/primitives/Box.ts`
- [ ] `src/geometry/primitives/Sphere.ts`
- [ ] `src/geometry/primitives/Plane.ts`
- [ ] `src/geometry/primitives/Cylinder.ts`
- [ ] `src/geometry/primitives/Torus.ts`

### Advanced Geometry
- [ ] `src/geometry/curves/BezierCurve.ts`
- [ ] `src/geometry/curves/CatmullRomCurve.ts`
- [ ] `src/geometry/surfaces/Superellipsoid.ts`
- [ ] `src/geometry/surfaces/RotationalSolid.ts`

### Transform Utilities
- [ ] `src/utils/Transform.ts` - Transform helpers (translate, rotate, scale, shear)

**Status:** Unblocked after Phase 1 complete

---

## Phase 3: Scene Graph & Cameras [NOT STARTED]

**Prerequisites:** Complete Phase 1 rendering pipeline

### Camera System
- [ ] `src/camera/Camera.ts` - Base camera class
- [ ] `src/camera/PerspectiveCamera.ts` - Perspective camera implementation
- [ ] `src/camera/OrthographicCamera.ts` - Orthographic camera implementation
- [ ] Camera controls - Basic orbit controls
- [ ] Frustum culling - Basic implementation

**Status:** Architecture designed, unblocked after Phase 1 complete

---

## Phase 4: Lighting & Materials [NOT STARTED]

**Prerequisites:** Phase 1 complete + Phase 3 cameras

### Light System
- [ ] `src/lights/Light.ts` - Base light class
- [ ] `src/lights/AmbientLight.ts` - Ambient lighting
- [ ] `src/lights/DirectionalLight.ts` - Directional lighting
- [ ] `src/lights/PointLight.ts` - Point light source
- [ ] `src/lights/SpotLight.ts` - Spot light source

### Material Variants
- [ ] `src/materials/LambertMaterial.ts` - Lambert (diffuse) shading
- [ ] `src/materials/PhongMaterial.ts` - Phong (specular) shading
- [ ] `src/materials/MirrorMaterial.ts` - Reflective material
- [ ] Basic shadow mapping (optional)

### Shader Utilities (Phase 4+ Enhancement)
- [ ] `Shader.load(ctx, url)` - Load shaders from files
- [ ] `Shader.write(shader, path)` - Export shader source
- [ ] `Shader.validate()` - Compile-time validation
- [ ] `Shader.cache` - Caching layer for loaded shaders

**Note:** These enhancements added to Shader (Layer 2.5) without requiring Material refactoring

**Status:** Architecture designed, decision on lighting uniforms deferred to Phase 3 planning

---

## Phase 5: Animation System [NOT STARTED]

**Prerequisites:** Phase 1 complete + Phase 2 geometry

### Animation Infrastructure
- [ ] `src/animation/Clock.ts` - Time management and delta tracking
- [ ] `src/animation/KeyframeTrack.ts` - Individual property animation tracks
- [ ] `src/animation/AnimationClip.ts` - Named animation clip container
- [ ] `src/animation/AnimationMixer.ts` - Animation mixer for managing multiple clips

### Animation Features
- [ ] Property interpolation (linear, ease-in-out, etc.)
- [ ] Animation playback control (play, pause, stop, restart)
- [ ] Multi-animation blending
- [ ] Animation events

**Status:** Architecture designed, unblocked after Phase 1 complete

---

## Phase 6: Asset Loading [NOT STARTED]

**Prerequisites:** Phase 1-2 complete

### File Format Loaders
- [ ] `src/loaders/OBJLoader.ts` - OBJ format loader with material support
- [ ] `src/loaders/GLTFLoader.ts` - glTF 2.0 loader (basic implementation)
- [ ] Texture loading from image files
- [ ] Resource management and cleanup for loaded assets

**Status:** Unblocked after Phase 2 complete

---

## Phase 7: Advanced Effects [NOT STARTED]

**Prerequisites:** Phase 1-4 complete

### Rendering Techniques
- [ ] Mirror/reflective surfaces (environment mapping)
- [ ] Render-to-texture framebuffer operations
- [ ] Post-processing effects (basic filters, bloom, etc.)
- [ ] Instanced rendering (optimization)
- [ ] Performance optimizations and profiling

**Status:** Unblocked after Phase 4 complete

---

## Phase 8: Polish & Packaging [NOT STARTED]

**Prerequisites:** Phase 1-7 complete

### Library Finalization
- [ ] Complete TypeScript type definitions
- [ ] API documentation generation (JSDoc + tools)
- [ ] Example projects and tutorials
- [ ] npm package setup and configuration
- [ ] Tree-shaking support verification
- [ ] Performance benchmarks
- [ ] WebGL 1.0 fallback support (optional)
- [ ] Library name finalization and branding

**Status:** Planning phase, unblocked after Phase 7 complete

---

## Phase 9: Output Capabilities [NOT STARTED]

**Prerequisites:** Phase 1 foundation + OutputTarget abstraction

### Output Target System
- [ ] `src/output/OutputTarget.ts` - Abstract output interface
- [ ] `src/output/CanvasOutput.ts` - Browser canvas output
- [ ] `src/output/NodeWindowOutput.ts` - Node.js window rendering
- [ ] `src/output/ImageOutput.ts` - PNG/JPEG image export
- [ ] `src/output/VideoOutput.ts` - MP4/WebM video export (real-time + frame-by-frame)
- [ ] `src/output/FrameCapture.ts` - Frame capture utilities

### Integration
- [ ] WebGLRenderer accepts OutputTarget instead of Canvas
- [ ] Animation system integration for frame-by-frame capture
- [ ] Node.js dependencies (`gl`, `node-glfw`, `sharp`, `fluent-ffmpeg`)

**Status:** Architecture designed, light OutputTarget abstraction added to Phase 1. Full multi-platform output deferred to Phase 9.

---

## Phase 10: Interactivity Module [NOT STARTED]

**Prerequisites:** Phase 1 complete, optional for other phases

### Input System
- [ ] `src/interactivity/InputManager.ts` - Unified input management
- [ ] `src/interactivity/MouseHandler.ts` - Mouse events and tracking
- [ ] `src/interactivity/KeyboardHandler.ts` - Keyboard state and events
- [ ] `src/interactivity/VideoCaptureHandler.ts` - WebRTC video capture
- [ ] `src/interactivity/EventTypes.ts` - Event type definitions

### Features
- [ ] Mouse position, delta, buttons, wheel tracking
- [ ] Keyboard key state tracking and event system
- [ ] Event delegation patterns
- [ ] Coordinate system transformations (screen to world space)

**Status:** Optional module, unblocked after Phase 1 complete

---

## Utilities & Helpers

### Color & Math Utils
- [ ] `src/utils/Color.ts` - Color utilities and conversions
- [ ] `src/utils/MathUtils.ts` - Scalar math functions (clamp, lerp, smoothstep, etc.)

**Status:** Phase 1, unblocked

---

## Testing & Quality

### Test Coverage
- [x] Phase 0: Math library - 99.11% lines / 94.78% branch coverage ✅
- [x] Phase 1: Layer 1 (GLContext, WebGLState, Canvas) - 99.05% coverage ✅
- [x] Phase 1: Layer 2 (Buffer, Program) - 100% coverage ✅
- [ ] Phase 1: Layer 2 (VertexArray, Texture) - Not yet implemented
- [ ] Phase 1-10: Add integration tests for rendering pipeline
- [ ] Performance benchmarks for rendering operations

**Target:** Maintain 95%+ line coverage / 90%+ branch coverage across all phases

---

## Documentation

### Code Documentation
- [x] JSDoc comments for all math classes ✅
- [x] JSDoc comments for GLContext, WebGLState, Canvas, Renderer ✅
- [ ] JSDoc comments for all GPU resource classes (Program, VertexArray, Texture, Shader)
- [ ] JSDoc comments for geometry, material, and scene classes
- [ ] Example blocks for complex methods

### Project Documentation
- [x] README.md - Project overview ✅
- [x] PLAN.md - Complete 10-phase roadmap ✅
- [x] ARCHITECTURE.md - Design rationale and layer structure ✅
- [x] CLAUDE.md - Development workflow ✅
- [ ] `docs/_SUPPORTING/` - Detailed reference materials
- [ ] `docs/_ARCHIVE/` - Completed/obsolete documentation
- [ ] `docs/_LOGS/` - Decision records and maintenance logs

### Learning Materials
- [ ] Concept guides (`docs/concepts/webgl-pipeline.md`, coordinate-systems, transforms, lighting, etc.)
- [ ] Glossary of graphics terminology
- [ ] Tutorial guides for key features
- [ ] Visual learning examples (show normals, coordinate axes, etc.)

---

## Critical Path to Phase 1 Completion

**Current Status:** Layer 1 complete (95%), Layer 2 partially complete (50%)

**Blocking Items:**
1. VertexArray.ts - Ready to implement [NEXT]
2. Texture.ts - Ready to implement
3. Shader.ts - Blocked until VertexArray ready
4. Geometry.ts - Blocked until VertexArray + Shader ready
5. Material.ts - Blocked until Shader ready
6. Scene Graph - Blocked until Material ready
7. WebGLRenderer - Blocked until Scene Graph ready

**Next Steps (in order):**
1. Implement VertexArray.ts
2. Implement Texture.ts
3. Implement Shader.ts
4. Implement Geometry.ts
5. Implement Material.ts
6. Implement BasicMaterial.ts
7. Implement Object3D, Scene, Mesh
8. Implement WebGLRenderer
9. Create Phase 1 demo

**Estimated Total Phase 1 Remaining:** ~1800 lines of code

---

## Notes

- **Design Decisions Approved:**
  - Material = Shader + Uniforms (Design A) for clarity and flexibility
  - Simple state management (Phase 1) with future enhancement capability
  - OutputTarget abstraction included in Phase 1 (not deferred to Phase 9)
  - Program wraps shader source strings (not Shader objects)

- **Phase 1 50% Complete:**
  - Layer 1: 95% done (4/4 components)
  - Layer 2: 50% done (2/4 components - Buffer ✅, Program ✅)
  - Layer 2.5-4: Not yet started (blocked on Layer 2)

- **For detailed architecture rationale:** See `ARCHITECTURE.md`
- **For complete development plan:** See `PLAN.md`
- **For development workflow:** See `CLAUDE.md`
