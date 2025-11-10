// Test for city statue functionality

import { assert, assertEquals } from "@std/assert";
import { HexMap } from "../src/hexmap.ts";

Deno.test("City Statue Functionality - Basic Operations", () => {
  const map = new HexMap();
  const cities = map.getCellsByTerrain("city");

  assert(cities.length > 0, "Should find at least one city on the map");

  // Test statue operations on each city
  cities.forEach((city, _index) => {
    const initialStatues = map.getStatuesOnCity(city.q, city.r);

    // Test initial statue count
    assertEquals(initialStatues, 3, "Cities should start with 3 statues");

    // Test removing statues
    for (let i = 2; i >= 0; i--) {
      const success = map.removeStatueFromCity(city.q, city.r);
      const currentStatues = map.getStatuesOnCity(city.q, city.r);

      assert(success, `Should successfully remove statue ${i + 1}`);
      assertEquals(
        currentStatues,
        i,
        `Statue count should be ${i} after removal`,
      );
    }

    // Test removing beyond zero should fail
    const underflowSuccess = map.removeStatueFromCity(city.q, city.r);
    const zeroStatues = map.getStatuesOnCity(city.q, city.r);

    assert(!underflowSuccess, "Should not allow removing statue below zero");
    assertEquals(zeroStatues, 0, "Statue count should remain at 0");

    // Test adding statues back
    for (let i = 1; i <= 3; i++) {
      const success = map.addStatueToCity(city.q, city.r);
      const currentStatues = map.getStatuesOnCity(city.q, city.r);

      assert(success, `Should successfully add statue ${i}`);
      assertEquals(
        currentStatues,
        i,
        `Statue count should be ${i} after addition`,
      );
    }

    // Test adding beyond limit should fail
    const overflowSuccess = map.addStatueToCity(city.q, city.r);
    const maxStatues = map.getStatuesOnCity(city.q, city.r);

    assert(!overflowSuccess, "Should not allow adding statue beyond limit");
    assertEquals(maxStatues, 3, "Statue count should remain at 3");

    // Test city completion
    const isComplete = map.isCityComplete(city.q, city.r);
    assert(isComplete, "City should be complete with 3 statues");
  });
});

Deno.test("City Statue Functionality - Complete Cities", () => {
  const map = new HexMap();

  // Test complete cities detection
  const completeCities = map.getCompleteCities();

  // All cities should be complete initially
  const allCities = map.getCellsByTerrain("city");
  assertEquals(
    completeCities.length,
    allCities.length,
    "All cities should be complete initially",
  );

  // Remove statues from one city and verify it's no longer complete
  if (allCities.length > 0) {
    const testCity = allCities[0];

    // Remove one statue
    const removeSuccess = map.removeStatueFromCity(testCity!.q, testCity!.r);
    assert(removeSuccess, "Should successfully remove statue");

    const statuesAfterRemoval = map.getStatuesOnCity(testCity!.q, testCity!.r);
    assertEquals(statuesAfterRemoval, 2, "Should have 2 statues after removal");

    const isStillComplete = map.isCityComplete(testCity.q, testCity.r);
    assert(!isStillComplete, "City should not be complete with only 2 statues");

    const updatedCompleteCities = map.getCompleteCities();
    assertEquals(
      updatedCompleteCities.length,
      allCities.length - 1,
      "Should have one less complete city",
    );
  }
});
