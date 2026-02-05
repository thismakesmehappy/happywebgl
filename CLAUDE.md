# Claude Development Session Guide

**Project:** WebGL Graphics Library - Educational 3D Rendering Framework
**Last Updated:** February 2, 2026
**Current Phase:** Phase 1 - Core MVP Implementation
**Next Infrastructure Improvement:** Phase 2 - Centralized Error Handling System

---

## Quick Navigation

For different information, see:
- **ARCHITECTURE.md** → Architecture decisions, layer structure, and design principles
- **TODO.md** → Current tasks & cumulative status across all phases
- **PLAN.md** → Complete 10-phase roadmap with rationale and learning focus
- **HANDOFF.md** → Complete project context, patterns, and historical decisions
- **SETUP.md** → Development environment setup (development-only documentation)
- **docs/_SUPPORTING/** → Detailed architecture reference and research materials

### About This File
This file is your **development workflow guide** covering:
- Current implementation status and what's pending
- How to request features and approve/reject changes
- Code quality standards and testing strategy
- Common patterns and best practices
- Feature implementation checklist

---

## Current Implementation Status

### ✅ Phase 0 - Math Foundation (Complete)

**Module Organization:** Hierarchical structure with subdirectories (vectors/, matrices/, quaternions/)

| Feature | File | Coverage | Tests | Status |
| --- | --- | --- | --- | --- |
| Vector (base) | `src/math/vectors/Vector.ts` | 99.05% lines / 96.66% branch | 72 | ✅ Complete |
| Vector2 | `src/math/vectors/Vector2.ts` | 100% lines / 100% branch | 32 | ✅ Complete |
| Vector3 | `src/math/vectors/Vector3.ts` | 100% lines / 100% branch | 34 | ✅ Complete |
| Vector4 | `src/math/vectors/Vector4.ts` | 100% lines / 100% branch | 30 | ✅ Complete |
| Matrix (base) | `src/math/matrices/Matrix.ts` | 97.31% lines / 91.42% branch | 116 | ✅ Complete |
| SquareMatrix | `src/math/matrices/SquareMatrix.ts` | 100% lines / 100% branch | 46 | ✅ Complete |
| Matrix2 | `src/math/matrices/Matrix2.ts` | 97.29% lines / 88.88% branch | 69 | ✅ Complete |
| Matrix3 | `src/math/matrices/Matrix3.ts` | 99.21% lines / 94.44% branch | 88 | ✅ Complete |
| Matrix4 | `src/math/matrices/Matrix4.ts` | 99.45% lines / 94.44% branch | 99 | ✅ Complete |
| Quaternion | `src/math/quaternions/Quaternion.ts` | 100% lines / 96.51% branch | 232 | ✅ Complete |

### 🚧 Phase 1 - Core Rendering (In Progress - Awaiting Review)

**Module Organization:** Hierarchical structure with buffers/ subdirectory for 9 buffer types

| Feature | File | Coverage | Tests | Status |
| --- | --- | --- | --- | --- |
| WebGLState | `src/core/WebGLState.ts` | 100% lines / 100% branch | 95 | 🔍 Implemented, Pending Approval |
| WebGLState Constants | `src/core/WebGLState.constants.ts` | 100% lines / 100% branch | 49 | 🔍 Implemented, Pending Approval |
| GLContext | `src/core/GLContext.ts` | 94.16% lines / 94.44% branch | 150 | 🔍 Implemented, Pending Approval |
| Canvas | `src/core/Canvas.ts` | 98.92% lines / 95.91% branch | 86 | 🔍 Complete, Pending Approval |
| Renderer | `src/core/Renderer.ts` | 100% lines / 100% branch | 30 | 🔍 Implemented, Pending Approval |
| **Buffer System** | `src/resources/buffers/` | — | — | ✅ Specialized |
| Buffer (Abstract) | `src/resources/buffers/Buffer.ts` | 89.61% lines / 85.5% branch | — | ✅ Complete |
| VertexBuffer | `src/resources/buffers/VertexBuffer.ts` | 100% lines / 100% branch | 30 | ✅ Complete |
| IndexBuffer | `src/resources/buffers/IndexBuffer.ts` | 100% lines / 100% branch | 16 | ✅ Complete |
| CopyReadBuffer | `src/resources/buffers/CopyReadBuffer.ts` | 0% lines / 0% branch | — | 🚧 Stub |
| CopyWriteBuffer | `src/resources/buffers/CopyWriteBuffer.ts` | 0% lines / 0% branch | — | 🚧 Stub |
| PixelPackBuffer | `src/resources/buffers/PixelPackBuffer.ts` | 0% lines / 0% branch | — | 🚧 Stub |
| PixelUnpackBuffer | `src/resources/buffers/PixelUnpackBuffer.ts` | 0% lines / 0% branch | — | 🚧 Stub |
| TransformFeedbackBuffer | `src/resources/buffers/TransformFeedbackBuffer.ts` | 0% lines / 0% branch | — | 🚧 Stub |
| UniformBuffer | `src/resources/buffers/UniformBuffer.ts` | 0% lines / 0% branch | — | 🚧 Stub |

**Overall Project:**
- Total Tests: 1,343 passing (18 test files)
- Project Coverage: 97.22% lines / 93.08% branch
- Target Coverage: 95%+ lines / 90%+ branch ✓ **Exceeded**

> **✅ Module Reorganization Complete:** Math module now organized with vectors/, matrices/, quaternions/ subdirectories. Resources module organized with buffers/ subdirectory for 8 buffer specializations. All 1,343 tests passing. Cross-directory imports updated. User-facing API unchanged—imports still work as `import { Vector3, Matrix4, VertexBuffer } from '@webgl/...'`

### 🚧 Next Up (Phase 1 Remaining - APPROVED)

> **✅ Architecture Approved:** Program (Layer 2) + Shader (Layer 2.5) + Reserved Utilities. See `.claude/PHASE1_RESOURCE_ARCHITECTURE_DECISIONS.md` for detailed analysis.

**Phase 1 Remaining Implementation (in order):**

**Layer 2: GPU Resources**
1. **Program.ts** - Wraps WebGLProgram compilation, manages locations, static binding tracking
2. **VertexArray.ts** - Wraps VAO, manages attribute layout, static binding tracking
3. **Texture.ts** - Wraps WebGLTexture, manages image data, static binding tracking

**Layer 2.5: Shader Wrapper (Reserved for Phase 4+ Utilities)**
4. **Shader.ts** - Wraps Program, provides user-facing API, reserves space for: load(), write(), validate(), cache

**Layer 3: High-Level Concepts**
5. **Geometry.ts** - Creates Buffer + VertexArray internally, configures vertex layout
6. **Material.ts** - Uses Shader, manages uniforms, orchestrates render state
7. **BasicMaterial.ts** - Extends Material, creates Shader internally, provides color management

**Layer 4: Scene Graph & Rendering**
8. **Object3D.ts** - Transform management, hierarchy support (position, rotation, scale)
9. **Scene.ts** - Container for objects, simple tree structure
10. **Mesh.ts** - Object3D + Geometry + Material, orchestrates rendering
11. **WebGLRenderer.ts** - Renders Scene, iterates objects, handles viewport

**Finalization**
12. Image export & demo

---

## Architecture Pre-Planning

The following components have their architecture designed before implementation phase:

- **Framebuffer (Phase 7+)** - Render-to-texture, shadow mapping, frame capture, picking
  - Layer 2 GPU resource (alongside Buffer, Texture, Program, VertexArray)
  - Designed to eliminate multi-context workarounds for picking/reflections
  - Use cases across 4 phases: Shadow mapping (4), Render-to-texture (7), Frame capture (9), Picking (10)
  - See `docs/_SUPPORTING/ARCHITECTURE_RESOURCE_LAYER_DESIGN.md` section "Framebuffer (Phase 7+)"

**Benefit:** When Phase 7 implementation begins, architecture is clear and we can focus on code quality, not design decisions.

---

## Development Workflow

### ⚠️ Important Principles

**One Feature At A Time**
- I will only work on ONE feature between approval cycles
- Each feature gets its own branch: `feature/[feature-name]`
- I will NOT move to the next feature until you approve the current one
- This ensures clear communication and easy review/rollback if needed

**Branch Strategy**
- All work happens on feature branches (never directly on `main`)
- Branch naming: `feature/[feature-name]` (e.g., `feature/shader-ts`)
- Only merge to `main` after your approval
- Each feature is one focused commit or logically grouped commits

**Testing Before Approval**
- ALL tests must pass locally before requesting review
- Coverage targets (95%+ lines, 90%+ branches) must be met
- No incomplete or "work in progress" code sent for review

**⚠️ Column-Major Matrix Storage**
- **ALL matrices use COLUMN-MAJOR order (WebGL/GLSL convention)**
- This is NOT the intuitive row-major order - it's critical for GPU compatibility
- Data layout: `[col0_row0, col0_row1, col0_row2, col0_row3, col1_row0, ...]`
- Reference existing Matrix4.ts implementation for the pattern
- ALL new matrix-related code must follow this convention

### Status Legend

- ✅ **Complete** - Implemented, reviewed, approved, and committed to `main`
- 🔍 **Pending Approval** - Implemented on feature branch with tests, awaiting your review
- 🚧 **In Progress** - Currently being implemented on feature branch
- ⏭️ **Not Started** - Scheduled for implementation

### Feature Development Workflow

**Your Feature Request:**
```
Let's implement [FEATURE_NAME].
Requirements: [list key requirements]
Approach: [brief approach if specific]
```

**My Response:** Clarify approach → get your approval ("proceed") → implement

**Implementation:** I code + test (95%+ line/90%+ branch coverage) → verify all tests pass → report results

**My Completion Report:**
```
[FEATURE_NAME] Complete ✅

Implementation: [key classes/methods, design decisions, coverage]
Tests: X tests, Y% line / Z% branch coverage
Project: N total tests passing, X% lines / Y% branch overall

Ready for your review.
```

**Your Review Options:**
- ✅ **Approve:** "Looks good" → you commit to main + update status
- 💬 **Request changes:** "Modify X because Y" → I revise on same branch
- 🚫 **Reject:** "Redo because X" → I start fresh after discussion
- ❓ **Ask questions:** I explain implementation details

---

## Code Quality Standards

### Coverage Requirements
- **Line Coverage:** 95%+ (target) - Currently 99.11%
- **Branch Coverage:** 90%+ (target) - Currently 94.78%
- **Function Coverage:** 100% (target) - Currently 100%

### Code Patterns to Follow

**Method Chaining (all methods return `this` unless returning data)**
- **Mutation methods:** Modify state, return `this` for chaining
  - Example: `vector.normalize().add(other)` or `matrix.makeTranslation(1,2,3).multiply(other)`
- **Query methods:** Return values (not `this`, breaks chain)
  - Example: `vector.magnitude` returns number, `matrix.determinant` returns number
- **Static methods:** Create new instances (don't mutate inputs)
  - Example: `Vector3.add(v1, v2)` returns new Vector3, `Matrix4.multiply(m1, m2)` returns new Matrix4

**Constructors & Factories (both chainable)**
- **Direct constructor:** `new GLContext(canvas).setSize(800, 600).setClearColor(...)`
- **Factory method:** `GLContext.fromElementId('id').setSize(800, 600).setClearColor(...)`
- Both paths create identical instances, fully chainable

**Reference Implementation:** Matrix4.ts:265-280, Quaternion.ts:150-200, GLContext.ts:50-150

#### Error Handling
```typescript
// Validate inputs with descriptive errors
if (!Number.isFinite(value)) {
  throw new Error(`Invalid value: ${value}. Must be a finite number.`);
}
```

#### JSDoc Documentation
```typescript
/**
 * Brief description of what this does
 *
 * @param param1 - Description of param1
 * @param param2 - Description of param2
 * @returns Description of return value
 * @throws Error if something invalid
 *
 * @example
 * const result = function(value);
 */
function example(param1: string, param2: number): string {
  // Implementation
}
```

---

## Feature Implementation Checklist

When implementing a feature, ensure:

- [ ] Code follows existing patterns (see Matrix4.ts, Quaternion.ts, Canvas.ts, GLContext.ts)
- [ ] TypeScript compiles without errors (strict mode)
- [ ] All edge cases handled (NaN, Infinity, null, zero, empty, etc.)
- [ ] Error messages are descriptive and helpful
- [ ] JSDoc comments explain graphics concepts
- [ ] **Chainability:** State-modifying methods return `this` for fluent API
- [ ] Comprehensive tests written
- [ ] Tests achieve 95%+ line coverage, 90%+ branch coverage
- [ ] All tests pass (`npm test`)
- [ ] API matches PLAN.md specification
- [ ] Proper resource cleanup/disposal (if applicable)

---

## Test Organization

**Structure:** `describe('ClassName')` → constructor tests → method tests → integration tests
**Coverage Required:** 95%+ lines, 90%+ branches
**Commands:**
- All tests: `npm test`
- Specific file: `npm test -- tests/path/to/File.test.ts`
- Watch mode: `npm test -- --watch`
- Coverage: `npm test -- --coverage`

**Reference:** tests/math/Matrix4.test.ts for comprehensive example pattern

---

## Architecture Reference

### Core Module Structure
```
src/
├── core/              # Core rendering (✅ Complete)
│   ├── GLContext.ts   # WebGL 2.0 wrapper
│   ├── Canvas.ts      # Canvas initialization
│   └── Renderer.ts    # Base renderer interface
├── resources/         # GPU resources (🚧 In Progress)
│   ├── Buffer.ts      # Buffers ✅
│   ├── Shader.ts      # Shaders (Next)
│   ├── VertexArray.ts # VAOs
│   └── Texture.ts     # Textures
├── geometry/          # Geometry (🚧 Next)
├── materials/         # Materials (🚧 Next)
├── scene/             # Scene graph (🚧 Next)
└── renderer/          # WebGL renderer (🚧 Next)
```

### Design Patterns
- **Abstraction:** Abstract base classes for extensibility (Renderer, Geometry, Material)
- **Resource Management:** GLContext tracks resources for cleanup
- **Error Checking:** All WebGL calls wrapped with validation
- **Defensive Copies:** Return copies of mutable state (colors, etc.)
- **Type Safety:** Strict TypeScript with enums for constants

---

## Key Decisions & Rationale

### Column-Major Matrices
WebGL uses column-major storage (GLSL convention). Matrices stored in column-major order:
```
Data: [col0_row0, col0_row1, col0_row2, col0_row3, col1_row0, ...]
```

### Float32Array
All GPU-compatible data uses Float32Array for:
- Automatic WebGL compatibility
- Better performance than regular arrays
- Predictable memory layout

### Context-Based Resource Tracking
GLContext tracks all created resources (buffers, shaders, textures, VAOs) for:
- Automatic cleanup on context disposal
- Prevention of memory leaks
- Easier debugging

### Extensible Architecture
Base classes (Renderer, Geometry, Material) allow:
- Future renderers (WebGPU, Canvas 2D, Node.js)
- Custom geometry types
- Custom material shaders

### Three-Tier Usability & Educational Focus

This library is designed for **learners AND expert developers** by providing escape hatches at every level:

**Tier 1: Beginners (High-level abstractions)**
```typescript
// Use pre-built materials - don't worry about shaders
const mesh = new Mesh(geometry, new BasicMaterial({ color: 0xff0000 }));
```

**Tier 2: Intermediate (Customize existing components)**
```typescript
// Write custom shaders when built-in materials aren't enough
const program = ctx.createProgram(myVertexShader, myFragmentShader);
```

**Tier 3: Advanced (Full control)**
```typescript
// Direct access to WebGL API and rendering pipeline
ctx.gl.drawArrays(ctx.gl.TRIANGLES, 0, vertexCount);
```

**Philosophy:**
- Start simple → understand concepts → customize → graduate to expert
- Same library, no switching needed
- `createProgram(vertexSrc, fragmentSrc)` is the key escape hatch:
  - Perfect for educational examples ("here's what a shader is")
  - Enables advanced users to build custom materials
  - Supports library developers extending the system
- Don't add shader file loading or builder helpers until the Material System reveals what's needed (Phase 4+)

**Design Benefits:**
- Progressive learning path: beginner APIs → intermediate customization → expert control
- Educational transparency: see exactly what's happening at each tier, no "magic"

### Escape Hatches & Wrapper Purity

**Philosophy:** Escape hatches are for **completely bypassing the wrapper**, not for mixing wrapper logic with raw WebGL calls.

**The Contract:**
- Use the wrapper API consistently (Buffer methods, Material APIs, etc.), OR
- Use raw WebGL directly on exposed objects (`ctx.gl`, `buffer.buffer`, etc.)
- **Don't mix them** - if you do, you're responsible for maintaining state consistency

**Why This Matters:**
- Wrappers cache state (buffer length, element size, binding state, etc.)
- Raw WebGL calls can invalidate these caches
- Trying to auto-sync caches leads to performance penalties and hidden side effects
- Clear responsibility boundaries prevent subtle bugs

**Usage Patterns:**

✅ **Pure wrapper** (recommended):
```typescript
buffer.setData(data: TypedArray): this
buffer.updateData(offset: number, data: TypedArray): this
buffer.byteLength  // Wrapper tracks state automatically
```

✅ **Pure raw GL** (you manage all state):
```typescript
ctx.gl.bindBuffer(target, buffer.buffer)
ctx.gl.bufferData(target, data, usage)
// Wrapper properties (byteLength, length) now stale - your responsibility
```

❌ **Mixing without sync** (causes bugs):
```typescript
buffer.setData(new Float32Array([1, 2, 3]));  // Wrapper: byteLength=12
ctx.gl.bufferData(..., new Uint8Array([1, 2]), ...);  // GPU: 2 bytes, but wrapper still thinks 12
console.log(buffer.byteLength);  // Returns 12 (wrong!)
```

✅ **Mixing with explicit sync** (advanced):
```typescript
buffer.setData(new Float32Array([1, 2, 3]));  // Wrapper state synced
ctx.gl.bufferData(..., new Uint8Array([1, 2]), ...);  // Raw GL changes state
buffer.setMetadata(length: number, elementByteSize: number): void  // Explicitly resync
console.log(buffer.byteLength);  // Now correct
```

**Reference:** Buffer.ts:692-711 for `setMetadata()` signature and validation

**Wrapper Benefits:**
- No hidden costs: explicit state management, no automatic GPU queries
- Clear boundaries: wrapper vs raw GL (user's responsibility to sync if mixing)

---

## Common Issues & Solutions

### Issue: Tests fail with "WebGL not supported"
**Solution:** Tests run in jsdom environment which mocks WebGL. GLContext expects real WebGL context.

### Issue: Memory grows during tests
**Solution:** Ensure dispose() is called in afterEach() blocks. GLContext tracks resources for cleanup.

### Issue: Coverage gaps in fallback code
**Solution:** Fallback/defensive code doesn't need 100% coverage if main path is tested. Gap coverage over 90% is acceptable.

### Issue: TypeScript strict mode errors
**Solution:** All code must compile with strict mode. Use explicit types and type guards where needed.

---

## Next Steps

1. **Review remaining Phase 1 implementations** (Canvas, Renderer, GLContext, WebGLState)
   - Pending your approval before committing
2. **Implement Program.ts** - Once core rendering approved
3. **Implement VertexArray.ts** - After Program.ts
4. **Implement Texture.ts** - After VertexArray.ts
5. **Implement geometry system** - After Layer 2 GPU resources complete
6. **Implement materials** - After geometry
7. **Implement scene graph** - After materials
8. **Implement WebGL renderer** - Core rendering logic
9. **Create demo** - Rotating triangle/cube

Each feature follows the workflow above with your review and approval between steps.

---

## Best Practices & Considerations

### Code Review Checklist
Before requesting approval, I will verify:
- ✅ All tests pass (`npm test`)
- ✅ Coverage targets met (95%+ lines, 90%+ branches)
- ✅ TypeScript strict mode compiles (`npm run build`)
- ✅ Code follows existing patterns (see reference files)
- ✅ JSDoc comments explain graphics concepts
- ✅ Error handling is comprehensive
- ✅ Resource cleanup/disposal is proper (for GPU resources)
- ✅ No console.log or debugging code left in

### Conflict Avoidance
- Feature branches are isolated - no conflicts with other work
- Main branch only updated after approval - always stable
- Clear status in CLAUDE.md prevents confusion
- Each feature has its own commit message explaining changes

### Performance Considerations
- WebGL operations are batch-optimized where possible
- Resource tracking prevents memory leaks
- Float32Array used throughout for GPU efficiency
- Math operations leverage method chaining where appropriate

### Security & Type Safety
- All inputs validated with descriptive error messages
- Strict TypeScript (no `any` without justification)
- WebGL error checking on all GPU operations
- Defensive copies of mutable state

### Documentation Strategy
- Code comments explain graphics concepts (not just syntax)
- JSDoc includes `@example` blocks for usage
- Architecture decisions documented in HANDOFF.md
- Test files serve as usage examples

### Future Extensibility
- Abstract base classes (Renderer, Geometry, Material) allow future implementations
- Enum constants instead of magic numbers
- Modular imports support tree-shaking
- Design patterns support WebGPU or other backends later

---

## Quick Commands

```bash
# Development
npm test                    # Run all tests
npm test -- --watch        # Watch mode
npm run build               # Build project
npm test -- --coverage      # Coverage report

# Git workflow (feature branch)
git status                  # Check status
git diff                    # See changes
git log --oneline           # View history
git checkout -b feature/[name]  # Create feature branch
git push origin feature/[name]  # Push for backup
```

---

## Questions?

Refer to:
- **HANDOFF.md** - Detailed project context and patterns
- **PLAN.md** - Full architecture and roadmap
- **Existing code** - Matrix4.ts, Quaternion.ts, Canvas.ts, GLContext.ts for patterns
- **Test files** - See how similar features are tested
- **This guide** - CLAUDE.md for workflow and current status
