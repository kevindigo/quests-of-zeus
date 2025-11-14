// TerrainPlacementManager - Handles all terrain generation and placement logic

import type { TerrainType } from '../types.ts';
import { COLOR_WHEEL } from '../types.ts';
import { UtilityService } from '../UtilityService.ts';
import type { HexCell } from './HexCell.ts';
import { HexGrid } from './HexGrid.ts';
import type { HexGridOperations } from './HexGridOperations.ts';
import { PathfindingService } from './PathfindingService.ts';
import type { SeaColorManager } from './SeaColorManager.ts';

export class TerrainPlacementManager {
  constructor(
    hexGridOperations: HexGridOperations,
    seaColorManager: SeaColorManager,
  ) {
    this.hexGridOperations = hexGridOperations;
    this.seaColorManager = seaColorManager;
  }

  /**
   * Generate a hexagon-shaped grid with radius 6
   * for the Quests of Zeus game
   */
  generateGrid(): HexGrid {
    const radius = 6;
    const shallow: TerrainType = 'shallow';
    const grid = new HexGrid(radius, shallow);

    this.placeZeus(grid);
    this.placeCities(grid);
    this.placeSpecialTerrain(grid);

    this.setColors(grid, 'temple');
    this.setColors(grid, 'clouds');

    this.convertSeaToShallows(grid);

    return grid;
  }

  /**
   * Place Zeus randomly in one of the neighbor hexes of the center
   * and set all neighbors of the chosen Zeus hex to sea
   */
  private placeZeus(grid: HexGrid): void {
    // Define the 6 neighbor hexes around the center
    const neighborHexes = [
      [1, 0],
      [1, -1],
      [0, -1],
      [-1, 0],
      [-1, 1],
      [0, 1],
    ];

    // Randomly select one of the neighbor hexes
    const randomIndex = Math.floor(Math.random() * neighborHexes.length);
    const zeusDelta = neighborHexes[randomIndex] || [];
    const zeusQ = zeusDelta[0] || 0;
    const zeusR = zeusDelta[1] || 0;

    // Find the cell for Zeus placement
    const zeusCell = grid.getCell({ q: zeusQ, r: zeusR });
    if (zeusCell) {
      // Place Zeus at the selected neighbor hex
      zeusCell.terrain = 'zeus';

      // Set all neighbors of the Zeus hex to sea
      this.setZeusNeighborsToSea(grid, zeusQ, zeusR);
    } else {
      console.error(`Failed to place Zeus at (${zeusQ}, ${zeusR})`);
    }
  }

  /**
   * Place the 6 city tiles near the corners of the hex map
   * For each corner, pick a random direction (+2 or +4) and a random distance
   * - For clockwise direction (+2): distance can be 0 to 2
   * - For counter-clockwise direction (+4): distance can be 0 to 1
   * Place the city there, then set 2 random neighboring hexes to sea
   * Each city is randomly assigned one of the 6 fundamental colors
   */
  private placeCities(grid: HexGrid): void {
    // Create a shuffled copy of the colors to assign randomly to cities
    const shuffledColors = [...COLOR_WHEEL];
    UtilityService.shuffleArray(shuffledColors);

    for (let cornerDirection = 0; cornerDirection < 6; cornerDirection++) {
      // Get the corner coordinates
      const cornerCoords = this.hexGridOperations.getCorner(cornerDirection);

      // Pick a random direction offset: either +2 (clockwise) or +4 (counter-clockwise)
      const directionOffset = Math.random() < 0.5 ? 2 : 4;
      const placementDirection = (cornerDirection + directionOffset) % 6;

      // Pick a random distance based on direction:
      // - For clockwise direction (+2): distance can be 0 to 2
      // - For counter-clockwise direction (+4): distance can be 0 to 1
      const maxDistance = directionOffset === 2 ? 2 : 1;
      const distance = Math.floor(Math.random() * (maxDistance + 1));

      // Calculate placement coordinates
      let placementQ = cornerCoords.q;
      let placementR = cornerCoords.r;

      // Move from the corner in the chosen direction for the chosen distance
      for (let i = 0; i < distance; i++) {
        const adjacent = this.hexGridOperations.getAdjacent(
          placementQ,
          placementR,
          placementDirection,
        );
        if (!adjacent) break;

        placementQ = adjacent.q;
        placementR = adjacent.r;
      }

      // Place the city if the cell exists
      const cell = grid.getCell({
        q: placementQ,
        r: placementR,
      });
      if (cell && cell.terrain === 'shallow') {
        cell.terrain = 'city';
        // Assign a random color to the city
        const color = shuffledColors[cornerDirection] || 'none';
        cell.color = color;

        // After placing city, set 2 random neighboring hexes to sea
        this.setRandomNeighborsToSea(grid, placementQ, placementR);
      } else {
        // Fallback: place at the corner if the randomized placement failed
        const cornerCell = grid.getCell(
          cornerCoords,
        );
        if (cornerCell && cornerCell.terrain === 'shallow') {
          cornerCell.terrain = 'city';
          // Assign a random color to the city
          const color = shuffledColors[cornerDirection] || 'none';
          cornerCell.color = color;

          // After placing city, set 2 random neighboring hexes to sea
          this.setRandomNeighborsToSea(grid, cornerCoords.q, cornerCoords.r);
        }
      }
    }
  }

  /**
   * Set all neighbors of the Zeus hex to sea
   * @param grid - The grid containing all cells
   * @param zeusQ - The q coordinate of the Zeus cell
   * @param zeusR - The r coordinate of the Zeus cell
   */
  private setZeusNeighborsToSea(
    grid: HexGrid,
    zeusQ: number,
    zeusR: number,
  ): void {
    // Get all neighboring cells of the Zeus hex
    const neighbors: HexCell[] = [];

    // Check all 6 directions using getAdjacent
    for (let direction = 0; direction < 6; direction++) {
      const adjacentCoords = this.hexGridOperations.getAdjacent(
        zeusQ,
        zeusR,
        direction,
      );
      if (adjacentCoords) {
        const neighbor = grid.getCell(
          adjacentCoords,
        );
        if (neighbor) {
          neighbors.push(neighbor);
        }
      }
    }

    // Set all neighbors of Zeus to sea
    for (const neighbor of neighbors) {
      neighbor.terrain = 'sea';
    }
  }

  /**
   * Set 2 random neighboring hexes of a given cell to sea
   * @param grid - The grid containing all cells
   * @param q - The q coordinate of the center cell
   * @param r - The r coordinate of the center cell
   */
  private setRandomNeighborsToSea(
    grid: HexGrid,
    q: number,
    r: number,
  ): void {
    // Get all neighboring cells using the provided grid
    const neighbors: HexCell[] = [];

    // Check all 6 directions using getAdjacent
    for (let direction = 0; direction < 6; direction++) {
      const adjacentCoords = this.hexGridOperations.getAdjacent(
        q,
        r,
        direction,
      );
      if (adjacentCoords) {
        const neighbor = grid.getCell(
          adjacentCoords,
        );
        if (neighbor) {
          neighbors.push(neighbor);
        }
      }
    }

    // Filter neighbors that are currently shallows (eligible to become sea)
    const eligibleNeighbors = neighbors.filter((cell) =>
      cell.terrain === 'shallow'
    );

    // If there are eligible neighbors, randomly select 2 of them
    if (eligibleNeighbors.length > 0) {
      // Shuffle the eligible neighbors
      UtilityService.shuffleArray(eligibleNeighbors);

      // Set up to 2 random neighbors to sea
      const neighborsToConvert = Math.min(2, eligibleNeighbors.length);
      for (let i = 0; i < neighborsToConvert; i++) {
        eligibleNeighbors[i]!.terrain = 'sea';
      }
    }
  }

  /**
   * Place special terrain types randomly across the map
   * - 6 cities (placed first in corners)
   * - 6 cubes
   * - 6 temples
   * - 6 foundations
   * - 9 monsters
   * - 12 clouds
   * - Convert ALL remaining shallows to sea (100% conversion)
   * None of these should overlap with each other
   */
  placeSpecialTerrain(grid: HexGrid): void {
    // Ensure grid is valid before proceeding
    if (!grid) {
      console.error('placeSpecialTerrain: Invalid grid provided', grid);
      return;
    }

    const availableCells = grid.getCellsOfType('shallow');

    // Shuffle available cells for random placement
    UtilityService.shuffleArray(availableCells);

    // Place terrain types with their required counts (excluding cities which are already placed)
    const terrainPlacements: [TerrainType, number][] = [
      ['cubes', 6],
      ['temple', 6],
      ['foundations', 6],
      ['monsters', 9],
      ['clouds', 12],
    ];

    let cellIndex = 0;

    for (const [terrainType, count] of terrainPlacements) {
      let placed = 0;

      while (placed < count && cellIndex < availableCells.length) {
        const cell = availableCells[cellIndex];
        cellIndex++;

        if (cell!.terrain !== 'shallow') {
          continue;
        }

        // Check if this cell is a valid candidate for placement
        if (this.isValidTerrainPlacement(cell!, grid)) {
          cell!.terrain = terrainType;

          placed++;
        }
      }

      if (placed < count) {
        console.warn(
          `Could only place ${placed} of ${count} ${terrainType} cells even with relaxed constraints`,
        );
      }
    }

    // Final step: Convert ALL remaining shallows to sea (100% conversion)
    this.convertShallowsToSea(grid);

    // Assign colors to all sea hexes
    this.seaColorManager.assignColorsToSeaHexes(grid);
  }

  /**
   * Check if a cell is valid for terrain placement
   * Currently uses a simple constraint: must have at least one sea or shallow neighbor
   */
  private isValidTerrainPlacement(cell: HexCell, grid: HexGrid): boolean {
    // For now, use a simple constraint: cell must have at least one sea or shallow neighbor
    return this.hasShallowsOrSeaNeighbor(cell, grid);
  }

  /**
   * Check if a cell has at least one neighbor that is shallows or sea
   */
  private hasShallowsOrSeaNeighbor(cell: HexCell, grid: HexGrid): boolean {
    const neighbors = grid.getNeighborsOf(cell);
    return neighbors.some((neighbor) =>
      neighbor.terrain === 'shallow' || neighbor.terrain === 'sea'
    );
  }

  /**
   * Convert all remaining shallows to sea (100% conversion)
   */
  private convertShallowsToSea(grid: HexGrid): void {
    grid.forEachCell((cell) => {
      if (cell && cell.terrain === 'shallow') {
        cell.terrain = 'sea';
      }
    });
  }

  private setColors(grid: HexGrid, terrainType: TerrainType): void {
    const hexesOfType = grid.getCellsOfType(terrainType);
    UtilityService.shuffleArray(hexesOfType);
    const colorCount = COLOR_WHEEL.length;
    hexesOfType.forEach((cell, index) => {
      cell.color = COLOR_WHEEL[index % colorCount]!;
    });
  }

  /**
   * Convert some sea cells to shallows based on game constraints
   * This simulates the sea-to-shallows conversion that happens during gameplay
   */
  convertSeaToShallows(grid: HexGrid): void {
    const seaCells = grid.getCellsOfType('sea');

    // Shuffle sea cells for random selection
    UtilityService.shuffleArray(seaCells);

    let conversions = 0;
    const maxConversions = 10;

    // Try to convert up to 10 sea cells to shallows
    for (const cell of seaCells) {
      if (conversions >= maxConversions) {
        break;
      }

      // Check if this cell meets the constraints for conversion
      if (this.isEligibleForSeaToShallowsConversion(grid, cell)) {
        cell.terrain = 'shallow';
        cell.color = 'none'; // Reset color when converting to shallows
        conversions++;
      }
    }
  }

  /**
   * Check if a sea cell is eligible for conversion to shallows
   */
  private isEligibleForSeaToShallowsConversion(
    grid: HexGrid,
    cell: HexCell,
  ): boolean {
    // Constraint 1: Should not have zeus as neighbor
    if (grid.hasNeighborOfType(cell, 'zeus')) {
      return false;
    }

    // Constraint 2: Should not have city as neighbor
    if (grid.hasNeighborOfType(cell, 'city')) {
      return false;
    }

    // Constraint 3: Check all neighbors
    const pathfinder = new PathfindingService(this.hexGridOperations);
    const neighbors = grid.getNeighborsOf(cell);

    for (const neighbor of neighbors) {
      if (neighbor.terrain === 'sea') {
        // For sea neighbors: check if they can reach zeus (excluding the candidate cell)
        if (
          !pathfinder.canReachZeusFromSeaNeighbor(
            neighbor,
            cell,
            grid,
          )
        ) {
          return false;
        }
      } else if (neighbor.terrain !== 'shallow') {
        // For land neighbors (not sea or shallows): check if they have at least one sea neighbor
        if (!grid.hasNeighborOfType(neighbor, 'sea')) {
          return false;
        }
      }
      // For shallow neighbors, no additional checks needed
    }

    return true;
  }
  private hexGridOperations: HexGridOperations;
  private seaColorManager: SeaColorManager;
}
