// Debug test for oracle card movement
import { assert } from "@std/assert";
import { QuestsZeusGameEngine } from "../src/game-engine.ts";

Deno.test("Debug oracle card movement", () => {
  const engine = new QuestsZeusGameEngine();
  engine.initializeGame();

  const player = engine.getCurrentPlayer();
  console.log("Initial player state:", {
    id: player.id,
    oracleCards: player.oracleCards,
    favor: player.favor,
    shipPosition: player.shipPosition,
    usedOracleCardThisTurn: player.usedOracleCardThisTurn,
  });

  // Set up deterministic test conditions
  player.oracleCards = ["blue"];
  player.favor = 5;
  player.shipPosition = { q: 0, r: 0 };
  player.usedOracleCardThisTurn = false;

  console.log("After setup player state:", {
    oracleCards: player.oracleCards,
    favor: player.favor,
    shipPosition: player.shipPosition,
    usedOracleCardThisTurn: player.usedOracleCardThisTurn,
  });

  // Find a reachable blue sea tile
  const gameState = engine.getGameState();
  const blueSeaTiles = gameState.map.getCellsByTerrain("sea").filter((cell) =>
    cell.color === "blue"
  );
  console.log("Blue sea tiles found:", blueSeaTiles.length);

  if (blueSeaTiles.length > 0) {
    const targetTile = blueSeaTiles[0];
    console.log("Target tile:", targetTile);

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
    console.log("Move result:", moveResult);

    console.log("Player state after move attempt:", {
      oracleCards: player.oracleCards,
      favor: player.favor,
      shipPosition: player.shipPosition,
      usedOracleCardThisTurn: player.usedOracleCardThisTurn,
    });

    assert(moveResult.success, "Should be able to move using oracle card");
  } else {
    console.log("No blue sea tiles found - cannot test movement");
  }
});
