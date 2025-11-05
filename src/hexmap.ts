// Hexagonal map representation for Oracle of Delphi
// The game uses a hexagon-shaped grid with radius 6 and various terrain types

export type TerrainType =
  | "zeus" // Zeus locations
  | "sea" // Sea tiles
  | "shallow" // Shallow water
  | "monsters" // Monster locations
  | "cubes" // Cube locations
  | "temple" // Temple locations
  | "clouds" // Cloud locations
  | "city" // City locations
  | "foundations"; // Foundation locations

export type HexColor =
  | "none"
  | "red"
  | "pink"
  | "blue"
  | "black"
  | "green"
  | "yellow";

export interface HexCell {
  // Coordinates using axial coordinate system for hex grids
  q: number; // Column coordinate
  r: number; // Row coordinate

  // Cell characteristics
  terrain: TerrainType;
  color: HexColor;
}

export class HexMap {
  private grid: HexCell[][];
  readonly width: number = 13; // -6 to +6 inclusive
  readonly height: number = 13; // -6 to +6 inclusive

  constructor() {
    this.grid = this.generateGrid();
  }

  /**
   * Get the grid for external access
   */
  getGrid(): HexCell[][] {
    return this.grid;
  }

  /**
   * Generate a hexagon-shaped grid with radius 6
   * for the Oracle of Delphi game
   */
  private generateGrid(): HexCell[][] {
    const grid: HexCell[][] = [];
    const radius = 6;

    // Generate hexagon-shaped grid
    for (let q = -radius; q <= radius; q++) {
      const row: HexCell[] = [];
      const r1 = Math.max(-radius, -q - radius);
      const r2 = Math.min(radius, -q + radius);

      for (let r = r1; r <= r2; r++) {
        // Calculate distance from center
        const distanceFromCenter = this.hexDistance(q, r, 0, 0);

        // Generate terrain based on distance from center
        const terrain = this.generateTerrain(q, r, distanceFromCenter);

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
   * Calculate distance between two hex cells using axial coordinates
   */
  private hexDistance(q1: number, r1: number, q2: number, r2: number): number {
    const s1 = -q1 - r1;
    const s2 = -q2 - r2;
    return (Math.abs(q1 - q2) + Math.abs(r1 - r2) + Math.abs(s1 - s2)) / 2;
  }

  /**
   * Generate terrain type based on position and distance from center
   */
  private generateTerrain(
    q: number,
    r: number,
    _distanceFromCenter: number,
  ): TerrainType {
    // For all hexes, default to shallows
    // The sea generation for Zeus neighbors will be handled after Zeus placement
    return "shallow";
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
   * Place special terrain types randomly across the map
   * - 6 cities (placed first in corners)
   * - 6 cubes
   * - 6 temples
   * - 6 foundations
   * - 9 monsters
   * - 12 clouds
   * - Convert ALL remaining shallows to sea (100% conversion)
   * None of these should overlap with each other or with the center 7 hexes
   */
  private placeSpecialTerrain(grid: HexCell[][]): void {
    // Ensure grid is valid before proceeding
    if (!grid || !Array.isArray(grid) || grid.length === 0) {
      console.error("placeSpecialTerrain: Invalid grid provided", grid);
      return;
    }
    
    // Place cities first in the corners
    this.placeCities(grid);

    const availableCells: HexCell[] = [];

    // Collect all cells that are shallows (not the center 7 hexes and not cities)
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
    this.shuffleArray(availableCells);

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

      // First pass: try to place with landmass constraints
      while (placed < count && cellIndex < availableCells.length) {
        const cell = availableCells[cellIndex];
        cellIndex++;

        // Check if this cell is a valid candidate for placement
        if (this.isValidTerrainPlacement(cell, grid)) {
          // Only place if the cell is still shallows (not already taken by previous placement)
          if (cell.terrain === "shallow") {
            cell.terrain = terrainType;
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

  /**
   * Calculate the size of the landmass (contiguous set of hexes that are neither sea nor shallows)
   * that contains the given hex using breadth-first search
   */
  private landmassSize(startHex: HexCell, grid: HexCell[][]): number {
    const visited = new Set<string>();
    const queue: HexCell[] = [startHex];
    visited.add(`${startHex.q},${startHex.r}`);

    while (queue.length > 0) {
      const current = queue.shift()!;

      // Check all 6 adjacent cells
      for (let direction = 0; direction < 6; direction++) {
        const adjacentCoords = this.getAdjacent(
          current.q,
          current.r,
          direction,
        );
        if (!adjacentCoords) {
          continue; // Skip if adjacent cell is off the map
        }

        const adjacentCell = this.getCellFromGrid(
          grid,
          adjacentCoords.q,
          adjacentCoords.r,
        );
        if (!adjacentCell) {
          continue; // Skip if adjacent cell is off the map
        }

        const cellKey = `${adjacentCell.q},${adjacentCell.r}`;

        // If we haven't visited this cell and it's part of the landmass (neither sea nor shallows)
        if (
          !visited.has(cellKey) &&
          (adjacentCell.terrain !== "shallow" && adjacentCell.terrain !== "sea")
        ) {
          visited.add(cellKey);
          queue.push(adjacentCell);
        }
      }
    }

    return visited.size;
  }

  /**
   * Check if a cell is a valid candidate for placing special terrain
   * - If it is not shallows, reject it
   * - If it is shallows, check all 6 adjacent cells
   * - For each adjacent cell, make sure they will still be adjacent to either a shallows or sea
   * - If any adjacent cell is off the map, skip it (treat it as non-shallows and non-sea)
   * - Also check that placing special terrain here won't create a landmass larger than 4 hexes
   */
  private isValidTerrainPlacement(cell: HexCell, grid: HexCell[][]): boolean {
    // If it is not shallows, reject it
    if (cell.terrain !== "shallow") {
      return false;
    }

    // Check all 6 adjacent cells
    for (let direction = 0; direction < 6; direction++) {
      const adjacentCoords = this.getAdjacent(cell.q, cell.r, direction);
      if (!adjacentCoords) {
        continue; // Skip if adjacent cell is off the map
      }

      const adjacentCell = this.getCellFromGrid(
        grid,
        adjacentCoords.q,
        adjacentCoords.r,
      );
      if (!adjacentCell) {
        continue; // Skip if adjacent cell is off the map
      }

      // Check if this adjacent cell will still have at least one shallows or sea neighbor
      // after we place the special terrain here
      if (!this.hasShallowsOrSeaNeighbor(adjacentCell, cell, grid)) {
        return false;
      }
    }

    // Check landmass size constraint: placing special terrain here shouldn't create
    // a landmass larger than 4 hexes
    // First, temporarily change the cell's terrain to simulate the placement
    const originalTerrain = cell.terrain;
    cell.terrain = "cubes"; // Use any special terrain type for simulation

    // Find the largest landmass among the adjacent cells
    let maxLandmassSize = 0;
    for (let direction = 0; direction < 6; direction++) {
      const adjacentCoords = this.getAdjacent(cell.q, cell.r, direction);
      if (!adjacentCoords) {
        continue;
      }

      const adjacentCell = this.getCellFromGrid(
        grid,
        adjacentCoords.q,
        adjacentCoords.r,
      );
      if (!adjacentCell) {
        continue;
      }

      // Only check landmass for cells that are NOT sea or shallows (actual landmass)
      if (
        adjacentCell.terrain !== "shallow" && adjacentCell.terrain !== "sea"
      ) {
        const size = this.landmassSize(adjacentCell, grid);
        if (size > maxLandmassSize) {
          maxLandmassSize = size;
        }
      }
    }

    // Restore the original terrain
    cell.terrain = originalTerrain;

    // Reject if placing special terrain would create a landmass larger than 4 hexes
    // But only if there are adjacent landmasses to check (maxLandmassSize > 0)
    if (maxLandmassSize > 0 && maxLandmassSize > 4) {
      return false;
    }

    return true;
  }

  /**
   * Check if a cell has at least one shallows or sea neighbor, excluding the candidate cell
   * that we're considering placing special terrain on
   */
  private hasShallowsOrSeaNeighbor(
    cell: HexCell,
    candidateCell: HexCell,
    grid: HexCell[][],
  ): boolean {
    for (let direction = 0; direction < 6; direction++) {
      const adjacentCoords = this.getAdjacent(cell.q, cell.r, direction);
      if (!adjacentCoords) {
        continue; // Skip if adjacent cell is off the map
      }

      const adjacentCell = this.getCellFromGrid(
        grid,
        adjacentCoords.q,
        adjacentCoords.r,
      );
      if (!adjacentCell) {
        continue; // Skip if adjacent cell is off the map
      }

      // Skip the candidate cell (the one we're considering placing special terrain on)
      if (
        adjacentCell.q === candidateCell.q && adjacentCell.r === candidateCell.r
      ) {
        continue;
      }

      // Check if this neighbor is shallows or sea
      if (
        adjacentCell.terrain === "shallow" || adjacentCell.terrain === "sea"
      ) {
        return true;
      }
    }

    return false;
  }

  /**
   * Convert ALL remaining shallows to sea hexes (100% conversion)
   * This is the final step after placing all special terrain types
   */
  private convertShallowsToSea(grid: HexCell[][]): void {
    // Convert all remaining shallow cells to sea
    for (let arrayQ = 0; arrayQ < grid.length; arrayQ++) {
      const row = grid[arrayQ];
      if (row) {
        for (let arrayR = 0; arrayR < row.length; arrayR++) {
          const cell = row[arrayR];
          if (cell && cell.terrain === "shallow") {
            cell.terrain = "sea";
          }
        }
      }
    }

    // After converting all shallows to sea, try to convert one random sea back to shallows
    this.tryConvertSeaToShallows(grid);
  }

  /**
   * Try to convert random sea hexes back to shallows with specific constraints
   * Make 10 attempts on random sea hexes. However many work or don't work is fine.
   */
  private tryConvertSeaToShallows(grid: HexCell[][]): void {
    // Get all sea cells
    const seaCells: HexCell[] = [];
    for (let arrayQ = 0; arrayQ < grid.length; arrayQ++) {
      const row = grid[arrayQ];
      if (row) {
        for (let arrayR = 0; arrayR < row.length; arrayR++) {
          const cell = row[arrayR];
          if (cell && cell.terrain === "sea") {
            seaCells.push(cell);
          }
        }
      }
    }

    // If there are no sea cells, nothing to convert
    if (seaCells.length === 0) {
      return;
    }

    // Make 10 attempts on random sea tiles
    const attempts = 10;
    const shuffledSeaCells = [...seaCells];
    this.shuffleArray(shuffledSeaCells);
    
    let successfulConversions = 0;
    let attemptsMade = 0;

    for (let i = 0; i < Math.min(attempts, shuffledSeaCells.length); i++) {
      const candidateCell = shuffledSeaCells[i];
      attemptsMade++;

      // 1. If the hex has zeus as its neighbor, don't convert
      if (this.hasNeighborOfType(candidateCell, grid, "zeus")) {
        continue;
      }

      // 2. If the hex has a city as its neighbor, don't convert
      if (this.hasNeighborOfType(candidateCell, grid, "city")) {
        continue;
      }

      // 3. Tentatively convert the candidate cell to shallows
      const originalTerrain = candidateCell.terrain;
      candidateCell.terrain = "shallow";

      // 4. For each sea neighbor of the candidate cell, check if it can trace a path back to zeus
      // using only sea tiles (excluding the candidate cell which is now shallows)
      const seaNeighbors = this.getNeighborsOfType(candidateCell, grid, "sea");
      let allSeaNeighborsCanReachZeus = true;

      for (const seaNeighbor of seaNeighbors) {
        if (!this.canReachZeusFromSeaNeighbor(seaNeighbor, candidateCell, grid)) {
          allSeaNeighborsCanReachZeus = false;
          break;
        }
      }

      // 5. If any sea neighbor cannot reach zeus, revert the candidate cell back to sea
      if (!allSeaNeighborsCanReachZeus) {
        candidateCell.terrain = originalTerrain;
        continue;
      }

      // 6. If we get to this point, leave the candidate cell as shallows
      // (it's already converted from step 3)
      successfulConversions++;
    }

    console.log(`Made ${attemptsMade} attempts to convert sea to shallows, ${successfulConversions} successful conversions`);
  }

  /**
   * Check if a sea neighbor can reach zeus, considering that the candidate cell
   * might be converted to shallows (so we exclude it from the path)
   */
  private canReachZeusFromSeaNeighbor(seaNeighbor: HexCell, candidateCell: HexCell, grid: HexCell[][]): boolean {
    const visited = new Set<string>();
    const queue: HexCell[] = [seaNeighbor];
    visited.add(`${seaNeighbor.q},${seaNeighbor.r}`);

    while (queue.length > 0) {
      const current = queue.shift()!;

      // Check all 6 adjacent cells
      for (let direction = 0; direction < 6; direction++) {
        const adjacentCoords = this.getAdjacent(current.q, current.r, direction);
        if (!adjacentCoords) {
          continue; // Skip if adjacent cell is off the map
        }

        const adjacentCell = this.getCellFromGrid(grid, adjacentCoords.q, adjacentCoords.r);
        if (!adjacentCell) {
          continue; // Skip if adjacent cell is off the map
        }

        const cellKey = `${adjacentCell.q},${adjacentCell.r}`;

        // Skip the candidate cell (it will become shallows, not part of sea path)
        if (adjacentCell.q === candidateCell.q && adjacentCell.r === candidateCell.r) {
          continue;
        }

        // If we found zeus, return true
        if (adjacentCell.terrain === "zeus") {
          return true;
        }

        // If we haven't visited this cell and it's sea (valid path)
        if (!visited.has(cellKey) && adjacentCell.terrain === "sea") {
          visited.add(cellKey);
          queue.push(adjacentCell);
        }
      }
    }

    // If we exhausted all possibilities without finding zeus, return false
    return false;
  }

  /**
   * Check if a cell has a neighbor of a specific terrain type
   */
  private hasNeighborOfType(cell: HexCell, grid: HexCell[][], terrainType: TerrainType): boolean {
    const neighbors = this.getNeighborsFromGrid(cell.q, cell.r, grid);
    return neighbors.some(neighbor => neighbor && neighbor.terrain === terrainType);
  }

  /**
   * Get all neighbors of a cell that have a specific terrain type
   */
  private getNeighborsOfType(cell: HexCell, grid: HexCell[][], terrainType: TerrainType): HexCell[] {
    const neighbors = this.getNeighborsFromGrid(cell.q, cell.r, grid);
    return neighbors.filter(neighbor => neighbor && neighbor.terrain === terrainType);
  }

  /**
   * Check if a sea cell can trace a path back to zeus using only sea tiles
   * Uses breadth-first search to find a path to zeus
   */
  private canReachZeus(startCell: HexCell, grid: HexCell[][]): boolean {
    const visited = new Set<string>();
    const queue: HexCell[] = [startCell];
    visited.add(`${startCell.q},${startCell.r}`);

    while (queue.length > 0) {
      const current = queue.shift()!;

      // Check all 6 adjacent cells
      for (let direction = 0; direction < 6; direction++) {
        const adjacentCoords = this.getAdjacent(current.q, current.r, direction);
        if (!adjacentCoords) {
          continue; // Skip if adjacent cell is off the map
        }

        const adjacentCell = this.getCellFromGrid(grid, adjacentCoords.q, adjacentCoords.r);
        if (!adjacentCell) {
          continue; // Skip if adjacent cell is off the map
        }

        const cellKey = `${adjacentCell.q},${adjacentCell.r}`;

        // If we found zeus, return true
        if (adjacentCell.terrain === "zeus") {
          return true;
        }

        // If we haven't visited this cell and it's sea (valid path)
        if (!visited.has(cellKey) && adjacentCell.terrain === "sea") {
          visited.add(cellKey);
          queue.push(adjacentCell);
        }
      }
    }

    // If we exhausted all possibilities without finding zeus, return false
    return false;
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
    const zeusCell = this.getCellFromGrid(grid, zeusQ, zeusR);
    if (zeusCell) {
      // Place Zeus at the selected neighbor hex
      zeusCell.terrain = "zeus";
      console.log(`Zeus placed at (${zeusQ}, ${zeusR})`);

      // Set all neighbors of the Zeus hex to sea
      this.setZeusNeighborsToSea(grid, zeusQ, zeusR);
    } else {
      console.error(`Failed to place Zeus at (${zeusQ}, ${zeusR})`);
    }
  }

  /**
   * Place the 6 city tiles near the corners of the hex map
   * For each corner, pick a random direction (+2 or +4) and a random distance (0 to 2)
   * Place the city there, then set 2 random neighboring hexes to sea
   */
  private placeCities(grid: HexCell[][]): void {
    for (let cornerDirection = 0; cornerDirection < 6; cornerDirection++) {
      // Get the corner coordinates
      const cornerCoords = this.getCorner(cornerDirection);

      // Pick a random direction offset: either +2 or +4
      const directionOffset = Math.random() < 0.5 ? 2 : 4;
      const placementDirection = (cornerDirection + directionOffset) % 6;

      // Pick a random distance: 0 to 2
      const distance = Math.floor(Math.random() * 3);

      // Calculate placement coordinates
      let placementQ = cornerCoords.q;
      let placementR = cornerCoords.r;

      // Move from the corner in the chosen direction for the chosen distance
      for (let i = 0; i < distance; i++) {
        const adjacent = this.getAdjacent(
          placementQ,
          placementR,
          placementDirection,
        );
        if (!adjacent) break;

        placementQ = adjacent.q;
        placementR = adjacent.r;
      }

      // Place the city if the cell exists
      const cell = this.getCellFromGrid(grid, placementQ, placementR);
      if (cell && cell.terrain === "shallow") {
        cell.terrain = "city";

        // After placing city, set 2 random neighboring hexes to sea
        this.setRandomNeighborsToSea(grid, placementQ, placementR);
      } else {
        // Fallback: place at the corner if the randomized placement failed
        const cornerCell = this.getCellFromGrid(
          grid,
          cornerCoords.q,
          cornerCoords.r,
        );
        if (cornerCell && cornerCell.terrain === "shallow") {
          cornerCell.terrain = "city";

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
      const adjacentCoords = this.getAdjacent(zeusQ, zeusR, direction);
      if (adjacentCoords) {
        const neighbor = this.getCellFromGrid(grid, adjacentCoords.q, adjacentCoords.r);
        if (neighbor) {
          neighbors.push(neighbor);
        }
      }
    }

    // Set all neighbors to sea (including the center cell)
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
      const adjacentCoords = this.getAdjacent(q, r, direction);
      if (adjacentCoords) {
        const neighbor = this.getCellFromGrid(grid, adjacentCoords.q, adjacentCoords.r);
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
      this.shuffleArray(eligibleNeighbors);

      // Set up to 2 random neighbors to sea
      const neighborsToConvert = Math.min(2, eligibleNeighbors.length);
      for (let i = 0; i < neighborsToConvert; i++) {
        eligibleNeighbors[i].terrain = "sea";
      }
    }
  }

  /**
   * Shuffle array using Fisher-Yates algorithm
   */
  private shuffleArray<T>(array: T[]): void {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
  }

  /**
   * Get a cell at specific coordinates from a provided grid
   */
  private getCellFromGrid(
    grid: HexCell[][],
    q: number,
    r: number,
  ): HexCell | null {
    // Check if grid is valid
    if (!grid || !Array.isArray(grid) || grid.length === 0) {
      return null;
    }

    // Convert axial coordinates to array indices
    const arrayQ = q + 6; // Offset to make coordinates non-negative

    // Check if q coordinate is within bounds
    if (arrayQ < 0 || arrayQ >= grid.length) {
      return null;
    }

    const row = grid[arrayQ];
    if (!row) {
      return null;
    }

    // For hexagonal grid, we need to find the cell with matching r coordinate
    // Since each row only contains valid r coordinates for that q
    for (const cell of row) {
      if (cell.r === r) {
        return cell;
      }
    }

    return null;
  }

  /**
   * Get a cell at specific coordinates
   */
  getCell(q: number, r: number): HexCell | null {
    return this.getCellFromGrid(this.grid, q, r);
  }

  /**
   * Get the coordinates of an adjacent hex in a specific direction
   * @param q - The q coordinate of the starting hex
   * @param r - The r coordinate of the starting hex
   * @param direction - Direction (0-5) where:
   *   0: Northeast (q+1, r-1)
   *   1: East (q+1, r+0)
   *   2: Southeast (q+0, r+1)
   *   3: Southwest (q-1, r+1)
   *   4: West (q-1, r+0)
   *   5: Northwest (q+0, r-1)
   * @returns Object with {q, r} coordinates of the adjacent hex, or null if direction is invalid
   */
  getAdjacent(
    q: number,
    r: number,
    direction: number,
  ): { q: number; r: number } | null {
    if (direction < 0 || direction > 5) {
      return null;
    }

    const directionVectors = [
      [1, -1], // 0: Northeast
      [1, 0], // 1: East
      [0, 1], // 2: Southeast
      [-1, 1], // 3: Southwest
      [-1, 0], // 4: West
      [0, -1], // 5: Northwest
    ];

    const [dq, dr] = directionVectors[direction];
    return {
      q: q + dq,
      r: r + dr,
    };
  }

  /**
   * Get all neighboring cells for a given cell
   */
  getNeighbors(q: number, r: number): HexCell[] {
    return this.getNeighborsFromGrid(q, r, this.grid);
  }

  /**
   * Get all neighboring cells for a given cell from a specific grid
   */
  private getNeighborsFromGrid(q: number, r: number, grid: HexCell[][]): HexCell[] {
    const neighbors: HexCell[] = [];

    // Check if grid is valid
    if (!grid || !Array.isArray(grid) || grid.length === 0) {
      return neighbors;
    }

    // Check all 6 directions using getAdjacent
    for (let direction = 0; direction < 6; direction++) {
      const adjacentCoords = this.getAdjacent(q, r, direction);
      if (adjacentCoords) {
        const neighbor = this.getCellFromGrid(grid, adjacentCoords.q, adjacentCoords.r);
        if (neighbor) {
          neighbors.push(neighbor);
        }
      }
    }

    return neighbors;
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
   * Get the corner coordinates for a given direction by starting at center (0,0)
   * and traversing outward to the edge of the map
   * @param direction - Direction (0-5) where:
   *   0: Northeast (q+1, r-1)
   *   1: East (q+1, r+0)
   *   2: Southeast (q+0, r+1)
   *   3: Southwest (q-1, r+1)
   *   4: West (q-1, r+0)
   *   5: Northwest (q+0, r-1)
   * @returns The corner coordinates {q, r} at the edge of the map in the specified direction
   */
  private getCorner(direction: number): { q: number; r: number } {
    let currentQ = 0;
    let currentR = 0;

    // Traverse outward in the specified direction to the edge of the map
    for (let distance = 1; distance <= 6; distance++) {
      const adjacent = this.getAdjacent(currentQ, currentR, direction);
      if (!adjacent) break;

      currentQ = adjacent.q;
      currentR = adjacent.r;
    }

    return { q: currentQ, r: currentR };
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
}

// Game state
let gameMap: HexMap = new HexMap();

// Export the current game map instance for SVG generation
export function getCurrentMap(): HexMap {
  return gameMap;
}

// UI Functions
export function generateNewMap(): HexMap {
  gameMap = new HexMap();
  console.log("New map generated (old method)");
  return gameMap;
}

export function getMapStatistics() {
  const terrainCounts: Record<string, number> = {};
  const grid = gameMap.getGrid();
  let totalCells = 0;

  // The grid is a jagged array (hexagon shape), so we need to iterate through each row
  for (let arrayQ = 0; arrayQ < grid.length; arrayQ++) {
    const row = grid[arrayQ];
    if (row) {
      for (let arrayR = 0; arrayR < row.length; arrayR++) {
        const cell = row[arrayR];
        if (cell) {
          terrainCounts[cell.terrain] = (terrainCounts[cell.terrain] || 0) + 1;
          totalCells++;
        }
      }
    }
  }

  return {
    dimensions: {
      width: gameMap.width,
      height: gameMap.height,
    },
    terrainCounts,
    totalCells,
  };
}

export function getMap() {
  return {
    map: gameMap.serialize(),
    dimensions: {
      width: gameMap.width,
      height: gameMap.height,
    },
  };
}
