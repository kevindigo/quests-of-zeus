import {
  type Action,
  Actions,
  type FreeAction,
  type FreeEndTurnAction,
} from './actions.ts';
import { GameEngine } from './GameEngine.ts';
import type { GameState } from './GameState.ts';
import { PhaseFreeloading } from './phases.ts';
import {
  Failure,
  type ResultWithMessage,
  Success,
} from './ResultWithMessage.ts';
import type { CoreColor } from './types.ts';

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
    const availableActions = GameEngine.getAvailableActions(gameState);
    const found = Actions.find(availableActions, action as Action);
    if (!found) {
      return new Failure('End turn not available');
    }

    const currentPlayer = gameState.getCurrentPlayer();
    if (!currentPlayer) {
      return new Failure('There was no current player');
    }

    currentPlayer.usedOracleCardThisTurn = false;
    currentPlayer.oracleDice = GameEngine.rollPlayerDice();
    this.addFreeloadingOpportunities(gameState, currentPlayer.oracleDice);

    const nextPlayerIndex = (gameState.getCurrentPlayerIndex() + 1) %
      gameState.getPlayerCount();

    gameState.setCurrentPlayerIndex(nextPlayerIndex);
    if (gameState.getCurrentPlayerIndex() === 0) {
      gameState.advanceRound();
    }

    if (nextPlayerIndex === 0) {
      this.rollTitanDieAndApplyWounds(gameState);
    }

    if (gameState.getCurrentPlayer().getCurrentFreeloadOpportunities()) {
      gameState.queuePhase(PhaseFreeloading.phaseName);
    }
    gameState.endPhase();

    return new Success(`Player ${currentPlayer.color} turn ended`);
  }

  private static addFreeloadingOpportunities(
    gameState: GameState,
    dice: CoreColor[],
  ): void {
    for (
      let playerIndex = 0;
      playerIndex < gameState.getPlayerCount();
      ++playerIndex
    ) {
      const maxGodLevel = GameEngine.getMaxGodLevel(gameState);

      if (playerIndex !== gameState.getCurrentPlayerIndex()) {
        const player = gameState.getPlayer(playerIndex);
        const diceForThisPlayer = dice.filter((color) => {
          const level = player.getGodLevel(color);
          return level > 0 && level < maxGodLevel;
        });

        if (diceForThisPlayer.length > 0) {
          player.addFreeloadOpportunities(diceForThisPlayer);
        }
      }
    }
  }

  private static rollTitanDieAndApplyWounds(gameState: GameState): void {
    const titanRoll = GameEngine.rollTitanDie();
    for (
      let playerIndex = 0;
      playerIndex < gameState.getPlayerCount();
      ++playerIndex
    ) {
      const player = gameState.getPlayer(playerIndex);
      if (titanRoll >= player.shield) {
        const wound = gameState.drawWound();
        if (!wound) {
          throw new Error('Wound deck is empty');
        }
        player.addWound(wound);
      }
    }
  }
}
