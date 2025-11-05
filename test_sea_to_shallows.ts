#!/usr/bin/env -S deno run --allow-read

import { assertEquals } from "@std/assert";
import { type HexCell, HexMap } from "./hexmap.ts";

// Test the sea-to-shallows conversion functionality
Deno.test("Sea to shallows conversion - basic functionality", () => {
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
  
  console.log(`Terrain distribution after sea-to-shallows conversion:`);
  console.log(`  Shallows: ${shallowCount}`);
  console.log(`  Sea: ${seaCount}`);
  
  // After sea-to-shallows conversion, we should have exactly 0 or 1 shallows
  // (we pick ONE random sea hex and either convert it or not)
  assertEquals(shallowCount <= 1, true, "Should have 0 or 1 shallows after sea-to-shallows conversion");
  
  // If there is a shallow cell, verify it meets the constraints
  if (shallowCount === 1) {
    let shallowCell: HexCell | null = null;
    
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
      console.log(`Found shallow cell at (${shallowCell.q}, ${shallowCell.r})`);
      
      // 1. Should not have zeus as neighbor
      const hasZeusNeighbor = hexMap["hasNeighborOfType"](shallowCell, grid, "zeus");
      assertEquals(hasZeusNeighbor, false, "Shallow cell should not have zeus neighbor");
      
      // 2. Should not have city as neighbor
      const hasCityNeighbor = hexMap["hasNeighborOfType"](shallowCell, grid, "city");
      assertEquals(hasCityNeighbor, false, "Shallow cell should not have city neighbor");
      
      // 3. All sea neighbors should be able to reach zeus
      const seaNeighbors = hexMap["getNeighborsOfType"](shallowCell, grid, "sea");
      let allCanReachZeus = true;
      
      for (const seaNeighbor of seaNeighbors) {
        if (!hexMap["canReachZeus"](seaNeighbor, grid)) {
          allCanReachZeus = false;
          console.log(`Sea neighbor at (${seaNeighbor.q}, ${seaNeighbor.r}) cannot reach zeus`);
          break;
        }
      }
      
      assertEquals(allCanReachZeus, true, "All sea neighbors of shallow cell should be able to reach zeus");
      
      console.log("All constraints satisfied for the shallow cell!");
    }
  } else {
    console.log("No shallow cell was converted (all constraints were too restrictive)");
  }
});

// Run the test
if (import.meta.main) {
  Deno.test({
    name: "Sea to shallows conversion test",
    fn: async () => {
      await Deno.runTests();
    },
  });
}