import {
  type Action,
  Actions,
  type ResourceAction,
  type ResourceAdvanceGodAction,
  type ResourceGainFavorAction,
  type ResourceGainOracleCardAction,
} from './actions.ts';
import { GameEngine } from './GameEngine.ts';
import type { GameState } from './GameState.ts';
import {
  Failure,
  type ResultWithMessage,
  Success,
} from './ResultWithMessage.ts';

export class GameEngineResource {
  public static getAnyResourceActions(gameState: GameState): Action[] {
    if (gameState.getPhase().getName() !== 'main') {
      return [];
    }

    const player = gameState.getCurrentPlayer();
    const availableResources = player.getAvailableResourcesWithoutRecoloring();

    const actions = availableResources.flatMap((resource) => {
      const gainFavorAction: ResourceGainFavorAction = {
        type: 'resource',
        subType: 'gainFavor',
        spend: resource,
      };
      const actionsForThisResource: Action[] = [gainFavorAction];

      if (gameState.getOracleCardDeck().length > 0) {
        const gainCardAction: ResourceGainOracleCardAction = {
          type: 'resource',
          subType: 'gainOracleCard',
          spend: resource,
        };
        actionsForThisResource.push(gainCardAction);
      }

      return actionsForThisResource;
    });

    player.getAvailableResourcesWithRecoloring().forEach((resource) => {
      const effectiveColor = resource.getEffectiveColor();
      if (effectiveColor) {
        const level = player.getGodLevel(effectiveColor);
        const maxLevel = GameEngine.getMaxGodLevel(gameState);
        if (level < maxLevel) {
          const action: ResourceAdvanceGodAction = {
            type: 'resource',
            subType: 'advanceGod',
            spend: resource,
          };
          actions.push(action);
        }
      }
    });

    return actions;
  }

  public static doAction(
    action: ResourceAction,
    gameState: GameState,
  ): ResultWithMessage {
    switch (action.subType) {
      case 'advanceGod':
        return this.doAdvanceGod(action, gameState);
      case 'gainFavor':
        return GameEngineResource.spendResourceForFavor(gameState, action);
      case 'gainOracleCard':
        return GameEngineResource.spendResourceForOracleCard(
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
    action: ResourceAction,
  ): ResultWithMessage {
    this.removeColoringFrom(action);

    const availableActions = this.getAnyResourceActions(gameState);
    const found = Actions.find(availableActions, action);
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
    action: ResourceAction,
  ): ResultWithMessage {
    this.removeColoringFrom(action);

    const availableActions = this.getAnyResourceActions(gameState);
    const found = Actions.find(availableActions, action);
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

  private static doAdvanceGod(
    action: ResourceAction,
    gameState: GameState,
  ): ResultWithMessage {
    const found = Actions.find(this.getAnyResourceActions(gameState), action);
    if (!found) {
      return new Failure(
        'Advance god not available: ' + JSON.stringify(action),
      );
    }
    const effectiveColor = action.spend.getEffectiveColor();
    if (!effectiveColor) {
      return new Failure('Impossible: No resource selected');
    }
    const player = gameState.getCurrentPlayer();
    player.getGod(effectiveColor).level += 1;

    const spent = GameEngine.spendResource(gameState, action.spend);
    if (!spent.success) {
      return new Failure(
        'Impossible: Unable to spend for action ' + JSON.stringify(action),
      );
    }

    return new Success('Advanced god ' + effectiveColor);
  }

  private static removeColoringFrom(action: ResourceAction): void {
    action.spend = action.spend.withoutRecoloring();
  }
}
