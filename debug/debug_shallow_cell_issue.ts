// Debug script to investigate the shallow cell constraint issue at (3, 0)

import { HexMap } from "../src/hexmap.ts";

console.log("=== Debugging Shallow Cell Constraint Issue ===\n");

// Create a new map
const hexMap = new HexMap();
const grid = hexMap.getGrid();

// Find the shallow cell at (3, 0)
const targetCell = hexMap.getCell(3, 0);

if (!targetCell) {
  console.log("ERROR: Cell (3, 0) not found!");
  Deno.exit(1);
}

console.log(`Target cell: (${targetCell.q}, ${targetCell.r}) - terrain: ${targetCell.terrain}`);

// Check if it's actually a shallow cell
if (targetCell.terrain !== "shallow") {
  console.log(`ERROR: Cell (3, 0) is not shallow, it's ${targetCell.terrain}`);
  Deno.exit(1);
}

console.log("\n--- Checking Constraints for Cell (3, 0) ---");

// Constraint 1: Should not have zeus as neighbor
const hasZeusNeighbor = hexMap.hasNeighborOfType(targetCell, grid, "zeus");
console.log(`1. Has zeus neighbor: ${hasZeusNeighbor} (should be false)`);

// Constraint 2: Should not have city as neighbor
const hasCityNeighbor = hexMap.hasNeighborOfType(targetCell, grid, "city");
console.log(`2. Has city neighbor: ${hasCityNeighbor} (should be false)`);

// Constraint 3: Check all neighbors
console.log("\n3. Checking all neighbors:");
const allNeighbors = hexMap.getNeighbors(targetCell.q, targetCell.r);
let allConstraintsSatisfied = true;

for (const neighbor of allNeighbors) {
  console.log(`   Neighbor (${neighbor.q}, ${neighbor.r}): terrain = ${neighbor.terrain}, color = ${neighbor.color}`);
  
  if (neighbor.terrain === "sea") {
    // For sea neighbors: check if they can reach zeus
    const canReachZeus = hexMap.canReachZeus(neighbor, grid);
    console.log(`     - Sea neighbor can reach zeus: ${canReachZeus} (should be true)`);
    if (!canReachZeus) {
      allConstraintsSatisfied = false;
      console.log(`     - FAIL: Sea neighbor cannot reach zeus!`);
    }
  } else if (neighbor.terrain !== "shallow") {
    // For land neighbors (not sea or shallows): check if they have at least one sea neighbor
    const hasSeaNeighbor = hexMap.hasNeighborOfType(neighbor, grid, "sea");
    console.log(`     - Land neighbor has sea neighbor: ${hasSeaNeighbor} (should be true)`);
    if (!hasSeaNeighbor) {
      allConstraintsSatisfied = false;
      console.log(`     - FAIL: Land neighbor has no sea neighbors!`);
    }
  } else {
    console.log(`     - Shallow neighbor: no additional checks needed`);
  }
}

console.log(`\nAll constraints satisfied: ${allConstraintsSatisfied}`);

// Let's also check the specific pathfinding for sea neighbors
console.log("\n--- Detailed Pathfinding Analysis ---");
for (const neighbor of allNeighbors) {
  if (neighbor.terrain === "sea") {
    console.log(`\nSea neighbor at (${neighbor.q}, ${neighbor.r}):`);
    
    // Check if it can reach zeus normally
    const normalReach = hexMap.canReachZeus(neighbor, grid);
    console.log(`   Normal canReachZeus: ${normalReach}`);
    
    // Check if it can reach zeus when (3, 0) is excluded
    const reachWithoutCandidate = hexMap.canReachZeusFromSeaNeighbor(neighbor, targetCell, grid);
    console.log(`   canReachZeusFromSeaNeighbor (excluding (3,0)): ${reachWithoutCandidate}`);
    
    if (!reachWithoutCandidate) {
      console.log(`   FAIL: This sea neighbor cannot reach zeus if (3,0) becomes shallow!`);
    }
  }
}

console.log("\n=== Debug Complete ===");