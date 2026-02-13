# Claude Code Automations

## Skills

Available via slash commands. Each skill loads its instructions only when invoked (zero idle token cost).

| Command | Purpose |
|---------|---------|
| `/implement-module` | Guided module implementation: reads ARCHITECTURE.md and reference files, implements with conventions, writes tests to coverage targets |
| `/coverage-check` | Finds coverage gaps in a module and suggests specific test cases to close them |
| `/review-module` | Pre-commit review: checks git diff against conventions, verifies tests exist and pass, flags inconsistencies |

## Other Recommendations (Not Yet Implemented)

### Hooks (postToolUse)

Hooks run automatically after tool calls. They increase token usage since their output is injected into every qualifying edit. Consider adding these if the feedback loop benefit outweighs the cost.

**TypeScript type-check on edit** — Runs `tsc --noEmit` after every Edit/Write to catch type errors immediately. Useful given strict mode with `noUncheckedIndexedAccess`.

```json
{
  "hooks": {
    "postToolUse": [
      {
        "matcher": "Edit|Write",
        "command": "cd /Users/bernardo/Library/CloudStorage/Dropbox/_CODE/webgl && npx tsc --noEmit --pretty 2>&1 | head -20"
      }
    ]
  }
}
```

**Auto-run related tests on edit** — Mirrors `src/` path to `tests/` and runs the matching test file after edits.

```json
{
  "hooks": {
    "postToolUse": [
      {
        "matcher": "Edit|Write",
        "command": "FILE=\"$CC_TOOL_FILE\"; if echo \"$FILE\" | grep -q 'src/'; then TEST=$(echo \"$FILE\" | sed 's|src/|tests/|' | sed 's|\\.ts$|.test.ts|'); if [ -f \"$TEST\" ]; then cd /Users/bernardo/Library/CloudStorage/Dropbox/_CODE/webgl && npx vitest run \"$TEST\" --reporter=dot 2>&1 | tail -5; fi; fi"
      }
    ]
  }
}
```

**Where to configure**: `.claude/settings.json`

### MCP Servers

MCP server tool definitions are included in every message (small fixed token cost per turn).

**context7** — Live documentation lookup for WebGL2/MDN docs during implementation.

```bash
claude mcp add context7 -- npx -y @upstash/context7-mcp
```

### Subagents

Already available via installed plugins. Run in separate context (no main conversation token cost).

**code-reviewer** — Parallel code review for convention violations, missed error handling, missing dispose patterns. Invoke with: `Use the code-reviewer agent to review the changes in src/{module}/`