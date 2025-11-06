// Minimal test to isolate movement issue
import { OracleGameEngine } from "./src/game-engine.ts";

console.log("=== Minimal Movement Test ===\n");

const engine = new OracleGameEngine();
engine.initializeGame();

const player = engine.getCurrentPlayer();

console.log("Initial state:");
console.log("  Ship position:", player.shipPosition);
console.log("  Phase:", engine.getGameState().phase);

// Roll dice
const dice = engine.rollOracleDice(player.id);
console.log("\nAfter rolling dice:");
console.log("  Dice:", dice);
console.log("  Player dice:", player.oracleDice);
console.log("  Phase:", engine.getGameState().phase);

// Get available moves
const availableMoves = engine.getAvailableMoves(player.id);
console.log("\nAvailable moves:", availableMoves.length);

if (availableMoves.length === 0) {
  console.log("No available moves - this might be the issue!");
  console.log("Let's check why...");
  
  // Check reachable tiles
  const reachableTiles = (engine as any).getReachableSeaTiles(player.shipPosition.q, player.shipPosition.r, 3);
  console.log("Reachable sea tiles:", reachableTiles.length);
  
  // Check if there are any sea tiles adjacent to starting position
  const adjacentCells = engine.getGameState().map.getNeighbors(player.shipPosition.q, player.shipPosition.r);
  const adjacentSeaCells = adjacentCells.filter(cell => cell.terrain === "sea");
  console.log("Adjacent sea cells:", adjacentSeaCells.length);
  
  if (adjacentSeaCells.length > 0) {
    console.log("Adjacent sea cells found but no available moves - this suggests a dice color mismatch");
    adjacentSeaCells.forEach(cell => {
      console.log(`  Sea cell (${cell.q}, ${cell.r}) color: ${cell.color}`);
    });
    console.log("Player dice colors:", player.oracleDice);
  }
} else {
  const firstMove = availableMoves[0];
  console.log("\nFirst available move:", firstMove);
  
  // Try to move
  console.log("\nAttempting movement...");
  const success = engine.moveShip(player.id, firstMove.q, firstMove.r, firstMove.dieColor);
  console.log("Movement success:", success);
  
  if (success) {
    console.log("Movement successful!");
    console.log("New ship position:", player.shipPosition);
    console.log("Remaining dice:", player.oracleDice);
  } else {
    console.log("Movement failed!");
  }
}

console.log("\n=== Test Complete ===");