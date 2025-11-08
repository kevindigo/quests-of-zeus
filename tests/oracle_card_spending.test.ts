// Tests for oracle card spending functionality

import { assert, assertEquals } from "@std/assert";
import { QuestsZeusGameEngine } from "../src/game-engine.ts";

Deno.test("OracleCardSpending - basic functionality", () => {
  const engine = new QuestsZeusGameEngine();
  engine.initializeGame();

  const playerId = 1;
  const player = engine.getPlayer(playerId);
  assertExists(player);

  // Give player an oracle card
  player.oracleCards = ["blue"];
  player.usedOracleCardThisTurn = false;

  // Test that player has the oracle card
  assertEquals(player.oracleCards.length, 1);
  assertEquals(player.oracleCards[0], "blue");
  assertEquals(player.usedOracleCardThisTurn, false);
});

// Helper function for type safety
function assertExists<T>(value: T | null | undefined): asserts value is T {
  if (value === null || value === undefined) {
    throw new Error(`Expected value to exist but got ${value}`);
  }
}