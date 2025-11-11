// Unit test for die recoloring feature

import { QuestsZeusGameEngine } from "../src/game-engine.ts";
import type { HexColor } from "../src/hexmap.ts";

function testRecolorDie() {
  console.log("Running die recoloring unit tests...\n");

  const gameEngine = new QuestsZeusGameEngine();
  gameEngine.initializeGame();

  const player = gameEngine.getCurrentPlayer();

  // Set up test conditions
  player.oracleDice = ["black", "pink", "blue"] as HexColor[];
  player.favor = 5;

  // Test 1: Recolor black die with 1 favor (should become pink)
  console.log("Test 1: Recolor black → pink (1 favor)");
  const result1 = gameEngine.recolorDie(player.id, "black", 1);
  console.log(`  Result: ${result1 ? "PASS" : "FAIL"}`);
  console.log(`  Dice after: ${player.oracleDice.join(", ")}`);
  console.log(`  Expected: pink, pink, blue`);
  console.log(`  Favor remaining: ${player.favor} (expected: 4)\n`);

  // Test 2: Recolor pink die with 2 favor (should become blue)
  console.log("Test 2: Recolor pink → blue (2 favor)");
  const result2 = gameEngine.recolorDie(player.id, "pink", 2);
  console.log(`  Result: ${result2 ? "PASS" : "FAIL"}`);
  console.log(`  Dice after: ${player.oracleDice.join(", ")}`);
  console.log(`  Expected: pink, blue, blue`);
  console.log(`  Favor remaining: ${player.favor} (expected: 2)\n`);

  // Test 3: Recolor blue die with 3 favor (should become green)
  console.log("Test 3: Recolor blue → green (3 favor)");
  const result3 = gameEngine.recolorDie(player.id, "blue", 3);
  console.log(`  Result: ${result3 ? "PASS" : "FAIL"}`);
  console.log(`  Dice after: ${player.oracleDice.join(", ")}`);
  console.log(`  Expected: pink, blue, green`);
  console.log(`  Favor remaining: ${player.favor} (expected: -1)\n`);

  // Test 4: Recolor red die with 1 favor (should become black - wrap around)
  console.log("Test 4: Recolor red → black (wrap around)");
  player.oracleDice = ["red"] as HexColor[];
  player.favor = 1;
  const result4 = gameEngine.recolorDie(player.id, "red", 1);
  console.log(`  Result: ${result4 ? "PASS" : "FAIL"}`);
  console.log(`  Dice after: ${player.oracleDice.join(", ")}`);
  console.log(`  Expected: black`);
  console.log(`  Favor remaining: ${player.favor} (expected: 0)\n`);

  // Test 5: Insufficient favor
  console.log("Test 5: Insufficient favor");
  player.oracleDice = ["black"] as HexColor[];
  player.favor = 0;
  const result5 = gameEngine.recolorDie(player.id, "black", 1);
  console.log(`  Result: ${!result5 ? "PASS" : "FAIL"} (should fail)`);
  console.log("  Dice unchanged: " + player.oracleDice.join(", "));
  console.log(`  Favor unchanged: ${player.favor}\n`);

  // Test 6: Invalid die color
  console.log("Test 6: Invalid die color");
  player.oracleDice = ["black"] as HexColor[];
  player.favor = 5;
  const result6 = gameEngine.recolorDie(player.id, "none" as HexColor, 1);
  console.log(`  Result: ${!result6 ? "PASS" : "FAIL"} (should fail)`);
  console.log("  Dice unchanged: " + player.oracleDice.join(", "));
  console.log(`  Favor unchanged: ${player.favor}\n`);

  console.log("Die recoloring unit tests completed!");
}

// Run the test
testRecolorDie();
