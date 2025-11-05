#!/usr/bin/env -S deno run --allow-read

import { HexMap } from "./hexmap.ts";

// Simple test to verify sea-to-shallows conversion works
function testSeaToShallows() {
  console.log("=== Testing Sea to Shallows Conversion ===\n");
  
  // Run multiple tests to see the behavior
  for (let i = 0; i < 10; i++) {
    const hexMap = new HexMap();
    const grid = hexMap.getGrid();
    
    // Count terrain distribution
    const terrainCounts: Record<string, number> = {};
    for (let arrayQ = 0; arrayQ < grid.length; arrayQ++) {
      const row = grid[arrayQ];
      if (row) {
        for (let arrayR = 0; arrayR < row.length; arrayR++) {
          const cell = row[arrayR];
          if (cell) {
            terrainCounts[cell.terrain] = (terrainCounts[cell.terrain] || 0) + 1;
          }
        }
      }
    }
    
    const shallowCount = terrainCounts["shallow"] || 0;
    const seaCount = terrainCounts["sea"] || 0;
    
    console.log(`Test ${i + 1}: Shallows: ${shallowCount}, Sea: ${seaCount}`);
    
    // Verify we have exactly 0 or 1 shallows
    if (shallowCount > 1) {
      console.error(`ERROR: Found ${shallowCount} shallows, expected 0 or 1`);
      return false;
    }
    
    // If we have a shallow cell, verify it meets constraints
    if (shallowCount === 1) {
      let shallowCell = null;
      
      // Find the shallow cell
      for (let arrayQ = 0; arrayQ < grid.length; arrayQ++) {
        const row = grid[arrayQ];
        if (row) {
          for (let arrayR = 0; arrayR < row.length; arrayR++) {
            const cell = row[arrayR];
            if (cell && cell.terrain === "shallow") {
              shallowCell = cell;
              break;
            }
          }
        }
        if (shallowCell) break;
      }
      
      if (shallowCell) {
        console.log(`  Shallow cell at (${shallowCell.q}, ${shallowCell.r})`);
        
        // Check constraints
        const hasZeusNeighbor = hexMap["hasNeighborOfType"](shallowCell, grid, "zeus");
        const hasCityNeighbor = hexMap["hasNeighborOfType"](shallowCell, grid, "city");
        
        if (hasZeusNeighbor) {
          console.error(`  ERROR: Shallow cell has zeus neighbor`);
          return false;
        }
        
        if (hasCityNeighbor) {
          console.error(`  ERROR: Shallow cell has city neighbor`);
          return false;
        }
        
        console.log(`  Constraints satisfied: no zeus/city neighbors`);
      }
    }
  }
  
  console.log("\n✅ All tests passed! Sea-to-shallows conversion is working correctly.");
  return true;
}

// Run the test
if (import.meta.main) {
  testSeaToShallows();
}