#!/usr/bin/env -S deno run --allow-read

import { HexMap } from "./hexmap.ts";

function testSimpleSeaToShallows() {
  console.log("Testing simple sea-to-shallows conversion...\n");
  
  try {
    const hexMap = new HexMap();
    console.log("✓ HexMap created successfully");
    
    const grid = hexMap.getGrid();
    console.log(`✓ Grid retrieved: ${grid.length} rows`);
    
    // Count terrain types
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
    
    console.log("Terrain distribution:");
    for (const [terrain, count] of Object.entries(terrainCounts)) {
      console.log(`  ${terrain}: ${count}`);
    }
    
    const shallowCount = terrainCounts["shallow"] || 0;
    const seaCount = terrainCounts["sea"] || 0;
    
    console.log(`\nSea-to-shallows conversion check:`);
    console.log(`  Shallows count: ${shallowCount} (should be 0-10)`);
    console.log(`  Sea count: ${seaCount}`);
    
    if (shallowCount <= 10 && shallowCount >= 0) {
      console.log("\n✅ Sea-to-shallows conversion appears to be working!");
    } else {
      console.log("\n❌ Unexpected number of shallows!");
    }
    
  } catch (error) {
    console.error("❌ Error:", error);
  }
}

if (import.meta.main) {
  testSimpleSeaToShallows();
}