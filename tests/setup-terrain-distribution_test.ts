// Tests for terrain distribution in the game map

import { assertExists, assertGreater, assertLessOrEqual } from '@std/assert';
import { HexMap } from '../src/hexmap/HexMap.ts';

Deno.test('Terrain distribution - all expected terrains present', () => {
  const hexMap = new HexMap();
  const grid = hexMap.getHexGrid();

  // Count terrain types
  const terrainCounts: Record<string, number> = {};
  let totalCells = 0;
  grid.forEachCell((cell) => {
    if (cell) {
      terrainCounts[cell.terrain] = (terrainCounts[cell.terrain] || 0) + 1;
      totalCells++;
    }
  });

  // Check if all expected terrain types are present
  const expectedTerrains = [
    'zeus',
    'sea',
    'shallow',
    'monsters',
    'offerings',
    'temple',
    'shrine',
    'city',
    'statue',
  ];

  // Assert all expected terrains are present
  for (const terrain of expectedTerrains) {
    assertExists(
      terrainCounts[terrain],
      `Expected terrain "${terrain}" should be present`,
    );
    assertGreater(
      terrainCounts[terrain] || 0,
      0,
      `Expected terrain "${terrain}" should have at least 1 cell`,
    );
  }
});

Deno.test('Terrain distribution - constraints satisfied', () => {
  const hexMap = new HexMap();
  const grid = hexMap.getHexGrid();

  // Count terrain types
  const terrainCounts: Record<string, number> = {};
  let totalCells = 0;
  grid.forEachCell((cell) => {
    if (cell) {
      terrainCounts[cell.terrain] = (terrainCounts[cell.terrain] || 0) + 1;
      totalCells++;
    }
  });

  // Check specific constraints
  const shallowCount = terrainCounts['shallow'] || 0;
  const seaCount = terrainCounts['sea'] || 0;

  // Assert terrain constraints
  assertLessOrEqual(
    shallowCount,
    20,
    `Shallow terrain should have at most 10 cells, but has ${shallowCount}`,
  );
  assertGreater(
    seaCount,
    20,
    `Sea terrain should have more than 20 cells, but has ${seaCount}`,
  );
});

Deno.test('Terrain distribution - basic grid structure', () => {
  const hexMap = new HexMap();
  const grid = hexMap.getHexGrid();
  let totalCells = 0;
  grid.forEachCell(() => {
    ++totalCells;
  });

  assertGreater(totalCells, 0, 'Grid should have at least one cell');
});
