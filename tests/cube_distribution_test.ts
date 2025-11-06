#!/usr/bin/env -S deno run --allow-read

import { HexMap, ALL_COLORS } from "../src/hexmap.ts";

function testCubeDistribution() {
  console.log("Testing cube distribution...\n");

  try {
    const hexMap = new HexMap();
    console.log("✓ HexMap created successfully");

    const grid = hexMap.getGrid();
    console.log(`✓ Grid retrieved: ${grid.length} rows`);

    // Count cube hexes
    const cubeCells = hexMap.getCellsByTerrain("cubes");
    console.log(`✓ Found ${cubeCells.length} cube hexes`);

    // Check if cube hexes have colors assigned
    const coloredCubes = cubeCells.filter(cell => cell.color !== "none");
    console.log(`✓ ${coloredCubes.length} cube hexes have colors assigned`);

    // Check color distribution
    const colorCounts: Record<string, number> = {};
    cubeCells.forEach(cell => {
      colorCounts[cell.color] = (colorCounts[cell.color] || 0) + 1;
    });

    console.log("\nCube color distribution:");
    for (const [color, count] of Object.entries(colorCounts)) {
      console.log(`  ${color}: ${count} cubes`);
    }

    // Check if all 6 cube hexes exist
    if (cubeCells.length === 6) {
      console.log("\n✅ Correct number of cube hexes (6)");
    } else {
      console.log(`\n❌ Expected 6 cube hexes, found ${cubeCells.length}`);
    }

    // Check if all cube hexes have unique colors (no duplicates)
    const uniqueColors = new Set(cubeCells.map(cell => cell.color));
    if (uniqueColors.size === cubeCells.length) {
      console.log("✅ All cube hexes have unique colors");
    } else {
      console.log(`❌ Some cube hexes share colors (${uniqueColors.size} unique colors for ${cubeCells.length} cubes)`);
    }

    // Check if all colors are from the valid color set
    const validColors = new Set([...ALL_COLORS, "none"]);
    const invalidColors = cubeCells.filter(cell => !validColors.has(cell.color));
    if (invalidColors.length === 0) {
      console.log("✅ All cube colors are valid");
    } else {
      console.log(`❌ Found ${invalidColors.length} cubes with invalid colors`);
    }

  } catch (error) {
    console.error("❌ Error:", error);
  }
}

if (import.meta.main) {
  testCubeDistribution();
}