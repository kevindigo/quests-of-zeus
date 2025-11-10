#!/usr/bin/env -S deno run --allow-read

import { assertEquals } from "@std/assert";
import { HexMap } from "../src/hexmap.ts";

// Test that all neighbors of the Zeus hex are sea
Deno.test("Zeus neighbors should all be sea", () => {
  const hexMap = new HexMap();

  // Get the Zeus cell
  const zeusCells = hexMap.getCellsByTerrain("zeus");
  assertEquals(zeusCells.length, 1, "Should have exactly 1 Zeus cell");

  const zeusCell = zeusCells[0];

  // Get all neighbors of the Zeus cell
  const zeusNeighbors = hexMap.getNeighbors(zeusCell!.q, zeusCell!.r);

  // All neighbors should be sea
  for (const neighbor of zeusNeighbors) {
    assertEquals(
      neighbor.terrain === "sea",
      true,
      `Neighbor of Zeus at (${neighbor.q}, ${neighbor.r}) should be sea, but was ${neighbor.terrain}`,
    );
  }
});

// Test multiple generations to ensure consistency
Deno.test("Zeus neighbors sea - multiple generations", () => {
  for (let i = 0; i < 10; i++) {
    const hexMap = new HexMap();
    const zeusCells = hexMap.getCellsByTerrain("zeus");

    assertEquals(zeusCells.length, 1, "Should have exactly 1 Zeus cell");

    const zeusCell = zeusCells[0];
    const zeusNeighbors = hexMap.getNeighbors(zeusCell!.q, zeusCell!.r);

    // Verify all neighbors are sea
    for (const neighbor of zeusNeighbors) {
      assertEquals(
        neighbor.terrain === "sea",
        true,
        `Neighbor of Zeus at (${neighbor.q}, ${neighbor.r}) should be sea, but was ${neighbor.terrain}`,
      );
    }
  }
});
