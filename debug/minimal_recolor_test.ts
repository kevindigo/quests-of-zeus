// Minimal test to debug recoloring favor calculation

import { QuestsZeusGameEngine } from "../src/game-engine.ts";
import type { HexColor } from "../src/hexmap.ts";

console.log("=== Minimal Recolor Test ===");

const gameEngine = new QuestsZeusGameEngine();
gameEngine.initializeGame();

const player = gameEngine.getCurrentPlayer();

// Set up deterministic test conditions matching the failing test
player.oracleDice = ["black", "pink", "blue"] as HexColor[];
player.favor = 5;

// Clear any recoloring intentions that might exist from initialization
player.recoloredDice = {};

console.log("Initial state:");
console.log("  Player favor:", player.favor);
console.log("  Oracle dice:", player.oracleDice);
console.log("  Recolored dice:", player.recoloredDice);

// Set a high recoloring cost that would make some moves unaffordable
player.favor = 3; // Reduce favor
const highRecolorSuccess = gameEngine.setRecolorIntention(player.id, "black", 2); // 2 favor recoloring cost

console.log("\nAfter setting high recoloring intention:");
console.log("  Player favor:", player.favor);
console.log("  Recolored dice:", player.recoloredDice);
console.log("  Recoloring success:", highRecolorSuccess);

const movesWithHighRecolor = gameEngine.getAvailableMovesForDie(player.id, "black", player.favor);

console.log("\nAvailable moves for black die with high recoloring:");
console.log("  Total moves:", movesWithHighRecolor.length);

// Debug each move
for (const move of movesWithHighRecolor) {
  const totalCost = move.favorCost + 2; // movement favor + recoloring cost
  const canAfford = totalCost <= player.favor;
  console.log(`\n  Move to (${move.q}, ${move.r}):`);
  console.log(`    Favor cost: ${move.favorCost}`);
  console.log(`    Recoloring cost: 2`);
  console.log(`    Total cost: ${totalCost}`);
  console.log(`    Player favor: ${player.favor}`);
  console.log(`    Can afford: ${canAfford}`);
  
  if (!canAfford) {
    console.log(`    ⚠️  PROBLEM: This move should not be available!`);
  }
}

// Let's also check what sea tile color this move goes to
console.log("\n=== Checking sea tile colors ===");
const gameState = gameEngine.getGameState();
for (const move of movesWithHighRecolor) {
  const cell = gameState.map.getCell(move.q, move.r);
  console.log(`Move to (${move.q}, ${move.r}) goes to sea tile color: ${cell?.color}`);
}