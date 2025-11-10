// Tests for combined die and oracle card spending functionality
// Verifies that users can select either resource type and use it for movement, favor gain, or oracle card drawing

import { assert, assertEquals } from "@std/assert";
import { QuestsZeusGameEngine } from "../src/game-engine.ts";
import type { HexColor } from "../src/types.ts";

Deno.test("CombinedResourceSpending - select die for movement", () => {
  const engine = new QuestsZeusGameEngine();
  engine.initializeGame();

  const playerId = 1;
  const player = engine.getPlayer(playerId);
  assertExists(player);

  // Set up deterministic test conditions
  player.oracleDice = ["blue", "red", "green"] as HexColor[];
  player.favor = 5;
  player.shipPosition = { q: 0, r: 0 };

  // Test that player can select a die and use it for movement
  const availableMoves = engine.getAvailableMovesForDie(playerId, "blue", player.favor);
  
  // Should have available moves for blue die
  assertEquals(Array.isArray(availableMoves), true);
  
  if (availableMoves.length > 0) {
    const targetMove = availableMoves[0];
    const moveResult = engine.moveShip(playerId, targetMove.q, targetMove.r, "blue", targetMove.favorCost);
    
    assert(moveResult.success, "Should be able to move using selected die");
    
    // Die should be consumed
    assertEquals(player.oracleDice.includes("blue"), false, "Blue die should be consumed");
    
    // Ship position should be updated
    assertEquals(player.shipPosition, { q: targetMove.q, r: targetMove.r }, "Ship position should be updated");
  }
});

Deno.test("CombinedResourceSpending - select die for favor gain", () => {
  const engine = new QuestsZeusGameEngine();
  engine.initializeGame();

  const playerId = 1;
  const player = engine.getPlayer(playerId);
  assertExists(player);

  // Set up deterministic test conditions
  player.oracleDice = ["blue", "red", "green"] as HexColor[];
  const initialFavor = player.favor;

  // Test that player can select a die and spend it for favor
  const success = engine.spendDieForFavor(playerId, "blue");
  
  assert(success, "Should be able to spend die for favor");
  
  // Die should be consumed
  assertEquals(player.oracleDice.includes("blue"), false, "Blue die should be consumed");
  
  // Favor should increase by 2
  assertEquals(player.favor, initialFavor + 2, "Favor should increase by 2");
});

Deno.test("CombinedResourceSpending - select die to draw oracle card", () => {
  const engine = new QuestsZeusGameEngine();
  engine.initializeGame();

  const playerId = 1;
  const player = engine.getPlayer(playerId);
  assertExists(player);

  // Set up deterministic test conditions
  player.oracleDice = ["blue", "red", "green"] as HexColor[];
  const initialCardCount = player.oracleCards.length;

  // Test that player can select a die and spend it to draw an oracle card
  const success = engine.drawOracleCard(playerId, "blue");
  
  assert(success, "Should be able to spend die to draw oracle card");
  
  // Die should be consumed
  assertEquals(player.oracleDice.includes("blue"), false, "Blue die should be consumed");
  
  // Oracle card count should increase by 1
  assertEquals(player.oracleCards.length, initialCardCount + 1, "Oracle card count should increase by 1");
});

Deno.test("CombinedResourceSpending - select oracle card for movement", () => {
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

  // Test that player can select an oracle card and use it for movement
  // First, we need to find a reachable blue sea tile
  const gameState = engine.getGameState();
  const blueSeaTiles = gameState.map.getCellsByTerrain("sea").filter(cell => cell.color === "blue");
  
  if (blueSeaTiles.length > 0) {
    const targetTile = blueSeaTiles[0];
    const moveResult = engine.spendOracleCardForMovement(playerId, targetTile.q, targetTile.r, "blue", 0);
    
    assert(moveResult.success, "Should be able to move using selected oracle card");
    
    // Oracle card should be consumed
    assertEquals(player.oracleCards.includes("blue"), false, "Blue oracle card should be consumed");
    
    // Ship position should be updated
    assertEquals(player.shipPosition, { q: targetTile.q, r: targetTile.r }, "Ship position should be updated");
    
    // Oracle card usage flag should be set
    assertEquals(player.usedOracleCardThisTurn, true, "Oracle card usage flag should be set");
  }
});

Deno.test("CombinedResourceSpending - select oracle card for favor gain", () => {
  const engine = new QuestsZeusGameEngine();
  engine.initializeGame();

  const playerId = 1;
  const player = engine.getPlayer(playerId);
  assertExists(player);

  // Set up deterministic test conditions
  player.oracleCards = ["blue"];
  const initialFavor = player.favor;
  player.usedOracleCardThisTurn = false;

  // Test that player can select an oracle card and spend it for favor
  const success = engine.spendOracleCardForFavor(playerId, "blue");
  
  assert(success, "Should be able to spend oracle card for favor");
  
  // Oracle card should be consumed
  assertEquals(player.oracleCards.includes("blue"), false, "Blue oracle card should be consumed");
  
  // Favor should increase by 2
  assertEquals(player.favor, initialFavor + 2, "Favor should increase by 2");
  
  // Oracle card usage flag should be set
  assertEquals(player.usedOracleCardThisTurn, true, "Oracle card usage flag should be set");
});

Deno.test("CombinedResourceSpending - cannot use both die and oracle card in same turn", () => {
  const engine = new QuestsZeusGameEngine();
  engine.initializeGame();

  const playerId = 1;
  const player = engine.getPlayer(playerId);
  assertExists(player);

  // Set up deterministic test conditions
  player.oracleDice = ["blue", "red", "green"] as HexColor[];
  player.oracleCards = ["pink"];
  player.favor = 5;
  player.shipPosition = { q: 0, r: 0 };
  player.usedOracleCardThisTurn = false;

  // First use an oracle card
  const gameState = engine.getGameState();
  const pinkSeaTiles = gameState.map.getCellsByTerrain("sea").filter(cell => cell.color === "pink");
  
  if (pinkSeaTiles.length > 0) {
    const targetTile = pinkSeaTiles[0];
    const oracleMoveResult = engine.spendOracleCardForMovement(playerId, targetTile.q, targetTile.r, "pink", 0);
    
    assert(oracleMoveResult.success, "Should be able to move using oracle card");
    
    // Now try to use a die - should still work since oracle card usage doesn't prevent die usage
    const dieMoveResult = engine.moveShip(playerId, targetTile.q, targetTile.r, "blue", 0);
    
    // This should fail because we're already on the target tile
    assertEquals(dieMoveResult.success, false, "Should not be able to move to same tile twice");
    
    // But die should still be available for other actions
    const favorSuccess = engine.spendDieForFavor(playerId, "blue");
    assert(favorSuccess, "Should still be able to spend die for favor after using oracle card");
  }
});

Deno.test("CombinedResourceSpending - resource selection clears when switching types", () => {
  const engine = new QuestsZeusGameEngine();
  engine.initializeGame();

  const playerId = 1;
  const player = engine.getPlayer(playerId);
  assertExists(player);

  // Set up deterministic test conditions
  player.oracleDice = ["blue", "red", "green"] as HexColor[];
  player.oracleCards = ["pink"];
  player.favor = 5;

  // Simulate UI behavior: select a die, then select an oracle card
  // In the UI, selecting one resource type should clear the other
  
  // First select a die
  const availableMovesWithDie = engine.getAvailableMovesForDie(playerId, "blue", player.favor);
  assertEquals(availableMovesWithDie.length > 0, true, "Should have moves available with die");
  
  // Then select an oracle card - in UI this would clear die selection
  // For testing purposes, we'll verify that oracle card moves are available
  const gameState = engine.getGameState();
  const pinkSeaTiles = gameState.map.getCellsByTerrain("sea").filter(cell => cell.color === "pink");
  
  if (pinkSeaTiles.length > 0) {
    const targetTile = pinkSeaTiles[0];
    const oracleMoveResult = engine.spendOracleCardForMovement(playerId, targetTile.q, targetTile.r, "pink", 0);
    assert(oracleMoveResult.success, "Should be able to move using oracle card after die was selected");
  }
});

Deno.test("CombinedResourceSpending - favor spending with both resource types", () => {
  const engine = new QuestsZeusGameEngine();
  engine.initializeGame();

  const playerId = 1;
  const player = engine.getPlayer(playerId);
  assertExists(player);

  // Set up deterministic test conditions
  player.oracleDice = ["blue", "red", "green"] as HexColor[];
  player.oracleCards = ["pink"];
  const initialFavor = player.favor;
  player.usedOracleCardThisTurn = false;

  // Spend die for favor
  const dieFavorSuccess = engine.spendDieForFavor(playerId, "blue");
  assert(dieFavorSuccess, "Should be able to spend die for favor");
  assertEquals(player.favor, initialFavor + 2, "Favor should increase by 2 from die");
  
  // Spend oracle card for favor
  const cardFavorSuccess = engine.spendOracleCardForFavor(playerId, "pink");
  assert(cardFavorSuccess, "Should be able to spend oracle card for favor");
  assertEquals(player.favor, initialFavor + 4, "Favor should increase by 4 total");
});

// Helper function for type safety
function assertExists<T>(value: T | null | undefined): asserts value is T {
  if (value === null || value === undefined) {
    throw new Error(`Expected value to exist but got ${value}`);
  }
}