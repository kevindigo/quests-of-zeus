// Test for die recoloring feature

import { OracleGameEngine } from "./src/game-engine.ts";
import type { Player } from "./src/game-engine.ts";

function testRecolorDie() {
  console.log("Testing die recoloring feature...\n");

  const gameEngine = new OracleGameEngine();
  gameEngine.initializeGame();

  // Get the first player
  const player = gameEngine.getCurrentPlayer() as Player & { recoloredDice?: any };
  console.log(`Testing with player: ${player.name}`);
  console.log(`Initial favor: ${player.favor}\n`);

  // Roll dice to get some oracle dice
  const dice = gameEngine.rollOracleDice(player.id);
  console.log(`Rolled oracle dice: ${dice.join(", ")}`);

  // Test recoloring with different favor amounts
  const testCases = [
    { dieColor: dice[0], favorSpent: 1 },
    { dieColor: dice[1], favorSpent: 2 },
    { dieColor: dice[2], favorSpent: 3 },
  ];

  for (const testCase of testCases) {
    console.log(`\nTesting recoloring ${testCase.dieColor} die with ${testCase.favorSpent} favor:`);
    
    const originalFavor = player.favor;
    const originalDice = [...player.oracleDice];
    
    // Set recoloring intention
    const success = gameEngine.setRecolorIntention(player.id, testCase.dieColor, testCase.favorSpent);
    
    if (success) {
      console.log(`✓ Successfully set recoloring intention`);
      console.log(`  Original dice: ${originalDice.join(", ")}`);
      console.log(`  Dice after intention: ${player.oracleDice.join(", ")}`);
      console.log(`  Favor not spent yet: ${player.favor} (same as original)`);
      
      // Verify the die was NOT recolored yet (only intention set)
      const originalDieIndex = originalDice.indexOf(testCase.dieColor);
      if (originalDieIndex !== -1 && player.oracleDice[originalDieIndex] === testCase.dieColor) {
        console.log(`✓ Die color not changed yet (only intention set)`);
      } else {
        console.log(`✗ Die color changed unexpectedly`);
      }
      
      // Test applying recoloring by using the die for movement
      console.log(`  Testing application of recoloring...`);
      // This would require a movement test, but for now we'll just verify the intention is stored
      if (player.recoloredDice && player.recoloredDice[testCase.dieColor]) {
        console.log(`✓ Recoloring intention stored correctly`);
      } else {
        console.log(`✗ Recoloring intention not stored`);
      }
    } else {
      console.log(`✗ Failed to set recoloring intention`);
      console.log(`  Possible reasons: not enough favor, invalid die color, or not in action phase`);
    }
  }

  // Test edge cases
  console.log("\n--- Testing edge cases ---");
  
  // Test with insufficient favor
  const highFavorCost = player.favor + 10;
  console.log(`\nTesting with insufficient favor (${highFavorCost} when player has ${player.favor}):`);
  const insufficientFavorResult = gameEngine.recolorDie(player.id, player.oracleDice[0], highFavorCost);
  console.log(`  Result: ${insufficientFavorResult ? "✗ Should have failed" : "✓ Correctly failed"}`);

  // Test with invalid die color
  console.log("\nTesting with invalid die color:");
  const invalidColorResult = gameEngine.recolorDie(player.id, "none" as "none", 1);
  console.log(`  Result: ${invalidColorResult ? "✗ Should have failed" : "✓ Correctly failed"}`);

  console.log("\n--- Die recoloring feature test completed ---");
}

// Run the test
testRecolorDie();