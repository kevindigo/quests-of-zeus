// CityManager - City-specific operations and state management

import type { HexCell } from "../types.ts";

export class CityManager {
  /**
   * Add a statue to a city
   * Returns true if successful, false if city is full or not a city
   */
  addStatueToCity(cell: HexCell | null): boolean {
    if (
      cell && cell.terrain === "city" && cell.statues !== undefined &&
      cell.statues < 3
    ) {
      cell.statues++;
      return true;
    }
    return false;
  }

  /**
   * Remove a statue from a city
   * Returns true if successful, false if no statues or not a city
   */
  removeStatueFromCity(cell: HexCell | null): boolean {
    if (
      cell && cell.terrain === "city" && cell.statues !== undefined &&
      cell.statues > 0
    ) {
      cell.statues--;
      return true;
    }
    return false;
  }

  /**
   * Get the number of statues on a city
   * Returns the count, or -1 if not a city
   */
  getStatuesOnCity(cell: HexCell | null): number {
    if (cell && cell.terrain === "city" && cell.statues !== undefined) {
      return cell.statues;
    }
    return -1;
  }

  /**
   * Check if a city has all 3 statues placed
   */
  isCityComplete(cell: HexCell | null): boolean {
    return !!(cell && cell.terrain === "city" && cell.statues === 3);
  }

  /**
   * Get all cities that are complete (have all 3 statues)
   */
  getCompleteCities(cities: HexCell[]): HexCell[] {
    return cities.filter((city) => city.statues === 3);
  }
}