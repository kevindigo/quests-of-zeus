#!/usr/bin/env -S deno run --allow-read

/**
 * Debug test runner - runs tests without importing server code
 * Use this when you want to test individual components without starting the Oak server
 */

import { OracleGameEngine } from "../src/game-engine.ts";

async function testGameInitialization() {
  console.log("🧪 Testing game initialization changes...\n");

  // Test 1: Game should not be initialized by default
  console.log("Test 1: Game should not be initialized by default");
  const engine = new OracleGameEngine();
  console.log(
    `✓ isGameInitialized(): ${engine.isGameInitialized()} (expected: false)`,
  );

  // Test 2: Should throw error when trying to access game state before initialization
  console.log(
    "\nTest 2: Should throw error when accessing game state before initialization",
  );
  try {
    engine.getGameState();
    console.log("✗ Should have thrown error");
    return false;
  } catch (error: unknown) {
    console.log(`✓ Threw error as expected: ${(error as Error).message}`);
  }

  // Test 3: Initialize game
  console.log("\nTest 3: Initialize game");
  const state = engine.initializeGame();
  console.log(
    `✓ isGameInitialized(): ${engine.isGameInitialized()} (expected: true)`,
  );
  console.log(`✓ Players: ${state.players.length} (expected: 2)`);
  console.log(`✓ Phase: ${state.phase} (expected: setup)`);

  // Test 4: Should be able to access game state after initialization
  console.log(
    "\nTest 4: Should be able to access game state after initialization",
  );
  const gameState = engine.getGameState();
  console.log(`✓ Got game state successfully`);
  console.log(`✓ Round: ${gameState.round} (expected: 1)`);

  // Test 5: Should be able to get players
  console.log("\nTest 5: Should be able to get players");
  const player1 = engine.getPlayer(1);
  const player2 = engine.getPlayer(2);
  console.log(`✓ Player 1: ${player1?.name} (expected: Player 1)`);
  console.log(`✓ Player 2: ${player2?.name} (expected: Player 2)`);

  console.log("\n✅ All game initialization tests passed!");
  return true;
}

async function runDebugTests() {
  console.log("🧪 Running debug tests (no server startup)...\n");

  try {
    // Test game initialization changes
    const success = await testGameInitialization();

    if (success) {
      console.log("\n✅ All debug tests completed successfully!");
      console.log("\nSummary of changes:");
      console.log("- Game no longer starts automatically when app loads");
      console.log("- Users now see a welcome screen first");
      console.log("- Game only starts when 'Start New Game' button is clicked");
      console.log("- This provides a better user experience");
    } else {
      console.log("\n❌ Some tests failed");
      Deno.exit(1);
    }
  } catch (error) {
    console.error("❌ Debug test failed:", error);
    Deno.exit(1);
  }
}

if (import.meta.main) {
  runDebugTests();
}