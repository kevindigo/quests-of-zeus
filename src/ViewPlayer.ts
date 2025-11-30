import type { Player } from './Player.ts';
import type { QuestType } from './types.ts';

export class ViewPlayer {
  public getPlayerPanelContents(
    player: Player,
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
