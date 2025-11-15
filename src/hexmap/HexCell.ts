import type { HexColor, TerrainType } from '../types.ts';
import type { HexCoordinates } from './HexGrid.ts';

export type HexCellJson = {
  q: number;
  r: number;
  terrain: TerrainType;
  color: HexColor;
};

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

  public static fromJson(json: HexCellJson): HexCell {
    const q = json.q;
    const r = json.r;
    return new HexCell(
      { q, r },
      json.terrain,
      json.color,
    );
  }

  public toJson(): HexCellJson {
    return {
      q: this.q,
      r: this.r,
      terrain: this.terrain,
      color: this.color,
    };
  }

  public getCoordinates(): HexCoordinates {
    return { q: this.q, r: this.r };
  }

  public isDryLand(): boolean {
    return !(this.terrain === 'sea' || this.terrain === 'shallow');
  }

  public readonly q: number; // Column coordinate
  public readonly r: number; // Row coordinate
  public terrain: TerrainType;
  public color: HexColor;
}
