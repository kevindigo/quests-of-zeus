import { getMapStatistics, HexMap } from './src/hexmap.ts';

/**
 * Compare color distributions between the old random assignment and new least-used preference
 */
function compareColorDistributions(): void {
  console.log('=== Comparing Color Distribution Methods ===\n');

  const testCount = 30;
  const _colors = ['red', 'pink', 'blue', 'black', 'green', 'yellow'];

  // Test with current implementation (least-used preference)
  console.log('Testing with LEAST-USED COLOR PREFERENCE:');
  const newStats = runColorDistributionTest(testCount);

  console.log('\n' + '='.repeat(50) + '\n');

  // Test with old implementation (random assignment)
  console.log('Testing with RANDOM COLOR ASSIGNMENT:');
  const oldStats = runColorDistributionTest(testCount, true);

  console.log('\n' + '='.repeat(50) + '\n');
  console.log('=== COMPARISON SUMMARY ===\n');

  // Compare key metrics
  console.log('Key Metrics Comparison:');
  console.log(`- Average conflicts per map:`);
  console.log(`  Least-used: ${newStats.avgConflicts.toFixed(2)}`);
  console.log(`  Random:     ${oldStats.avgConflicts.toFixed(2)}`);

  console.log(`\n- Maximum color difference in any map:`);
  console.log(`  Least-used: ${newStats.maxDifference} tiles`);
  console.log(`  Random:     ${oldStats.maxDifference} tiles`);

  console.log(`\n- Average standard deviation per color:`);
  console.log(`  Least-used: ${newStats.avgStdDev.toFixed(2)} tiles`);
  console.log(`  Random:     ${oldStats.avgStdDev.toFixed(2)} tiles`);

  // Improvement analysis
  const conflictImprovement =
    ((oldStats.avgConflicts - newStats.avgConflicts) / oldStats.avgConflicts *
      100).toFixed(1);
  const balanceImprovement =
    ((oldStats.maxDifference - newStats.maxDifference) /
      oldStats.maxDifference * 100).toFixed(1);

  console.log(`\n=== IMPROVEMENT ANALYSIS ===`);
  console.log(
    `- Conflict reduction: ${conflictImprovement}% fewer same-color adjacencies`,
  );
  console.log(
    `- Balance improvement: ${balanceImprovement}% better color distribution`,
  );

  if (
    parseFloat(conflictImprovement) > 0 && parseFloat(balanceImprovement) > 0
  ) {
    console.log(
      '\n✅ SUCCESS: Least-used color preference provides better balance!',
    );
  } else {
    console.log(
      '\n⚠️  Mixed results: Some metrics may need further optimization',
    );
  }
}

/**
 * Run color distribution test with optional old method simulation
 */
function runColorDistributionTest(
  testCount: number,
  useOldMethod: boolean = false,
): { avgConflicts: number; maxDifference: number; avgStdDev: number } {
  const colorStats: Record<
    string,
    {
      min: number;
      max: number;
      total: number;
      counts: number[];
      stdDev: number;
    }
  > = {};

  // Initialize stats for each color
  const _colors = ['red', 'pink', 'blue', 'black', 'green', 'yellow'];
  for (const color of colors) {
    colorStats[color] = {
      min: Infinity,
      max: -Infinity,
      total: 0,
      counts: [],
      stdDev: 0,
    };
  }

  let totalConflicts = 0;
  let maxMapDifference = 0;

  for (let i = 0; i < testCount; i++) {
    const map = new HexMap();

    if (useOldMethod) {
      // Simulate old random assignment method
      simulateOldRandomAssignment(map);
    }

    const grid = map.getGrid();
    const stats = getMapStatistics();

    // Count conflicts
    const conflicts = countAdjacentSameColorSeaHexes(map, grid);
    totalConflicts += conflicts;

    // Update stats for each color
    const currentCounts: number[] = [];
    for (const color of colors) {
      const count =
        stats.seaColorCounts[color as keyof typeof stats.seaColorCounts] || 0;
      colorStats[color].min = Math.min(colorStats[color].min, count);
      colorStats[color].max = Math.max(colorStats[color].max, count);
      colorStats[color].total += count;
      colorStats[color].counts.push(count);
      currentCounts.push(count);
    }

    // Track maximum difference in this map
    const mapDifference = Math.max(...currentCounts) -
      Math.min(...currentCounts);
    if (mapDifference > maxMapDifference) {
      maxMapDifference = mapDifference;
    }
  }

  // Calculate standard deviations
  let totalStdDev = 0;
  for (const color of colors) {
    const stats = colorStats[color];
    const average = stats.total / testCount;
    const variance = stats.counts.reduce((sum, count) =>
      sum + Math.pow(count - average, 2), 0) / testCount;
    stats.stdDev = Math.sqrt(variance);
    totalStdDev += stats.stdDev;
  }

  // Log results
  console.log(`Results after ${testCount} tests:`);
  console.log(
    `- Average conflicts: ${
      (totalConflicts / testCount).toFixed(2)
    } same-color adjacencies`,
  );
  console.log(`- Maximum color difference: ${maxMapDifference} tiles`);

  console.log('\nColor Distribution:');
  for (const color of colors) {
    const stats = colorStats[color];
    const average = stats.total / testCount;
    console.log(
      `${color.toUpperCase()}: Avg ${
        average.toFixed(2)
      }, Range ${stats.min}-${stats.max}, StdDev ${stats.stdDev.toFixed(2)}`,
    );
  }

  return {
    avgConflicts: totalConflicts / testCount,
    maxDifference: maxMapDifference,
    avgStdDev: totalStdDev / colors.length,
  };
}

/**
 * Simulate the old random assignment method for comparison
 */
function simulateOldRandomAssignment(map: HexMap): void {
  const grid = map.getGrid();
  const seaCells: { q: number; r: number; terrain: string; color: string }[] =
    [];

  // Collect all sea cells
  for (let arrayQ = 0; arrayQ < grid.length; arrayQ++) {
    const row = grid[arrayQ];
    if (row) {
      for (let arrayR = 0; arrayR < row.length; arrayR++) {
        const cell = row[arrayR];
        if (cell && cell.terrain === 'sea') {
          seaCells.push(cell);
        }
      }
    }
  }

  // Shuffle sea cells
  shuffleArray(seaCells);

  // Old method: assign colors randomly from available colors
  for (const cell of seaCells) {
    // Get colors used by adjacent sea cells
    const adjacentColors = new Set<string>();
    const neighbors = map.getNeighbors(cell.q, cell.r);

    for (const neighbor of neighbors) {
      if (neighbor.terrain === 'sea' && neighbor.color !== 'none') {
        adjacentColors.add(neighbor.color);
      }
    }

    // Find available colors
    const availableColors = ['red', 'pink', 'blue', 'black', 'green', 'yellow']
      .filter(
        (color) => !adjacentColors.has(color),
      );

    // Choose randomly from available colors (old method)
    if (availableColors.length > 0) {
      const randomIndex = Math.floor(Math.random() * availableColors.length);
      cell.color = availableColors[randomIndex];
    } else {
      // Fallback: choose randomly from all colors
      const randomIndex = Math.floor(Math.random() * 6);
      cell.color =
        ['red', 'pink', 'blue', 'black', 'green', 'yellow'][randomIndex];
    }
  }
}

/**
 * Count adjacent sea hexes with the same color
 */
function countAdjacentSameColorSeaHexes(
  map: HexMap,
  grid: { q: number; r: number; terrain: string; color: string }[][],
): number {
  let conflicts = 0;
  const processedPairs = new Set<string>();

  for (let arrayQ = 0; arrayQ < grid.length; arrayQ++) {
    const row = grid[arrayQ];
    if (row) {
      for (let arrayR = 0; arrayR < row.length; arrayR++) {
        const cell = row[arrayR];
        if (cell && cell.terrain === 'sea' && cell.color !== 'none') {
          const neighbors = map.getNeighbors(cell.q, cell.r);

          for (const neighbor of neighbors) {
            if (neighbor.terrain === 'sea' && neighbor.color !== 'none') {
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
function getPairKey(
  cell1: { q: number; r: number },
  cell2: { q: number; r: number },
): string {
  const [minQ, maxQ] = [Math.min(cell1.q, cell2.q), Math.max(cell1.q, cell2.q)];
  const [minR, maxR] = [Math.min(cell1.r, cell2.r), Math.max(cell1.r, cell2.r)];
  return `${minQ},${minR}-${maxQ},${maxR}`;
}

/**
 * Shuffle array using Fisher-Yates algorithm
 */
function shuffleArray<T>(array: T[]): void {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

// Run the comparison
compareColorDistributions();
