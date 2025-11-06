// Simple test to verify basic movement
import { OracleGameEngine } from "./src/game-engine.ts";

try {
  const engine = new OracleGameEngine();
  engine.initializeGame();
  
  const player = engine.getCurrentPlayer();
  
  // Roll dice
  const dice = engine.rollOracleDice(player.id);
  
  // Get available moves
  const availableMoves = engine.getAvailableMoves(player.id);
  
} catch (error) {
  console.error("Test failed with error:", error);
}