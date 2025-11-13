import type { TerrainType } from '../game-engine.ts';
import type { HexCell } from '../types.ts';

export class HexGrid {
  public constructor(radius: number, defaultTerrain: TerrainType) {
    this.radius = radius;
    this.grid = HexGrid.generateHexShapedGrid(this.radius, defaultTerrain);
  }

  public getCellFromGrid(
    q: number,
    r: number,
  ): HexCell | null {
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

  public forEachCell(callback: (cell: HexCell) => void): void {
    for (const row of this.grid) {
      for (const cell of row) {
        callback(cell);
      }
    }
  }

  public getCellsOfType(terrainType: TerrainType): HexCell[] {
    const results:HexCell[] = [];
    this.forEachCell(cell => {
      if(cell.terrain === terrainType)
        results.push(cell);
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
