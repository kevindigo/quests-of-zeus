// Tests for oracle card spending functionality

import { assert, assertEquals } from "@std/assert";
import { QuestsZeusGameEngine } from "../src/game-engine.ts";
import type { HexColor } from "../src/types.ts";

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

Deno.test("OracleCardSpending - spend for movement", () => {
  const engine = new QuestsZeusGameEngine();
  engine.initializeGame();

  const playerId = 1;
  const player = engine.getPlayer(playerId);
  assertExists(player);

  // Set up deterministic test conditions
  player.oracleCards = ["blue"];
  player.favor = 5;
  player.shipPosition = { q: 0, r: 0 };
  player.usedOracleCardThisTurn = false;

  // Find a reachable blue sea tile
  const gameState = engine.getGameState();
  const blueSeaTiles = gameState.map.getCellsByTerrain("sea").filter(cell => cell.color === "blue");
  
  if (blueSeaTiles.length > 0) {
    const targetTile = blueSeaTiles[0];
    const moveResult = engine.spendOracleCardForMovement(playerId, targetTile.q, targetTile.r, "blue", 0);
    
    assert(moveResult.success, "Should be able to move using oracle card");
    
    // Oracle card should be consumed
    assertEquals(player.oracleCards.includes("blue"), false, "Blue oracle card should be consumed");
    
    // Ship position should be updated
    assertEquals(player.shipPosition, { q: targetTile.q, r: targetTile.r }, "Ship position should be updated");
    
    // Oracle card usage flag should be set
    assertEquals(player.usedOracleCardThisTurn, true, "Oracle card usage flag should be set");
  }
});

Deno.test("OracleCardSpending - spend for favor", () => {
  const engine = new QuestsZeusGameEngine();
  engine.initializeGame();

  const playerId = 1;
  const player = engine.getPlayer(playerId);
  assertExists(player);

  // Set up deterministic test conditions
  player.oracleCards = ["blue"];
  const initialFavor = player.favor;
  player.usedOracleCardThisTurn = false;

  // Test that player can spend oracle card for favor
  const success = engine.spendOracleCardForFavor(playerId, "blue");
  
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

  const playerId = 1;
  const player = engine.getPlayer(playerId);
  assertExists(player);

  // Set up deterministic test conditions
  player.oracleCards = ["blue", "red"];
  player.favor = 5;
  player.shipPosition = { q: 0, r: 0 };
  player.usedOracleCardThisTurn = false;

  // Find reachable sea tiles
  const gameState = engine.getGameState();
  const blueSeaTiles = gameState.map.getCellsByTerrain("sea").filter(cell => cell.color === "blue");
  const redSeaTiles = gameState.map.getCellsByTerrain("sea").filter(cell => cell.color === "red");
  
  if (blueSeaTiles.length > 0 && redSeaTiles.length > 0) {
    const firstTarget = blueSeaTiles[0];
    const secondTarget = redSeaTiles[0];
    
    // First oracle card usage should succeed
    const firstMoveResult = engine.spendOracleCardForMovement(playerId, firstTarget.q, firstTarget.r, "blue", 0);
    assert(firstMoveResult.success, "First oracle card usage should succeed");
    
    // Second oracle card usage should fail
    const secondMoveResult = engine.spendOracleCardForMovement(playerId, secondTarget.q, secondTarget.r, "red", 0);
    assertEquals(secondMoveResult.success, false, "Second oracle card usage should fail");
    
    // Red oracle card should still be available
    assertEquals(player.oracleCards.includes("red"), true, "Red oracle card should still be available");
  }
});

Deno.test("OracleCardSpending - movement with favor spending", () => {
  const engine = new QuestsZeusGameEngine();
  engine.initializeGame();

  const playerId = 1;
  const player = engine.getPlayer(playerId);
  assertExists(player);

  // Set up deterministic test conditions
  player.oracleCards = ["blue"];
  player.favor = 5;
  player.shipPosition = { q: 0, r: 0 };
  player.usedOracleCardThisTurn = false;

  // Find a blue sea tile that requires favor spending to reach
  // This test verifies that oracle cards can be used with favor spending for extended range
  const initialFavor = player.favor;
  
  // Try to move with favor spending (even if not strictly needed)
  const gameState = engine.getGameState();
  const blueSeaTiles = gameState.map.getCellsByTerrain("sea").filter(cell => cell.color === "blue");
  
  if (blueSeaTiles.length > 0) {
    const targetTile = blueSeaTiles[0];
    const moveResult = engine.spendOracleCardForMovement(playerId, targetTile.q, targetTile.r, "blue", 1);
    
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

  const playerId = 1;
  const player = engine.getPlayer(playerId);
  assertExists(player);

  // Player has no oracle cards
  player.oracleCards = [];
  player.usedOracleCardThisTurn = false;

  // Try to use an oracle card that player doesn't have
  const moveResult = engine.spendOracleCardForMovement(playerId, 1, 1, "blue", 0);
  
  assertEquals(moveResult.success, false, "Should not be able to use oracle card without having it");
});

// Helper function for type safety
function assertExists<T>(value: T | null | undefined): asserts value is T {
  if (value === null || value === undefined) {
    throw new Error(`Expected value to exist but got ${value}`);
  }
}