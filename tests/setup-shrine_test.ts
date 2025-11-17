import { assertEquals } from '@std/assert';
import { QuestsZeusGameEngine } from '../src/game-engine-core.ts';
import { HexMap } from '../src/hexmap/HexMap.ts';
import {
  type HexColor,
  PLAYER_COLORS,
  SHRINE_REWARDS,
  type ShrineReward,
} from '../src/types.ts';

Deno.test('Shrine hex color assignment', () => {
  const hexMap = new HexMap();
  const grid = hexMap.getHexGrid();

  const shrineCells = grid.getCellsOfType('shrine');

  const colorCounts: Record<HexColor, number> = {
    'none': 0,
    'red': 0,
    'pink': 0,
    'blue': 0,
    'black': 0,
    'green': 0,
    'yellow': 0,
  };

  for (const shrineCell of shrineCells) {
    colorCounts[shrineCell.color]++;
  }

  assertEquals(shrineCells.length, 12, 'Should have exactly 12 shrine hexes');

  for (const [color, count] of Object.entries(colorCounts)) {
    if (color !== 'none') {
      assertEquals(count, 2, `Color ${color} should appear exactly twice`);
    }
  }

  assertEquals(colorCounts['none'], 0);
});

Deno.test('Shrine hex - each has a unique face-down shrine foundation', () => {
  const engine = new QuestsZeusGameEngine();
  engine.initializeGame();
  const state = engine.getGameState();
  const shrineHexes = state.getShrineHexes();
  assertEquals(shrineHexes.length, 12);
  for (let i = 0; i < PLAYER_COLORS.length; ++i) {
    const matchingHexes = shrineHexes.filter((hex) => {
      assertEquals(hex.status, 'hidden');
      return hex.owner === PLAYER_COLORS[i];
    });
    assertEquals(matchingHexes.length, 3, `Hex count for ${PLAYER_COLORS[i]}`);
  }
});

Deno.test('Shrine hex - 3 of each reward', () => {
  const engine = new QuestsZeusGameEngine();
  engine.initializeGame();
  const state = engine.getGameState();
  const shrineHexes = state.getShrineHexes();
  SHRINE_REWARDS.forEach((reward) => {
    const hexesWithThisReward = shrineHexes.filter((sh) => {
      return sh.reward === reward;
    });
    assertEquals(hexesWithThisReward.length, 3);
  });
});

Deno.test('Shrine hex - each player has no duplicate rewards', () => {
  const engine = new QuestsZeusGameEngine();
  engine.initializeGame();
  const state = engine.getGameState();
  const shrineHexes = state.getShrineHexes();
  PLAYER_COLORS.forEach((playerColor) => {
    const hexesForThisPlayer = shrineHexes.filter((sh) => {
      return (sh.owner === playerColor);
    });
    const rewards: Set<ShrineReward> = new Set();
    hexesForThisPlayer.forEach((sh) => {
      rewards.add(sh.reward);
    });
    assertEquals(rewards.size, hexesForThisPlayer.length);
  });
});
