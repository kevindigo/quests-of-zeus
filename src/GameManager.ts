// Quests of Zeus Game Engine - Core Orchestration
// High-level game management and orchestration

import { GameState } from './GameState.ts';
import { GameStateInitializer } from './GameStateInitializer.ts';
import type { HexCell } from './hexmap/HexCell.ts';
import type { HexCoordinates } from './hexmap/HexGrid.ts';
import { MovementSystem } from './MovementSystem.ts';
import { OracleSystem } from './OracleSystem.ts';
import type { Player } from './Player.ts';
import {
  Failure,
  type ResultWithMessage,
  Success,
} from './ResultWithMessage.ts';
import { ShipMoveHandler } from './ShipMoveHandler.ts';
import type {
  CityHex,
  CoreColor,
  CubeHex,
  Item,
  MonsterHex,
  MoveShipResult,
  Resource,
  ShrineHex,
} from './types.ts';
import { type UiState, UiStateClass } from './UiState.ts';

export class GameManager {
  constructor() {
    this.state = new GameState();
    this.uiState = new UiStateClass();
    this.startNewGame();
  }

  public startNewGame(): void {
    new GameStateInitializer().initializeGameState(this.state);
    this.uiState.reset();
  }

  public moveShip(
    favorSpentToRecolor: number,
    favorSpentForRange: number,
  ): MoveShipResult {
    const movementSystem = new MovementSystem(this.getGameState().getMap());
    const handler = new ShipMoveHandler(
      this.getGameState(),
      this.getUiState(),
      movementSystem,
    );
    return handler.attemptMoveShip(
      favorSpentToRecolor,
      favorSpentForRange,
    );
  }

  public getGameStateSnapshot(): GameState {
    return GameState.fromSnapshot(
      JSON.parse(JSON.stringify(this.state.toSnapshot())),
    );
  }

  public getGameState(): GameState {
    return this.state;
  }

  public getCurrentPlayer(): Player {
    return this.state.getCurrentPlayer();
  }

  public getPlayer(playerId: number): Player {
    return this.state.getPlayer(playerId);
  }

  public getUiState(): UiState {
    return this.uiState;
  }

  public getCityHexes(): CityHex[] {
    return this.state.getCityHexes();
  }

  public getCubeHexes(): CubeHex[] {
    return this.state.getCubeHexes();
  }

  public getMonsterHexes(): MonsterHex[] {
    return this.state.getMonsterHexes();
  }

  public getAvailableLandInteractions(): HexCell[] {
    const player = this.getCurrentPlayer();
    const shipPosition = player.getShipPosition();
    const state = this.getGameState();
    const color = this.getEffectiveSelectedColor();
    if (!color) {
      return [];
    }

    const map = state.getMap();
    const neighbors = map.getNeighbors(shipPosition);

    const availables = neighbors.filter((cell) => {
      switch (cell.terrain) {
        case 'shrine':
          return this.isShrineAvailable(cell);
        case 'offerings':
          return this.isOfferingAvailable(cell, color);
        case 'temple':
          return this.isTempleAvailable(cell, color);
        default:
          return false;
      }
    });

    return availables;
  }

  private isShrineAvailable(cell: HexCell): boolean {
    const effectiveColor = this.getEffectiveSelectedColor();
    if (cell.color !== effectiveColor) {
      return false;
    }

    const shrineHex = this.getGameState().findShrineHexAt(
      cell.getCoordinates(),
    );
    if (shrineHex?.status === 'hidden') {
      return true;
    }

    const player = this.getCurrentPlayer();
    if (shrineHex?.status === 'visible' && shrineHex.owner === player.color) {
      return true;
    }

    return false;
  }

  public activateShrine(
    coordinates: HexCoordinates,
  ): ResultWithMessage {
    const effectiveColor = this.getEffectiveSelectedColor();
    if (!effectiveColor) {
      return new Failure('Must select a die or card');
    }

    const allLand = this.getAvailableLandInteractions();
    const shrineCell = allLand.find((cell) => {
      return cell.q === coordinates.q && cell.r === coordinates.r;
    });
    if (!shrineCell) {
      return new Failure('That shrine is not available');
    }
    const shrineHex = this.getGameState().findShrineHexAt(coordinates);
    if (!shrineHex) {
      return new Failure(
        'Impossible: ShrineHex not found at those coordinates',
      );
    }

    const player = this.getCurrentPlayer();
    if (shrineHex.status === 'hidden') {
      if (shrineHex.owner === player.color) {
        return this.completeShrineQuest(shrineHex);
      }

      shrineHex.status = 'visible';
      return this.flipShrine(player, shrineHex);
    }

    if (shrineHex.status == 'visible' && shrineHex.owner == player.color) {
      return this.completeShrineQuest(shrineHex);
    }

    return new Failure('activateShrine not implemented yet');
  }

  private completeShrineQuest(
    shrineHex: ShrineHex,
  ): ResultWithMessage {
    const player = this.getCurrentPlayer();
    if (shrineHex.owner !== player.color) {
      return new Failure('Impossible: wrong owner');
    }

    if (shrineHex.status === 'filled') {
      return new Failure('Impossible: already completed');
    }

    const quests = player.getQuests();
    const quest = quests.find((quest) => {
      return quest.type === 'shrine' &&
        quest.playerId === player.id &&
        !quest.isCompleted;
    });
    if (!quest) {
      return new Success('Impossible: no remaining incomplete shrine quests');
    }
    this.spendColorSpecificDieOrCard();
    shrineHex.status = 'filled';
    quest.isCompleted = true;
    return new Success('Built shrine - QUEST REWARD NOT GRANTED!');
  }

  private flipShrine(player: Player, shrineHex: ShrineHex): ResultWithMessage {
    let message: string | undefined = undefined;
    switch (shrineHex.reward) {
      case 'favor':
        player.favor += 4;
        message = 'Discovered shrine; gained favor';
        break;
      case 'card': {
        const oracleSystem = new OracleSystem(this.getGameState());
        const card = oracleSystem.takeOracleCardFromDeck();
        if (card) {
          player.oracleCards.push(card);
          message = 'Discovered shrine; gained oracle card';
        } else {
          message = 'Discovered shrine; no oracle cards available';
        }
        break;
      }
      default:
        return new Failure(
          `Shrine reward ${shrineHex.reward} not implemented yet`,
        );
    }

    this.spendColorSpecificDieOrCard();
    return new Success(message ?? 'flipped but no reward granted');
  }

  private isOfferingAvailable(
    cell: HexCell,
    effectiveColor: CoreColor,
  ): boolean {
    const cubeHexes = this.getGameState().getCubeHexes();
    const cubeHex = cubeHexes.find((hex) => {
      return hex.q === cell.q && hex.r === cell.r;
    });
    if (!cubeHex) {
      console.error(`No cube hex for ${JSON.stringify(cell)}`);
      return false;
    }

    if (cubeHex.cubeColors.indexOf(effectiveColor) < 0) {
      return false;
    }

    const thisCube: Item = { type: 'cube', color: effectiveColor };
    const player = this.getCurrentPlayer();
    const validation = player.validateItemIsLoadable(thisCube);
    if (!validation.success) {
      return false;
    }

    return true;
  }

  public activateOffering(coordinates: HexCoordinates): ResultWithMessage {
    const state = this.getGameState();
    const cubeHex = state.getCubeHexes().find((hex) => {
      return hex.q === coordinates.q && hex.r === coordinates.r;
    });
    if (!cubeHex) {
      return new Failure(
        `Impossible: ${JSON.stringify(coordinates)} is not an offering`,
      );
    }
    const effectiveColor = this.getEffectiveSelectedColor();
    if (!effectiveColor) {
      return new Failure('Impossible: No resource was selected');
    }
    const item: Item = { type: 'cube', color: effectiveColor };
    const result = this.loadItem(item);
    if (!result.success) {
      return result;
    }

    const removalResult = cubeHex.remove(effectiveColor);
    if (!removalResult.success) {
      return removalResult;
    }
    this.spendColorSpecificDieOrCard();

    return new Success(`Loaded ${effectiveColor} cube`);
  }

  public validateItemIsLoadable(item: Item): ResultWithMessage {
    const player = this.getCurrentPlayer();
    if (!this.isNeededForQuest(item)) {
      return new Failure(`No unfinished quest needs ${JSON.stringify(item)}`);
    }
    const validation = player.validateItemIsLoadable(item);
    if (!validation.success) {
      return validation;
    }
    return new Success('OK to load');
  }

  public loadItem(item: Item): ResultWithMessage {
    const validation = this.validateItemIsLoadable(item);
    if (!validation.success) {
      return validation;
    }

    const player = this.getCurrentPlayer();
    player.loadItem(item);
    this.updateWildQuestIfNecessary(item);
    return new Success(`Loaded item ${item}`);
  }

  private isTempleAvailable(cell: HexCell, color: CoreColor): boolean {
    if (cell.color !== color) {
      return false;
    }

    const player = this.getCurrentPlayer();
    const cube: Item = { type: 'cube', color };
    if (!player.isItemLoaded(cube)) {
      return false;
    }

    return true;
  }

  public activateTemple(_coordinates: HexCoordinates): ResultWithMessage {
    const color = this.getEffectiveSelectedColor();
    if (!color) {
      return new Failure('No resource selected');
    }

    const cube: Item = { type: 'cube', color: color };
    const player = this.getCurrentPlayer();
    const unloaded = player.unloadItem(cube);
    if (!unloaded.success) {
      return unloaded;
    }

    const quest = player.getQuestsOfType('temple').find((quest) => {
      return quest.color === color;
    });
    if (!quest) {
      return new Failure(`Impossible: no ${color} temple quest`);
    }
    quest.isCompleted = true;

    this.spendColorSpecificDieOrCard();

    player.favor += 3;

    return new Success(
      `Delivered ${color} offering to temple and gained 3 favor`,
    );
  }

  public spendColorSpecificDieOrCard(): void {
    const player = this.getCurrentPlayer();
    const favorSpentToRecolor = this.getUiState().getSelectedRecoloring();
    player.favor -= favorSpentToRecolor;
    this.spendDieOrCard();
  }

  public spendDieOrCard(): void {
    const player = this.getCurrentPlayer();
    const resource = this.getSelectedResource();

    if (!resource.hasColor()) {
      return;
    }

    this.clearResourceSelection();

    const array = resource.isDie()
      ? player.oracleDice
      : resource.isCard()
      ? player.oracleCards
      : null;
    if (array) {
      const at = array.indexOf(resource.getColor());
      if (at >= 0) {
        array.splice(at, 1);
      }
    }

    if (resource.isCard()) {
      player.usedOracleCardThisTurn = true;
    }
  }

  public clearSelectedRecoloring(): void {
    this.uiState.clearSelectedRecoloring();
  }

  public getSelectedResource(): Resource {
    return this.uiState.getSelectedResource();
  }

  public setSelectedDieColor(color: CoreColor): void {
    return this.uiState.setSelectedDieColor(color);
  }

  public setSelectedOracleCardColor(color: CoreColor): void {
    this.uiState.setSelectedOracleCardColor(color);
  }

  public getEffectiveSelectedColor(): CoreColor | null {
    return this.uiState.getEffectiveSelectedColor();
  }

  public clearResourceSelection(): void {
    return this.uiState.clearResourceSelection();
  }

  private isNeededForQuest(item: Item): boolean {
    switch (item.type) {
      case 'cube':
        return this.isNeededForTempleQuest(item.color);
      case 'statue':
        return !this.hasStatueAlreadyBeenRaised(item.color);
      default:
        return false;
    }
  }

  private isNeededForTempleQuest(color: CoreColor): boolean {
    const player = this.getCurrentPlayer();
    const templeQuests = player.getQuestsOfType('temple');
    const availableTempleQuests = templeQuests.filter((quest) => {
      return !quest.isCompleted;
    });
    const matchingColorQuests = availableTempleQuests.find((quest) => {
      return quest.color === color || quest.color === 'none';
    });
    return (matchingColorQuests ? true : false);
  }

  private hasStatueAlreadyBeenRaised(_color: CoreColor): boolean {
    return true;
  }

  private updateWildQuestIfNecessary(item: Item): void {
    switch (item.type) {
      case 'cube':
        this.updateWildTempleQuestIfNecessary(item.color);
        return;
      default:
        return;
    }
  }

  private updateWildTempleQuestIfNecessary(color: CoreColor): void {
    const player = this.getCurrentPlayer();

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

  private state: GameState;
  private uiState: UiState;
}
