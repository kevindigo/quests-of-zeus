import type { Action, FreeEndTurnAction } from './actions.ts';
import type { GameState } from './GameState.ts';
import { type ResultWithMessage, Success } from './ResultWithMessage.ts';
import { COLOR_WHEEL, type CoreColor } from './types.ts';
import type { UiState } from './UiState.ts';

export class GameEngineFree {
  public static getFreeActions(
    gameState: GameState,
  ): Action[] {
    return GameEngineFree.getEndTurnActions(gameState);
  }

  private static getEndTurnActions(
    gameState: GameState,
  ): Action[] {
    if (gameState.getPhase() !== 'action') {
      return [];
    }

    const endTurnAction: FreeEndTurnAction = {
      type: 'free',
      subType: 'endTurn',
    };
    return [endTurnAction];
  }

  public static endTurn(
    gameState: GameState,
    uiState: UiState,
  ): ResultWithMessage {
    const newDice: CoreColor[] = [];
    for (let i = 0; i < 3; i++) {
      const randomColor =
        COLOR_WHEEL[Math.floor(Math.random() * COLOR_WHEEL.length)];
      if (randomColor) {
        newDice.push(randomColor);
      }
    }

    const currentPlayer = gameState.getCurrentPlayer();
    if (currentPlayer) {
      currentPlayer.usedOracleCardThisTurn = false;
      currentPlayer.oracleDice = newDice;
    }

    const nextPlayerIndex = (gameState.getCurrentPlayerIndex() + 1) %
      gameState.getPlayerCount();

    uiState.clearResourceSelection();
    gameState.setCurrentPlayerIndex(nextPlayerIndex);
    if (gameState.getCurrentPlayerIndex() === 0) {
      gameState.advanceRound();
    }
    gameState.setPhase('action');
    return new Success(`Player ${currentPlayer.color} turn ended`);
  }
}
