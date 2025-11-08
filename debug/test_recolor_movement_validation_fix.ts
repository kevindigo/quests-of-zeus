// Test to verify the recoloring movement validation fix

import { QuestsZeusGameEngine } from "../src/game-engine.ts";
import type { Player } from "../src/game-engine.ts";

function testRecolorMovementValidationFix() {
  console.log("Testing recoloring movement validation fix...\n");

  const gameEngine = new QuestsZeusGameEngine();
  gameEngine.initializeGame();

  // Get the first player
  const player = gameEngine.getCurrentPlayer();
  console.log(`Testing with player: ${player.name}`);
  console.log(`Initial favor: ${player.favor}\n`);

  // Set up specific dice for testing
  player.oracleDice = ["black", "pink", "blue"];
  player.favor = 5;
  
  console.log(`Initial dice: ${player.oracleDice.join(", ")}`);
  console.log(`Initial favor: ${player.favor}\n`);

  // Test 1: Set recoloring intention for black die → pink
  console.log("Test 1: Set recoloring intention for black die → pink (1 favor)");
  const success = gameEngine.setRecolorIntention(player.id, "black", 1);
  console.log(`  Result: ${success ? "SUCCESS" : "FAILED"}`);
  
  if (success) {
    console.log(`  Recolored dice: ${JSON.stringify(player.recoloredDice)}`);
  }

  // Test 2: Get available moves for black die with recoloring
  console.log("\nTest 2: Available moves for black die with recoloring");
  const availableMoves = gameEngine.getAvailableMovesForDie(player.id, "black", player.favor);
  console.log(`  Moves available with recolored black die: ${availableMoves.length}`);
  
  if (availableMoves.length > 0) {
    // Test 3: Try to move to a pink hex using black die (with recoloring)
    const targetMove = availableMoves[0];
    console.log(`\nTest 3: Attempting to move to (${targetMove.q}, ${targetMove.r}) using black die with recoloring`);
    
    const moveResult = gameEngine.moveShip(
      player.id,
      targetMove.q,
      targetMove.r,
      "black", // Original die color
      targetMove.favorCost
    );
    
    console.log(`  Move result: ${moveResult.success ? "SUCCESS" : "FAILED"}`);
    
    if (moveResult.success) {
      console.log(`  ✓ Successfully moved using recolored die`);
      console.log(`  Player position: (${player.shipPosition.q}, ${player.shipPosition.r})`);
      console.log(`  Remaining favor: ${player.favor} (should be ${5 - 1 - targetMove.favorCost})`);
      console.log(`  Remaining dice: ${player.oracleDice.join(", ")} (black die should be consumed)`);
      
      // Verify the die was consumed
      if (!player.oracleDice.includes("black")) {
        console.log(`  ✓ Black die correctly consumed`);
      } else {
        console.log(`  ✗ Black die not consumed`);
      }
      
      // Verify favor was spent
      const expectedFavor = 5 - 1 - targetMove.favorCost; // Initial - recoloring - movement
      if (player.favor === expectedFavor) {
        console.log(`  ✓ Favor correctly spent: ${expectedFavor} remaining`);
      } else {
        console.log(`  ✗ Favor not spent correctly: ${player.favor} remaining (expected ${expectedFavor})`);
      }
    } else {
      console.log(`  ✗ Failed to move using recolored die`);
      console.log(`  This indicates the movement validation is not working with recoloring`);
    }
  } else {
    console.log("  No moves available to test movement");
  }

  // Test 4: Verify that the validation now works correctly
  console.log("\nTest 4: Verify validation works correctly");
  
  // Reset player for new test
  player.oracleDice = ["black", "pink", "blue"];
  player.favor = 5;
  player.recoloredDice = {};
  
  // Set recoloring intention for black die → pink
  gameEngine.setRecolorIntention(player.id, "black", 1);
  
  // Get available moves again
  const movesAfterRecolor = gameEngine.getAvailableMovesForDie(player.id, "black", player.favor);
  console.log(`  Moves available after recoloring: ${movesAfterRecolor.length}`);
  
  if (movesAfterRecolor.length > 0) {
    const testMove = movesAfterRecolor[0];
    console.log(`  Testing move to (${testMove.q}, ${testMove.r})`);
    
    // This should now work correctly with the fix
    const validationResult = gameEngine.moveShip(
      player.id,
      testMove.q,
      testMove.r,
      "black",
      testMove.favorCost
    );
    
    if (validationResult.success) {
      console.log(`  ✓ Validation fix working: Move succeeded with recolored die`);
    } else {
      console.log(`  ✗ Validation fix not working: Move failed despite being shown as available`);
      if (validationResult.error) {
        console.log(`  Error details:`, validationResult.error);
      }
    }
  }

  console.log("\n--- Recoloring movement validation fix test completed ---");
}

// Run the test
testRecolorMovementValidationFix();