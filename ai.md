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
1) **Color**: none, red, pink, blue, black, green, yellow
2) **Type**: zeus, sea, shallow, monsters, cubes, temple, clouds, city, foundations

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
- For each corner, start at the corner hex
- If the corner hex is already a non-shallows hex, try the next hex clockwise along the edge
- Keep going clockwise until finding a shallows hex that is adjacent to at least one other shallows hex
- If no such shallows hex is found, place the city on the first shallows hex found
- Do the same for each of the other 5 cities/corners
- **New rule**: The target has to be a shallows AND it has to be adjacent to a shallows

## Main Files:
- main.ts (primary game code)
- main_test.ts (unit tests)
- index.html (entry point)