// SeaColorManager - Handles sea hex coloring with constraint satisfaction

import type { HexColor } from '../types.ts';
import { COLOR_WHEEL } from '../types.ts';
import type { HexCell } from './HexCell.ts';
import type { HexGrid } from './HexGrid.ts';
import type { UtilityService } from '../UtilityService.ts';

export class SeaColorManager {
  private utilityService: UtilityService;

  constructor(
    utilityService: UtilityService,
  ) {
    this.utilityService = utilityService;
  }

  /**
   * Assign colors to all sea hexes using constraint-based placement
   * This ensures no adjacent sea hexes have the same color (like map coloring algorithm)
   * and favors the color that has been used least so far for better distribution
   */
  assignColorsToSeaHexes(grid: HexGrid): void {
    const seaCells = grid.getCellsOfType('sea');

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
      const neighbors = grid.getNeighborsOf(cell);

      for (const neighbor of neighbors) {
        if (neighbor.terrain === 'sea' && neighbor.color !== 'none') {
          adjacentColors.add(neighbor.color);
        }
      }

      // Find available colors (all colors except those used by adjacent sea cells)
      const availableColors = COLOR_WHEEL.filter((color) =>
        !adjacentColors.has(color)
      );

      // If there are available colors, choose the one that has been used least so far
      if (availableColors.length > 0) {
        // Find the color with the minimum usage count among available colors
        let leastUsedColor: HexColor = availableColors[0] || 'none';
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
    // const _conflicts = this.countAdjacentSameColorSeaHexes(grid); // Unused variable removed
    // Note: conflicts are expected in some cases due to map constraints
  }

  /**
   * Get the color that would cause the fewest conflicts with adjacent sea hexes
   * Used as fallback when no conflict-free color is available
   */
  private getLeastConflictingColor(cell: HexCell, grid: HexGrid): HexColor {
    const neighbors = grid.getNeighborsOf(cell);

    // Initialize conflict counts for all colors using a more TypeScript-friendly approach
    const colorConflicts = {} as Record<HexColor, number>;

    // Initialize all colors to 0 conflicts
    for (const color of COLOR_WHEEL) {
      colorConflicts[color] = 0;
    }
    colorConflicts.none = 0; // Also initialize 'none'

    // Count potential conflicts for each color
    for (const neighbor of neighbors) {
      if (neighbor.terrain === 'sea' && neighbor.color !== 'none') {
        colorConflicts[neighbor.color]++;
      }
    }

    // Find the color with the fewest conflicts
    let bestColor: HexColor = COLOR_WHEEL[0]!;
    let minConflicts = colorConflicts[bestColor];

    for (const color of COLOR_WHEEL) {
      if (colorConflicts[color] < minConflicts) {
        bestColor = color;
        minConflicts = colorConflicts[color];
      }
    }

    return bestColor;
  }
}
