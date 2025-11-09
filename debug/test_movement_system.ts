#!/usr/bin/env -S deno run --allow-read

import { HexMap } from "./src/hexmap.ts";
import { MovementSystem } from "./src/movement-system.ts";

function testMovementSystem() {
  const map = new HexMap();
  const movementSystem = new MovementSystem(map);

  // Find Zeus position
  const zeusCells = map.getCellsByTerrain("zeus");
  if (zeusCells.length === 0) {
    console.log("ERROR: No Zeus cell found!");
    return;
  }

  const zeusCell = zeusCells[0];
  console.log(`Zeus at (${zeusCell.q}, ${zeusCell.r})`);

  // Get reachable sea tiles from Zeus
  const reachableTiles = movementSystem.getReachableSeaTiles(zeusCell.q, zeusCell.r, 3);
  console.log(`Found ${reachableTiles.length} reachable sea tiles from Zeus:`);
  
  for (const tile of reachableTiles) {
    console.log(`  Tile at (${tile.q}, ${tile.r}): color ${tile.color}`);
  }

  // Check if there are any sea tiles at all
  const seaCells = map.getCellsByTerrain("sea");
  console.log(`Total sea cells in map: ${seaCells.length}`);

  // Check sea cells with colors
  const seaCellsWithColor = seaCells.filter(cell => cell.color !== "none");
  console.log(`Sea cells with color: ${seaCellsWithColor.length}`);

  // Check Zeus neighbors
  const neighbors = map.getNeighbors(zeusCell.q, zeusCell.r);
  console.log(`Zeus neighbors: ${neighbors.length}`);
  
  for (const neighbor of neighbors) {
    console.log(`  Neighbor at (${neighbor.q}, ${neighbor.r}): ${neighbor.terrain}, color: ${neighbor.color}`);
  }
}

// Run the test
if (import.meta.main) {
  testMovementSystem();
}