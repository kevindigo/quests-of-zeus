// Simple test to verify basic movement
import { OracleGameEngine } from "./src/game-engine.ts";

console.log("=== Simple Movement Test ===\n");

try {
  const engine = new OracleGameEngine();
  engine.initializeGame();
  
  const player = engine.getCurrentPlayer();
  console.log("Game initialized successfully");
  console.log("Player ship position:", player.shipPosition);
  
  // Roll dice
  const dice = engine.rollOracleDice(player.id);
  console.log("Dice rolled:", dice);
  
  // Get available moves
  const availableMoves = engine.getAvailableMoves(player.id);
  console.log("Available moves:", availableMoves.length);
  
  if (availableMoves.length > 0) {
    console.log("Movement system is working!");
  } else {
    console.log("No available moves - this might be expected in some map configurations");
  }
  
  console.log("\n=== Test Complete ===");
} catch (error) {
  console.error("Test failed with error:", error);
}