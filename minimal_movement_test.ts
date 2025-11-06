// Minimal test to isolate movement issue
import { OracleGameEngine } from "./src/game-engine.ts";

const engine = new OracleGameEngine();
engine.initializeGame();

const player = engine.getCurrentPlayer();

// Roll dice
const dice = engine.rollOracleDice(player.id);

// Get available moves
const availableMoves = engine.getAvailableMoves(player.id);

if (availableMoves.length === 0) {
  // Check reachable tiles
  const reachableTiles = (engine as any).getReachableSeaTiles(player.shipPosition.q, player.shipPosition.r, 3);
  
  // Check if there are any sea tiles adjacent to starting position
  const adjacentCells = engine.getGameState().map.getNeighbors(player.shipPosition.q, player.shipPosition.r);
  const adjacentSeaCells = adjacentCells.filter(cell => cell.terrain === "sea");
    
  // Try to move
  const success = engine.moveShip(player.id, firstMove.q, firstMove.r, firstMove.dieColor);
  
  if (!success) {
    console.log("Movement failed!");
  }
}
