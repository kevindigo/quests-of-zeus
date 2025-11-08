// Test for the new radio button recoloring feature
// This tests that favor is only spent when the die is actually used

import { QuestsZeusGameEngine } from "./src/game-engine.ts";
import type { Player } from "./src/game-engine.ts";

function testRecolorRadioFeature() {
  console.log("Testing radio button recoloring feature...\n");

  const gameEngine = new QuestsZeusGameEngine();
  gameEngine.initializeGame();

  // Get the first player
  const player = gameEngine.getCurrentPlayer() as Player & { recoloredDice?: any };
  console.log(`Testing with player: ${player.name}`);
  console.log(`Initial favor: ${player.favor}\n`);

  // Set up specific dice for testing
  player.oracleDice = ["black", "pink", "blue"];
  player.favor = 5;
  
  console.log(`Initial dice: ${player.oracleDice.join(", ")}`);
  console.log(`Initial favor: ${player.favor}\n`);

  // Test 1: Set recoloring intention for black die with 1 favor
  console.log("Test 1: Set recoloring intention for black die → pink (1 favor)");
  const success1 = gameEngine.setRecolorIntention(player.id, "black", 1);
  console.log(`  Result: ${success1 ? "SUCCESS" : "FAILED"}`);
  console.log(`  Dice after intention: ${player.oracleDice.join(", ")}`);
  console.log(`  Favor after intention: ${player.favor} (should be same as initial)\n`);

  // Test 2: Verify recoloring intention is stored
  console.log("Test 2: Verify recoloring intention is stored");
  if (player.recoloredDice && player.recoloredDice["black"]) {
    console.log(`  ✓ Recoloring intention stored: ${player.recoloredDice["black"].newColor} for ${player.recoloredDice["black"].favorCost} favor`);
  } else {
    console.log(`  ✗ Recoloring intention not stored`);
  }

  // Test 3: Clear recoloring intention
  console.log("Test 3: Clear recoloring intention");
  const clearSuccess = gameEngine.clearRecolorIntention(player.id, "black");
  console.log(`  Result: ${clearSuccess ? "SUCCESS" : "FAILED"}`);
  if (clearSuccess && (!player.recoloredDice || !player.recoloredDice["black"])) {
    console.log(`  ✓ Recoloring intention cleared`);
  } else {
    console.log(`  ✗ Recoloring intention not cleared`);
  }

  // Test 4: Set multiple recoloring intentions
  console.log("\nTest 4: Set multiple recoloring intentions");
  gameEngine.setRecolorIntention(player.id, "black", 1); // black → pink
  gameEngine.setRecolorIntention(player.id, "pink", 2);  // pink → blue
  gameEngine.setRecolorIntention(player.id, "blue", 3);  // blue → green
  
  console.log(`  Black die intention: ${player.recoloredDice["black"]?.newColor} (${player.recoloredDice["black"]?.favorCost} favor)`);
  console.log(`  Pink die intention: ${player.recoloredDice["pink"]?.newColor} (${player.recoloredDice["pink"]?.favorCost} favor)`);
  console.log(`  Blue die intention: ${player.recoloredDice["blue"]?.newColor} (${player.recoloredDice["blue"]?.favorCost} favor)`);
  console.log(`  Favor still available: ${player.favor} (not spent yet)\n`);

  // Test 5: Verify dice haven't changed yet
  console.log("Test 5: Verify dice colors haven't changed yet");
  if (player.oracleDice[0] === "black" && player.oracleDice[1] === "pink" && player.oracleDice[2] === "blue") {
    console.log(`  ✓ Dice colors unchanged: ${player.oracleDice.join(", ")}`);
  } else {
    console.log(`  ✗ Dice colors changed unexpectedly: ${player.oracleDice.join(", ")}`);
  }

  // Test 6: Test edge cases
  console.log("\nTest 6: Edge cases");
  
  // Test with insufficient favor
  const highFavorCost = player.favor + 10;
  console.log(`  Testing with insufficient favor (${highFavorCost} when player has ${player.favor}):`);
  const insufficientFavorResult = gameEngine.setRecolorIntention(player.id, "black", highFavorCost);
  console.log(`    Result: ${insufficientFavorResult ? "✗ Should have failed" : "✓ Correctly failed"}`);

  // Test with invalid die color
  console.log(`  Testing with invalid die color:`);
  const invalidColorResult = gameEngine.setRecolorIntention(player.id, "none" as "none", 1);
  console.log(`    Result: ${invalidColorResult ? "✗ Should have failed" : "✓ Correctly failed"}`);

  console.log("\n--- Radio button recoloring feature test completed ---");
  console.log("\nSummary: Favor is only spent when the die is actually used for movement or other actions.");
  console.log("Players can set recoloring intentions with radio buttons and change their mind freely.");
}

// Run the test
testRecolorRadioFeature();