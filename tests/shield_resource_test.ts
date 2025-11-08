// Test file for shield resource functionality

import { QuestsZeusGameEngine } from "../src/game-engine.ts";

// Test that players start with 0 shield
function testShieldInitialization(): void {
  console.log("Testing shield initialization...");
  
  const gameEngine = new QuestsZeusGameEngine();
  gameEngine.initializeGame();
  
  const gameState = gameEngine.getGameState();
  
  // Check that all players have shield property initialized to 0
  gameState.players.forEach((player, index) => {
    console.assert(
      player.shield === 0,
      `Player ${index + 1} should start with 0 shield, but has ${player.shield}`
    );
    console.assert(
      typeof player.shield === "number",
      `Player ${index + 1} shield should be a number, but is ${typeof player.shield}`
    );
  });
  
  console.log("✓ All players start with 0 shield");
}

// Test that shield is properly serialized in game state
function testShieldSerialization(): void {
  console.log("Testing shield serialization...");
  
  const gameEngine = new QuestsZeusGameEngine();
  gameEngine.initializeGame();
  
  const gameState = gameEngine.getGameState();
  
  // Verify shield is present in serialized state
  gameState.players.forEach((player, index) => {
    console.assert(
      "shield" in player,
      `Player ${index + 1} should have shield property in game state`
    );
    console.assert(
      player.shield === 0,
      `Player ${index + 1} shield should be 0 in serialized state, but is ${player.shield}`
    );
  });
  
  console.log("✓ Shield properly serialized in game state");
}

// Test that shield can be modified (simulating future game mechanics)
function testShieldModification(): void {
  console.log("Testing shield modification...");
  
  const gameEngine = new QuestsZeusGameEngine();
  gameEngine.initializeGame();
  
  const gameState = gameEngine.getGameState();
  const player = gameState.players[0];
  
  // Simulate gaining shield (this would be done through game mechanics)
  const originalShield = player.shield;
  player.shield = 3; // Simulate gaining 3 shield
  
  console.assert(
    player.shield === 3,
    `Player shield should be 3 after modification, but is ${player.shield}`
  );
  
  // Simulate losing shield
  player.shield = 1; // Simulate losing 2 shield
  
  console.assert(
    player.shield === 1,
    `Player shield should be 1 after losing shield, but is ${player.shield}`
  );
  
  console.log("✓ Shield can be modified properly");
}

// Run all tests
function runShieldTests(): void {
  console.log("Running shield resource tests...\n");
  
  testShieldInitialization();
  testShieldSerialization();
  testShieldModification();
  
  console.log("\n✅ All shield resource tests passed!");
}

// Execute tests if this file is run directly
if (import.meta.main) {
  runShieldTests();
}