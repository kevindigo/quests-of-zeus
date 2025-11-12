// HexGridOperations - Core hex grid coordinate calculations and operations

import type { HexCell } from '../types.ts';

export class HexGridOperations {
  /**
   * Get the coordinates of an adjacent hex in a specific direction
   * @param q - The q coordinate of the starting hex
   * @param r - The r coordinate of the starting hex
   * @param direction - Direction (0-5) where:
   *   0: Northeast (q+1, r-1)
   *   1: East (q+1, r+0)
   *   2: Southeast (q+0, r+1)
   *   3: Southwest (q-1, r+1)
   *   4: West (q-1, r+0)
   *   5: Northwest (q+0, r-1)
   * @returns Object with {q, r} coordinates of the adjacent hex, or null if direction is invalid
   */
  getAdjacent(
    q: number,
    r: number,
    direction: number,
  ): { q: number; r: number } | null {
    if (direction < 0 || direction > 5) {
      return null;
    }

    const directionVectors = [
      [1, -1], // 0: Northeast
      [1, 0], // 1: East
      [0, 1], // 2: Southeast
      [-1, 1], // 3: Southwest
      [-1, 0], // 4: West
      [0, -1], // 5: Northwest
    ];

    const directionVector = directionVectors[direction];
    if (!directionVector) {
      return null;
    }
    const [dq, dr] = directionVector;
    return {
      q: q + (dq || 0),
      r: r + (dr || 0),
    };
  }

  /**
   * Get all neighboring cells for a given cell from a specific grid
   */
  getNeighborsFromGrid(
    q: number,
    r: number,
    grid: HexCell[][],
  ): HexCell[] {
    const neighbors: HexCell[] = [];

    // Check if grid is valid
    if (!grid || !Array.isArray(grid) || grid.length === 0) {
      return neighbors;
    }

    // Check all 6 directions using getAdjacent
    for (let direction = 0; direction < 6; direction++) {
      const adjacentCoords = this.getAdjacent(q, r, direction);
      if (adjacentCoords) {
        const neighbor = this.getCellFromGrid(
          grid,
          adjacentCoords.q,
          adjacentCoords.r,
        );
        if (neighbor) {
          neighbors.push(neighbor);
        }
      }
    }

    return neighbors;
  }

  /**
   * Get a cell at specific coordinates from a provided grid
   */
  getCellFromGrid(
    grid: HexCell[][],
    q: number,
    r: number,
  ): HexCell | null {
    // Check if grid is valid
    if (!grid || !Array.isArray(grid) || grid.length === 0) {
      return null;
    }

    // Convert axial coordinates to array indices
    const arrayQ = q + 6; // Offset to make coordinates non-negative

    // Check if q coordinate is within bounds
    if (arrayQ < 0 || arrayQ >= grid.length) {
      return null;
    }

    const row = grid[arrayQ];
    if (!row) {
      return null;
    }

    // For hexagonal grid, we need to find the cell with matching r coordinate
    // Since each row only contains valid r coordinates for that q
    for (const cell of row) {
      if (cell.r === r) {
        return cell;
      }
    }

    return null;
  }

  /**
   * Calculate distance between two hex cells using axial coordinates
   */
  hexDistance(q1: number, r1: number, q2: number, r2: number): number {
    const s1 = -q1 - r1;
    const s2 = -q2 - r2;
    return (Math.abs(q1 - q2) + Math.abs(r1 - r2) + Math.abs(s1 - s2)) / 2;
  }

  /**
   * Get the corner coordinates for a given direction by starting at center (0,0)
   * and traversing outward to the edge of the map
   * @param direction - Direction (0-5) where:
   *   0: Northeast (q+1, r-1)
   *   1: East (q+1, r+0)
   *   2: Southeast (q+0, r+1)
   *   3: Southwest (q-1, r+1)
   *   4: West (q-1, r+0)
   *   5: Northwest (q+0, r-1)
   * @returns The corner coordinates {q, r} at the edge of the map in the specified direction
   */
  getCorner(direction: number): { q: number; r: number } {
    let currentQ = 0;
    let currentR = 0;

    // Traverse outward in the specified direction to the edge of the map
    for (let distance = 1; distance <= 6; distance++) {
      const adjacent = this.getAdjacent(currentQ, currentR, direction);
      if (!adjacent) break;

      currentQ = adjacent.q;
      currentR = adjacent.r;
    }

    return { q: currentQ, r: currentR };
  }
}
