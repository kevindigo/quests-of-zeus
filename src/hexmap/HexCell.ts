import type { HexColor, TerrainType } from '../types.ts';

export class HexCell {
  public constructor(
    q: number,
    r: number,
    terrain: TerrainType,
    color?: HexColor,
  ) {
    this.q = q;
    this.r = r;
    this.terrain = terrain;
    this.color = color || 'none';
  }
  // Coordinates using axial coordinate system for hex grids
  public readonly q: number; // Column coordinate
  public readonly r: number; // Row coordinate

  // Cell characteristics
  public terrain: TerrainType;
  public color: HexColor;
}
