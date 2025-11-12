import type { TerrainType } from '../game-engine.ts';
import type { HexCell } from '../types.ts';

export class HexGrid {
  public constructor(radius: number, defaultTerrain: TerrainType) {
    this.radius = radius;
    this.grid = HexGrid.generateHexShapedGrid(this.radius, defaultTerrain);
  }

  public forEachCell(callback: (cell: HexCell) => void): void {
    // Simply iterate through all rows and all cells in each row
    // The grid structure already contains all valid cells
    for (const row of this.grid) {
      for (const cell of row) {
        callback(cell);
      }
    }
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
        const cell: HexCell = { q, r, terrain, color };

        row.push(cell);
      }
      grid.push(row);
    }

    return grid;
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

  private radius: number;
  public readonly grid: HexCell[][];
}
