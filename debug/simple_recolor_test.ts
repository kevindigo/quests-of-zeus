// Simple test to verify recoloring cost calculation

import { QuestsZeusGameEngine } from "../src/game-engine.ts";

console.log("=== Simple Recolor Test ===");

const gameEngine = new QuestsZeusGameEngine();
gameEngine.initializeGame();

const player = gameEngine.getCurrentPlayer();

// Set up deterministic test conditions
player.oracleDice = ["black", "pink", "blue"];
player.favor = 3;

// Clear any recoloring intentions that might exist from initialization
player.recoloredDice = {};

console.log("Initial state:");
console.log("  Player favor:", player.favor);
console.log("  Oracle dice:", player.oracleDice);
console.log("  Recolored dice:", player.recoloredDice);

// Set a high recoloring cost that would make some moves unaffordable
const highRecolorSuccess = gameEngine.setRecolorIntention(player.id, "black", 2); // 2 favor recoloring cost

console.log("\nAfter setting high recoloring intention:");
console.log("  Player favor:", player.favor);
console.log("  Recolored dice:", player.recoloredDice);
console.log("  Recoloring success:", highRecolorSuccess);

// Test the new getAvailableMovesForDie method
const movesForBlack = gameEngine.getAvailableMovesForDie(player.id, "black", player.favor);

console.log("\nAvailable moves for black die with recoloring:");
console.log("  Total moves:", movesForBlack.length);

// Debug each move
for (const move of movesForBlack) {
  const totalCost = move.favorCost + 2; // movement favor + recoloring cost
  const canAfford = totalCost <= player.favor;
  
  console.log(`\n  Move to (${move.q}, ${move.r}):`);
  console.log(`    Movement favor cost: ${move.favorCost}`);
  console.log(`    Recoloring cost: 2`);
  console.log(`    Total cost: ${totalCost}`);
  console.log(`    Player favor: ${player.favor}`);
  console.log(`    Affordable: ${canAfford}`);
  
  if (!canAfford) {
    console.log(`    ⚠️  BUG: This move should NOT be available!`);
    console.log(`    Expected: ${totalCost} > ${player.favor} (false)`);
    console.log(`    Actual: ${totalCost} <= ${player.favor} (${canAfford})`);
  }
}

// Check what sea tile colors these moves go to
console.log("\n=== Checking sea tile colors ===");
const gameState = gameEngine.getGameState();
for (const move of movesForBlack) {
  const cell = gameState.map.getCell(move.q, move.r);
  console.log(`Move to (${move.q}, ${move.r}) goes to sea tile color: ${cell?.color}`);
}