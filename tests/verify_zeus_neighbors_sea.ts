#!/usr/bin/env -S deno run --allow-read

import { HexMap } from "../src/hexmap.ts";

// Simple verification that Zeus neighbors are sea
function verifyZeusNeighborsSea() {
  const hexMap = new HexMap();
  const _grid = hexMap.getGrid();

  // Get the Zeus cell
  const zeusCells = hexMap.getCellsByTerrain("zeus");

  if (zeusCells.length !== 1) {
    console.error(`Expected 1 Zeus cell, found ${zeusCells.length}`);
    return;
  }

  const zeusCell = zeusCells[0];

  // Get all neighbors of the Zeus cell
  const zeusNeighbors = hexMap.getNeighbors(zeusCell.q, zeusCell.r);

  let _allNeighborsSea = true;
  for (const neighbor of zeusNeighbors) {
    const isSea = neighbor.terrain === "sea";

    console.log(
      `  (${neighbor.q}, ${neighbor.r}): ${neighbor.terrain} ${
        isSea ? "✅" : "❌"
      }`,
    );

    // All neighbors should be sea
    if (!isSea) {
      allNeighborsSea = false;
    }
  }
}

// Run the verification
if (import.meta.main) {
  verifyZeusNeighborsSea();
}
