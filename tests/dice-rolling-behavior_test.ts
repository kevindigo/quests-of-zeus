// Tests for the new dice rolling behavior (dice rolled at end of turn)

import { assert, assertEquals, assertExists } from '@std/assert';
import { GameManager } from '../src/GameManager.ts';
import type { HexColor } from '../src/types.ts';

Deno.test('DiceRolling - all players start with dice rolled', () => {
  const engine = new GameManager();

  // Initialize the game
  const state = engine.getGameState();

  // All players should start with dice already rolled
  for (let playerId = 0; playerId < state.getPlayerCount(); ++playerId) {
    const player = state.getPlayer(playerId);
    assertEquals(
      player.oracleDice.length,
      3,
      `Player ${playerId + 1} should start with 3 dice rolled`,
    );

    // Each die should be a valid color
    player.oracleDice.forEach((dieColor, dieIndex) => {
      assert(
        ['red', 'pink', 'blue', 'black', 'green', 'yellow'].includes(dieColor),
        `Player ${
          playerId + 1
        } die ${dieIndex} should be a valid color, got ${dieColor}`,
      );
    });
  }

  // Game should start in action phase since dice are already rolled
  assertEquals(state.getPhase(), 'action', 'Game should start in action phase');
});

Deno.test('DiceRolling - dice rolled for next player at end of turn', () => {
  const engine = new GameManager();

  const initialState = engine.getGameState();
  assertExists(initialState.getPlayer(0));
  assertExists(initialState.getPlayer(1));

  assertEquals(initialState.getPlayer(0).oracleDice.length, 3);
  assertEquals(initialState.getPlayer(1).oracleDice.length, 3);

  // Player 1 should be current player initially
  assertEquals(
    initialState.getCurrentPlayerIndex(),
    0,
    'Player 1 should be current player initially',
  );

  initialState.getPlayer(0).oracleDice = [];

  // End Player 1's turn
  engine.endTurn();

  const stateAfterEndTurn = engine.getGameState();

  // Player 2 should now be current player
  assertEquals(
    stateAfterEndTurn.getCurrentPlayerIndex(),
    1,
    'Player 2 should be current player after endTurn',
  );

  // Game should still be in action phase
  assertEquals(
    stateAfterEndTurn.getPhase(),
    'action',
    'Game should remain in action phase after endTurn',
  );

  // Player 1 should have new dice rolled
  assert(stateAfterEndTurn.getPlayer(0));
  assertEquals(stateAfterEndTurn.getPlayer(0).oracleDice.length, 3);
});

Deno.test('DiceRolling - recoloring intentions cleared at end of turn', () => {
  const engine = new GameManager();

  const player1 = engine.getCurrentPlayer();
  assertExists(player1);

  const success = engine.setSelectedRecoloring(1);
  assert(success, 'Should be able to set recoloring intention');

  // Verify recoloring intention was set
  assertEquals(engine.getSelectedRecoloring(), 1);

  // End Player 1's turn
  const result = engine.endTurn();
  assert(result.success, result.message);

  assertEquals(
    engine.getSelectedRecoloring(),
    0,
    "Player 1's recoloring intentions should be cleared at end of turn",
  );
});

Deno.test('DiceRolling - round advances when all players have taken turns', () => {
  const engine = new GameManager();

  const initialState = engine.getGameState();
  assertEquals(initialState.getRound(), 1, 'Game should start at round 1');

  // End Player 1's turn (Player 2 becomes current)
  engine.endTurn();
  const stateAfterPlayer1Turn = engine.getGameState();
  assertEquals(
    stateAfterPlayer1Turn.getRound(),
    1,
    'Round should still be 1 after first endTurn',
  );

  // End Player 2's turn (Player 1 becomes current again)
  engine.endTurn();
  const stateAfterPlayer2Turn = engine.getGameState();
  assertEquals(
    stateAfterPlayer2Turn.getRound(),
    2,
    'Round should advance to 2 after all players have taken turns',
  );

  // Current player should be back to Player 1
  assertEquals(
    stateAfterPlayer2Turn.getCurrentPlayerIndex(),
    0,
    'Current player should be Player 1 after full round',
  );
});

Deno.test('DiceRolling - dice are valid colors after rolling', () => {
  const engine = new GameManager();

  const state = engine.getGameState();
  const validColors: HexColor[] = [
    'red',
    'pink',
    'blue',
    'black',
    'green',
    'yellow',
  ];

  for (let playerId = 0; playerId < state.getPlayerCount(); ++playerId) {
    const player = state.getPlayer(playerId);
    player.oracleDice.forEach((dieColor, dieIndex) => {
      assert(
        validColors.includes(dieColor),
        `Player ${
          playerId + 1
        } die ${dieIndex} should be valid color, got ${dieColor}`,
      );
    });
  }

  // End a few turns and verify dice remain valid
  for (let i = 0; i < 3; i++) {
    engine.endTurn();
    const newState = engine.getGameState();

    for (let playerId = 0; playerId < newState.getPlayerCount(); ++playerId) {
      const player = newState.getPlayer(playerId);
      player.oracleDice.forEach((dieColor, dieIndex) => {
        assert(
          validColors.includes(dieColor),
          `Player ${
            playerId + 1
          } die ${dieIndex} should be valid color after endTurn, got ${dieColor}`,
        );
      });
    }
  }
});

Deno.test('DiceRolling - next player always has dice ready', () => {
  const engine = new GameManager();

  // Simulate multiple turns and verify next player always has dice
  for (let turn = 0; turn < 5; turn++) {
    const currentState = engine.getGameState();
    const currentPlayer = currentState.getCurrentPlayer();

    // Current player should have dice
    assertEquals(
      currentPlayer!.oracleDice.length,
      3,
      `Current player should have 3 dice at turn ${turn}`,
    );

    // End turn
    engine.endTurn();

    const nextState = engine.getGameState();
    const nextPlayer = nextState.getCurrentPlayer();

    // Next player should have dice ready
    assertEquals(
      nextPlayer!.oracleDice.length,
      3,
      `Next player should have 3 dice ready at turn ${turn}`,
    );
  }
});
