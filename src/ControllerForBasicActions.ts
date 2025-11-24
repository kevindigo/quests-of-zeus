import { GameEngine } from './GameEngine.ts';
import type { GameManager } from './GameManager.ts';
import type { GameState } from './GameState.ts';
import { OracleSystem } from './OracleSystem.ts';
import {
  Failure,
  type ResultWithMessage,
  Success,
} from './ResultWithMessage.ts';
import type { CoreColor } from './types.ts';
import type { UiState } from './UiState.ts';

export class ControllerForBasicActions {
  public constructor(manager: GameManager) {
    this.gameManager = manager;
    this.gameEngine = new GameEngine();
  }

  public spendResourceForFavor(): ResultWithMessage {
    return this.gameEngine.spendResourceForFavor(
      this.getGameState(),
      this.getUiState(),
    );
  }

  public drawOracleCard(): ResultWithMessage {
    return this.gameEngine.spendResourceForOracleCard(
      this.getGameState(),
      this.getUiState(),
    );
  }

  public setRecolorIntention(
    favorCost: number,
    dieColor: CoreColor | null,
    cardColor: CoreColor | null,
  ): ResultWithMessage {
    const selectedColor = dieColor || cardColor;
    if (!selectedColor) {
      return new Failure(
        'Please select a resource (die or oracle card) first!',
      );
    }

    if (favorCost === 0) {
      this.getUiState().clearSelectedRecoloring();

      return new Success('Recoloring intention cleared');
    }

    const playerFavor = this.gameManager.getCurrentPlayer().favor;
    if (favorCost > playerFavor) {
      return new Failure(
        `Cannot spend more favor (${favorCost}) than the player has (${playerFavor})`,
      );
    }

    const success = this.getUiState().setSelectedRecoloring(
      favorCost,
    );

    if (success) {
      const resourceType = dieColor ? 'die' : 'oracle card';
      const newColor = OracleSystem.applyRecolor(selectedColor, favorCost);
      return {
        success,
        message: `${
          resourceType.charAt(0).toUpperCase() + resourceType.slice(1)
        } will be recolored from ${selectedColor} to ${newColor} when used (${favorCost} favor will be spent)`,
      };
    } else {
      return new Failure('Failed to set recoloring intention');
    }
  }

  private getGameState(): GameState {
    return this.gameManager.getGameState();
  }

  private getUiState(): UiState {
    return this.gameManager.getUiState();
  }

  private gameManager: GameManager;
  private gameEngine: GameEngine;
}
