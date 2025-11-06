// Simple debug script for movement
import { OracleGameEngine } from "./src/game-engine.ts";

console.log("=== Simple Movement Debug ===\n");

const engine = new OracleGameEngine();
engine.initializeGame();

const player = engine.getCurrentPlayer();

console.log("Initial ship position:", player.shipPosition);

// Roll dice
const dice = engine.rollOracleDice(player.id);
console.log("Rolled dice:", dice);

// Get available moves
const availableMoves = engine.getAvailableMoves(player.id);
console.log("Available moves:", availableMoves.length);

if (availableMoves.length > 0) {
  const firstMove = availableMoves[0];
  console.log("\nFirst available move:", firstMove);
  
  // Try to move
  console.log("\nAttempting movement...");
  const success = engine.moveShip(player.id, firstMove.q, firstMove.r, firstMove.dieColor);
  console.log("Movement success:", success);
  
  if (success) {
    console.log("New ship position:", player.shipPosition);
    console.log("Remaining dice:", player.oracleDice);
  } else {
    console.log("Movement failed!");
  }
} else {
  console.log("No available moves");
}

console.log("\n=== Debug Complete ===");