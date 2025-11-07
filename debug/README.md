# Debug Scripts

This directory contains debug scripts that are useful for development and
troubleshooting but are not part of the formal test suite.

## Usage

These scripts can be run directly with:

```bash
deno run --allow-read debug/<script-name>.ts
```

## Scripts

- `debug_favor_test.ts` - Debug script for favor system
- `debug_test.ts` - Debug test runner
- `minimal_movement_test.ts` - Minimal movement test
- `simple_offering_test.ts` - Simple offering test
- `simple_test.ts` - Simple test
- `test_monster_display.ts` - Monster display test
- `test_movement_fix.ts` - Movement fix test
- `test_ship_movement.ts` - Ship movement test
- `test_zeus_start_movement.ts` - Zeus start movement test

## Note

These scripts use console.log for output and are not proper unit tests. For
formal testing, use the files in the `tests/` directory.
