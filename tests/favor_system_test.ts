// Test for the favor system in Oracle of Delphi

import { assert, assertEquals } from "@std/assert";
import { OracleGameEngine } from "../src/game-engine.ts";
import type { HexColor } from "../src/hexmap.ts";

Deno.test("Favor System - player initialization", () => {
  const engine = new OracleGameEngine();
  engine.initializeGame();

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
  engine.initializeGame();

  const player1 = engine.getPlayer(1);
  assertExists(player1);

  // Verify that favor property exists on player
  assert("favor" in player1, "Player should have favor property");
  assertEquals(typeof player1.favor, "number", "Favor should be a number");
});

Deno.test("Favor System - favor progression pattern", () => {
  const engine = new OracleGameEngine();
  engine.initializeGame();

  // Verify the favor progression pattern: 3, 4, 5, 6 for 4 players
  const players = engine.getGameState().players;

  // Check that each player has 1 more favor than the previous
  for (let i = 1; i < players.length; i++) {
    const currentPlayer = players[i];
    const previousPlayer = players[i - 1];

    assertEquals(
      currentPlayer.favor,
      previousPlayer.favor + 1,
      `Player ${i + 1} should have 1 more favor than Player ${i}`,
    );
  }
});

Deno.test("Spend Die for Favor - basic functionality", () => {
  const engine = new OracleGameEngine();
  engine.initializeGame();

  const player1 = engine.getPlayer(1);
  assertExists(player1);

  // Start in oracle phase, roll dice to get to action phase
  engine.rollOracleDice(1);

  const initialFavor = player1.favor;
  const initialDiceCount = player1.oracleDice.length;

  // Spend a die for favor
  const dieColor = player1.oracleDice[0];

  // Count how many dice of this color the player has before spending
  const initialColorCount =
    player1.oracleDice.filter((color) => color === dieColor).length;

  const success = engine.spendDieForFavor(1, dieColor);

  assert(success, "Should successfully spend die for favor");
  assertEquals(player1.favor, initialFavor + 2, "Should gain 2 favor");
  assertEquals(
    player1.oracleDice.length,
    initialDiceCount - 1,
    "Should consume one die",
  );

  // Check that the number of dice of the spent color decreased by 1
  const finalColorCount =
    player1.oracleDice.filter((color) => color === dieColor).length;
  assertEquals(
    finalColorCount,
    initialColorCount - 1,
    "Should have one less die of the spent color",
  );
});

Deno.test("Spend Die for Favor - invalid scenarios", () => {
  const engine = new OracleGameEngine();
  engine.initializeGame();

  const player1 = engine.getPlayer(1);
  assertExists(player1);

  // Try to spend die in oracle phase (should fail)
  const fail1 = engine.spendDieForFavor(1, "red");
  assert(!fail1, "Should not be able to spend die in oracle phase");

  // Roll dice to get to action phase
  engine.rollOracleDice(1);

  // Try to spend a die the player doesn't have (should fail)
  // Use a color that's definitely not in the player's dice by checking all possible colors
  const allColors: HexColor[] = [
    "red",
    "pink",
    "blue",
    "black",
    "green",
    "yellow",
  ];
  let unavailableColor: HexColor = "red"; // Default fallback
  for (const color of allColors) {
    if (!player1.oracleDice.includes(color)) {
      unavailableColor = color;
      break;
    }
  }

  // If somehow all colors are present (shouldn't happen with 3 dice), use a made-up color
  // But since we can't use non-HexColor types, we'll just use the first color and accept it might fail
  // This is extremely unlikely with only 3 dice out of 6 colors

  const fail2 = engine.spendDieForFavor(1, unavailableColor);
  assert(!fail2, "Should not be able to spend die player doesn't have");

  // Verify favor and dice count didn't change
  assertEquals(player1.favor, 3, "Favor should not change on failed spend");
  assertEquals(
    player1.oracleDice.length,
    3,
    "Dice count should not change on failed spend",
  );
});

Deno.test("Spend Die for Favor - turn continues after spending", () => {
  const engine = new OracleGameEngine();
  engine.initializeGame();

  const player1 = engine.getPlayer(1);
  assertExists(player1);

  // Roll dice to get to action phase
  engine.rollOracleDice(1);

  const initialDiceCount = player1.oracleDice.length;

  // Spend one die for favor
  const dieColor = player1.oracleDice[0];
  const success = engine.spendDieForFavor(1, dieColor);

  assert(success, "Should successfully spend die for favor");

  // Verify turn is still in action phase and player can use remaining dice
  const gameState = engine.getGameState();
  assertEquals(
    gameState.phase,
    "action",
    "Should still be in action phase after spending die",
  );
  assertEquals(
    player1.oracleDice.length,
    initialDiceCount - 1,
    "Should have remaining dice",
  );
  assert(player1.oracleDice.length > 0, "Should have dice remaining to use");
});

// Helper function for assertions
function assertExists<T>(
  value: T | null | undefined,
  message?: string,
): asserts value is T {
  if (value === null || value === undefined) {
    throw new Error(message || "Value should exist");
  }
}
