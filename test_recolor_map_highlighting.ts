// Test for recoloring feature with map highlighting
// This tests that when recoloring intentions change, the available moves on the map are updated

import { OracleGameEngine } from "./src/game-engine.ts";
import type { Player } from "./src/game-engine.ts";

function testRecolorMapHighlighting() {
  console.log("Testing recoloring feature with map highlighting...\n");

  const gameEngine = new OracleGameEngine();
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

  // Test 1: Get available moves with black die
  console.log("Test 1: Available moves with black die (no recoloring)");
  const movesBeforeRecolor = gameEngine.getAvailableMovesWithFavor(player.id);
  const blackMoves = movesBeforeRecolor.filter(move => move.dieColor === "black");
  console.log(`  Moves available with black die: ${blackMoves.length}`);
  blackMoves.forEach(move => {
    console.log(`    - (${move.q}, ${move.r}) - ${move.favorCost} favor`);
  });

  // Test 2: Set recoloring intention for black die → pink
  console.log("\nTest 2: Set recoloring intention for black die → pink (1 favor)");
  const success = gameEngine.setRecolorIntention(player.id, "black", 1);
  console.log(`  Result: ${success ? "SUCCESS" : "FAILED"}`);
  
  // Test 3: Get available moves after recoloring intention
  console.log("\nTest 3: Available moves after recoloring intention");
  const movesAfterRecolor = gameEngine.getAvailableMovesWithFavor(player.id);
  const pinkMoves = movesAfterRecolor.filter(move => move.dieColor === "pink");
  console.log(`  Moves available with pink die: ${pinkMoves.length}`);
  pinkMoves.forEach(move => {
    console.log(`    - (${move.q}, ${move.r}) - ${move.favorCost} favor`);
  });

  // Test 4: Verify that black moves are no longer available
  console.log("\nTest 4: Verify black moves are no longer available");
  const blackMovesAfter = movesAfterRecolor.filter(move => move.dieColor === "black");
  console.log(`  Moves still available with black die: ${blackMovesAfter.length}`);
  if (blackMovesAfter.length === 0) {
    console.log("  ✓ Black moves correctly removed (die will become pink)");
  } else {
    console.log("  ✗ Black moves still available (should be removed)");
  }

  // Test 5: Clear recoloring intention
  console.log("\nTest 5: Clear recoloring intention");
  gameEngine.clearRecolorIntention(player.id, "black");
  const movesAfterClear = gameEngine.getAvailableMovesWithFavor(player.id);
  const blackMovesAfterClear = movesAfterClear.filter(move => move.dieColor === "black");
  console.log(`  Moves available with black die after clearing: ${blackMovesAfterClear.length}`);
  if (blackMovesAfterClear.length > 0) {
    console.log("  ✓ Black moves correctly restored after clearing intention");
  } else {
    console.log("  ✗ Black moves not restored after clearing intention");
  }

  // Test 6: Test multiple dice recoloring
  console.log("\nTest 6: Multiple dice recoloring");
  gameEngine.setRecolorIntention(player.id, "black", 1); // black → pink
  gameEngine.setRecolorIntention(player.id, "pink", 2);  // pink → blue
  
  const movesWithMultiple = gameEngine.getAvailableMovesWithFavor(player.id);
  const pinkMovesMultiple = movesWithMultiple.filter(move => move.dieColor === "pink");
  const blueMovesMultiple = movesWithMultiple.filter(move => move.dieColor === "blue");
  
  console.log(`  Moves available with pink die: ${pinkMovesMultiple.length}`);
  console.log(`  Moves available with blue die: ${blueMovesMultiple.length}`);
  
  // The black die becomes pink, so pink moves should be available
  // The pink die becomes blue, so blue moves should be available
  if (pinkMovesMultiple.length > 0 && blueMovesMultiple.length > 0) {
    console.log("  ✓ Multiple recoloring intentions work correctly");
  } else {
    console.log("  ✗ Multiple recoloring intentions not working correctly");
  }

  console.log("\n--- Recoloring map highlighting test completed ---");
  console.log("\nSummary: When recoloring intentions change, the available moves on the map");
  console.log("should be updated to reflect the new die colors that will be used.");
}

// Run the test
testRecolorMapHighlighting();