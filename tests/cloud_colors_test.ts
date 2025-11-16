import { assertEquals } from '@std/assert';
import { HexMap } from '../src/hexmap/HexMap.ts';
import type { HexColor } from '../src/types.ts';

Deno.test('Shrine hex color assignment', () => {
  const hexMap = new HexMap();
  const grid = hexMap.getHexGrid();

  // Find all shrine hexes
  const shrineHexes: { q: number; r: number; color: HexColor }[] = [];
  grid.forEachCell((cell) => {
    if (cell && cell.terrain === 'shrine') {
      shrineHexes.push({
        q: cell.q,
        r: cell.r,
        color: cell.color,
      });
    }
  });

  // Count colors
  const colorCounts: Record<HexColor, number> = {
    'none': 0,
    'red': 0,
    'pink': 0,
    'blue': 0,
    'black': 0,
    'green': 0,
    'yellow': 0,
  };

  for (const shrineHex of shrineHexes) {
    colorCounts[shrineHex.color]++;
  }

  // Verify that we have exactly 12 hrine hexes
  assertEquals(shrineHexes.length, 12, 'Should have exactly 12 shrine hexes');

  // Verify that each color appears exactly twice (except "none")
  for (const [color, count] of Object.entries(colorCounts)) {
    if (color !== 'none') {
      assertEquals(count, 2, `Color ${color} should appear exactly twice`);
    }
  }

  // Verify that no shrine hex has "none" color
  assertEquals(
    colorCounts['none'],
    0,
    "No shrine hex should have 'none' color",
  );
});
