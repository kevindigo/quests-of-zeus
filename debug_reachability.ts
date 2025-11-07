// Debug script to test ship reachability logic
import { OracleGameEngine } from "./src/game-engine.ts";

console.log("=== Testing Ship Reachability Logic ===\n");

const engine = new OracleGameEngine();
engine.initializeGame();

const gameState = engine.getGameState();
const player = engine.getCurrentPlayer();

console.log("Initial ship position:", player.shipPosition);

// Check what terrain the ship starts on
const startCell = gameState.map.getCell(player.shipPosition.q, player.shipPosition.r);
console.log("Starting terrain:", startCell?.terrain);

// Get adjacent cells
const adjacentCells = gameState.map.getNeighbors(player.shipPosition.q, player.shipPosition.r);
console.log("\nAdjacent cells:");
adjacentCells.forEach(cell => {
  console.log(`  (${cell.q}, ${cell.r}): ${cell.terrain} ${cell.terrain === 'sea' ? `(${cell.color})` : ''}`);
});

// Test reachability logic directly
console.log("\n=== Testing Reachability Logic ===");
const reachableTiles = (engine as unknown as { getReachableSeaTiles: (q: number, r: number, steps: number) => Array<{ q: number; r: number; color: string }> }).getReachableSeaTiles(player.shipPosition.q, player.shipPosition.r, 3);
console.log("Reachable sea tiles:", reachableTiles.length);

// Group by steps for debugging
const tilesBySteps: { [steps: number]: Array<{ q: number; r: number; color: string }> } = {};
reachableTiles.forEach(tile => {
  // For now, we don't track steps in the return value, but we can estimate
  // This is just for debugging
  const distance = (engine as unknown as { hexDistance: (q1: number, r1: number, q2: number, r2: number) => number }).hexDistance(player.shipPosition.q, player.shipPosition.r, tile.q, tile.r);
  if (!tilesBySteps[distance]) tilesBySteps[distance] = [];
  tilesBySteps[distance].push(tile);
});

Object.keys(tilesBySteps).sort((a, b) => parseInt(a) - parseInt(b)).forEach(steps => {
  console.log(`\n  Steps ${steps}: ${tilesBySteps[steps].length} tiles`);
  tilesBySteps[steps].slice(0, 5).forEach((tile: { q: number; r: number; color: string }, index: number) => {
    console.log(`    Tile ${index + 1}: (${tile.q}, ${tile.r}) color ${tile.color}`);
  });
  if (tilesBySteps[steps].length > 5) {
    console.log(`    ... and ${tilesBySteps[steps].length - 5} more`);
  }
});

// Roll dice to enter action phase
const dice = engine.rollOracleDice(player.id);
console.log("\nRolled dice:", dice);

// Get available moves
const availableMoves = engine.getAvailableMoves(player.id);
console.log("\nAvailable moves:", availableMoves.length);

// Log all available moves
availableMoves.forEach((move, index) => {
  console.log(`  Move ${index + 1}: (${move.q}, ${move.r}) with ${move.dieColor} die`);
});

// Test if any of the reachable tiles match the available moves
console.log("\n=== Matching Reachable Tiles with Available Moves ===");
const reachableTileKeys = new Set(reachableTiles.map(t => `${t.q},${t.r}`));
const availableMoveKeys = new Set(availableMoves.map(m => `${m.q},${m.r}`));

console.log("Reachable tiles that are NOT in available moves:");
reachableTiles.forEach(tile => {
  const key = `${tile.q},${tile.r}`;
  if (!availableMoveKeys.has(key)) {
    console.log(`  (${tile.q}, ${tile.r}) color ${tile.color} - missing from available moves`);
  }
});

console.log("\nAvailable moves that are NOT in reachable tiles:");
availableMoves.forEach(move => {
  const key = `${move.q},${move.r}`;
  if (!reachableTileKeys.has(key)) {
    console.log(`  (${move.q}, ${move.r}) with ${move.dieColor} die - missing from reachable tiles`);
  }
});
