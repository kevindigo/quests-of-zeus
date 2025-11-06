// Test for statue placement in game engine

import { OracleGameEngine } from "../src/game-engine.ts";

export function testStatuePlacement(): void {
  console.log("=== Testing Statue Placement in Game Engine ===\n");

  const game = new OracleGameEngine();
  const gameState = game.initializeGame();

  const player = game.getCurrentPlayer();
  console.log(`Current player: ${player.name}`);

  // Find a city
  const cities = gameState.map.getCellsByTerrain("city");
  const firstCity = cities[0];

  console.log(`\nTesting with city at (${firstCity.q}, ${firstCity.r}):`);
  console.log(`  City color: ${firstCity.color}`);
  console.log(`  Initial statues: ${firstCity.statues}`);

  // Move player to the city
  player.shipPosition = { q: firstCity.q, r: firstCity.r };
  gameState.phase = "action";

  // Test canPlaceStatueOnCity when player has no statues
  const canPlaceWithoutStatue = game.canPlaceStatueOnCity(player.id);
  console.log(
    `  Can place statue without statue in storage: ${canPlaceWithoutStatue}`,
  );

  // Add a statue of the city's color to player storage
  const emptySlotIndex = player.storage.findIndex((slot) =>
    slot.type === "empty"
  );
  if (emptySlotIndex !== -1) {
    player.storage[emptySlotIndex] = { type: "statue", color: firstCity.color };
    console.log(`  Added statue of ${firstCity.color} to player storage`);
  }

  // Test canPlaceStatueOnCity when player has the right statue
  const canPlaceWithStatue = game.canPlaceStatueOnCity(player.id);
  console.log(
    `  Can place statue with statue in storage: ${canPlaceWithStatue}`,
  );

  // Test actual statue placement
  const placementSuccess = game.placeStatueOnCity(player.id);
  console.log(
    `  Statue placement result: ${placementSuccess ? "SUCCESS" : "FAILED"}`,
  );
  console.log(`  Statues on city after placement: ${firstCity.statues}`);

  // Test canPlaceStatueOnCity after placement
  const canPlaceAfterPlacement = game.canPlaceStatueOnCity(player.id);
}

// Run the test if this file is executed directly
if (import.meta.main) {
  testStatuePlacement();
}
