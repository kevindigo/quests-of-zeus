import type { Action } from './actions.ts';
import { GameEngineAnyResource } from './GameEngineAnyResource.ts';
import { GameEngineFree } from './GameEngineFree.ts';
import { GameEngineHex } from './GameEngineHex.ts';
import type { GameState } from './GameState.ts';
import {
  Failure,
  type ResultWithMessage,
  Success,
} from './ResultWithMessage.ts';
import type { UiState } from './UiState.ts';

export class GameEngine {
  public static getAvailableActions(
    gameState: GameState,
  ): Action[] {
    const actions: Action[] = [];
    actions.push(...GameEngineFree.getFreeActions(gameState));
    actions.push(...GameEngineAnyResource.getAnyResourceActions(gameState));
    actions.push(...GameEngineHex.getHexActions(gameState));
    return actions;
  }

  public static doAction(
    action: Action,
    gameState: GameState,
    uiState: UiState,
  ): ResultWithMessage {
    switch (action.type) {
      case 'anyResource':
        return GameEngineAnyResource.doAction(action, gameState, uiState);
      case 'free':
        return GameEngineFree.doAction(action, gameState, uiState);
      case 'hex':
        return GameEngineHex.doAction(action, gameState, uiState);
    }

    return new Failure(
      `GameEngine.doAction(${JSON.stringify(action)} not implemented yet)`,
    );
  }

  ////////////////////////////////////////////////////////////////////////
  // helpers
  public static spendResource(
    gameState: GameState,
    uiState: UiState,
  ): ResultWithMessage {
    const player = gameState.getCurrentPlayer();
    const resource = uiState.getSelectedResource();

    if (!resource.hasColor()) {
      return new Failure('Nothing selected to spend');
    }

    if (uiState.getSelectedRecoloring() > 0) {
      return new Failure('Must recolor before spending a resource');
    }

    const array = resource.isDie()
      ? player.oracleDice
      : resource.isCard()
      ? player.oracleCards
      : null;
    if (array) {
      const at = array.indexOf(resource.getBaseColor());
      if (at >= 0) {
        array.splice(at, 1);
      }
    }

    if (resource.isCard()) {
      player.usedOracleCardThisTurn = true;
    }

    uiState.clearResourceSelection();
    return new Success(`Resource ${JSON.stringify(resource)} was spent`);
  }
}
