import { assertEquals, assertExists } from "@std/assert";
import { QuestsZeusGameEngine } from "../src/game-engine.ts";

Deno.test("Debug test - check player IDs", () => {
  const engine = new QuestsZeusGameEngine();
  engine.initializeGame();

  const currentPlayer = engine.getCurrentPlayer();

  // Check all players
  const player1 = engine.getPlayer(1);
  assertExists(player1);
  const player2 = engine.getPlayer(2);
  assertExists(player2);

  // This should pass if we're using the correct player
  assertEquals(currentPlayer.id, 1, "Current player should be player 1");
});
