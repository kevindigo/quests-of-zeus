import type { Action } from './actions.ts';
import { GameEngineAdvance } from './GameEngineAdvance.ts';
import { GameEngineColor } from './GameEngineColor.ts';
import { GameEngineFree } from './GameEngineFree.ts';
import { GameEngineHex } from './GameEngineHex.ts';
import { GameEngineMove } from './GameEngineMove.ts';
import { GameEngineResource } from './GameEngineResource.ts';
import type { GameState } from './GameState.ts';
import type { Player } from './Player.ts';
import type { Resource } from './Resource.ts';
import {
  Failure,
  type ResultWithMessage,
  Success,
} from './ResultWithMessage.ts';
import { COLOR_WHEEL, type CoreColor, type Item } from './types.ts';

export class GameEngine {
  public static getAvailableActions(
    gameState: GameState,
  ): Action[] {
    return gameState.getPhase().getAvailableActions(gameState);
  }

  public static doAction(
    action: Action,
    gameState: GameState,
  ): ResultWithMessage {
    switch (action.type) {
      case 'free':
        return GameEngineFree.doAction(action, gameState);
      case 'color':
        return GameEngineColor.doAction(action, gameState);
      case 'resource':
        return GameEngineResource.doAction(action, gameState);
      case 'advance':
        return GameEngineAdvance.doAction(action, gameState);
      case 'hex':
        return GameEngineHex.doAction(action, gameState);
      case 'move':
        return GameEngineMove.doAction(action, gameState);
    }

    return Failure.create(
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
      return Success.create('Nothing spent');
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

    return Success.create(`Resource ${JSON.stringify(resource)} was spent`);
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

  public static getMaxGodLevel(gameState: GameState): number {
    return 2 + gameState.getPlayerCount();
  }

  public static applyRecolor(original: CoreColor, favor: number): CoreColor {
    const originalIndex = COLOR_WHEEL.indexOf(original);
    const newIndex = (originalIndex + favor) % COLOR_WHEEL.length;
    const newColor = COLOR_WHEEL[newIndex];
    if (!newColor) {
      throw new Error(`Unable to recolor ${original} by ${favor}`);
    }
    return newColor;
  }

  public static rollPlayerDice(): CoreColor[] {
    const dice: CoreColor[] = [];
    for (let j = 0; j < 3; j++) {
      const randomColor =
        COLOR_WHEEL[Math.floor(Math.random() * COLOR_WHEEL.length)];
      if (randomColor) {
        dice.push(randomColor);
      }
    }

    return dice;
  }

  public static rollTitanDie(): number {
    return this.titanDieQueue.shift() ?? Math.floor(Math.random() * 6) + 1;
  }

  public static titanDieQueue: number[] = [];
}
