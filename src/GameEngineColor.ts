import type { Action, ColorAction, ColorActivateGodAction } from './actions.ts';
import { GameEngine } from './GameEngine.ts';
import type { GameState } from './GameState.ts';
import { PhaseExploring, PhaseTeleporting } from './phases.ts';
import {
  Failure,
  type ResultWithMessage,
  Success,
} from './ResultWithMessage.ts';
import { COLOR_WHEEL } from './types.ts';

export class GameEngineColor {
  public static getColorActions(
    gameState: GameState,
  ): Action[] {
    const actions = [];
    actions.push(...this.getActivateGodActions(gameState));

    return actions;
  }

  private static getActivateGodActions(
    gameState: GameState,
  ): ColorActivateGodAction[] {
    const actions: ColorActivateGodAction[] = [];

    const maxLevel = GameEngine.getMaxGodLevel(gameState);
    const player = gameState.getCurrentPlayer();
    COLOR_WHEEL.forEach((color) => {
      const level = player.getGodLevel(color);
      if (level >= maxLevel) {
        const action: ColorActivateGodAction = {
          type: 'color',
          subType: 'activateGod',
          color: color,
        };
        actions.push(action);
      }
    });
    return actions;
  }

  public static doAction(
    action: ColorAction,
    gameState: GameState,
  ): ResultWithMessage {
    switch (action.subType) {
      case 'activateGod':
        return this.doActivateGod(action, gameState);
    }
  }

  private static doActivateGod(
    action: ColorAction,
    gameState: GameState,
  ): ResultWithMessage {
    const color = action.color;
    switch (color) {
      case 'black':
        return new Failure('Activate god not implemented :' + color);
      case 'pink':
        return new Failure('Activate god not implemented :' + color);
      case 'blue':
        return this.doTeleport(gameState);
      case 'yellow':
        return new Failure('Activate god not implemented :' + color);
      case 'green':
        return this.doExplore(gameState);
      case 'red':
        return new Failure('Activate god not implemented :' + color);
    }
  }

  private static doTeleport(gameState: GameState): ResultWithMessage {
    gameState.queuePhase(PhaseTeleporting.phaseName);
    gameState.endPhase();
    return new Success('Switched phase to teleport');
  }

  private static doExplore(gameState: GameState): ResultWithMessage {
    gameState.queuePhase(PhaseExploring.phaseName);
    gameState.endPhase();
    return new Success('Switched phase to explore');
  }
}
