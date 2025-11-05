#!/usr/bin/env -S deno run --allow-read

import { HexMap } from "./hexmap.ts";

function testCityNeighborsSimple() {
  console.log("Testing city neighbor sea placement (simple test)...\n");
  
  try {
    // Create a hex map
    const hexMap = new HexMap();
    console.log("✓ HexMap created successfully");
    
    // Get the grid
    const grid = hexMap.getGrid();
    console.log(`✓ Grid retrieved: ${grid.length} rows`);
    
    // Count cities
    const cityCells: any[] = [];
    for (let arrayQ = 0; arrayQ < grid.length; arrayQ++) {
      const row = grid[arrayQ];
      if (row) {
        for (let arrayR = 0; arrayR < row.length; arrayR++) {
          const cell = row[arrayR];
          if (cell && cell.terrain === "city") {
            cityCells.push(cell);
          }
        }
      }
    }
    
    console.log(`✓ Found ${cityCells.length} cities`);
    
    // Check if cities have sea neighbors
    let citiesWithSeaNeighbors = 0;
    for (const cityCell of cityCells) {
      const neighbors = hexMap.getNeighbors(cityCell.q, cityCell.r);
      const seaNeighbors = neighbors.filter(neighbor => neighbor.terrain === "sea");
      
      if (seaNeighbors.length > 0) {
        citiesWithSeaNeighbors++;
        console.log(`  - City at (${cityCell.q}, ${cityCell.r}): ${seaNeighbors.length} sea neighbors`);
      }
    }
    
    console.log(`\nSummary:`);
    console.log(`- Total cities: ${cityCells.length}`);
    console.log(`- Cities with sea neighbors: ${citiesWithSeaNeighbors}`);
    
    if (citiesWithSeaNeighbors > 0) {
      console.log("\n✅ SUCCESS: At least some cities have sea neighbors!");
      console.log("This indicates that the setRandomNeighborsToSea feature is working.");
    } else {
      console.log("\n❌ FAILURE: No cities have sea neighbors!");
      console.log("This suggests the setRandomNeighborsToSea feature may not be working correctly.");
    }
    
  } catch (error) {
    console.error("❌ Error during test:", error);
  }
}

if (import.meta.main) {
  testCityNeighborsSimple();
}