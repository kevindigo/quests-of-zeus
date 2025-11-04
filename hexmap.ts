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
   * - 6 cubes
   * - 6 temples  
   * - 6 foundations
   * - 9 monsters
   * - 12 clouds
   * None of these should overlap with each other or with the center 7 hexes
   */
  private placeSpecialTerrain(grid: HexCell[][]): void {
    const availableCells: HexCell[] = [];
    
    // Collect all cells that are shallows (not the center 7 hexes)
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
    
    // Place terrain types with their required counts
    const terrainPlacements: [TerrainType, number][] = [
      ["cubes", 6],
      ["temple", 6], 
      ["foundations", 6],
      ["monsters", 9],
      ["clouds", 12],
      ["city", 6]  // Add city terrain type
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
   * Shuffle array using Fisher-Yates algorithm
   */
  private shuffleArray<T>(array: T[]): void {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
  }

  /**
   * Get a cell at specific coordinates
   */
  getCell(q: number, r: number): HexCell | null {
    // Convert axial coordinates to array indices
    const arrayQ = q + 6;  // Offset to make coordinates non-negative
    const arrayR = r + 6;  // Offset to make coordinates non-negative
    
    if (arrayQ >= 0 && arrayQ < this.width && arrayR >= 0 && arrayR < this.height) {
      return this.grid[arrayQ]?.[arrayR] || null;
    }
    return null;
  }

  /**
   * Get all neighboring cells for a given cell
   */
  getNeighbors(q: number, r: number): HexCell[] {
    const neighbors: HexCell[] = [];
    const directions = [
      [1, 0], [1, -1], [0, -1],
      [-1, 0], [-1, 1], [0, 1]
    ];
    
    for (const [dq, dr] of directions) {
      const neighbor = this.getCell(q + dq, r + dr);
      if (neighbor) {
        neighbors.push(neighbor);
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