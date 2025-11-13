// Game Controller for Quests of Zeus with Unified Resource Selection
// Manages the game UI and user interactions

import { QuestsZeusGameEngine } from './game-engine.ts';
import type { CoreColor, HexColor } from './types.ts';

// Type declarations for DOM APIs (for Deno type checking)

export class GameController {
  private gameEngine: QuestsZeusGameEngine;
  private selectedResourceType: 'die' | 'card' | null = null;
  private selectedResourceColor: HexColor | null = null;

  constructor() {
    this.gameEngine = new QuestsZeusGameEngine();
  }

  public initializeGameUI(): void {
    this.showWelcomeScreen();
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    // Setup event listeners for game controls
    const startGameButton = document.getElementById('startGame');
    if (startGameButton) {
      startGameButton.addEventListener('click', () => {
        this.startNewGame();
      });
    }

    // Setup resource selection event listeners
    this.setupResourceSelectionListeners();
  }

  private setupResourceSelectionListeners(): void {
    // This would be called when the DOM is updated to attach event listeners
    // to resource elements (dice and cards)
    document.addEventListener('click', (event) => {
      const target = event.target as HTMLElement;
      if (target.classList.contains('resource-item')) {
        const resourceType = target.getAttribute('data-resource-type');
        const resourceColor = target.getAttribute(
          'data-resource-color',
        ) as CoreColor;
        if (resourceType && resourceColor) {
          this.selectResource(resourceType, resourceColor);
        }
      }
    });

    // Clear resource selection
    document.addEventListener('click', (event) => {
      const target = event.target as HTMLElement;
      if (target.id === 'clearResourceSelection') {
        this.clearResourceSelection();
      }
    });
  }

  private startNewGame(): void {
    this.gameEngine.initializeGame();
    this.renderGameState();
  }

  private showWelcomeScreen(): void {
    const playerInfoContainer = document.getElementById('playerInfo');
    const questInfoContainer = document.getElementById('questInfo');
    const phaseDisplay = document.getElementById('phaseDisplay');
    const hexMapContainer = document.getElementById('hexMapSVG');

    if (playerInfoContainer) {
      playerInfoContainer.innerHTML = `
        <div class="welcome-screen">
          <h3>Welcome to Quests of Zeus</h3>
          <p>A strategic board game of ancient Greece</p>
          <button id="startGame" class="action-btn">Start New Game</button>
          <div class="game-info">
            <h4>How to Play:</h4>
            <ul>
              <li>Oracle dice are rolled automatically at the end of each turn</li>
              <li>Move your ship across the sea and land hexes using dice colors</li>
              <li>Spend favor to extend your movement range (1 extra hex per favor spent)</li>
              <li>Recolor dice by spending favor (1 favor per color advancement)</li>
              <li>Collect cubes and statues, fight monsters, and build temples</li>
              <li>Spend dice to draw oracle cards, then use them as dice (1 per turn)</li>
              <li>Complete quests to win the game</li>
              <li>First player to complete 3 of each quest type (Temple Offering, Monster, Foundation, Cloud) wins!</li>
            </ul>
          </div>
        </div>
      `;
    }

    if (questInfoContainer) {
      questInfoContainer.innerHTML = `
        <div class="game-rules">
          <h3>Game Rules</h3>
          <div class="rules-section">
            <h4>Phases:</h4>
            <ul>
              <li><strong>Action Phase:</strong> Select a resource (die or card) and perform actions (move, collect offerings, fight monsters, etc.)</li>
              <li><strong>End of Turn:</strong> Dice are automatically rolled for the next player</li>
              <li>You can change your selected resource before making a move</li>
              <li>You can recolor dice by spending favor (1 favor per color advancement)</li>
              <li>Color wheel: black → pink → blue → yellow → green → red → black</li>
            </ul>
          </div>
        </div>
      `;
    }

    if (phaseDisplay) {
      phaseDisplay.innerHTML = `
        <div class="phase-info">
          <h3>Ready to Begin</h3>
          <p>Click "Start New Game" to begin your adventure!</p>
        </div>
      `;
    }

    if (hexMapContainer) {
      hexMapContainer.innerHTML = `
        <div class="welcome-map">
          <p>Game map will appear here when you start a new game</p>
        </div>
      `;
    }
  }

  private renderGameState(): void {
    if (!this.gameEngine.isGameInitialized()) {
      this.showWelcomeScreen();
      return;
    }

    const gameState = this.gameEngine.getGameState();

    // Update player info display
    this.updatePlayerInfo(gameState);

    // Render the map with player positions
    this.renderMap(gameState);

    // Update game phase display
    this.updatePhaseDisplay(gameState.phase);

    // Check for win condition
    const winCondition = this.gameEngine.checkWinCondition();
    if (winCondition.gameOver) {
      this.showGameOver(winCondition.winner!.name);
    }
  }

  private updatePlayerInfo(_gameState: unknown): void {
    const playerInfoContainer = document.getElementById('playerInfo');
    if (!playerInfoContainer) return;

    // Get current player for display
    const _currentPlayer = this.gameEngine.getCurrentPlayer();

    playerInfoContainer.innerHTML = `
      <div class="player-info">
        <h3>Current Player: ${_currentPlayer.name}</h3>
        <div class="player-stats">
          <div><strong>Color:</strong> 
            <span class="color-swatch" style="background-color: ${
      this.getColorHex(_currentPlayer.color)
    }"></span>
            ${
      _currentPlayer.color.charAt(0).toUpperCase() +
      _currentPlayer.color.slice(1)
    }
          </div>
          <div><strong>Completed Quests:</strong> ${_currentPlayer.completedQuests}/12</div>
          <div><strong>Favor:</strong> ${_currentPlayer.favor}</div>
          <div><strong>Shield:</strong> ${_currentPlayer.shield}</div>
        </div>
        <div class="quest-progress">
          <h4>Quest Progress</h4>
          <div class="quest-types">
            <div class="quest-type-item">Temple Offering: ${_currentPlayer.completedQuestTypes.temple_offering}/3</div>
            <div class="quest-type-item">Monster: ${_currentPlayer.completedQuestTypes.monster}/3</div>
            <div class="quest-type-item">Foundation: ${_currentPlayer.completedQuestTypes.foundation}/3</div>
            <div class="quest-type-item">Cloud: ${_currentPlayer.completedQuestTypes.cloud}/3</div>
          </div>
        </div>
        <div class="storage">
          <h4>Storage (2 slots)</h4>
          <div class="storage-slots">
            ${
'?'    }
          </div>
        </div>
        <div class="resources-section">
          <h4>Resources</h4>
          <div class="resource-selection">
            <div class="resource-type">
              <h5>Oracle Dice</h5>
              <div class="dice-container">
                ${
      _currentPlayer.oracleDice.length === 0
        ? '<div class="no-resources">No dice rolled yet</div>'
        : _currentPlayer.oracleDice.map((color: string) => {
          const isSelected = this.selectedResourceType === 'die' &&
            this.selectedResourceColor === color;
          return `<div class="resource-item die color-${color} ${
            isSelected ? 'selected-resource' : ''
          }" 
                     style="background-color: ${this.getColorHex(color)}"
                     data-resource-type="die"
                     data-resource-color="${color}"
                     title="Oracle Die: ${color}">
                ${color.charAt(0).toUpperCase()}
              </div>`;
        }).join('')
    }
            </div>
            </div>
            <div class="resource-type">
              <h5>Oracle Cards</h5>
              <div class="cards-container">
                ${
      _currentPlayer.oracleCards.length === 0
        ? '<div class="no-resources">No oracle cards</div>'
        : ''
    }
                ${
      _currentPlayer.oracleCards.map((color: string, _index: number) => {
        const isSelected = this.selectedResourceType === 'card' &&
          this.selectedResourceColor === color;
        return `<div class="resource-item card color-${color} ${
          isSelected ? 'selected-resource' : ''
        }" 
                           style="background-color: ${this.getColorHex(color)}" 
                           data-resource-type="card"
                           data-resource-color="${color}"
                           title="Oracle Card: ${color}">
                    ${color.charAt(0).toUpperCase()}
                  </div>`;
      }).join('')
    }
              </div>
            </div>
          </div>
          ${
      this.selectedResourceType && this.selectedResourceColor
        ? `<div class="selected-resource-info">
             Selected ${this.selectedResourceType}: <span class="color-swatch" style="background-color: ${
          this.getColorHex(this.selectedResourceColor)
        }"></span>
             ${this.selectedResourceColor}
             <button id="clearResourceSelection" class="action-btn secondary">Clear</button>
           </div>`
        : ''
    }
          ${
      this.selectedResourceType === 'die' && this.selectedResourceColor &&
        _currentPlayer.favor > 0
        ? this.renderRecolorOptions(_currentPlayer)
        : ''
    }
        </div>
      </div>
    `;
  }

  private renderMap(_gameState: unknown): void {
    // This would render the hex map with player positions and available moves
    const hexMapContainer = document.getElementById('hexMapSVG');
    if (!hexMapContainer) return;

    hexMapContainer.innerHTML = `
      <div class="map-placeholder">
        <p>Game map rendering would go here</p>
        <p>Player positions and available moves would be displayed</p>
      </div>
    `;
  }

  private updatePhaseDisplay(phase: string): void {
    const phaseDisplay = document.getElementById('phaseDisplay');
    if (!phaseDisplay) return;

    phaseDisplay.innerHTML = `
      <div class="phase-info">
        <h3>Current Phase: ${
      phase.charAt(0).toUpperCase() + phase.slice(1)
    }</h3>
        <p>Select a resource to perform actions</p>
      </div>
    `;
  }

  private showGameOver(winner: string): void {
    const phaseDisplay = document.getElementById('phaseDisplay');
    if (!phaseDisplay) return;

    phaseDisplay.innerHTML = `
      <div class="game-over">
        <h2>Game Over!</h2>
        <h3>Winner: ${winner}</h3>
        <button id="newGame" class="action-btn">Start New Game</button>
      </div>
    `;

    // Add event listener for new game button
    const newGameButton = document.getElementById('newGame');
    if (newGameButton) {
      newGameButton.addEventListener('click', () => {
        this.startNewGame();
      });
    }
  }

  private renderRecolorOptions(_player: unknown): string {
    // This would render the recoloring options UI
    return `
      <div class="recolor-options">
        <h5>Recolor Options</h5>
        <p>Spend favor to change die color</p>
        <div class="recolor-buttons">
          <button class="action-btn secondary">+1 Favor</button>
          <button class="action-btn secondary">+2 Favor</button>
        </div>
      </div>
    `;
  }

  private selectResource(resourceType: string, resourceColor: CoreColor): void {
    const currentPlayer = this.gameEngine.getCurrentPlayer();

    if (resourceType === 'die') {
      // Check if the player has this die
      if (currentPlayer.oracleDice.includes(resourceColor)) {
        this.selectedResourceType = 'die';
        this.selectedResourceColor = resourceColor;
        this.showMessage(`Selected ${resourceColor} die`);
        this.renderGameState();
      }
    } else if (resourceType === 'card') {
      // Check if the player has this oracle card
      if (currentPlayer.oracleCards.includes(resourceColor)) {
        this.selectedResourceType = 'card';
        this.selectedResourceColor = resourceColor;
        this.showMessage(`Selected ${resourceColor} oracle card`);
        this.renderGameState();
      }
    }
  }

  private clearResourceSelection(): void {
    this.selectedResourceType = null;
    this.selectedResourceColor = null;
    this.showMessage('Resource selection cleared');
    this.renderGameState();
  }

  private showMessage(message: string): void {
    // Simple message display - could be enhanced with a proper notification system
    console.log(message);
    // In a real implementation, this would update a message area in the UI
  }

  private getColorHex(color: string): string {
    const colors: Record<string, string> = {
      red: '#DC143C',
      pink: '#ff69b4',
      blue: '#0000ff',
      black: '#000000',
      green: '#008000',
      yellow: '#ffff00',
    };
    return colors[color] || '#333333';
  }

  // Note: The rest of the methods (highlightAvailableMoves, etc.)
  // would need to be updated to use the unified resource selection system
  // This is a simplified example showing the core unified selection approach
}
