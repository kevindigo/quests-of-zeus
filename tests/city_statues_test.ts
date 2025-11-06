// Test for city statue functionality

import { HexMap } from "../src/hexmap.ts";

export function testCityStatues(): void {
  console.log("=== Testing City Statue Functionality ===\n");

  const map = new HexMap();
  const cities = map.getCellsByTerrain("city");

  console.log(`Found ${cities.length} cities`);

  // Test statue operations on each city
  cities.forEach((city, index) => {
    console.log(`\nCity ${index + 1} at (${city.q}, ${city.r}):`);
    console.log(`  Color: ${city.color}`);
    console.log(`  Initial statues: ${city.statues}`);

    // Test adding statues
    for (let i = 1; i <= 4; i++) {
      const success = map.addStatueToCity(city.q, city.r);
      const currentStatues = map.getStatuesOnCity(city.q, city.r);
      console.log(
        `  Attempt ${i}: add statue -> ${
          success ? "SUCCESS" : "FAILED"
        }, statues: ${currentStatues}`,
      );
    }

    // Test removing statues
    for (let i = 1; i <= 4; i++) {
      const success = map.removeStatueFromCity(city.q, city.r);
      const currentStatues = map.getStatuesOnCity(city.q, city.r);
      console.log(
        `  Attempt ${i}: remove statue -> ${
          success ? "SUCCESS" : "FAILED"
        }, statues: ${currentStatues}`,
      );
    }

    // Test city completion
    console.log(`  Is city complete: ${map.isCityComplete(city.q, city.r)}`);
  });

  // Test complete cities
  const completeCities = map.getCompleteCities();
}

// Run the test if this file is executed directly
if (import.meta.main) {
  testCityStatues();
}
