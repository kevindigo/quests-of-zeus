import type {
  Action,
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
import { type CoreColor, Resource } from './types.ts';
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
    const phase = gameState.getPhase();
    if (phase !== 'action') {
      return new Failure(`Cannot buy favor during the ${phase} phase`);
    }

    const resource = uiState.getSelectedResource();
    if (!resource.hasColor()) {
      return new Failure('Must select a die or card to gain favor');
    }

    const player = gameState.getCurrentPlayer();
    if (resource.isCard() && player.usedOracleCardThisTurn) {
      return new Failure(`Cannot use a second oracle card this turn`);
    }

    uiState.clearSelectedRecoloring();

    const result = GameEngine.spendResource(gameState, uiState);
    if (!result.success) {
      return result;
    }
    uiState.clearResourceSelection();

    player.favor += 2;
    return new Success(`Resource spent (${resource.getColor()}); favor gained`);
  }

  public static spendResourceForOracleCard(
    gameState: GameState,
    uiState: UiState,
  ): ResultWithMessage {
    const phase = gameState.getPhase();
    if (phase !== 'action') {
      return new Failure(`Cannot buy oracle card during the ${phase} phase`);
    }

    const resource = uiState.getSelectedResource();
    if (!resource.hasColor()) {
      return new Failure('Must select a die or card to gain favor');
    }

    const deck = gameState.getOracleCardDeck();
    if (deck.length === 0) {
      return new Failure('Oracle card deck is empty when trying to draw card');
    }

    const player = gameState.getCurrentPlayer();
    if (resource.isCard() && player.usedOracleCardThisTurn) {
      return new Failure('Not allows to spend more than one card per turn');
    }

    const color = resource.getColor();

    if (resource.isDie() && !player.oracleDice.includes(color)) {
      return new Failure(`Die ${color} not available`);
    }

    if (resource.isCard() && !player.oracleCards.includes(color)) {
      return new Failure(`Card ${color} not available`);
    }

    const card = deck.pop();
    if (!card) {
      return new Failure(
        'Oracle card deck was empty',
      );
    }

    player.oracleCards.push(card);

    GameEngine.spendResource(gameState, uiState);
    return new Success(`Drew ${card} by spending ${color}`);
  }
}
