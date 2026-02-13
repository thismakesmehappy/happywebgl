---
name: implement-module
description: Implement a new module following project conventions
  ---
# Implement Module

Implement a new module for the WebGL library following project conventions.

## Steps
1. Read ARCHITECTURE.md and PLAN.md to understand where this module fits
2. Read reference implementations (Program.ts, Matrix4.ts, GLContext.ts) to match patterns
3. Implement the module following conventions:
    - Column-major matrices
    - Method chaining (mutation returns `this`, queries return values)
    - AppError with ErrorCode for resource errors
4. Write comprehensive tests targeting 95%+ line, 90%+ branch coverage
5. Run full test suite to verify no regressions
6. Report completion with coverage numbers