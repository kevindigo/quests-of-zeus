// Test for the favor system in Quests of Zeus

import { assert, assertEquals, assertFalse } from '@std/assert';
import {
  assertFailureContains,
  setupGame,
  xEngine,
  xPlayer,
  xState,
} from './test-helpers.ts';

Deno.test('Spend Die for Favor - basic functionality', () => {
  setupGame();

  const initialFavor = xPlayer.favor;
  const initialDiceCount = xPlayer.oracleDice.length;

  const dieColor = xPlayer.oracleDice[0];
  assert(dieColor);
  const initialColorCount =
    xPlayer.oracleDice.filter((color: string) => color === dieColor).length;

  xState.setSelectedDieColor(dieColor);

  const result = xEngine.spendResourceForFavor();

  assert(result.success, 'Should successfully spend die for favor');
  assertEquals(xPlayer.favor, initialFavor + 2, 'Should gain 2 favor');
  assertEquals(xPlayer.oracleDice.length, initialDiceCount - 1);
  assertFalse(xState.getEffectiveSelectedColor());

  const finalColorCount =
    xPlayer.oracleDice.filter((color: string) => color === dieColor).length;
  assertEquals(finalColorCount, initialColorCount - 1);
});

Deno.test('Spend Die for Favor - invalid scenarios', () => {
  setupGame();
  assertEquals(xPlayer.favor, 3);

  xPlayer.oracleDice = ['blue'];
  const nothingSelected = xEngine.spendResourceForFavor();
  assertFailureContains(nothingSelected, 'select');
  assertEquals(xPlayer.favor, 3);
  assertEquals(xPlayer.oracleDice.length, 1);
});

Deno.test('Spend Die for Favor - turn continues after spending', () => {
  setupGame();
  const dieColor = xPlayer.oracleDice[0];
  assert(dieColor);
  xState.setSelectedDieColor(dieColor);
  const result = xEngine.spendResourceForFavor();
  assert(result.success, 'Should successfully spend die for favor');

  // Verify turn is still in action phase and player can use remaining dice
  const gameState = xEngine.getGameState();
  assertEquals(gameState.getCurrentPlayer().id, xPlayer.id);
  assertEquals(gameState.getPhase(), 'action');
});

Deno.test('Spend recolored die for favor - should use as unrecolored', () => {
  setupGame();
  const existingFavor = xPlayer.favor;

  const dieColor = xPlayer.oracleDice[0];
  assert(dieColor);
  xState.setSelectedDieColor(dieColor);
  xState.setSelectedRecoloring(xPlayer.id, existingFavor);

  const result = xEngine.spendResourceForFavor();
  assert(result.success, 'Should successfully spend die for favor');
  assertEquals(xPlayer.favor, existingFavor + 2);
});

Deno.test('Spend card for Favor - basic functionality', () => {
  setupGame();
  const initialFavor = xPlayer.favor;
  xPlayer.oracleCards = ['red', 'red', 'blue'];
  const initialCardCount = xPlayer.oracleCards.length;

  const selectedColor = 'red';
  assert(selectedColor);

  const initialColorCount =
    xPlayer.oracleCards.filter((color: string) => color === selectedColor)
      .length;

  xState.setSelectedOracleCardColor(selectedColor);

  const result = xEngine.spendResourceForFavor();

  assert(result.success, 'Should successfully spend card for favor');
  assertEquals(xPlayer.favor, initialFavor + 2, 'Should gain 2 favor');
  assertEquals(xPlayer.oracleCards.length, initialCardCount - 1);

  const finalColorCount =
    xPlayer.oracleCards.filter((color: string) => color === selectedColor)
      .length;
  assertEquals(finalColorCount, initialColorCount - 1);
});

Deno.test('Spend card for Favor - invalid scenarios', () => {
  setupGame();
  assertEquals(xPlayer.favor, 3);

  xPlayer.oracleCards = ['red'];

  const result = xEngine.spendResourceForFavor();
  assertFailureContains(result, 'select');
  assertEquals(xPlayer.favor, 3);
  assertEquals(xPlayer.oracleCards.length, 1);
});

Deno.test('Spend card for Favor - turn continues after spending', () => {
  setupGame();
  const selectedColor = 'red';
  xPlayer.oracleCards = [selectedColor];
  xState.setSelectedOracleCardColor(selectedColor);

  const result = xEngine.spendResourceForFavor();
  assert(result.success, 'Should successfully spend die for favor');

  // Verify turn is still in action phase and player can use remaining dice
  const gameState = xEngine.getGameState();
  assertEquals(gameState.getCurrentPlayer().id, xPlayer.id);
  assertEquals(gameState.getPhase(), 'action');
});

Deno.test('Spend recolored card for favor - should use as unrecolored', () => {
  setupGame();
  const existingFavor = xPlayer.favor;

  const gameState = xEngine.getGameState();

  const selectedColor = 'red';
  xPlayer.oracleCards = ['red'];
  xState.setSelectedOracleCardColor(selectedColor);
  gameState.setSelectedRecoloring(xPlayer.id, existingFavor);

  const result = xEngine.spendResourceForFavor();
  assert(result.success, 'Should successfully spend die for favor');
  assertEquals(xPlayer.favor, existingFavor + 2);
});
