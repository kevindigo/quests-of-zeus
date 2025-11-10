// Integration tests for resource selection behavior
// Tests the interaction between die and oracle card selection and usage

import { assert, assertArrayIncludes, assertEquals, assertFalse } from "@std/assert";
import { QuestsZeusGameEngine } from "../src/game-engine.ts";
import type { HexColor } from "../src/types.ts";

Deno.test("ResourceSelectionIntegration - die and oracle card can be used in same turn", () => {
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
    player.shipPosition = { q: seaTiles[0].q, r: seaTiles[0].r };
  }
  player.usedOracleCardThisTurn = false;

  // First use an oracle card for movement
  const pinkSeaTiles = gameState.map.getCellsByTerrain("sea").filter(cell => cell.color === "pink");
  
  if (pinkSeaTiles.length > 0) {
    const targetTile = pinkSeaTiles[0];
    const oracleMoveResult = engine.spendOracleCardForMovement(player.id, targetTile.q, targetTile.r, "pink", 0);
    
    assert(oracleMoveResult.success, "Should be able to move using oracle card");
    
    // Oracle card should be consumed
    assertEquals(player.oracleCards.includes("pink"), false, "Pink oracle card should be consumed");
    
    // Oracle card usage flag should be set
    assertEquals(player.usedOracleCardThisTurn, true, "Oracle card usage flag should be set");
    
    // Now try to use a die for favor - should still work
    const initialFavor = player.favor;
    const dieFavorResult = engine.spendDieForFavor(player.id, "blue");
    
    assert(dieFavorResult, "Should be able to spend die for favor after using oracle card");
    
    // Die should be consumed
    assertEquals(player.oracleDice.includes("blue"), false, "Blue die should be consumed");
    
    // Favor should increase
    assertEquals(player.favor, initialFavor + 2, "Favor should increase by 2");
  }
});

Deno.test("ResourceSelectionIntegration - cannot use multiple oracle cards in same turn", () => {
  const engine = new QuestsZeusGameEngine();
  engine.initializeGame();

  const player = engine.getCurrentPlayer();
  assertExists(player);

  // Set up deterministic test conditions
  player.oracleCards = ["blue", "red"];
  player.favor = 5;
  player.usedOracleCardThisTurn = false;

  // First oracle card usage should succeed
  const firstResult = engine.spendOracleCardForFavor(player.id, "blue");
  assert(firstResult, `First oracle card usage should succeed`);
  assert(player.usedOracleCardThisTurn, "Oracle card usage flag should be set");
    
  const secondResult = engine.spendOracleCardForFavor(player.id, "red");
  assertFalse(secondResult, "Second oracle card usage should fail");
  // Red oracle card should still be available
  assertArrayIncludes(player.oracleCards, ["red"], "Red oracle card should still be available");
});

Deno.test("ResourceSelectionIntegration - favor spending works with both resource types", () => {
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
  assertEquals(player.favor, initialFavor + 2, "Favor should increase by 2 from die");
  
  // Spend oracle card for favor
  const cardFavorSuccess = engine.spendOracleCardForFavor(player.id, "pink");
  assert(cardFavorSuccess, "Should be able to spend oracle card for favor");
  assertEquals(player.favor, initialFavor + 4, "Favor should increase by 4 total");
  
  // Oracle card usage flag should be set
  assertEquals(player.usedOracleCardThisTurn, true, "Oracle card usage flag should be set");
});

Deno.test("ResourceSelectionIntegration - resource availability after actions", () => {
  const engine = new QuestsZeusGameEngine();
  engine.initializeGame();

  const player = engine.getCurrentPlayer();
  assertExists(player);

  // Set up deterministic test conditions
  player.oracleDice = ["blue", "red", "green"] as HexColor[];
  player.oracleCards = ["pink", "yellow"];
  player.favor = 5;
  // Find a sea hex to start from instead of Zeus hex
  const gameState = engine.getGameState();
  const seaTiles = gameState.map.getCellsByTerrain("sea");
  if (seaTiles.length > 0) {
    player.shipPosition = { q: seaTiles[0].q, r: seaTiles[0].r };
  }
  player.usedOracleCardThisTurn = false;

  const initialDieCount = player.oracleDice.length;
  const initialCardCount = player.oracleCards.length;

  // Use a die for movement
  const availableMoves = engine.getAvailableMovesForDie(player.id, "blue", player.favor);
  
  if (availableMoves.length > 0) {
    const targetMove = availableMoves[0];
    const moveResult = engine.moveShip(player.id, targetMove.q, targetMove.r, "blue", targetMove.favorCost);
    
    assert(moveResult.success, "Should be able to move using die");
    
    // Die should be consumed
    assertEquals(player.oracleDice.length, initialDieCount - 1, "One die should be consumed");
    assertEquals(player.oracleDice.includes("blue"), false, "Blue die should be consumed");
    
    // Oracle cards should remain unchanged
    assertEquals(player.oracleCards.length, initialCardCount, "Oracle cards should remain unchanged");
    assertEquals(player.usedOracleCardThisTurn, false, "Oracle card usage flag should not be set");
  }
});

Deno.test("ResourceSelectionIntegration - end turn resets oracle card usage", () => {
  const engine = new QuestsZeusGameEngine();
  engine.initializeGame();

  const player = engine.getCurrentPlayer();
  assertExists(player);

  // Set up deterministic test conditions
  player.oracleCards = ["blue"];
  player.usedOracleCardThisTurn = true; // Simulate that oracle card was used this turn

  // End turn
  engine.endTurn();

  // Get the player again after end turn (since current player may have changed)
  const updatedPlayer = engine.getPlayer(player.id);
  assertExists(updatedPlayer);

  // Oracle card usage flag should be reset
  assertEquals(updatedPlayer.usedOracleCardThisTurn, false, "Oracle card usage flag should be reset after end turn");
  
  // Oracle card should still be available (if not consumed)
  assertEquals(updatedPlayer.oracleCards.includes("blue"), true, "Oracle card should still be available");
});

Deno.test("ResourceSelectionIntegration - combined resource actions in sequence", () => {
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
    player.shipPosition = { q: seaTiles[0].q, r: seaTiles[0].r };
  }
  player.usedOracleCardThisTurn = false;

  const initialFavor = player.favor;
  const initialDieCount = player.oracleDice.length;
  const initialCardCount = player.oracleCards.length;

  // Sequence of actions:
  // 1. Spend die for favor
  const dieFavorSuccess = engine.spendDieForFavor(player.id, "blue");
  assert(dieFavorSuccess, "Should be able to spend die for favor");
  
  // 2. Use oracle card for movement
  const pinkSeaTiles = gameState.map.getCellsByTerrain("sea").filter(cell => cell.color === "pink");
  
  if (pinkSeaTiles.length > 0) {
    const targetTile = pinkSeaTiles[0];
    const oracleMoveResult = engine.spendOracleCardForMovement(player.id, targetTile.q, targetTile.r, "pink", 0);
    assert(oracleMoveResult.success, "Should be able to move using oracle card");
    
    // 3. Spend another die for favor
    const secondDieFavorSuccess = engine.spendDieForFavor(player.id, "red");
    assert(secondDieFavorSuccess, "Should be able to spend another die for favor");
    
    // Verify final state
    assertEquals(player.favor, initialFavor + 4, "Favor should increase by 4 total (2 from each die)");
    assertEquals(player.oracleDice.length, initialDieCount - 2, "Two dice should be consumed");
    assertEquals(player.oracleCards.length, initialCardCount - 1, "One oracle card should be consumed");
    assertEquals(player.usedOracleCardThisTurn, true, "Oracle card usage flag should be set");
    assertEquals(player.shipPosition, { q: targetTile.q, r: targetTile.r }, "Ship position should be updated");
  }
});

// Helper function for type safety
function assertExists<T>(value: T | null | undefined): asserts value is T {
  if (value === null || value === undefined) {
    throw new Error(`Expected value to exist but got ${value}`);
  }
}