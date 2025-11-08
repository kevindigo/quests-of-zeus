// Test for recoloring movement validation
// This tests that movement works correctly when recoloring intentions are set

import { QuestsZeusGameEngine } from "./src/game-engine.ts";
import type { Player } from "./src/game-engine.ts";

function testRecolorMovement() {
  console.log("Testing recoloring movement validation...\n");

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

  // Test 1: Set recoloring intention for black die → pink
  console.log("Test 1: Set recoloring intention for black die → pink (1 favor)");
  const success = gameEngine.setRecolorIntention(player.id, "black", 1);
  console.log(`  Result: ${success ? "SUCCESS" : "FAILED"}`);
  
  // Test 2: Get available moves with pink die (after recoloring)
  console.log("\nTest 2: Available moves with pink die (after recoloring)");
  const availableMoves = gameEngine.getAvailableMovesWithFavor(player.id);
  const pinkMoves = availableMoves.filter(move => move.dieColor === "pink");
  console.log(`  Moves available with pink die: ${pinkMoves.length}`);
  
  if (pinkMoves.length > 0) {
    // Test 3: Try to move to a pink hex using black die (with recoloring)
    const targetMove = pinkMoves[0];
    console.log(`\nTest 3: Attempting to move to (${targetMove.q}, ${targetMove.r}) using black die with recoloring`);
    
    const moveSuccess = gameEngine.moveShip(
      player.id,
      targetMove.q,
      targetMove.r,
      "black", // Original die color
      targetMove.favorCost
    );
    
    console.log(`  Move result: ${moveSuccess ? "SUCCESS" : "FAILED"}`);
    
    if (moveSuccess) {
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
    console.log("  No pink moves available to test movement");
  }

  // Test 4: Test clearing recoloring intention
  console.log("\nTest 4: Clear recoloring intention and verify movement fails");
  
  // Reset player state
  player.oracleDice = ["black"];
  player.favor = 5;
  player.shipPosition = { q: 0, r: 0 }; // Reset to starting position
  
  // Clear any existing recoloring
  gameEngine.clearRecolorIntention(player.id, "black");
  
  // Get moves with black die (no recoloring)
  const blackMoves = gameEngine.getAvailableMovesWithFavor(player.id).filter(move => move.dieColor === "black");
  
  if (blackMoves.length > 0) {
    const targetMove = blackMoves[0];
    
    // Try to move to a black hex using black die (should work)
    const moveSuccess1 = gameEngine.moveShip(
      player.id,
      targetMove.q,
      targetMove.r,
      "black",
      targetMove.favorCost
    );
    console.log(`  Move to black hex with black die (no recoloring): ${moveSuccess1 ? "SUCCESS" : "FAILED"}`);
    
    // Reset and try with recoloring intention to pink
    player.oracleDice = ["black"];
    player.favor = 5;
    player.shipPosition = { q: 0, r: 0 };
    
    gameEngine.setRecolorIntention(player.id, "black", 1);
    
    // Try to move to same black hex with recoloring intention (should fail)
    const moveSuccess2 = gameEngine.moveShip(
      player.id,
      targetMove.q,
      targetMove.r,
      "black",
      targetMove.favorCost
    );
    console.log(`  Move to black hex with black die (recolored to pink): ${moveSuccess2 ? "SUCCESS" : "FAILED"}`);
    
    if (!moveSuccess2) {
      console.log(`  ✓ Correctly prevented movement to black hex when die is recolored to pink`);
    } else {
      console.log(`  ✗ Should have prevented movement to black hex when die is recolored to pink`);
    }
  }

  console.log("\n--- Recoloring movement test completed ---");
}

// Run the test
testRecolorMovement();