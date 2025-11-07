// Debug script to test ship movement logic
import { OracleGameEngine } from "./src/game-engine.ts";

console.log("=== Testing Ship Movement Logic ===\n");

const engine = new OracleGameEngine();
engine.initializeGame();

const gameState = engine.getGameState();
const player = engine.getCurrentPlayer();

console.log("Initial ship position:", player.shipPosition);

// Check what terrain the ship starts on
const startCell = gameState.map.getCell(
  player.shipPosition.q,
  player.shipPosition.r,
);
console.log("Starting terrain:", startCell?.terrain);

// Get adjacent cells
const adjacentCells = gameState.map.getNeighbors(
  player.shipPosition.q,
  player.shipPosition.r,
);
console.log("\nAdjacent cells:");
adjacentCells.forEach((cell) => {
  console.log(
    `  (${cell.q}, ${cell.r}): ${cell.terrain} ${
      cell.terrain === "sea" ? `(${cell.color})` : ""
    }`,
  );
});

// Roll dice to enter action phase
const dice = engine.rollOracleDice(player.id);
console.log("\nRolled dice:", dice);

// Get available moves
const availableMoves = engine.getAvailableMoves(player.id);
console.log("\nAvailable moves:", availableMoves.length);

// Log all available moves
availableMoves.forEach((move, index) => {
  console.log(
    `  Move ${index + 1}: (${move.q}, ${move.r}) with ${move.dieColor} die`,
  );
});

// Test reachability logic directly
console.log("\n=== Testing Reachability Logic ===");
const reachableTiles = (engine as unknown as {
  getReachableSeaTiles: (
    q: number,
    r: number,
    steps: number,
  ) => Array<{ q: number; r: number; color: string }>;
}).getReachableSeaTiles(player.shipPosition.q, player.shipPosition.r, 3);
console.log("Reachable sea tiles:", reachableTiles.length);
reachableTiles.slice(0, 10).forEach(
  (tile: { q: number; r: number; color: string }, index: number) => {
    console.log(
      `  Tile ${index + 1}: (${tile.q}, ${tile.r}) color ${tile.color}`,
    );
  },
);

// Try to move to first available move if any
if (availableMoves.length > 0) {
  const firstMove = availableMoves[0];
  console.log(`\n=== Testing Movement ===`);
  console.log(
    `Attempting to move to (${firstMove.q}, ${firstMove.r}) with ${firstMove.dieColor} die...`,
  );
  const success = engine.moveShip(
    player.id,
    firstMove.q,
    firstMove.r,
    firstMove.dieColor,
  );
  console.log("Move successful:", success);
  console.log("New ship position:", player.shipPosition);
  console.log("Remaining dice:", player.oracleDice);
} else {
  console.log(
    "\nNo available moves - this might be expected if no dice match adjacent sea colors",
  );
}
