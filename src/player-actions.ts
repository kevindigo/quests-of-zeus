// Player action implementations for Quests of Zeus
import type { GameState } from './GameState.ts';
import type { MovementSystem } from './movement-system.ts';
import type { OracleSystem } from './oracle-system.ts';
import type { Player } from './Player.ts';
import {
  addCubeToStorage,
  hasCubeOfColor,
  hasStatueOfColor,
  removeCubeFromStorage,
  removeStatueFromStorage,
} from './storage-manager.ts';
import type { CoreColor, HexColor, MoveShipResult } from './types.ts';
import { COLOR_WHEEL } from './types.ts';

export class PlayerActions {
  constructor(
    private state: GameState,
    private movementSystem: MovementSystem,
    private oracleSystem: OracleSystem,
  ) {}

  /**
   * Roll oracle dice for a player
   */
  public rollOracleDice(player: Player): CoreColor[] {
    // Roll 3 oracle dice (random colors)
    const dice: CoreColor[] = [];
    for (let i = 0; i < 3; i++) {
      const randomColor =
        COLOR_WHEEL[Math.floor(Math.random() * COLOR_WHEEL.length)];
      dice.push(randomColor!);
    }

    player.oracleDice = dice;
    return dice;
  }

  /**
   * Move a player's ship
   */
  public moveShip(
    player: Player,
    targetQ: number,
    targetR: number,
    dieColor?: CoreColor,
    favorSpent?: number,
  ): MoveShipResult {
    if (this.state.phase !== 'action') {
      return {
        success: false,
        error: {
          type: 'wrong_phase',
          message: `Cannot move during ${this.state.phase} phase`,
          details: { phase: this.state.phase },
        },
      };
    }

    const currentPos = player.getShipPosition();
    const targetCell = this.state.map.getCell({ q: targetQ, r: targetR });

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

    // Check if player has the required oracle die (original color)
    if (!dieColor) {
      return {
        success: false,
        error: {
          type: 'no_die',
          message: 'No die color specified',
          details: { availableDice: player.oracleDice },
        },
      };
    }

    if (!player.oracleDice.includes(dieColor)) {
      return {
        success: false,
        error: {
          type: 'die_not_available',
          message: `You don't have a ${dieColor} die available`,
          details: {
            dieColor,
            availableDice: player.oracleDice,
            playerId: player.id,
          },
        },
      };
    }

    // Apply recoloring if there's an intention for this die
    // This must happen BEFORE reachability checks since it changes the die color
    const originalDieColor = dieColor;
    let recoloringCost = 0;
    if (player.recoloredDice && player.recoloredDice[dieColor]) {
      const recoloringApplied = this.oracleSystem.applyRecoloring(
        player,
        dieColor,
      );
      if (recoloringApplied) {
        // Update dieColor to the recolored color for the rest of the logic
        dieColor = player.recoloredDice[originalDieColor]?.newColor || dieColor;
        recoloringCost = player.recoloredDice[originalDieColor]?.favorCost || 0;
      } else {
        return {
          success: false,
          error: {
            type: 'recoloring_failed',
            message: 'Recoloring failed - not enough favor or die not found',
            details: {
              originalDieColor,
              recoloringCost:
                player.recoloredDice[originalDieColor]?.favorCost || 0,
              availableFavor: player.favor,
            },
          },
        };
      }
    }

    // Calculate movement range (base 3 + 1 per favor spent)
    const movementRange = 3 + (favorSpent || 0);

    // Validate the move
    const validation = this.movementSystem.validateMove(
      currentPos,
      targetQ,
      targetR,
      dieColor,
      movementRange,
      targetCell,
    );

    if (!validation.isValid) {
      return {
        success: false,
        error: {
          type: 'not_reachable',
          message: validation.error || 'Move validation failed',
          details: {
            targetQ,
            targetR,
            movementRange,
            currentQ: currentPos.q,
            currentR: currentPos.r,
            dieColor,
          },
        },
      };
    }

    // Spend favor if specified
    if (favorSpent && favorSpent > 0) {
      if (player.favor < favorSpent) {
        return {
          success: false,
          error: {
            type: 'not_enough_favor',
            message:
              `Not enough favor to spend ${favorSpent} (only have ${player.favor})`,
            details: {
              favorSpent,
              availableFavor: player.favor,
              recoloringCost,
            },
          },
        };
      }
      player.favor -= favorSpent;
    }

    // Consume the oracle die - use the current dieColor after recoloring
    const dieIndex = player.oracleDice.indexOf(dieColor);
    if (dieIndex !== -1) {
      player.oracleDice.splice(dieIndex, 1);
    } else {
      // This should not happen since we checked above, but log for debugging
      console.warn(
        `Attempted to consume die ${dieColor} but it was not found in player's oracle dice: [${
          player.oracleDice.join(', ')
        }]`,
      );
      return {
        success: false,
        error: {
          type: 'unknown',
          message: 'Unexpected error: die not found after validation',
          details: { dieColor, availableDice: player.oracleDice },
        },
      };
    }

    // Move the ship
    player.setShipPosition({ q: targetQ, r: targetR });

    return {
      success: true,
    };
  }

  /**
   * Collect an offering cube
   */
  public collectOffering(player: Player, color: HexColor): boolean {
    if (this.state.phase !== 'action') {
      return false;
    }

    // Check if player is on a cube hex
    const currentCell = this.state.map.getCell(
      player.getShipPosition(),
    );
    if (!currentCell || currentCell.terrain !== 'cubes') {
      return false;
    }

    // Find the cube hex in our tracking
    const cubeHex = this.state.getCubeHexes().find((ch) =>
      ch.q === currentCell.q && ch.r === currentCell.r
    );

    if (!cubeHex) {
      return false;
    }

    // Check if the requested color is available on this hex
    if (!cubeHex.cubeColors.includes(color)) {
      return false;
    }

    // Try to add cube to storage
    const success = addCubeToStorage(player, color);
    if (success) {
      // Remove this color from the hex
      const colorIndex = cubeHex.cubeColors.indexOf(color);
      cubeHex.cubeColors.splice(colorIndex, 1);
    }

    return success;
  }

  /**
   * Fight a monster
   */
  public fightMonster(player: Player): boolean {
    if (this.state.phase !== 'action') {
      return false;
    }

    // Check if player is on a monster hex
    const currentCell = this.state.map.getCell(
      player.getShipPosition(),
    );
    if (!currentCell || currentCell.terrain !== 'monsters') {
      return false;
    }

    // Find the monster hex in our tracking
    const monsterHex = this.state.getMonsterHexes().find((mh) =>
      mh.q === currentCell.q && mh.r === currentCell.r
    );

    if (!monsterHex || monsterHex.monsterColors.length === 0) {
      return false; // No monsters on this hex
    }

    // Check if player has required oracle dice
    const requiredDice = this.state.monsterStrength;
    if (player.oracleDice.length < requiredDice) {
      return false;
    }

    // Consume oracle dice
    player.oracleDice.splice(0, requiredDice);

    // Remove one monster from this hex (first one)
    monsterHex.monsterColors.shift();

    return true;
  }

  /**
   * Build a temple
   */
  public buildTemple(player: Player): boolean {
    if (this.state.phase !== 'action') {
      return false;
    }

    // Check if player is on a temple hex
    const currentCell = this.state.map.getCell(
      player.getShipPosition(),
    );
    if (!currentCell || currentCell.terrain !== 'temple') {
      return false;
    }

    // Check if player has a cube of the required color
    const requiredColor = currentCell.color;
    if (!hasCubeOfColor(player, requiredColor)) {
      return false;
    }

    // Consume cube and complete temple
    const success = removeCubeFromStorage(player, requiredColor);
    return success;
  }

  /**
   * Build a foundation
   */
  public buildFoundation(player: Player): boolean {
    if (this.state.phase !== 'action') {
      return false;
    }

    // Check if player is on a foundation hex
    const currentCell = this.state.map.getCell(
      player.getShipPosition(),
    );
    if (!currentCell || currentCell.terrain !== 'foundations') {
      return false;
    }

    return true;
  }

  /**
   * Complete a cloud quest
   */
  public completeCloudQuest(player: Player): boolean {
    if (this.state.phase !== 'action') {
      return false;
    }

    // Check if player is on a cloud hex
    const currentCell = this.state.map.getCell(
      player.getShipPosition(),
    );
    if (!currentCell || currentCell.terrain !== 'clouds') {
      return false;
    }

    // Check if player has a statue of the required color
    const requiredColor = currentCell.color;
    if (!hasStatueOfColor(player, requiredColor)) {
      return false;
    }

    // Consume statue and complete cloud quest
    const success = removeStatueFromStorage(player, requiredColor);
    return success;
  }

  /**
   * Spend any die to gain 2 favor during the action phase
   */
  public spendDieForFavor(player: Player, dieColor: CoreColor): boolean {
    if (this.state.phase !== 'action') {
      return false;
    }

    // Check if player has the specified die
    if (!player.oracleDice.includes(dieColor)) {
      return false;
    }

    // Apply recoloring if there's an intention for this die
    const originalDieColor = dieColor;
    if (player.recoloredDice && player.recoloredDice[dieColor]) {
      const recoloringApplied = this.oracleSystem.applyRecoloring(
        player,
        dieColor,
      );
      if (recoloringApplied) {
        // Update dieColor to the recolored color for the rest of the logic
        dieColor = player.recoloredDice[originalDieColor]?.newColor || dieColor;
      }
    }

    // Consume the oracle die - use the current dieColor after recoloring
    const dieIndex = player.oracleDice.indexOf(dieColor);
    if (dieIndex !== -1) {
      player.oracleDice.splice(dieIndex, 1);
    } else {
      // This should not happen since we checked above, but log for debugging
      console.warn(
        `Attempted to consume die ${dieColor} but it was not found in player's oracle dice: [${
          player.oracleDice.join(', ')
        }]`,
      );
      return false;
    }

    // Gain 2 favor
    player.favor += 2;

    return true;
  }
}
