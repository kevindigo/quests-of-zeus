import type { GameManager } from './GameManager.ts';
import { OracleSystem } from './OracleSystem.ts';
import { Resource } from './Resource.ts';
import { Failure, type ResultWithMessage } from './ResultWithMessage.ts';
import type { CoreColor } from './types.ts';
import type { UiState } from './UiState.ts';

export class ControllerForBasicActions {
  public constructor(manager: GameManager) {
    this.gameManager = manager;
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

    const playerFavor = this.gameManager.getCurrentPlayer().favor;
    if (favorCost > playerFavor) {
      return new Failure(
        `Cannot spend more favor (${favorCost}) than the player has (${playerFavor})`,
      );
    }

    const resource = dieColor
      ? Resource.createRecoloredDie(dieColor, favorCost)
      : cardColor
      ? Resource.createRecoloredCard(cardColor, favorCost)
      : Resource.none;
    this.getUiState().setSelectedResource(resource);

    const resourceType = dieColor ? 'die' : 'oracle card';
    const newColor = OracleSystem.applyRecolor(selectedColor, favorCost);
    return {
      success: true,
      message: `${
        resourceType.charAt(0).toUpperCase() + resourceType.slice(1)
      } will be recolored from ${selectedColor} to ${newColor} when used (${favorCost} favor will be spent)`,
    };
  }

  private getUiState(): UiState {
    return this.gameManager.getUiState();
  }

  private gameManager: GameManager;
}
