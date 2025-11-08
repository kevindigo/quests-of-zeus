// Test for recoloring feature with map highlighting
// This tests that when recoloring intentions change, the available moves on the map are updated

import { QuestsZeusGameEngine } from "../src/game-engine.ts";
import type { Player } from "../src/game-engine.ts";

function testRecolorMapHighlighting() {
  console.log("Testing recoloring feature with map highlighting...\n");

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

  // Test 1: Get available moves with black die
  console.log("Test 1: Available moves with black die (no recoloring)");
  const movesBeforeRecolor = gameEngine.getAvailableMovesForDie(player.id, "black", player.favor);
  console.log(`  Moves available with black die: ${movesBeforeRecolor.length}`);
  movesBeforeRecolor.forEach(move => {
    console.log(`    - (${move.q}, ${move.r}) - ${move.favorCost} favor`);
  });

  // Test 2: Set recoloring intention for black die → pink
  console.log("\nTest 2: Set recoloring intention for black die → pink (1 favor)");
  const success = gameEngine.setRecolorIntention(player.id, "black", 1);
  console.log(`  Result: ${success ? "SUCCESS" : "FAILED"}`);
  
  // Test 3: Get available moves after recoloring intention
  console.log("\nTest 3: Available moves after recoloring intention");
  const movesAfterRecolor = gameEngine.getAvailableMovesForDie(player.id, "black", player.favor);
  console.log(`  Moves available with recolored black die: ${movesAfterRecolor.length}`);
  movesAfterRecolor.forEach(move => {
    console.log(`    - (${move.q}, ${move.r}) - ${move.favorCost} favor`);
  });

  // Test 4: Verify that moves now go to pink sea tiles
  console.log("\nTest 4: Verify moves go to pink sea tiles");
  const gameState = gameEngine.getGameState();
  const movesToPinkTiles = movesAfterRecolor.filter(move => {
    const cell = gameState.map.getCell(move.q, move.r);
    return cell && cell.color === "pink";
  });
  console.log(`  Moves to pink sea tiles: ${movesToPinkTiles.length}`);
  if (movesToPinkTiles.length > 0) {
    console.log("  ✓ Black die correctly recolored to enable pink moves");
  } else {
    console.log("  ✗ Black die not recoloring to enable pink moves");
  }

  // Test 5: Clear recoloring intention
  console.log("\nTest 5: Clear recoloring intention");
  gameEngine.clearRecolorIntention(player.id, "black");
  const movesAfterClear = gameEngine.getAvailableMovesForDie(player.id, "black", player.favor);
  console.log(`  Moves available with black die after clearing: ${movesAfterClear.length}`);
  
  // Verify moves go back to black sea tiles
  const movesToBlackTiles = movesAfterClear.filter(move => {
    const cell = gameState.map.getCell(move.q, move.r);
    return cell && cell.color === "black";
  });
  console.log(`  Moves to black sea tiles after clearing: ${movesToBlackTiles.length}`);
  if (movesToBlackTiles.length === movesAfterClear.length) {
    console.log("  ✓ Black moves correctly restored after clearing intention");
  } else {
    console.log("  ✗ Black moves not fully restored after clearing intention");
  }

  // Test 6: Test multiple dice recoloring
  console.log("\nTest 6: Multiple dice recoloring");
  gameEngine.setRecolorIntention(player.id, "black", 1); // black → pink
  gameEngine.setRecolorIntention(player.id, "pink", 2);  // pink → blue
  
  const movesForBlack = gameEngine.getAvailableMovesForDie(player.id, "black", player.favor);
  const movesForPink = gameEngine.getAvailableMovesForDie(player.id, "pink", player.favor);
  
  console.log(`  Moves available with recolored black die: ${movesForBlack.length}`);
  console.log(`  Moves available with recolored pink die: ${movesForPink.length}`);
  
  // The black die becomes pink, so should enable moves to pink sea tiles
  const blackToPinkMoves = movesForBlack.filter(move => {
    const cell = gameState.map.getCell(move.q, move.r);
    return cell && cell.color === "pink";
  });
  
  // The pink die becomes blue, so should enable moves to blue sea tiles
  const pinkToBlueMoves = movesForPink.filter(move => {
    const cell = gameState.map.getCell(move.q, move.r);
    return cell && cell.color === "blue";
  });
  
  if (blackToPinkMoves.length > 0 && pinkToBlueMoves.length > 0) {
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