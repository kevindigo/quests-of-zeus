// Test for the favor system in Quests of Zeus

import { assert, assertEquals, assertFalse } from '@std/assert';
import {
  assertFailureContains,
  setupGame,
  testGameManager,
  testPlayer,
} from './test-helpers.ts';

Deno.test('Spend Die for Favor - basic functionality', () => {
  setupGame();

  const initialFavor = testPlayer.favor;
  const initialDiceCount = testPlayer.oracleDice.length;

  const dieColor = testPlayer.oracleDice[0];
  assert(dieColor);
  const initialColorCount =
    testPlayer.oracleDice.filter((color: string) => color === dieColor).length;

  testGameManager.setSelectedDieColor(dieColor);

  const result = testGameManager.spendResourceForFavor();

  assert(result.success, 'Should successfully spend die for favor');
  assertEquals(testPlayer.favor, initialFavor + 2, 'Should gain 2 favor');
  assertEquals(testPlayer.oracleDice.length, initialDiceCount - 1);
  assertFalse(testGameManager.getEffectiveSelectedColor());

  const finalColorCount =
    testPlayer.oracleDice.filter((color: string) => color === dieColor).length;
  assertEquals(finalColorCount, initialColorCount - 1);
});

Deno.test('Spend Die for Favor - invalid scenarios', () => {
  setupGame();
  assertEquals(testPlayer.favor, 3);

  testPlayer.oracleDice = ['blue'];
  const nothingSelected = testGameManager.spendResourceForFavor();
  assertFailureContains(nothingSelected, 'select');
  assertEquals(testPlayer.favor, 3);
  assertEquals(testPlayer.oracleDice.length, 1);
});

Deno.test('Spend Die for Favor - turn continues after spending', () => {
  setupGame();
  const dieColor = testPlayer.oracleDice[0];
  assert(dieColor);
  testGameManager.setSelectedDieColor(dieColor);
  const result = testGameManager.spendResourceForFavor();
  assert(result.success, 'Should successfully spend die for favor');

  // Verify turn is still in action phase and player can use remaining dice
  const gameState = testGameManager.getGameState();
  assertEquals(gameState.getCurrentPlayer().id, testPlayer.id);
  assertEquals(gameState.getPhase(), 'action');
});

Deno.test('Spend recolored die for favor - should use as unrecolored', () => {
  setupGame();
  const existingFavor = testPlayer.favor;

  const dieColor = testPlayer.oracleDice[0];
  assert(dieColor);
  testGameManager.setSelectedDieColor(dieColor);
  testGameManager.setSelectedRecoloring(existingFavor);

  const result = testGameManager.spendResourceForFavor();
  assert(result.success, 'Should successfully spend die for favor');
  assertEquals(testPlayer.favor, existingFavor + 2);
});

Deno.test('Spend card for Favor - basic functionality', () => {
  setupGame();
  const initialFavor = testPlayer.favor;
  testPlayer.oracleCards = ['red', 'red', 'blue'];
  const initialCardCount = testPlayer.oracleCards.length;

  const selectedColor = 'red';
  assert(selectedColor);

  const initialColorCount =
    testPlayer.oracleCards.filter((color: string) => color === selectedColor)
      .length;

  testGameManager.setSelectedOracleCardColor(selectedColor);

  const result = testGameManager.spendResourceForFavor();

  assert(result.success, 'Should successfully spend card for favor');
  assertEquals(testPlayer.favor, initialFavor + 2, 'Should gain 2 favor');
  assertEquals(testPlayer.oracleCards.length, initialCardCount - 1);

  const finalColorCount =
    testPlayer.oracleCards.filter((color: string) => color === selectedColor)
      .length;
  assertEquals(finalColorCount, initialColorCount - 1);
});

Deno.test('Spend card for Favor - invalid scenarios', () => {
  setupGame();
  assertEquals(testPlayer.favor, 3);

  testPlayer.oracleCards = ['red'];

  const result = testGameManager.spendResourceForFavor();
  assertFailureContains(result, 'select');
  assertEquals(testPlayer.favor, 3);
  assertEquals(testPlayer.oracleCards.length, 1);
});

Deno.test('Spend card for Favor - turn continues after spending', () => {
  setupGame();
  const selectedColor = 'red';
  testPlayer.oracleCards = [selectedColor];
  testGameManager.setSelectedOracleCardColor(selectedColor);

  const result = testGameManager.spendResourceForFavor();
  assert(result.success, 'Should successfully spend die for favor');

  // Verify turn is still in action phase and player can use remaining dice
  const gameState = testGameManager.getGameState();
  assertEquals(gameState.getCurrentPlayer().id, testPlayer.id);
  assertEquals(gameState.getPhase(), 'action');
});

Deno.test('Spend recolored card for favor - should use as unrecolored', () => {
  setupGame();
  const existingFavor = testPlayer.favor;

  const selectedColor = 'red';
  testPlayer.oracleCards = ['red'];
  testGameManager.setSelectedOracleCardColor(selectedColor);
  testGameManager.setSelectedRecoloring(existingFavor);

  const result = testGameManager.spendResourceForFavor();
  assert(result.success, 'Should successfully spend die for favor');
  assertEquals(testPlayer.favor, existingFavor + 2);
});
