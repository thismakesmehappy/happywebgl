---
name: review-module
description: Review module changes against project conventions before committing
---

# Review Module

Review recent changes against project conventions and coverage targets.

## Steps

1. Run `git diff --name-only` to identify changed/new files
2. For each changed source file in `src/`:
- Verify a corresponding test file exists in `tests/`
- Run tests: `npm test -- tests/{module}/ --coverage`
- Check coverage meets targets: 95%+ lines, 90%+ branches
3. Review code against conventions:
- AppError with ErrorCode for resource errors (not raw throws)
- Method chaining: mutation methods return `this`, query methods return values
- Column-major matrix ordering where applicable
- Disposed resource checks on public methods
4. Compare patterns against reference files (Program.ts, Matrix4.ts) for consistency
5. Report findings:
- Coverage numbers per file
- Convention violations (if any)
- Missing test coverage areas
- Any public API inconsistencies with existing modules