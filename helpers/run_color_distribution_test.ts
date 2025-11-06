import { getMapStatistics, HexMap } from "../src/hexmap.ts";

/**
 * Test to analyze the distribution of colors across sea tiles
 * This addresses the concern about uneven color distribution (17 vs 6 tiles)
 */
function testSeaColorDistribution(): void {
  const testCount = 50; // More tests for better statistics
  const colorStats: Record<
    string,
    { min: number; max: number; total: number; counts: number[] }
  > = {};

  // Initialize stats for each color
  const colors = ["red", "pink", "blue", "black", "green", "yellow"];
  for (const color of colors) {
    colorStats[color] = {
      min: Infinity,
      max: -Infinity,
      total: 0,
      counts: [],
    };
  }

  let totalSeaTiles = 0;
  let totalConflicts = 0;

  for (let i = 0; i < testCount; i++) {
    const map = new HexMap();
    const grid = map.getGrid();
    const stats = getMapStatistics();

    // Count conflicts
    const conflicts = countAdjacentSameColorSeaHexes(map, grid);
    totalConflicts += conflicts;

    // Update stats for each color
    for (const color of colors) {
      const count =
        stats.seaColorCounts[color as keyof typeof stats.seaColorCounts] || 0;
      colorStats[color].min = Math.min(colorStats[color].min, count);
      colorStats[color].max = Math.max(colorStats[color].max, count);
      colorStats[color].total += count;
      colorStats[color].counts.push(count);
      totalSeaTiles += count;
    }
  }

  let maxDifference = 0;
  let mostUnevenMap = -1;
  let mostUnevenDifference = 0;

  for (const color of colors) {
    const stats = colorStats[color];
    const average = stats.total / testCount;
    const variance = stats.counts.reduce((sum, count) =>
      sum + Math.pow(count - average, 2), 0) / testCount;
    const stdDev = Math.sqrt(variance);

    // Track maximum difference
    const colorRange = stats.max - stats.min;
    if (colorRange > maxDifference) {
      maxDifference = colorRange;
    }
  }

  // Find the most uneven map
  for (let i = 0; i < testCount; i++) {
    const counts = colors.map((color) => colorStats[color].counts[i]);
    const mapDifference = Math.max(...counts) - Math.min(...counts);
    if (mapDifference > mostUnevenDifference) {
      mostUnevenDifference = mapDifference;
      mostUnevenMap = i;
    }
  }

  // Evaluate the distribution
  if (maxDifference > 10) {
    console.log("❌ CRITICAL: Significant color imbalance detected!");
    console.log("   Some colors appear 10+ times more than others.");
  } else if (maxDifference > 7) {
    console.log("⚠️  WARNING: Moderate color imbalance detected!");
    console.log("   Some colors appear 7+ times more than others.");
  } else if (maxDifference > 5) {
    console.log("ℹ️  NOTE: Some color imbalance present.");
    console.log("   Some colors appear 5+ times more than others.");
  } else {
    // console.log("✅ Color distribution appears reasonably balanced.");
  }

  // Check if we've seen the extreme case mentioned (17 vs 6)
  const extremeCaseFound = colors.some((color) =>
    colorStats[color].max >= 17 &&
    colors.some((otherColor) =>
      colorStats[otherColor].min <= 6 && otherColor !== color
    )
  );

  if (extremeCaseFound) {
    console.log(
      "\n⚠️  EXTREME CASE DETECTED: Found maps with 17+ of one color and 6- of another!",
    );
  } else {
    // console.log("\n✅ No extreme cases (17 vs 6) detected in this sample.");
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
testSeaColorDistribution();
