#!/usr/bin/env -S deno run --allow-read

import { HexMap } from './src/hexmap.ts';

function debugCubeDistribution() {
  console.log('Debugging cube distribution...\n');

  const hexMap = new HexMap();
  const cubeCells = hexMap.getCellsByTerrain('cubes');

  console.log(`Found ${cubeCells.length} cube hexes`);

  // Check cube colors
  console.log('\nCube details:');
  cubeCells.forEach((cell, index) => {
    console.log(
      `  Cube ${index + 1}: (${cell.q}, ${cell.r}) - color: "${cell.color}"`,
    );
  });

  // Count colors
  const colorCounts: Record<string, number> = {};
  cubeCells.forEach((cell) => {
    colorCounts[cell.color] = (colorCounts[cell.color] || 0) + 1;
  });

  console.log('\nColor distribution:');
  for (const [color, count] of Object.entries(colorCounts)) {
    console.log(`  ${color}: ${count} cubes`);
  }

  // Check unique colors
  const uniqueColors = new Set(cubeCells.map((cell) => cell.color));
  console.log(
    `\nUnique colors: ${uniqueColors.size} (expected: ${cubeCells.length})`,
  );

  // Check if all cubes have colors
  const cubesWithColors = cubeCells.filter((cell) => cell.color !== 'none');
  console.log(
    `\nCubes with colors: ${cubesWithColors.length} (expected: ${cubeCells.length})`,
  );
}

if (import.meta.main) {
  debugCubeDistribution();
}
