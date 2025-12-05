import type { Action } from './actions.ts';
import type { GameState } from './GameState.ts';
import type { Player } from './Player.ts';
import type { Resource } from './Resource.ts';
import { COLOR_WHEEL } from './types.ts';
import type { UiState } from './UiState.ts';
import { ViewPlayer } from './ViewPlayer.ts';

export class ViewPlayerTurn {
  public constructor(gameState: GameState, uiState: UiState) {
    this.gameState = gameState;
    this.uiState = uiState;
  }

  public getPlayerTurnPanelContents(availableActions: Action[]): string {
    return `
        <div class="player-turn-info">
          <h3>
            Phase: ${this.gameState.getPhaseName()}
            <button id="endTurn" 
              class="action-button secondary" 
              ${this.getEndTurnStatus(availableActions)}>
              End Turn
            </button>
          </h3>
          <div class="player-turn-actions">
            ${this.getPlayerTurnButtonContents(availableActions)}
            ${this.getDiceAndOracleCardsContent()}
          </div>
        </div>
      `;
  }

  private getPlayerTurnButtonContents(availableActions: Action[]): string {
    return `
      <div class="resource-actions" style="margin-bottom: 1rem;">
        <button id="spendResourceForFavor" 
          class="action-button" 
          ${this.getFavorButtonStatus(availableActions)}>
            +2 Favor
        </button>
        <button id="drawOracleCard"              
          class="action-button" 
          ${this.getCardButtonStatus(availableActions)}>
            +Oracle Card
        </button>
        <button id="peekShrine"              
          class="action-button" 
          ${this.getPeekButtonStatus(availableActions)}>
            Peek 2
        </button>
      </div>`;
  }

  private getFavorButtonStatus(availableActions: Action[]): string {
    const selectedResource = this.uiState.getSelectedResource();
    const canGainFavor = availableActions.find((action) => {
      return action.type === 'resource' && action.subType === 'gainFavor' &&
        action.spend.equals(selectedResource);
    });
    return canGainFavor ? '' : 'disabled';
  }

  private getCardButtonStatus(availableActions: Action[]): string {
    const selectedResource = this.uiState.getSelectedResource();
    const canGainCard = availableActions.find((action) => {
      return action.type === 'resource' &&
        action.subType === 'gainOracleCard' &&
        action.spend.equals(selectedResource);
    });
    return canGainCard ? '' : 'disabled';
  }

  private getPeekButtonStatus(availableActions: Action[]): string {
    const selectedResource = this.uiState.getSelectedResource();
    const canPeek = availableActions.find((action) => {
      return action.type === 'resource' &&
        action.subType === 'gainTwoPeeks' &&
        action.spend.equals(selectedResource);
    });
    return canPeek ? '' : 'disabled';
  }

  private getEndTurnStatus(availableActions: Action[]): string {
    const canEndTurn = availableActions.find((action) => {
      return action.type === 'free' &&
        action.subType === 'endTurn';
    });
    return canEndTurn ? '' : 'disabled';
  }

  private getDiceAndOracleCardsContent() {
    const state = this.gameState;
    const currentPlayer = state.getCurrentPlayer();
    const selectedResource = this.uiState.getSelectedResource();
    const selectedDie = selectedResource.isDie()
      ? selectedResource.getBaseColor()
      : null;
    const selectedCard = selectedResource.isCard()
      ? selectedResource.getBaseColor()
      : null;
    const content = `
      <div class="oracle-dice">
        <h4>
          Oracle Dice
        </h4>
        <div class="dice-container">
          ${
      currentPlayer.oracleDice.map((color: string) => {
        const isSelected = selectedDie === color;
        return `<div 
          class="die die-color-icon color-${color} ${
          isSelected ? 'selected-resource' : ''
        }" 
            style="background-color: ${ViewPlayer.getColorHex(color)}"
            data-die-color="${color}">
              ${ViewPlayer.getSymbol(color)}
        </div>`;
      }).join('')
    }
        </div>
        <br/>
        </div>
        <div class="oracle-cards">
          <h4>
            Oracle Cards
          </h4>
          <div class="cards-container">
            ${
      currentPlayer.oracleCards.length === 0
        ? '<div class="no-cards">No oracle cards</div>'
        : ''
    }
                  ${
      currentPlayer.oracleCards.map((color: string) => {
        const isSelected = selectedCard === color;
        return `<div 
          class="oracle-card card-color-icon color-${color} ${
          isSelected ? 'selected-resource' : ''
        }" 
           style="background-color: ${ViewPlayer.getColorHex(color)}" 
          title="Oracle Card: ${color}"
          data-oracle-card-color="${color}">
          ${ViewPlayer.getSymbol(color)}
        </div>`;
      }).join('')
    }
          </div>
        </div>
        ${this.getRecolorOptionsContent(currentPlayer, selectedResource)}
      </div>
    `;

    return content;
  }

  private getRecolorOptionsContent(
    player: Player,
    selectedResource: Resource,
  ): string {
    if (!selectedResource.hasColor()) {
      return '';
    }

    const useColor = selectedResource.getBaseColor();

    const currentIndex = COLOR_WHEEL.indexOf(useColor);

    if (currentIndex === -1) return '';

    let options = `
        <div class="recolor-section" style="margin-top: 1rem;">
          <h4>Recolor die or card`;

    // Add "No Recolor" option
    const hasRecolorIntention = this.uiState.getSelectedRecoloring() > 0;

    const originalColorBackground = ViewPlayer.getColorHex(useColor);
    const symbol = ViewPlayer.getSymbol(useColor);
    options += `
        <div class="recolor-option" style="margin-bottom: 0.5rem;">
          <label style="display: flex; align-items: center; gap: 0.5rem;">
            <input type="radio" name="recolorOption" value="0" 
            ${!hasRecolorIntention ? 'checked' : ''} 
            ${!selectedResource.hasColor() ? 'disabled' : ''}
            data-recolor-favor="0">
            0 -&gt;
            <span class="color-swatch" style="background-color: ${originalColorBackground}">
            ${symbol}
            </span>
          </label>
        </div>
      `;

    const maxFavorToShow = player.favor;
    // Add recolor options
    for (
      let favorCost = 1;
      favorCost <= maxFavorToShow;
      favorCost++
    ) {
      const newIndex = (currentIndex + favorCost) % COLOR_WHEEL.length;
      const newColor = COLOR_WHEEL[newIndex]!;
      const background = ViewPlayer.getColorHex(newColor);
      const symbol = ViewPlayer.getSymbol(newColor);

      const isSelected = this.uiState.getSelectedRecoloring() === favorCost;

      options += `
          <div class="recolor-option" style="margin-bottom: 0.5rem;">
            <label style="display: flex; align-items: center; gap: 0.5rem;">
              <input type="radio" name="recolorOption" value="${favorCost}" 
              ${isSelected ? 'checked' : ''} 
              ${
        !selectedResource.hasColor() || favorCost > player.favor
          ? 'disabled'
          : ''
      }
              data-recolor-favor="${favorCost}">
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

  private gameState: GameState;
  private uiState: UiState;
}
