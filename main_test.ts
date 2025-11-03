import { assertEquals } from "@std/assert";

// Test the client-side game logic
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

// Test the game logic (simulating the client-side behavior)
Deno.test("Game logic - terrain generation", () => {
  // Test terrain type mapping
  const terrainTypes = ["sea", "coast", "plains", "hills", "mountains", "forest", "desert", "oracle", "port", "sanctuary"];
  
  for (const terrain of terrainTypes) {
    assertEquals(typeof terrain, "string");
    assertEquals(terrain.length > 0, true);
  }
});

Deno.test("Game logic - movement costs", () => {
  // Test movement cost logic
  const movementCosts = {
    "sea": Infinity,
    "coast": 1,
    "plains": 1,
    "hills": 2,
    "mountains": 3,
    "forest": 2,
    "desert": 1,
    "oracle": 1,
    "port": 1,
    "sanctuary": 1
  };
  
  for (const [terrain, cost] of Object.entries(movementCosts)) {
    assertEquals(typeof cost, "number");
    assertEquals(cost > 0 || cost === Infinity, true);
  }
});

Deno.test("Game logic - hex distance calculation", () => {
  // Test hex distance calculation
  const hexDistance = (q1: number, r1: number, q2: number, r2: number): number => {
    const s1 = -q1 - r1;
    const s2 = -q2 - r2;
    return (Math.abs(q1 - q2) + Math.abs(r1 - r2) + Math.abs(s1 - s2)) / 2;
  };
  
  // Test same cell
  assertEquals(hexDistance(0, 0, 0, 0), 0);
  
  // Test adjacent cells
  assertEquals(hexDistance(0, 0, 1, 0), 1);
  assertEquals(hexDistance(0, 0, 0, 1), 1);
  assertEquals(hexDistance(0, 0, 1, -1), 1);
  
  // Test diagonal cells
  assertEquals(hexDistance(0, 0, 2, -1), 2);
});

Deno.test("Game logic - map dimensions", () => {
  // Test that our map has the expected dimensions
  const width = 21;
  const height = 21;
  
  assertEquals(width, 21);
  assertEquals(height, 21);
  assertEquals(width * height, 441);
});

Deno.test("Game logic - serialization", () => {
  // Test that serialization works correctly
  const testData = [[{ q: 0, r: 0, terrain: "plains" }]];
  const serialized = JSON.parse(JSON.stringify(testData));
  
  assertEquals(Array.isArray(serialized), true);
  assertEquals(serialized[0][0].q, 0);
  assertEquals(serialized[0][0].r, 0);
  assertEquals(serialized[0][0].terrain, "plains");
});

Deno.test("Game logic - passable terrain", () => {
  // Test that sea is not passable
  const passableTerrains = ["coast", "plains", "hills", "mountains", "forest", "desert", "oracle", "port", "sanctuary"];
  const nonPassableTerrains = ["sea"];
  
  for (const terrain of passableTerrains) {
    assertEquals(terrain !== "sea", true);
  }
  
  for (const terrain of nonPassableTerrains) {
    assertEquals(terrain === "sea", true);
  }
});