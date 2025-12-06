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
  Result,
  type ResultWithMessage,
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

    return Failure.create(
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
      return Failure.create('End turn not available');
    }

    const previousPlayer = gameState.getCurrentPlayer();
    if (!previousPlayer) {
      return Failure.create('There was no current player');
    }

    const result = new Result(
      true,
      `Player ${previousPlayer.color} turn ended`,
    );
    previousPlayer.usedOracleCardThisTurn = false;
    previousPlayer.oracleDice = GameEngine.rollPlayerDice();
    result.addMessage(
      `Player ${previousPlayer.color} rolled ${
        previousPlayer.oracleDice.join(',')
      }`,
    );
    this.addFreeloadingOpportunities(gameState, previousPlayer.oracleDice);

    const nextPlayerIndex = (gameState.getCurrentPlayerIndex() + 1) %
      gameState.getPlayerCount();

    gameState.setCurrentPlayerIndex(nextPlayerIndex);
    if (gameState.getCurrentPlayerIndex() === 0) {
      gameState.advanceRound();
    }

    if (nextPlayerIndex === 0) {
      result.addMessages(
        this.rollTitanDieAndApplyWounds(gameState).getMessages(),
      );
    }

    const nextPlayer = gameState.getCurrentPlayer();
    result.addMessage(`Starting turn for player ${nextPlayer.color}`);
    if (nextPlayer.getCurrentFreeloadOpportunities()) {
      gameState.queuePhase(PhaseFreeloading.phaseName);
    }
    gameState.endPhase();

    return result;
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

  private static rollTitanDieAndApplyWounds(
    gameState: GameState,
  ): ResultWithMessage {
    const titanRoll = GameEngine.rollTitanDie();
    const result = new Result(true, `Rolled titan die ${titanRoll}`);
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
        result.addMessage(`Player ${player.color} took wound ${wound}`);
      }
    }
    return result;
  }
}
