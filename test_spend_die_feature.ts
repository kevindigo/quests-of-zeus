// Quick test to verify the spend die for favor feature
import { OracleGameEngine } from "./src/game-engine.ts";

console.log("Testing spend die for favor feature...");

const engine = new OracleGameEngine();
engine.initializeGame();

const player1 = engine.getPlayer(1)!;
console.log("Initial state:");
console.log("  Favor:", player1.favor);
console.log("  Dice:", player1.oracleDice);

// Roll dice to get to action phase
engine.rollOracleDice(1);
console.log("\nAfter rolling dice:");
console.log("  Phase:", engine.getGameState().phase);
console.log("  Dice:", player1.oracleDice);

// Spend a die for favor
const dieColor = player1.oracleDice[0];
const success = engine.spendDieForFavor(1, dieColor);

console.log("\nAfter spending die for favor:");
console.log("  Success:", success);
console.log("  Favor:", player1.favor);
console.log("  Dice:", player1.oracleDice);
console.log("  Phase:", engine.getGameState().phase);

if (success && player1.favor === 5 && player1.oracleDice.length === 2 && engine.getGameState().phase === "action") {
  console.log("\n✅ Feature working correctly!");
} else {
  console.log("\n❌ Feature not working as expected!");
}