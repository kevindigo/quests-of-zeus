#!/usr/bin/env -S deno run --allow-read

import { OracleGameEngine } from "./src/game-engine.ts";

function simpleOfferingTest() {
  console.log("Simple Offering cubes test...\n");

  try {
    const gameEngine = new OracleGameEngine();
    const gameState = gameEngine.initializeGame();
    
    console.log("✓ Game initialized successfully");
    console.log(`✓ Number of players: ${gameState.players.length}`);
    
    if (gameState.cubeHexes) {
      console.log(`✓ Number of cube hexes: ${gameState.cubeHexes.length}`);
      
      if (gameState.cubeHexes.length === 6) {
        console.log("✅ Correct number of cube hexes (6)");
      } else {
        console.log(`❌ Expected 6 cube hexes, found ${gameState.cubeHexes.length}`);
      }
      
      // Show first cube hex as example
      if (gameState.cubeHexes.length > 0) {
        const firstCubeHex = gameState.cubeHexes[0];
        console.log(`\nExample cube hex:`);
        console.log(`  Position: (${firstCubeHex.q}, ${firstCubeHex.r})`);
        console.log(`  Cubes: ${firstCubeHex.cubes.length} color(s)`);
        firstCubeHex.cubes.forEach(cube => {
          console.log(`    - ${cube.color}: ${cube.count} cubes`);
        });
      }
    } else {
      console.log("❌ cubeHexes is undefined");
    }

  } catch (error) {
    console.error("❌ Error:", error);
  }
}

if (import.meta.main) {
  simpleOfferingTest();
}