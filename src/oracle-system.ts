// Oracle card and recoloring logic for Quests of Zeus
import type { HexColor, Player } from "./types.ts";

export class OracleSystem {
  private oracleCardDeck: HexColor[] = [];

  constructor(oracleCardDeck: HexColor[]) {
    this.oracleCardDeck = oracleCardDeck;
  }

  /**
   * Set recoloring intention for a die during the action phase
   * For each favor spent, advance the color one position along the color wheel
   * Color wheel: black → pink → blue → yellow → green → red → black
   * The favor is not spent until the die is actually used
   */
  public setRecolorIntention(
    player: Player,
    dieColor: HexColor,
    favorSpent: number,
  ): boolean {
    // Check if player has the specified die
    if (!player.oracleDice.includes(dieColor)) {
      return false;
    }

    // Check if player has enough favor
    if (player.favor < favorSpent) {
      return false;
    }

    // Define the color wheel order
    const colorWheel: HexColor[] = [
      "black",
      "pink",
      "blue",
      "yellow",
      "green",
      "red",
    ];

    // Find current color position
    const currentIndex = colorWheel.indexOf(dieColor);
    if (currentIndex === -1) {
      return false; // Invalid color
    }

    // Calculate new color position (wrapping around)
    const newIndex = (currentIndex + favorSpent) % colorWheel.length;
    const newColor = colorWheel[newIndex]!;

    // Store recoloring intention (favor is not spent yet)
    player.recoloredDice[dieColor] = {
      newColor,
      favorCost: favorSpent,
    };

    return true;
  }

  /**
   * Set recoloring intention for an oracle card during the action phase
   * For each favor spent, advance the color one position along the color wheel
   * Color wheel: black → pink → blue → yellow → green → red → black
   * The favor is not spent until the card is actually used
   */
  public setRecolorIntentionForCard(
    player: Player,
    cardColor: HexColor,
    favorSpent: number,
  ): boolean {
    // Check if player has the specified oracle card
    if (!player.oracleCards.includes(cardColor)) {
      return false;
    }

    // Check if player has enough favor
    if (player.favor < favorSpent) {
      return false;
    }

    // Define the color wheel order
    const colorWheel: HexColor[] = [
      "black",
      "pink",
      "blue",
      "yellow",
      "green",
      "red",
    ];

    // Find current color position
    const currentIndex = colorWheel.indexOf(cardColor);
    if (currentIndex === -1) {
      return false; // Invalid color
    }

    // Calculate new color position (wrapping around)
    const newIndex = (currentIndex + favorSpent) % colorWheel.length;
    const newColor = colorWheel[newIndex]!;

    // Store recoloring intention (favor is not spent yet)
    player.recoloredCards = player.recoloredCards || {};
    player.recoloredCards[cardColor] = {
      newColor,
      favorCost: favorSpent,
    };

    return true;
  }

  /**
   * Clear recoloring intention for a die
   */
  public clearRecolorIntention(player: Player, dieColor: HexColor): boolean {
    delete player.recoloredDice[dieColor];
    return true;
  }

  /**
   * Clear recoloring intention for an oracle card
   */
  public clearRecolorIntentionForCard(
    player: Player,
    cardColor: HexColor,
  ): boolean {
    if (player.recoloredCards) {
      delete player.recoloredCards[cardColor];
    }
    return true;
  }

  /**
   * Apply recoloring when a die is used (e.g., for movement)
   * This is where the favor is actually spent
   */
  public applyRecoloring(player: Player, dieColor: HexColor): boolean {
    const recoloring = player.recoloredDice[dieColor];
    if (!recoloring) {
      return false; // No recoloring intention for this die
    }

    // Check if player still has enough favor
    if (player.favor < recoloring.favorCost) {
      return false;
    }

    // Replace the die with the new color
    const dieIndex = player.oracleDice.indexOf(dieColor);
    if (dieIndex !== -1) {
      player.oracleDice[dieIndex] = recoloring.newColor;
    } else {
      // This should not happen since we checked above, but log for debugging
      console.warn(
        `Attempted to apply recoloring to die ${dieColor} but it was not found in player's oracle dice: [${
          player.oracleDice.join(", ")
        }]`,
      );
      return false;
    }

    // Spend favor
    player.favor -= recoloring.favorCost;

    // Clear the recoloring intention
    delete player.recoloredDice[dieColor];

    return true;
  }

  /**
   * Apply recoloring when an oracle card is used (e.g., for movement)
   * This is where the favor is actually spent
   */
  public applyRecoloringForCard(player: Player, cardColor: HexColor): boolean {
    if (!player.recoloredCards || !player.recoloredCards[cardColor]) {
      return false; // No recoloring intention for this card
    }

    const recoloring = player.recoloredCards[cardColor];

    // Check if player still has enough favor
    if (player.favor < recoloring.favorCost) {
      return false;
    }

    // Replace the card with the new color
    const cardIndex = player.oracleCards.indexOf(cardColor);
    if (cardIndex !== -1) {
      player.oracleCards[cardIndex] = recoloring.newColor;
    } else {
      // This should not happen since we checked above, but log for debugging
      console.warn(
        `Attempted to apply recoloring to oracle card ${cardColor} but it was not found in player's oracle cards: [${
          player.oracleCards.join(", ")
        }]`,
      );
      return false;
    }

    // Spend favor
    player.favor -= recoloring.favorCost;

    // Clear the recoloring intention
    delete player.recoloredCards[cardColor];

    return true;
  }

  /**
   * Draw an oracle card by spending any die during the action phase
   * The oracle card is drawn from the deck and added to the player's hand
   */
  public drawOracleCard(player: Player, dieColor: HexColor): boolean {
    if (!this.oracleCardDeck || this.oracleCardDeck.length === 0) {
      return false;
    }

    // Check if player has the specified die
    if (!player.oracleDice.includes(dieColor)) {
      return false;
    }

    // Apply recoloring if there's an intention for this die
    const originalDieColor = dieColor;
    if (player.recoloredDice && player.recoloredDice[dieColor]) {
      const recoloringApplied = this.applyRecoloring(player, dieColor);
      if (recoloringApplied) {
        dieColor = player.recoloredDice[originalDieColor]?.newColor || dieColor;
      }
    }

    // Consume the oracle die - use the current dieColor after recoloring
    const dieIndex = player.oracleDice.indexOf(dieColor);
    if (dieIndex !== -1) {
      player.oracleDice.splice(dieIndex, 1);
    } else {
      console.warn(
        `Attempted to consume die ${dieColor} but it was not found in player's oracle dice: [${
          player.oracleDice.join(", ")
        }]`,
      );
      return false;
    }

    // Draw top oracle card from deck
    const card = this.oracleCardDeck.pop();
    if (!card) {
      console.warn("Oracle card deck is empty when trying to draw card.");
      return false;
    }

    // Add card to player's hand
    player.oracleCards.push(card);

    return true;
  }

  /**
   * Spend an oracle card as if it were a die for movement
   * Players can only use 1 oracle card per turn
   */
  public spendOracleCardForMovement(
    player: Player,
    _targetQ: number,
    _targetR: number,
    cardColor: HexColor,
    _favorSpent?: number,
  ): { success: boolean; error?: string } {
    // Check if player has already used an oracle card this turn
    if (player.usedOracleCardThisTurn) {
      return {
        success: false,
        error: "You can only use 1 oracle card per turn",
      };
    }

    // Check if player has the specified oracle card
    if (!player.oracleCards.includes(cardColor)) {
      return {
        success: false,
        error: `You don't have a ${cardColor} oracle card available`,
      };
    }

    // Apply recoloring if there's an intention for this card
    const _originalCardColor = cardColor;
    if (player.recoloredCards && player.recoloredCards[cardColor]) {
      const recoloringApplied = this.applyRecoloringForCard(player, cardColor);
      if (recoloringApplied) {
        // Card color is updated in the player's oracleCards array
      }
    }

    // Consume the oracle card - always consume the original card color
    const cardIndex = player.oracleCards.indexOf(cardColor);
    if (cardIndex !== -1) {
      player.oracleCards.splice(cardIndex, 1);
    } else {
      // This should not happen since we checked above, but log for debugging
      console.warn(
        `Attempted to consume oracle card ${cardColor} but it was not found in player's oracle cards: [${
          player.oracleCards.join(", ")
        }]`,
      );
      return {
        success: false,
        error: "Unexpected error: oracle card not found after validation",
      };
    }

    // Mark that player has used an oracle card this turn
    player.usedOracleCardThisTurn = true;

    return { success: true };
  }

  /**
   * Spend an oracle card to gain 2 favor during the action phase
   * Players can only use 1 oracle card per turn
   */
  public spendOracleCardForFavor(player: Player, cardColor: HexColor): boolean {
    // Check if player has already used an oracle card this turn
    if (player.usedOracleCardThisTurn) {
      return false;
    }

    // Check if player has the specified oracle card
    if (!player.oracleCards.includes(cardColor)) {
      return false;
    }

    // Apply recoloring if there's an intention for this card
    const _originalCardColor = cardColor;
    if (player.recoloredCards && player.recoloredCards[cardColor]) {
      const recoloringApplied = this.applyRecoloringForCard(player, cardColor);
      if (recoloringApplied) {
        // Card color is updated in the player's oracleCards array
      }
    }

    // Consume the oracle card - always consume the original card color
    const cardIndex = player.oracleCards.indexOf(cardColor);
    if (cardIndex !== -1) {
      player.oracleCards.splice(cardIndex, 1);
    } else {
      // This should not happen since we checked above, but log for debugging
      console.warn(
        `Attempted to consume oracle card ${cardColor} but it was not found in player's oracle cards: [${
          player.oracleCards.join(", ")
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

  /**
   * Spend an oracle card to draw a new oracle card from the deck
   * Players can only use 1 oracle card per turn
   */
  public spendOracleCardToDrawCard(
    player: Player,
    cardColor: HexColor,
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

    // Apply recoloring if there's an intention for this card
    const _originalCardColor = cardColor;
    if (player.recoloredCards && player.recoloredCards[cardColor]) {
      const recoloringApplied = this.applyRecoloringForCard(player, cardColor);
      if (recoloringApplied) {
        // Card color is updated in the player's oracleCards array
      }
    }

    // Consume the oracle card - always consume the original card color
    const cardIndex = player.oracleCards.indexOf(cardColor);
    if (cardIndex !== -1) {
      player.oracleCards.splice(cardIndex, 1);
    } else {
      // This should not happen since we checked above, but log for debugging
      console.warn(
        `Attempted to consume oracle card ${cardColor} but it was not found in player's oracle cards: [${
          player.oracleCards.join(", ")
        }]`,
      );
      return false;
    }

    // Draw top oracle card from deck
    const newCard = this.oracleCardDeck.pop();
    if (!newCard) {
      console.warn("Oracle card deck is empty when trying to draw card.");
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
