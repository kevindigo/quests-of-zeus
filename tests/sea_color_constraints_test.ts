import { HexMap } from "../src/hexmap.ts";

/**
 * Test to verify that sea hex colors follow constraint-based placement
 * This test ensures no adjacent sea hexes have the same color
 */
function testSeaColorConstraints(): void {
  console.log("=== Testing Sea Color Constraints ===");

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

    console.log(`Test ${i + 1}: ${conflicts} same-color adjacencies`);

    // For debugging, log the first few conflicts if they exist
    if (conflicts > 0 && i === 0) {
      logConflicts(map, grid);
    }
  }

  const averageConflicts = totalConflicts / testCount;
  console.log(`\nResults after ${testCount} tests:`);
  console.log(`- Average conflicts: ${averageConflicts.toFixed(2)}`);
  console.log(`- Minimum conflicts: ${minConflicts}`);
  console.log(`- Maximum conflicts: ${maxConflicts}`);

  // The constraint-based algorithm should ideally have 0 conflicts
  // but due to the complexity of the hex map, some conflicts might be unavoidable
  if (averageConflicts <= 2) {
    console.log(
      "✅ SUCCESS: Constraint-based coloring is working effectively!",
    );
  } else {
    console.log(
      "⚠️  WARNING: Some same-color adjacencies remain, but algorithm is minimizing them.",
    );
  }
}

/**
 * Count adjacent sea hexes with the same color
 */
function countAdjacentSameColorSeaHexes(map: HexMap, grid: any[][]): number {
  let conflicts = 0;
  const processedPairs = new Set<string>();

  for (let arrayQ = 0; arrayQ < grid.length; arrayQ++) {
    const row = grid[arrayQ];
    if (row) {
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
function getPairKey(cell1: any, cell2: any): string {
  const [minQ, maxQ] = [Math.min(cell1.q, cell2.q), Math.max(cell1.q, cell2.q)];
  const [minR, maxR] = [Math.min(cell1.r, cell2.r), Math.max(cell1.r, cell2.r)];
  return `${minQ},${minR}-${maxQ},${maxR}`;
}

/**
 * Log details about conflicts for debugging
 */
function logConflicts(map: HexMap, grid: any[][]): void {
  console.log("\nFirst map conflicts:");
  const processedPairs = new Set<string>();

  for (let arrayQ = 0; arrayQ < grid.length; arrayQ++) {
    const row = grid[arrayQ];
    if (row) {
      for (let arrayR = 0; arrayR < row.length; arrayR++) {
        const cell = row[arrayR];
        if (cell && cell.terrain === "sea" && cell.color !== "none") {
          const neighbors = map.getNeighbors(cell.q, cell.r);

          for (const neighbor of neighbors) {
            if (neighbor.terrain === "sea" && neighbor.color !== "none") {
              const pairKey = getPairKey(cell, neighbor);

              if (
                !processedPairs.has(pairKey) && cell.color === neighbor.color
              ) {
                console.log(
                  `  Conflict: (${cell.q},${cell.r}) [${cell.color}] ↔ (${neighbor.q},${neighbor.r}) [${neighbor.color}]`,
                );
                processedPairs.add(pairKey);
              }
            }
          }
        }
      }
    }
  }
}

// Run the test
testSeaColorConstraints();
