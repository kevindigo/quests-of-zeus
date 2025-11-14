// Refactored HexMap class - Main container that coordinates between services

import type { HexColor, TerrainType } from '../types.ts';
import type { HexCell } from './HexCell.ts';
import type { HexCoordinates, HexGrid } from './HexGrid.ts';
import { HexGridOperations } from './HexGridOperations.ts';
import { PathfindingService } from './PathfindingService.ts';
import { SeaColorManager } from './SeaColorManager.ts';
import { TerrainPlacementManager } from './TerrainPlacementManager.ts';

export class HexMap {
  constructor() {
    this.hexGridOperations = new HexGridOperations();
    this.pathfindingService = new PathfindingService(this.hexGridOperations);
    this.seaColorManager = new SeaColorManager();
    this.terrainPlacementManager = new TerrainPlacementManager(
      this.hexGridOperations,
      this.seaColorManager,
    );

    this.grid = this.terrainPlacementManager.generateGrid();
  }

  public getZeus(): HexCell {
    const zeuses = this.getCellsByTerrain('zeus');
    if (zeuses.length < 1) {
      throw new Error('Zeus not found!');
    }
    return zeuses[0]!;
  }

  public getHexGrid(): HexGrid {
    return this.grid;
  }

  /**
   * Get a cell at specific coordinates
   */
  getCell(coordinates: HexCoordinates): HexCell | null {
    return this.getHexGrid().getCell(coordinates);
  }

  /**
   * Get all neighboring cells for a given cell
   */
  getNeighbors(coordinates: HexCoordinates): HexCell[] {
    return this.getHexGrid().getNeighborsByCoordinates(coordinates);
  }

  /**
   * Get all cells of a specific terrain type
   */
  getCellsByTerrain(terrain: TerrainType): HexCell[] {
    return this.getHexGrid().getCellsOfType(terrain);
  }

  /**
   * Set the color of a specific cell
   */
  setCellColor(q: number, r: number, color: HexColor): void {
    const cell = this.getCell({ q, r });
    if (cell) {
      cell.color = color;
    }
  }

  /**
   * Check if a cell can reach Zeus through a path of sea cells
   */
  canReachZeus(cell: HexCell, grid: HexCell[][]): boolean {
    return this.pathfindingService.canReachZeus(cell, grid);
  }

  /**
   * Check if a sea neighbor can reach zeus, considering that the candidate cell
   * might be converted to shallows (so we exclude it from the path)
   */
  canReachZeusFromSeaNeighbor(
    seaNeighbor: HexCell,
    candidateCell: HexCell,
    grid: HexGrid,
  ): boolean {
    return this.pathfindingService.canReachZeusFromSeaNeighbor(
      seaNeighbor,
      candidateCell,
      grid,
    );
  }

  private grid: HexGrid;
  readonly width: number = 13; // -6 to +6 inclusive
  readonly height: number = 13; // -6 to +6 inclusive

  private terrainPlacementManager: TerrainPlacementManager;
  private seaColorManager: SeaColorManager;
  private hexGridOperations: HexGridOperations;
  private pathfindingService: PathfindingService;
}
