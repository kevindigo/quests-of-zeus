import { assert, assertEquals } from '@std/assert';
import { QuestsZeusGameEngine } from '../src/game-engine-core.ts';

Deno.test('Card recolor test', () => {
  const gameEngine = new QuestsZeusGameEngine();
  gameEngine.initializeGame();

  const player = gameEngine.getCurrentPlayer();

  // Set up deterministic test conditions
  player.oracleCards = ['black', 'pink', 'blue'];
  player.favor = 3;

  // Clear any recoloring intentions that might exist from initialization
  player.recoloredCards = {};

  // Check initial player state
  assertEquals(player.favor, 3);
  assertEquals(player.oracleCards, ['black', 'pink', 'blue']);
  assertEquals(Object.keys(player.recoloredCards || {}).length, 0);

  // Test recoloring intention for oracle card
  const recolorSuccess = gameEngine.setRecolorIntentionForCard(
    player.id,
    'black',
    1,
  ); // 1 favor recoloring cost
  assert(
    recolorSuccess,
    'Card recoloring intention should be set successfully',
  );
  assertEquals(player.favor, 3); // Favor should not be spent until card is used

  // Verify recoloring intention was stored
  assert(
    player.recoloredCards && player.recoloredCards['black'],
    'Recoloring intention should be stored',
  );
  assertEquals(
    player.recoloredCards['black'].newColor,
    'pink',
    'Black should recolor to pink with 1 favor',
  );
  assertEquals(
    player.recoloredCards['black'].favorCost,
    1,
    'Recoloring cost should be 1 favor',
  );

  // Test clearing recoloring intention
  const clearSuccess = gameEngine.clearRecolorIntentionForCard(
    player.id,
    'black',
  );
  assert(
    clearSuccess,
    'Card recoloring intention should be cleared successfully',
  );
  assertEquals(
    Object.keys(player.recoloredCards || {}).length,
    0,
    'Recoloring intention should be cleared',
  );

  // Test recoloring with multiple favor
  const multiRecolorSuccess = gameEngine.setRecolorIntentionForCard(
    player.id,
    'black',
    2,
  ); // 2 favor recoloring cost
  assert(
    multiRecolorSuccess,
    'Multi-favor card recoloring should be set successfully',
  );
  assert(
    player.recoloredCards && player.recoloredCards['black'],
    'Multi-favor recoloring intention should be stored',
  );
  assertEquals(
    player.recoloredCards['black'].newColor,
    'blue',
    'Black should recolor to blue with 2 favor',
  );
  assertEquals(
    player.recoloredCards['black'].favorCost,
    2,
    'Recoloring cost should be 2 favor',
  );

  // Test recoloring with wrap-around
  // First give the player a red card
  player.oracleCards.push('red');
  const wrapRecolorSuccess = gameEngine.setRecolorIntentionForCard(
    player.id,
    'red',
    1,
  ); // 1 favor recoloring cost
  assert(
    wrapRecolorSuccess,
    'Wrap-around card recoloring should be set successfully',
  );
  assert(
    player.recoloredCards && player.recoloredCards['red'],
    'Wrap-around recoloring intention should be stored',
  );
  assertEquals(
    player.recoloredCards['red'].newColor,
    'black',
    'Red should recolor to black with 1 favor (wrap around)',
  );
});
