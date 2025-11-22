import type { GameEngine } from './GameEngine.ts';
import { OracleSystem } from './OracleSystem.ts';
import {
  Failure,
  type ResultWithMessage,
  Success,
} from './ResultWithMessage.ts';
import type { CoreColor } from './types.ts';

export class ControllerForBasicActions {
  public constructor(engine: GameEngine) {
    this.gameEngine = engine;
  }

  public spendResourceForFavor(): ResultWithMessage {
    const engine = this.gameEngine;
    const phase = engine.getGameState().getPhase();
    if (phase !== 'action') {
      return new Failure(`Cannot buy favor during the ${phase} phase`);
    }

    const usingCard = engine.getGameState().getSelectedResource().isCard();
    if (usingCard && engine.getCurrentPlayer().usedOracleCardThisTurn) {
      return new Failure(`Cannot use a second oracle card this turn`);
    }
    return engine.spendResourceForFavor();
  }

  public drawOracleCard(
    dieColor: CoreColor | null,
    cardColor: CoreColor | null,
  ): ResultWithMessage {
    const phase = this.gameEngine.getGameState().getPhase();
    if (phase !== 'action') {
      return new Failure(`Cannot buy oracle card during the ${phase} phase`);
    }

    const color = dieColor || cardColor;

    if (!color) {
      return new Failure(
        'Please select a resource (die or oracle card) first!',
      );
    }

    const engine = this.gameEngine;
    const currentPlayer = engine.getCurrentPlayer();
    const resourceType = dieColor ? 'die' : 'card';
    const fn = dieColor
      ? engine.drawOracleCard.bind(engine)
      : engine.spendOracleCardToDrawCard.bind(engine);

    if (fn(currentPlayer.id, color)) {
      return new Success(`Spent ${color} ${resourceType} to gain oracle card!`);
    }

    return new Failure(
      `Cannot spend ${resourceType} for oracle card at this time`,
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

    const state = this.gameEngine.getGameState();
    const playerId = this.gameEngine.getCurrentPlayer().id;
    if (favorCost === 0) {
      state.clearSelectedRecoloring();

      return new Success('Recoloring intention cleared');
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
        return new Failure('Failed to set recoloring intention');
      }
    }
  }

  private gameEngine: GameEngine;
}
