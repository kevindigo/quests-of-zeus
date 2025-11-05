#!/usr/bin/env -S deno run --allow-read

import { HexMap } from "../src/hexmap.ts";

function testTempleColors() {
  console.log("Testing temple color assignment...\n");

  try {
    const hexMap = new HexMap();
    console.log("✓ HexMap created successfully");

    const grid = hexMap.getGrid();
    console.log(`✓ Grid retrieved: ${grid.length} rows`);

    // Find all temple cells
    const templeCells: any[] = [];
    const templeColors = new Set<string>();

    for (let arrayQ = 0; arrayQ < grid.length; arrayQ++) {
      const row = grid[arrayQ];
      if (row) {
        for (let arrayR = 0; arrayR < row.length; arrayR++) {
          const cell = row[arrayR];
          if (cell && cell.terrain === "temple") {
            templeCells.push(cell);
            if (cell.color !== "none") {
              templeColors.add(cell.color);
            }
          }
        }
      }
    }

    console.log(`Found ${templeCells.length} temple cells`);

    // Check if temples have colors assigned
    const coloredTemples = templeCells.filter((cell) => cell.color !== "none");
    console.log(`Temples with colors: ${coloredTemples.length}`);

    // Show individual temple colors
    console.log("\nTemple colors:");
    templeCells.forEach((cell, index) => {
      console.log(
        `  Temple ${index + 1}: ${cell.color} at (${cell.q}, ${cell.r})`,
      );
    });

    // Check if we have the expected number of unique colors
    console.log(`\nUnique temple colors: ${templeColors.size}`);
    console.log(`Available colors: ${Array.from(templeColors).join(", ")}`);

    // Verify results
    if (templeCells.length === 6) {
      console.log("\n✅ Correct number of temples (6)");
    } else {
      console.log(`\n❌ Expected 6 temples, found ${templeCells.length}`);
    }

    if (coloredTemples.length === 6) {
      console.log("✅ All temples have colors assigned");
    } else {
      console.log(
        `❌ Expected all 6 temples to have colors, but ${coloredTemples.length} have colors`,
      );
    }

    if (templeColors.size >= 1) {
      console.log(
        "✅ Temples have colored outlines (at least one unique color)",
      );
    } else {
      console.log("❌ No temple colors found - outlines may not be visible");
    }

    // Check that no two temples share the same coordinates
    const coordinateSet = new Set<string>();
    const duplicateCoordinates = new Set<string>();

    templeCells.forEach((cell) => {
      const coord = `${cell.q},${cell.r}`;
      if (coordinateSet.has(coord)) {
        duplicateCoordinates.add(coord);
      }
      coordinateSet.add(coord);
    });

    if (duplicateCoordinates.size === 0) {
      console.log("✅ All temples have unique coordinates");
    } else {
      console.log(
        `❌ Found duplicate temple coordinates: ${
          Array.from(duplicateCoordinates).join(", ")
        }`,
      );
    }
  } catch (error) {
    console.error("❌ Error:", error);
  }
}

if (import.meta.main) {
  testTempleColors();
}
