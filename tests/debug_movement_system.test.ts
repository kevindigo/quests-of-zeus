// Debug test for movement system
import { QuestsZeusGameEngine } from "../src/game-engine.ts";

Deno.test("Debug movement system", () => {
  const engine = new QuestsZeusGameEngine();
  engine.initializeGame();

  const player = engine.getCurrentPlayer();
  console.log("Initial player state:", {
    id: player.id,
    shipPosition: player.shipPosition,
  });

  // Check what type of hex the player starts on
  const gameState = engine.getGameState();
  const startCell = gameState.map.getCell(
    player.shipPosition.q,
    player.shipPosition.r,
  );
  console.log("Starting cell:", startCell);

  // Check reachable sea tiles from starting position
  const reachableSeaTiles = engine.getAvailableMoves(player.id, 0);
  console.log("Reachable sea tiles (no favor):", reachableSeaTiles.length);

  const reachableSeaTilesWithFavor = engine.getAvailableMoves(player.id, 5);
  console.log(
    "Reachable sea tiles (with 5 favor):",
    reachableSeaTilesWithFavor.length,
  );

  // Check blue sea tiles specifically
  const blueSeaTiles = gameState.map.getCellsByTerrain("sea").filter((cell) =>
    cell.color === "blue"
  );
  console.log("Total blue sea tiles on map:", blueSeaTiles.length);

  // Check if any blue sea tiles are reachable
  if (blueSeaTiles.length > 0) {
    const firstBlueTile = blueSeaTiles[0];
    console.log("First blue tile:", firstBlueTile);

    // Check if this specific tile is reachable
    const reachableFromStart = reachableSeaTiles.some((tile) =>
      tile.q === firstBlueTile!.q && tile.r === firstBlueTile!.r
    );
    console.log("Is first blue tile reachable?", reachableFromStart);
  }

  // Test movement system directly
  const movementSystem = (engine as any).movementSystem;
  if (movementSystem) {
    const reachableTiles = movementSystem.getReachableSeaTiles(
      player.shipPosition.q,
      player.shipPosition.r,
      3,
    );
    console.log(
      "Movement system reachable tiles (range 3):",
      reachableTiles.length,
    );

    const reachableTilesWithExtendedRange = movementSystem.getReachableSeaTiles(
      player.shipPosition.q,
      player.shipPosition.r,
      8,
    );
    console.log(
      "Movement system reachable tiles (range 8):",
      reachableTilesWithExtendedRange.length,
    );
  }
});
