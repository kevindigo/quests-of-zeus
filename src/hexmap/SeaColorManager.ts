// SeaColorManager - Handles sea hex coloring with constraint satisfaction

import type { HexCell, HexColor } from "../types.ts";
import { ALL_COLORS } from "../types.ts";
import type { HexGridOperations } from "./HexGridOperations.ts";
import type { UtilityService } from "./UtilityService.ts";

export class SeaColorManager {
  private hexGridOperations: HexGridOperations;
  private utilityService: UtilityService;

  constructor(
    hexGridOperations: HexGridOperations,
    utilityService: UtilityService,
  ) {
    this.hexGridOperations = hexGridOperations;
    this.utilityService = utilityService;
  }

  /**
   * Assign colors to all sea hexes using constraint-based placement
   * This ensures no adjacent sea hexes have the same color (like map coloring algorithm)
   * and favors the color that has been used least so far for better distribution
   */
  assignColorsToSeaHexes(grid: HexCell[][]): void {
    const seaCells: HexCell[] = [];

    // Collect all sea cells
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

    // If there are no sea cells, nothing to do
    if (seaCells.length === 0) {
      return;
    }

    // Shuffle sea cells to introduce randomness in processing order
    this.utilityService.shuffleArray(seaCells);

    // Track color usage counts
    const colorCounts: Record<HexColor, number> = {
      none: 0,
      red: 0,
      pink: 0,
      blue: 0,
      black: 0,
      green: 0,
      yellow: 0,
    };

    // Assign colors using constraint-based approach with least-used color preference
    for (const cell of seaCells) {
      // Get colors used by adjacent sea cells
      const adjacentColors = new Set<HexColor>();
      const neighbors = this.hexGridOperations.getNeighborsFromGrid(
        cell.q,
        cell.r,
        grid,
      );

      for (const neighbor of neighbors) {
        if (neighbor.terrain === "sea" && neighbor.color !== "none") {
          adjacentColors.add(neighbor.color);
        }
      }

      // Find available colors (all colors except those used by adjacent sea cells)
      const availableColors = ALL_COLORS.filter((color) =>
        !adjacentColors.has(color)
      );

      // If there are available colors, choose the one that has been used least so far
      if (availableColors.length > 0) {
        // Find the color with the minimum usage count among available colors
        let leastUsedColor = availableColors[0];
        let minCount = colorCounts[leastUsedColor]!;

        for (const color of availableColors) {
          if (colorCounts[color] < minCount) {
            leastUsedColor = color;
            minCount = colorCounts[color];
          }
        }

        // If multiple colors have the same minimum count, choose randomly among them
        const leastUsedColors = availableColors.filter(
          (color) => colorCounts[color] === minCount,
        );

        if (leastUsedColors.length > 1) {
          const randomIndex = Math.floor(
            Math.random() * leastUsedColors.length,
          );
          cell.color = leastUsedColors[randomIndex]!;
        } else {
          cell.color = leastUsedColor!;
        }

        // Update the color count
        colorCounts[cell.color]++;
      } else {
        // If no colors available (should be rare), choose the least conflicting color
        // This minimizes same-color adjacencies when elimination is impossible
        cell.color = this.getLeastConflictingColor(cell, grid);
        colorCounts[cell.color]++;
      }
    }

    // Count adjacent same-color sea hexes for debugging
    const _conflicts = this.countAdjacentSameColorSeaHexes(grid);
    // Note: conflicts are expected in some cases due to map constraints
  }

  /**
   * Get the color that would cause the fewest conflicts with adjacent sea hexes
   * Used as fallback when no conflict-free color is available
   */
  private getLeastConflictingColor(cell: HexCell, grid: HexCell[][]): HexColor {
    const neighbors = this.hexGridOperations.getNeighborsFromGrid(
      cell.q,
      cell.r,
      grid,
    );

    // Initialize conflict counts for all colors using a more TypeScript-friendly approach
    const colorConflicts = {} as Record<HexColor, number>;

    // Initialize all colors to 0 conflicts
    for (const color of ALL_COLORS) {
      colorConflicts[color] = 0;
    }
    colorConflicts.none = 0; // Also initialize 'none'

    // Count potential conflicts for each color
    for (const neighbor of neighbors) {
      if (neighbor.terrain === "sea" && neighbor.color !== "none") {
        colorConflicts[neighbor.color]++;
      }
    }

    // Find the color with the fewest conflicts
    let bestColor: HexColor = ALL_COLORS[0]!;
    let minConflicts = colorConflicts[bestColor];

    for (const color of ALL_COLORS) {
      if (colorConflicts[color] < minConflicts) {
        bestColor = color;
        minConflicts = colorConflicts[color];
      }
    }

    return bestColor;
  }

  /**
   * Count the number of adjacent sea hexes that have the same color
   * Used for debugging and validation
   */
  private countAdjacentSameColorSeaHexes(grid: HexCell[][]): number {
    let conflicts = 0;
    const processedPairs = new Set<string>();

    for (let arrayQ = 0; arrayQ < grid.length; arrayQ++) {
      const row = grid[arrayQ];
      if (row) {
        for (let arrayR = 0; arrayR < row.length; arrayR++) {
          const cell = row[arrayR];
          if (cell && cell.terrain === "sea" && cell.color !== "none") {
            const neighbors = this.hexGridOperations.getNeighborsFromGrid(
              cell.q,
              cell.r,
              grid,
            );

            for (const neighbor of neighbors) {
              if (neighbor.terrain === "sea" && neighbor.color !== "none") {
                // Create a unique key for this pair to avoid double counting
                const pairKey = this.getPairKey(cell, neighbor);

                if (
                  !processedPairs.has(pairKey) && cell.color === neighbor.color
                ) {
                  conflicts++;
                  processedPairs.add(pairKey);
                }
              }
            }
          }
        }
      }
    }

    return conflicts;
  }

  /**
   * Generate a unique key for a pair of cells to avoid double counting conflicts
   */
  private getPairKey(cell1: HexCell, cell2: HexCell): string {
    const [minQ, maxQ] = [
      Math.min(cell1.q, cell2.q),
      Math.max(cell1.q, cell2.q),
    ];
    const [minR, maxR] = [
      Math.min(cell1.r, cell2.r),
      Math.max(cell1.r, cell2.r),
    ];
    return `${minQ},${minR}-${maxQ},${maxR}`;
  }
}
