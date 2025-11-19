// Quests of Zeus Game Engine - Core Orchestration
// High-level game management and orchestration

import { GameInitializer } from './GameInitializer.ts';
import { GameState } from './GameState.ts';
import type { HexCell } from './hexmap/HexCell.ts';
import type { HexCoordinates } from './hexmap/HexGrid.ts';
import { MovementSystem } from './movement-system.ts';
import { OracleSystem } from './oracle-system.ts';
import { PlayerActions } from './player-actions.ts';
import type { Player } from './Player.ts';
import type {
  CityHex,
  CoreColor,
  CubeHex,
  HexColor,
  MonsterHex,
  MoveShipResult,
  PossibleShipMove,
  ShrineHex,
  ShrineResult,
} from './types.ts';
import { COLOR_WHEEL } from './types.ts';

export class GameEngine {
  private state: GameState | null = null;
  private gameInitializer: GameInitializer;
  private movementSystem: MovementSystem | null = null;
  private oracleSystem: OracleSystem | null = null;
  private playerActions: PlayerActions | null = null;

  constructor() {
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
    this.playerActions = new PlayerActions(
      this.state,
      this.movementSystem,
    );
    return this.state;
  }

  // Game Actions - delegate to specialized classes
  public rollOracleDice(playerId: number): HexColor[] {
    this.ensureInitialized();
    const player = this.getValidPlayer(playerId);
    return this.playerActions!.rollOracleDice(player);
  }

  public moveShip(
    playerId: number,
    targetQ: number,
    targetR: number,
    originalDieColor: CoreColor | undefined,
    originalCardColor: CoreColor | undefined,
    favorSpentToRecolor: number,
    favorSpentForRange: number,
  ): MoveShipResult {
    this.ensureInitialized();
    const player = this.getValidPlayer(playerId);
    const destinationCoordinates = { q: targetQ, r: targetR };
    return this.playerActions!.attemptMoveShip(
      player,
      destinationCoordinates,
      originalDieColor,
      originalCardColor,
      favorSpentToRecolor,
      favorSpentForRange,
    );
  }

  public collectOffering(playerId: number, color: HexColor): boolean {
    this.ensureInitialized();
    const player = this.getValidPlayer(playerId);
    const success = this.playerActions!.collectOffering(player, color);
    if (success) {
      this.completeQuestType(playerId, 'temple_offering');
      this.endTurn();
    }
    return success;
  }

  public fightMonster(playerId: number): boolean {
    this.ensureInitialized();
    const player = this.getValidPlayer(playerId);
    const success = this.playerActions!.fightMonster(player);
    if (success) {
      this.completeQuestType(playerId, 'monster');
      this.endTurn();
    }
    return success;
  }

  public buildTemple(playerId: number): boolean {
    this.ensureInitialized();
    const player = this.getValidPlayer(playerId);
    const success = this.playerActions!.buildTemple(player);
    if (success) {
      this.completeQuestType(playerId, 'temple_offering');
      this.endTurn();
    }
    return success;
  }

  public buildStatue(playerId: number): boolean {
    this.ensureInitialized();
    const player = this.getValidPlayer(playerId);
    const success = this.playerActions!.buildStatue(player);
    if (success) {
      this.completeQuestType(playerId, 'statue');
      this.endTurn();
    }
    return success;
  }

  public spendDieForFavor(playerId: number, dieColor: CoreColor): boolean {
    this.ensureInitialized();
    const player = this.getValidPlayer(playerId);
    return this.playerActions!.spendDieForFavor(player, dieColor);
  }

  public spendOracleCardForFavor(
    playerId: number,
    cardColor: CoreColor,
  ): boolean {
    this.ensureInitialized();
    const player = this.getValidPlayer(playerId);
    return this.oracleSystem!.spendOracleCardForFavor(player, cardColor);
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

  private completeQuestType(
    playerId: number,
    questType: 'temple_offering' | 'monster' | 'statue' | 'shrine',
  ): void {
    const player = this.state!.players.find((p) => p.id === playerId);
    if (!player) return;
    player.completedQuestTypes[questType]++;
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
      this.state!.clearSelectedRecoloring();
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

  public getAvailableMovesForColor(
    maxFavorForMovement: number,
  ): PossibleShipMove[] {
    const player = this.getCurrentPlayer();
    const effectiveColor = this.getGameState().getEffectiveSelectedColor();
    const availableMoves: PossibleShipMove[] = [];
    for (let favorSpent = 0; favorSpent <= maxFavorForMovement; favorSpent++) {
      const movementRange = player.getRange() + favorSpent;
      const reachableSeaTiles = this.movementSystem!.getReachableSeaTiles(
        player.getShipPosition(),
        movementRange,
      );

      for (const seaTile of reachableSeaTiles) {
        if (
          seaTile.color === effectiveColor &&
          !(seaTile.q === player.getShipPosition().q &&
            seaTile.r === player.getShipPosition().r)
        ) {
          if (favorSpent <= maxFavorForMovement) {
            const existingMove = availableMoves.find((move) =>
              move.q === seaTile.q && move.r === seaTile.r
            );
            if (!existingMove) {
              availableMoves.push({
                q: seaTile.q,
                r: seaTile.r,
                favorCost: favorSpent,
              });
            }
          }
        }
      }
    }

    return availableMoves;
  }

  public getAvailableLandInteractions(): HexCell[] {
    const player = this.getCurrentPlayer();
    const shipPosition = player.getShipPosition();
    const state = this.getGameState();
    const color = state.getEffectiveSelectedColor();
    if (!color) {
      return [];
    }

    const map = state.map;
    const neighbors = map.getNeighbors(shipPosition);

    const availables = neighbors.filter((cell) => {
      switch (cell.terrain) {
        case 'shrine':
          return this.isShrineAvailable(cell);
        default:
          return false;
      }
    });

    return availables;
  }

  private isShrineAvailable(cell: HexCell): boolean {
    const effectiveColor = this.getGameState().getEffectiveSelectedColor();
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
  ): ShrineResult {
    const effectiveColor = this.getGameState().getEffectiveSelectedColor();
    if (!effectiveColor) {
      return {
        success: false,
        message: 'Must select a die or card',
      };
    }

    const allLand = this.getAvailableLandInteractions();
    const shrineCell = allLand.find((cell) => {
      return cell.q === coordinates.q && cell.r === coordinates.r;
    });
    if (!shrineCell) {
      return {
        success: false,
        message: 'That shrine is not available',
      };
    }
    const shrineHex = this.getGameState().findShrineHexAt(coordinates);
    if (!shrineHex) {
      return {
        success: false,
        message: 'Impossible: ShrineHex not found at those coordinates',
      };
    }

    const player = this.getCurrentPlayer();
    if (shrineHex.status === 'hidden') {
      if (shrineHex.owner === player.color) {
        return this.completeShrineQuest(shrineHex);
      }

      shrineHex.status = 'visible';
      return this.flipShrine(player, shrineHex);
    }

    return {
      success: false,
      message: 'activateShrine not implemented yet',
    };
  }

  private completeShrineQuest(
    shrineHex: ShrineHex,
  ): ShrineResult {
    const player = this.getCurrentPlayer();
    if (shrineHex.status !== 'hidden' || shrineHex.owner !== player.color) {
      return {
        success: false,
        message: 'Impossible: wrong owner or already flipped',
      };
    }

    const quests = player.getQuests();
    const quest = quests.find((quest) => {
      return quest.type === 'shrine' &&
        quest.playerId === player.id &&
        !quest.isCompleted;
    });
    if (!quest) {
      return {
        success: false,
        message: 'Impossible: no remaining incomplete shrine quests',
      };
    }
    this.spendDieOrCard();
    shrineHex.status = 'filled';
    quest.isCompleted = true;
    return {
      success: true,
      message: 'Flipped by the owner - QUEST REWARD NOT GRANTED!',
    };
  }

  private flipShrine(player: Player, shrineHex: ShrineHex): ShrineResult {
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
        return {
          success: false,
          message: `Shrine reward ${shrineHex.reward} not implemented yet`,
        };
    }

    this.spendDieOrCard();
    return {
      success: true,
      message: message ?? 'flipped but no reward granted',
    };
  }

  public spendDieOrCard(): void {
    const player = this.getCurrentPlayer();
    const state = this.getGameState();
    const favorSpentToRecolor = state.getSelectedRecoloring();
    const die = state.getSelectedDieColor();
    const card = state.getSelectedOracleCardColor();
    const selectedColor = die || card;

    state.clearResourceSelection();
    if (!selectedColor) {
      return;
    }

    const array = die ? player.oracleDice : card ? player.oracleCards : null;
    if (array) {
      const at = array.indexOf(selectedColor);
      if (at >= 0) {
        array.splice(at, 1);
      }
    }

    player.favor -= favorSpentToRecolor;

    if (card) {
      player.usedOracleCardThisTurn = true;
    }
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
}
