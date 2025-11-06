#!/usr/bin/env -S deno run --allow-read

// Comprehensive test for the statue system

import { HexMap } from "../src/hexmap.ts";
import { OracleGameEngine } from "../src/game-engine.ts";

export function testStatueSystem(): void {
  console.log("=== Testing Complete Statue System ===\n");

  // Test 1: Basic HexMap statue functionality
  console.log("1. Testing HexMap statue operations...");
  const map = new HexMap();
  const cities = map.getCellsByTerrain("city");

  if (cities.length === 0) {
    console.log("❌ No cities found on map");
    return;
  }

  console.log(`✓ Found ${cities.length} cities`);

  const testCity = cities[0];
  console.log(`✓ Testing with city at (${testCity.q}, ${testCity.r})`);

  // Test initial state
  const initialStatues = map.getStatuesOnCity(testCity.q, testCity.r);
  if (initialStatues !== 3) {
    console.log(`❌ Expected 3 statues initially, got ${initialStatues}`);
  } else {
    console.log("✓ Initial statue count is 3");
  }

  // Test removing statues (cities start with 3 statues)
  for (let i = 2; i >= 0; i--) {
    const success = map.removeStatueFromCity(testCity.q, testCity.r);
    const currentStatues = map.getStatuesOnCity(testCity.q, testCity.r);
    if (success && currentStatues === i) {
      console.log(`✓ Successfully removed statue, now ${i}/3`);
    } else {
      console.log(
        `❌ Failed to remove statue: success=${success}, statues=${currentStatues}`,
      );
    }
  }

  // Test removing beyond zero
  const underflowSuccess = map.removeStatueFromCity(testCity.q, testCity.r);
  if (!underflowSuccess) {
    console.log("✓ Correctly prevented removing statue below zero");
  } else {
    console.log("❌ Should not allow removing statue below zero");
  }

  // Test adding statues back
  for (let i = 1; i <= 3; i++) {
    const success = map.addStatueToCity(testCity.q, testCity.r);
    const currentStatues = map.getStatuesOnCity(testCity.q, testCity.r);
    if (success && currentStatues === i) {
      console.log(`✓ Successfully added statue ${i}/3`);
    } else {
      console.log(
        `❌ Failed to add statue ${i}: success=${success}, statues=${currentStatues}`,
      );
    }
  }

  // Test adding beyond limit
  const overflowSuccess = map.addStatueToCity(testCity.q, testCity.r);
  if (!overflowSuccess) {
    console.log("✓ Correctly prevented adding statue beyond limit");
  } else {
    console.log("❌ Should not allow adding statue beyond limit");
  }

  // Test city completion
  const isComplete = map.isCityComplete(testCity.q, testCity.r);
  if (isComplete) {
    console.log("✓ City correctly marked as complete");
  } else {
    console.log("❌ City should be complete with 3 statues");
  }

  // Test 2: Game Engine statue functionality
  console.log("\n2. Testing Game Engine statue operations...");
  const game = new OracleGameEngine();
  const gameState = game.initializeGame();
  const player = game.getCurrentPlayer();

  // Find a city and move player there
  const gameCities = gameState.map.getCellsByTerrain("city");
  const gameCity = gameCities[0];

  console.log(`✓ Testing with city at (${gameCity.q}, ${gameCity.r})`);
  player.shipPosition = { q: gameCity.q, r: gameCity.r };
  gameState.phase = "action";

  // Test without statue
  const canPlaceWithout = game.canPlaceStatueOnCity(player.id);
  if (!canPlaceWithout) {
    console.log("✓ Correctly cannot place statue without statue in storage");
  } else {
    console.log("❌ Should not allow placing statue without statue in storage");
  }

  // Add statue of wrong color
  const emptySlotIndex = player.storage.findIndex((slot) =>
    slot.type === "empty"
  );
  if (emptySlotIndex !== -1) {
    // Find a color different from the city
    const wrongColor = gameCity.color === "red" ? "blue" : "red";
    player.storage[emptySlotIndex] = { type: "statue", color: wrongColor };
    console.log(`✓ Added statue of wrong color (${wrongColor}) to storage`);
  }

  // Test with wrong color statue
  const canPlaceWrongColor = game.canPlaceStatueOnCity(player.id);
  if (!canPlaceWrongColor) {
    console.log("✓ Correctly cannot place statue with wrong color");
  } else {
    console.log("❌ Should not allow placing statue with wrong color");
  }

  // Add statue of correct color
  const anotherEmptySlot = player.storage.findIndex((slot) =>
    slot.type === "empty"
  );
  if (anotherEmptySlot !== -1) {
    player.storage[anotherEmptySlot] = {
      type: "statue",
      color: gameCity.color,
    };
    console.log(
      `✓ Added statue of correct color (${gameCity.color}) to storage`,
    );
  }

  // Test with correct color statue
  const canPlaceCorrectColor = game.canPlaceStatueOnCity(player.id);
  if (canPlaceCorrectColor) {
    console.log("✓ Can place statue with correct color");
  } else {
    console.log("❌ Should allow placing statue with correct color");
  }

  // Test actual placement
  const placementSuccess = game.placeStatueOnCity(player.id);
  if (placementSuccess) {
    console.log("✓ Successfully placed statue on city");
    console.log(`  City now has ${gameCity.statues}/3 statues`);
  } else {
    console.log("❌ Failed to place statue on city");
  }

  // Test statue was consumed from storage
  const statueStillInStorage = player.storage.some((slot) =>
    slot.type === "statue" && slot.color === gameCity.color
  );
  if (!statueStillInStorage) {
    console.log("✓ Statue was correctly consumed from storage");
  } else {
    console.log("❌ Statue should have been consumed from storage");
  }

  console.log("\n✅ All statue system tests completed!");
}

if (import.meta.main) {
  testStatueSystem();
}
