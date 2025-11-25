import type {
  Action,
  AnyResourceAction,
  AnyResourceGainFavorAction,
  AnyResourceGainOracleCardAction,
} from './actions.ts';
import { GameEngine } from './GameEngine.ts';
import type { GameState } from './GameState.ts';
import type { Resource } from './Resource.ts';
import {
  Failure,
  type ResultWithMessage,
  Success,
} from './ResultWithMessage.ts';
import type { UiState } from './UiState.ts';

export class GameEngineAnyResource {
  public static getAnyResourceActions(gameState: GameState): Action[] {
    if (gameState.getPhase() !== 'action') {
      return [];
    }

    const availableResources: Resource[] = [];
    const player = gameState.getCurrentPlayer();
    availableResources.push(...player.getResourcesForDice());

    if (!player.usedOracleCardThisTurn) {
      availableResources.push(...player.getResourcesForCards());
    }

    const actions = availableResources.flatMap((resource) => {
      const gainFavorAction: AnyResourceGainFavorAction = {
        type: 'anyResource',
        subType: 'gainFavor',
        spend: resource,
      };
      const actions: Action[] = [gainFavorAction];

      if (gameState.getOracleCardDeck().length > 0) {
        const gainCardAction: AnyResourceGainOracleCardAction = {
          type: 'anyResource',
          subType: 'gainOracleCard',
          spend: resource,
        };
        actions.push(gainCardAction);
      }

      return actions;
    });

    return actions;
  }

  public static doAction(
    action: AnyResourceAction,
    gameState: GameState,
    uiState: UiState,
  ): ResultWithMessage {
    switch (action.subType) {
      case 'gainFavor':
        return GameEngineAnyResource.spendResourceForFavor(gameState, uiState);
      case 'gainOracleCard':
        return GameEngineAnyResource.spendResourceForOracleCard(
          gameState,
          uiState,
        );
      case 'gainPeekCoupons':
        return new Failure(
          'GameEngineAnyResource.gainPeakCoupons not implemented yet',
        );
    }
  }

  public static spendResourceForFavor(
    gameState: GameState,
    uiState: UiState,
  ): ResultWithMessage {
    const requestedSpend = uiState.getSelectedResource();
    const spendWithoutRecoloring = requestedSpend.withoutRecoloring();

    const availableActions = GameEngineAnyResource.getAnyResourceActions(
      gameState,
    );
    const found = availableActions.find((action) => {
      return action.type === 'anyResource' && action.subType === 'gainFavor' &&
        action.spend.equals(spendWithoutRecoloring);
    });
    if (!found) {
      return new Failure('Action not available');
    }

    uiState.setSelectedResource(spendWithoutRecoloring);
    const result = GameEngine.spendResource(gameState, uiState);
    if (!result.success) {
      return result;
    }

    const player = gameState.getCurrentPlayer();
    player.favor += 2;
    return new Success(
      `Resource spent (${spendWithoutRecoloring.getBaseColor()}); favor gained`,
    );
  }

  public static spendResourceForOracleCard(
    gameState: GameState,
    uiState: UiState,
  ): ResultWithMessage {
    const requestedSpend = uiState.getSelectedResource();
    const spendWithoutRecoloring = requestedSpend.withoutRecoloring();

    const availableActions = GameEngineAnyResource.getAnyResourceActions(
      gameState,
    );
    const found = availableActions.find((action) => {
      return action.type === 'anyResource' &&
        action.subType === 'gainOracleCard' &&
        action.spend.equals(spendWithoutRecoloring);
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

    uiState.setSelectedResource(spendWithoutRecoloring);
    const result = GameEngine.spendResource(gameState, uiState);
    if (!result.success) {
      return result;
    }
    player.oracleCards.push(card);

    return new Success(
      `Spent ${spendWithoutRecoloring.getBaseColor()} to gain ${card} card`,
    );
  }
}
