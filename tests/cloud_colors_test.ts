import { assertEquals } from "@std/assert";
import { type HexColor, HexMap } from "../src/hexmap.ts";

Deno.test("Cloud hex color assignment", () => {
  const hexMap = new HexMap();
  const grid = hexMap.getGrid();

  // Find all cloud hexes
  const cloudHexes: { q: number; r: number; color: HexColor }[] = [];

  for (let arrayQ = 0; arrayQ < grid.length; arrayQ++) {
    const row = grid[arrayQ];
    if (row) {
      for (let arrayR = 0; arrayR < row.length; arrayR++) {
        const cell = row[arrayR];
        if (cell && cell.terrain === "clouds") {
          cloudHexes.push({
            q: cell.q,
            r: cell.r,
            color: cell.color,
          });
        }
      }
    }
  }

  // Count colors
  const colorCounts: Record<HexColor, number> = {
    "none": 0,
    "red": 0,
    "pink": 0,
    "blue": 0,
    "black": 0,
    "green": 0,
    "yellow": 0,
  };

  for (const cloudHex of cloudHexes) {
    colorCounts[cloudHex.color]++;
  }

  // Verify that we have exactly 12 cloud hexes
  assertEquals(cloudHexes.length, 12, "Should have exactly 12 cloud hexes");

  // Verify that each color appears exactly twice (except "none")
  for (const [color, count] of Object.entries(colorCounts)) {
    if (color !== "none") {
      assertEquals(count, 2, `Color ${color} should appear exactly twice`);
    }
  }

  // Verify that no cloud hex has "none" color
  assertEquals(colorCounts["none"], 0, "No cloud hex should have 'none' color");
});
