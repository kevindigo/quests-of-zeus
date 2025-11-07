import { assertEquals, assertGreaterOrEqual, assertNotEquals } from "@std/assert";
import { HexMap } from "../src/hexmap.ts";

Deno.test("Temple color assignment - should have exactly 6 temples", () => {
  const hexMap = new HexMap();
  const grid = hexMap.getGrid();

  // Find all temple cells
  const templeCells: any[] = [];

  for (let arrayQ = 0; arrayQ < grid.length; arrayQ++) {
    const row = grid[arrayQ];
    if (row) {
      for (let arrayR = 0; arrayR < row.length; arrayR++) {
        const cell = row[arrayR];
        if (cell && cell.terrain === "temple") {
          templeCells.push(cell);
        }
      }
    }
  }

  // Check if we have the expected number of temples
  assertEquals(templeCells.length, 6, "Should have exactly 6 temples");
});

Deno.test("Temple color assignment - all temples should have colors", () => {
  const hexMap = new HexMap();
  const grid = hexMap.getGrid();

  // Find all temple cells
  const templeCells: any[] = [];

  for (let arrayQ = 0; arrayQ < grid.length; arrayQ++) {
    const row = grid[arrayQ];
    if (row) {
      for (let arrayR = 0; arrayR < row.length; arrayR++) {
        const cell = row[arrayR];
        if (cell && cell.terrain === "temple") {
          templeCells.push(cell);
        }
      }
    }
  }

  // Check that all temples have colors assigned
  const coloredTemples = templeCells.filter((cell) => cell.color !== "none");
  assertEquals(coloredTemples.length, 6, "All temples should have colors assigned");

  // Additional assertions for temple properties
  templeCells.forEach((cell, index) => {
    assertNotEquals(cell.q, undefined, `Temple ${index + 1} should have q coordinate`);
    assertNotEquals(cell.r, undefined, `Temple ${index + 1} should have r coordinate`);
    assertNotEquals(cell.color, "none", `Temple ${index + 1} should have a color assigned`);
  });
});

Deno.test("Temple color assignment - temples should have colored outlines", () => {
  const hexMap = new HexMap();
  const grid = hexMap.getGrid();

  // Find all temple cells and collect their colors
  const templeColors = new Set<string>();

  for (let arrayQ = 0; arrayQ < grid.length; arrayQ++) {
    const row = grid[arrayQ];
    if (row) {
      for (let arrayR = 0; arrayR < row.length; arrayR++) {
        const cell = row[arrayR];
        if (cell && cell.terrain === "temple" && cell.color !== "none") {
          templeColors.add(cell.color);
        }
      }
    }
  }

  // Check that temples have colored outlines (at least one unique color)
  assertGreaterOrEqual(templeColors.size, 1, "Temples should have at least one unique color for outlines");
});

Deno.test("Temple color assignment - all temples should have unique coordinates", () => {
  const hexMap = new HexMap();
  const grid = hexMap.getGrid();

  // Find all temple cells
  const templeCells: any[] = [];

  for (let arrayQ = 0; arrayQ < grid.length; arrayQ++) {
    const row = grid[arrayQ];
    if (row) {
      for (let arrayR = 0; arrayR < row.length; arrayR++) {
        const cell = row[arrayR];
        if (cell && cell.terrain === "temple") {
          templeCells.push(cell);
        }
      }
    }
  }

  // Check that no two temples share the same coordinates
  const coordinateSet = new Set<string>();
  const duplicateCoordinates = new Set<string>();

  templeCells.forEach((cell) => {
    const coord = `${cell.q},${cell.r}`;
    if (coordinateSet.has(coord)) {
      duplicateCoordinates.add(coord);
    }
    coordinateSet.add(coord);
  });

  assertEquals(duplicateCoordinates.size, 0, "All temples should have unique coordinates");
});

Deno.test("HexMap grid structure - should have valid grid", () => {
  const hexMap = new HexMap();
  const grid = hexMap.getGrid();

  // Basic grid structure checks
  assertGreaterOrEqual(grid.length, 1, "Grid should have at least one row");
  
  // Check that grid is properly structured
  grid.forEach((row, rowIndex) => {
    if (row) {
      assertGreaterOrEqual(row.length, 1, `Row ${rowIndex} should have at least one cell`);
    }
  });
});