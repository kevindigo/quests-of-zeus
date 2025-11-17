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
      ? engine.spendDieForFavor.bind(engine)
      : engine.spendOracleCardForFavor.bind(engine);

    if (fn(currentPlayer.id, color)) {
      return {
        success: true,
        message: `Spent ${color} ${resourceType} to gain 2 favor!`,
      };
    }

    return {
      success: false,
      message: `Cannot spend ${resourceType} for favor at this time`,
    };
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

  private gameEngine: QuestsZeusGameEngine;
}
