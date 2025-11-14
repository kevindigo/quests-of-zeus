// Simple test to debug oracle card movement
import { assert } from '@std/assert';
import { QuestsZeusGameEngine } from '../src/game-engine-core.ts';

Deno.test('Simple oracle card test', () => {
  const engine = new QuestsZeusGameEngine();
  engine.initializeGame();

  const player = engine.getCurrentPlayer();

  // Give player an oracle card
  player.oracleCards = ['blue'];
  player.favor = 5;
  player.usedOracleCardThisTurn = false;

  // Try to use oracle card for favor (simpler test)
  const favorResult = engine.spendOracleCardForFavor(player.id, 'blue');

  assert(favorResult, 'Should be able to spend oracle card for favor');
});
