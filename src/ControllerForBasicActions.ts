import type { QuestsZeusGameEngine } from './game-engine-core.ts';
import type { ControllerActionResult, CoreColor } from './types.ts';

export class ControllerForBasicActions {
  public constructor(engine: QuestsZeusGameEngine) {
    this.gameEngine = engine;
  }

  public spendResourceForFavor(
    dieColor: CoreColor | null,
    cardColor: CoreColor | null,
  ): ControllerActionResult {
    const phase = this.gameEngine.getGameState().getPhase();
    if (phase !== 'action') {
      return {
        success: false,
        message: `Cannot buy favor during the ${phase} phase`,
      };
    }
    const currentPlayer = this.gameEngine.getCurrentPlayer();

    // Check if a die is selected
    if (dieColor) {
      const success = this.gameEngine.spendDieForFavor(
        currentPlayer.id,
        dieColor,
      );
      if (success) {
        return {
          success,
          message: `Spent ${dieColor} die to gain 2 favor!`,
        };
      } else {
        return {
          success: false,
          message: 'Cannot spend die for favor at this time',
        };
      }
    } else if (cardColor) {
      const success = this.gameEngine.spendOracleCardForFavor(
        currentPlayer.id,
        cardColor,
      );
      if (success) {
        return {
          success,
          message: `Spent ${cardColor} oracle card to gain 2 favor!`,
        };
      } else {
        return {
          success: false,
          message: 'Cannot spend oracle card for favor at this time',
        };
      }
    } else {
      return {
        success: false,
        message: 'Please select a resource (die or oracle card) first!',
      };
    }
  }

  private gameEngine: QuestsZeusGameEngine;
}
