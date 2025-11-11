// Test script to reproduce the turn ending bug
// This script will test various movement scenarios to identify when turns end incorrectly

import { QuestsZeusGameEngine } from "../src/game-engine.ts";

console.log("=== Testing Turn Ending Bug ===\n");

// Initialize the game
const gameEngine = new QuestsZeusGameEngine();
const gameState = gameEngine.initializeGame();

// Get the first player
const player1 = gameEngine.getCurrentPlayer();
console.log(`Current player: ${player1.name} (ID: ${player1.id})`);
console.log(
  `Player position: (${player1.shipPosition.q}, ${player1.shipPosition.r})`,
);
console.log(`Player favor: ${player1.favor}`);
console.log(`Player dice: ${player1.oracleDice.join(", ")}`);

// Test 1: Try to move to an invalid hex (should not end turn)
console.log("\n--- Test 1: Invalid move (should NOT end turn) ---");
const invalidMoveResult = gameEngine.moveShip(
  player1.id,
  100,
  100,
  player1.oracleDice[0],
);
console.log(`Invalid move result:`, invalidMoveResult);
console.log(
  `Current player after invalid move: ${gameEngine.getCurrentPlayer().name}`,
);

// Test 2: Try to move with wrong die color (should not end turn)
console.log("\n--- Test 2: Wrong die color (should NOT end turn) ---");
// Find a sea hex that's not the color of any of the player's dice
const seaHexes = gameState.map.getCellsByTerrain("sea");
const wrongColorHex = seaHexes.find((hex) =>
  hex.color !== "none" &&
  !player1.oracleDice.includes(hex.color)
);

if (wrongColorHex) {
  console.log(
    `Attempting move to (${wrongColorHex.q}, ${wrongColorHex.r}) with wrong die color`,
  );
  const wrongColorMoveResult = gameEngine.moveShip(
    player1.id,
    wrongColorHex.q,
    wrongColorHex.r,
    player1.oracleDice[0],
  );
  console.log(`Wrong color move result:`, wrongColorMoveResult);
  console.log(
    `Current player after wrong color move: ${gameEngine.getCurrentPlayer().name}`,
  );
} else {
  console.log("Could not find a sea hex with wrong color for testing");
}

// Test 3: Try a valid move (should end turn)
console.log("\n--- Test 3: Valid move (should end turn) ---");
// Find a valid move
const validMoves = gameEngine.getAvailableMoves(player1.id);
if (validMoves.length > 0) {
  const validMove = validMoves[0];
  console.log(
    `Attempting valid move to (${validMove.q}, ${validMove.r}) with die ${validMove.dieColor}`,
  );
  const validMoveResult = gameEngine.moveShip(
    player1.id,
    validMove.q,
    validMove.r,
    validMove.dieColor,
  );
  console.log(`Valid move result:`, validMoveResult);
  console.log(
    `Current player after valid move: ${gameEngine.getCurrentPlayer().name}`,
  );
} else {
  console.log("No valid moves available for testing");
}

console.log("\n=== Turn Ending Bug Test Complete ===");
