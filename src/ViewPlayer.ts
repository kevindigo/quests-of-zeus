import type { Player } from './Player.ts';
import type { QuestType } from './types.ts';

export class ViewPlayer {
  public getPlayerPanelContents(
    currentPlayer: Player,
  ): string {
    const playerColor = ViewPlayer.getColorHex(currentPlayer.color);
    const content = `
          <div class="player-info">
            <h3>Current Player: ${currentPlayer.name}</h3>
            <div class="player-stats">
              <div><strong>Color:</strong> 
                <span class="color-swatch" 
                style="background-color: ${playerColor}">&nbsp;
                ${
      currentPlayer.color.charAt(0).toUpperCase() +
      currentPlayer.color.slice(1)
    }
                &nbsp;</span>
              </div>
              <div><strong>Favor:</strong> ${currentPlayer.favor}</div>
              <div><strong>Shield:</strong> ${currentPlayer.shield}</div>
            </div>
            <div class="quest-types">
            <strong>Quests:</strong>
              <div class="quest-type-item">
              ${this.getColoredQuestContents(currentPlayer, 'temple')}
              &nbsp;Temple
              </div>
              <div class="quest-type-item">
                ${this.getColoredQuestContents(currentPlayer, 'monster')}
                &nbsp;Monster
                </div>
              <div class="quest-type-item">
                ${this.getColoredQuestContents(currentPlayer, 'statue')}
                &nbsp;Statue
                </div>
              <div class="quest-type-item">
                ${this.getColoredQuestContents(currentPlayer, 'shrine')}
                &nbsp;Shrine
              </div>
            </div>
            <div class="storage">
              <h4>Storage (2 slots)</h4>
              <div class="storage-slots">
              </div>
            </div>`;

    return content;
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
      const opacity = isCompleted ? '0.2' : '1.0';
      return `<span class="quest-color-icon" 
        style="background-color: ${background}; opacity: ${opacity}">
          ${symbol}
        </span>`;
    });

    const details = questTexts.join('&nbsp;');
    return `${details}`;
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
    const colors: Record<string, string> = {
      'none': 'white',
      'red': '#DC143C',
      'pink': '#ff69b4',
      'blue': '#0000ff',
      'black': '#000000',
      'green': '#008000',
      'yellow': '#ffff00',
    };
    return colors[color] || '#333333';
  }
}
