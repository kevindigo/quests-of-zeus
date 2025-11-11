// Debug test for oracle card movement
import { assert, assertGreater } from "@std/assert";
import { QuestsZeusGameEngine } from "../src/game-engine.ts";

Deno.test("Debug oracle card movement", () => {
  const engine = new QuestsZeusGameEngine();
  engine.initializeGame();

  const player = engine.getCurrentPlayer();

  // Set up deterministic test conditions
  player.oracleCards = ["blue"];
  player.favor = 5;
  player.shipPosition = { q: 0, r: 0 };
  player.usedOracleCardThisTurn = false;

  // Find a reachable blue sea tile
  const gameState = engine.getGameState();
  const blueSeaTiles = gameState.map.getCellsByTerrain("sea").filter((cell) =>
    cell.color === "blue"
  );

  assertGreater(blueSeaTiles.length, 0);
  const targetTile = blueSeaTiles[0];

  if (!targetTile) {
    throw new Error("Target tile not found");
  }
  const moveResult = engine.spendOracleCardForMovement(
    player.id,
    targetTile.q,
    targetTile.r,
    "blue",
    0,
  );

  assert(
    moveResult.success,
    `Should be able to move using oracle card, but ${
      JSON.stringify(moveResult)
    }`,
  );
});
