#!/usr/bin/env -S deno run --allow-read

import { HexMap, HexColor } from "../src/hexmap.ts";

function testCloudColors() {
  console.log("Testing cloud hex color assignment...\n");

  try {
    const hexMap = new HexMap();
    console.log("✓ HexMap created successfully");

    const grid = hexMap.getGrid();
    
    // Find all cloud hexes
    const cloudHexes: { q: number; r: number; color: HexColor }[] = [];
    
    for (let arrayQ = 0; arrayQ < grid.length; arrayQ++) {
      const row = grid[arrayQ];
      if (row) {
        for (let arrayR = 0; arrayR < row.length; arrayR++) {
          const cell = row[arrayR];
          if (cell && cell.terrain === "clouds") {
            cloudHexes.push({
              q: cell.q,
              r: cell.r,
              color: cell.color
            });
          }
        }
      }
    }

    console.log(`Found ${cloudHexes.length} cloud hexes`);
    
    // Count colors
    const colorCounts: Record<HexColor, number> = {
      "none": 0,
      "red": 0,
      "pink": 0,
      "blue": 0,
      "black": 0,
      "green": 0,
      "yellow": 0
    };

    for (const cloudHex of cloudHexes) {
      colorCounts[cloudHex.color]++;
    }

    console.log("\nCloud hex color distribution:");
    for (const [color, count] of Object.entries(colorCounts)) {
      if (color !== "none") {
        console.log(`  ${color}: ${count} cloud hexes`);
      }
    }

    // Verify that we have exactly 12 cloud hexes
    if (cloudHexes.length === 12) {
      console.log("\n✅ Correct number of cloud hexes (12)");
    } else {
      console.log(`\n❌ Expected 12 cloud hexes, found ${cloudHexes.length}`);
    }

    // Verify that each color appears exactly twice (except "none")
    const colorErrors: string[] = [];
    for (const [color, count] of Object.entries(colorCounts)) {
      if (color !== "none" && count !== 2) {
        colorErrors.push(`${color} appears ${count} times (expected 2)`);
      }
    }

    if (colorErrors.length === 0) {
      console.log("✅ Each color appears exactly twice on cloud hexes");
    } else {
      console.log(`\n❌ Color distribution errors:`);
      for (const error of colorErrors) {
        console.log(`  - ${error}`);
      }
    }

    // Verify that no cloud hex has "none" color
    if (colorCounts["none"] === 0) {
      console.log("✅ All cloud hexes have colors assigned");
    } else {
      console.log(`❌ ${colorCounts["none"]} cloud hexes have no color assigned`);
    }

  } catch (error) {
    console.error("❌ Error:", error);
  }
}

if (import.meta.main) {
  testCloudColors();
}