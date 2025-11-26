import type { Action, FreeAction, FreeEndTurnAction } from './actions.ts';
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

  public static doAction(
    action: FreeAction,
    gameState: GameState,
  ): ResultWithMessage {
    switch (action.subType) {
      case 'endTurn':
        return GameEngineFree.endTurn(gameState);
      case 'continueMonsterFight':
        break;
      case 'abandonMonsterFight':
        break;
      case 'skipTurnHeal':
        break;
      case 'useEquipmentExtraDie':
        break;
    }

    return new Failure(
      `Free action ${JSON.stringify(action)} not implemented yet`,
    );
  }

  public static endTurn(
    gameState: GameState,
  ): ResultWithMessage {
    const availableActions = GameEngineFree.getFreeActions(gameState);
    const found = availableActions.find((action) => {
      return action.type === 'free' && action.subType === 'endTurn';
    });
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
    gameState.setPhase('action');
    return new Success(`Player ${currentPlayer.color} turn ended`);
  }
}
