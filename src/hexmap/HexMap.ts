// Refactored HexMap class - Main container that coordinates between services

import type { HexColor, TerrainType } from '../types.ts';
import { UtilityService } from '../UtilityService.ts';
import type { HexCell } from './HexCell.ts';
import type { HexCoordinates, HexGrid } from './HexGrid.ts';
import { HexGridOperations } from './HexGridOperations.ts';
import { PathfindingService } from './PathfindingService.ts';
import { SeaColorManager } from './SeaColorManager.ts';
import { TerrainPlacementManager } from './TerrainPlacementManager.ts';

export class HexMap {
  constructor() {
    this.utilityService = new UtilityService();
    this.hexGridOperations = new HexGridOperations();
    this.pathfindingService = new PathfindingService(this.hexGridOperations);
    this.seaColorManager = new SeaColorManager(this.utilityService);
    this.terrainPlacementManager = new TerrainPlacementManager(
      this.hexGridOperations,
      this.seaColorManager,
      this.utilityService,
    );

    this.grid = this.terrainPlacementManager.generateGrid();

    // Convert some sea cells to shallows based on game constraints
    this.convertSeaToShallows();
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
  getCell(q: number, r: number): HexCell | null {
    return this.getHexGrid().getCellFromGrid(q, r);
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
    const cell = this.getCell(q, r);
    if (cell) {
      cell.color = color;
    }
  }

  getNeighborsOfType(
    cell: HexCell,
    terrainType: TerrainType,
  ): HexCell[] {
    const neighbors = this.getHexGrid().getNeighborsOf(cell);

    if (neighbors) {
      return neighbors.filter((neighborCell) => {
        return neighborCell.terrain === terrainType;
      });
    }

    return [];
  }

  /**
   * Check if a cell has a neighbor of a specific terrain type
   */
  hasNeighborOfType(
    cell: HexCell,
    terrainType: TerrainType,
  ): boolean {
    const relevantNeighbors = this.getNeighborsOfType(cell, terrainType);
    return relevantNeighbors.length > 0;
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

  /**
   * Convert some sea cells to shallows based on game constraints
   * This simulates the sea-to-shallows conversion that happens during gameplay
   */
  convertSeaToShallows(): void {
    const seaCells = this.getHexGrid().getCellsOfType('sea');

    // Shuffle sea cells for random selection
    this.utilityService.shuffleArray(seaCells);

    let conversions = 0;
    const maxConversions = 10;

    // Try to convert up to 10 sea cells to shallows
    for (const cell of seaCells) {
      if (conversions >= maxConversions) {
        break;
      }

      // Check if this cell meets the constraints for conversion
      if (this.isEligibleForSeaToShallowsConversion(cell)) {
        cell.terrain = 'shallow';
        cell.color = 'none'; // Reset color when converting to shallows
        conversions++;
      }
    }
  }

  /**
   * Check if a sea cell is eligible for conversion to shallows
   */
  private isEligibleForSeaToShallowsConversion(cell: HexCell): boolean {
    // Constraint 1: Should not have zeus as neighbor
    if (this.hasNeighborOfType(cell, 'zeus')) {
      return false;
    }

    // Constraint 2: Should not have city as neighbor
    if (this.hasNeighborOfType(cell, 'city')) {
      return false;
    }

    // Constraint 3: Check all neighbors
    const neighbors = this.getNeighbors(cell.getCoordinates());

    for (const neighbor of neighbors) {
      if (neighbor.terrain === 'sea') {
        // For sea neighbors: check if they can reach zeus (excluding the candidate cell)
        if (
          !this.pathfindingService.canReachZeusFromSeaNeighbor(
            neighbor,
            cell,
            this.getHexGrid(),
          )
        ) {
          return false;
        }
      } else if (neighbor.terrain !== 'shallow') {
        // For land neighbors (not sea or shallows): check if they have at least one sea neighbor
        if (!this.hasNeighborOfType(neighbor, 'sea')) {
          return false;
        }
      }
      // For shallow neighbors, no additional checks needed
    }

    return true;
  }

  private grid: HexGrid;
  readonly width: number = 13; // -6 to +6 inclusive
  readonly height: number = 13; // -6 to +6 inclusive

  private terrainPlacementManager: TerrainPlacementManager;
  private seaColorManager: SeaColorManager;
  private hexGridOperations: HexGridOperations;
  private pathfindingService: PathfindingService;
  private utilityService: UtilityService;
}
