# Claude Development Guide

**Project:** WebGL Graphics Library
**Phase:** 1 - Core MVP (Layer 2 GPU Resources)
**Tests:** 2,618 passing | 100% lines (shaders) | 100% branch (shaders)

---

## Current Focus

**Next:** TBD (Layer 2 GPU resources complete)

**Completed this phase:**
- shaders/ module (33 tests) - Shader, VertexShader, FragmentShader, GLSLType
- Program.ts (225 tests) - shader program wrapper with uniform setters, validateCompatibility
- VertexArray.ts (43 tests) - VAO wrapper with attribute configuration
- errors/ module (10 tests) - AppError, ErrorCodes, message formatting
- textures/ module (157 tests) - Texture2D, TextureCubeMap, Texture3D, Texture2DArray
- Object3D.ts (141 tests) - scene graph node with transforms, hierarchy, traversal, search, cloning

---

## Critical Conventions

**Column-Major Matrices** - WebGL/GLSL convention, NOT row-major:
```
[col0_row0, col0_row1, col0_row2, col0_row3, col1_row0, ...]
```

**Method Chaining** - Mutation methods return `this`, query methods return values

**Coverage Targets** - 95%+ lines, 90%+ branches

**Error Handling** - Use AppError with ErrorCode for resource errors:
```typescript
throw new AppError(ErrorCode.RES_DISPOSED, { resource: 'ClassName' });
throw new AppError(ErrorCode.RES_INVALID_ARG, { resource: 'ClassName', method: 'methodName', detail: 'what went wrong' });
```

---

## Quick Commands

```bash
npm test                              # All tests
npm test -- tests/path/File.test.ts   # Single file
npm test -- --coverage                # With coverage
npm test -- --reporter=dot            # Minimal output (use for large failures)
```

---

## Project Structure

```
src/
├── core/           # GLContext, Canvas, Renderer, WebGLState
├── resources/      # Program, VertexArray, buffers/, textures/, shaders/
├── scene/          # Object3D, Scene, Mesh
├── errors/         # AppError, ErrorCodes, messages
└── math/           # vectors/, matrices/, quaternions/
```

---

## Reference Files

- **Patterns:** Matrix4.ts, GLContext.ts, Program.ts
- **Tests:** Matrix4.test.ts, Program.test.ts
- **Architecture:** ARCHITECTURE.md, PLAN.md
- **History:** COMPLETED.md (phase completion details)

---

## Workflow

1. Implement feature with tests (95%+ line, 90%+ branch)
2. Verify all tests pass
3. Report completion for review
4. User commits after approval