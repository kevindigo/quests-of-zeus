import type {
  Action,
  AnyResourceGainFavorAction,
  AnyResourceGainOracleCardAction,
} from './actions.ts';
import { GameEngine } from './GameEngine.ts';
import type { GameState } from './GameState.ts';
import { Resource } from './Resource.ts';
import {
  Failure,
  type ResultWithMessage,
  Success,
} from './ResultWithMessage.ts';
import { type CoreColor } from './types.ts';
import type { UiState } from './UiState.ts';

export class GameEngineAnyResource {
  public static getAnyResourceActions(gameState: GameState): Action[] {
    const actions: Action[] = [];
    if (gameState.getPhase() !== 'action') {
      return actions;
    }

    actions.push(...GameEngineAnyResource.getActionsForDice(gameState));
    actions.push(...GameEngineAnyResource.getActionsForCards(gameState));

    return actions;
  }

  private static getActionsForDice(gameState: GameState): Action[] {
    const actions: Action[] = [];
    const diceColors: Set<CoreColor> = new Set();
    const player = gameState.getCurrentPlayer();
    player.oracleDice.forEach((color) => {
      diceColors.add(color);
    });
    const diceResources: Resource[] = [];
    diceColors.forEach((color) => {
      diceResources.push(Resource.createDie(color));
    });
    diceResources.forEach((resource) => {
      const gainFavorAction: AnyResourceGainFavorAction = {
        type: 'anyResource',
        subType: 'gainFavor',
        spend: resource,
      };
      actions.push(gainFavorAction);

      const gainCardAction: AnyResourceGainOracleCardAction = {
        type: 'anyResource',
        subType: 'gainOracleCard',
        spend: resource,
      };
      if (gameState.getOracleCardDeck().length > 0) {
        actions.push(gainCardAction);
      }
    });

    return actions;
  }

  private static getActionsForCards(gameState: GameState): Action[] {
    const actions: Action[] = [];
    const player = gameState.getCurrentPlayer();

    if (player.usedOracleCardThisTurn) {
      return actions;
    }
    const cardColors: Set<CoreColor> = new Set();
    player.oracleCards.forEach((color) => {
      cardColors.add(color);
    });
    const cardResources: Resource[] = [];
    cardColors.forEach((color) => {
      cardResources.push(Resource.createCard(color));
    });
    cardResources.forEach((resource) => {
      const gainFavorAction: AnyResourceGainFavorAction = {
        type: 'anyResource',
        subType: 'gainFavor',
        spend: resource,
      };
      actions.push(gainFavorAction);

      const gainCardAction: AnyResourceGainOracleCardAction = {
        type: 'anyResource',
        subType: 'gainOracleCard',
        spend: resource,
      };
      if (gameState.getOracleCardDeck().length > 0) {
        actions.push(gainCardAction);
      }
    });

    return actions;
  }

  public static spendResourceForFavor(
    gameState: GameState,
    uiState: UiState,
  ): ResultWithMessage {
    const spend = uiState.getSelectedResource();

    const availableActions = GameEngineAnyResource.getAnyResourceActions(
      gameState,
    );
    const found = availableActions.find((action) => {
      return action.type === 'anyResource' && action.subType === 'gainFavor' &&
        action.spend.equals(spend);
    });
    if (!found) {
      return new Failure('End turn not available');
    }

    uiState.clearSelectedRecoloring();

    const result = GameEngine.spendResource(gameState, uiState);
    if (!result.success) {
      return result;
    }

    const player = gameState.getCurrentPlayer();
    player.favor += 2;
    return new Success(
      `Resource spent (${spend.getBaseColor()}); favor gained`,
    );
  }

  public static spendResourceForOracleCard(
    gameState: GameState,
    uiState: UiState,
  ): ResultWithMessage {
    const spend = uiState.getSelectedResource();

    const availableActions = GameEngineAnyResource.getAnyResourceActions(
      gameState,
    );
    const found = availableActions.find((action) => {
      return action.type === 'anyResource' &&
        action.subType === 'gainOracleCard' &&
        action.spend.equals(spend);
    });
    if (!found) {
      return new Failure('End turn not available');
    }

    const player = gameState.getCurrentPlayer();

    const deck = gameState.getOracleCardDeck();
    const card = deck.pop();
    if (!card) {
      return new Failure(
        'Oracle card deck was empty',
      );
    }
    uiState.clearSelectedRecoloring();

    const result = GameEngine.spendResource(gameState, uiState);
    if (!result.success) {
      return result;
    }
    player.oracleCards.push(card);

    return new Success(`Spent ${spend.getBaseColor()} to gain ${card} card`);
  }
}
