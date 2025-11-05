#!/usr/bin/env -S deno run --allow-read

// Test script to verify city color assignment

import { generateNewMap, getCurrentMap, ALL_COLORS, COLORS } from "./hexmap.ts";

function testCityColors() {
  console.log("Testing city color assignment...\n");
  
  // Generate a new map
  generateNewMap();
  const gameMap = getCurrentMap();
  const grid = gameMap.getGrid();
  
  // Count cities and their colors
  const cityCells: Array<{q: number, r: number, color: string}> = [];
  
  for (let q = 0; q < grid.length; q++) {
    const row = grid[q] || [];
    for (let r = 0; r < row.length; r++) {
      const cell = row[r];
      if (cell && cell.terrain === "city") {
        cityCells.push({
          q: cell.q,
          r: cell.r,
          color: cell.color
        });
      }
    }
  }
  
  console.log(`Found ${cityCells.length} cities:`);
  
  // Group cities by color
  const colorCounts: Record<string, number> = {};
  const usedColors = new Set<string>();
  
  cityCells.forEach(city => {
    console.log(`  City at (${city.q}, ${city.r}) - Color: ${city.color}`);
    colorCounts[city.color] = (colorCounts[city.color] || 0) + 1;
    usedColors.add(city.color);
  });
  
  console.log("\nColor distribution:");
  Object.entries(colorCounts).forEach(([color, count]) => {
    console.log(`  ${color}: ${count} cities`);
  });
  
  // Verify that we have exactly 6 cities with 6 different colors
  console.log("\nVerification:");
  console.log(`  Total cities: ${cityCells.length} (expected: 6)`);
  console.log(`  Unique colors used: ${usedColors.size} (expected: 6)`);
  console.log(`  All colors from ALL_COLORS used: ${usedColors.size === ALL_COLORS.length}`);
  
  // Check if all colors from ALL_COLORS are used
  const allColorsUsed = ALL_COLORS.every(color => usedColors.has(color));
  console.log(`  All fundamental colors assigned: ${allColorsUsed}`);
  
  if (cityCells.length === 6 && usedColors.size === 6 && allColorsUsed) {
    console.log("\n✅ SUCCESS: All 6 cities have been assigned the 6 different fundamental colors!");
  } else {
    console.log("\n❌ FAILURE: Color assignment did not work as expected.");
  }
}

// Run the test
testCityColors();