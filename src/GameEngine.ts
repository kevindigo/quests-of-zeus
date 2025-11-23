// Quests of Zeus Game Engine - Core Orchestration
// High-level game management and orchestration

import { GameInitializer } from './GameInitializer.ts';
import { GameState } from './GameState.ts';
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
  HexColor,
  Item,
  MonsterHex,
  MoveShipResult,
  Resource,
  ShrineHex,
} from './types.ts';
import { COLOR_WHEEL } from './types.ts';
import { type UiState, UiStateClass } from './UiState.ts';

export class GameEngine {
  constructor() {
    this.state = null;
    this.uiState = new UiStateClass();
    this.movementSystem = null;
    this.oracleSystem = null;
    this.shipMoveHandler = null;
    this.gameInitializer = new GameInitializer();
  }

  public initializeGame(): GameState {
    this.state = this.gameInitializer.initializeGame();
    if (!this.state) {
      throw new Error('Initializer failed to create a game state');
    }
    this.movementSystem = new MovementSystem(this.state.map);
    this.oracleSystem = new OracleSystem(
      this.gameInitializer.getOracleCardDeck(),
    );
    this.shipMoveHandler = new ShipMoveHandler(
      this.state,
      this.uiState,
      this.movementSystem,
    );
    return this.state;
  }

  public rollOracleDice(playerId: number): void {
    this.ensureInitialized();
    const player = this.getValidPlayer(playerId);
    const dice: CoreColor[] = [];
    for (let i = 0; i < 3; i++) {
      const randomColor =
        COLOR_WHEEL[Math.floor(Math.random() * COLOR_WHEEL.length)];
      dice.push(randomColor!);
    }

    player.oracleDice = dice;
  }

  public moveShip(
    playerId: number,
    targetQ: number,
    targetR: number,
    selectedResource: Resource,
    favorSpentToRecolor: number,
    favorSpentForRange: number,
  ): MoveShipResult {
    this.ensureInitialized();
    const player = this.getValidPlayer(playerId);
    const destinationCoordinates = { q: targetQ, r: targetR };
    return this.shipMoveHandler!.attemptMoveShip(
      player,
      destinationCoordinates,
      selectedResource,
      favorSpentToRecolor,
      favorSpentForRange,
    );
  }

  public collectOffering(_playerId: number, _color: CoreColor): boolean {
    this.ensureInitialized();
    return false;
  }

  public fightMonster(_playerId: number): boolean {
    this.ensureInitialized();
    return false;
  }

  public buildTemple(_playerId: number): boolean {
    this.ensureInitialized();
    return false;
  }

  public buildStatue(_playerId: number): boolean {
    this.ensureInitialized();
    return false;
  }

  public spendResourceForFavor(): ResultWithMessage {
    this.ensureInitialized();
    const state = this.getGameState();
    const effectiveColor = this.getEffectiveSelectedColor();
    if (!effectiveColor) {
      return new Failure('Must select a die or card to gain favor');
    }

    this.spendDieOrCard();
    const player = state.getCurrentPlayer();
    player.favor += 2;

    return new Success(`Resource spent (${effectiveColor}); favor gained`);
  }

  public spendOracleCardToDrawCard(
    playerId: number,
    cardColor: CoreColor,
  ): boolean {
    this.ensureInitialized();
    const player = this.getValidPlayer(playerId);
    return this.oracleSystem!.spendOracleCardToDrawCard(player, cardColor);
  }

  public drawOracleCard(playerId: number, dieColor: CoreColor): boolean {
    this.ensureInitialized();
    const player = this.getValidPlayer(playerId);
    return this.oracleSystem!.drawOracleCard(player, dieColor);
  }

  public canPlaceStatueOnCity(_playerId: number): boolean {
    this.ensureInitialized();
    return false;
  }

  public endTurn(): void {
    this.ensureInitialized();

    const newDice: CoreColor[] = [];
    for (let i = 0; i < 3; i++) {
      const randomColor =
        COLOR_WHEEL[Math.floor(Math.random() * COLOR_WHEEL.length)];
      if (randomColor) {
        newDice.push(randomColor);
      }
    }

    const currentPlayer =
      this.state!.players[this.state!.getCurrentPlayerIndex()];
    if (currentPlayer) {
      currentPlayer.usedOracleCardThisTurn = false;
      currentPlayer.oracleDice = newDice;
      this.clearSelectedRecoloring();
    }

    const nextPlayerIndex = (this.state!.getCurrentPlayerIndex() + 1) %
      this.state!.players.length;

    this.state!.setCurrentPlayerIndex(nextPlayerIndex);
    if (this.state!.getCurrentPlayerIndex() === 0) {
      this.state!.advanceRound();
    }
    this.state!.setPhase('action');
  }

  private getPlayerIndex(playerId: number): number {
    return this.state!.players.findIndex((p) => p.id === playerId);
  }

  private ensureInitialized(): void {
    if (!this.state) {
      throw new Error('Game not initialized. Call initializeGame() first.');
    }
  }

  private getValidPlayer(playerId: number): Player {
    const player = this.state!.players.find((p) => p.id === playerId);
    if (
      !player ||
      this.state!.getCurrentPlayerIndex() !== this.getPlayerIndex(playerId)
    ) {
      throw new Error('Invalid player or not your turn');
    }
    return player;
  }

  // Game status
  public isGameInitialized(): boolean {
    return this.state !== null;
  }

  // Public getters
  public getGameStateSnapshot(): GameState {
    this.ensureInitialized();
    if (!this.state) {
      throw new Error(`Cannot getGameState because state is null`);
    }
    return GameState.fromJson(
      JSON.parse(JSON.stringify(this.state.toJson())),
    );
  }

  public getGameState(): GameState {
    this.ensureInitialized();
    if (!this.state) {
      throw new Error(`Cannot getGameState because state is null`);
    }
    return this.state;
  }

  public getCurrentPlayer(): Player {
    this.ensureInitialized();
    const player = this.state!.players[this.state!.getCurrentPlayerIndex()];
    if (!player) {
      throw new Error('Current player not found');
    }
    return player;
  }

  public getPlayer(playerId: number): Player | undefined {
    this.ensureInitialized();
    return this.state!.players.find((p) => p.id === playerId);
  }

  public getUiState(): UiState {
    return this.uiState;
  }

  public getCityHexes(): CityHex[] {
    this.ensureInitialized();
    return this.state!.getCityHexes();
  }

  public getCubeHexes(): CubeHex[] {
    this.ensureInitialized();
    return this.state!.getCubeHexes();
  }

  public getMonsterHexes(): MonsterHex[] {
    this.ensureInitialized();
    return this.state!.getMonsterHexes();
  }

  public getMonstersOnHex(q: number, r: number): HexColor[] {
    this.ensureInitialized();
    const monsterHex = this.state!.getMonsterHexes().find((mh) =>
      mh.q === q && mh.r === r
    );
    return monsterHex ? monsterHex.monsterColors : [];
  }

  public getAvailableLandInteractions(): HexCell[] {
    const player = this.getCurrentPlayer();
    const shipPosition = player.getShipPosition();
    const state = this.getGameState();
    const color = this.getEffectiveSelectedColor();
    if (!color) {
      return [];
    }

    const map = state.map;
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
        const card = this.oracleSystem?.takeOracleCardFromDeck();
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
    const favorSpentToRecolor = this.getSelectedRecoloring();
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

  public getSelectedRecoloring(): number {
    return this.uiState.getSelectedRecoloring();
  }

  public setSelectedRecoloring(
    favorSpent: number,
  ): boolean {
    return this.uiState.setSelectedRecoloring(favorSpent);
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

  public checkWinCondition(): { winner: Player | null; gameOver: boolean } {
    this.ensureInitialized();
    const winner = this.state!.players.find((p) =>
      p.completedQuestTypes.temple_offering >= 3 &&
      p.completedQuestTypes.monster >= 3 &&
      p.completedQuestTypes.statue >= 3 &&
      p.completedQuestTypes.shrine >= 3
    );
    return {
      winner: winner || null,
      gameOver: !!winner,
    };
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

  private state: GameState | null;
  private uiState: UiState;
  private gameInitializer: GameInitializer;
  private movementSystem: MovementSystem | null;
  private oracleSystem: OracleSystem | null;
  private shipMoveHandler: ShipMoveHandler | null;
}
