# Instructions for AI

## Context

- This is a PWA app using deno 2.5
  - Important: Deno 2.5 does not support emit
  - We must not use regexp-based transpilations
  - We should use esbuild native (not WASM)
- It implements the boardgame Oracle of Delphi
- It will be clientside only; no server code
- UI code can be javascript; all logic should be typescript

## Hex Characteristics Requirements

Each hex in the game must have the following characteristics:

1. **Color**: none, red, pink, blue, black, green, yellow
2. **Type**: zeus, sea, shallow, monsters, cubes, temple, clouds, city,
   foundations

## Guidelines

- Keep code simple and readable
- Always update unit tests when adding features
- Use consistent naming conventions
- Prefer composition over inheritance
- Only use comments for workarounds or confusing code
- Build incrementally with small, testable changes
- Cleanly separate UI elements from "engine" elements

## City Placement Rules

- `placeCities` should place each city near one of the 6 corners of the hex map
- For each corner, pick a random direction (+2 or +4) and a random distance
  - For clockwise direction (+2): distance can be 0 to 2
  - For counter-clockwise direction (+4): distance can be 0 to 1
- Place the city there

## Main Files:

- src/main.ts (static file server)
- src/hexmap.ts (primary game logic)
- src/hexmap-svg.ts (SVG visualization)
- tests/ (unit tests)
- index.html (entry point)

## Testing Workflow

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

### When Running Tests:

- Tests should not start servers - they are standalone scripts
- If a test hangs, it's likely importing server code
- Use the specific test commands above for debugging
- Focus on static analysis and code review rather than execution in this
  environment
