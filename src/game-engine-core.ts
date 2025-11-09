// Quests of Zeus Game Engine - Core Orchestration
// High-level game management and orchestration

import type { HexColor, Player, CubeHex, MonsterHex, MoveShipResult, GameState } from "./types.ts";
import { ALL_COLORS } from "./types.ts";
import { GameInitializer } from "./game-initializer.ts";
import { PlayerActions } from "./player-actions.ts";
import { MovementSystem } from "./movement-system.ts";
import { OracleSystem } from "./oracle-system.ts";

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
    this.movementSystem = new MovementSystem(this.state.map);
    this.oracleSystem = new OracleSystem(this.gameInitializer.getOracleCardDeck());
    this.playerActions = new PlayerActions(this.state, this.movementSystem, this.oracleSystem);
    return this.state;
  }

  // Game Actions - delegate to specialized classes
  public rollOracleDice(playerId: number): HexColor[] {
    this.ensureInitialized();
    const player = this.getValidPlayer(playerId);
    return this.playerActions!.rollOracleDice(player);
  }

  public moveShip(playerId: number, targetQ: number, targetR: number, dieColor?: HexColor, favorSpent?: number): MoveShipResult {
    this.ensureInitialized();
    const player = this.getValidPlayer(playerId);
    const result = this.playerActions!.moveShip(player, targetQ, targetR, dieColor, favorSpent);
    // Don't automatically end turn after movement - let players perform multiple actions
    if (result.success) {
      console.log(`Move successful for player ${playerId}, turn continues`);
    } else {
      console.log(`Move failed for player ${playerId}:`, result.error);
    }
    return result;
  }

  public collectOffering(playerId: number, color: HexColor): boolean {
    this.ensureInitialized();
    const player = this.getValidPlayer(playerId);
    const success = this.playerActions!.collectOffering(player, color);
    if (success) {
      this.completeQuestType(playerId, "temple_offering");
      this.endTurn();
    }
    return success;
  }

  public fightMonster(playerId: number): boolean {
    this.ensureInitialized();
    const player = this.getValidPlayer(playerId);
    const success = this.playerActions!.fightMonster(player);
    if (success) {
      this.completeQuestType(playerId, "monster");
      this.endTurn();
    }
    return success;
  }

  public buildTemple(playerId: number): boolean {
    this.ensureInitialized();
    const player = this.getValidPlayer(playerId);
    const success = this.playerActions!.buildTemple(player);
    if (success) {
      this.completeQuestType(playerId, "temple_offering");
      this.endTurn();
    }
    return success;
  }

  public buildFoundation(playerId: number): boolean {
    this.ensureInitialized();
    const player = this.getValidPlayer(playerId);
    const success = this.playerActions!.buildFoundation(player);
    if (success) {
      this.completeQuestType(playerId, "foundation");
      this.endTurn();
    }
    return success;
  }

  public completeCloudQuest(playerId: number): boolean {
    this.ensureInitialized();
    const player = this.getValidPlayer(playerId);
    const success = this.playerActions!.completeCloudQuest(player);
    if (success) {
      this.completeQuestType(playerId, "cloud");
      this.endTurn();
    }
    return success;
  }

  public placeStatueOnCity(playerId: number): boolean {
    this.ensureInitialized();
    const player = this.getValidPlayer(playerId);
    const success = this.playerActions!.placeStatueOnCity(player);
    if (success) this.endTurn();
    return success;
  }

  public spendDieForFavor(playerId: number, dieColor: HexColor): boolean {
    this.ensureInitialized();
    const player = this.getValidPlayer(playerId);
    return this.playerActions!.spendDieForFavor(player, dieColor);
  }

  public spendOracleCardForMovement(playerId: number, targetQ: number, targetR: number, cardColor: HexColor, favorSpent?: number): MoveShipResult {
    this.ensureInitialized();
    const player = this.getValidPlayer(playerId);
    const oracleResult = this.oracleSystem!.spendOracleCardForMovement(player, targetQ, targetR, cardColor, favorSpent);
    if (!oracleResult.success) {
      return {
        success: false,
        error: { type: "unknown", message: oracleResult.error || "Oracle card usage failed", details: { playerId } }
      };
    }
    player.shipPosition = { q: targetQ, r: targetR };
    return { success: true };
  }

  public spendOracleCardForFavor(playerId: number, cardColor: HexColor): boolean {
    this.ensureInitialized();
    const player = this.getValidPlayer(playerId);
    return this.oracleSystem!.spendOracleCardForFavor(player, cardColor);
  }

  public drawOracleCard(playerId: number, dieColor: HexColor): boolean {
    this.ensureInitialized();
    const player = this.getValidPlayer(playerId);
    return this.oracleSystem!.drawOracleCard(player, dieColor);
  }

  public setRecolorIntention(playerId: number, dieColor: HexColor, favorSpent: number): boolean {
    this.ensureInitialized();
    const player = this.getValidPlayer(playerId);
    return this.oracleSystem!.setRecolorIntention(player, dieColor, favorSpent);
  }

  public clearRecolorIntention(playerId: number, dieColor: HexColor): boolean {
    this.ensureInitialized();
    const player = this.getValidPlayer(playerId);
    return this.oracleSystem!.clearRecolorIntention(player, dieColor);
  }

  public canPlaceStatueOnCity(playerId: number): boolean {
    this.ensureInitialized();
    const player = this.getValidPlayer(playerId);
    return this.playerActions!.canPlaceStatueOnCity(player);
  }

  private completeQuestType(playerId: number, questType: "temple_offering" | "monster" | "foundation" | "cloud"): void {
    const player = this.state!.players.find((p) => p.id === playerId);
    if (!player) return;
    player.completedQuests++;
    player.completedQuestTypes[questType]++;
  }

  public endTurn(): void {
    this.ensureInitialized();
    const currentPlayer = this.state!.players[this.state!.currentPlayerIndex];
    currentPlayer.usedOracleCardThisTurn = false;
    currentPlayer.recoloredDice = {};

    const nextPlayerIndex = (this.state!.currentPlayerIndex + 1) % this.state!.players.length;
    const nextPlayer = this.state!.players[nextPlayerIndex];
    
    const dice: HexColor[] = [];
    for (let i = 0; i < 3; i++) {
      dice.push(ALL_COLORS[Math.floor(Math.random() * ALL_COLORS.length)]);
    }
    nextPlayer.oracleDice = dice;

    this.state!.currentPlayerIndex = nextPlayerIndex;
    if (this.state!.currentPlayerIndex === 0) {
      this.state!.round++;
    }
    this.state!.phase = "action";
  }

  private getPlayerIndex(playerId: number): number {
    return this.state!.players.findIndex((p) => p.id === playerId);
  }

  private ensureInitialized(): void {
    if (!this.state) throw new Error("Game not initialized. Call initializeGame() first.");
  }

  private getValidPlayer(playerId: number): Player {
    const player = this.state!.players.find((p) => p.id === playerId);
    if (!player || this.state!.currentPlayerIndex !== this.getPlayerIndex(playerId)) {
      throw new Error("Invalid player or not your turn");
    }
    return player;
  }

  // Game status
  public isGameInitialized(): boolean {
    return this.state !== null;
  }

  // Public getters
  public getGameState(): GameState {
    this.ensureInitialized();
    const stateCopy = JSON.parse(JSON.stringify(this.state));
    stateCopy.map = this.state!.map;
    return stateCopy;
  }

  public getCurrentPlayer(): Player {
    this.ensureInitialized();
    return this.state!.players[this.state!.currentPlayerIndex];
  }

  public getPlayer(playerId: number): Player | undefined {
    this.ensureInitialized();
    return this.state!.players.find((p) => p.id === playerId);
  }

  public getAvailableMoves(playerId: number, favorSpent?: number): { q: number; r: number; dieColor: HexColor }[] {
    this.ensureInitialized();
    const player = this.state!.players.find((p) => p.id === playerId);
    if (!player || this.state!.phase !== "action") return [];

    const currentPos = player.shipPosition;
    const movementRange = 3 + (favorSpent || 0);
    const reachableSeaTiles = this.movementSystem!.getReachableSeaTiles(currentPos.q, currentPos.r, movementRange);

    return reachableSeaTiles
      .filter(seaTile => 
        seaTile.color !== "none" &&
        player.oracleDice.includes(seaTile.color) &&
        !(seaTile.q === currentPos.q && seaTile.r === currentPos.r)
      )
      .map(seaTile => ({
        q: seaTile.q,
        r: seaTile.r,
        dieColor: seaTile.color,
      }));
  }

  public getCubeHexes(): CubeHex[] {
    this.ensureInitialized();
    return this.state!.cubeHexes;
  }

  public getMonsterHexes(): MonsterHex[] {
    this.ensureInitialized();
    return this.state!.monsterHexes;
  }

  public getMonstersOnHex(q: number, r: number): HexColor[] {
    this.ensureInitialized();
    const monsterHex = this.state!.monsterHexes.find((mh) => mh.q === q && mh.r === r);
    return monsterHex ? monsterHex.monsterColors : [];
  }

  public getAvailableMovesForDie(playerId: number, dieColor: HexColor, availableFavor: number): { q: number; r: number; favorCost: number }[] {
    this.ensureInitialized();
    const player = this.state!.players.find((p) => p.id === playerId);
    if (!player || this.state!.phase !== "action" || !player.oracleDice.includes(dieColor)) {
      return [];
    }

    let effectiveDieColor = dieColor;
    let recoloringCost = 0;
    if (player.recoloredDice && player.recoloredDice[dieColor]) {
      effectiveDieColor = player.recoloredDice[dieColor].newColor;
      recoloringCost = player.recoloredDice[dieColor].favorCost;
    }

    const availableMoves: { q: number; r: number; favorCost: number }[] = [];
    const maxFavorForMovement = Math.min(availableFavor - recoloringCost, 5);

    for (let favorSpent = 0; favorSpent <= maxFavorForMovement; favorSpent++) {
      const movementRange = 3 + favorSpent;
      const reachableSeaTiles = this.movementSystem!.getReachableSeaTiles(
        player.shipPosition.q,
        player.shipPosition.r,
        movementRange,
      );

      for (const seaTile of reachableSeaTiles) {
        if (
          seaTile.color !== "none" &&
          seaTile.color === effectiveDieColor &&
          !(seaTile.q === player.shipPosition.q && seaTile.r === player.shipPosition.r)
        ) {
          const totalFavorCost = favorSpent + recoloringCost;
          if (totalFavorCost <= availableFavor) {
            const existingMove = availableMoves.find((move) => move.q === seaTile.q && move.r === seaTile.r);
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