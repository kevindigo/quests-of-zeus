// Tests for the new movement rules

import { assert, assertEquals } from "@std/assert";
import { OracleGameEngine } from "../src/game-engine.ts";
import { HexMap } from "../src/hexmap.ts";

Deno.test("Movement Rules - Only move to sea spaces", () => {
  const engine = new OracleGameEngine();
  engine.initializeGame();
  
  const gameState = engine.getGameState();
  const player = engine.getCurrentPlayer();
  
  // Roll dice to enter action phase
  engine.rollOracleDice(player.id);
  
  // Get all available moves
  const availableMoves = engine.getAvailableMoves(player.id);
  
  // All available moves should be to sea hexes only
  availableMoves.forEach(move => {
    const targetCell = gameState.map.getCell(move.q, move.r);
    assertEquals(targetCell?.terrain, "sea", "Movement should only be allowed to sea hexes");
  });
});

Deno.test("Movement Rules - Movement range of 3 hexes", () => {
  const engine = new OracleGameEngine();
  engine.initializeGame();
  
  const gameState = engine.getGameState();
  const player = engine.getCurrentPlayer();
  
  // Roll dice to enter action phase
  engine.rollOracleDice(player.id);
  
  // Get all available moves
  const availableMoves = engine.getAvailableMoves(player.id);
  
  // Check that all moves are within 3 hexes
  availableMoves.forEach(move => {
    const distance = engine["hexDistance"](
      player.shipPosition.q,
      player.shipPosition.r,
      move.q,
      move.r
    );
    assert(distance <= 3, `Movement distance should be <= 3, got ${distance}`);
    assert(distance > 0, "Movement distance should be greater than 0");
  });
});

Deno.test("Movement Rules - Die color requirement", () => {
  const engine = new OracleGameEngine();
  engine.initializeGame();
  
  const gameState = engine.getGameState();
  const player = engine.getCurrentPlayer();
  
  // Roll dice to enter action phase
  engine.rollOracleDice(player.id);
  
  // Get all available moves
  const availableMoves = engine.getAvailableMoves(player.id);
  
  // Check that each move has a die color that matches the target sea hex
  availableMoves.forEach(move => {
    const targetCell = gameState.map.getCell(move.q, move.r);
    assertEquals(targetCell?.color, move.dieColor, "Die color should match sea hex color");
    
    // Check that player has the required die
    assert(
      player.oracleDice.includes(move.dieColor),
      `Player should have ${move.dieColor} die in their oracle dice`
    );
  });
});

Deno.test("Movement Rules - Successful movement consumes die", () => {
  const engine = new OracleGameEngine();
  engine.initializeGame();
  
  const player = engine.getCurrentPlayer();
  
  // Roll dice to enter action phase
  const initialDice = engine.rollOracleDice(player.id);
  const initialDiceCount = player.oracleDice.length;
  
  // Get available moves
  const availableMoves = engine.getAvailableMoves(player.id);
  
  if (availableMoves.length > 0) {
    const firstMove = availableMoves[0];
    
    // Move to the target hex
    const success = engine.moveShip(player.id, firstMove.q, firstMove.r, firstMove.dieColor);
    assert(success, "Movement should be successful");
    
    // Check that the die was consumed
    assertEquals(player.oracleDice.length, initialDiceCount - 1, "One die should be consumed");
    assert(!player.oracleDice.includes(firstMove.dieColor), "Used die should be removed from oracle dice");
    
    // Check that ship position was updated
    assertEquals(player.shipPosition, { q: firstMove.q, r: firstMove.r }, "Ship position should be updated");
  }
});

Deno.test("Movement Rules - Invalid movement attempts", () => {
  const engine = new OracleGameEngine();
  engine.initializeGame();
  
  const gameState = engine.getGameState();
  const player = engine.getCurrentPlayer();
  
  // Roll dice to enter action phase
  engine.rollOracleDice(player.id);
  
  // Try to move to a land hex (should fail)
  const landCells = gameState.map.getCellsByTerrain("city");
  if (landCells.length > 0) {
    const landCell = landCells[0];
    const success = engine.moveShip(player.id, landCell.q, landCell.r, "red");
    assert(!success, "Movement to land hex should fail");
  }
  
  // Try to move to a sea hex with wrong die color (should fail)
  const seaCells = gameState.map.getCellsByTerrain("sea");
  if (seaCells.length > 0) {
    const seaCell = seaCells[0];
    // Use a color that doesn't match the sea hex
    const wrongColor = seaCell.color === "red" ? "blue" : "red";
    const success = engine.moveShip(player.id, seaCell.q, seaCell.r, wrongColor);
    assert(!success, "Movement with wrong die color should fail");
  }
  
  // Try to move to a sea hex that's too far (should fail)
  // Find a sea cell that's more than 3 hexes away
  const farSeaCells = seaCells.filter(cell => {
    const distance = engine["hexDistance"](
      player.shipPosition.q,
      player.shipPosition.r,
      cell.q,
      cell.r
    );
    return distance > 3;
  });
  
  if (farSeaCells.length > 0) {
    const farCell = farSeaCells[0];
    const success = engine.moveShip(player.id, farCell.q, farCell.r, farCell.color);
    assert(!success, "Movement beyond 3 hexes should fail");
  }
});