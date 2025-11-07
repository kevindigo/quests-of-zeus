import { getMapStatistics, HexMap } from "./src/hexmap.ts";

/**
 * Analyze the distribution of colors across sea tiles
 */
function analyzeSeaColorDistribution(): void {
  console.log("=== Analyzing Sea Color Distribution ===\n");

  const testCount = 20;
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

  for (let i = 0; i < testCount; i++) {
    console.log(`Generating map ${i + 1}...`);
    const _map = new HexMap();
    const stats = getMapStatistics();

    // Update stats for each color
    for (const color of colors) {
      const count =
        stats.seaColorCounts[color as keyof typeof stats.seaColorCounts] || 0;
      colorStats[color].min = Math.min(colorStats[color].min, count);
      colorStats[color].max = Math.max(colorStats[color].max, count);
      colorStats[color].total += count;
      colorStats[color].counts.push(count);
    }
  }

  console.log("\n=== Color Distribution Results ===");
  console.log(`Based on ${testCount} randomly generated maps\n`);

  for (const color of colors) {
    const stats = colorStats[color];
    const average = stats.total / testCount;
    const variance = stats.counts.reduce((sum, count) =>
      sum + Math.pow(count - average, 2), 0) / testCount;
    const stdDev = Math.sqrt(variance);

    console.log(`${color.toUpperCase()}:`);
    console.log(`  Average: ${average.toFixed(2)} tiles`);
    console.log(`  Range: ${stats.min} - ${stats.max} tiles`);
    console.log(`  Standard Deviation: ${stdDev.toFixed(2)} tiles`);
    console.log(`  Distribution: ${stats.counts.join(", ")}`);
    console.log();
  }

  // Calculate overall statistics
  const allCounts: number[] = [];
  for (const color of colors) {
    allCounts.push(...colorStats[color].counts);
  }

  const overallAverage = allCounts.reduce((sum, count) => sum + count, 0) /
    allCounts.length;
  const overallVariance = allCounts.reduce(
    (sum, count) => sum + Math.pow(count - overallAverage, 2),
    0,
  ) / allCounts.length;
  const overallStdDev = Math.sqrt(overallVariance);

  console.log("=== Overall Statistics ===");
  console.log(
    `Total sea tiles across all colors: ${
      allCounts.reduce((sum, count) => sum + count, 0)
    }`,
  );
  console.log(`Overall average per color: ${overallAverage.toFixed(2)} tiles`);
  console.log(`Overall standard deviation: ${overallStdDev.toFixed(2)} tiles`);

  // Check for imbalance
  const maxDifference =
    Math.max(...colors.map((color) => colorStats[color].max)) -
    Math.min(...colors.map((color) => colorStats[color].min));
  console.log(
    `\nMaximum difference between color counts: ${maxDifference} tiles`,
  );

  if (maxDifference > 8) {
    console.log("⚠️  WARNING: Significant color imbalance detected!");
  } else if (maxDifference > 5) {
    console.log("ℹ️  NOTE: Moderate color imbalance present.");
  } else {
    // console.log("✅ Color distribution appears reasonably balanced.");
  }
}

// Run the analysis
analyzeSeaColorDistribution();
