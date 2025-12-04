import {
  type Action,
  Actions,
  type ResourceAction,
  type ResourceGainFavorAction,
  type ResourceGainOracleCardAction,
  type ResourceGainTwoPeeks,
} from './actions.ts';
import { GameEngine } from './GameEngine.ts';
import type { GameState } from './GameState.ts';
import { PhasePeeking } from './phases.ts';
import {
  Failure,
  type ResultWithMessage,
  Success,
} from './ResultWithMessage.ts';
import type { ShrineHex } from './types.ts';

export class GameEngineResource {
  public static getResourceActions(gameState: GameState): Action[] {
    if (gameState.getPhase().getName() !== 'main') {
      return [];
    }

    const hiddenShrineHexes = this.getHiddenShrineHexes(gameState);

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

      if (hiddenShrineHexes.length > 0) {
        const gainTwoPeeksAction: ResourceGainTwoPeeks = {
          type: 'resource',
          subType: 'gainTwoPeeks',
          spend: resource,
        };
        actionsForThisResource.push(gainTwoPeeksAction);
      }

      return actionsForThisResource;
    });

    return actions;
  }

  public static doAction(
    action: ResourceAction,
    gameState: GameState,
  ): ResultWithMessage {
    switch (action.subType) {
      case 'gainFavor':
        return GameEngineResource.spendResourceForFavor(gameState, action);
      case 'gainOracleCard':
        return GameEngineResource.spendResourceForOracleCard(
          gameState,
          action,
        );
      case 'gainTwoPeeks':
        return GameEngineResource.spendResourceForPeeks(gameState, action);
    }
  }

  public static spendResourceForFavor(
    gameState: GameState,
    action: ResourceAction,
  ): ResultWithMessage {
    this.removeColoringFrom(action);

    const availableActions = this.getResourceActions(gameState);
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

    const availableActions = this.getResourceActions(gameState);
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

  public static spendResourceForPeeks(
    gameState: GameState,
    action: ResourceAction,
  ): ResultWithMessage {
    this.removeColoringFrom(action);

    const availableActions = this.getResourceActions(gameState);
    const found = Actions.find(availableActions, action);
    if (!found) {
      return new Failure('Action not available');
    }

    const hiddenShrineHexes = this.getHiddenShrineHexes(gameState);
    const count = Math.min(hiddenShrineHexes.length, 2);
    for (let i = 0; i < count; ++i) {
      gameState.queuePhase(PhasePeeking.phaseName);
    }

    GameEngine.spendResource(gameState, action.spend);
    gameState.endPhase();
    return new Success(`Granted ${count} peeks`);
  }

  private static removeColoringFrom(action: ResourceAction): void {
    action.spend = action.spend.withoutRecoloring();
  }

  private static getHiddenShrineHexes(gameState: GameState): ShrineHex[] {
    const hiddenShrineHexes = gameState.getShrineHexes().filter((hex) => {
      return hex.status === 'hidden';
    });

    return hiddenShrineHexes;
  }
}
