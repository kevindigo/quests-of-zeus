#!/usr/bin/env -S deno run --allow-read

import { assert, assertEquals, assertFalse } from '@std/assert';
import { HexMap } from '../src/hexmap/HexMap.ts';

// Test the sea-to-shallows conversion functionality
Deno.test('Sea to shallows conversion - basic functionality', () => {
  const hexMap = new HexMap();
  const grid = hexMap.getHexGrid();

  // Count terrain distribution
  const terrainCounts: Record<string, number> = {};
  grid.forEachCell((cell) => {
    if (cell) {
      terrainCounts[cell.terrain] = (terrainCounts[cell.terrain] || 0) + 1;
    }
  });

  const shallowCount = terrainCounts['shallow'] || 0;
  // Sea count variable intentionally unused for debugging
  // const seaCount = terrainCounts["sea"] || 0;

  // After sea-to-shallows conversion, we should have between 0 and 10 shallows
  // (we make 10 attempts on random sea hexes)
  assertEquals(
    shallowCount <= 10,
    true,
    'Should have between 0 and 10 shallows after sea-to-shallows conversion',
  );

  // If there are shallow cells, verify they all meet the constraints
  if (shallowCount > 0) {
    // Find all shallow cells
    const shallowCells = grid.getCellsOfType('shallow');

    // Verify each shallow cell meets the constraints
    for (const shallowCell of shallowCells) {
      // 1. Should not have zeus as neighbor
      const hasZeusNeighborCheck = grid.hasNeighborOfType(
        shallowCell,
        'zeus',
      );
      assertEquals(
        hasZeusNeighborCheck,
        false,
        `Shallow cell at (${shallowCell.q}, ${shallowCell.r}) should not have zeus neighbor`,
      );

      // Check all neighbors of the shallow cell
      // To properly test the constraints, we need to simulate what the state was
      // during the conversion by temporarily converting the shallow cell back to sea
      // and then checking if it would pass the eligibility criteria

      // Temporarily convert back to sea for constraint checking
      const originalTerrain = shallowCell.terrain;
      const originalColor = shallowCell.color;
      shallowCell.terrain = 'sea';
      shallowCell.color = originalColor !== 'none' ? originalColor : 'blue'; // Use a default color if needed

      const hasZeusNeighbor = grid.hasNeighborOfType(
        shallowCell,
        'zeus',
      );
      assertFalse(hasZeusNeighbor);

      const allNeighbors = hexMap.getNeighbors(shallowCell.getCoordinates());
      for (const neighbor of allNeighbors) {
        if (neighbor.terrain === 'sea') {
          // For sea neighbors: check if they can reach zeus (excluding the candidate cell)
          assert(
            hexMap.canReachZeusFromSeaNeighbor(neighbor, shallowCell, grid),
          );
        } else if (neighbor.terrain !== 'shallow') {
          // For land neighbors (not sea or shallows): check if they have at least one sea neighbor
          assert(grid.hasNeighborOfType(neighbor, 'sea'));
        }
        // For shallow neighbors, no additional checks needed
      }

      // Restore the shallow cell
      shallowCell.terrain = originalTerrain;
      shallowCell.color = originalColor;
    }
  } else {
    // No shallow cells were converted (all constraints were too restrictive)
  }
});
