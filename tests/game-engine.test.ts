// Tests for the Oracle of Delphi game engine

import { assertEquals, assertExists, assert } from "@std/assert";
import { OracleGameEngine } from "../src/game-engine.ts";

Deno.test("GameEngine - initialization", () => {
  const engine = new OracleGameEngine();
  
  // Game should not be initialized by default
  assertEquals(engine.isGameInitialized(), false);
  
  // Initialize the game
  const state = engine.initializeGame();
  
  assertExists(state.map);
  assertEquals(state.players.length, 2);
  assertEquals(state.round, 1);
  assertEquals(state.phase, "setup");

  
  // Now game should be initialized
  assertEquals(engine.isGameInitialized(), true);
});

Deno.test("GameEngine - player creation", () => {
  const engine = new OracleGameEngine();
  
  // Should throw error when game is not initialized
  try {
    engine.getPlayer(1);
    assert(false, "Should have thrown error");
  } catch (error: unknown) {
    assertEquals((error as Error).message, "Game not initialized. Call initializeGame() first.");
  }
  
  // Initialize the game
  engine.initializeGame();
  const player1 = engine.getPlayer(1);
  const player2 = engine.getPlayer(2);
  
  assertExists(player1);
  assertExists(player2);
  assertEquals(player1?.name, "Player 1");
  assertEquals(player2?.name, "Player 2");
  assertEquals(player1?.shipPosition, { q: -1, r: 0 });
  assertEquals(player2?.shipPosition, { q: 1, r: 0 });
  
  // Check that players start with empty storage
  assertEquals(player1?.storage.length, 2);
  assertEquals(player2?.storage.length, 2);
  assertEquals(player1?.storage[0].type, "empty");
  assertEquals(player1?.storage[1].type, "empty");
  assertEquals(player2?.storage[0].type, "empty");
  assertEquals(player2?.storage[1].type, "empty");
});

Deno.test("GameEngine - oracle dice rolling", () => {
  const engine = new OracleGameEngine();
  
  // Should throw error when game is not initialized
  try {
    engine.rollOracleDice(1);
    assert(false, "Should have thrown error");
  } catch (error: unknown) {
    assertEquals((error as Error).message, "Game not initialized. Call initializeGame() first.");
  }
  
  // Initialize the game
  engine.initializeGame();
  
  // Test rolling dice for current player
  const dice = engine.rollOracleDice(1);
  assertEquals(dice.length, 3);
  
  const player = engine.getPlayer(1);
  assertExists(player);
  assertEquals(player?.oracleDice.length, 3);
});

Deno.test("GameEngine - movement validation", () => {
  const engine = new OracleGameEngine();
  
  // Should throw error when game is not initialized
  try {
    engine.getAvailableMoves(1);
    assert(false, "Should have thrown error");
  } catch (error: unknown) {
    assertEquals((error as Error).message, "Game not initialized. Call initializeGame() first.");
  }
  
  // Initialize the game
  engine.initializeGame();
  
  // First roll dice to enter movement phase
  engine.rollOracleDice(1);
  
  // Get available moves
  const availableMoves = engine.getAvailableMoves(1);
  assertExists(availableMoves);
  
  // Should be able to move to adjacent land hexes
  assertEquals(availableMoves.length > 0, true);
});

Deno.test("GameEngine - quest completion", () => {
  const engine = new OracleGameEngine();
  
  // Should throw error when game is not initialized
  try {
    engine.getGameState();
    assert(false, "Should have thrown error");
  } catch (error: unknown) {
    assertEquals((error as Error).message, "Game not initialized. Call initializeGame() first.");
  }
  
  // Initialize the game
  engine.initializeGame();
  const state = engine.getGameState();
  

  
  // Check that players start with 0 completed quests
  const player1 = engine.getPlayer(1);
  assertExists(player1);
  assertEquals(player1.completedQuests, 0);
});

Deno.test("GameEngine - win condition", () => {
  const engine = new OracleGameEngine();
  
  // Should throw error when game is not initialized
  try {
    engine.checkWinCondition();
    assert(false, "Should have thrown error");
  } catch (error: unknown) {
    assertEquals((error as Error).message, "Game not initialized. Call initializeGame() first.");
  }
  
  // Initialize the game
  engine.initializeGame();
  
  // Initially no winner
  const winCondition = engine.checkWinCondition();
  assertEquals(winCondition.gameOver, false);
  assertEquals(winCondition.winner, null);
});

Deno.test("GameEngine - storage system", () => {
  const engine = new OracleGameEngine();
  engine.initializeGame();
  
  const player = engine.getPlayer(1);
  assertExists(player);
  
  // Check initial empty storage
  assertEquals(player.storage.length, 2);
  assertEquals(player.storage[0].type, "empty");
  assertEquals(player.storage[1].type, "empty");
  

});