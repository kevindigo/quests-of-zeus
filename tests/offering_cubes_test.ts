import { assertEquals } from '@std/assert';
import { QuestsZeusGameEngine } from '../src/game-engine-core.ts';

Deno.test('offering cubes configuration', () => {
  const gameEngine = new QuestsZeusGameEngine();
  const gameState = gameEngine.initializeGame();

  // Check that each cube hex has exactly playerCount cubes
  const validCubeHexes = gameState.getCubeHexes().filter((ch) =>
    ch.cubeColors.length === gameState.players.length
  );

  assertEquals(
    validCubeHexes.length,
    6,
    `Expected all 6 offerings hexes to have exactly ${gameState.players.length} cubes, but found ${validCubeHexes.length} valid hexes`,
  );

  // Check that all 6 colors are represented (each color should appear playerCount times)
  const allCubeColors = gameState.getCubeHexes().flatMap((ch) => ch.cubeColors);
  const colorCounts: Record<string, number> = {};
  allCubeColors.forEach((color) => {
    colorCounts[color] = (colorCounts[color] || 0) + 1;
  });

  const expectedColorCount = gameState.players.length;
  const correctColorCounts = Object.values(colorCounts).filter((count) =>
    count === expectedColorCount
  );

  assertEquals(
    correctColorCounts.length,
    6,
    `Expected 6 colors each appearing ${expectedColorCount} times, but found ${correctColorCounts.length} colors with correct count`,
  );

  // Check that no color appears twice on the same hex
  const hexesWithDuplicates = gameState.getCubeHexes().filter((ch) => {
    const uniqueColors = new Set(ch.cubeColors);
    return uniqueColors.size !== ch.cubeColors.length;
  });

  assertEquals(
    hexesWithDuplicates.length,
    0,
    `Found ${hexesWithDuplicates.length} hexes with duplicate colors`,
  );
});
