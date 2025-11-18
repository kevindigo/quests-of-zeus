import type { GameState } from './GameState.ts';
import type { Player } from './Player.ts';
import { COLOR_WHEEL, type CoreColor } from './types.ts';

export class ViewGame {
  public constructor(gameState: GameState) {
    this.gameState = gameState;
  }

  public getPlayerPanelContents(
    currentPlayer: Player,
    selectedDie: CoreColor | null,
    selectedCard: CoreColor | null,
  ): string {
    const selectedColor = selectedDie || selectedCard;
    const playerColor = this.getColorHex(currentPlayer.color);
    return `
          <div class="player-info">
            <h3>Current Player: ${currentPlayer.name}</h3>
            <div class="player-stats">
              <div><strong>Color:</strong> 
                <span class="color-swatch" style="background-color: ${playerColor}">
                ${
      currentPlayer.color.charAt(0).toUpperCase() +
      currentPlayer.color.slice(1)
    }
                </span>
              </div>
              <div><strong>Favor:</strong> ${currentPlayer.favor}</div>
              <div><strong>Shield:</strong> ${currentPlayer.shield}</div>
            </div>
            <div class="quest-progress">
              <h4>Quest Progress</h4>
              <div class="quest-types">
                <div class="quest-type-item">Temple Offering: ${currentPlayer.completedQuestTypes.temple_offering}/3</div>
                <div class="quest-type-item">Monster: ${currentPlayer.completedQuestTypes.monster}/3</div>
                <div class="quest-type-item">Statue: ${currentPlayer.completedQuestTypes.statue}/3</div>
                <div class="quest-type-item">Shrine: ${currentPlayer.completedQuestTypes.shrine}/3</div>
              </div>
            </div>
            <div class="storage">
              <h4>Storage (2 slots)</h4>
              <div class="storage-slots">
              </div>
            </div>
            <div class="oracle-dice">
              <h4>Oracle Dice</h4>
              <div class="dice-container">
                ${
      currentPlayer.oracleDice.map((color: string) => {
        const isSelected = selectedDie === color;
        return `<div class="die color-${color} ${
          isSelected ? 'selected-die' : ''
        }" 
                         style="background-color: ${this.getColorHex(color)}"
                         data-die-color="${color}">
                    ${color.charAt(0).toUpperCase()}
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
                 Selected: <span class="color-swatch" style="background-color: ${
          this.getColorHex(selectedDie)
        }"></span>
                 ${selectedDie}
                 <button id="clearDieSelection" class="action-btn secondary">Clear</button>
               </div>`
        : ''
    }
            </div>
            <div class="oracle-cards">
              <h4>Oracle Cards</h4>
              <div class="oracle-cards-container">
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
                           style="background-color: ${this.getColorHex(color)}" 
                           title="Oracle Card: ${color}"
                           data-oracle-card-color="${color}">
                    ${color.charAt(0).toUpperCase()}
                  </div>`;
      }).join('')
    }
              </div>
              ${
      selectedCard && currentPlayer.oracleCards.length > 0
        ? `<div class="selected-oracle-card-info">
                 Selected Oracle Card: <span class="color-swatch" style="background-color: ${
          this.getColorHex(selectedCard)
        }"></span>
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
    const hasRecolorIntention =
      this.gameState.getRecolorIntention(player.id) > 0;

    options += `
      <div class="recolor-option" style="margin-bottom: 0.5rem;">
        <label style="display: flex; align-items: center; gap: 0.5rem;">
          <input type="radio" name="recolorOption" value="0" ${
      !hasRecolorIntention ? 'checked' : ''
    } data-recolor-favor="0">
          <span class="color-swatch" style="background-color: ${
      this.getColorHex(selectedColor)
    }"></span>
          Keep ${selectedColor} (0 favor)
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

      const isSelected =
        this.gameState.getRecolorIntention(player.id) === favorCost;

      options += `
        <div class="recolor-option" style="margin-bottom: 0.5rem;">
          <label style="display: flex; align-items: center; gap: 0.5rem;">
            <input type="radio" name="recolorOption" value="${favorCost}" ${
        isSelected ? 'checked' : ''
      } data-recolor-favor="${favorCost}">
            ${favorCost} -&gt; <span class="color-swatch" style="background-color: ${
        this.getColorHex(newColor)
      }">${newColor}</span>
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
    const currentPlayer = this.gameState.getCurrentPlayer();

    switch (this.gameState.getPhase()) {
      case 'action': {
        const position = currentPlayer.getShipPosition();
        const currentCell = this.gameState.map.getCell(
          position,
        );

        let actions = '';

        const selectedColor = selectedDie || selectedCard;
        if (selectedColor) {
          actions += `<div class="resource-actions" style="margin-top: 1rem;">
            <h4>Resource Actions</h4>
            <button id="spendResourceForFavor" class="action-btn">Spend for 2 Favor</button>
            <button id="drawOracleCard" class="action-btn">Draw Oracle Card</button>
            <p style="font-size: 0.9rem; opacity: 0.8;">Spend selected resource for favor or to draw an oracle card</p>
          </div>`;

          // Recolor options for selected resource
          // Note: Recolor options are now displayed in the player info panel as radio buttons
          // The favor will be spent when the resource is actually used for movement or other actions

          if (currentCell?.terrain === 'offerings') {
            actions +=
              `<button id="collectOffering" class="action-btn">Collect Offering</button>`;
          }
          if (currentCell?.terrain === 'monsters') {
            actions +=
              `<button id="fightMonster" class="action-btn">Fight Monster</button>`;
          }
          if (currentCell?.terrain === 'temple') {
            actions +=
              `<button id="buildTemple" class="action-btn">Build Temple</button>`;
          }
          if (currentCell?.terrain === 'statue') {
            actions +=
              `<button id="buildStatue" class="action-btn">Build Statue</button>`;
          }
          if (currentCell?.terrain === 'shrine') {
            actions +=
              `<button id="completeShrineQuest" class="action-btn">Complete Shrine Quest</button>`;
          }
          if (currentCell?.terrain === 'city') {
            // not implemented yet
          }
        }

        if (!actions) {
          actions = '<p>Select a die or card to take an action</p>';
        }

        actions +=
          `<button id="endTurn" class="action-btn secondary">End Turn</button>`;
        return actions;
      }
      default: {
        return '<p>Game phase not recognized</p>';
      }
    }
  }

  private getColorHex(color: string): string {
    const colors: Record<string, string> = {
      'red': '#DC143C',
      'pink': '#ff69b4',
      'blue': '#0000ff',
      'black': '#000000',
      'green': '#008000',
      'yellow': '#ffff00',
    };
    return colors[color] || '#333333';
  }

  private gameState: GameState;
}
