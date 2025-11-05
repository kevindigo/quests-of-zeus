#!/usr/bin/env -S deno run --allow-read

import { HexMap } from "./hexmap.ts";

function testTerrainDistribution() {
  console.log("Testing terrain distribution...\n");
  
  try {
    const hexMap = new HexMap();
    console.log("✓ HexMap created successfully");
    
    const grid = hexMap.getGrid();
    console.log(`✓ Grid retrieved: ${grid.length} rows`);
    
    // Count terrain types
    const terrainCounts: Record<string, number> = {};
    let totalCells = 0;
    
    for (let arrayQ = 0; arrayQ < grid.length; arrayQ++) {
      const row = grid[arrayQ];
      if (row) {
        for (let arrayR = 0; arrayR < row.length; arrayR++) {
          const cell = row[arrayR];
          if (cell) {
            terrainCounts[cell.terrain] = (terrainCounts[cell.terrain] || 0) + 1;
            totalCells++;
          }
        }
      }
    }
    
    console.log("Terrain distribution:");
    for (const [terrain, count] of Object.entries(terrainCounts)) {
      const percentage = ((count / totalCells) * 100).toFixed(1);
      console.log(`  ${terrain}: ${count} cells (${percentage}%)`);
    }
    
    console.log(`\nTotal cells: ${totalCells}`);
    
    // Check if all expected terrain types are present
    const expectedTerrains = ["zeus", "sea", "shallow", "monsters", "cubes", "temple", "clouds", "city", "foundations"];
    const missingTerrains = expectedTerrains.filter(terrain => !terrainCounts[terrain] || terrainCounts[terrain] === 0);
    
    if (missingTerrains.length === 0) {
      console.log("\n✅ All expected terrain types are present!");
    } else {
      console.log(`\n❌ Missing terrain types: ${missingTerrains.join(", ")}`);
    }
    
    // Check specific constraints
    const shallowCount = terrainCounts["shallow"] || 0;
    const seaCount = terrainCounts["sea"] || 0;
    
    console.log(`\nConstraint checks:`);
    console.log(`  Shallows: ${shallowCount} (should be 0-10 after sea-to-shallows conversion)`);
    console.log(`  Sea: ${seaCount} (should be significant after 100% conversion)`);
    
    if (shallowCount <= 10 && seaCount > 20) {
      console.log("\n✅ Terrain constraints appear to be satisfied!");
    } else {
      console.log("\n⚠️  Some terrain constraints may not be met");
    }
    
  } catch (error) {
    console.error("❌ Error:", error);
  }
}

if (import.meta.main) {
  testTerrainDistribution();
}