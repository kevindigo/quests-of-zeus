import {
  type Action,
  Actions,
  type FreeAction,
  type FreeEndTurnAction,
} from './actions.ts';
import type { GameState } from './GameState.ts';
import {
  Failure,
  type ResultWithMessage,
  Success,
} from './ResultWithMessage.ts';
import { COLOR_WHEEL, type CoreColor } from './types.ts';

export class GameEngineFree {
  public static getFreeActions(
    gameState: GameState,
  ): Action[] {
    const actions = [];
    actions.push(...this.getEndTurnActions(gameState));

    return actions;
  }

  private static getEndTurnActions(gameState: GameState): FreeEndTurnAction[] {
    const player = gameState.getCurrentPlayer();
    if (player.oracleDice.length > 0) {
      return [];
    }

    const endTurnAction: FreeEndTurnAction = {
      type: 'free',
      subType: 'endTurn',
    };
    return [endTurnAction];
  }

  public static doAction(
    action: FreeAction,
    gameState: GameState,
  ): ResultWithMessage {
    switch (action.subType) {
      case 'endTurn':
        return GameEngineFree.endTurn(action, gameState);
    }

    return new Failure(
      `Free action ${JSON.stringify(action)} not implemented yet`,
    );
  }

  public static endTurn(
    action: FreeAction,
    gameState: GameState,
  ): ResultWithMessage {
    const availableActions = GameEngineFree.getFreeActions(gameState);
    const found = Actions.find(availableActions, action as Action);
    if (!found) {
      return new Failure('End turn not available');
    }

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

    gameState.setCurrentPlayerIndex(nextPlayerIndex);
    if (gameState.getCurrentPlayerIndex() === 0) {
      gameState.advanceRound();
    }
    gameState.endPhase();
    return new Success(`Player ${currentPlayer.color} turn ended`);
  }
}
