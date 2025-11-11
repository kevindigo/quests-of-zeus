#!/usr/bin/env -S deno run --allow-read

import { HexMap } from "../src/hexmap.ts";

// Manual test to verify sea-to-shallows conversion
function manualTest() {
  // Create multiple maps to see if we ever get a shallow
  let mapsWithShallows = 0;
  const totalMaps = 10;

  for (let i = 0; i < totalMaps; i++) {
    const hexMap = new HexMap();
    const grid = hexMap.getGrid();

    // Count terrain distribution
    const terrainCounts: Record<string, number> = {};
    for (let arrayQ = 0; arrayQ < grid.length; arrayQ++) {
      const row = grid[arrayQ];
      if (row) {
        for (let arrayR = 0; arrayR < row.length; arrayR++) {
          const cell = row[arrayR];
          if (cell) {
            terrainCounts[cell.terrain] = (terrainCounts[cell.terrain] || 0) +
              1;
          }
        }
      }
    }

    const shallowCount = terrainCounts["shallow"] || 0;
    const seaCount = terrainCounts["sea"] || 0;

    if (shallowCount > 0) {
      mapsWithShallows++;

      // Find and analyze the shallow cell
      for (let arrayQ = 0; arrayQ < grid.length; arrayQ++) {
        const row = grid[arrayQ];
        if (row) {
          for (let arrayR = 0; arrayR < row.length; arrayR++) {
            const cell = row[arrayR];
            if (cell && cell.terrain === "shallow") {
              // Verify constraints
              const hasZeusNeighbor = hexMap["hasNeighborOfType"](
                cell,
                grid,
                "zeus",
              );

              const hasCityNeighbor = hexMap["hasNeighborOfType"](
                cell,
                grid,
                "city",
              );

              // Check all neighbors with combined logic
              const allNeighbors = hexMap["getNeighbors"](cell.q, cell.r);
              let allConstraintsSatisfied = true;

              for (const neighbor of allNeighbors) {
                if (neighbor.terrain === "sea") {
                  // For sea neighbors: check if they can trace a path back to zeus
                  const canReach = hexMap["canReachZeusFromSeaNeighbor"](
                    neighbor,
                    cell,
                    grid,
                  );
                  if (!canReach) {
                    allConstraintsSatisfied = false;
                  }
                } else if (neighbor.terrain !== "shallow") {
                  // For land neighbors (not sea or shallows): check if they have at least one sea neighbor
                  const hasSeaNeighbor = hexMap["hasNeighborOfType"](
                    neighbor,
                    grid,
                    "sea",
                  );
                  if (!hasSeaNeighbor) {
                    allConstraintsSatisfied = false;
                  }
                }
                // For shallow neighbors, no additional checks needed
              }
              break;
            }
          }
        }
      }
    }
  }

  if (mapsWithShallows === 0) {
    const hexMap = new HexMap();
    const grid = hexMap.getGrid();

    let testedCells = 0;
    for (let arrayQ = 0; arrayQ < grid.length && testedCells < 5; arrayQ++) {
      const row = grid[arrayQ];
      if (row) {
        for (let arrayR = 0; arrayR < row.length && testedCells < 5; arrayR++) {
          const cell = row[arrayR];
          if (cell && cell.terrain === "sea") {
            testedCells++;

            // Test constraint 1: zeus neighbor
            const hasZeusNeighbor = hexMap["hasNeighborOfType"](
              cell,
              grid,
              "zeus",
            );

            // Test constraint 2: city neighbor
            const hasCityNeighbor = hexMap["hasNeighborOfType"](
              cell,
              grid,
              "city",
            );

            // Test constraint 3: at least one sea neighbor can reach zeus
            const seaNeighbors = hexMap["getNeighborsOfType"](
              cell,
              grid,
              "sea",
            );

            let atLeastOneCanReachZeus = false;
            for (const seaNeighbor of seaNeighbors) {
              const canReach = hexMap["canReachZeusFromSeaNeighbor"](
                seaNeighbor,
                cell,
                grid,
              );
              if (canReach) {
                atLeastOneCanReachZeus = true;
              }
            }

            // Check all neighbors with combined logic (simulate conversion)
            const originalTerrain = cell.terrain;
            cell.terrain = "shallow"; // Temporarily convert to test

            const allNeighbors = hexMap["getNeighbors"](cell.q, cell.r);
            let allConstraintsSatisfied = true;

            for (const neighbor of allNeighbors) {
              if (neighbor.terrain === "sea") {
                // For sea neighbors: check if they can trace a path back to zeus
                const canReach = hexMap["canReachZeusFromSeaNeighbor"](
                  neighbor,
                  cell,
                  grid,
                );
                if (!canReach) {
                  allConstraintsSatisfied = false;
                }
              } else if (neighbor.terrain !== "shallow") {
                // For land neighbors (not sea or shallows): check if they have at least one sea neighbor
                const hasSeaNeighbor = hexMap["hasNeighborOfType"](
                  neighbor,
                  grid,
                  "sea",
                );
                if (!hasSeaNeighbor) {
                  allConstraintsSatisfied = false;
                }
              }
              // For shallow neighbors, no additional checks needed
            }

            cell.terrain = originalTerrain; // Restore original terrain

            const isEligible = !hasZeusNeighbor && !hasCityNeighbor &&
              allConstraintsSatisfied;
          }
        }
      }
    }
  }
}

// Run the manual test
if (import.meta.main) {
  manualTest();
}
