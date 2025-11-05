#!/usr/bin/env -S deno run --allow-read

import { HexMap } from "../hexmap.ts";

// Manual test to verify sea-to-shallows conversion
function manualTest() {
  console.log("=== Manual Sea to Shallows Conversion Test ===\n");
  
  // Create multiple maps to see if we ever get a shallow
  let mapsWithShallows = 0;
  const totalMaps = 10;
  
  for (let i = 0; i < totalMaps; i++) {
    console.log(`\nTesting map ${i + 1}/${totalMaps}...`);
    
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
    
    console.log(`  Shallows: ${shallowCount}, Sea: ${seaCount}`);
    
    if (shallowCount > 0) {
      mapsWithShallows++;
      console.log(`  *** Found ${shallowCount} shallows in this map! ***`);
      
      // Find and analyze the shallow cell
      for (let arrayQ = 0; arrayQ < grid.length; arrayQ++) {
        const row = grid[arrayQ];
        if (row) {
          for (let arrayR = 0; arrayR < row.length; arrayR++) {
            const cell = row[arrayR];
            if (cell && cell.terrain === "shallow") {
              console.log(`\n  Shallow cell found at (${cell.q}, ${cell.r}):`);
              
              // Verify constraints
              const hasZeusNeighbor = hexMap["hasNeighborOfType"](cell, grid, "zeus");
              console.log(`    Has zeus neighbor: ${hasZeusNeighbor} (should be false)`);
              
              const hasCityNeighbor = hexMap["hasNeighborOfType"](cell, grid, "city");
              console.log(`    Has city neighbor: ${hasCityNeighbor} (should be false)`);
              
              const seaNeighbors = hexMap["getNeighborsOfType"](cell, grid, "sea");
              console.log(`    Number of sea neighbors: ${seaNeighbors.length}`);
              
              let atLeastOneCanReachZeus = false;
              for (const seaNeighbor of seaNeighbors) {
                const canReach = hexMap["canReachZeusFromSeaNeighbor"](seaNeighbor, cell, grid);
                console.log(`      Sea neighbor at (${seaNeighbor.q}, ${seaNeighbor.r}) can reach zeus: ${canReach}`);
                if (canReach) {
                  atLeastOneCanReachZeus = true;
                }
              }
              console.log(`    At least one sea neighbor can reach zeus: ${atLeastOneCanReachZeus} (should be true)`);
              
              break;
            }
          }
        }
      }
    }
  }
  
  console.log(`\n=== Summary ===`);
  console.log(`Total maps tested: ${totalMaps}`);
  console.log(`Maps with shallows: ${mapsWithShallows}`);
  console.log(`Success rate: ${(mapsWithShallows / totalMaps * 100).toFixed(1)}%`);
  
  if (mapsWithShallows === 0) {
    console.log("\nNo maps had shallows. The constraints might be too restrictive.");
    console.log("Let's test the constraints on a few sea cells from the last map...");
    
    const hexMap = new HexMap();
    const grid = hexMap.getGrid();
    
    let testedCells = 0;
    for (let arrayQ = 0; arrayQ < grid.length && testedCells < 5; arrayQ++) {
      const row = grid[arrayQ];
      if (row) {
        for (let arrayR = 0; arrayR < row.length && testedCells < 5; arrayR++) {
          const cell = row[arrayR];
          if (cell && cell.terrain === "sea") {
            testedCells++;
            console.log(`\nTesting sea cell at (${cell.q}, ${cell.r}):`);
            
            // Test constraint 1: zeus neighbor
            const hasZeusNeighbor = hexMap["hasNeighborOfType"](cell, grid, "zeus");
            console.log(`  Has zeus neighbor: ${hasZeusNeighbor}`);
            
            // Test constraint 2: city neighbor
            const hasCityNeighbor = hexMap["hasNeighborOfType"](cell, grid, "city");
            console.log(`  Has city neighbor: ${hasCityNeighbor}`);
            
            // Test constraint 3: at least one sea neighbor can reach zeus
            const seaNeighbors = hexMap["getNeighborsOfType"](cell, grid, "sea");
            console.log(`  Number of sea neighbors: ${seaNeighbors.length}`);
            
            let atLeastOneCanReachZeus = false;
            for (const seaNeighbor of seaNeighbors) {
              const canReach = hexMap["canReachZeusFromSeaNeighbor"](seaNeighbor, cell, grid);
              console.log(`    Sea neighbor at (${seaNeighbor.q}, ${seaNeighbor.r}) can reach zeus: ${canReach}`);
              if (canReach) {
                atLeastOneCanReachZeus = true;
              }
            }
            console.log(`  At least one sea neighbor can reach zeus: ${atLeastOneCanReachZeus}`);
            
            const isEligible = !hasZeusNeighbor && !hasCityNeighbor && atLeastOneCanReachZeus;
            console.log(`  Cell is eligible for conversion: ${isEligible}`);
            
            if (isEligible) {
              console.log(`  *** This cell would be converted to shallows! ***`);
            }
          }
        }
      }
    }
  }
}

// Run the manual test
if (import.meta.main) {
  manualTest();
}