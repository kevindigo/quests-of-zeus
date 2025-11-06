#!/usr/bin/env -S deno run --allow-read

import { OracleGameEngine } from "../src/game-engine.ts";

function testOfferingCubes() {
  console.log("Testing Offering cubes initialization...\n");

  try {
    const gameEngine = new OracleGameEngine();
    const gameState = gameEngine.initializeGame();

    console.log("✓ Game initialized successfully");
    console.log(`✓ Number of players: ${gameState.players.length}`);
    console.log(`✓ Number of cube hexes: ${gameState.cubeHexes.length}`);

    // Check that we have exactly 6 cube hexes
    if (gameState.cubeHexes.length === 6) {
      console.log("✅ Correct number of cube hexes (6)");
    } else {
      console.log(
        `❌ Expected 6 cube hexes, found ${gameState.cubeHexes.length}`,
      );
    }

    // Check that each cube hex has exactly playerCount cubes
    const validCubeHexes = gameState.cubeHexes.filter((ch) =>
      ch.cubeColors.length === gameState.players.length
    );

    if (validCubeHexes.length === 6) {
      console.log(
        `✅ All cube hexes have exactly ${gameState.players.length} cubes`,
      );
    } else {
      console.log(
        `❌ ${validCubeHexes.length} of 6 cube hexes have valid cube configuration`,
      );
    }

    // Check that all 6 colors are represented (each color should appear playerCount times)
    const allCubeColors = gameState.cubeHexes.flatMap((ch) => ch.cubeColors);
    const colorCounts: Record<string, number> = {};
    allCubeColors.forEach((color) => {
      colorCounts[color] = (colorCounts[color] || 0) + 1;
    });

    const expectedColorCount = gameState.players.length;
    const correctColorCounts = Object.values(colorCounts).filter((count) =>
      count === expectedColorCount
    );

    if (correctColorCounts.length === 6) {
      console.log(
        `✅ All 6 colors are represented ${expectedColorCount} times each`,
      );
    } else {
      console.log(
        `❌ Expected 6 colors each appearing ${expectedColorCount} times, found ${correctColorCounts.length} colors with correct count`,
      );
    }

    // Check that no color appears twice on the same hex
    const hexesWithDuplicates = gameState.cubeHexes.filter((ch) => {
      const uniqueColors = new Set(ch.cubeColors);
      return uniqueColors.size !== ch.cubeColors.length;
    });

    if (hexesWithDuplicates.length === 0) {
      console.log("✅ No color appears twice on any island");
    } else {
      console.log(
        `❌ Found ${hexesWithDuplicates.length} hexes with duplicate colors`,
      );
    }

    console.log("\nCube hex distribution:");
    gameState.cubeHexes.forEach((ch) => {
      console.log(
        `  Position (${ch.q}, ${ch.r}): ${ch.cubeColors.join(", ")}`,
      );
    });
  } catch (error) {
    console.error("❌ Error:", error);
  }
}

if (import.meta.main) {
  testOfferingCubes();
}
