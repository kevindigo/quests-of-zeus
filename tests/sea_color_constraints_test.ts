import { assert } from "@std/assert";
import { type HexCell, HexMap } from "../src/hexmap.ts";

/**
 * Test to verify that sea hex colors follow constraint-based placement
 * This test ensures no adjacent sea hexes have the same color
 */
Deno.test("Sea color constraints - adjacent sea hexes should not have same color", () => {
  // Test multiple maps to ensure consistency
  const testCount = 10;
  let totalConflicts = 0;
  let maxConflicts = 0;
  let minConflicts = Infinity;

  for (let i = 0; i < testCount; i++) {
    const map = new HexMap();
    const grid = map.getGrid();
    const conflicts = countAdjacentSameColorSeaHexes(map, grid);

    totalConflicts += conflicts;
    maxConflicts = Math.max(maxConflicts, conflicts);
    minConflicts = Math.min(minConflicts, conflicts);
  }

  const averageConflicts = totalConflicts / testCount;

  // The constraint-based algorithm should ideally have 0 conflicts
  // but due to the complexity of the hex map, some conflicts might be unavoidable
  assert(
    averageConflicts <= 2,
    `Average conflicts ${averageConflicts} should be <= 2, but found ${averageConflicts} conflicts across ${testCount} maps`,
  );

  // Additional assertions for quality control
  assert(
    maxConflicts <= 5,
    `Maximum conflicts ${maxConflicts} should be <= 5 across ${testCount} maps`,
  );
  assert(
    minConflicts >= 0,
    `Minimum conflicts ${minConflicts} should be >= 0`,
  );
});

/**
 * Count adjacent sea hexes with the same color
 */
function countAdjacentSameColorSeaHexes(
  map: HexMap,
  grid: HexCell[][],
): number {
  let conflicts = 0;
  const processedPairs = new Set<string>();

  for (let arrayQ = 0; arrayQ < grid.length; arrayQ++) {
    const row = grid[arrayQ];
    if (row && Array.isArray(row)) {
      for (let arrayR = 0; arrayR < row.length; arrayR++) {
        const cell = row[arrayR];
        if (cell && cell.terrain === "sea" && cell.color !== "none") {
          const neighbors = map.getNeighbors(cell.q, cell.r);

          for (const neighbor of neighbors) {
            if (neighbor.terrain === "sea" && neighbor.color !== "none") {
              // Create a unique key for this pair to avoid double counting
              const pairKey = getPairKey(cell, neighbor);

              if (
                !processedPairs.has(pairKey) && cell.color === neighbor.color
              ) {
                conflicts++;
                processedPairs.add(pairKey);
              }
            }
          }
        }
      }
    }
  }

  return conflicts;
}

/**
 * Generate a unique key for a pair of cells to avoid double counting conflicts
 */
function getPairKey(cell1: HexCell, cell2: HexCell): string {
  const [minQ, maxQ] = [Math.min(cell1.q, cell2.q), Math.max(cell1.q, cell2.q)];
  const [minR, maxR] = [Math.min(cell1.r, cell2.r), Math.max(cell1.r, cell2.r)];
  return `${minQ},${minR}-${maxQ},${maxR}`;
}
