// Comprehensive test for the statue system

import { assert, assertEquals } from "@std/assert";
import { type HexColor, HexMap } from "../src/hexmap.ts";
import { QuestsZeusGameEngine } from "../src/game-engine.ts";

Deno.test("StatueSystem - HexMap statue operations", () => {
  const map = new HexMap();
  const cities = map.getCellsByTerrain("city");

  assert(cities.length > 0, "No cities found on map");

  const testCity = cities[0];

  // Test initial state
  const initialStatues = map.getStatuesOnCity(testCity.q, testCity.r);
  assertEquals(initialStatues, 3, "Expected 3 statues initially");

  // Test removing statues (cities start with 3 statues)
  for (let i = 2; i >= 0; i--) {
    const success = map.removeStatueFromCity(testCity.q, testCity.r);
    const currentStatues = map.getStatuesOnCity(testCity.q, testCity.r);
    assert(success, `Failed to remove statue at count ${i + 1}`);
    assertEquals(currentStatues, i, `Expected ${i} statues after removal`);
  }

  // Test removing beyond zero
  const underflowSuccess = map.removeStatueFromCity(testCity.q, testCity.r);
  assert(!underflowSuccess, "Should not allow removing statue below zero");

  // Test adding statues back
  for (let i = 1; i <= 3; i++) {
    const success = map.addStatueToCity(testCity.q, testCity.r);
    const currentStatues = map.getStatuesOnCity(testCity.q, testCity.r);
    assert(success, `Failed to add statue ${i}`);
    assertEquals(currentStatues, i, `Expected ${i} statues after addition`);
  }

  // Test adding beyond limit
  const overflowSuccess = map.addStatueToCity(testCity.q, testCity.r);
  assert(!overflowSuccess, "Should not allow adding statue beyond limit");

  // Test city completion
  const isComplete = map.isCityComplete(testCity.q, testCity.r);
  assert(isComplete, "City should be complete with 3 statues");
});

Deno.test("StatueSystem - Game Engine statue operations", () => {
  const game = new QuestsZeusGameEngine();
  const gameState = game.initializeGame();
  const player = game.getCurrentPlayer();

  // Find a city and move player there
  const gameCities = gameState.map.getCellsByTerrain("city");
  assert(gameCities.length > 0, "No cities found in game map");
  const gameCity = gameCities[0];

  // Use the game engine's movement system to properly position the player
  // First, roll oracle dice to enter action phase
  game.rollOracleDice(player.id);

  // Move player to the city using the game engine's movement system
  // We need to find a sea path to the city
  const availableMoves = game.getAvailableMoves(player.id);

  // Find a move that gets us close to the city
  const moveToCity = availableMoves.find((move) =>
    Math.abs(move.q - gameCity.q) <= 1 && Math.abs(move.r - gameCity.r) <= 1
  );

  if (moveToCity) {
    // Move to adjacent sea tile
    const moveSuccess = game.moveShip(
      player.id,
      moveToCity.q,
      moveToCity.r,
      moveToCity.dieColor,
    );
    assert(moveSuccess, "Failed to move player near city");
  } else {
    // If no adjacent sea move found, just set position directly (for testing)
    player.shipPosition = { q: gameCity.q, r: gameCity.r };
  }

  // Test without statue
  const canPlaceWithout = game.canPlaceStatueOnCity(player.id);
  assert(
    !canPlaceWithout,
    "Should not allow placing statue without statue in storage",
  );

  // Add statue of wrong color
  const emptySlotIndex = player.storage.findIndex((slot) =>
    slot.type === "empty"
  );
  if (emptySlotIndex !== -1) {
    // Find a color different from the city
    const availableColors: HexColor[] = [
      "red",
      "blue",
      "green",
      "yellow",
      "pink",
      "black",
    ];
    const wrongColor = availableColors.find((color) =>
      color !== gameCity.color
    ) || "red";
    player.storage[emptySlotIndex] = {
      type: "statue",
      color: wrongColor,
    };
  } else {
    // If no empty slots, we can't proceed with this test
    return;
  }

  // Test with wrong color statue
  const canPlaceWrongColor = game.canPlaceStatueOnCity(player.id);
  assert(
    !canPlaceWrongColor,
    "Should not allow placing statue with wrong color",
  );

  // First, remove one statue from the city so we can place one
  const removeSuccess = gameState.map.removeStatueFromCity(
    gameCity.q,
    gameCity.r,
  );
  assert(
    removeSuccess,
    "Failed to remove statue from city to make room for placement",
  );

  // Add statue of correct color
  const anotherEmptySlot = player.storage.findIndex((slot) =>
    slot.type === "empty"
  );
  if (anotherEmptySlot !== -1) {
    player.storage[anotherEmptySlot] = {
      type: "statue",
      color: gameCity.color,
    };
  } else {
    // If no empty slot, replace the wrong color statue
    player.storage[emptySlotIndex] = {
      type: "statue",
      color: gameCity.color,
    };
  }

  // Test with correct color statue
  const canPlaceCorrectColor = game.canPlaceStatueOnCity(player.id);
  assert(
    canPlaceCorrectColor,
    "Should allow placing statue with correct color",
  );

  // Test actual placement
  const placementSuccess = game.placeStatueOnCity(player.id);
  assert(placementSuccess, "Failed to place statue on city");
  const _statuesAfterPlacement = gameState.map.getStatuesOnCity(
    gameCity.q,
    gameCity.r,
  );

  // Test statue was consumed from storage
  const statueStillInStorage = player.storage.some((slot) =>
    slot.type === "statue" && slot.color === gameCity.color
  );
  assert(
    !statueStillInStorage,
    "Statue should have been consumed from storage",
  );
});

Deno.test("StatueSystem - Multiple cities statue operations", () => {
  const map = new HexMap();
  const cities = map.getCellsByTerrain("city");

  assert(cities.length >= 2, "Need at least 2 cities for this test");

  // Test that operations on one city don't affect another
  const city1 = cities[0];
  const city2 = cities[1];

  // Remove statues from city1
  const removalSuccess = map.removeStatueFromCity(city1.q, city1.r);
  assert(removalSuccess, "Failed to remove statue from city1");
  const city1Statues = map.getStatuesOnCity(city1.q, city1.r);
  const city2Statues = map.getStatuesOnCity(city2.q, city2.r);

  assertEquals(city1Statues, 2, "City1 should have 2 statues after removal");
  assertEquals(city2Statues, 3, "City2 should still have 3 statues");
});

Deno.test("StatueSystem - City completion state", () => {
  const map = new HexMap();
  const cities = map.getCellsByTerrain("city");
  const testCity = cities[0];

  // Initially should be complete (cities start with 3 statues)
  let isComplete = map.isCityComplete(testCity.q, testCity.r);
  assert(isComplete, "City should be complete initially with 3 statues");

  // Remove all statues
  for (let i = 0; i < 3; i++) {
    const success = map.removeStatueFromCity(testCity.q, testCity.r);
    assert(success, `Failed to remove statue ${i + 1}`);
  }

  // Should not be complete with 0 statues
  isComplete = map.isCityComplete(testCity.q, testCity.r);
  assert(!isComplete, "City should not be complete with 0 statues");

  // Add statues back one by one
  for (let i = 1; i <= 3; i++) {
    const success = map.addStatueToCity(testCity.q, testCity.r);
    assert(success, `Failed to add statue ${i}`);
    isComplete = map.isCityComplete(testCity.q, testCity.r);
    if (i === 3) {
      assert(isComplete, "City should be complete with 3 statues");
    } else {
      assert(!isComplete, `City should not be complete with ${i} statues`);
    }
  }
});
