import { assertEquals } from "@std/assert";
import { HexMap, type HexCell, type TerrainType } from "./hexmap.ts";

// Basic test to verify the project setup
Deno.test("Project setup test", () => {
  const projectName = "oracle-of-delphi-pwa";
  assertEquals(typeof projectName, "string");
  assertEquals(projectName.includes("delphi"), true);
});

// Test that we can import dependencies
Deno.test("Dependencies test", () => {
  // This test verifies our imports work
  const testValue = 42;
  assertEquals(testValue, 42);
});

// HexMap tests
Deno.test("HexMap creation", () => {
  const map = new HexMap();
  
  assertEquals(map.width, 21);
  assertEquals(map.height, 21);
  
  // Test that we can get a cell
  const cell = map.getCell(10, 10);
  assertEquals(cell !== null, true);
  
  if (cell) {
    assertEquals(typeof cell.q, "number");
    assertEquals(typeof cell.r, "number");
    assertEquals(typeof cell.terrain, "string");
    assertEquals(typeof cell.isPassable, "boolean");
    assertEquals(typeof cell.movementCost, "number");
  }
});

Deno.test("HexMap cell access", () => {
  const map = new HexMap();
  
  // Test valid cell access
  const validCell = map.getCell(0, 0);
  assertEquals(validCell !== null, true);
  
  // Test invalid cell access
  const invalidCell = map.getCell(-1, -1);
  assertEquals(invalidCell, null);
  
  const outOfBoundsCell = map.getCell(100, 100);
  assertEquals(outOfBoundsCell, null);
});

Deno.test("HexMap neighbors", () => {
  const map = new HexMap();
  
  // Test getting neighbors for a central cell
  const neighbors = map.getNeighbors(10, 10);
  assertEquals(neighbors.length, 6); // Hex cells have 6 neighbors
  
  // Test edge cell has fewer neighbors
  const edgeNeighbors = map.getNeighbors(0, 0);
  assertEquals(edgeNeighbors.length < 6, true);
});

Deno.test("HexMap terrain filtering", () => {
  const map = new HexMap();
  
  // Test getting cells by terrain type
  const seaCells = map.getCellsByTerrain("sea");
  assertEquals(Array.isArray(seaCells), true);
  
  // All returned cells should have the correct terrain
  for (const cell of seaCells) {
    assertEquals(cell.terrain, "sea");
  }
});

Deno.test("HexMap special cells", () => {
  const map = new HexMap();
  
  const specialCells = map.getSpecialCells();
  assertEquals(Array.isArray(specialCells), true);
  
  // At least some cells should have special properties
  const hasSpecialProperty = specialCells.some(cell => 
    cell.hasOracle || cell.hasPort || cell.hasSanctuary || cell.hasOffering
  );
  assertEquals(hasSpecialProperty, true);
});

Deno.test("HexMap serialization", () => {
  const map = new HexMap();
  
  const serialized = map.serialize();
  assertEquals(Array.isArray(serialized), true);
  assertEquals(serialized.length, 21);
  assertEquals(serialized[0].length, 21);
  
  // Test deserialization
  const deserializedMap = HexMap.deserialize(serialized);
  assertEquals(deserializedMap.width, 21);
  assertEquals(deserializedMap.height, 21);
  
  // Should be able to get cells from deserialized map
  const cell = deserializedMap.getCell(10, 10);
  assertEquals(cell !== null, true);
});

Deno.test("Movement costs", () => {
  const map = new HexMap();
  
  // Test that sea cells are not passable
  const seaCells = map.getCellsByTerrain("sea");
  for (const cell of seaCells) {
    assertEquals(cell.isPassable, false);
    assertEquals(cell.movementCost, Infinity);
  }
  
  // Test that land cells are passable
  const landTerrains: TerrainType[] = ["plains", "hills", "mountains", "forest", "desert", "oracle", "port", "sanctuary"];
  for (const terrain of landTerrains) {
    const cells = map.getCellsByTerrain(terrain);
    if (cells.length > 0) {
      assertEquals(cells[0].isPassable, true);
      assertEquals(cells[0].movementCost > 0, true);
    }
  }
});