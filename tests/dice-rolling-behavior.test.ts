// Tests for the new dice rolling behavior (dice rolled at end of turn)

import { assert, assertEquals, assertExists } from "@std/assert";
import { QuestsZeusGameEngine } from "../src/game-engine.ts";
import type { HexColor } from "../src/types.ts";

Deno.test("DiceRolling - all players start with dice rolled", () => {
  const engine = new QuestsZeusGameEngine();

  // Initialize the game
  engine.initializeGame();
  const state = engine.getGameState();

  // All players should start with dice already rolled
  state.players.forEach((player, index) => {
    assertEquals(
      player.oracleDice.length,
      3,
      `Player ${index + 1} should start with 3 dice rolled`,
    );

    // Each die should be a valid color
    player.oracleDice.forEach((dieColor, dieIndex) => {
      assert(
        ["red", "pink", "blue", "black", "green", "yellow"].includes(dieColor),
        `Player ${
          index + 1
        } die ${dieIndex} should be a valid color, got ${dieColor}`,
      );
    });
  });

  // Game should start in action phase since dice are already rolled
  assertEquals(state.phase, "action", "Game should start in action phase");
});

Deno.test("DiceRolling - dice rolled for next player at end of turn", () => {
  const engine = new QuestsZeusGameEngine();
  engine.initializeGame();

  const initialState = engine.getGameState();
  const player1 = engine.getPlayer(1);
  const player2 = engine.getPlayer(2);

  assertExists(player1);
  assertExists(player2);

  // Record initial dice for both players
  const player1InitialDice = [...player1.oracleDice];
  const player2InitialDice = [...player2.oracleDice];

  // Player 1 should be current player initially
  assertEquals(
    initialState.currentPlayerIndex,
    0,
    "Player 1 should be current player initially",
  );

  // End Player 1's turn
  engine.endTurn();

  const stateAfterEndTurn = engine.getGameState();

  // Player 2 should now be current player
  assertEquals(
    stateAfterEndTurn.currentPlayerIndex,
    1,
    "Player 2 should be current player after endTurn",
  );

  // Game should still be in action phase
  assertEquals(
    stateAfterEndTurn.phase,
    "action",
    "Game should remain in action phase after endTurn",
  );

  // Player 2 should have new dice rolled
  const player2AfterTurn = engine.getPlayer(2);
  assertExists(player2AfterTurn);

  assertEquals(
    player2AfterTurn.oracleDice.length,
    3,
    "Player 2 should have 3 dice after endTurn",
  );

  // Player 2's dice should be different from their initial dice
  // (Note: There's a small chance they could be the same by random chance, but very unlikely)
  const diceChanged = player2AfterTurn.oracleDice.some(
    (die, index) => die !== player2InitialDice[index],
  );
  assert(
    diceChanged,
    "Player 2 should have new dice rolled at end of Player 1's turn",
  );

  // Player 1 should still have their original dice (unchanged)
  const player1AfterTurn = engine.getPlayer(1);
  assertExists(player1AfterTurn);
  assertEquals(
    player1AfterTurn.oracleDice,
    player1InitialDice,
    "Player 1's dice should remain unchanged after endTurn",
  );
});

Deno.test("DiceRolling - recoloring intentions cleared at end of turn", () => {
  const engine = new QuestsZeusGameEngine();
  engine.initializeGame();

  const player1 = engine.getPlayer(1);
  assertExists(player1);

  // Set up a recoloring intention for Player 1
  const dieColorToRecolor = player1.oracleDice[0];
  const success = engine.setRecolorIntention(1, dieColorToRecolor!, 1);
  assert(success, "Should be able to set recoloring intention");

  // Verify recoloring intention was set
  assertExists(player1.recoloredDice[dieColorToRecolor!]);

  // End Player 1's turn
  engine.endTurn();

  // Player 1's recoloring intentions should be cleared
  const player1AfterTurn = engine.getPlayer(1);
  assertExists(player1AfterTurn);
  assertEquals(
    Object.keys(player1AfterTurn.recoloredDice).length,
    0,
    "Player 1's recoloring intentions should be cleared at end of turn",
  );
});

Deno.test("DiceRolling - round advances when all players have taken turns", () => {
  const engine = new QuestsZeusGameEngine();
  engine.initializeGame();

  const initialState = engine.getGameState();
  assertEquals(initialState.round, 1, "Game should start at round 1");

  // End Player 1's turn (Player 2 becomes current)
  engine.endTurn();
  const stateAfterPlayer1Turn = engine.getGameState();
  assertEquals(
    stateAfterPlayer1Turn.round,
    1,
    "Round should still be 1 after first endTurn",
  );

  // End Player 2's turn (Player 1 becomes current again)
  engine.endTurn();
  const stateAfterPlayer2Turn = engine.getGameState();
  assertEquals(
    stateAfterPlayer2Turn.round,
    2,
    "Round should advance to 2 after all players have taken turns",
  );

  // Current player should be back to Player 1
  assertEquals(
    stateAfterPlayer2Turn.currentPlayerIndex,
    0,
    "Current player should be Player 1 after full round",
  );
});

Deno.test("DiceRolling - dice are valid colors after rolling", () => {
  const engine = new QuestsZeusGameEngine();
  engine.initializeGame();

  const state = engine.getGameState();
  const validColors: HexColor[] = [
    "red",
    "pink",
    "blue",
    "black",
    "green",
    "yellow",
  ];

  // Check all players' dice are valid colors
  state.players.forEach((player, playerIndex) => {
    player.oracleDice.forEach((dieColor, dieIndex) => {
      assert(
        validColors.includes(dieColor),
        `Player ${
          playerIndex + 1
        } die ${dieIndex} should be valid color, got ${dieColor}`,
      );
    });
  });

  // End a few turns and verify dice remain valid
  for (let i = 0; i < 3; i++) {
    engine.endTurn();
    const newState = engine.getGameState();

    newState.players.forEach((player, playerIndex) => {
      player.oracleDice.forEach((dieColor, dieIndex) => {
        assert(
          validColors.includes(dieColor),
          `Player ${
            playerIndex + 1
          } die ${dieIndex} should be valid color after endTurn, got ${dieColor}`,
        );
      });
    });
  }
});

Deno.test("DiceRolling - manual rollOracleDice still works for special cases", () => {
  const engine = new QuestsZeusGameEngine();
  engine.initializeGame();

  const player1 = engine.getPlayer(1);
  assertExists(player1);

  // Record initial dice
  const initialDice = [...player1.oracleDice];

  // Manually roll dice for Player 1 (for debugging or special cases)
  const newDice = engine.rollOracleDice(1);

  assertEquals(newDice.length, 3, "Manual roll should return 3 dice");

  // Player 1 should have the new dice
  assertEquals(
    player1.oracleDice,
    newDice,
    "Player 1 should have the manually rolled dice",
  );

  // Dice should be different from initial dice
  // (Note: There's a small chance they could be the same by random chance)
  const diceChanged = player1.oracleDice.some(
    (die, index) => die !== initialDice[index],
  );
  assert(
    diceChanged,
    "Manual roll should produce new dice",
  );
});

Deno.test("DiceRolling - next player always has dice ready", () => {
  const engine = new QuestsZeusGameEngine();
  engine.initializeGame();

  // Simulate multiple turns and verify next player always has dice
  for (let turn = 0; turn < 5; turn++) {
    const currentState = engine.getGameState();
    const currentPlayer = currentState.players[currentState.currentPlayerIndex];

    // Current player should have dice
    assertEquals(
      currentPlayer!.oracleDice.length,
      3,
      `Current player should have 3 dice at turn ${turn}`,
    );

    // End turn
    engine.endTurn();

    const nextState = engine.getGameState();
    const nextPlayer = nextState.players[nextState.currentPlayerIndex];

    // Next player should have dice ready
    assertEquals(
      nextPlayer!.oracleDice.length,
      3,
      `Next player should have 3 dice ready at turn ${turn}`,
    );
  }
});
