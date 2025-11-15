// Player action implementations for Quests of Zeus
import type { GameState } from './GameState.ts';
import type { HexCoordinates } from './hexmap/HexGrid.ts';
import type { MovementSystem } from './movement-system.ts';
import { OracleSystem } from './oracle-system.ts';
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

  public getState(): GameState {
    return this.state;
  }

  public getMovementSystem(): MovementSystem {
    return this.movementSystem;
  }

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

  public attemptMoveShip(
    player: Player,
    destination: HexCoordinates,
    dieSpent: CoreColor | undefined,
    cardSpent: CoreColor | undefined,
    favorSpentToRecolor: number,
    favorSpentForRange: number,
  ): MoveShipResult {
    // validate state
    if (this.state.getPhase() !== 'action') {
      return {
        success: false,
        error: { type: 'wrong_phase', message: 'whatever' },
      };
    }
    // validate player
    if (this.state.getCurrentPlayerIndex() !== player.id) {
      return {
        success: false,
        error: { type: 'invalid_player', message: 'not current player' },
      };
    }
    // validate die OR card but not both
    if (dieSpent && cardSpent) {
      return {
        success: false,
        error: {
          type: 'both_die_and_card',
          message: 'cannot spend both die and card',
        },
      };
    }

    const originalColor = dieSpent || cardSpent;
    if (!originalColor) {
      return {
        success: false,
        error: {
          type: 'no_die_or_card',
          message: 'must spend either die or card',
        },
      };
    }
    // validate die (if spent)
    if (dieSpent) {
      if (player.oracleDice.indexOf(dieSpent) < 0) {
        return {
          success: false,
          error: {
            type: 'die_not_available',
            message: `no ${dieSpent} die available in ${player.oracleDice}`,
          },
        };
      }
    }
    // validate card (if spent)
    if (cardSpent) {
      if (player.oracleCards.indexOf(cardSpent) < 0) {
        return {
          success: false,
          error: {
            type: 'die_not_available',
            message: `no ${cardSpent} card available in ${player.oracleCards}`,
          },
        };
      }
      if (player.usedOracleCardThisTurn) {
        return {
          success: false,
          error: {
            type: 'second_card',
            message: 'Already used a card this turn',
          },
        };
      }
    }

    // validate destination coordinates
    if (
      JSON.stringify(destination) === JSON.stringify(player.getShipPosition())
    ) {
      return {
        success: false,
        error: { type: 'invalid_target', message: 'already there' },
      };
    }
    const map = this.state.map;
    const radius = map.getHexGrid().getRadius();
    if (Math.abs(destination.q) > radius || Math.abs(destination.r) > radius) {
      return {
        success: false,
        error: { type: 'invalid_target', message: 'off the map' },
      };
    }
    // validate enough favor available
    if (favorSpentForRange + favorSpentToRecolor > player.favor) {
      return {
        success: false,
        error: {
          type: 'not_enough_favor',
          message:
            `${favorSpentForRange} + ${favorSpentToRecolor} > ${player.favor}`,
        },
      };
    }
    // validate destination is sea
    const destinationCell = map.getCell(destination);
    if (destinationCell?.terrain !== 'sea') {
      return {
        success: false,
        error: {
          type: 'not_sea',
          message: `Destination ${JSON.stringify(destinationCell)} not sea`,
        },
      };
    }
    // validate destination color matches effective color
    const effectiveColor = OracleSystem.applyRecolor(
      originalColor,
      favorSpentToRecolor,
    );
    if (effectiveColor !== destinationCell.color) {
      return {
        success: false,
        error: {
          type: 'wrong_color',
          message: `Used ${effectiveColor} to try to get to ${
            JSON.stringify(destinationCell)
          }`,
        },
      };
    }
    // validate destination is in range
    const availableRange = player.getRange() + favorSpentForRange;
    const validation = this.movementSystem.validateMove(
      player.getShipPosition(),
      destination.q,
      destination.r,
      effectiveColor,
      availableRange,
      destinationCell,
    );
    if (!validation.isValid) {
      return {
        success: false,
        error: {
          type: 'not_reachable',
          message: validation.error || 'Unknown validation failure',
        },
      };
    }
    // move the ship, spend the favor, spend the die/card
    player.setShipPosition(destination);
    player.favor -= favorSpentForRange;
    player.favor -= favorSpentToRecolor;
    if (cardSpent) {
      player.usedOracleCardThisTurn = true;
    }
    const resourceArray = dieSpent ? player.oracleDice : player.oracleCards;
    const index = resourceArray.indexOf(originalColor);
    if (index < 0) {
      return {
        success: false,
        error: {
          type: 'unknown',
          message: `Could not remove ${originalColor} from ${resourceArray}`,
        },
      };
    }
    resourceArray.splice(index, 1);

    // log and return results
    return {
      success: true,
    };
  }

  /**
   * Collect an offering cube
   */
  public collectOffering(player: Player, color: HexColor): boolean {
    if (this.state.getPhase() !== 'action') {
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
    if (this.state.getPhase() !== 'action') {
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
    if (player.oracleDice.length !== 3) {
      return false;
    }

    // Consume oracle dice
    // player.oracleDice.splice(0, requiredDice);

    // Remove one monster from this hex (first one)
    monsterHex.monsterColors.shift();

    return true;
  }

  /**
   * Build a temple
   */
  public buildTemple(player: Player): boolean {
    if (this.state.getPhase() !== 'action') {
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
    if (this.state.getPhase() !== 'action') {
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
    if (this.state.getPhase() !== 'action') {
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
    if (this.state.getPhase() !== 'action') {
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
