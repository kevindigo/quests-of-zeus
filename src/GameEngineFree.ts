import type {
  Action,
  FreeAction,
  FreeActivateGodAction,
  FreeEndTurnAction,
} from './actions.ts';
import { GameEngine } from './GameEngine.ts';
import type { GameState } from './GameState.ts';
import { createPhase } from './phases.ts';
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
    actions.push(...this.getActivateGodActions(gameState));

    return actions;
  }

  private static getEndTurnActions(gameState: GameState): FreeEndTurnAction[] {
    if (gameState.getPhase().getName() !== 'main') {
      return [];
    }

    const endTurnAction: FreeEndTurnAction = {
      type: 'free',
      subType: 'endTurn',
    };
    return [endTurnAction];
  }

  private static getActivateGodActions(
    gameState: GameState,
  ): FreeActivateGodAction[] {
    const actions: FreeActivateGodAction[] = [];

    const maxLevel = GameEngine.getMaxGodLevel(gameState);
    const player = gameState.getCurrentPlayer();
    COLOR_WHEEL.forEach((color) => {
      const level = player.getGodLevel(color);
      if (level >= maxLevel) {
        const action: FreeActivateGodAction = {
          type: 'free',
          subType: 'activateGod',
          godColor: color,
        };
        actions.push(action);
      }
    });
    return actions;
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
    const found = availableActions.find((availableAction) => {
      return GameEngineFree.areEqualFreeActions(
        availableAction,
        action as Action,
      );
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
    gameState.setPhase(createPhase('main'));
    return new Success(`Player ${currentPlayer.color} turn ended`);
  }

  public static areEqualFreeActions(aa: Action, action: Action): boolean {
    return aa.type === 'free' && action.type === 'free' &&
      aa.subType === action.subType;
  }
}
