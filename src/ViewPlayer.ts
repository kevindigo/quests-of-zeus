import type { Action } from './actions.ts';
import { GameEngine } from './GameEngine.ts';
import type { GameState } from './GameState.ts';
import type { Player } from './Player.ts';
import { COLOR_WHEEL, type CoreColor, type QuestType } from './types.ts';
import type { UiState } from './UiState.ts';

export class ViewPlayer {
  public getPlayerPanelContents(
    player: Player,
    gameState: GameState,
    uiState: UiState,
    availableActions: Action[],
  ): string {
    const content = `
      <div class="player-info">
        <h3>Current Player: ${player.name}</h3>
        <div class="player-stats">
          ${this.getPlayerStatsContents(player)}
        </div>
        <div class="storage">
          <h4>Ship cargo</h4>
          <div class="ship-cargo">
            ${this.getShipCargoContents(player)}
          </div>
        </div>
        <div class="player-gods-panel">
          ${
      this.getPlayerGodContents(player, gameState, uiState, availableActions)
    }
        </div>
        <div class="quest-types">
          ${this.getQuestContents(player)}
        </div>
      </div>`;

    return content;
  }

  private getPlayerStatsContents(player: Player): string {
    const playerColorHex = ViewPlayer.getColorHex(player.color);
    const playerColorName = player.color;
    return `
      <div><strong>Color:</strong> 
        <span class="color-swatch" 
        style="background-color: ${playerColorHex}">&nbsp;
        ${playerColorName}
        &nbsp;</span>
      </div>
      <div><strong>Favor:</strong> ${player.favor}</div>
      <div><strong>Shield:</strong> ${player.shield}</div>`;
  }

  public getShipCargoContents(player: Player) {
    const contentForEachItem = player.getLoadedItems().map((item) => {
      const className = item.type === 'cube'
        ? 'cargo-item-cube'
        : 'cargo-item-statue';
      return `<div 
        class="${className}" style="background-color: ${
        ViewPlayer.getColorHex(item.color)
      }">
        </div>`;
    });

    if (contentForEachItem.length === 0) {
      contentForEachItem.push('(none)');
    }
    return contentForEachItem.join('&nbsp');
  }

  private getQuestContents(player: Player) {
    return `
      <strong>Quests:</strong>
      <div class="quest-type-item">
        ${this.getColoredQuestContents(player, 'temple')}
        &nbsp;Temple
      </div>
      <div class="quest-type-item">
        ${this.getColoredQuestContents(player, 'monster')}
        &nbsp;Monster
      </div>
      <div class="quest-type-item">
        ${this.getColoredQuestContents(player, 'statue')}
        &nbsp;Statue
      </div>
      <div class="quest-type-item">
        ${this.getColoredQuestContents(player, 'shrine')}
        &nbsp;Shrine
      </div>`;
  }

  private getColoredQuestContents(
    currentPlayer: Player,
    questType: QuestType,
  ): string {
    const quests = currentPlayer.getQuests().filter((quest) => {
      return quest.type === questType;
    });
    const questTexts = quests.map((quest) => {
      const background = ViewPlayer.getColorHex(quest.color);
      const symbol = ViewPlayer.getSymbol(quest.color);
      const isCompleted = quest.isCompleted;
      const opacity = isCompleted ? '0.4' : '1.0';
      return `<span class="quest-color-icon" 
        style="background-color: ${background}; opacity: ${opacity}">
          ${symbol}
        </span>`;
    });

    const details = questTexts.join('&nbsp;');
    return `${details}`;
  }

  private getPlayerGodContents(
    player: Player,
    gameState: GameState,
    uiState: UiState,
    availableActions: Action[],
  ): string {
    let contents =
      '<div class="player-gods-header"><strong>Gods</strong></div>';
    contents += '<div class="player-gods-details">';
    COLOR_WHEEL.forEach((godColor) => {
      contents += this.getSinglePlayerGodContents(
        player,
        godColor,
        gameState,
        uiState,
        availableActions,
      );
    });
    contents += '</div>';
    return contents;
  }

  private getSinglePlayerGodContents(
    player: Player,
    color: CoreColor,
    gameState: GameState,
    uiState: UiState,
    availableActions: Action[],
  ): string {
    const level = player.getGodLevel(color);
    const maxLevel = GameEngine.getMaxGodLevel(gameState);
    const isAlreadyAtMax = level === maxLevel;
    const isBelowClouds = level === 0;
    const levelDisplay = isAlreadyAtMax
      ? this.getGodReadySymbol(color)
      : isBelowClouds
      ? '◇'
      : String(maxLevel - level);

    const selectedResource = uiState.getSelectedResource();
    const description = this.getGodDescription(color);
    const resourceAdvanceActions = availableActions.find((availableAction) => {
      return availableAction.type === 'resource' &&
        availableAction.subType === 'advanceGod' &&
        availableAction.spend.getEffectiveColor() === color &&
        availableAction.spend.equals(selectedResource);
    });
    const colorAdvanceActions = availableActions.find((availableAction) => {
      return availableAction.type === 'color' &&
        availableAction.subType === 'advanceGod' &&
        availableAction.color === color;
    });
    const isGodAdvanceAvailableClass = resourceAdvanceActions
      ? 'available-god-resource-advance'
      : colorAdvanceActions
      ? 'available-god-color-advance'
      : '';

    const availableActivateAction = availableActions.find((availableAction) => {
      return availableAction.type === 'color' &&
        availableAction.subType === 'activateGod' &&
        availableAction.color === color;
    });
    const isGodActionAvailableClass = availableActivateAction
      ? 'available-god-action'
      : '';

    return `
    <span class="god-entry-wrapper">
        <span class="god-level ${isGodActionAvailableClass}"
          data-color="${color}">
          ${levelDisplay}
        </span>
        <span class="god-square ${isGodAdvanceAvailableClass}" 
          data-color="${color}"
          style="background-color: ${ViewPlayer.getColorHex(color)};">
        </span>
        <span class="god-description">${description}</span>
    </span>`;
  }

  private getGodReadySymbol(color: CoreColor): string {
    switch (color) {
      case 'black':
        return '⚔️';
      case 'pink':
        return '🪶';
      case 'blue':
        return '🌊';
      case 'yellow':
        return '☀️';
      case 'green':
        return '🌲';
      case 'red':
        return '💖';
    }
  }

  private getGodDescription(color: CoreColor): string {
    switch (color) {
      case 'black':
        return 'Defeat monster';
      case 'pink':
        return 'Gain statue';
      case 'blue':
        return 'Move anywhere';
      case 'yellow':
        return 'Super turn';
      case 'green':
        return 'Explore any shrine';
      case 'red':
        return 'Heal all wounds';
    }

    return '';
  }

  public static getSymbol(color: string): string {
    const symbols: Record<string, string> = {
      'none': '🌈',
      'red': '♨️',
      'pink': '🌸',
      'blue': '🌀',
      'black': '➰',
      'green': '🌱',
      'yellow': '🔆',
    };
    return symbols[color] || '?';
  }

  public static getColorHex(color: string): string {
    const colorsAsHexValues: Record<string, string> = {
      none: '#D3D3D3',
      red: '#D62828',
      pink: '#FF69B4',
      blue: '#0072B2',
      black: '#000000',
      green: '#2CA02C',
      yellow: '#F2C94C',
    };
    return colorsAsHexValues[color] || '#333333';
  }
}
