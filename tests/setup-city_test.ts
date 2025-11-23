import { assertGreaterOrEqual } from '@std/assert';
import { GameManager } from '../src/GameManager.ts';

// NOTE: This test is not deterministic, but if it ever fails, that's a problem
Deno.test('Cities - must have 2 adjacent sea spaces', () => {
  const engine = new GameManager();
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
