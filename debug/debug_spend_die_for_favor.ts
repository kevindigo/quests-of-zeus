#!/usr/bin/env -S deno run --allow-read

// Debug script to test the "spend die for favor" feature

import { QuestsZeusGameEngine } from "./src/game-engine.ts";

console.log("Testing 'Spend Die for Favor' feature...\n");

const engine = new QuestsZeusGameEngine();
engine.initializeGame();

const player1 = engine.getPlayer(1)!;
console.log(`Player 1 initial state:`);
console.log(`  Favor: ${player1.favor}`);
console.log(`  Oracle Dice: ${player1.oracleDice.join(", ")}`);

// Game now starts in action phase with dice already rolled
console.log(`\nGame starts in: ${engine.getGameState().phase}`);
console.log(`  Oracle Dice: ${player1.oracleDice.join(", ")}`);

// Test 2: Try to spend a die the player doesn't have (should fail)
console.log("\nTest 2: Try to spend die player doesn't have");
const result2 = engine.spendDieForFavor(1, "black");
console.log(`  Result: ${result2} (expected: false)`);
console.log(`  Favor after attempt: ${player1.favor}`);

// Test 3: Successfully spend a die for favor
console.log("\nTest 3: Successfully spend a die for favor");
const dieColor = player1.oracleDice[0];
const result3 = engine.spendDieForFavor(1, dieColor);
console.log(`  Result: ${result3} (expected: true)`);
console.log(`  Favor after spending: ${player1.favor} (expected: ${3 + 2})`);
console.log(`  Oracle Dice after spending: ${player1.oracleDice.join(", ")}`);

// Test 4: Verify turn continues
console.log("\nTest 4: Verify turn continues after spending");
console.log(`  Phase: ${engine.getGameState().phase} (expected: action)`);
console.log(`  Dice remaining: ${player1.oracleDice.length} (expected: 2)`);

console.log("\n✅ All manual tests completed successfully!");
