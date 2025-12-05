import { assertEquals } from '@std/assert/equals';
import { GameManager } from '../src/GameManager.ts';
import { COLOR_WHEEL, type CoreColor } from '../src/types.ts';

Deno.test('Statue base distribution - 6 with 3 on each', () => {
  const manager = new GameManager();
  manager.startNewGame();

  const state = manager.getGameState();
  const statueHexes = state.getStatueHexes();

  assertEquals(statueHexes.length, 6);
  statueHexes.forEach((statueHex) => {
    assertEquals(statueHex.emptyBases.length, 3);
  });
});

Deno.test('Statue base distribution - no duplicates on a hex', () => {
  const manager = new GameManager();
  manager.startNewGame();

  const state = manager.getGameState();
  const statueHexes = state.getStatueHexes();

  statueHexes.forEach((statueHex) => {
    const set: Set<CoreColor> = new Set();
    statueHex.emptyBases.forEach((color) => {
      set.add(color);
    });
    assertEquals(set.size, 3);
  });
});

Deno.test('Statue base distribution - exactly 3 of each color in total', () => {
  const manager = new GameManager();
  manager.startNewGame();

  const state = manager.getGameState();
  const statueHexes = state.getStatueHexes();

  const countByColor: Map<CoreColor, number> = new Map();
  statueHexes.forEach((statueHex) => {
    statueHex.emptyBases.forEach((color) => {
      const oldCount = countByColor.get(color) || 0;
      countByColor.set(color, oldCount + 1);
    });
  });
  COLOR_WHEEL.forEach((color) => {
    assertEquals(countByColor.get(color), 3, `Expected 3 of ${color}`);
  });
});
