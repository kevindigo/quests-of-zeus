#!/usr/bin/env -S deno run --allow-read

import { assertEquals } from '@std/assert';
import { HexMap } from '../src/hexmap.ts';
import type { HexCell } from '../src/types.ts';

// Test the sea-to-shallows conversion functionality
Deno.test('Sea to shallows conversion - basic functionality', () => {
  const hexMap = new HexMap();
  const grid = hexMap.getGrid();

  // Count terrain distribution
  const terrainCounts: Record<string, number> = {};
  for (let arrayQ = 0; arrayQ < grid.length; arrayQ++) {
    const row = grid[arrayQ];
    if (row) {
      for (let arrayR = 0; arrayR < row.length; arrayR++) {
        const cell = row[arrayR];
        if (cell) {
          terrainCounts[cell.terrain] = (terrainCounts[cell.terrain] || 0) + 1;
        }
      }
    }
  }

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
    const shallowCells: HexCell[] = [];

    // Find all shallow cells
    for (let arrayQ = 0; arrayQ < grid.length; arrayQ++) {
      const row = grid[arrayQ];
      if (row) {
        for (let arrayR = 0; arrayR < row.length; arrayR++) {
          const cell = row[arrayR];
          if (cell && cell.terrain === 'shallow') {
            shallowCells.push(cell);
          }
        }
      }
    }

    // Verify each shallow cell meets the constraints
    for (const shallowCell of shallowCells) {
      // 1. Should not have zeus as neighbor
      const hasZeusNeighborCheck = hexMap.hasNeighborOfType(
        shallowCell,
        'zeus',
      );
      assertEquals(
        hasZeusNeighborCheck,
        false,
        `Shallow cell at (${shallowCell.q}, ${shallowCell.r}) should not have zeus neighbor`,
      );

      // 2. Should not have city as neighbor
      const hasCityNeighborCheck = hexMap.hasNeighborOfType(
        shallowCell,
        'city',
      );
      assertEquals(
        hasCityNeighborCheck,
        false,
        `Shallow cell at (${shallowCell.q}, ${shallowCell.r}) should not have city neighbor`,
      );

      // 3. Check all neighbors of the shallow cell
      // To properly test the constraints, we need to simulate what the state was
      // during the conversion by temporarily converting the shallow cell back to sea
      // and then checking if it would pass the eligibility criteria

      // Temporarily convert back to sea for constraint checking
      const originalTerrain = shallowCell.terrain;
      const originalColor = shallowCell.color;
      shallowCell.terrain = 'sea';
      shallowCell.color = originalColor !== 'none' ? originalColor : 'blue'; // Use a default color if needed

      let allConstraintsSatisfied = true;

      // Constraint 1: Should not have zeus as neighbor
      const hasZeusNeighborConstraint = hexMap.hasNeighborOfType(
        shallowCell,
        'zeus',
      );
      if (hasZeusNeighborConstraint) {
        allConstraintsSatisfied = false;
      }

      // Constraint 2: Should not have city as neighbor
      const hasCityNeighborConstraint = hexMap.hasNeighborOfType(
        shallowCell,
        'city',
      );
      if (hasCityNeighborConstraint) {
        allConstraintsSatisfied = false;
      }

      // Constraint 3: Check all neighbors
      const allNeighbors = hexMap.getNeighbors(shallowCell.q, shallowCell.r);
      for (const neighbor of allNeighbors) {
        if (neighbor.terrain === 'sea') {
          // For sea neighbors: check if they can reach zeus (excluding the candidate cell)
          if (
            !hexMap.canReachZeusFromSeaNeighbor(neighbor, shallowCell, grid)
          ) {
            allConstraintsSatisfied = false;
            break;
          }
        } else if (neighbor.terrain !== 'shallow') {
          // For land neighbors (not sea or shallows): check if they have at least one sea neighbor
          if (!hexMap.hasNeighborOfType(neighbor, 'sea')) {
            allConstraintsSatisfied = false;
            break;
          }
        }
        // For shallow neighbors, no additional checks needed
      }

      // Restore the shallow cell
      shallowCell.terrain = originalTerrain;
      shallowCell.color = originalColor;

      assertEquals(
        allConstraintsSatisfied,
        true,
        `All neighbor constraints should be satisfied for shallow cell at (${shallowCell.q}, ${shallowCell.r})`,
      );
    }
  } else {
    // No shallow cells were converted (all constraints were too restrictive)
  }
});
