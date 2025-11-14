// Debug test for oracle card movement
import { assert, assertGreater } from '@std/assert';
import { QuestsZeusGameEngine } from '../src/game-engine-core.ts';
import type { CoreColor } from '../src/types.ts';

Deno.test('Debug oracle card movement', () => {
  const engine = new QuestsZeusGameEngine();
  engine.initializeGame();

  const player = engine.getCurrentPlayer();

  // Set up deterministic test conditions
  const gameState = engine.getGameState();
  const map = gameState.map;
  const zeus = map.getZeus();
  const neighbors = map.getHexGrid().getNeighborsOfType(zeus, 'sea');
  assertGreater(neighbors.length, 0);
  const destination = neighbors[0]!;
  const destinationColor = destination.color as CoreColor;
  player.oracleCards = [destinationColor];

  const moveResult = engine.spendOracleCardForMovement(
    player.id,
    destination.q,
    destination.r,
    destinationColor,
    0,
  );

  assert(
    moveResult.success,
    `Should be able to move using oracle card, but ${
      JSON.stringify(moveResult)
    }`,
  );
});
