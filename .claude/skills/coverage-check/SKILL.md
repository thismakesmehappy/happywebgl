---
name: coverage-check
description: Find coverage gaps in a specific module
  ---
# Coverage Check

Run coverage for a specific module and identify gaps.

## Steps
1. Run: `npm test -- tests/{module}/ --coverage`
2. Identify uncovered lines and branches from the report
3. For each gap, explain what scenario is untested
4. Suggest specific test cases to close the gaps
5. Target: 95%+ lines, 90%+ branches