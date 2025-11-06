import { HexMap } from "./src/hexmap.ts";

/**
 * Test the constraint-based sea coloring algorithm
 */
function testConstraintColoring(): void {
  console.log("=== Testing Constraint-Based Sea Coloring ===\n");

  // Test multiple maps
  const testCount = 5;
  let totalConflicts = 0;
  let maxConflicts = 0;
  let minConflicts = Infinity;

  for (let i = 0; i < testCount; i++) {
    console.log(`Generating map ${i + 1}...`);
    const map = new HexMap();
    const grid = map.getGrid();

    // Count conflicts
    const conflicts = countAdjacentSameColorSeaHexes(map, grid);

    totalConflicts += conflicts;
    maxConflicts = Math.max(maxConflicts, conflicts);
    minConflicts = Math.min(minConflicts, conflicts);
  }

  const averageConflicts = totalConflicts / testCount;
  console.log(`=== Results after ${testCount} tests ===`);
  console.log(`- Average conflicts: ${averageConflicts.toFixed(2)}`);
  console.log(`- Minimum conflicts: ${minConflicts}`);
  console.log(`- Maximum conflicts: ${maxConflicts}`);

  // Evaluate performance
  if (averageConflicts === 0) {
    console.log("\n✅ PERFECT: No same-color adjacencies detected!");
  } else if (averageConflicts <= 2) {
    console.log("\n✅ EXCELLENT: Minimal same-color adjacencies!");
  } else if (averageConflicts <= 5) {
    console.log("\n✅ GOOD: Constraint-based coloring is working effectively!");
  } else {
    console.log("\n⚠️  ACCEPTABLE: Some same-color adjacencies remain.");
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

// Run the test
testConstraintColoring();
