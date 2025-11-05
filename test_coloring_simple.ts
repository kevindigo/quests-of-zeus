#!/usr/bin/env -S deno run -A

import { HexMap } from "./src/hexmap.ts";

// Create a new map and test the constraint-based coloring
console.log("Testing constraint-based sea coloring...\n");

const map = new HexMap();
const grid = map.getGrid();

// Count adjacent same-color sea hexes
function countAdjacentSameColorSeaHexes(map: HexMap, grid: any[][]): number {
  let conflicts = 0;
  const processedPairs = new Set<string>();

  for (let arrayQ = 0; arrayQ < grid.length; arrayQ++) {
    const row = grid[arrayQ];
    if (row) {
      for (let arrayR = 0; arrayR < row.length; arrayR++) {
        const cell = row[arrayR];
        if (cell && cell.terrain === "sea" && cell.color !== "none") {
          const neighbors = map.getNeighbors(cell.q, cell.r);

          for (const neighbor of neighbors) {
            if (neighbor.terrain === "sea" && neighbor.color !== "none") {
              // Create a unique key for this pair to avoid double counting
              const pairKey = getPairKey(cell, neighbor);

              if (
                !processedPairs.has(pairKey) && cell.color === neighbor.color
              ) {
                conflicts++;
                processedPairs.add(pairKey);
              }
            }
          }
        }
      }
    }
  }

  return conflicts;
}

function getPairKey(cell1: any, cell2: any): string {
  const [minQ, maxQ] = [Math.min(cell1.q, cell2.q), Math.max(cell1.q, cell2.q)];
  const [minR, maxR] = [Math.min(cell1.r, cell2.r), Math.max(cell1.r, cell2.r)];
  return `${minQ},${minR}-${maxQ},${maxR}`;
}

const conflicts = countAdjacentSameColorSeaHexes(map, grid);
console.log(`Same-color sea hex adjacencies: ${conflicts}`);

if (conflicts === 0) {
  console.log("✅ PERFECT: No same-color adjacencies!");
} else if (conflicts <= 2) {
  console.log("✅ EXCELLENT: Minimal same-color adjacencies!");
} else if (conflicts <= 5) {
  console.log("✅ GOOD: Constraint-based coloring is working effectively!");
} else {
  console.log("⚠️  ACCEPTABLE: Some same-color adjacencies remain.");
}
