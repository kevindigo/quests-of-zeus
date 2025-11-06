#!/usr/bin/env -S deno run --allow-read

import { OracleGameEngine } from "./src/game-engine.ts";

function debugOfferingCubes() {
  console.log("Debugging Offering cubes initialization...\n");

  try {
    const gameEngine = new OracleGameEngine();
    const gameState = gameEngine.initializeGame();

    console.log("✓ Game initialized successfully");
    console.log(`✓ Number of players: ${gameState.players.length}`);
    console.log(`✓ Number of cube hexes: ${gameState.cubeHexes?.length || 0}`);

    if (!gameState.cubeHexes) {
      console.log("❌ cubeHexes is undefined");
      return;
    }

    // Check that we have exactly 6 cube hexes
    if (gameState.cubeHexes.length === 6) {
      console.log("✅ Correct number of cube hexes (6)");
    } else {
      console.log(
        `❌ Expected 6 cube hexes, found ${gameState.cubeHexes.length}`,
      );
    }

    // Check that each cube hex has exactly one color
    const validCubeHexes = gameState.cubeHexes.filter((ch) =>
      ch.cubes && ch.cubes.length === 1 &&
      ch.cubes[0].count === gameState.players.length
    );

    if (validCubeHexes.length === 6) {
      console.log(
        "✅ All cube hexes have exactly one color with correct count",
      );
    } else {
      console.log(
        `❌ ${validCubeHexes.length} of 6 cube hexes have valid cube configuration`,
      );
    }

    // Check that all 6 colors are represented
    const colors = new Set(gameState.cubeHexes.map((ch) => ch.cubes[0].color));
    if (colors.size === 6) {
      console.log("✅ All 6 colors are represented on cube hexes");
    } else {
      console.log(`❌ Expected 6 unique colors, found ${colors.size}`);
    }

    // Check that no color appears twice
    const colorCounts: Record<string, number> = {};
    gameState.cubeHexes.forEach((ch) => {
      const color = ch.cubes[0].color;
      colorCounts[color] = (colorCounts[color] || 0) + 1;
    });

    const duplicateColors = Object.entries(colorCounts).filter(([_, count]) =>
      count > 1
    );
    if (duplicateColors.length === 0) {
      console.log("✅ No color appears twice on any island");
    } else {
      console.log(
        `❌ Found duplicate colors: ${
          duplicateColors.map(([color]) => color).join(", ")
        }`,
      );
    }

    // Check cube counts
    const expectedCount = gameState.players.length;
    const correctCounts = gameState.cubeHexes.filter((ch) =>
      ch.cubes[0].count === expectedCount
    );
    if (correctCounts.length === 6) {
      console.log(
        `✅ All cube hexes have ${expectedCount} cubes (one per player)`,
      );
    } else {
      console.log(
        `❌ ${correctCounts.length} of 6 cube hexes have correct cube count`,
      );
    }

    console.log("\nCube hex distribution:");
    gameState.cubeHexes.forEach((ch) => {
      const cube = ch.cubes[0];
      console.log(
        `  Position (${ch.q}, ${ch.r}): ${cube.color} cubes: ${cube.count}`,
      );
    });
  } catch (error) {
    console.error("❌ Error:", error);
  }
}

if (import.meta.main) {
  debugOfferingCubes();
}
