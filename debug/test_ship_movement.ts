// Simple test for ship movement logic
import { OracleGameEngine } from "../src/game-engine.ts";

const engine = new OracleGameEngine();
engine.initializeGame();

const _gameState = engine.getGameState();
const player = engine.getCurrentPlayer();

console.log("Initial ship position:", player.shipPosition);

// Roll dice to enter action phase
const dice = engine.rollOracleDice(player.id);
console.log("Rolled dice:", dice);

// Get available moves
const availableMoves = engine.getAvailableMoves(player.id);
console.log("Available moves:", availableMoves.length);

// Log some available moves
availableMoves.slice(0, 5).forEach((move, index) => {
  console.log(`Move ${index + 1}: (${move.q}, ${move.r}) with ${move.dieColor} die`);
});

// Try to move to first available move if any
if (availableMoves.length > 0) {
  const firstMove = availableMoves[0];
  console.log(`\nAttempting to move to (${firstMove.q}, ${firstMove.r}) with ${firstMove.dieColor} die...`);
  const success = engine.moveShip(player.id, firstMove.q, firstMove.r, firstMove.dieColor);
  console.log("Move successful:", success);
  console.log("New ship position:", player.shipPosition);
  console.log("Remaining dice:", player.oracleDice);
}