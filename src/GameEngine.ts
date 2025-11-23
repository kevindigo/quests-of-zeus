import type { GameState } from './GameState.ts';
import {
  Failure,
  type ResultWithMessage,
  Success,
} from './ResultWithMessage.ts';
import type { UiState } from './UiState.ts';

export class GameEngine {
  public spendResourceForFavor(
    gameState: GameState,
    uiState: UiState,
  ): ResultWithMessage {
    const phase = gameState.getPhase();
    if (phase !== 'action') {
      return new Failure(`Cannot buy favor during the ${phase} phase`);
    }

    const effectiveColor = uiState.getEffectiveSelectedColor();
    if (!effectiveColor) {
      return new Failure('Must select a die or card to gain favor');
    }

    const resource = uiState.getSelectedResource();
    const player = gameState.getCurrentPlayer();
    if (resource.isCard() && player.usedOracleCardThisTurn) {
      return new Failure(`Cannot use a second oracle card this turn`);
    }

    this.spendDieOrCard(gameState, uiState);
    player.favor += 2;

    return new Success(`Resource spent (${effectiveColor}); favor gained`);
  }

  public spendResourceForOracleCard(
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

    this.spendDieOrCard(gameState, uiState);
    return new Success(`Drew ${card} by spending ${color}`);
  }

  private spendDieOrCard(gameState: GameState, uiState: UiState): void {
    const player = gameState.getCurrentPlayer();
    const resource = uiState.getSelectedResource();

    if (!resource.hasColor()) {
      return;
    }

    uiState.clearResourceSelection();

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
  }
}
