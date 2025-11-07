// Unit test for recoloring favor calculation in extra range moves

import { OracleGameEngine } from "../src/game-engine.ts";
import type { HexColor } from "../src/hexmap.ts";

function testRecolorFavorCalculation() {
  console.log("Running recoloring favor calculation unit tests...\n");

  const gameEngine = new OracleGameEngine();
  gameEngine.initializeGame();

  const player = gameEngine.getCurrentPlayer();
  
  // Set up test conditions
  player.oracleDice = ["black", "pink", "blue"] as HexColor[];
  player.favor = 5;
  
  console.log(`Initial setup:`);
  console.log(`  Player favor: ${player.favor}`);
  console.log(`  Oracle dice: ${player.oracleDice.join(", ")}`);
  console.log(`  Ship position: (${player.shipPosition.q}, ${player.shipPosition.r})\n`);

  // Test 1: Set recoloring intention for black die → pink (1 favor cost)
  console.log("Test 1: Set recoloring intention for black die → pink (1 favor cost)");
  const recoloringSuccess = gameEngine.setRecolorIntention(player.id, "black", 1);
  console.log(`  Recoloring intention set: ${recoloringSuccess ? "SUCCESS" : "FAILED"}`);
  console.log(`  Player favor after setting intention: ${player.favor} (should still be 5 - not spent yet)\n`);

  // Test 2: Get available moves with favor and verify they account for recoloring cost
  console.log("Test 2: Get available moves with favor - should account for recoloring cost");
  const availableMoves = gameEngine.getAvailableMovesWithFavor(player.id);
  
  console.log(`  Total available moves: ${availableMoves.length}`);
  
  // Check that moves requiring pink die are available (since black die can be recolored to pink)
  const pinkMoves = availableMoves.filter(move => move.dieColor === "pink");
  console.log(`  Moves requiring pink die: ${pinkMoves.length}`);
  
  // For each pink move, verify that the total cost (movement favor + recoloring cost) <= player favor
  let allMovesValid = true;
  for (const move of pinkMoves) {
    const totalCost = move.favorCost + 1; // movement favor + recoloring cost
    const canAfford = totalCost <= player.favor;
    console.log(`    Move to (${move.q}, ${move.r}) - movement cost: ${move.favorCost}, total cost: ${totalCost}, can afford: ${canAfford}`);
    if (!canAfford) {
      allMovesValid = false;
    }
  }
  
  console.log(`  All moves are affordable: ${allMovesValid ? "PASS" : "FAIL"}\n`);

  // Test 3: Test edge case where recoloring cost would make move unaffordable
  console.log("Test 3: Edge case - high recoloring cost should limit available moves");
  
  // Clear previous recoloring
  gameEngine.clearRecolorIntention(player.id, "black");
  
  // Set a high recoloring cost that would make some moves unaffordable
  player.favor = 3; // Reduce favor
  const highRecolorSuccess = gameEngine.setRecolorIntention(player.id, "black", 2); // 2 favor recoloring cost
  console.log(`  High recoloring intention set: ${highRecolorSuccess ? "SUCCESS" : "FAILED"}`);
  console.log(`  Player favor: ${player.favor}, Recoloring cost: 2`);
  
  const movesWithHighRecolor = gameEngine.getAvailableMovesWithFavor(player.id);
  const pinkMovesWithHighRecolor = movesWithHighRecolor.filter(move => move.dieColor === "pink");
  
  console.log(`  Moves requiring pink die with high recoloring cost: ${pinkMovesWithHighRecolor.length}`);
  
  // Verify that no moves exceed available favor after accounting for recoloring
  let highRecolorMovesValid = true;
  for (const move of pinkMovesWithHighRecolor) {
    const totalCost = move.favorCost + 2; // movement favor + high recoloring cost
    const canAfford = totalCost <= player.favor;
    console.log(`    Move to (${move.q}, ${move.r}) - movement cost: ${move.favorCost}, total cost: ${totalCost}, can afford: ${canAfford}`);
    if (!canAfford) {
      highRecolorMovesValid = false;
    }
  }
  
  console.log(`  All high-cost moves are affordable: ${highRecolorMovesValid ? "PASS" : "FAIL"}\n`);

  // Test 4: Test that moves without recoloring are not affected
  console.log("Test 4: Moves without recoloring should not be affected");
  
  // Clear recoloring
  gameEngine.clearRecolorIntention(player.id, "black");
  
  const movesWithoutRecolor = gameEngine.getAvailableMovesWithFavor(player.id);
  const blackMoves = movesWithoutRecolor.filter(move => move.dieColor === "black");
  
  console.log(`  Moves requiring black die (no recoloring): ${blackMoves.length}`);
  
  let noRecolorMovesValid = true;
  for (const move of blackMoves) {
    const canAfford = move.favorCost <= player.favor;
    console.log(`    Move to (${move.q}, ${move.r}) - movement cost: ${move.favorCost}, can afford: ${canAfford}`);
    if (!canAfford) {
      noRecolorMovesValid = false;
    }
  }
  
  console.log(`  All no-recolor moves are affordable: ${noRecolorMovesValid ? "PASS" : "FAIL"}\n`);

  console.log("Recoloring favor calculation unit tests completed!");
}

// Run the test
testRecolorFavorCalculation();