// Hexagonal map representation for Oracle of Delphi
// The game uses a 21x21 hex grid with various terrain types

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
  readonly width: number = 21;
  readonly height: number = 21;

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
   * Generate a 21x21 hex grid with appropriate terrain distribution
   * for the Oracle of Delphi game
   */
  private generateGrid(): HexCell[][] {
    const grid: HexCell[][] = [];
    
    for (let q = 0; q < this.width; q++) {
      const row: HexCell[] = [];
      for (let r = 0; r < this.height; r++) {
        // Calculate distance from center to create a roughly circular map
        const centerQ = Math.floor(this.width / 2);
        const centerR = Math.floor(this.height / 2);
        const distanceFromCenter = this.hexDistance(q, r, centerQ, centerR);
        
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
    // Simply assign a random terrain to each hex
    const terrainTypes: TerrainType[] = [
      "zeus", "sea", "shallow", "monsters", "cubes", 
      "temple", "clouds", "city", "foundations"
    ];
    
    // Use seeded random for consistent terrain generation
    const seed = (q * 31 + r * 37) % terrainTypes.length;
    
    return terrainTypes[seed];
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
   * Get a cell at specific coordinates
   */
  getCell(q: number, r: number): HexCell | null {
    if (q >= 0 && q < this.width && r >= 0 && r < this.height) {
      return this.grid[q][r];
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
    for (let q = 0; q < this.width; q++) {
      for (let r = 0; r < this.height; r++) {
        if (this.grid[q][r].terrain === terrain) {
          cells.push(this.grid[q][r]);
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
  
  for (let q = 0; q < gameMap.width; q++) {
    for (let r = 0; r < gameMap.height; r++) {
      const cell = grid[q][r];
      terrainCounts[cell.terrain] = (terrainCounts[cell.terrain] || 0) + 1;
    }
  }
  
  return {
    dimensions: {
      width: gameMap.width,
      height: gameMap.height
    },
    terrainCounts,
    totalCells: gameMap.width * gameMap.height
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