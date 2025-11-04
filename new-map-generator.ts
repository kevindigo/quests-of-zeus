// New map generator using the hybrid drunken walk algorithm
// This prevents lakes and ensures all land tiles are adjacent to sea/shallows

import { HexCell, TerrainType, HexColor } from './hexmap.ts';

export class NewMapGenerator {
  private grid: HexCell[][];
  readonly width: number = 13;
  readonly height: number = 13;
  private readonly radius = 6;

  constructor() {
    this.grid = this.generateGrid();
  }

  getGrid(): HexCell[][] {
    return this.grid;
  }

  private generateGrid(): HexCell[][] {
    const grid = this.initializeGridWithLand();
    this.generateSeaWithDrunkenWalk(grid);
    this.fixLandlockedTiles(grid);
    this.placeLandTiles(grid);
    this.placeSpecialTerrain(grid);
    return grid;
  }

  private initializeGridWithLand(): HexCell[][] {
    const grid: HexCell[][] = [];
    for (let q = -this.radius; q <= this.radius; q++) {
      const row: HexCell[] = [];
      const r1 = Math.max(-this.radius, -q - this.radius);
      const r2 = Math.min(this.radius, -q + this.radius);
      for (let r = r1; r <= r2; r++) {
        row.push({ q, r, terrain: "foundations", color: "none" });
      }
      grid.push(row);
    }
    return grid;
  }

  private generateSeaWithDrunkenWalk(grid: HexCell[][]): void {
    const zeusCell = this.getCellFromGrid(grid, 0, 0);
    if (zeusCell) zeusCell.terrain = "zeus";

    const totalCells = this.countCells(grid);
    const targetNonSeaTiles = Math.floor(totalCells * 0.6);
    const stopShortTarget = Math.floor(targetNonSeaTiles * 0.85);

    const startPositions = [
      [1, 0], [1, -1], [0, -1],
      [-1, 0], [-1, 1], [0, 1]
    ];

    const walkers: {q: number, r: number}[] = [];
    for (const [q, r] of startPositions) {
      const cell = this.getCellFromGrid(grid, q, r);
      if (cell && cell.terrain === "foundations") {
        cell.terrain = "sea";
        walkers.push({q, r});
      }
    }

    let nonSeaCount = this.countNonSeaTiles(grid);
    while (nonSeaCount > stopShortTarget && walkers.length > 0) {
      const walkerIndex = Math.floor(Math.random() * walkers.length);
      const walker = walkers[walkerIndex];
      
      const possibleDirections = [0, 1, 2, 3, 4, 5];
      this.shuffleArray(possibleDirections);
      
      let moved = false;
      for (const direction of possibleDirections) {
        const adjacent = this.getAdjacent(walker.q, walker.r, direction);
        if (!adjacent) continue;
        
        const cell = this.getCellFromGrid(grid, adjacent.q, adjacent.r);
        if (cell && cell.terrain === "foundations") {
          cell.terrain = "sea";
          walker.q = adjacent.q;
          walker.r = adjacent.r;
          moved = true;
          break;
        }
      }
      
      if (!moved) walkers.splice(walkerIndex, 1);
      nonSeaCount = this.countNonSeaTiles(grid);
    }
  }

  private fixLandlockedTiles(grid: HexCell[][]): void {
    const cellsToCheck: HexCell[] = [];
    for (let arrayQ = 0; arrayQ < grid.length; arrayQ++) {
      const row = grid[arrayQ];
      if (row) {
        for (let arrayR = 0; arrayR < row.length; arrayR++) {
          const cell = row[arrayR];
          if (cell && cell.terrain !== "sea" && cell.terrain !== "zeus") {
            cellsToCheck.push(cell);
          }
        }
      }
    }
    
    for (const cell of cellsToCheck) {
      if (!this.isAdjacentToSeaOrShallows(cell, grid)) {
        cell.terrain = "shallow";
      }
    }
  }

  private placeLandTiles(grid: HexCell[][]): void {
    const availableCells: HexCell[] = [];
    for (let arrayQ = 0; arrayQ < grid.length; arrayQ++) {
      const row = grid[arrayQ];
      if (row) {
        for (let arrayR = 0; arrayR < row.length; arrayR++) {
          const cell = row[arrayR];
          if (cell && cell.terrain === "foundations") {
            availableCells.push(cell);
          }
        }
      }
    }
    
    this.shuffleArray(availableCells);
    const landCount = Math.floor(availableCells.length * 0.5);
    for (let i = 0; i < availableCells.length; i++) {
      if (i < landCount) {
        availableCells[i].terrain = "shallow";
      }
    }
  }

  private placeSpecialTerrain(grid: HexCell[][]): void {
    // Only convert foundations to shallow if they're adjacent to sea/shallows
    // This prevents creating too many extra shallow tiles
    const foundationsToConvert: HexCell[] = [];
    for (let arrayQ = 0; arrayQ < grid.length; arrayQ++) {
      const row = grid[arrayQ];
      if (row) {
        for (let arrayR = 0; arrayR < row.length; arrayR++) {
          const cell = row[arrayR];
          if (cell && cell.terrain === "foundations" && this.isAdjacentToSeaOrShallows(cell, grid)) {
            foundationsToConvert.push(cell);
          }
        }
      }
    }
    
    // Convert only a portion of the eligible foundations to shallow
    this.shuffleArray(foundationsToConvert);
    const convertCount = Math.min(foundationsToConvert.length, 10); // Target about 10 extra shallows
    for (let i = 0; i < convertCount; i++) {
      foundationsToConvert[i].terrain = "shallow";
    }

    this.placeCities(grid);
    
    const availableCells: HexCell[] = [];
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
    
    this.shuffleArray(availableCells);
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
        if (this.isValidTerrainPlacement(cell, grid) && cell.terrain === "shallow") {
          cell.terrain = terrainType;
          placed++;
        }
      }
    }
  }

  private placeCities(grid: HexCell[][]): void {
    for (let cornerDirection = 0; cornerDirection < 6; cornerDirection++) {
      const cornerCoords = this.getCorner(cornerDirection);
      const directionOffset = Math.random() < 0.5 ? 2 : 4;
      const placementDirection = (cornerDirection + directionOffset) % 6;
      const distance = Math.floor(Math.random() * 3);
      
      let placementQ = cornerCoords.q;
      let placementR = cornerCoords.r;
      for (let i = 0; i < distance; i++) {
        const adjacent = this.getAdjacent(placementQ, placementR, placementDirection);
        if (!adjacent) break;
        placementQ = adjacent.q;
        placementR = adjacent.r;
      }
      
      const cell = this.getCellFromGrid(grid, placementQ, placementR);
      if (cell && cell.terrain === "shallow") {
        cell.terrain = "city";
      } else {
        const cornerCell = this.getCellFromGrid(grid, cornerCoords.q, cornerCoords.r);
        if (cornerCell && cornerCell.terrain === "shallow") {
          cornerCell.terrain = "city";
        }
      }
    }
  }

  private isAdjacentToSeaOrShallows(cell: HexCell, grid: HexCell[][]): boolean {
    for (let direction = 0; direction < 6; direction++) {
      const adjacentCoords = this.getAdjacent(cell.q, cell.r, direction);
      if (!adjacentCoords) continue;
      const adjacentCell = this.getCellFromGrid(grid, adjacentCoords.q, adjacentCoords.r);
      if (!adjacentCell) continue;
      if (adjacentCell.terrain === "sea" || adjacentCell.terrain === "shallow" || adjacentCell.terrain === "zeus") {
        return true;
      }
    }
    return false;
  }

  private isValidTerrainPlacement(cell: HexCell, grid: HexCell[][]): boolean {
    if (cell.terrain !== "shallow") return false;
    
    for (let direction = 0; direction < 6; direction++) {
      const adjacentCoords = this.getAdjacent(cell.q, cell.r, direction);
      if (!adjacentCoords) continue;
      const adjacentCell = this.getCellFromGrid(grid, adjacentCoords.q, adjacentCoords.r);
      if (!adjacentCell) continue;
      if (!this.hasShallowsOrSeaNeighbor(adjacentCell, cell, grid)) {
        return false;
      }
    }
    return true;
  }

  private hasShallowsOrSeaNeighbor(cell: HexCell, candidateCell: HexCell, grid: HexCell[][]): boolean {
    for (let direction = 0; direction < 6; direction++) {
      const adjacentCoords = this.getAdjacent(cell.q, cell.r, direction);
      if (!adjacentCoords) continue;
      const adjacentCell = this.getCellFromGrid(grid, adjacentCoords.q, adjacentCoords.r);
      if (!adjacentCell) continue;
      if (adjacentCell.q === candidateCell.q && adjacentCell.r === candidateCell.r) continue;
      if (adjacentCell.terrain === "shallow" || adjacentCell.terrain === "sea" || adjacentCell.terrain === "zeus") {
        return true;
      }
    }
    return false;
  }

  private countCells(grid: HexCell[][]): number {
    let count = 0;
    for (let arrayQ = 0; arrayQ < grid.length; arrayQ++) {
      const row = grid[arrayQ];
      if (row) count += row.length;
    }
    return count;
  }

  private countNonSeaTiles(grid: HexCell[][]): number {
    let count = 0;
    for (let arrayQ = 0; arrayQ < grid.length; arrayQ++) {
      const row = grid[arrayQ];
      if (row) {
        for (let arrayR = 0; arrayR < row.length; arrayR++) {
          const cell = row[arrayR];
          if (cell && cell.terrain !== "sea" && cell.terrain !== "zeus") {
            count++;
          }
        }
      }
    }
    return count;
  }

  private getCellFromGrid(grid: HexCell[][], q: number, r: number): HexCell | null {
    const arrayQ = q + 6;
    if (arrayQ < 0 || arrayQ >= grid.length) return null;
    const row = grid[arrayQ];
    if (!row) return null;
    for (const cell of row) {
      if (cell.r === r) return cell;
    }
    return null;
  }

  private getAdjacent(q: number, r: number, direction: number): {q: number, r: number} | null {
    if (direction < 0 || direction > 5) return null;
    const directionVectors = [
      [1, -1], [1, 0], [0, 1],
      [-1, 1], [-1, 0], [0, -1]
    ];
    const [dq, dr] = directionVectors[direction];
    return { q: q + dq, r: r + dr };
  }

  private getCorner(direction: number): {q: number, r: number} {
    let currentQ = 0;
    let currentR = 0;
    for (let distance = 1; distance <= 6; distance++) {
      const adjacent = this.getAdjacent(currentQ, currentR, direction);
      if (!adjacent) break;
      currentQ = adjacent.q;
      currentR = adjacent.r;
    }
    return { q: currentQ, r: currentR };
  }

  private shuffleArray<T>(array: T[]): void {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
  }

  serialize(): HexCell[][] {
    return JSON.parse(JSON.stringify(this.grid));
  }

  static deserialize(data: HexCell[][]): NewMapGenerator {
    const generator = new NewMapGenerator();
    generator.grid = data;
    return generator;
  }
}