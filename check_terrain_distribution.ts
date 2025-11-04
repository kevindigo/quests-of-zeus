#!/usr/bin/env -S deno run

import { HexMap } from "./hexmap.ts";

function checkTerrainDistribution() {
  console.log("Checking terrain distribution for 10 generated maps...");
  console.log("Note: 90% of remaining shallows are converted to sea in the final step\n");
  
  for (let i = 0; i < 10; i++) {
    console.log(`=== Map ${i + 1} ===`);
    
    const map = new HexMap();
    const grid = map.getGrid();
    
    const terrainCounts: Record<string, number> = {};
    let totalCells = 0;
    
    // Count all terrain types
    for (let q = 0; q < map.width; q++) {
      for (let r = 0; r < map.height; r++) {
        const cell = grid[q]?.[r];
        if (cell) {
          terrainCounts[cell.terrain] = (terrainCounts[cell.terrain] || 0) + 1;
          totalCells++;
        }
      }
    }
    
    // Check expected counts (after 90% shallows to sea conversion)
    const expectedCounts = {
      "zeus": 1,
      "cubes": 6,
      "temple": 6,
      "foundations": 6,
      "monsters": 9,
      "clouds": 12,
      "city": 6
    };
    
    console.log("Terrain Distribution:");
    for (const [terrain, count] of Object.entries(terrainCounts)) {
      const expected = expectedCounts[terrain as keyof typeof expectedCounts];
      const status = expected !== undefined && count === expected ? "✓" : "✗";
      console.log(`  ${status} ${terrain}: ${count}${expected ? ` (expected: ${expected})` : ''}`);
    }
    
    // Verify that sea tiles outnumber shallow tiles significantly (90% conversion)
    const seaCount = terrainCounts["sea"] || 0;
    const shallowCount = terrainCounts["shallow"] || 0;
    console.log(`  Sea vs Shallows: ${seaCount} sea, ${shallowCount} shallows`);
    
    if (seaCount > shallowCount * 5) { // Sea should be at least 5x more than shallows
      console.log("  ✓ Sea tiles significantly outnumber shallow tiles (90% conversion working)");
    } else {
      console.log("  ✗ Sea tiles should significantly outnumber shallow tiles");
    }
    
    console.log(`  Total cells: ${totalCells}\n`);
    
    // Verify no overlaps in the center 7 hexes
    const centerCell = map.getCell(0, 0);
    const surroundingHexes = [
      [1, 0], [1, -1], [0, -1],
      [-1, 0], [-1, 1], [0, 1]
    ];
    
    let centerValid = true;
    if (centerCell?.terrain !== "zeus") {
      console.log("  ✗ Center cell is not zeus!");
      centerValid = false;
    }
    
    for (const [dq, dr] of surroundingHexes) {
      const cell = map.getCell(dq, dr);
      if (cell?.terrain !== "sea") {
        console.log(`  ✗ Cell (${dq}, ${dr}) is not sea!`);
        centerValid = false;
      }
    }
    
    if (centerValid) {
      console.log("  ✓ Center 7 hexes are correctly placed\n");
    }
  }
}

// Run the check
checkTerrainDistribution();