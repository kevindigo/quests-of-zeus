// Refactored HexMap class - Main container that coordinates between services

import type { TerrainType, HexColor, HexCell } from "../types.ts";
import { TerrainPlacementManager } from "./TerrainPlacementManager.ts";
import { SeaColorManager } from "./SeaColorManager.ts";
import { HexGridOperations } from "./HexGridOperations.ts";
import { PathfindingService } from "./PathfindingService.ts";
import { CityManager } from "./CityManager.ts";
import { UtilityService } from "./UtilityService.ts";

export interface HexMapService {
  getGrid(): HexCell[][];
  getCell(q: number, r: number): HexCell | null;
  getNeighbors(q: number, r: number): HexCell[];
  getCellsByTerrain(terrain: TerrainType): HexCell[];
  setCellColor(q: number, r: number, color: HexColor): void;
  addStatueToCity(q: number, r: number): boolean;
  removeStatueFromCity(q: number, r: number): boolean;
  getStatuesOnCity(q: number, r: number): number;
  isCityComplete(q: number, r: number): boolean;
  getCompleteCities(): HexCell[];
  serialize(): HexCell[][];
  hasNeighborOfType(cell: HexCell, grid: HexCell[][], terrainType: TerrainType): boolean;
  canReachZeus(cell: HexCell, grid: HexCell[][]): boolean;
  canReachZeusFromSeaNeighbor(seaNeighbor: HexCell, candidateCell: HexCell, grid: HexCell[][]): boolean;
}

export class HexMap implements HexMapService {
  private grid: HexCell[][];
  readonly width: number = 13; // -6 to +6 inclusive
  readonly height: number = 13; // -6 to +6 inclusive

  private terrainPlacementManager: TerrainPlacementManager;
  private seaColorManager: SeaColorManager;
  private hexGridOperations: HexGridOperations;
  private pathfindingService: PathfindingService;
  private cityManager: CityManager;
  private utilityService: UtilityService;

  constructor() {
    this.utilityService = new UtilityService();
    this.hexGridOperations = new HexGridOperations();
    this.pathfindingService = new PathfindingService(this.hexGridOperations);
    this.cityManager = new CityManager();
    this.seaColorManager = new SeaColorManager(this.hexGridOperations, this.utilityService);
    this.terrainPlacementManager = new TerrainPlacementManager(
      this.hexGridOperations,
      this.pathfindingService,
      this.seaColorManager,
      this.utilityService
    );
    
    this.grid = this.terrainPlacementManager.generateGrid();
    
    // Convert some sea cells to shallows based on game constraints
    this.convertSeaToShallows();
  }

  /**
   * Get the grid for external access
   */
  getGrid(): HexCell[][] {
    return this.grid;
  }

  /**
   * Get a cell at specific coordinates
   */
  getCell(q: number, r: number): HexCell | null {
    return this.hexGridOperations.getCellFromGrid(this.grid, q, r);
  }

  /**
   * Get all neighboring cells for a given cell
   */
  getNeighbors(q: number, r: number): HexCell[] {
    return this.hexGridOperations.getNeighborsFromGrid(q, r, this.grid);
  }

  /**
   * Get all cells of a specific terrain type
   */
  getCellsByTerrain(terrain: TerrainType): HexCell[] {
    const cells: HexCell[] = [];
    // The grid is a jagged array (hexagon shape), so we need to iterate through each row
    for (let arrayQ = 0; arrayQ < this.grid.length; arrayQ++) {
      const row = this.grid[arrayQ];
      if (row) {
        for (let arrayR = 0; arrayR < row.length; arrayR++) {
          const cell = row[arrayR];
          if (cell && cell.terrain === terrain) {
            cells.push(cell);
          }
        }
      }
    }
    return cells;
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

  /**
   * Add a statue to a city
   * Returns true if successful, false if city is full or not a city
   */
  addStatueToCity(q: number, r: number): boolean {
    return this.cityManager.addStatueToCity(this.getCell(q, r));
  }

  /**
   * Remove a statue from a city
   * Returns true if successful, false if no statues or not a city
   */
  removeStatueFromCity(q: number, r: number): boolean {
    return this.cityManager.removeStatueFromCity(this.getCell(q, r));
  }

  /**
   * Get the number of statues on a city
   * Returns the count, or -1 if not a city
   */
  getStatuesOnCity(q: number, r: number): number {
    return this.cityManager.getStatuesOnCity(this.getCell(q, r));
  }

  /**
   * Check if a city has all 3 statues placed
   */
  isCityComplete(q: number, r: number): boolean {
    return this.cityManager.isCityComplete(this.getCell(q, r));
  }

  /**
   * Get all cities that are complete (have all 3 statues)
   */
  getCompleteCities(): HexCell[] {
    return this.cityManager.getCompleteCities(this.getCellsByTerrain("city"));
  }

  /**
   * Serialize the map for storage or transmission
   */
  serialize(): HexCell[][] {
    return JSON.parse(JSON.stringify(this.grid));
  }

  /**
   * Deserialize a map from stored data
   */
  static deserialize(data: HexCell[][]): HexMap {
    const map = new HexMap();
    map.grid = data;
    return map;
  }


  getNeighborsOfType(cell: HexCell, grid: HexCell[][], terrainType: TerrainType) : HexCell[] {
    const neighbors = this.hexGridOperations.getNeighborsFromGrid(cell.q, cell.r, grid);
    if(neighbors) {
      return neighbors;
    }

    return [];
  }

  /**
   * Check if a cell has a neighbor of a specific terrain type
   */
  hasNeighborOfType(cell: HexCell, grid: HexCell[][], terrainType: TerrainType): boolean {
    const neighbors = this.hexGridOperations.getNeighborsFromGrid(cell.q, cell.r, grid);
    return neighbors.some(neighbor => neighbor.terrain === terrainType);
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
    grid: HexCell[][],
  ): boolean {
    return this.pathfindingService.canReachZeusFromSeaNeighbor(seaNeighbor, candidateCell, grid);
  }

  /**
   * Convert some sea cells to shallows based on game constraints
   * This simulates the sea-to-shallows conversion that happens during gameplay
   */
  convertSeaToShallows(): void {
    const seaCells: HexCell[] = [];

    // Collect all sea cells
    for (let arrayQ = 0; arrayQ < this.grid.length; arrayQ++) {
      const row = this.grid[arrayQ];
      if (row) {
        for (let arrayR = 0; arrayR < row.length; arrayR++) {
          const cell = row[arrayR];
          if (cell && cell.terrain === "sea") {
            seaCells.push(cell);
          }
        }
      }
    }

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
        cell.terrain = "shallow";
        cell.color = "none"; // Reset color when converting to shallows
        conversions++;
      }
    }
  }

  /**
   * Check if a sea cell is eligible for conversion to shallows
   */
  private isEligibleForSeaToShallowsConversion(cell: HexCell): boolean {
    // Constraint 1: Should not have zeus as neighbor
    if (this.hasNeighborOfType(cell, this.grid, "zeus")) {
      return false;
    }

    // Constraint 2: Should not have city as neighbor
    if (this.hasNeighborOfType(cell, this.grid, "city")) {
      return false;
    }

    // Constraint 3: Check all neighbors
    const neighbors = this.getNeighbors(cell.q, cell.r);
    
    for (const neighbor of neighbors) {
      if (neighbor.terrain === "sea") {
        // For sea neighbors: check if they can reach zeus (excluding the candidate cell)
        if (!this.pathfindingService.canReachZeusFromSeaNeighbor(neighbor, cell, this.grid)) {
          return false;
        }
      } else if (neighbor.terrain !== "shallow") {
        // For land neighbors (not sea or shallows): check if they have at least one sea neighbor
        if (!this.hasNeighborOfType(neighbor, this.grid, "sea")) {
          return false;
        }
      }
      // For shallow neighbors, no additional checks needed
    }

    return true;
  }
}