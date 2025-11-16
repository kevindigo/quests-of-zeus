// Tests for cube distribution in the Quests of Zeus game

import { assert, assertEquals } from '@std/assert';
import { HexMap } from '../src/hexmap/HexMap.ts';

Deno.test('Cube distribution - correct number of cube hexes', () => {
  const hexMap = new HexMap();
  const cubeCells = hexMap.getCellsByTerrain('offerings');

  // Should have exactly 6 cube hexes
  assertEquals(cubeCells.length, 6, 'Expected 6 cube hexes');
});

Deno.test('Offerings distribution - offerings hexes have no colors assigned by default', () => {
  const hexMap = new HexMap();
  const cubeCells = hexMap.getCellsByTerrain('offerings');

  // Cube hexes currently don't have colors assigned in the implementation
  // This is the actual behavior - all offerings should have color "none"
  const offeringsWithNoColor = cubeCells.filter((cell) =>
    cell.color === 'none'
  );
  assertEquals(
    offeringsWithNoColor.length,
    cubeCells.length,
    'All offerings hexes should have no color assigned',
  );
});

Deno.test('Offerings distribution - all cube hexes have terrain type offerings', () => {
  const hexMap = new HexMap();
  const cubeCells = hexMap.getCellsByTerrain('offerings');

  // All cube cells should have the correct terrain type
  cubeCells.forEach((cell) => {
    assertEquals(
      cell.terrain,
      'offerings',
      'Cube cell should have offerings terrain',
    );
  });
});

Deno.test('Offerings distribution - integration with HexMap', () => {
  const hexMap = new HexMap();

  // Verify the grid is properly created
  const grid = hexMap.getHexGrid();
  assert(grid);

  // Verify we can find cube cells
  const cubeCells = grid.getCellsOfType('offerings');
  assertEquals(cubeCells.length, 6, 'Should find exactly 6 cube hexes');

  // Verify all cube cells have the correct terrain type and no color assigned
  cubeCells.forEach((cell) => {
    assertEquals(
      cell.terrain,
      'offerings',
      'Cell should have offerings terrain',
    );
    assertEquals(
      cell.color,
      'none',
      'Offerings cell should have no color assigned',
    );
  });
});

Deno.test('Offerings distribution - offerings are distinct from other terrain types', () => {
  const hexMap = new HexMap();

  // Get all cube cells
  const cubeCells = hexMap.getCellsByTerrain('offerings');

  // Get other terrain types that should be distinct
  const templeCells = hexMap.getCellsByTerrain('temple');
  const cityCells = hexMap.getCellsByTerrain('city');
  const monsterCells = hexMap.getCellsByTerrain('monsters');

  // Verify no overlap between cube cells and other special terrain types
  const allSpecialCells = [...templeCells, ...cityCells, ...monsterCells];

  cubeCells.forEach((cubeCell) => {
    const overlappingCell = allSpecialCells.find((otherCell) =>
      cubeCell.q === otherCell.q && cubeCell.r === otherCell.r
    );
    assert(
      !overlappingCell,
      `Cube cell at (${cubeCell.q}, ${cubeCell.r}) should not overlap with other special terrain`,
    );
  });
});
