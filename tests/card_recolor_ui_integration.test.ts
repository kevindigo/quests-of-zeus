import { assert, assertEquals } from '@std/assert';
import { QuestsZeusGameEngine } from '../src/game-engine.ts';

Deno.test('Card recolor UI integration test', () => {
  const gameEngine = new QuestsZeusGameEngine();
  gameEngine.initializeGame();

  const player = gameEngine.getCurrentPlayer();

  // Set up deterministic test conditions
  player.oracleCards = ['black', 'pink', 'blue'];
  player.favor = 5;

  // Clear any recoloring intentions that might exist from initialization
  player.recoloredCards = {};

  // Test that recoloring intentions are properly cleared at end of turn
  const recolorSuccess = gameEngine.setRecolorIntentionForCard(
    player.id,
    'black',
    1,
  );
  assert(
    recolorSuccess,
    'Card recoloring intention should be set successfully',
  );
  assert(
    player.recoloredCards && player.recoloredCards['black'],
    'Recoloring intention should be stored',
  );

  // End turn and verify recoloring intentions are cleared
  gameEngine.endTurn();
  const nextPlayer = gameEngine.getCurrentPlayer();
  assertEquals(
    Object.keys(nextPlayer.recoloredCards || {}).length,
    0,
    'Recoloring intentions should be cleared at end of turn',
  );

  // Test that recoloring affects available moves
  // First, we need to make the original player the current player again
  // by ending turns until we get back to the original player
  while (gameEngine.getCurrentPlayer().id !== player.id) {
    gameEngine.endTurn();
  }

  const currentPlayer = gameEngine.getCurrentPlayer();

  // Set recoloring intention for blue card to become red (3 favor cost)
  const recolorSuccess2 = gameEngine.setRecolorIntentionForCard(
    currentPlayer.id,
    'blue',
    3,
  );
  assert(
    recolorSuccess2,
    'Card recoloring intention should be set successfully',
  );

  // Verify the recoloring intention
  assert(
    currentPlayer.recoloredCards && currentPlayer.recoloredCards['blue'],
    'Recoloring intention should be stored',
  );
  assertEquals(
    currentPlayer.recoloredCards['blue'].newColor,
    'red',
    'Blue should recolor to red with 3 favor',
  );
  assertEquals(
    currentPlayer.recoloredCards['blue'].favorCost,
    3,
    'Recoloring cost should be 3 favor',
  );

  // Test that player can still use other cards without recoloring
  const clearRecolorSuccess = gameEngine.clearRecolorIntentionForCard(
    currentPlayer.id,
    'pink',
  );
  assert(clearRecolorSuccess, 'Clearing recoloring intention should succeed');

  // Verify the recoloring was cleared for pink card
  assertEquals(
    Object.keys(currentPlayer.recoloredCards || {}).length,
    1,
    'Should only have one recoloring intention',
  );
  assert(
    currentPlayer.recoloredCards && currentPlayer.recoloredCards['blue'],
    'Blue card should still have recoloring intention',
  );
});
