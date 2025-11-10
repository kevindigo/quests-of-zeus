import { assertEquals } from "@std/assert";
import { QuestsZeusGameEngine } from "../src/game-engine.ts";

Deno.test("Debug test - check player IDs", () => {
  const engine = new QuestsZeusGameEngine();
  engine.initializeGame();

  const currentPlayer = engine.getCurrentPlayer();
  console.log("Current player ID:", currentPlayer.id);
  console.log("Current player name:", currentPlayer.name);
  
  // Check all players
  const player1 = engine.getPlayer(1);
  const player2 = engine.getPlayer(2);
  
  console.log("Player 1 exists:", !!player1);
  console.log("Player 2 exists:", !!player2);
  
  if (player1) {
    console.log("Player 1 ID:", player1.id);
  }
  if (player2) {
    console.log("Player 2 ID:", player2.id);
  }
  
  // This should pass if we're using the correct player
  assertEquals(currentPlayer.id, 1, "Current player should be player 1");
});