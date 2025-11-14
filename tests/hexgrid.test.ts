// Tests for the HexGrid class

import { assert, assertArrayIncludes, assertEquals } from '@std/assert';
import type { HexCell } from '../src/hexmap/HexCell.ts';
import { HexGrid } from '../src/hexmap/HexGrid.ts';
import type { TerrainType } from '../src/types.ts';

Deno.test('HexGrid - constructor and basic properties', () => {
  const radius = 3;
  const defaultTerrain: TerrainType = 'sea';
  const grid = new HexGrid(radius, defaultTerrain);

  // Test that grid is created
  assert(grid, 'Grid should be created');
  assertEquals(grid.getRadius(), radius);
});

Deno.test('HexGrid - static generateHexShapedGrid', () => {
  const radius = 2;
  const defaultTerrain: TerrainType = 'sea';

  const grid = HexGrid.generateHexShapedGrid(radius, defaultTerrain);

  // Test grid structure
  assert(Array.isArray(grid), 'Grid should be an array');

  // For radius 2, we should have 5 rows (q from -2 to 2)
  assertEquals(
    grid.length,
    5,
    `Grid should have ${2 * radius + 1} rows for radius ${radius}`,
  );

  // Test that each row has the correct number of cells
  // For radius 2, the row lengths should be: 3, 4, 5, 4, 3
  const expectedRowLengths = [3, 4, 5, 4, 3];
  grid.forEach((row, index) => {
    assertEquals(
      row.length,
      expectedRowLengths[index],
      `Row ${index} should have ${expectedRowLengths[index]} cells`,
    );
  });

  // Test that all cells have the correct structure
  grid.forEach((row, qIndex) => {
    const q = qIndex - radius; // Convert index to q coordinate
    row.forEach((cell) => {
      assert('q' in cell, 'Cell should have q coordinate');
      assert('r' in cell, 'Cell should have r coordinate');
      assert('terrain' in cell, 'Cell should have terrain type');
      assert('color' in cell, 'Cell should have color');

      assertEquals(
        cell.terrain,
        defaultTerrain,
        'Cell should have default terrain',
      );
      assertEquals(cell.color, 'none', 'Cell should have default color');

      // Test that coordinates are within bounds
      const s = -q - cell.r;
      assert(
        q >= -radius && q <= radius,
        `q coordinate ${q} should be within [-${radius}, ${radius}]`,
      );
      assert(
        cell.r >= -radius && cell.r <= radius,
        `r coordinate ${cell.r} should be within [-${radius}, ${radius}]`,
      );
      assert(
        s >= -radius && s <= radius,
        `s coordinate ${s} should be within [-${radius}, ${radius}]`,
      );
    });
  });
});

Deno.test('HexGrid - static hexDistance', () => {
  // Test distance from center
  assertEquals(
    HexGrid.hexDistance(0, 0, 0, 0),
    0,
    'Distance to self should be 0',
  );
  assertEquals(
    HexGrid.hexDistance(0, 0, 1, 0),
    1,
    'Distance to adjacent cell should be 1',
  );
  assertEquals(
    HexGrid.hexDistance(0, 0, 1, -1),
    1,
    'Distance to adjacent cell should be 1',
  );
  assertEquals(
    HexGrid.hexDistance(0, 0, 0, 1),
    1,
    'Distance to adjacent cell should be 1',
  );
  assertEquals(
    HexGrid.hexDistance(0, 0, -1, 1),
    1,
    'Distance to adjacent cell should be 1',
  );
  assertEquals(
    HexGrid.hexDistance(0, 0, -1, 0),
    1,
    'Distance to adjacent cell should be 1',
  );
  assertEquals(
    HexGrid.hexDistance(0, 0, 0, -1),
    1,
    'Distance to adjacent cell should be 1',
  );

  // Test longer distances
  assertEquals(HexGrid.hexDistance(0, 0, 2, 0), 2, 'Distance should be 2');
  assertEquals(HexGrid.hexDistance(0, 0, 1, 1), 2, 'Distance should be 2');
  assertEquals(HexGrid.hexDistance(0, 2, 0, -2), 4, 'Distance should be 4');

  // Test commutative property
  assertEquals(
    HexGrid.hexDistance(1, 2, 3, 4),
    HexGrid.hexDistance(3, 4, 1, 2),
    'Distance should be commutative',
  );
});

Deno.test('HexGrid - forEachCell iteration', () => {
  const radius = 2;
  const defaultTerrain: TerrainType = 'sea';
  const grid = new HexGrid(radius, defaultTerrain);

  let cellCount = 0;
  const visitedCells: HexCell[] = [];

  // Test that forEachCell iterates over all cells
  grid.forEachCell((cell: HexCell) => {
    cellCount++;
    visitedCells.push(cell);

    // Test cell structure
    assert('q' in cell, 'Cell should have q coordinate');
    assert('r' in cell, 'Cell should have r coordinate');
    assert('terrain' in cell, 'Cell should have terrain type');
    assert('color' in cell, 'Cell should have color');

    assertEquals(
      cell.terrain,
      defaultTerrain,
      'Cell should have default terrain',
    );
    assertEquals(cell.color, 'none', 'Cell should have default color');
  });

  // For radius 2, total cells should be 3 + 4 + 5 + 4 + 3 = 19
  const expectedCellCount = 19;
  assertEquals(
    cellCount,
    expectedCellCount,
    `Should iterate over ${expectedCellCount} cells for radius ${radius}`,
  );

  // Test that all visited cells are unique
  const uniqueCells = new Set(
    visitedCells.map((cell) => `${cell.q},${cell.r}`),
  );
  assertEquals(
    uniqueCells.size,
    cellCount,
    'All visited cells should be unique',
  );
});

Deno.test('HexGrid - different terrain types', () => {
  const radius = 1;
  const terrain = 'sea';

  const grid = HexGrid.generateHexShapedGrid(radius, terrain);

  grid.forEach((row) => {
    row.forEach((cell) => {
      assertEquals(
        cell.terrain,
        terrain,
        `All cells should have ${terrain} terrain`,
      );
    });
  });
});

Deno.test('HexGrid - different radius values', () => {
  const radii = [0, 1, 2, 3, 4];
  const defaultTerrain: TerrainType = 'sea';

  radii.forEach((radius) => {
    const grid = HexGrid.generateHexShapedGrid(radius, defaultTerrain);

    // Test grid dimensions
    assertEquals(
      grid.length,
      2 * radius + 1,
      `Grid should have ${2 * radius + 1} rows for radius ${radius}`,
    );

    // Test that all coordinates are within bounds
    grid.forEach((row, qIndex) => {
      const q = qIndex - radius;
      row.forEach((cell) => {
        const s = -q - cell.r;
        assert(
          q >= -radius && q <= radius,
          `q coordinate ${q} should be within bounds`,
        );
        assert(
          cell.r >= -radius && cell.r <= radius,
          `r coordinate ${cell.r} should be within bounds`,
        );
        assert(
          s >= -radius && s <= radius,
          `s coordinate ${s} should be within bounds`,
        );
      });
    });
  });
});

Deno.test('HexGrid - getCellFromGrid', () => {
  const grid = new HexGrid(2, 'sea');
  const center = grid.getCell({ q: 0, r: 0 });
  assert(center);
  assertEquals(center.q, 0);
  assertEquals(center.r, 0);

  const top = grid.getCell({ q: 0, r: -2 });
  assert(top);
  assertEquals(top.q, 0);
  assertEquals(top.r, -2);
});

Deno.test('HexGrid - getCellsOfType', () => {
  const grid = new HexGrid(2, 'sea');
  const center = grid.getCell({ q: 0, r: 0 });
  assert(center);
  center.terrain = 'zeus';
  assertEquals(grid.getCellsOfType('zeus').length, 1);
  assertEquals(grid.getCellsOfType('sea').length, 18);
});

Deno.test('HexGrid - direction and directionVectors', () => {
  assertEquals(HexGrid.getVector(0), { q: 1, r: -1 });
  assertEquals(HexGrid.getVector(1), { q: 1, r: 0 });
  assertEquals(HexGrid.getVector(2), { q: 0, r: 1 });
  assertEquals(HexGrid.getVector(3), { q: -1, r: 1 });
  assertEquals(HexGrid.getVector(4), { q: -1, r: 0 });
  assertEquals(HexGrid.getVector(5), { q: 0, r: -1 });

  assertEquals(HexGrid.getVector(11), { q: 0, r: -1 });
});

Deno.test('HexGrid - getNeighborsFromGrid', () => {
  const grid = new HexGrid(2, 'sea');
  const center = grid.getCell({ q: 0, r: 0 });
  assert(center);
  const neighbors = grid.getNeighborsOf(center);
  assert(neighbors);
  assertEquals(neighbors.length, 6);
  const coordinates = neighbors.map((cell) => {
    return { q: cell.q, r: cell.r };
  });
  for (let direction = 0; direction < 6; ++direction) {
    const expected = HexGrid.getVector(direction);
    assertArrayIncludes(coordinates, [expected]);
  }
});
