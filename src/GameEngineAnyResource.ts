import type {
  Action,
  AnyResourceAction,
  AnyResourceGainFavorAction,
  AnyResourceGainOracleCardAction,
} from './actions.ts';
import { GameEngine } from './GameEngine.ts';
import type { GameState } from './GameState.ts';
import {
  Failure,
  type ResultWithMessage,
  Success,
} from './ResultWithMessage.ts';

export class GameEngineAnyResource {
  public static getAnyResourceActions(gameState: GameState): Action[] {
    if (gameState.getPhase().getName() !== 'main') {
      return [];
    }

    const player = gameState.getCurrentPlayer();
    const availableResources = player.getAvailableResourcesWithoutRecoloring();

    const actions = availableResources.flatMap((resource) => {
      const gainFavorAction: AnyResourceGainFavorAction = {
        type: 'anyResource',
        subType: 'gainFavor',
        spend: resource,
      };
      const actionsForThisResource: Action[] = [gainFavorAction];

      if (gameState.getOracleCardDeck().length > 0) {
        const gainCardAction: AnyResourceGainOracleCardAction = {
          type: 'anyResource',
          subType: 'gainOracleCard',
          spend: resource,
        };
        actionsForThisResource.push(gainCardAction);
      }

      return actionsForThisResource;
    });

    return actions;
  }

  public static doAction(
    action: AnyResourceAction,
    gameState: GameState,
  ): ResultWithMessage {
    switch (action.subType) {
      case 'gainFavor':
        return GameEngineAnyResource.spendResourceForFavor(gameState, action);
      case 'gainOracleCard':
        return GameEngineAnyResource.spendResourceForOracleCard(
          gameState,
          action,
        );
      case 'gainPeekCoupons':
        return new Failure(
          'GameEngineAnyResource.gainPeakCoupons not implemented yet',
        );
    }
  }

  public static spendResourceForFavor(
    gameState: GameState,
    action: AnyResourceAction,
  ): ResultWithMessage {
    this.removeColoringFrom(action);

    const availableActions = this.getAnyResourceActions(gameState);
    const found = availableActions.find((availableAction) => {
      return this.areEqualAnyResourceActions(availableAction, action);
    });
    if (!found) {
      return new Failure('Action not available');
    }

    const result = GameEngine.spendResource(gameState, action.spend);
    if (!result.success) {
      return result;
    }

    const player = gameState.getCurrentPlayer();
    player.favor += 2;

    return new Success(
      `Resource spent (${action.spend.getBaseColor()}); favor gained`,
    );
  }

  public static spendResourceForOracleCard(
    gameState: GameState,
    action: AnyResourceAction,
  ): ResultWithMessage {
    this.removeColoringFrom(action);

    const availableActions = this.getAnyResourceActions(gameState);
    const found = availableActions.find((availableAction) => {
      return this.areEqualAnyResourceActions(availableAction, action);
    });
    if (!found) {
      return new Failure('Gain oracle card not available');
    }

    const deck = gameState.getOracleCardDeck();
    const card = deck.pop();
    if (!card) {
      return new Failure('Oracle card deck was empty');
    }

    const result = GameEngine.spendResource(gameState, action.spend);
    if (!result.success) {
      return result;
    }

    const player = gameState.getCurrentPlayer();
    player.oracleCards.push(card);

    return new Success(
      `Spent ${action.spend.getBaseColor()} to gain ${card} card`,
    );
  }

  public static areEqualAnyResourceActions(
    aa: Action,
    action: Action,
  ): boolean {
    return aa.type === 'anyResource' && action.type === 'anyResource' &&
      aa.subType === action.subType &&
      aa.spend.equals(action.spend);
  }

  private static removeColoringFrom(action: AnyResourceAction): void {
    action.spend = action.spend.withoutRecoloring();
  }
}
