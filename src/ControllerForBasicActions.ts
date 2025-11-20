import type { GameEngine } from './GameEngine.ts';
import { OracleSystem } from './oracle-system.ts';
import type { ControllerActionResult, CoreColor } from './types.ts';

export class ControllerForBasicActions {
  public constructor(engine: GameEngine) {
    this.gameEngine = engine;
  }

  public spendResourceForFavor(): ControllerActionResult {
    const engine = this.gameEngine;
    const phase = engine.getGameState().getPhase();
    if (phase !== 'action') {
      return {
        success: false,
        message: `Cannot buy favor during the ${phase} phase`,
      };
    }

    if (engine.getCurrentPlayer().usedOracleCardThisTurn) {
      return {
        success: false,
        message: `Cannot use a second oracle card this turn`,
      };
    }

    return engine.spendResourceForFavor();
  }

  public drawOracleCard(
    dieColor: CoreColor | null,
    cardColor: CoreColor | null,
  ): ControllerActionResult {
    const phase = this.gameEngine.getGameState().getPhase();
    if (phase !== 'action') {
      return {
        success: false,
        message: `Cannot buy oracle card during the ${phase} phase`,
      };
    }

    const color = dieColor || cardColor;

    if (!color) {
      return {
        success: false,
        message: 'Please select a resource (die or oracle card) first!',
      };
    }

    const engine = this.gameEngine;
    const currentPlayer = engine.getCurrentPlayer();
    const resourceType = dieColor ? 'die' : 'card';
    const fn = dieColor
      ? engine.drawOracleCard.bind(engine)
      : engine.spendOracleCardToDrawCard.bind(engine);

    if (fn(currentPlayer.id, color)) {
      return {
        success: true,
        message: `Spent ${color} ${resourceType} to gain oracle card!`,
      };
    }

    return {
      success: false,
      message: `Cannot spend ${resourceType} for oracle card at this time`,
    };
  }

  public setRecolorIntention(
    favorCost: number,
    dieColor: CoreColor | null,
    cardColor: CoreColor | null,
  ): ControllerActionResult {
    const selectedColor = dieColor || cardColor;
    if (!selectedColor) {
      return {
        success: false,
        message: 'Please select a resource (die or oracle card) first!',
      };
    }

    const state = this.gameEngine.getGameState();
    const playerId = this.gameEngine.getCurrentPlayer().id;
    if (favorCost === 0) {
      state.clearSelectedRecoloring();

      return {
        success: true,
        message: 'Recoloring intention cleared',
      };
    } else {
      const success = state.setSelectedRecoloring(
        playerId,
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
        return {
          success: false,
          message: 'Failed to set recoloring intention',
        };
      }
    }
  }

  private gameEngine: GameEngine;
}
