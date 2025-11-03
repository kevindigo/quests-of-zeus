# Instructions for AI

## Context
- This is a PWA app using deno 2.5
- It implements the boardgame Oracle of Delphi
- It will be clientside only; no server code

## Hex Characteristics Requirements
Each hex in the game must have the following characteristics:
1) **Color**: red, pink, blue, black, green, yellow
2) **Type**: zeus, sea, shallow, monsters, cubes, temple, clouds, city, foundations

## Guidelines
- Keep code simple and readable
- Always update unit tests when adding features  
- Use consistent naming conventions
- Prefer composition over inheritance
- Only use comments for workarounds or confusing code
- Build incrementally with small, testable changes
- Cleanly separate UI elements from "engine" elements

## Main Files:
- main.ts (primary game code)
- main_test.ts (unit tests)
- index.html (entry point)