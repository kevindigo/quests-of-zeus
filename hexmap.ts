// Hexagonal map representation for Oracle of Delphi
// The game uses a 21x21 hex grid with various terrain types

export type TerrainType = 
  | "sea"           // Water tiles
  | "coast"         // Coastal areas
  | "plains"        // Open plains
  | "hills"         // Hilly terrain
  | "mountains"     // Mountainous areas
  | "forest"        // Forested areas
  | "desert"        // Desert terrain
  | "oracle"        // Oracle temple locations
  | "port"          // Port cities
  | "sanctuary";    // Sanctuary locations

// Game state
let gameMap: HexMap = new HexMap();

// UI Functions
export function generateNewMap(): HexMap {
  gameMap = new HexMap();
  console.log('New map generated');
  return gameMap;
}

export function getMapStatistics() {
  const terrainCounts: Record<string, number> = {};
  let oracleCount = 0;
  let portCount = 0;
  let sanctuaryCount = 0;
  let offeringCount = 0;
  
  for (let q = 0; q < gameMap.width; q++) {
    for (let r = 0; r < gameMap.height; r++) {
      const cell = gameMap.grid[q][r];
      terrainCounts[cell.terrain] = (terrainCounts[cell.terrain] || 0) + 1;
      if (cell.hasOracle) oracleCount++;
      if (cell.hasPort) portCount++;
      if (cell.hasSanctuary) sanctuaryCount++;
      if (cell.hasOffering) offeringCount++;
    }
  }
  
  return {
    dimensions: {
      width: gameMap.width,
      height: gameMap.height
    },
    terrainCounts,
    specialLocations: {
      oracles: oracleCount,
      ports: portCount,
      sanctuaries: sanctuaryCount,
      offerings: offeringCount
    },
    totalCells: gameMap.width * gameMap.height
  };
}

export function getSpecialCells(): HexCell[] {
  return gameMap.getSpecialCells();
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

export interface HexCell {
  // Coordinates using axial coordinate system for hex grids
  q: number;        // Column coordinate
  r: number;        // Row coordinate
  
  // Cell characteristics
  terrain: TerrainType;
  
  // Game-specific properties
  isPassable: boolean;           // Whether units can move through this cell
  movementCost: number;          // Movement cost for traversing this terrain
  
  // Oracle of Delphi specific properties
  hasOracle?: boolean;           // Contains an oracle temple
  hasPort?: boolean;             // Contains a port
  hasSanctuary?: boolean;        // Contains a sanctuary
  hasOffering?: boolean;         // Contains an offering site
  
  // Resource properties
  resources?: {
    gold?: number;               // Gold resource
    offerings?: number;          // Offering resources
    divineFavor?: number;        // Divine favor points
  };
  
  // Visual properties
  elevation: number;             // Height/elevation (0-100)
  
  // State properties
  visited: boolean;              // Whether this cell has been visited
  visible: boolean;              // Whether this cell is currently visible
}

export class HexMap {
  private grid: HexCell[][];
  readonly width: number = 21;
  readonly height: number = 21;

  constructor() {
    this.grid = this.generateGrid();
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
          isPassable: terrain !== "sea", // Sea is not passable
          movementCost: this.getMovementCost(terrain),
          elevation: this.generateElevation(terrain, distanceFromCenter),
          visited: false,
          visible: false
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
    // Create a roughly circular map with sea around the edges
    const maxDistance = Math.min(this.width, this.height) / 2;
    
    if (distanceFromCenter > maxDistance * 0.8) {
      return "sea";
    } else if (distanceFromCenter > maxDistance * 0.7) {
      return "coast";
    }
    
    // Use seeded random for consistent terrain generation
    const seed = (q * 31 + r * 37) % 100;
    
    if (distanceFromCenter < maxDistance * 0.3) {
      // Center area - more likely to have important locations
      if (seed < 5) return "oracle";
      if (seed < 15) return "sanctuary";
      if (seed < 30) return "hills";
      if (seed < 50) return "plains";
      return "forest";
    } else {
      // Outer areas - more varied terrain
      if (seed < 10) return "mountains";
      if (seed < 25) return "hills";
      if (seed < 45) return "forest";
      if (seed < 60) return "plains";
      if (seed < 70) return "desert";
      return "plains";
    }
  }

  /**
   * Get movement cost for a given terrain type
   */
  private getMovementCost(terrain: TerrainType): number {
    const costs: Record<TerrainType, number> = {
      sea: Infinity,      // Not passable
      coast: 1,
      plains: 1,
      hills: 2,
      mountains: 3,
      forest: 2,
      desert: 1,
      oracle: 1,
      port: 1,
      sanctuary: 1
    };
    return costs[terrain];
  }

  /**
   * Generate elevation based on terrain and position
   */
  private generateElevation(terrain: TerrainType, distanceFromCenter: number): number {
    const baseElevation: Record<TerrainType, number> = {
      sea: 0,
      coast: 10,
      plains: 20,
      hills: 60,
      mountains: 90,
      forest: 30,
      desert: 25,
      oracle: 50,
      port: 15,
      sanctuary: 40
    };
    
    // Add some variation
    const variation = Math.random() * 20 - 10;
    return Math.max(0, Math.min(100, baseElevation[terrain] + variation));
  }

  /**
   * Add special locations like oracles, ports, and sanctuaries
   */
  private addSpecialLocations(cell: HexCell, q: number, r: number, distanceFromCenter: number): void {
    const maxDistance = Math.min(this.width, this.height) / 2;
    
    // Oracle temples are typically in central, elevated areas
    if (cell.terrain === "oracle" && distanceFromCenter < maxDistance * 0.4) {
      cell.hasOracle = true;
      cell.resources = {
        divineFavor: 3,
        offerings: 2
      };
    }
    
    // Ports are on coastlines
    if (cell.terrain === "coast" && Math.random() < 0.1) {
      cell.hasPort = true;
      cell.resources = {
        ...cell.resources,
        gold: 2
      };
    }
    
    // Sanctuaries in appropriate terrain
    if (cell.terrain === "sanctuary" && distanceFromCenter < maxDistance * 0.6) {
      cell.hasSanctuary = true;
      cell.resources = {
        ...cell.resources,
        divineFavor: 2,
        offerings: 1
      };
    }
    
    // Offering sites in various locations
    if (!cell.hasOracle && !cell.hasSanctuary && Math.random() < 0.05) {
      cell.hasOffering = true;
      cell.resources = {
        ...cell.resources,
        offerings: 1
      };
    }
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
   * Get all cells with special locations
   */
  getSpecialCells(): HexCell[] {
    const specialCells: HexCell[] = [];
    for (let q = 0; q < this.width; q++) {
      for (let r = 0; r < this.height; r++) {
        const cell = this.grid[q][r];
        if (cell.hasOracle || cell.hasPort || cell.hasSanctuary || cell.hasOffering) {
          specialCells.push(cell);
        }
      }
    }
    return specialCells;
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