// Movement and reachability logic for Quests of Zeus
import type { HexCell } from './hexmap/HexCell.ts';
import type { HexMap } from './hexmap/HexMap.ts';
import type { CoreColor, HexColor } from './types.ts';

export class MovementSystem {
  constructor(private map: HexMap) {}

  /**
   * Get all reachable sea tiles within movement range using BFS
   * Ships can move up to <range> steps on sea tiles, starting from the current position
   * Movement is only allowed through sea tiles (land blocks movement)
   * Ships can start on non-sea tiles (like Zeus) and move to adjacent sea tiles
   */
  public getReachableSeaTiles(
    startQ: number,
    startR: number,
    range: number,
  ): { q: number; r: number; color: CoreColor }[] {
    const reachableTiles: { q: number; r: number; color: CoreColor }[] = [];
    const visited = new Set<string>();
    const queue: { q: number; r: number; steps: number }[] = [];

    // Start BFS from the current position (step 0)
    const startKey = `${startQ},${startR}`;
    visited.add(startKey);
    queue.push({ q: startQ, r: startR, steps: 0 });

    // Continue BFS up to the movement range
    while (queue.length > 0) {
      const current = queue.shift()!;

      // If we've reached the maximum range, don't explore further
      if (current.steps >= range) {
        continue;
      }

      const neighbors = this.map.getNeighbors(current.q, current.r);

      for (const neighbor of neighbors) {
        if (neighbor.terrain === 'sea') {
          const key = `${neighbor.q},${neighbor.r}`;
          if (!visited.has(key)) {
            visited.add(key);
            queue.push({
              q: neighbor.q,
              r: neighbor.r,
              steps: current.steps + 1,
            });
            reachableTiles.push({
              q: neighbor.q,
              r: neighbor.r,
              color: neighbor.color as CoreColor,
            });
          }
        }
      }
    }

    return reachableTiles;
  }

  /**
   * Calculate distance between two hex cells using axial coordinates
   */
  public hexDistance(q1: number, r1: number, q2: number, r2: number): number {
    const s1 = -q1 - r1;
    const s2 = -q2 - r2;
    return (Math.abs(q1 - q2) + Math.abs(r1 - r2) + Math.abs(s1 - s2)) / 2;
  }

  /**
   * Validate if a move is valid
   */
  public validateMove(
    currentPos: { q: number; r: number },
    targetQ: number,
    targetR: number,
    dieColor: HexColor,
    movementRange: number,
    targetCell: HexCell | null,
  ): { isValid: boolean; error?: string } {
    if (!targetCell) {
      return { isValid: false, error: 'Target cell does not exist' };
    }

    // Rule 1: You can only move to sea spaces
    if (targetCell.terrain !== 'sea') {
      return {
        isValid: false,
        error: `Cannot move to ${targetCell.terrain} terrain`,
      };
    }

    // Rule 3: Can only land on sea hexes of the color of the die they used
    if (targetCell.color !== dieColor) {
      return {
        isValid: false,
        error: `Target hex is ${targetCell.color}, but die is ${dieColor}`,
      };
    }

    // Check if the target is reachable within the movement range on sea tiles
    const reachableSeaTiles = this.getReachableSeaTiles(
      currentPos.q,
      currentPos.r,
      movementRange,
    );

    const isReachable = reachableSeaTiles.some((tile) =>
      tile.q === targetQ && tile.r === targetR && tile.color === dieColor
    );

    if (!isReachable) {
      return {
        isValid: false,
        error: `Target is not reachable within ${movementRange} movement range`,
      };
    }

    return { isValid: true };
  }
}
