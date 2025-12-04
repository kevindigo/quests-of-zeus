import { type Action, Actions, type AdvanceGodAction } from './actions.ts';
import { GameEngine } from './GameEngine.ts';
import type { GameState } from './GameState.ts';
import { PhaseAdvancingGod } from './phases.ts';
import {
  Failure,
  type ResultWithMessage,
  Success,
} from './ResultWithMessage.ts';

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
    const found = Actions.find(
      GameEngine.getAvailableActions(gameState),
      action,
    );
    if (!found) {
      return new Failure(
        'Advance god not available: ' + JSON.stringify(action),
      );
    }
    const effectiveColor = action.spend.getEffectiveColor();
    if (!effectiveColor) {
      return new Failure('Impossible: No resource selected');
    }
    const player = gameState.getCurrentPlayer();
    player.getGod(effectiveColor).level += 1;

    // FixMe: After advance god has none, this if can go away
    if (gameState.getPhaseName() !== PhaseAdvancingGod.phaseName) {
      const spent = GameEngine.spendResource(gameState, action.spend);
      if (!spent.success) {
        return new Failure(
          'Impossible: Unable to spend for action ' + JSON.stringify(action),
        );
      }
    }

    gameState.endPhase();
    return new Success('Advanced god ' + effectiveColor);
  }
}
