// Unit test for recoloring favor calculation in extra range moves

import { assert, assertEquals } from "@std/assert";
import { QuestsZeusGameEngine } from "../src/game-engine.ts";
import type { HexColor } from "../src/types.ts";

Deno.test("RecolorFavorCalculation - basic recoloring intention", () => {
  const gameEngine = new QuestsZeusGameEngine();
  gameEngine.initializeGame();

  const player = gameEngine.getCurrentPlayer();

  // Set up deterministic test conditions
  player.oracleDice = ["black", "pink", "blue"] as HexColor[];
  player.favor = 5;

  // Clear any recoloring intentions that might exist from initialization
  player.recoloredDice = {};

  // Test: Set recoloring intention for black die → pink (1 favor cost)
  const recoloringSuccess = gameEngine.setRecolorIntention(
    player.id,
    "black",
    1,
  );
  assert(recoloringSuccess, "Recoloring intention should be set successfully");

  assertEquals(
    player.favor,
    5,
    "Player favor should not be spent when setting intention",
  );
});

Deno.test("RecolorFavorCalculation - moves account for recoloring cost", () => {
  const gameEngine = new QuestsZeusGameEngine();
  gameEngine.initializeGame();

  const player = gameEngine.getCurrentPlayer();

  // Set up deterministic test conditions
  player.oracleDice = ["black", "pink", "blue"] as HexColor[];
  player.favor = 5;

  // Clear any recoloring intentions that might exist from initialization
  player.recoloredDice = {};

  // Set recoloring intention for black die → pink (1 favor cost)
  const recoloringSuccess = gameEngine.setRecolorIntention(
    player.id,
    "black",
    1,
  );
  assert(recoloringSuccess, "Recoloring intention should be set successfully");

  // Get available moves for black die with recoloring intention
  const availableMoves = gameEngine.getAvailableMovesForDie(
    player.id,
    "black",
    player.favor,
  );

  // Should have moves that require pink sea tiles (since black die can be recolored to pink)
  const gameState = gameEngine.getGameState();
  const movesToPinkTiles = availableMoves.filter((move) => {
    const cell = gameState.map.getCell(move.q, move.r);
    return cell && cell.color === "pink";
  });

  assert(
    movesToPinkTiles.length > 0,
    "Should have moves to pink sea tiles with recolored black die",
  );

  // For each pink move, verify that the total cost (movement favor + recoloring cost) <= player favor
  for (const move of movesToPinkTiles) {
    const totalCost = move.favorCost + 1; // movement favor + recoloring cost
    const canAfford = totalCost <= player.favor;
    assert(
      canAfford,
      `Move to (${move.q}, ${move.r}) should be affordable with total cost ${totalCost}`,
    );
  }
});

Deno.test("RecolorFavorCalculation - high recoloring cost limits moves", () => {
  const gameEngine = new QuestsZeusGameEngine();
  gameEngine.initializeGame();

  const player = gameEngine.getCurrentPlayer();

  // Set up deterministic test conditions
  player.oracleDice = ["black", "pink", "blue"] as HexColor[];
  player.favor = 3; // Low favor

  // Clear any recoloring intentions that might exist from initialization
  player.recoloredDice = {};

  // Set a high recoloring cost that would make some moves unaffordable
  // Player has 3 favor, recoloring black → blue costs 2 favor
  // This means any blue move that requires additional favor for movement would be unaffordable
  const highRecolorSuccess = gameEngine.setRecolorIntention(
    player.id,
    "black",
    2,
  ); // black → blue (2 favor recoloring cost)

  assert(
    highRecolorSuccess,
    "High recoloring intention should be set successfully",
  );

  const movesWithHighRecolor = gameEngine.getAvailableMovesForDie(
    player.id,
    "black",
    player.favor,
  );

  // Verify that all returned moves are actually affordable
  // The game engine should filter out moves that exceed available favor
  for (const move of movesWithHighRecolor) {
    const totalCost = move.favorCost + 2; // movement favor + high recoloring cost
    const canAfford = totalCost <= player.favor;
    assert(
      canAfford,
      `Move to (${move.q}, ${move.r}) should not be available with total cost ${totalCost} exceeding favor ${player.favor}`,
    );
  }
});

Deno.test("RecolorFavorCalculation - moves without recoloring unaffected", () => {
  const gameEngine = new QuestsZeusGameEngine();
  gameEngine.initializeGame();

  const player = gameEngine.getCurrentPlayer();

  // Set up deterministic test conditions
  player.oracleDice = ["black", "pink", "blue"] as HexColor[];
  player.favor = 5;

  // Clear any recoloring intentions that might exist from initialization
  player.recoloredDice = {};

  // Clear any recoloring that might exist
  gameEngine.clearRecolorIntention(player.id, "black");

  const movesWithoutRecolor = gameEngine.getAvailableMovesForDie(
    player.id,
    "black",
    player.favor,
  );

  // Should only have moves to black sea tiles
  const gameState = gameEngine.getGameState();
  const movesToBlackTiles = movesWithoutRecolor.filter((move) => {
    const cell = gameState.map.getCell(move.q, move.r);
    return cell && cell.color === "black";
  });

  assertEquals(
    movesWithoutRecolor.length,
    movesToBlackTiles.length,
    "All moves should be to black sea tiles without recoloring",
  );

  for (const move of movesWithoutRecolor) {
    const canAfford = move.favorCost <= player.favor;
    assert(
      canAfford,
      `Move to (${move.q}, ${move.r}) should be affordable with cost ${move.favorCost}`,
    );
  }
});
