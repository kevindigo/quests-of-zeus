import type { GameState } from './GameState.ts';
import { type ResultWithMessage, Success } from './ResultWithMessage.ts';
import { COLOR_WHEEL, type CoreColor } from './types.ts';
import type { UiState } from './UiState.ts';

export class GameEngineFree {
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
      uiState.clearSelectedRecoloring();
    }

    const nextPlayerIndex = (gameState.getCurrentPlayerIndex() + 1) %
      gameState.getPlayerCount();

    gameState.setCurrentPlayerIndex(nextPlayerIndex);
    if (gameState.getCurrentPlayerIndex() === 0) {
      gameState.advanceRound();
    }
    gameState.setPhase('action');
    return new Success(`Player ${currentPlayer.color} turn ended`);
  }
}
