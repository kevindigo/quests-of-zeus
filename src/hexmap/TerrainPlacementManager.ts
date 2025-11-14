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
    const grid = new HexGrid(radius, 'sea');

    this.placeZeus(grid);
    this.placeCities(grid);
    this.placeTerrainOfType(grid, 6, 'cubes');
    this.placeTerrainOfType(grid, 6, 'temple');
    this.placeTerrainOfType(grid, 6, 'foundations');
    this.placeTerrainOfType(grid, 9, 'monsters');
    this.placeTerrainOfType(grid, 12, 'clouds');

    this.convertEdgesToShallows(grid);
    this.convertSomeSeaToShallows(grid);

    this.setColors(grid, 'temple');
    this.setColors(grid, 'clouds');
    this.seaColorManager.assignColorsToSeaHexes(grid);
    return grid;
  }

  /**
   * Place Zeus randomly in one of the neighbor hexes of the center
   * and set all neighbors of the chosen Zeus hex to sea
   */
  private placeZeus(grid: HexGrid): void {
    const randomDirection = Math.floor(Math.random() * 6);
    const zeusCoordinates = HexGrid.getVector(randomDirection);
    const zeusCell = grid.getCell(zeusCoordinates);
    if (!zeusCell) {
      throw new Error(
        `Cell at ${JSON.stringify(zeusCoordinates)} does not exist?`,
      );
    }
    zeusCell.terrain = 'zeus';
    const neighbors = grid.getNeighborsOf(zeusCell);
    UtilityService.shuffleArray(neighbors);
    neighbors.forEach((neighbor, index) => {
      neighbor.terrain = 'sea';
      neighbor.color = COLOR_WHEEL[index]!;
    });
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
      const cityLocation = {
        q: placementQ,
        r: placementR,
      };
      const cell = grid.getCell(cityLocation);
      if (!cell) {
        throw new Error(
          `Couldn't find cell to place city at ${JSON.stringify(cityLocation)}`,
        );
      }
      cell.terrain = 'city';
      // Assign a random color to the city
      const color = shuffledColors[cornerDirection] || 'none';
      cell.color = color;
    }
  }

  private placeTerrainOfType(
    grid: HexGrid,
    count: number,
    terrainType: TerrainType,
  ): number {
    let placed = 0;

    const seaCells = grid.getCellsOfType('sea');
    const availableCells = seaCells.filter((cell) => {
      return cell.color === 'none';
    });
    UtilityService.shuffleArray(availableCells);

    let cellIndex = 0;
    while (placed < count && cellIndex < availableCells.length) {
      const cell = availableCells[cellIndex]!;
      cellIndex++;

      const wasAlreadyUsed = cell.terrain !== 'sea';
      if (wasAlreadyUsed) {
        continue;
      }

      if (this.isValidTerrainPlacement(grid, cell!, terrainType)) {
        cell!.terrain = terrainType;
        placed++;
      }
    }

    if (placed < count) {
      console.warn(
        `Could only place ${placed} of ${count} ${terrainType} cells`,
      );
    }

    return placed;
  }

  private isValidTerrainPlacement(
    grid: HexGrid,
    cell: HexCell,
    proposedTerrainType: TerrainType,
  ): boolean {
    if (!this.isEligibleToBeLandOrShallows(grid, cell)) {
      return false;
    }

    cell.terrain = proposedTerrainType;
    try {
      const MAX_ISLAND_SIZE = 5;
      const islandSize = grid.islandSize(cell);
      // console.warn(`Island size: ${islandSize}`);
      if (islandSize > MAX_ISLAND_SIZE) {
        return false;
      }
    } finally {
      cell.terrain = 'sea';
    }

    return true;
  }

  private setColors(grid: HexGrid, terrainType: TerrainType): void {
    const hexesOfType = grid.getCellsOfType(terrainType);
    UtilityService.shuffleArray(hexesOfType);
    const colorCount = COLOR_WHEEL.length;
    hexesOfType.forEach((cell, index) => {
      cell.color = COLOR_WHEEL[index % colorCount]!;
    });
  }

  private convertEdgesToShallows(grid: HexGrid): void {
    const radius = grid.getRadius();
    const seaEdges: HexCell[] = [];
    grid.forEachCell((cell) => {
      const distance = HexGrid.hexDistance(0, 0, cell.q, cell.r);
      if (distance == radius && cell.terrain === 'sea') {
        seaEdges.push(cell);
      }
    });

    UtilityService.shuffleArray(seaEdges);
    seaEdges.forEach((edgeCell) => {
      const isEligible = this.isEligibleToBeLandOrShallows(grid, edgeCell);
      const cityNeighbors = grid.getNeighborsOfType(edgeCell, 'city');
      const seaNeighbors = grid.getNeighborsOfType(edgeCell, 'sea');
      if (isEligible && cityNeighbors.length < 1 && seaNeighbors.length >= 2) {
        edgeCell.terrain = 'shallow';
      }
    });
  }

  private convertSomeSeaToShallows(grid: HexGrid): void {
    const seaCells = grid.getCellsOfType('sea');

    // Shuffle sea cells for random selection
    UtilityService.shuffleArray(seaCells);

    let conversions = 0;
    const maxConversions = 5;

    // Try to convert up to 10 sea cells to shallows
    for (const cell of seaCells) {
      if (conversions >= maxConversions) {
        break;
      }

      // Check if this cell meets the constraints for conversion
      if (this.isEligibleToBeLandOrShallows(grid, cell)) {
        cell.terrain = 'shallow';
        cell.color = 'none'; // Reset color when converting to shallows
        conversions++;
      }
    }
  }

  /**
   * Check if a sea cell is eligible for conversion to shallows
   */
  private isEligibleToBeLandOrShallows(
    grid: HexGrid,
    cell: HexCell,
  ): boolean {
    if (grid.hasNeighborOfType(cell, 'zeus')) {
      return false;
    }

    if (this.wouldBlockAccessToZeusIfShallow(grid, cell)) {
      return false;
    }

    return true;
  }

  private wouldBlockAccessToZeusIfShallow(
    grid: HexGrid,
    cell: HexCell,
  ): boolean {
    const pathfinder = new PathfindingService(this.hexGridOperations);
    const neighbors = grid.getNeighborsOf(cell);

    cell.terrain = 'shallow';
    try {
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
            return true;
          }
        } else if (neighbor.terrain !== 'shallow') {
          // Land neighbors must still have at least one sea neighbor
          if (!grid.hasNeighborOfType(neighbor, 'sea')) {
            return true;
          }
        }
        // For shallow neighbors, no additional checks needed
      }
    } finally {
      cell.terrain = 'sea';
    }
    return false;
  }
  private hexGridOperations: HexGridOperations;
  private seaColorManager: SeaColorManager;
}
