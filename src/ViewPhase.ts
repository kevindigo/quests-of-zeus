import type { GameState } from './GameState.ts';
import type { Player } from './Player.ts';
import { COLOR_WHEEL, type CoreColor } from './types.ts';
import { ViewPlayer } from './ViewPlayer.ts';

export class ViewPhase {
  public constructor(gameState: GameState) {
    this.gameState = gameState;
  }

  private getDiceAndOracleCardsContent() {
    const state = this.gameState;
    const currentPlayer = state.getCurrentPlayer();
    const selectedDie = state.getSelectedDieColor();
    const selectedCard = state.getSelectedOracleCardColor();
    const selectedColor = selectedDie || selectedCard;
    const content = `
              <div class="oracle-dice">
                <h4>Oracle Dice</h4>
                <div class="dice-container">
                  ${
      currentPlayer.oracleDice.map((color: string) => {
        const isSelected = selectedDie === color;
        return `<div class="die color-${color} ${
          isSelected ? 'selected-die' : ''
        }" 
                           style="background-color: ${
          ViewPlayer.getColorHex(color)
        }"
                           data-die-color="${color}">
                      ${ViewPlayer.getSymbol(color)}
                    </div>`;
      }).join('')
    }
                  ${
      currentPlayer.oracleDice.length === 0
        ? '<div class="no-dice">No dice rolled yet</div>'
        : ''
    }
                </div>
                ${
      selectedDie && currentPlayer.oracleDice.length > 0
        ? `<div class="selected-die-info">
                  Selected: 
                  <span class="color-swatch" 
                  style="background-color: ${
          ViewPlayer.getColorHex(selectedDie)
        }">      ${selectedDie}
                  </span>
                   <button id="clearDieSelection" class="action-btn secondary">Clear</button>
                 </div>`
        : ''
    }
              </div>
              <div class="oracle-cards">
                <h4>Oracle Cards</h4>
                <div class="cards-container">
                  ${
      currentPlayer.oracleCards.length === 0
        ? '<div class="no-cards">No oracle cards</div>'
        : ''
    }
                  ${
      currentPlayer.oracleCards.map((color: string) => {
        const isSelected = selectedCard === color;
        return `<div class="oracle-card color-${color} ${
          isSelected ? 'selected-oracle-card' : ''
        }" 
                             style="background-color: ${
          ViewPlayer.getColorHex(color)
        }" 
                             title="Oracle Card: ${color}"
                             data-oracle-card-color="${color}">
                      ${ViewPlayer.getSymbol(color)}
                    </div>`;
      }).join('')
    }
                </div>
                ${
      selectedCard && currentPlayer.oracleCards.length > 0
        ? `<div class="selected-oracle-card-info">
                  Selected Card: 
                  <span class="color-swatch" 
                    style="background-color: ${
          ViewPlayer.getColorHex(selectedCard)
        }">
                  </span>
                   ${selectedCard}
                   <button id="clearOracleCardSelection" class="action-btn secondary">Clear</button>
                 </div>`
        : ''
    }
              </div>
              ${
      (selectedDie || selectedCard) &&
        currentPlayer.favor > 0
        ? this.getRecolorOptionsContent(currentPlayer, selectedColor)
        : ''
    }
            </div>
          `;

    return content;
  }

  private getRecolorOptionsContent(
    player: Player,
    selectedColor: CoreColor | null,
  ): string {
    if (!selectedColor) {
      return '';
    }

    const currentIndex = COLOR_WHEEL.indexOf(selectedColor);

    if (currentIndex === -1) return '';

    let options = `
        <div class="recolor-section" style="margin-top: 1rem;">
          <h4>Recolor die or card`;

    // Add "No Recolor" option
    const hasRecolorIntention = this.gameState.getSelectedRecoloring() > 0;

    const originalColorBackground = ViewPlayer.getColorHex(selectedColor);
    const symbol = ViewPlayer.getSymbol(selectedColor);
    options += `
        <div class="recolor-option" style="margin-bottom: 0.5rem;">
          <label style="display: flex; align-items: center; gap: 0.5rem;">
            <input type="radio" name="recolorOption" value="0" ${
      !hasRecolorIntention ? 'checked' : ''
    } data-recolor-favor="0">
            0 -&gt;
            <span class="color-swatch" style="background-color: ${originalColorBackground}">
            ${symbol}
            </span>
          </label>
        </div>
      `;

    // Add recolor options
    for (
      let favorCost = 1;
      favorCost <= Math.min(player.favor, 5);
      favorCost++
    ) {
      const newIndex = (currentIndex + favorCost) % COLOR_WHEEL.length;
      const newColor = COLOR_WHEEL[newIndex]!;
      const background = ViewPlayer.getColorHex(newColor);
      const symbol = ViewPlayer.getSymbol(newColor);

      const isSelected = this.gameState.getSelectedRecoloring() === favorCost;

      options += `
          <div class="recolor-option" style="margin-bottom: 0.5rem;">
            <label style="display: flex; align-items: center; gap: 0.5rem;">
              <input type="radio" name="recolorOption" value="${favorCost}" ${
        isSelected ? 'checked' : ''
      } data-recolor-favor="${favorCost}">
              ${favorCost} -&gt; 
            <span class="color-swatch" style="background-color: ${background}">
            ${symbol}
            </span>
            </label>
          </div>
        `;
    }

    options += `
          </div>
        </div>
      `;

    return options;
  }

  public getPhasePanelContents(
    selectedDie: CoreColor | null,
    selectedCard: CoreColor | null,
  ): string {
    return `
        <div class="phase-info">
          <h3>Current Phase: ${this.gameState.getPhase().toUpperCase()}</h3>
          <div class="phase-actions">
            ${this.getPhaseActionsContents(selectedDie, selectedCard)}
          </div>
        </div>
      `;
  }

  private getPhaseActionsContents(
    selectedDie: CoreColor | null,
    selectedCard: CoreColor | null,
  ): string {
    switch (this.gameState.getPhase()) {
      case 'action': {
        let actions = '';
        actions +=
          `<button id="endTurn" class="action-button secondary">End Turn</button>`;

        const selectedColor = selectedDie || selectedCard;
        const disabledText = selectedColor ? '' : 'disabled';
        actions += `<div class="resource-actions" style="margin-top: 1rem;">
              <button id="spendResourceForFavor" 
                class="action-button" ${disabledText}>+2 Favor</button>
              <button id="drawOracleCard" 
                class="action-button" ${disabledText}>+Oracle Card</button>
            </div>`;

        actions += this.getDiceAndOracleCardsContent();
        if (!actions) {
          actions = '<p>Select a die or card to take an action</p>';
        }

        return actions;
      }
      default: {
        return '<p>Game phase not recognized</p>';
      }
    }
  }

  private gameState: GameState;
}
