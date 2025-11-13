// Quests of Zeus Game Engine - Core Orchestration
// High-level game management and orchestration

import { GameInitializer } from './game-initializer.ts';
import { MovementSystem } from './movement-system.ts';
import { OracleSystem } from './oracle-system.ts';
import { PlayerActions } from './player-actions.ts';
import type { Player } from './Player.ts';
import type {
  CityHex,
  CoreColor,
  CubeHex,
  GameState,
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
    this.movementSystem = new MovementSystem(this.state.map);
    this.oracleSystem = new OracleSystem(
      this.gameInitializer.getOracleCardDeck(),
    );
    this.playerActions = new PlayerActions(
      this.state,
      this.movementSystem,
      this.oracleSystem,
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
    dieColor?: CoreColor,
    favorSpent?: number,
  ): MoveShipResult {
    this.ensureInitialized();
    const player = this.getValidPlayer(playerId);
    const result = this.playerActions!.moveShip(
      player,
      targetQ,
      targetR,
      dieColor,
      favorSpent,
    );
    return result;
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

  public spendOracleCardForMovement(
    playerId: number,
    targetQ: number,
    targetR: number,
    cardColor: CoreColor,
    favorSpent?: number,
  ): MoveShipResult {
    this.ensureInitialized();
    const player = this.getValidPlayer(playerId);

    // First validate the move using the same logic as getAvailableMovesForOracleCard
    const currentPos = player.getShipPosition();
    const targetCell = this.state!.map.getCell(targetQ, targetR);

    if (!targetCell) {
      return {
        success: false,
        error: {
          type: 'invalid_target',
          message: 'Target cell does not exist',
          details: { targetQ, targetR },
        },
      };
    }

    if (targetCell.terrain !== 'sea') {
      return {
        success: false,
        error: {
          type: 'not_sea',
          message:
            `Cannot move to ${targetCell.terrain} terrain! Ships can only move to sea hexes.`,
          details: { targetTerrain: targetCell.terrain },
        },
      };
    }

    // Get the effective card color considering recoloring intention
    let effectiveCardColor = cardColor;
    let recoloringCost = 0;
    if (player.recoloredCards && player.recoloredCards[cardColor]) {
      effectiveCardColor = player.recoloredCards[cardColor].newColor;
      recoloringCost = player.recoloredCards[cardColor].favorCost;
    }

    // Check if the target hex color matches the effective card color
    if (targetCell.color !== effectiveCardColor) {
      return {
        success: false,
        error: {
          type: 'wrong_color',
          message:
            `Target hex is ${targetCell.color}, but oracle card is ${effectiveCardColor}!`,
          details: {
            targetColor: targetCell.color,
            requiredColor: effectiveCardColor,
          },
        },
      };
    }

    // Calculate movement range (base 3 + 1 per favor spent)
    const movementRange = 3 + (favorSpent || 0);

    // Check if the target is reachable
    const reachableSeaTiles = this.movementSystem!.getReachableSeaTiles(
      currentPos.q,
      currentPos.r,
      movementRange,
    );

    const isReachable = reachableSeaTiles.some((tile) =>
      tile.q === targetQ && tile.r === targetR
    );

    if (!isReachable) {
      return {
        success: false,
        error: {
          type: 'not_reachable',
          message:
            `Target is not reachable within ${movementRange} movement range!`,
          details: {
            movementRange,
            currentQ: currentPos.q,
            currentR: currentPos.r,
          },
        },
      };
    }

    // Check if player has enough favor for recoloring and movement
    const totalFavorCost = (favorSpent || 0) + recoloringCost;
    if (player.favor < totalFavorCost) {
      return {
        success: false,
        error: {
          type: 'not_enough_favor',
          message:
            `Not enough favor! Need ${totalFavorCost} but only have ${player.favor}.`,
          details: {
            favorSpent: totalFavorCost,
            availableFavor: player.favor,
            recoloringCost,
          },
        },
      };
    }

    // Now call the oracle system to handle card consumption and recoloring
    const oracleResult = this.oracleSystem!.spendOracleCardForMovement(
      player,
      targetQ,
      targetR,
      cardColor,
      favorSpent,
    );
    if (!oracleResult.success) {
      return {
        success: false,
        error: {
          type: 'unknown',
          message: oracleResult.error || 'Oracle card usage failed',
          details: { playerId },
        },
      };
    }

    // Spend favor for movement if specified (recoloring favor is already spent by applyRecoloringForCard)
    if (favorSpent && favorSpent > 0) {
      player.favor -= favorSpent;
    }

    // Move the ship
    player.shipPosition = { q: targetQ, r: targetR };
    return { success: true };
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
    const currentPlayer = this.state!.players[this.state!.currentPlayerIndex];
    if (currentPlayer) {
      currentPlayer.usedOracleCardThisTurn = false;
      currentPlayer.recoloredDice = {};
      currentPlayer.recoloredCards = {};
    }

    const nextPlayerIndex = (this.state!.currentPlayerIndex + 1) %
      this.state!.players.length;
    const nextPlayer = this.state!.players[nextPlayerIndex];

    const dice: CoreColor[] = [];
    for (let i = 0; i < 3; i++) {
      const randomColor =
        COLOR_WHEEL[Math.floor(Math.random() * COLOR_WHEEL.length)];
      if (randomColor) {
        dice.push(randomColor);
      }
    }
    if (nextPlayer) {
      nextPlayer.oracleDice = dice;
    }

    this.state!.currentPlayerIndex = nextPlayerIndex;
    if (this.state!.currentPlayerIndex === 0) {
      this.state!.round++;
    }
    this.state!.phase = 'action';
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
      this.state!.currentPlayerIndex !== this.getPlayerIndex(playerId)
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
  public getGameState(): GameState {
    this.ensureInitialized();
    if (!this.state) {
      throw new Error(`Cannot getGameState because state is null`);
    }
    const stateCopy = this.state.deepCopy();
    stateCopy.map = this.state!.map;
    return stateCopy;
  }

  public getCurrentPlayer(): Player {
    this.ensureInitialized();
    const player = this.state!.players[this.state!.currentPlayerIndex];
    if (!player) {
      throw new Error('Current player not found');
    }
    return player;
  }

  public getPlayer(playerId: number): Player | undefined {
    this.ensureInitialized();
    return this.state!.players.find((p) => p.id === playerId);
  }

  public getAvailableMoves(
    playerId: number,
    favorSpent?: number,
  ): { q: number; r: number; dieColor: CoreColor }[] {
    this.ensureInitialized();
    const player = this.state!.players.find((p) => p.id === playerId);
    if (!player || this.state!.phase !== 'action') return [];

    const currentPos = player.getShipPosition();
    const movementRange = 3 + (favorSpent || 0);
    const reachableSeaTiles = this.movementSystem!.getReachableSeaTiles(
      currentPos.q,
      currentPos.r,
      movementRange,
    );

    return reachableSeaTiles
      .filter((seaTile) =>
        player.oracleDice.includes(seaTile.color) &&
        !(seaTile.q === currentPos.q && seaTile.r === currentPos.r)
      )
      .map((seaTile) => ({
        q: seaTile.q,
        r: seaTile.r,
        dieColor: seaTile.color,
      }));
  }

  public getCityHexes(): CityHex[] {
    this.ensureInitialized();
    return this.state!.cityHexes;
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
    const monsterHex = this.state!.monsterHexes.find((mh) =>
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
      !player || this.state!.phase !== 'action' ||
      !player.oracleDice.includes(dieColor)
    ) {
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
        player.getShipPosition().q,
        player.getShipPosition().r,
        movementRange,
      );

      for (const seaTile of reachableSeaTiles) {
        if (
          seaTile.color === effectiveDieColor &&
          !(seaTile.q === player.getShipPosition().q &&
            seaTile.r === player.getShipPosition().r)
        ) {
          const totalFavorCost = favorSpent + recoloringCost;
          if (totalFavorCost <= availableFavor) {
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
