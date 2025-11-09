// TerrainPlacementManager - Handles all terrain generation and placement logic

import type { TerrainType, HexColor, HexCell } from "../types.ts";
import { ALL_COLORS } from "../types.ts";
import type { HexGridOperations } from "./HexGridOperations.ts";
import type { PathfindingService } from "./PathfindingService.ts";
import type { SeaColorManager } from "./SeaColorManager.ts";
import type { UtilityService } from "./UtilityService.ts";

export class TerrainPlacementManager {
  private hexGridOperations: HexGridOperations;
  private pathfindingService: PathfindingService;
  private seaColorManager: SeaColorManager;
  private utilityService: UtilityService;

  constructor(
    hexGridOperations: HexGridOperations,
    pathfindingService: PathfindingService,
    seaColorManager: SeaColorManager,
    utilityService: UtilityService
  ) {
    this.hexGridOperations = hexGridOperations;
    this.pathfindingService = pathfindingService;
    this.seaColorManager = seaColorManager;
    this.utilityService = utilityService;
  }

  /**
   * Generate a hexagon-shaped grid with radius 6
   * for the Quests of Zeus game
   */
  generateGrid(): HexCell[][] {
    const grid: HexCell[][] = [];
    const radius = 6;

    // Generate hexagon-shaped grid
    for (let q = -radius; q <= radius; q++) {
      const row: HexCell[] = [];
      const r1 = Math.max(-radius, -q - radius);
      const r2 = Math.min(radius, -q + radius);

      for (let r = r1; r <= r2; r++) {
        // Calculate distance from center
        const distanceFromCenter = this.hexGridOperations.hexDistance(q, r, 0, 0);

        // For all hexes, default to shallows
        // The sea generation for Zeus neighbors will be handled after Zeus placement
        const terrain: TerrainType = "shallow";

        const cell: HexCell = {
          q,
          r,
          terrain,
          color: "none",
        };

        // Add special locations based on terrain and position
        this.addSpecialLocations(cell, q, r, distanceFromCenter);

        row.push(cell);
      }
      grid.push(row);
    }

    // Ensure grid is valid before placing special terrain
    if (!grid || grid.length === 0) {
      console.error("generateGrid: Grid generation failed, grid is empty");
      return grid;
    }

    // Place Zeus randomly in one of the neighbor hexes of the center
    this.placeZeus(grid);

    // Place special terrain types randomly
    this.placeSpecialTerrain(grid);

    return grid;
  }

  /**
   * Add special locations like oracles, ports, and sanctuaries
   * Note: Special locations are now represented by terrain types
   */
  private addSpecialLocations(
    _cell: HexCell,
    _q: number,
    _r: number,
    _distanceFromCenter: number,
  ): void {
    // Special locations are now handled through terrain types
    // oracles, ports, and sanctuaries are represented by their respective terrain types
  }

  /**
   * Place Zeus randomly in one of the neighbor hexes of the center
   * and set all neighbors of the chosen Zeus hex to sea
   */
  private placeZeus(grid: HexCell[][]): void {
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
    const [zeusQ, zeusR] = neighborHexes[randomIndex];

    // Find the cell for Zeus placement
    const zeusCell = this.hexGridOperations.getCellFromGrid(grid, zeusQ, zeusR);
    if (zeusCell) {
      // Place Zeus at the selected neighbor hex
      zeusCell.terrain = "zeus";

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
  private placeCities(grid: HexCell[][]): void {
    // Create a shuffled copy of the colors to assign randomly to cities
    const shuffledColors = [...ALL_COLORS];
    this.utilityService.shuffleArray(shuffledColors);

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
      const cell = this.hexGridOperations.getCellFromGrid(grid, placementQ, placementR);
      if (cell && cell.terrain === "shallow") {
        cell.terrain = "city";
        // Assign a random color to the city
        cell.color = shuffledColors[cornerDirection];
        // Initialize statues counter for this city to 3 (all statues start on cities)
        cell.statues = 3;

        // After placing city, set 2 random neighboring hexes to sea
        this.setRandomNeighborsToSea(grid, placementQ, placementR);
      } else {
        // Fallback: place at the corner if the randomized placement failed
        const cornerCell = this.hexGridOperations.getCellFromGrid(
          grid,
          cornerCoords.q,
          cornerCoords.r,
        );
        if (cornerCell && cornerCell.terrain === "shallow") {
          cornerCell.terrain = "city";
          // Assign a random color to the city
          cornerCell.color = shuffledColors[cornerDirection];
          // Initialize statues counter for this city to 3 (all statues start on cities)
          cornerCell.statues = 3;

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
    grid: HexCell[][],
    zeusQ: number,
    zeusR: number,
  ): void {
    // Get all neighboring cells of the Zeus hex
    const neighbors: HexCell[] = [];

    // Check all 6 directions using getAdjacent
    for (let direction = 0; direction < 6; direction++) {
      const adjacentCoords = this.hexGridOperations.getAdjacent(zeusQ, zeusR, direction);
      if (adjacentCoords) {
        const neighbor = this.hexGridOperations.getCellFromGrid(
          grid,
          adjacentCoords.q,
          adjacentCoords.r,
        );
        if (neighbor) {
          neighbors.push(neighbor);
        }
      }
    }

    // Set all neighbors of Zeus to sea
    for (const neighbor of neighbors) {
      neighbor.terrain = "sea";
    }
  }

  /**
   * Set 2 random neighboring hexes of a given cell to sea
   * @param grid - The grid containing all cells
   * @param q - The q coordinate of the center cell
   * @param r - The r coordinate of the center cell
   */
  private setRandomNeighborsToSea(
    grid: HexCell[][],
    q: number,
    r: number,
  ): void {
    // Get all neighboring cells using the provided grid
    const neighbors: HexCell[] = [];

    // Check all 6 directions using getAdjacent
    for (let direction = 0; direction < 6; direction++) {
      const adjacentCoords = this.hexGridOperations.getAdjacent(q, r, direction);
      if (adjacentCoords) {
        const neighbor = this.hexGridOperations.getCellFromGrid(
          grid,
          adjacentCoords.q,
          adjacentCoords.r,
        );
        if (neighbor) {
          neighbors.push(neighbor);
        }
      }
    }

    // Filter neighbors that are currently shallows (eligible to become sea)
    const eligibleNeighbors = neighbors.filter((cell) =>
      cell.terrain === "shallow"
    );

    // If there are eligible neighbors, randomly select 2 of them
    if (eligibleNeighbors.length > 0) {
      // Shuffle the eligible neighbors
      this.utilityService.shuffleArray(eligibleNeighbors);

      // Set up to 2 random neighbors to sea
      const neighborsToConvert = Math.min(2, eligibleNeighbors.length);
      for (let i = 0; i < neighborsToConvert; i++) {
        eligibleNeighbors[i].terrain = "sea";
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
  placeSpecialTerrain(grid: HexCell[][]): void {
    // Ensure grid is valid before proceeding
    if (!grid || !Array.isArray(grid) || grid.length === 0) {
      console.error("placeSpecialTerrain: Invalid grid provided", grid);
      return;
    }

    // Place cities first in the corners
    this.placeCities(grid);

    const availableCells: HexCell[] = [];

    // Collect all cells that are shallows
    // We need to iterate through the grid array directly since getCell expects a different structure
    for (let arrayQ = 0; arrayQ < grid.length; arrayQ++) {
      const row = grid[arrayQ];
      if (row) {
        for (let arrayR = 0; arrayR < row.length; arrayR++) {
          const cell = row[arrayR];
          if (cell && cell.terrain === "shallow") {
            availableCells.push(cell);
          }
        }
      }
    }

    // Shuffle available cells for random placement
    this.utilityService.shuffleArray(availableCells);

    // Place terrain types with their required counts (excluding cities which are already placed)
    const terrainPlacements: [TerrainType, number][] = [
      ["cubes", 6],
      ["temple", 6],
      ["foundations", 6],
      ["monsters", 9],
      ["clouds", 12],
    ];

    let cellIndex = 0;

    for (const [terrainType, count] of terrainPlacements) {
      let placed = 0;

      // For temples and clouds, create shuffled color arrays to assign random colors
      let templeColors: HexColor[] = [];
      let cloudColors: HexColor[] = [];
      if (terrainType === "temple") {
        templeColors = [...ALL_COLORS];
        this.utilityService.shuffleArray(templeColors);
      } else if (terrainType === "clouds") {
        // For clouds, we need 12 hexes with 6 colors, so each color appears twice
        // Create an array with each color repeated twice
        cloudColors = [];
        for (const color of ALL_COLORS) {
          cloudColors.push(color);
          cloudColors.push(color);
        }
        // Shuffle the colors to distribute them randomly
        this.utilityService.shuffleArray(cloudColors);
      }

      // First pass: try to place with landmass constraints
      while (placed < count && cellIndex < availableCells.length) {
        const cell = availableCells[cellIndex];
        cellIndex++;

        // Check if this cell is a valid candidate for placement
        if (this.isValidTerrainPlacement(cell, grid)) {
          // Only place if the cell is still shallows (not already taken by previous placement)
          if (cell.terrain === "shallow") {
            cell.terrain = terrainType;

            // Assign random color to temples, similar to cities
            if (terrainType === "temple") {
              cell.color = templeColors[placed];
            } // Assign colors to clouds - each color appears on exactly 2 cloud hexes
            else if (terrainType === "clouds") {
              cell.color = cloudColors[placed];
            }

            placed++;
          }
        }
      }

      // Second pass: if we couldn't place enough, relax constraints for remaining cells
      if (placed < count) {
        console.warn(
          `Could only place ${placed} of ${count} ${terrainType} cells with constraints, relaxing constraints for remaining ${
            count - placed
          }`,
        );

        // Reset cellIndex to start from beginning for fallback placement
        cellIndex = 0;

        while (placed < count && cellIndex < availableCells.length) {
          const cell = availableCells[cellIndex];
          cellIndex++;

          // Fallback: place on any shallow cell without landmass constraint
          if (cell.terrain === "shallow") {
            cell.terrain = terrainType;

            // Assign random color to temples, similar to cities
            if (terrainType === "temple") {
              cell.color = templeColors[placed];
            } // Assign colors to clouds - each color appears on exactly 2 cloud hexes
            else if (terrainType === "clouds") {
              cell.color = cloudColors[placed];
            }

            placed++;
          }
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
  }

  // Note: Additional methods like landmassSize, isValidTerrainPlacement, 
  // hasShallowsOrSeaNeighbor, convertShallowsToSea, and tryConvertSeaToShallows
  // would be added here in a complete implementation
}