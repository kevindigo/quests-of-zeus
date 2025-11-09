#!/usr/bin/env -S deno run --allow-read

import { HexMap } from "./src/hexmap.ts";

function testSeaColors() {
  const map = new HexMap();
  const grid = map.getGrid();

  // Count sea cells with colors
  let seaCellsWithColor = 0;
  let seaCellsWithoutColor = 0;
  
  for (let arrayQ = 0; arrayQ < grid.length; arrayQ++) {
    const row = grid[arrayQ];
    if (row) {
      for (let arrayR = 0; arrayR < row.length; arrayR++) {
        const cell = row[arrayR];
        if (cell && cell.terrain === "sea") {
          if (cell.color !== "none") {
            seaCellsWithColor++;
          } else {
            seaCellsWithoutColor++;
          }
        }
      }
    }
  }

  console.log(`Sea cells with color: ${seaCellsWithColor}`);
  console.log(`Sea cells without color: ${seaCellsWithoutColor}`);
  console.log(`Total sea cells: ${seaCellsWithColor + seaCellsWithoutColor}`);

  // Check if Zeus has sea neighbors
  const zeusCells = map.getCellsByTerrain("zeus");
  if (zeusCells.length > 0) {
    const zeusCell = zeusCells[0];
    console.log(`Zeus at (${zeusCell.q}, ${zeusCell.r})`);
    
    const neighbors = map.getNeighbors(zeusCell.q, zeusCell.r);
    console.log(`Zeus has ${neighbors.length} neighbors:`);
    
    for (const neighbor of neighbors) {
      console.log(`  Neighbor at (${neighbor.q}, ${neighbor.r}): ${neighbor.terrain}, color: ${neighbor.color}`);
    }
  }
}

// Run the test
if (import.meta.main) {
  testSeaColors();
}