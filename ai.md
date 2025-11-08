# Instructions for AI

## Context

- This is a PWA app using deno 2.5
- It implements boardgame based on Oracle of Delphi
- It will be clientside only; no server code
- UI code can be javascript; all logic should be typescript

## Guidelines

- Keep code simple and readable
- Always update unit tests when adding features
- Unit tests should use assert, not console log
- Use consistent naming conventions
- Prefer composition over inheritance
- Only use comments for workarounds or confusing code
- Build incrementally with small, testable changes
- Cleanly separate UI elements from "engine" elements

## Main Files:

- src/main.ts (static file server)
- src/hexmap.ts (primary game logic)
- src/hexmap-svg.ts (SVG visualization)
- tests/ (unit tests)
- index.html (entry point)

## Testing Workflow

- Before declaring any work complete, `deno test` should succeed

### Available Test Commands:

- `deno task test` - Run all tests
- `deno task test:no-server` - Run tests without remote type checking (faster)
- `deno task test:fast` - Fast test mode (no execution, just compilation)
- `deno task test:single <test-name>` - Run a single test by filter
- `deno run debug_test.ts` - Run debug tests without server dependencies
- `deno run tests/simple_test.ts` - Run individual test files directly

### Debugging Guidelines:

- Use `debug_test.ts` for experiments to avoid server startup
- Individual test files can be run directly with `deno run`
- Avoid importing `src/main.ts` in tests to prevent server hangs
- Use `test_utils.ts` for test helper functions
- Unit tests should comply with deno norms and be in the tests/ folder
- Other diagnostic tests and debug scripts should go in the debug/ folder

### When Running Tests:

- Tests should not start servers - they are standalone scripts
- If a test hangs, it's likely importing server code
- Use the specific test commands above for debugging
- Focus on static analysis and code review rather than execution in this
  environment
