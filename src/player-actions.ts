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
import type { CoreColor, MoveShipResult, ResultWithMessage } from './types.ts';
import { COLOR_WHEEL } from './types.ts';

export class PlayerActions {
  constructor(
    private state: GameState,
    private movementSystem: MovementSystem,
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
    const phase = this.state.getPhase();
    if (phase !== 'action') {
      return {
        success: false,
        error: { type: 'wrong_phase', message: 'whatever', details: { phase } },
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
            details: {
              dieColor: originalColor,
              availableDice: player.oracleDice,
            },
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
            type: 'card_not_available',
            message: `no ${cardSpent} card available in ${player.oracleCards}`,
            details: {
              dieColor: originalColor,
              availableDice: player.oracleCards,
            },
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
        error: {
          type: 'invalid_target',
          message: 'already there',
          details: { targetQ: destination.q, targetR: destination.r },
        },
      };
    }
    const map = this.state.map;
    const radius = map.getHexGrid().getRadius();
    if (Math.abs(destination.q) > radius || Math.abs(destination.r) > radius) {
      return {
        success: false,
        error: {
          type: 'invalid_target',
          message: 'off the map',
          details: { targetQ: destination.q, targetR: destination.r },
        },
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
    const terrain = destinationCell?.terrain;
    if (terrain !== 'sea') {
      return {
        success: false,
        error: {
          type: 'not_sea',
          message: `Destination ${JSON.stringify(destinationCell)} not sea`,
          details: {
            targetTerrain: terrain || 'unknown',
          },
        },
      };
    }
    // validate destination color matches effective color
    const effectiveColor = OracleSystem.applyRecolor(
      originalColor,
      favorSpentToRecolor,
    );
    if (effectiveColor !== destinationCell?.color) {
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
    this.removeSpentResourceFromPlayer(player, dieSpent, cardSpent);

    // log and return results
    return {
      success: true,
    };
  }

  private removeSpentResourceFromPlayer(
    player: Player,
    dieSpent: CoreColor | undefined,
    cardSpent: CoreColor | undefined,
  ): ResultWithMessage {
    const resourceArray = dieSpent ? player.oracleDice : player.oracleCards;
    const originalColor = dieSpent || cardSpent;
    if (!originalColor) {
      return {
        success: false,
        message: 'Impossible: no resource was selected',
      };
    }
    const index = resourceArray.indexOf(originalColor);
    if (index < 0) {
      return {
        success: false,
        message: `Could not remove ${originalColor} from ${resourceArray}`,
      };
    }

    resourceArray.splice(index, 1);
    return {
      success: true,
      message: 'Resource was spent',
    };
  }

  /**
   * Collect an offering cube
   */
  public collectOffering(player: Player, color: CoreColor): boolean {
    if (this.state.getPhase() !== 'action') {
      return false;
    }

    // Check if player is on a cube hex
    const currentCell = this.state.map.getCell(
      player.getShipPosition(),
    );
    if (!currentCell || currentCell.terrain !== 'offerings') {
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
   * Build a statue
   */
  public buildStatue(player: Player): boolean {
    if (this.state.getPhase() !== 'action') {
      return false;
    }

    // Check if player is on a statue hex
    const currentCell = this.state.map.getCell(
      player.getShipPosition(),
    );
    if (!currentCell || currentCell.terrain !== 'statue') {
      return false;
    }

    return true;
  }

  /**
   * Complete a shrine quest
   */
  public completeShrineQuest(player: Player): boolean {
    if (this.state.getPhase() !== 'action') {
      return false;
    }

    // Check if player is on a shrine hex
    const currentCell = this.state.map.getCell(
      player.getShipPosition(),
    );
    if (!currentCell || currentCell.terrain !== 'shrine') {
      return false;
    }

    // Check if player has a statue of the required color
    const requiredColor = currentCell.color;
    if (!hasStatueOfColor(player, requiredColor)) {
      return false;
    }

    // Consume statue and complete shrine quest
    const success = removeStatueFromStorage(player, requiredColor);
    return success;
  }

  public actionGainFavor(): ResultWithMessage {
    const effectiveColor = this.state.getEffectiveSelectedColor();
    if (!effectiveColor) {
      return {
        success: false,
        message: 'Must select a die or card to gain favor',
      };
    }

    const player = this.state.getCurrentPlayer();
    player.favor += 2;

    const selectedDie = this.state.getSelectedDieColor() || undefined;
    const selectedCard = this.state.getSelectedOracleCardColor() || undefined;
    this.removeSpentResourceFromPlayer(player, selectedDie, selectedCard);
    this.state.clearResourceSelection();

    return {
      success: true,
      message: `Resource spent (${effectiveColor}); favor gained`,
    };
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

  public spendOracleCardForFavor(
    player: Player,
    cardColor: CoreColor,
  ): boolean {
    // Check if player has already used an oracle card this turn
    if (player.usedOracleCardThisTurn) {
      return false;
    }

    // Check if player has the specified oracle card
    if (!player.oracleCards.includes(cardColor)) {
      return false;
    }

    // Consume the oracle card - always consume the original card color
    const cardIndex = player.oracleCards.indexOf(cardColor);
    if (cardIndex !== -1) {
      player.oracleCards.splice(cardIndex, 1);
    } else {
      // This should not happen since we checked above, but log for debugging
      console.warn(
        `Attempted to consume oracle card ${cardColor} but it was not found in player's oracle cards: [${
          player.oracleCards.join(', ')
        }]`,
      );
      return false;
    }

    // Mark that player has used an oracle card this turn
    player.usedOracleCardThisTurn = true;

    // Gain 2 favor
    player.favor += 2;

    return true;
  }
}
