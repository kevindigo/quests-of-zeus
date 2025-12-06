import { type Action, Actions, type AdvanceGodAction } from './actions.ts';
import { GameEngine } from './GameEngine.ts';
import type { GameState } from './GameState.ts';
import { PhaseFreeloading } from './phases.ts';
import { Failure, type ResultWithMessage, Success } from './ResultWithMessage.ts';

export class GameEngineAdvance {
  public static getAdvanceActions(gameState: GameState): Action[] {
    if (gameState.getPhase().getName() !== 'main') {
      return [];
    }
    const actions: Action[] = [];

    const player = gameState.getCurrentPlayer();
    player.getAvailableResourcesWithRecoloring().forEach((resource) => {
      const effectiveColor = resource.getEffectiveColor();
      if (effectiveColor) {
        const level = player.getGodLevel(effectiveColor);
        const maxLevel = GameEngine.getMaxGodLevel(gameState);
        if (level < maxLevel) {
          const action: AdvanceGodAction = {
            type: 'advance',
            godColor: effectiveColor,
            spend: resource,
          };
          actions.push(action);
        }
      }
    });

    return actions;
  }

  public static doAction(
    action: AdvanceGodAction,
    gameState: GameState,
  ): ResultWithMessage {
    const availableActions = GameEngine.getAvailableActions(gameState);
    const found = Actions.find(availableActions, action);
    if (!found) {
      const advanceActions = availableActions.filter(
        (action) => {
          action.type === 'advance';
        },
      );
      return Failure.create(
        `Advance god ${JSON.stringify(action)} not available in ${
          JSON.stringify(advanceActions)
        }`,
      );
    }
    const effectiveColor = action.godColor;
    const player = gameState.getCurrentPlayer();
    player.getGod(effectiveColor).level += 1;

    const spent = GameEngine.spendResource(gameState, action.spend);
    if (!spent.success) {
      return Failure.create(
        'Impossible: Unable to spend for action ' + JSON.stringify(action),
      );
    }

    player.removeCurrentFreeloadOpportunities();
    if (player.getCurrentFreeloadOpportunities()) {
      gameState.queuePhase(PhaseFreeloading.phaseName);
    }

    gameState.endPhase();
    return Success.create('Advanced god ' + effectiveColor);
  }
}
