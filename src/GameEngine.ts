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
    const effectiveColor = uiState.getEffectiveSelectedColor();
    if (!effectiveColor) {
      return new Failure('Must select a die or card to gain favor');
    }

    this.spendDieOrCard(gameState, uiState);
    const player = gameState.getCurrentPlayer();
    player.favor += 2;

    return new Success(`Resource spent (${effectiveColor}); favor gained`);
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
