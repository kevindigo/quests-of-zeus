// Simple test for die recoloring feature

import { OracleGameEngine } from "./src/game-engine.ts";

function testRecolorSimple() {
  console.log("Simple die recoloring test...\n");

  const gameEngine = new OracleGameEngine();
  gameEngine.initializeGame();

  const player = gameEngine.getCurrentPlayer();
  
  // Set up specific test conditions
  player.oracleDice = ["black", "pink", "blue"];
  player.favor = 5;
  
  console.log(`Initial dice: ${player.oracleDice.join(", ")}`);
  console.log(`Initial favor: ${player.favor}\n`);
  
  // Test 1: Recolor black die with 1 favor (should become pink)
  console.log("Test 1: Recolor black → pink (1 favor)");
  const result1 = gameEngine.recolorDie(player.id, "black", 1);
  console.log(`  Result: ${result1 ? "SUCCESS" : "FAILED"}`);
  console.log(`  Dice after: ${player.oracleDice.join(", ")}`);
  console.log(`  Favor remaining: ${player.favor}\n`);

  // Test 2: Recolor pink die with 2 favor (should become blue)
  console.log("Test 2: Recolor pink → blue (2 favor)");
  const result2 = gameEngine.recolorDie(player.id, "pink", 2);
  console.log(`  Result: ${result2 ? "SUCCESS" : "FAILED"}`);
  console.log(`  Dice after: ${player.oracleDice.join(", ")}`);
  console.log(`  Favor remaining: ${player.favor}\n`);

  // Test 3: Recolor blue die with 3 favor (should become green)
  console.log("Test 3: Recolor blue → green (3 favor)");
  const result3 = gameEngine.recolorDie(player.id, "blue", 3);
  console.log(`  Result: ${result3 ? "SUCCESS" : "FAILED"}`);
  console.log(`  Dice after: ${player.oracleDice.join(", ")}`);
  console.log(`  Favor remaining: ${player.favor}\n`);

  // Test 4: Wrap around - recolor red die with 1 favor (should become black)
  console.log("Test 4: Recolor red → black (wrap around)");
  player.oracleDice = ["red"];
  player.favor = 1;
  const result4 = gameEngine.recolorDie(player.id, "red", 1);
  console.log(`  Result: ${result4 ? "SUCCESS" : "FAILED"}`);
  console.log(`  Dice after: ${player.oracleDice.join(", ")}`);
  console.log(`  Favor remaining: ${player.favor}\n`);

  console.log("Simple die recoloring test completed!");
}

// Run the test
testRecolorSimple();