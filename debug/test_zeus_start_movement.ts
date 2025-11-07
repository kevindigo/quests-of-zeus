// Test script to verify movement works correctly when starting from Zeus
import { OracleGameEngine } from "../src/game-engine.ts";

console.log("=== Testing Movement from Zeus Starting Position ===\n");

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
console.log("\nAdjacent cells to Zeus:");
adjacentCells.forEach((cell) => {
  console.log(
    `  (${cell.q}, ${cell.r}): ${cell.terrain} ${
      cell.terrain === "sea" ? `(${cell.color})` : ""
    }`,
  );
});

// Test reachability logic directly
console.log("\n=== Testing Reachability from Zeus ===");
const reachableTiles = (engine as any).getReachableSeaTiles(
  player.shipPosition.q,
  player.shipPosition.r,
  3,
);
console.log("Reachable sea tiles from Zeus:", reachableTiles.length);

// Group by steps for debugging
const tilesBySteps: { [steps: number]: any[] } = {};
reachableTiles.forEach((tile) => {
  // For now, we don't track steps in the return value, but we can estimate
  // This is just for debugging
  const distance = (engine as any).hexDistance(
    player.shipPosition.q,
    player.shipPosition.r,
    tile.q,
    tile.r,
  );
  if (!tilesBySteps[distance]) tilesBySteps[distance] = [];
  tilesBySteps[distance].push(tile);
});

Object.keys(tilesBySteps).sort((a, b) => parseInt(a) - parseInt(b)).forEach(
  (steps) => {
    console.log(`\n  Steps ${steps}: ${tilesBySteps[steps].length} tiles`);
    tilesBySteps[steps].slice(0, 5).forEach(
      (tile: { q: number; r: number; color: string }, index: number) => {
        console.log(
          `    Tile ${index + 1}: (${tile.q}, ${tile.r}) color ${tile.color}`,
        );
      },
    );
    if (tilesBySteps[steps].length > 5) {
      console.log(`    ... and ${tilesBySteps[steps].length - 5} more`);
    }
  },
);

// Roll dice to enter action phase
const dice = engine.rollOracleDice(player.id);
console.log("\nRolled dice:", dice);

// Get available moves
const availableMoves = engine.getAvailableMoves(player.id);
console.log("\nAvailable moves from Zeus:", availableMoves.length);

// Log all available moves
availableMoves.forEach((move, index) => {
  console.log(
    `  Move ${index + 1}: (${move.q}, ${move.r}) with ${move.dieColor} die`,
  );
});

// Try to move to first available move if any
if (availableMoves.length > 0) {
  const firstMove = availableMoves[0];
  console.log(`\n=== Testing Movement from Zeus ===`);
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

  if (success) {
    console.log("✓ SUCCESS: Movement from Zeus works correctly!");
    console.log("New ship position:", player.shipPosition);
    console.log("Remaining dice:", player.oracleDice);
  } else {
    console.log("✗ FAILURE: Movement from Zeus failed!");
  }
} else {
  console.log(
    "\nNo available moves from Zeus - this might be expected if no dice match adjacent sea colors",
  );
  console.log(
    "Adjacent sea colors:",
    adjacentCells.filter((c) => c.terrain === "sea").map((c) => c.color),
  );
  console.log("Player dice:", dice);
}
