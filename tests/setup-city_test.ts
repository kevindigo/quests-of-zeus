import { assertGreaterOrEqual } from '@std/assert';
import { GameEngine } from '../src/GameEngine.ts';

// NOTE: This test is not deterministic, but if it ever fails, that's a problem
Deno.test('Cities - must have 2 adjacent sea spaces', () => {
  const engine = new GameEngine();
  const state = engine.getGameState();
  const map = state.getMap();
  const grid = map.getHexGrid();

  const cityCells = grid.getCellsOfType('city');
  cityCells.forEach((cityCell) => {
    const neighbors = grid.getNeighborsOfType(cityCell, 'sea');
    assertGreaterOrEqual(
      neighbors.length,
      2,
      'City should have 2+ sea neighbors',
    );
  });
});
