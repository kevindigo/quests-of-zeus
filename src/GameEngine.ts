import type { Action } from './actions.ts';
import { GameEngineFree } from './GameEngineFree.ts';
import { GameEngineAnyResource } from './GameEngineAnyResource.ts';
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
    return actions;
  }

  ////////////////////////////////////////////////////////////////////////
  //  free actions
  public endTurn(
    gameState: GameState,
    uiState: UiState,
  ): ResultWithMessage {
    return GameEngineFree.endTurn(gameState, uiState);
  }

  ////////////////////////////////////////////////////////////////////////
  // noColor actions
  public spendResourceForFavor(
    gameState: GameState,
    uiState: UiState,
  ): ResultWithMessage {
    return GameEngineAnyResource.spendResourceForFavor(gameState, uiState);
  }

  public spendResourceForOracleCard(
    gameState: GameState,
    uiState: UiState,
  ): ResultWithMessage {
    return GameEngineAnyResource.spendResourceForOracleCard(gameState, uiState);
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
      const at = array.indexOf(resource.getColor());
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
