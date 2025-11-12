#!/usr/bin/env -S deno run --allow-read

import { assert, assertEquals } from '@std/assert';
import { HexMap } from '../src/hexmap.ts';

// Test the new Zeus placement logic
Deno.test('Zeus placement - randomly in neighbor hexes', () => {
  const hexMap = new HexMap();

  // Get all Zeus cells
  const zeusCells = hexMap.getCellsByTerrain('zeus');

  // Should have exactly 1 Zeus cell
  assertEquals(zeusCells.length, 1, 'Should have exactly 1 Zeus cell');

  const zeusCell = zeusCells[0];

  // Zeus should not be at the center (0, 0)
  assert(zeusCell);
  assertEquals(
    zeusCell.q !== 0 || zeusCell.r !== 0,
    true,
    'Zeus should not be at the center (0, 0)',
  );

  // Zeus should be in one of the 6 neighbor positions around the center
  const validZeusPositions = [
    [1, 0],
    [1, -1],
    [0, -1],
    [-1, 0],
    [-1, 1],
    [0, 1],
  ];

  const isValidPosition = validZeusPositions.some(
    ([q, r]) => zeusCell.q === q && zeusCell.r === r,
  );

  assertEquals(
    isValidPosition,
    true,
    `Zeus should be in one of the 6 neighbor positions, but was at (${zeusCell.q}, ${zeusCell.r})`,
  );

  // The center cell (0, 0) should exist
  const centerCell = hexMap.getCell(0, 0);
  assertEquals(
    centerCell !== null,
    true,
    'Center cell should exist',
  );
});

// Test multiple map generations to ensure random placement
Deno.test('Zeus placement - multiple generations', () => {
  const positions = new Set<string>();
  const validPositions = [
    '1,0',
    '1,-1',
    '0,-1',
    '-1,0',
    '-1,1',
    '0,1',
  ];

  // Generate multiple maps to test randomness
  for (let i = 0; i < 20; i++) {
    const hexMap = new HexMap();
    const zeusCells = hexMap.getCellsByTerrain('zeus');

    assertEquals(zeusCells.length, 1, 'Should have exactly 1 Zeus cell');

    const zeusCell = zeusCells[0];
    assert(zeusCell);
    const positionKey = `${zeusCell.q},${zeusCell.r}`;
    positions.add(positionKey);

    // Verify it's a valid position
    assertEquals(
      validPositions.includes(positionKey),
      true,
      `Zeus should be in one of the 6 valid positions, but was at (${zeusCell.q}, ${zeusCell.r})`,
    );
  }

  // With 20 generations, we should see multiple different positions
  // (though it's theoretically possible to get the same position 20 times, it's very unlikely)
  assertEquals(
    positions.size >= 2,
    true,
    'With 20 generations, Zeus should appear in at least 2 different positions',
  );
});
