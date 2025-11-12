import type { HexCell } from "../types.ts";

export class HexGrid {
  public constructor(radius: number) {
    this.grid = generateHexShapedGrid(radius);
  }

  public static generateHexShapedGrid(radius: number): HexCell[][] {
    const grid: HexCell[][] = [];

    for (let q = -radius; q <= radius; q++) {
      const row: HexCell[] = [];
      const r1 = Math.max(-radius, -q - radius);
      const r2 = Math.min(radius, -q + radius);

      for (let r = r1; r <= r2; r++) {
        const terrain: TerrainType = "none";
        const color = "none";
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

  private grid: HexCell[][];
}
