// Tests for terrain distribution in the game map

import { assert, assertEquals, assertGreater, assertLessOrEqual, assertExists } from "@std/assert";
import { HexMap } from "../src/hexmap.ts";

Deno.test("Terrain distribution - all expected terrains present", () => {
  const hexMap = new HexMap();
  const grid = hexMap.getGrid();

  // Count terrain types
  const terrainCounts: Record<string, number> = {};
  let totalCells = 0;

  for (let arrayQ = 0; arrayQ < grid.length; arrayQ++) {
    const row = grid[arrayQ];
    if (row) {
      for (let arrayR = 0; arrayR < row.length; arrayR++) {
        const cell = row[arrayR];
        if (cell) {
          terrainCounts[cell.terrain] = (terrainCounts[cell.terrain] || 0) + 1;
          totalCells++;
        }
      }
    }
  }

  // Check if all expected terrain types are present
  const expectedTerrains = [
    "zeus",
    "sea",
    "shallow",
    "monsters",
    "cubes",
    "temple",
    "clouds",
    "city",
    "foundations",
  ];
  
  // Assert all expected terrains are present
  for (const terrain of expectedTerrains) {
    assertExists(
      terrainCounts[terrain],
      `Expected terrain "${terrain}" should be present`
    );
    assertGreater(
      terrainCounts[terrain] || 0,
      0,
      `Expected terrain "${terrain}" should have at least 1 cell`
    );
  }
});

Deno.test("Terrain distribution - constraints satisfied", () => {
  const hexMap = new HexMap();
  const grid = hexMap.getGrid();

  // Count terrain types
  const terrainCounts: Record<string, number> = {};
  let totalCells = 0;

  for (let arrayQ = 0; arrayQ < grid.length; arrayQ++) {
    const row = grid[arrayQ];
    if (row) {
      for (let arrayR = 0; arrayR < row.length; arrayR++) {
        const cell = row[arrayR];
        if (cell) {
          terrainCounts[cell.terrain] = (terrainCounts[cell.terrain] || 0) + 1;
          totalCells++;
        }
      }
    }
  }

  // Check specific constraints
  const shallowCount = terrainCounts["shallow"] || 0;
  const seaCount = terrainCounts["sea"] || 0;

  // Assert terrain constraints
  assertLessOrEqual(
    shallowCount,
    10,
    `Shallow terrain should have at most 10 cells, but has ${shallowCount}`
  );
  assertGreater(
    seaCount,
    20,
    `Sea terrain should have more than 20 cells, but has ${seaCount}`
  );
});

Deno.test("Terrain distribution - basic grid structure", () => {
  const hexMap = new HexMap();
  const grid = hexMap.getGrid();

  // Additional assertions for basic sanity
  assertGreater(grid.length, 0, "Grid should have at least one row");

  // Count total cells to verify grid has content
  let totalCells = 0;
  for (let arrayQ = 0; arrayQ < grid.length; arrayQ++) {
    const row = grid[arrayQ];
    if (row) {
      for (let arrayR = 0; arrayR < row.length; arrayR++) {
        const cell = row[arrayR];
        if (cell) {
          totalCells++;
        }
      }
    }
  }

  assertGreater(totalCells, 0, "Grid should have at least one cell");
});