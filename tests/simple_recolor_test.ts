import { assert, assertEquals } from "https://deno.land/std@0.178.0/testing/asserts.ts";
import { QuestsZeusGameEngine } from "../src/game-engine.ts";

Deno.test("Simple recolor test", () => {
  const gameEngine = new QuestsZeusGameEngine();
  gameEngine.initializeGame();

  const player = gameEngine.getCurrentPlayer();

  // Set up deterministic test conditions
  player.oracleDice = ["black", "pink", "blue"];
  player.favor = 3;

  // Clear any recoloring intentions that might exist from initialization
  player.recoloredDice = {};

  // Check initial player state
  assertEquals(player.favor, 3);
  assertEquals(player.oracleDice, ["black", "pink", "blue"]);
  assertEquals(Object.keys(player.recoloredDice).length, 0);

  // Set a high recoloring cost that would make some moves unaffordable
  const highRecolorSuccess = gameEngine.setRecolorIntention(player.id, "black", 2); // 2 favor recoloring cost
  assert(highRecolorSuccess, "Recoloring intention should be set successfully");
  assertEquals(player.favor, 3);

  // Test the new getAvailableMovesForDie method
  const movesForBlack = gameEngine.getAvailableMovesForDie(player.id, "black", player.favor);

  // Check each move's affordability
  for (const move of movesForBlack) {
    const totalCost = move.favorCost + 2; // movement favor + recoloring cost
    const canAfford = totalCost <= player.favor;

    assert(
      canAfford,
      `Move to (${move.q}, ${move.r}) with total cost ${totalCost} should be affordable with player favor ${player.favor}`
    );
  }
});
