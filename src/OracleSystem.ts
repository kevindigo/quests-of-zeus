// Oracle card and recoloring logic for Quests of Zeus
import type { Player } from './Player.ts';
import { COLOR_WHEEL, type CoreColor, type HexColor } from './types.ts';

export class OracleSystem {
  private oracleCardDeck: CoreColor[] = [];

  constructor(oracleCardDeck: CoreColor[]) {
    this.oracleCardDeck = oracleCardDeck;
  }

  public static applyRecolor(original: CoreColor, favor: number): CoreColor {
    const originalIndex = COLOR_WHEEL.indexOf(original);
    const newIndex = (originalIndex + favor) % COLOR_WHEEL.length;
    const newColor = COLOR_WHEEL[newIndex];
    if (!newColor) {
      throw new Error(`Unable to recolor ${original} by ${favor}`);
    }
    return newColor;
  }

  public takeOracleCardFromDeck(): CoreColor | undefined {
    if (!this.oracleCardDeck || this.oracleCardDeck.length === 0) {
      return undefined;
    }
    return this.oracleCardDeck.pop();
  }

  /**
   * Draw an oracle card by spending any die during the action phase
   * The oracle card is drawn from the deck and added to the player's hand
   */
  public drawOracleCard(player: Player, dieColor: CoreColor): boolean {
    if (!this.oracleCardDeck || this.oracleCardDeck.length === 0) {
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
      console.warn(
        `Attempted to consume die ${dieColor} but it was not found in player's oracle dice: [${
          player.oracleDice.join(', ')
        }]`,
      );
      return false;
    }

    // Draw top oracle card from deck
    const card = this.oracleCardDeck.pop();
    if (!card) {
      console.warn('Oracle card deck is empty when trying to draw card.');
      return false;
    }

    // Add card to player's hand
    player.oracleCards.push(card);

    return true;
  }

  /**
   * Spend an oracle card to draw a new oracle card from the deck
   * Players can only use 1 oracle card per turn
   */
  public spendOracleCardToDrawCard(
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

    // Check if oracle card deck has cards
    if (!this.oracleCardDeck || this.oracleCardDeck.length === 0) {
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

    // Draw top oracle card from deck
    const newCard = this.oracleCardDeck.pop();
    if (!newCard) {
      console.warn('Oracle card deck is empty when trying to draw card.');
      return false;
    }

    // Add new card to player's hand
    player.oracleCards.push(newCard);

    // Mark that player has used an oracle card this turn
    player.usedOracleCardThisTurn = true;

    return true;
  }

  /**
   * Get the current oracle card deck
   */
  public getOracleCardDeck(): HexColor[] {
    return this.oracleCardDeck;
  }
}
