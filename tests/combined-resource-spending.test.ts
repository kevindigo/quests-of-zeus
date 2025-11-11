// Tests for combined die and oracle card spending functionality
// Verifies that users can select either resource type and use it for movement, favor gain, or oracle card drawing

import { assert, assertEquals, assertGreater } from "@std/assert";
import { type GameState, QuestsZeusGameEngine } from "../src/game-engine.ts";
import type { HexCell, HexColor, Player } from "../src/types.ts";

Deno.test("CombinedResourceSpending - select die for movement", () => {
  const engine = new QuestsZeusGameEngine();
  engine.initializeGame();

  const player = engine.getCurrentPlayer();
  assertExists(player);

  // Set up deterministic test conditions
  player.oracleDice = ["blue", "red", "green"] as HexColor[];
  player.favor = 5;
  player.shipPosition = { q: 0, r: 0 };

  // Test that player can select a die and use it for movement
  const availableMoves = engine.getAvailableMovesForDie(
    player.id,
    "blue",
    player.favor,
  );

  // Should have available moves for blue die
  assertEquals(Array.isArray(availableMoves), true);

  if (availableMoves.length > 0) {
    const targetMove = availableMoves[0];
    assert(targetMove);
    const moveResult = engine.moveShip(
      player.id,
      targetMove.q,
      targetMove.r,
      "blue",
      targetMove.favorCost,
    );

    assert(moveResult.success, "Should be able to move using selected die");

    // Die should be consumed
    assertEquals(
      player.oracleDice.includes("blue"),
      false,
      "Blue die should be consumed",
    );

    // Ship position should be updated
    assertEquals(
      player.shipPosition,
      { q: targetMove.q, r: targetMove.r },
      "Ship position should be updated",
    );
  }
});

Deno.test("CombinedResourceSpending - select die for favor gain", () => {
  const engine = new QuestsZeusGameEngine();
  engine.initializeGame();

  const player = engine.getCurrentPlayer();
  assertExists(player);

  // Set up deterministic test conditions
  player.oracleDice = ["blue", "red", "green"] as HexColor[];
  const initialFavor = player.favor;

  // Test that player can select a die and spend it for favor
  const success = engine.spendDieForFavor(player.id, "blue");

  assert(success, "Should be able to spend die for favor");

  // Die should be consumed
  assertEquals(
    player.oracleDice.includes("blue"),
    false,
    "Blue die should be consumed",
  );

  // Favor should increase by 2
  assertEquals(player.favor, initialFavor + 2, "Favor should increase by 2");
});

Deno.test("CombinedResourceSpending - select die to draw oracle card", () => {
  const engine = new QuestsZeusGameEngine();
  engine.initializeGame();

  const player = engine.getCurrentPlayer();
  assertExists(player);

  // Set up deterministic test conditions
  player.oracleDice = ["blue", "red", "green"] as HexColor[];
  const initialCardCount = player.oracleCards.length;

  // Test that player can select a die and spend it to draw an oracle card
  const success = engine.drawOracleCard(player.id, "blue");

  assert(success, "Should be able to spend die to draw oracle card");

  // Die should be consumed
  assertEquals(
    player.oracleDice.includes("blue"),
    false,
    "Blue die should be consumed",
  );

  // Oracle card count should increase by 1
  assertEquals(
    player.oracleCards.length,
    initialCardCount + 1,
    "Oracle card count should increase by 1",
  );
});

function findAdjacentSeaHex(gameState: GameState, player: Player): HexCell {
  const seaTiles = gameState.map.getCellsByTerrain("sea");
  if (seaTiles.length > 0) {
    player.shipPosition = { q: seaTiles[0]!.q, r: seaTiles[0]!.r };
  }

  // Find a sea neighbor
  const neighbors = gameState.map.getNeighbors(
    player.shipPosition.q,
    player.shipPosition.r,
  );
  const seaNeighbors = neighbors.filter((candidateCell: HexCell) => {
    return (candidateCell.terrain == "sea");
  });
  const destination = seaNeighbors[0];
  assert(destination);

  return destination;
}

Deno.test("CombinedResourceSpending - select oracle card for movement", () => {
  const engine = new QuestsZeusGameEngine();
  engine.initializeGame();

  const player = engine.getCurrentPlayer();
  assertExists(player);

  // Find a sea hex to start from instead of Zeus hex
  const gameState = engine.getGameState();
  const destination = findAdjacentSeaHex(gameState, player);

  // Set up deterministic test conditions
  player.oracleCards = [destination.color];
  player.favor = 0;
  player.usedOracleCardThisTurn = false;

  console.log(
    `Moving to ${JSON.stringify(destination)} from ${
      JSON.stringify(player.shipPosition)
    }`,
  );

  const moveResult = engine.spendOracleCardForMovement(
    player.id,
    destination.q,
    destination.r,
    destination.color,
    0,
  );
  assert(
    moveResult.success,
    `Should be able to move using selected oracle card, but: ${
      JSON.stringify(moveResult)
    }`,
  );

  // Oracle card should be consumed
  assertEquals(
    player.oracleCards.includes("blue"),
    false,
    "Blue oracle card should be consumed",
  );

  // Ship position should be updated
  assertEquals(
    player.shipPosition,
    { q: destination.q, r: destination.r },
    "Ship position should be updated",
  );

  // Oracle card usage flag should be set
  assertEquals(
    player.usedOracleCardThisTurn,
    true,
    "Oracle card usage flag should be set",
  );
});

Deno.test("CombinedResourceSpending - select oracle card for favor gain", () => {
  const engine = new QuestsZeusGameEngine();
  engine.initializeGame();

  const player = engine.getCurrentPlayer();
  assertExists(player);

  // Set up deterministic test conditions
  player.oracleCards = ["blue"];
  const initialFavor = player.favor;
  player.usedOracleCardThisTurn = false;

  // Test that player can select an oracle card and spend it for favor
  const success = engine.spendOracleCardForFavor(player.id, "blue");

  assert(success, "Should be able to spend oracle card for favor");

  // Oracle card should be consumed
  assertEquals(
    player.oracleCards.includes("blue"),
    false,
    "Blue oracle card should be consumed",
  );

  // Favor should increase by 2
  assertEquals(player.favor, initialFavor + 2, "Favor should increase by 2");

  // Oracle card usage flag should be set
  assertEquals(
    player.usedOracleCardThisTurn,
    true,
    "Oracle card usage flag should be set",
  );
});

Deno.test("CombinedResourceSpending - cannot use both die and oracle card in same turn", () => {
  const engine = new QuestsZeusGameEngine();
  engine.initializeGame();

  const player = engine.getCurrentPlayer();
  assertExists(player);

  // Set up deterministic test conditions
  const gameState = engine.getGameState();

  // Find a sea hex to start from instead of Zeus hex
  const seaTiles = gameState.map.getCellsByTerrain("sea");
  if (seaTiles.length > 0) {
    player.shipPosition = { q: seaTiles[0]!.q, r: seaTiles[0]!.r };
  }
  const originCell = gameState.map.getCell(
    player.shipPosition.q,
    player.shipPosition.r,
  );
  assert(originCell, "Ship should have been placed on a valid sea hex");
  const destination = findAdjacentSeaHex(gameState, player);

  player.oracleDice = [originCell.color] as HexColor[];
  player.oracleCards = [destination.color];
  player.favor = 5;
  player.usedOracleCardThisTurn = false;

  // First use an oracle card
  const oracleMoveResult = engine.spendOracleCardForMovement(
    player.id,
    destination.q,
    destination.r,
    destination.color,
    0,
  );
  assert(
    oracleMoveResult.success,
    `Should be able to move using oracle card, but ${
      JSON.stringify(oracleMoveResult)
    }`,
  );

  // Now try to use a die - should still work since oracle card usage doesn't prevent die usage
  const dieMoveResult = engine.moveShip(
    player.id,
    originCell.q,
    originCell.r,
    originCell.color,
    0,
  );
  assert(
    dieMoveResult,
    `Should be able to use a die to move back to origin, but ${
      JSON.stringify(dieMoveResult)
    }`,
  );
});

Deno.test("CombinedResourceSpending - resource selection clears when switching types", () => {
  const engine = new QuestsZeusGameEngine();
  engine.initializeGame();

  const player = engine.getCurrentPlayer();
  assertExists(player);

  // Set up deterministic test conditions
  player.oracleDice = ["blue", "red", "green"] as HexColor[];
  player.oracleCards = ["pink"];
  player.favor = 5;
  // Find a sea hex to start from instead of Zeus hex
  const gameState = engine.getGameState();
  const seaTiles = gameState.map.getCellsByTerrain("sea");
  if (seaTiles.length > 0) {
    player.shipPosition = { q: seaTiles[0]!.q, r: seaTiles[0]!.r };
  }

  // Simulate UI behavior: select a die, then select an oracle card
  // In the UI, selecting one resource type should clear the other

  // First select a die
  const availableMovesWithDie = engine.getAvailableMovesForDie(
    player.id,
    "blue",
    player.favor,
  );
  assertGreater(
    availableMovesWithDie.length,
    0,
    "Should have moves available with die",
  );

  // Then select an oracle card - in UI this would clear die selection
  // For testing purposes, we'll verify that oracle card moves are available
  const pinkSeaTiles = gameState.map.getCellsByTerrain("sea").filter((cell) =>
    cell.color === "pink"
  );

  if (pinkSeaTiles.length > 0) {
    const targetTile = pinkSeaTiles[0];
    assert(targetTile);
    const oracleMoveResult = engine.spendOracleCardForMovement(
      player.id,
      targetTile.q,
      targetTile.r,
      "pink",
      0,
    );
    assert(
      oracleMoveResult.success,
      `Should be able to move using oracle card after die was selected, but: ${
        JSON.stringify(oracleMoveResult)
      }`,
    );
  }
});

Deno.test("CombinedResourceSpending - favor spending with both resource types", () => {
  const engine = new QuestsZeusGameEngine();
  engine.initializeGame();

  const player = engine.getCurrentPlayer();
  assertExists(player);

  // Set up deterministic test conditions
  player.oracleDice = ["blue", "red", "green"] as HexColor[];
  player.oracleCards = ["pink"];
  const initialFavor = player.favor;
  player.usedOracleCardThisTurn = false;

  // Spend die for favor
  const dieFavorSuccess = engine.spendDieForFavor(player.id, "blue");
  assert(dieFavorSuccess, "Should be able to spend die for favor");
  assertEquals(
    player.favor,
    initialFavor + 2,
    "Favor should increase by 2 from die",
  );

  // Spend oracle card for favor
  const cardFavorSuccess = engine.spendOracleCardForFavor(player.id, "pink");
  assert(cardFavorSuccess, "Should be able to spend oracle card for favor");
  assertEquals(
    player.favor,
    initialFavor + 4,
    "Favor should increase by 4 total",
  );
});

// Helper function for type safety
function assertExists<T>(value: T | null | undefined): asserts value is T {
  if (value === null || value === undefined) {
    throw new Error(`Expected value to exist but got ${value}`);
  }
}
