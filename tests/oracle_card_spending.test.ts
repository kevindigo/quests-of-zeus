// Tests for oracle card spending functionality

import { assert, assertEquals, assertFalse } from "@std/assert";
import { QuestsZeusGameEngine } from "../src/game-engine.ts";
import { findZeus } from "../src/game-initializer.ts";

Deno.test("OracleCardSpending - basic functionality", () => {
  const engine = new QuestsZeusGameEngine();
  engine.initializeGame();

  const player = engine.getCurrentPlayer();
  assertExists(player);

  // Give player an oracle card
  player.oracleCards = ["blue"];
  player.usedOracleCardThisTurn = false;

  // Test that player has the oracle card
  assertEquals(player.oracleCards.length, 1);
  assertEquals(player.oracleCards[0], "blue");
  assertEquals(player.usedOracleCardThisTurn, false);
});

Deno.test("OracleCardSpending - spend for movement", () => {
  const engine = new QuestsZeusGameEngine();
  engine.initializeGame();

  const player = engine.getCurrentPlayer();
  assertExists(player);

  // Set up deterministic test conditions
  const gameState = engine.getGameState();
  const zeus = findZeus(gameState.map);
  const adjacentSeaHexes = gameState.map.getNeighborsOfType(zeus, gameState.map.getGrid(), "sea");
  const destination = adjacentSeaHexes[0];

  player.oracleCards = [destination.color];
  player.favor = 0;
  player.usedOracleCardThisTurn = false;

  const moveResult = engine.spendOracleCardForMovement(player.id, destination.q, destination.r, destination.color, 0);
  
  assert(moveResult.success, "Should be able to move using oracle card");
  
  // Oracle card should be consumed
  assertFalse(player.oracleCards.includes(destination.color), "Blue oracle card should be consumed");
  
  // Ship position should be updated
  assertEquals(player.shipPosition, { q: destination.q, r: destination.r }, "Ship position should be updated");
  
  // Oracle card usage flag should be set
  assert(player.usedOracleCardThisTurn, "Oracle card usage flag should be set");
});

Deno.test("OracleCardSpending - spend for favor", () => {
  const engine = new QuestsZeusGameEngine();
  engine.initializeGame();

  const player = engine.getCurrentPlayer();
  assertExists(player);

  // Set up deterministic test conditions
  player.oracleCards = ["blue"];
  const initialFavor = player.favor;
  player.usedOracleCardThisTurn = false;

  // Test that player can spend oracle card for favor
  const success = engine.spendOracleCardForFavor(player.id, "blue");
  
  assert(success, "Should be able to spend oracle card for favor");
  
  // Oracle card should be consumed
  assertEquals(player.oracleCards.includes("blue"), false, "Blue oracle card should be consumed");
  
  // Favor should increase by 2
  assertEquals(player.favor, initialFavor + 2, "Favor should increase by 2");
  
  // Oracle card usage flag should be set
  assertEquals(player.usedOracleCardThisTurn, true, "Oracle card usage flag should be set");
});

Deno.test("OracleCardSpending - cannot use more than one oracle card per turn", () => {
  const engine = new QuestsZeusGameEngine();
  engine.initializeGame();

  const player = engine.getCurrentPlayer();
  assertExists(player);

  // Set up deterministic test conditions
  player.oracleCards = ["blue", "red"];
  player.favor = 5;
  // Find a sea hex to start from instead of Zeus hex
  const gameState = engine.getGameState();
  const seaTiles = gameState.map.getCellsByTerrain("sea");
  if (seaTiles.length > 0) {
    player.shipPosition = { q: seaTiles[0].q, r: seaTiles[0].r };
  }
  player.usedOracleCardThisTurn = false;

  // Find reachable sea tiles
  const blueSeaTiles = gameState.map.getCellsByTerrain("sea").filter(cell => cell.color === "blue");
  const redSeaTiles = gameState.map.getCellsByTerrain("sea").filter(cell => cell.color === "red");
  
  if (blueSeaTiles.length > 0 && redSeaTiles.length > 0) {
    const firstTarget = blueSeaTiles[0];
    const secondTarget = redSeaTiles[0];
    
    // First oracle card usage should succeed
    const firstMoveResult = engine.spendOracleCardForMovement(player.id, firstTarget.q, firstTarget.r, "blue", 0);
    assert(firstMoveResult.success, "First oracle card usage should succeed");
    
    // Second oracle card usage should fail
    const secondMoveResult = engine.spendOracleCardForMovement(player.id, secondTarget.q, secondTarget.r, "red", 0);
    assertEquals(secondMoveResult.success, false, "Second oracle card usage should fail");
    
    // Red oracle card should still be available
    assertEquals(player.oracleCards.includes("red"), true, "Red oracle card should still be available");
  }
});

Deno.test("OracleCardSpending - movement with favor spending", () => {
  const engine = new QuestsZeusGameEngine();
  engine.initializeGame();

  const player = engine.getCurrentPlayer();
  assertExists(player);

  // Set up deterministic test conditions
  player.oracleCards = ["blue"];
  player.favor = 5;
  // Find a sea hex to start from instead of Zeus hex
  const gameState = engine.getGameState();
  const seaTiles = gameState.map.getCellsByTerrain("sea");
  if (seaTiles.length > 0) {
    player.shipPosition = { q: seaTiles[0].q, r: seaTiles[0].r };
  }
  player.usedOracleCardThisTurn = false;

  // Find a blue sea tile that requires favor spending to reach
  // This test verifies that oracle cards can be used with favor spending for extended range
  const initialFavor = player.favor;
  
  // Try to move with favor spending (even if not strictly needed)
  const blueSeaTiles = gameState.map.getCellsByTerrain("sea").filter(cell => cell.color === "blue");
  
  if (blueSeaTiles.length > 0) {
    const targetTile = blueSeaTiles[0];
    const moveResult = engine.spendOracleCardForMovement(player.id, targetTile.q, targetTile.r, "blue", 1);
    
    // This should succeed even with favor spending
    assert(moveResult.success, "Should be able to move using oracle card with favor spending");
    
    // Oracle card should be consumed
    assertEquals(player.oracleCards.includes("blue"), false, "Blue oracle card should be consumed");
    
    // Oracle card usage flag should be set
    assertEquals(player.usedOracleCardThisTurn, true, "Oracle card usage flag should be set");
  }
});

Deno.test("OracleCardSpending - cannot use oracle card without having it", () => {
  const engine = new QuestsZeusGameEngine();
  engine.initializeGame();

  const player = engine.getCurrentPlayer();
  assertExists(player);

  // Player has no oracle cards
  player.oracleCards = [];
  player.usedOracleCardThisTurn = false;

  // Try to use an oracle card that player doesn't have
  const moveResult = engine.spendOracleCardForMovement(player.id, 1, 1, "blue", 0);
  
  assertEquals(moveResult.success, false, "Should not be able to use oracle card without having it");
});

// Helper function for type safety
function assertExists<T>(value: T | null | undefined): asserts value is T {
  if (value === null || value === undefined) {
    throw new Error(`Expected value to exist but got ${value}`);
  }
}