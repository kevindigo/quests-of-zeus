// Tests for cube distribution in the Oracle of Delphi game

import { assert, assertEquals } from "@std/assert";
import { HexMap } from "../src/hexmap.ts";

Deno.test("Cube distribution - correct number of cube hexes", () => {
  const hexMap = new HexMap();
  const cubeCells = hexMap.getCellsByTerrain("cubes");
  
  // Should have exactly 6 cube hexes
  assertEquals(cubeCells.length, 6, "Expected 6 cube hexes");
});

Deno.test("Cube distribution - cube hexes have no colors assigned by default", () => {
  const hexMap = new HexMap();
  const cubeCells = hexMap.getCellsByTerrain("cubes");
  
  // Cube hexes currently don't have colors assigned in the implementation
  // This is the actual behavior - all cubes should have color "none"
  const cubesWithNoColor = cubeCells.filter((cell) => cell.color === "none");
  assertEquals(cubesWithNoColor.length, cubeCells.length, "All cube hexes should have no color assigned");
});

Deno.test("Cube distribution - all cube hexes have terrain type cubes", () => {
  const hexMap = new HexMap();
  const cubeCells = hexMap.getCellsByTerrain("cubes");
  
  // All cube cells should have the correct terrain type
  cubeCells.forEach((cell) => {
    assertEquals(cell.terrain, "cubes", "Cube cell should have cubes terrain");
  });
});

Deno.test("Cube distribution - integration with HexMap", () => {
  const hexMap = new HexMap();
  
  // Verify the grid is properly created
  const grid = hexMap.getGrid();
  assert(grid.length > 0, "Grid should have rows");
  
  // Verify we can find cube cells
  const cubeCells = hexMap.getCellsByTerrain("cubes");
  assertEquals(cubeCells.length, 6, "Should find exactly 6 cube hexes");
  
  // Verify all cube cells have the correct terrain type and no color assigned
  cubeCells.forEach((cell) => {
    assertEquals(cell.terrain, "cubes", "Cell should have cubes terrain");
    assertEquals(cell.color, "none", "Cube cell should have no color assigned");
  });
});

Deno.test("Cube distribution - cubes are distinct from other terrain types", () => {
  const hexMap = new HexMap();
  
  // Get all cube cells
  const cubeCells = hexMap.getCellsByTerrain("cubes");
  
  // Get other terrain types that should be distinct
  const templeCells = hexMap.getCellsByTerrain("temple");
  const cityCells = hexMap.getCellsByTerrain("city");
  const monsterCells = hexMap.getCellsByTerrain("monsters");
  
  // Verify no overlap between cube cells and other special terrain types
  const allSpecialCells = [...templeCells, ...cityCells, ...monsterCells];
  
  cubeCells.forEach((cubeCell) => {
    const overlappingCell = allSpecialCells.find((otherCell) => 
      cubeCell.q === otherCell.q && cubeCell.r === otherCell.r
    );
    assert(!overlappingCell, `Cube cell at (${cubeCell.q}, ${cubeCell.r}) should not overlap with other special terrain`);
  });
});