// Quests of Zeus Game Engine - Core Orchestration
// High-level game management and orchestration

import { GameInitializer } from './GameInitializer.ts';
import { GameState } from './GameState.ts';
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
} from './types.ts';
import { COLOR_WHEEL } from './types.ts';

export class QuestsZeusGameEngine {
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

  public completeShrineQuest(playerId: number): boolean {
    this.ensureInitialized();
    const player = this.getValidPlayer(playerId);
    const success = this.playerActions!.completeShrineQuest(player);
    if (success) {
      this.completeQuestType(playerId, 'shrine');
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
      this.state!.clearRecolorIntention(currentPlayer.id);
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
    player: Player,
    effectiveColor: CoreColor,
    maxFavorForMovement: number,
  ): { q: number; r: number; favorCost: number }[] {
    const availableMoves: { q: number; r: number; favorCost: number }[] = [];
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
