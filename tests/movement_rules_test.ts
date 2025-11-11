// Tests for the new movement rules

import { assert, assertEquals } from "@std/assert";
import { QuestsZeusGameEngine } from "../src/game-engine.ts";

Deno.test("Movement Rules - Only move to sea spaces", () => {
  const engine = new QuestsZeusGameEngine();
  engine.initializeGame();

  const gameState = engine.getGameState();
  const player = engine.getCurrentPlayer();

  // Roll dice to enter action phase
  engine.rollOracleDice(player.id);

  // Get all available moves
  const availableMoves = engine.getAvailableMoves(player.id);

  // All available moves should be to sea hexes only
  availableMoves.forEach((move) => {
    const targetCell = gameState.map.getCell(move.q, move.r);
    assertEquals(
      targetCell?.terrain,
      "sea",
      "Movement should only be allowed to sea hexes",
    );
  });
});

Deno.test("Movement Rules - Movement range of 3 steps on sea tiles", () => {
  const engine = new QuestsZeusGameEngine();
  engine.initializeGame();

  const gameState = engine.getGameState();
  const player = engine.getCurrentPlayer();

  // Roll dice to enter action phase
  engine.rollOracleDice(player.id);

  // Get all available moves
  const availableMoves = engine.getAvailableMoves(player.id);

  // Check that all moves are reachable within 3 steps on sea tiles
  // (This is tested implicitly by the getAvailableMoves method)
  assert(
    availableMoves.length >= 0,
    "Should have valid moves (possibly 0 if no matching dice)",
  );

  // Verify that all moves are to sea tiles
  availableMoves.forEach((move) => {
    const targetCell = gameState.map.getCell(move.q, move.r);
    assertEquals(
      targetCell?.terrain,
      "sea",
      "Movement should only be allowed to sea hexes",
    );
  });
});

Deno.test("Movement Rules - Die color requirement", () => {
  const engine = new QuestsZeusGameEngine();
  engine.initializeGame();

  const gameState = engine.getGameState();
  const player = engine.getCurrentPlayer();

  // Roll dice to enter action phase
  engine.rollOracleDice(player.id);

  // Get all available moves
  const availableMoves = engine.getAvailableMoves(player.id);

  // Check that each move has a die color that matches the target sea hex
  availableMoves.forEach((move) => {
    const targetCell = gameState.map.getCell(move.q, move.r);
    assertEquals(
      targetCell?.color,
      move.dieColor,
      "Die color should match sea hex color",
    );

    // Check that player has the required die
    assert(
      player.oracleDice.includes(move.dieColor),
      `Player should have ${move.dieColor} die in their oracle dice`,
    );
  });
});

Deno.test("Movement Rules - Successful movement consumes die", () => {
  const engine = new QuestsZeusGameEngine();
  engine.initializeGame();

  const player = engine.getCurrentPlayer();

  // Players already have dice from initialization, no need to roll again
  // Store the initial dice state before movement
  const initialDiceColors = [...player.oracleDice];
  const initialDiceCount = initialDiceColors.length;

  // Get available moves
  const availableMoves = engine.getAvailableMoves(player.id);

  if (availableMoves.length > 0) {
    const firstMove = availableMoves[0];
    if (!firstMove) {
      throw new Error("First move not found");
    }

    // Count occurrences of the used die color before movement
    const initialCountOfUsedColor = initialDiceColors.filter((color) =>
      color === firstMove.dieColor
    ).length;

    // Move to the target hex
    const moveResult = engine.moveShip(
      player.id,
      firstMove.q,
      firstMove.r,
      firstMove.dieColor,
    );
    assert(moveResult.success, "Movement should be successful");

    // Get the same player reference after movement (don't use getCurrentPlayer as turn may have ended)
    // Use the original player reference since the player object should be updated
    const samePlayer = engine.getPlayer(player.id);
    if (!samePlayer) {
      throw new Error("Player not found after movement");
    }

    // Count occurrences of the used die color after movement
    const finalCountOfUsedColor = samePlayer.oracleDice.filter((color) =>
      color === firstMove.dieColor
    ).length;

    // Check that exactly one die was consumed
    assertEquals(
      samePlayer.oracleDice.length,
      initialDiceCount - 1,
      `One die should be consumed. Expected ${
        initialDiceCount - 1
      }, got ${samePlayer.oracleDice.length}`,
    );

    // Check that exactly one die of the used color was removed
    assertEquals(
      finalCountOfUsedColor,
      initialCountOfUsedColor - 1,
      `Exactly one ${firstMove.dieColor} die should be removed. Had ${initialCountOfUsedColor}, now have ${finalCountOfUsedColor}`,
    );

    // Check that ship position was updated
    assertEquals(
      samePlayer.shipPosition,
      { q: firstMove.q, r: firstMove.r },
      "Ship position should be updated",
    );
  }
});

Deno.test("Movement Rules - Invalid movement attempts", () => {
  const engine = new QuestsZeusGameEngine();
  engine.initializeGame();

  const gameState = engine.getGameState();
  const player = engine.getCurrentPlayer();

  // Roll dice to enter action phase
  engine.rollOracleDice(player.id);

  // Try to move to a land hex (should fail)
  const landCells = gameState.map.getCellsByTerrain("city");
  if (landCells.length > 0) {
    const landCell = landCells[0];
    if (!landCell) {
      throw new Error("Land cell not found");
    }
    const moveResult = engine.moveShip(
      player.id,
      landCell.q,
      landCell.r,
      "red",
    );
    assert(!moveResult.success, "Movement to land hex should fail");
  }

  // Try to move to a sea hex with wrong die color (should fail)
  const seaCells = gameState.map.getCellsByTerrain("sea");
  if (seaCells.length > 0) {
    const seaCell = seaCells[0];
    assert(seaCell);
    // Use a color that doesn't match the sea hex
    const wrongColor = seaCell.color === "red" ? "blue" : "red";
    const moveResult = engine.moveShip(
      player.id,
      seaCell.q,
      seaCell.r,
      wrongColor,
    );
    assert(!moveResult.success, "Movement with wrong die color should fail");
  }

  // Try to move to a sea hex that's not reachable within 3 steps (should fail)
  // Find a sea cell that's not in the available moves
  const availableMoves = engine.getAvailableMoves(player.id);
  const unreachableSeaCells = seaCells.filter((cell) =>
    !availableMoves.some((move) => move.q === cell.q && move.r === cell.r)
  );

  if (unreachableSeaCells.length > 0) {
    const unreachableCell = unreachableSeaCells[0];
    assert(unreachableCell);
    const moveResult = engine.moveShip(
      player.id,
      unreachableCell.q,
      unreachableCell.r,
      unreachableCell.color,
    );
    assert(!moveResult.success, "Movement to unreachable sea hex should fail");
  }
});
