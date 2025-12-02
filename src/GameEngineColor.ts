import {
  Actions,
  type ColorAction,
  type ColorAdvanceGodAction,
} from './actions.ts';
import { GameEngine } from './GameEngine.ts';
import type { GameState } from './GameState.ts';
import {
  Failure,
  type ResultWithMessage,
  Success,
} from './ResultWithMessage.ts';

export class GameEngineColor {
  public static getColorActions(gameState: GameState): ColorAction[] {
    const actions: ColorAction[] = [];
    const player = gameState.getCurrentPlayer();
    player.getAvailableResourcesWithRecoloring().forEach((resource) => {
      const effectiveColor = resource.getEffectiveColor();
      if (effectiveColor) {
        const level = player.getGodLevel(effectiveColor);
        const maxLevel = GameEngine.getMaxGodLevel(gameState);
        if (level < maxLevel) {
          const action: ColorAdvanceGodAction = {
            type: 'color',
            subType: 'advanceGod',
            spend: resource,
          };
          actions.push(action);
        }
      }
    });
    return actions;
  }

  public static doAction(
    action: ColorAction,
    gameState: GameState,
  ): ResultWithMessage {
    switch (action.subType) {
      case 'advanceGod':
        return this.doAdvanceGod(action, gameState);
      default:
        break;
    }

    return new Failure(
      'Color action not implemented: ' + JSON.stringify(action),
    );
  }

  private static doAdvanceGod(
    action: ColorAction,
    gameState: GameState,
  ): ResultWithMessage {
    const found = Actions.find(this.getColorActions(gameState), action);
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

    const spent = GameEngine.spendResource(gameState, action.spend);
    if (!spent.success) {
      return new Failure(
        'Impossible: Unable to spend for action ' + JSON.stringify(action),
      );
    }

    return new Success('Advanced god ' + effectiveColor);
  }
}
