// PathfindingService - Pathfinding and connectivity analysis

import type { HexCell, TerrainType } from "../types.ts";
import type { HexGridOperations } from "./HexGridOperations.ts";

export class PathfindingService {
  private hexGridOperations: HexGridOperations;

  constructor(hexGridOperations: HexGridOperations) {
    this.hexGridOperations = hexGridOperations;
  }

  /**
   * Check if a sea cell can trace a path back to zeus using only sea tiles
   * Uses breadth-first search to find a path to zeus
   */
  canReachZeus(startCell: HexCell, grid: HexCell[][]): boolean {
    const visited = new Set<string>();
    const queue: HexCell[] = [startCell];
    visited.add(`${startCell.q},${startCell.r}`);

    while (queue.length > 0) {
      const current = queue.shift()!;

      // Check all 6 adjacent cells
      for (let direction = 0; direction < 6; direction++) {
        const adjacentCoords = this.hexGridOperations.getAdjacent(
          current.q,
          current.r,
          direction,
        );
        if (!adjacentCoords) {
          continue; // Skip if adjacent cell is off the map
        }

        const adjacentCell = this.hexGridOperations.getCellFromGrid(
          grid,
          adjacentCoords.q,
          adjacentCoords.r,
        );
        if (!adjacentCell) {
          continue; // Skip if adjacent cell is off the map
        }

        const cellKey = `${adjacentCell.q},${adjacentCell.r}`;

        // If we found zeus, return true
        if (adjacentCell.terrain === "zeus") {
          return true;
        }

        // If we haven't visited this cell and it's sea (valid path)
        if (!visited.has(cellKey) && adjacentCell.terrain === "sea") {
          visited.add(cellKey);
          queue.push(adjacentCell);
        }
      }
    }

    // If we exhausted all possibilities without finding zeus, return false
    return false;
  }

  /**
   * Check if a sea neighbor can reach zeus, considering that the candidate cell
   * might be converted to shallows (so we exclude it from the path)
   */
  canReachZeusFromSeaNeighbor(
    seaNeighbor: HexCell,
    candidateCell: HexCell,
    grid: HexCell[][],
  ): boolean {
    const visited = new Set<string>();
    const queue: HexCell[] = [seaNeighbor];
    visited.add(`${seaNeighbor.q},${seaNeighbor.r}`);

    while (queue.length > 0) {
      const current = queue.shift()!;

      // Check all 6 adjacent cells
      for (let direction = 0; direction < 6; direction++) {
        const adjacentCoords = this.hexGridOperations.getAdjacent(
          current.q,
          current.r,
          direction,
        );
        if (!adjacentCoords) {
          continue; // Skip if adjacent cell is off the map
        }

        const adjacentCell = this.hexGridOperations.getCellFromGrid(
          grid,
          adjacentCoords.q,
          adjacentCoords.r,
        );
        if (!adjacentCell) {
          continue; // Skip if adjacent cell is off the map
        }

        const cellKey = `${adjacentCell.q},${adjacentCell.r}`;

        // Skip the candidate cell (it will become shallows, not part of sea path)
        if (
          adjacentCell.q === candidateCell.q &&
          adjacentCell.r === candidateCell.r
        ) {
          continue;
        }

        // If we found zeus, return true
        if (adjacentCell.terrain === "zeus") {
          return true;
        }

        // If we haven't visited this cell and it's sea (valid path)
        // Also allow shallow cells as valid paths since they were originally sea
        if (
          !visited.has(cellKey) &&
          (adjacentCell.terrain === "sea" || adjacentCell.terrain === "shallow")
        ) {
          visited.add(cellKey);
          queue.push(adjacentCell);
        }
      }
    }

    // If we exhausted all possibilities without finding zeus, return false
    return false;
  }

  /**
   * Check if a cell has a neighbor of a specific terrain type
   */
  hasNeighborOfType(
    cell: HexCell,
    grid: HexCell[][],
    terrainType: TerrainType,
  ): boolean {
    const neighbors = this.hexGridOperations.getNeighborsFromGrid(
      cell.q,
      cell.r,
      grid,
    );
    return neighbors.some((neighbor) =>
      neighbor && neighbor.terrain === terrainType
    );
  }

  /**
   * Get all neighbors of a cell that have a specific terrain type
   */
  getNeighborsOfType(
    cell: HexCell,
    grid: HexCell[][],
    terrainType: TerrainType,
  ): HexCell[] {
    const neighbors = this.hexGridOperations.getNeighborsFromGrid(
      cell.q,
      cell.r,
      grid,
    );
    return neighbors.filter((neighbor) =>
      neighbor && neighbor.terrain === terrainType
    );
  }
}
