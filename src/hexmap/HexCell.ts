import type { HexColor, TerrainType } from '../types.ts';
import type { HexCoordinates } from './HexGrid.ts';

export class HexCell {
  public constructor(
    coordinates: HexCoordinates,
    terrain: TerrainType,
    color?: HexColor,
  ) {
    this.q = coordinates.q;
    this.r = coordinates.r;
    this.terrain = terrain;
    this.color = color || 'none';
  }

  public getCoordinates(): HexCoordinates {
    return { q: this.q, r: this.r };
  }

  public readonly q: number; // Column coordinate
  public readonly r: number; // Row coordinate
  public terrain: TerrainType;
  public color: HexColor;
}
