import type { TerrainType } from '../types.ts';
import { HexCell } from './HexCell.ts';

export type Direction = 0 | 1 | 2 | 3 | 4 | 5;

export type HexCoordinates = {
  q: number;
  r: number;
};

export class HexGrid {
  public constructor(radius: number, defaultTerrain: TerrainType) {
    this.radius = radius;
    this.grid = HexGrid.generateHexShapedGrid(this.radius, defaultTerrain);
  }

  public getRadius(): number {
    return this.radius;
  }

  public getCell(coordinates: HexCoordinates): HexCell | null {
    const q = coordinates.q;
    const r = coordinates.r;

    // Check if grid is valid
    if (!this.grid || !Array.isArray(this.grid) || this.grid.length === 0) {
      return null;
    }

    // Convert axial coordinates to array indices
    // q ranges from -radius to radius, so array index = q + radius
    const arrayQ = q + this.radius;

    if (arrayQ < 0 || arrayQ >= this.grid.length) {
      return null;
    }

    const row = this.grid[arrayQ];
    if (!row) {
      return null;
    }

    // For hexagonal grid, we need to find the cell with matching r coordinate
    // Since each row only contains valid r coordinates for that q
    // ToDo: change to array .find
    for (const cell of row) {
      if (cell.r === r) {
        return cell;
      }
    }

    return null;
  }

  public getNeighborsOf(cell: HexCell): HexCell[] {
    return this.getNeighborsByCoordinates(cell.getCoordinates());
  }

  public getNeighborsByCoordinates(coordinates: HexCoordinates): HexCell[] {
    const neighbors: HexCell[] = [];
    for (
      let direction = 0;
      direction < HexGrid.directionVectors.length;
      ++direction
    ) {
      const thatPosition = HexGrid.getCoordinates(coordinates, direction);
      const thatNeighbor = this.getCell(thatPosition);
      if (thatNeighbor) {
        neighbors.push(thatNeighbor);
      }
    }
    if (neighbors.length < 3) {
      console.error(
        `Only found ${neighbors.length} neighbors of ${
          JSON.stringify(coordinates)
        }`,
      );
    }
    return neighbors;
  }

  public hasNeighborOfType(cell: HexCell, terrainType: TerrainType): boolean {
    const neighborsOfType = this.getNeighborsOfType(cell, terrainType);
    return neighborsOfType.length > 0;
  }

  public getNeighborsOfType(
    cell: HexCell,
    terrainType: TerrainType,
  ): HexCell[] {
    const neighbors = this.getNeighborsOf(cell);
    const neighborsOfType = neighbors.filter((neighbor) => {
      return (neighbor.terrain === terrainType);
    });
    return neighborsOfType;
  }

  public forEachCell(callback: (cell: HexCell) => void): void {
    for (const row of this.grid) {
      for (const cell of row) {
        callback(cell);
      }
    }
  }

  public getCellsOfType(terrainType: TerrainType): HexCell[] {
    const results: HexCell[] = [];
    this.forEachCell((cell) => {
      if (cell.terrain === terrainType) {
        results.push(cell);
      }
    });

    return results;
  }

  public static generateHexShapedGrid(
    radius: number,
    defaultTerrain: TerrainType,
  ): HexCell[][] {
    const grid: HexCell[][] = [];

    for (let q = -radius; q <= radius; q++) {
      const row: HexCell[] = [];
      const r1 = Math.max(-radius, -q - radius);
      const r2 = Math.min(radius, -q + radius);

      for (let r = r1; r <= r2; r++) {
        const color = 'none';
        const terrain = defaultTerrain;
        const cell = new HexCell({ q, r }, terrain, color);

        row.push(cell);
      }
      grid.push(row);
    }

    return grid;
  }

  public static getCoordinates(
    from: HexCoordinates,
    direction: number,
  ): HexCoordinates {
    const vector = this.getVector(direction);
    return { q: from.q + vector.q, r: from.r + vector.r };
  }

  public static hexDistance(
    q1: number,
    r1: number,
    q2: number,
    r2: number,
  ): number {
    const s1 = -q1 - r1;
    const s2 = -q2 - r2;
    return (Math.abs(q1 - q2) + Math.abs(r1 - r2) + Math.abs(s1 - s2)) / 2;
  }

  public static getVector(direction: number): HexCoordinates {
    const safeDirection = direction % this.directionVectors.length;
    return this.directionVectors[safeDirection]!;
  }

  private static readonly directionVectors: HexCoordinates[] = [
    { q: 1, r: -1 }, // 0: Northeast
    { q: 1, r: 0 }, // 1: East
    { q: 0, r: 1 }, // 2: Southeast
    { q: -1, r: 1 }, // 3: Southwest
    { q: -1, r: 0 }, // 4: West
    { q: 0, r: -1 }, // 5: Northwest
  ];

  private radius: number;
  private readonly grid: HexCell[][];
}
