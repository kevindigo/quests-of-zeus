import { assertEquals, assertExists } from '@std/assert';
import { QuestsZeusGameEngine } from '../src/game-engine-core.ts';

Deno.test('Debug test - check player IDs', () => {
  const engine = new QuestsZeusGameEngine();
  engine.initializeGame();

  const currentPlayer = engine.getCurrentPlayer();

  // Check all players
  const player1 = engine.getPlayer(0);
  assertExists(player1);
  const player2 = engine.getPlayer(0);
  assertExists(player2);

  // This should pass if we're using the correct player
  assertEquals(currentPlayer.id, 0, 'Current player should be player 0');
});
