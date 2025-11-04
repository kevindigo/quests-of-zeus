// Hexagonal map representation for Oracle of Delphi
// The game uses a hexagon-shaped grid with radius 6 and various terrain types

export type TerrainType = 
  | "zeus"          // Zeus locations
  | "sea"           // Sea tiles
  | "shallow"       // Shallow water
  | "monsters"      // Monster locations
  | "cubes"         // Cube locations
  | "temple"        // Temple locations
  | "clouds"        // Cloud locations
  | "city"          // City locations
  | "foundations";  // Foundation locations

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
  q: number;        // Column coordinate
  r: number;        // Row coordinate
  
  // Cell characteristics
  terrain: TerrainType;
  color: HexColor;
}

export class HexMap {
  private grid: HexCell[][];
  readonly width: number = 13;  // -6 to +6 inclusive
  readonly height: number = 13;  // -6 to +6 inclusive

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
          color: "none"
        };
        
        // Add special locations based on terrain and position
        this.addSpecialLocations(cell, q, r, distanceFromCenter);
        
        row.push(cell);
      }
      grid.push(row);
    }
    
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
  private generateTerrain(q: number, r: number, distanceFromCenter: number): TerrainType {
    // Center hex (q=0, r=0) should always be zeus
    if (q === 0 && r === 0) {
      return "zeus";
    }
    
    // The six hexes surrounding the center should always be sea
    const surroundingHexes = [
      [1, 0], [1, -1], [0, -1],
      [-1, 0], [-1, 1], [0, 1]
    ];
    
    for (const [dq, dr] of surroundingHexes) {
      if (q === dq && r === dr) {
        return "sea";
      }
    }
    
    // For all other hexes, default to shallows
    return "shallow";
  }

  /**
   * Add special locations like oracles, ports, and sanctuaries
   * Note: Special locations are now represented by terrain types
   */
  private addSpecialLocations(cell: HexCell, q: number, r: number, distanceFromCenter: number): void {
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
   * None of these should overlap with each other or with the center 7 hexes
   */
  private placeSpecialTerrain(grid: HexCell[][]): void {
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
      ["clouds", 12]
    ];
    
    let cellIndex = 0;
    
    for (const [terrainType, count] of terrainPlacements) {
      let placed = 0;
      
      while (placed < count && cellIndex < availableCells.length) {
        const cell = availableCells[cellIndex];
        cellIndex++;
        
        // Only place if the cell is still shallows (not already taken by previous placement)
        if (cell.terrain === "shallow") {
          cell.terrain = terrainType;
          placed++;
        }
      }
      
      if (placed < count) {
        console.warn(`Could only place ${placed} of ${count} ${terrainType} cells`);
      }
    }
  }

  /**
   * Place the 6 city tiles near the corners of the hex map
   * For each corner, pick a random direction (+2 or +4) and a random distance (0 to 2)
   * Place the city there
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
        const adjacent = this.getAdjacent(placementQ, placementR, placementDirection);
        if (!adjacent) break;
        
        placementQ = adjacent.q;
        placementR = adjacent.r;
      }
      
      // Place the city if the cell exists
      const cell = this.getCellFromGrid(grid, placementQ, placementR);
      if (cell && cell.terrain === "shallow") {
        cell.terrain = "city";
      } else {
        // Fallback: place at the corner if the randomized placement failed
        const cornerCell = this.getCellFromGrid(grid, cornerCoords.q, cornerCoords.r);
        if (cornerCell && cornerCell.terrain === "shallow") {
          cornerCell.terrain = "city";
        }
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
  private getCellFromGrid(grid: HexCell[][], q: number, r: number): HexCell | null {
    // Convert axial coordinates to array indices
    const arrayQ = q + 6;  // Offset to make coordinates non-negative
    
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
  getAdjacent(q: number, r: number, direction: number): {q: number, r: number} | null {
    if (direction < 0 || direction > 5) {
      return null;
    }
    
    const directionVectors = [
      [1, -1],  // 0: Northeast
      [1, 0],   // 1: East
      [0, 1],   // 2: Southeast
      [-1, 1],  // 3: Southwest
      [-1, 0],  // 4: West
      [0, -1]   // 5: Northwest
    ];
    
    const [dq, dr] = directionVectors[direction];
    return {
      q: q + dq,
      r: r + dr
    };
  }

  /**
   * Get all neighboring cells for a given cell
   */
  getNeighbors(q: number, r: number): HexCell[] {
    const neighbors: HexCell[] = [];
    
    // Check all 6 directions using getAdjacent
    for (let direction = 0; direction < 6; direction++) {
      const adjacentCoords = this.getAdjacent(q, r, direction);
      if (adjacentCoords) {
        const neighbor = this.getCell(adjacentCoords.q, adjacentCoords.r);
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
  private getCorner(direction: number): {q: number, r: number} {
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
  console.log('New map generated');
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
      height: gameMap.height
    },
    terrainCounts,
    totalCells
  };
}



export function getMap() {
  return {
    map: gameMap.serialize(),
    dimensions: {
      width: gameMap.width,
      height: gameMap.height
    }
  };
}