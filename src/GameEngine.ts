import type { Action } from './actions.ts';
import { GameEngineAnyResource } from './GameEngineAnyResource.ts';
import { GameEngineFree } from './GameEngineFree.ts';
import { GameEngineHex } from './GameEngineHex.ts';
import { GameEngineMove } from './GameEngineMove.ts';
import type { GameState } from './GameState.ts';
import type { Player } from './Player.ts';
import type { Resource } from './Resource.ts';
import {
  Failure,
  type ResultWithMessage,
  Success,
} from './ResultWithMessage.ts';
import type { CoreColor, Item } from './types.ts';

export class GameEngine {
  public static getAvailableActions(
    gameState: GameState,
  ): Action[] {
    const actions: Action[] = [];
    actions.push(...GameEngineFree.getFreeActions(gameState));
    actions.push(...GameEngineAnyResource.getAnyResourceActions(gameState));
    actions.push(...GameEngineHex.getHexActions(gameState));
    actions.push(...GameEngineMove.getMoveActions(gameState));
    return actions;
  }

  public static doAction(
    action: Action,
    gameState: GameState,
  ): ResultWithMessage {
    switch (action.type) {
      case 'anyResource':
        return GameEngineAnyResource.doAction(action, gameState);
      case 'free':
        return GameEngineFree.doAction(action, gameState);
      case 'hex':
        return GameEngineHex.doAction(action, gameState);
      case 'move':
        return GameEngineMove.doAction(action, gameState);
    }

    return new Failure(
      `GameEngine.doAction(${JSON.stringify(action)} not implemented yet)`,
    );
  }

  ////////////////////////////////////////////////////////////////////////
  // helpers
  public static spendResource(
    gameState: GameState,
    resource: Resource,
  ): ResultWithMessage {
    const player = gameState.getCurrentPlayer();

    if (!resource.hasColor()) {
      return new Failure('Nothing selected to spend');
    }

    player.favor -= resource.getRecolorCost();

    const array = resource.isDie()
      ? player.oracleDice
      : resource.isCard()
      ? player.oracleCards
      : null;
    if (array) {
      const at = array.indexOf(resource.getBaseColor());
      if (at >= 0) {
        array.splice(at, 1);
      }
    }

    if (resource.isCard()) {
      player.usedOracleCardThisTurn = true;
    }

    return new Success(`Resource ${JSON.stringify(resource)} was spent`);
  }

  public static updateWildQuestIfNecessary(player: Player, item: Item): void {
    switch (item.type) {
      case 'cube':
        GameEngine.updateWildTempleQuestIfNecessary(player, item.color);
        return;
      default:
        return;
    }
  }

  private static updateWildTempleQuestIfNecessary(
    player: Player,
    color: CoreColor,
  ): void {
    const templeQuests = player.getQuestsOfType('temple');
    if (
      templeQuests.find((quest) => {
        return quest.color === color;
      })
    ) {
      return;
    }

    const wildQuest = templeQuests.find((quest) => {
      return quest.color === 'none';
    });
    if (wildQuest) {
      wildQuest.color = color;
    }
  }
}
