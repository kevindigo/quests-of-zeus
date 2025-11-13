import type { HexColor, TerrainType } from '../types.ts';

export interface HexCell {
  // Coordinates using axial coordinate system for hex grids
  q: number; // Column coordinate
  r: number; // Row coordinate

  // Cell characteristics
  terrain: TerrainType;
  color: HexColor;
}
