// Test for the favor system in Oracle of Delphi

import { assert, assertEquals } from "@std/assert";
import { OracleGameEngine } from "../src/game-engine.ts";

Deno.test("Favor System - player initialization", () => {
  const engine = new OracleGameEngine();
  const state = engine.initializeGame();

  // Check that players have the correct favor values
  const player1 = engine.getPlayer(1);
  const player2 = engine.getPlayer(2);

  assertExists(player1);
  assertExists(player2);

  // First player should have 3 favor
  assertEquals(player1.favor, 3, "Player 1 should start with 3 favor");
  
  // Second player should have 4 favor (1 more than previous)
  assertEquals(player2.favor, 4, "Player 2 should start with 4 favor");
});

Deno.test("Favor System - favor property exists", () => {
  const engine = new OracleGameEngine();
  const state = engine.initializeGame();

  const player1 = engine.getPlayer(1);
  assertExists(player1);

  // Verify that favor property exists on player
  assert("favor" in player1, "Player should have favor property");
  assertEquals(typeof player1.favor, "number", "Favor should be a number");
});

Deno.test("Favor System - favor progression pattern", () => {
  const engine = new OracleGameEngine();
  const state = engine.initializeGame();

  // Verify the favor progression pattern: 3, 4, 5, 6 for 4 players
  const players = state.players;
  
  // Check that each player has 1 more favor than the previous
  for (let i = 1; i < players.length; i++) {
    const currentPlayer = players[i];
    const previousPlayer = players[i - 1];
    
    assertEquals(
      currentPlayer.favor,
      previousPlayer.favor + 1,
      `Player ${i + 1} should have 1 more favor than Player ${i}`
    );
  }
});

// Helper function for assertions
function assertExists<T>(value: T | null | undefined, message?: string): asserts value is T {
  if (value === null || value === undefined) {
    throw new Error(message || "Value should exist");
  }
}