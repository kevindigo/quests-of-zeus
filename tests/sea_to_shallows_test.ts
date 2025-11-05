#!/usr/bin/env -S deno run --allow-read

import { assertEquals } from "@std/assert";
import { type HexCell, HexMap } from "../src/hexmap.ts";

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
  
  // After sea-to-shallows conversion, we should have between 0 and 10 shallows
  // (we make 10 attempts on random sea hexes)
  assertEquals(shallowCount <= 10, true, "Should have between 0 and 10 shallows after sea-to-shallows conversion");
  
  // If there are shallow cells, verify they all meet the constraints
  if (shallowCount > 0) {
    const shallowCells: HexCell[] = [];
    
    // Find all shallow cells
    for (let arrayQ = 0; arrayQ < grid.length; arrayQ++) {
      const row = grid[arrayQ];
      if (row) {
        for (let arrayR = 0; arrayR < row.length; arrayR++) {
          const cell = row[arrayR];
          if (cell && cell.terrain === "shallow") {
            shallowCells.push(cell);
          }
        }
      }
    }
    
    console.log(`Found ${shallowCells.length} shallow cells`);
    
    // Verify each shallow cell meets the constraints
    for (const shallowCell of shallowCells) {
      console.log(`Verifying shallow cell at (${shallowCell.q}, ${shallowCell.r})`);
      
      // 1. Should not have zeus as neighbor
      const hasZeusNeighbor = hexMap["hasNeighborOfType"](shallowCell, grid, "zeus");
      assertEquals(hasZeusNeighbor, false, `Shallow cell at (${shallowCell.q}, ${shallowCell.r}) should not have zeus neighbor`);
      
      // 2. Should not have city as neighbor
      const hasCityNeighbor = hexMap["hasNeighborOfType"](shallowCell, grid, "city");
      assertEquals(hasCityNeighbor, false, `Shallow cell at (${shallowCell.q}, ${shallowCell.r}) should not have city neighbor`);
      
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
      
      assertEquals(allCanReachZeus, true, `All sea neighbors of shallow cell at (${shallowCell.q}, ${shallowCell.r}) should be able to reach zeus`);
      
      console.log(`All constraints satisfied for shallow cell at (${shallowCell.q}, ${shallowCell.r})!`);
    }
  } else {
    console.log("No shallow cells were converted (all constraints were too restrictive)");
  }
});