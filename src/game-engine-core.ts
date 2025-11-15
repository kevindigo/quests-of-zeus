// Quests of Zeus Game Engine - Core Orchestration
// High-level game management and orchestration

import { GameInitializer } from './game-initializer.ts';
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

  public buildFoundation(playerId: number): boolean {
    this.ensureInitialized();
    const player = this.getValidPlayer(playerId);
    const success = this.playerActions!.buildFoundation(player);
    if (success) {
      this.completeQuestType(playerId, 'foundation');
      this.endTurn();
    }
    return success;
  }

  public completeCloudQuest(playerId: number): boolean {
    this.ensureInitialized();
    const player = this.getValidPlayer(playerId);
    const success = this.playerActions!.completeCloudQuest(player);
    if (success) {
      this.completeQuestType(playerId, 'cloud');
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

  public setRecolorIntention(
    playerId: number,
    dieColor: CoreColor,
    favorSpent: number,
  ): boolean {
    this.ensureInitialized();
    const player = this.getValidPlayer(playerId);
    return this.oracleSystem!.setRecolorIntention(player, dieColor, favorSpent);
  }

  public setRecolorIntentionForCard(
    playerId: number,
    cardColor: CoreColor,
    favorSpent: number,
  ): boolean {
    this.ensureInitialized();
    const player = this.getValidPlayer(playerId);
    return this.oracleSystem!.setRecolorIntentionForCard(
      player,
      cardColor,
      favorSpent,
    );
  }

  public clearRecolorIntention(playerId: number, dieColor: HexColor): boolean {
    this.ensureInitialized();
    const player = this.getValidPlayer(playerId);
    return this.oracleSystem!.clearRecolorIntention(player, dieColor);
  }

  public clearRecolorIntentionForCard(
    playerId: number,
    cardColor: CoreColor,
  ): boolean {
    this.ensureInitialized();
    const player = this.getValidPlayer(playerId);
    return this.oracleSystem!.clearRecolorIntentionForCard(player, cardColor);
  }

  public canPlaceStatueOnCity(_playerId: number): boolean {
    this.ensureInitialized();
    return false;
  }

  private completeQuestType(
    playerId: number,
    questType: 'temple_offering' | 'monster' | 'foundation' | 'cloud',
  ): void {
    const player = this.state!.players.find((p) => p.id === playerId);
    if (!player) return;
    player.completedQuests++;
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
      currentPlayer.setRecolorIntention(0);
      currentPlayer.recoloredDice = {};
      currentPlayer.recoloredCards = {};
      currentPlayer.oracleDice = newDice;
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

  public getAvailableMovesForDie(
    playerId: number,
    dieColor: CoreColor,
    availableFavor: number,
  ): { q: number; r: number; favorCost: number }[] {
    this.ensureInitialized();
    const player = this.state!.players.find((p) => p.id === playerId);
    if (
      !player || this.state!.getPhase() !== 'action' ||
      !player.oracleDice.includes(dieColor)
    ) {
      return [];
    }

    const recoloringCost = player.getRecolorIntention();
    const effectiveDieColor = OracleSystem.applyRecolor(
      dieColor,
      recoloringCost,
    );
    const maxFavorForMovement = Math.min(availableFavor - recoloringCost, 5);
    return this.getAvailableMovesForColor(
      player,
      effectiveDieColor,
      maxFavorForMovement,
    );
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
      p.completedQuestTypes.foundation >= 3 &&
      p.completedQuestTypes.cloud >= 3
    );
    return {
      winner: winner || null,
      gameOver: !!winner,
    };
  }
}
