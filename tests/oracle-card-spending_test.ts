// Tests for oracle card spending functionality

import { assert, assertEquals, assertFalse } from '@std/assert';
import { GameEngine } from '../src/GameEngine.ts';

Deno.test('OracleCardSpending - spend for favor', () => {
  const engine = new GameEngine();
  engine.initializeGame();

  const player = engine.getCurrentPlayer();
  assert(player);

  player.oracleCards = ['blue', 'blue'];
  const initialFavor = player.favor;
  player.usedOracleCardThisTurn = false;

  const success = engine.spendOracleCardForFavor(player.id, 'blue');

  assert(success, 'Should be able to spend oracle card for favor');

  assertEquals(player.oracleCards.length, 1);
  assert(player.oracleCards.includes('blue'));
  assertEquals(player.usedOracleCardThisTurn, true);

  assertEquals(player.favor, initialFavor + 2, 'Favor should increase by 2');
});

Deno.test('OracleCardSpending - cannot use more than one oracle card per turn', () => {
  const engine = new GameEngine();
  engine.initializeGame();

  const player = engine.getCurrentPlayer();
  assert(player);

  player.oracleCards = ['blue', 'red'];
  player.usedOracleCardThisTurn = true;

  assertFalse(engine.spendOracleCardForFavor(player.id, 'red'));
});
