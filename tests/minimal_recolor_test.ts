import { assert } from '@std/assert/assert';
import { assertEquals } from '@std/assert/equals';
import { QuestsZeusGameEngine } from '../src/game-engine-core.ts';
import type { CoreColor } from '../src/types.ts';

Deno.test('Minimal recolor test', () => {
  const gameEngine = new QuestsZeusGameEngine();
  gameEngine.initializeGame();

  const player = gameEngine.getCurrentPlayer();

  // Set up deterministic test conditions matching the failing test
  player.oracleDice = ['black', 'pink', 'blue'] as CoreColor[];
  player.favor = 5;

  // Clear any recoloring intentions that might exist from initialization
  player.setRecolorIntention(0);

  // Initial conditions
  assertEquals(player.favor, 5);
  assertEquals(player.oracleDice, ['black', 'pink', 'blue']);
  assertEquals(player.getRecolorIntention(), 0);

  // Set a high recoloring cost that would make some moves unaffordable
  player.favor = 3; // Reduce favor
  const highRecolorSuccess = gameEngine.setRecolorIntention(
    player.id,
    2,
  ); // 2 favor recoloring cost

  // Check recolor intention was set successfully
  assert(highRecolorSuccess);
  assertEquals(player.favor, 3);

  const movesWithHighRecolor = gameEngine.getAvailableMovesForDie(
    player.id,
    'black',
    player.favor,
  );

  // Check moves validity
  for (const move of movesWithHighRecolor) {
    const totalCost = move.favorCost + 2; // movement favor + recoloring cost
    const canAfford = totalCost <= player.favor;

    assert(
      canAfford,
      `Move to (${move.q}, ${move.r}) with total cost ${totalCost} is not affordable with player favor ${player.favor}`,
    );
  }
});
