// Test for the favor system in Quests of Zeus

import { assert, assertEquals, assertFalse } from '@std/assert';
import { GameEngine } from '../src/GameEngine.ts';

Deno.test('Spend Die for Favor - basic functionality', () => {
  const engine = new GameEngine();
  engine.initializeGame();

  const player = engine.getCurrentPlayer();
  assert(player);

  const initialFavor = player.favor;
  const initialDiceCount = player.oracleDice.length;

  // Spend a die for favor
  const dieColor = player.oracleDice[0];
  assert(dieColor);

  // Count how many dice of this color the player has before spending
  const initialColorCount =
    player.oracleDice.filter((color: string) => color === dieColor).length;

  const success = engine.spendDieForFavor(player.id, dieColor);

  assert(success, 'Should successfully spend die for favor');
  assertEquals(player.favor, initialFavor + 2, 'Should gain 2 favor');
  assertEquals(player.oracleDice.length, initialDiceCount - 1);

  // Check that the number of dice of the spent color decreased by 1
  const finalColorCount =
    player.oracleDice.filter((color: string) => color === dieColor).length;
  assertEquals(finalColorCount, initialColorCount - 1);
});

Deno.test('Spend Die for Favor - invalid scenarios', () => {
  const engine = new GameEngine();
  engine.initializeGame();

  const player = engine.getCurrentPlayer();
  assert(player);
  assertEquals(player.favor, 3);

  player.oracleDice = ['blue'];

  assertFalse(engine.spendDieForFavor(player.id, 'red'));
  assertEquals(player.favor, 3);
  assertEquals(player.oracleDice.length, 1);
});

Deno.test('Spend Die for Favor - turn continues after spending', () => {
  const engine = new GameEngine();
  engine.initializeGame();

  const player = engine.getCurrentPlayer();
  assert(player);

  const dieColor = player.oracleDice[0];
  const success = engine.spendDieForFavor(player.id, dieColor!);
  assert(success, 'Should successfully spend die for favor');

  // Verify turn is still in action phase and player can use remaining dice
  const gameState = engine.getGameState();
  assertEquals(gameState.getCurrentPlayer().id, player.id);
  assertEquals(gameState.getPhase(), 'action');
});

Deno.test('Spend recolored die for favor - should use as unrecolored', () => {
  const engine = new GameEngine();
  engine.initializeGame();

  const player = engine.getCurrentPlayer();
  assert(player);
  const existingFavor = player.favor;

  const gameState = engine.getGameState();
  gameState.setSelectedRecoloring(player.id, existingFavor);

  const dieColor = player.oracleDice[0];
  const success = engine.spendDieForFavor(player.id, dieColor!);
  assert(success, 'Should successfully spend die for favor');
  assertEquals(player.favor, existingFavor + 2);
});
