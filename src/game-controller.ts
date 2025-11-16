// Game Controller for Quests of Zeus
// Manages the game UI and user interactions

import { QuestsZeusGameEngine } from './game-engine-core.ts';
import type { GameState } from './GameState.ts';
import { HexMapSVG } from './hexmap-svg.ts';
import { OracleSystem } from './oracle-system.ts';
import type { Player } from './Player.ts';
import {
  type CityHex,
  COLOR_WHEEL,
  type CoreColor,
  type CubeHex,
  type HexColor,
  type MonsterHex,
  type MoveShipResult,
} from './types.ts';

// Type declarations for DOM APIs (for Deno type checking)

export class GameController {
  private gameEngine: QuestsZeusGameEngine;
  private hexMapSVG: HexMapSVG;
  private selectedDieColor: CoreColor | null = null;
  private selectedFavorSpent: number = 0;
  private selectedOracleCardColor: CoreColor | null = null;

  constructor(engine?: QuestsZeusGameEngine) {
    if (engine) {
      this.gameEngine = engine;
    } else {
      this.gameEngine = new QuestsZeusGameEngine();
    }

    this.hexMapSVG = new HexMapSVG({
      cellSize: 30,
      showCoordinates: false,
      showTerrainLabels: false,
      interactive: true,
    });
  }

  public initializeGameUI(): void {
    this.showWelcomeScreen();
    this.setupEventListeners();
  }

  public clearResourceSelection(): void {
    this.selectedDieColor = null;
    this.selectedOracleCardColor = null;
    this.selectedFavorSpent = 0;
    const currentPlayer = this.gameEngine.getCurrentPlayer();
    if (currentPlayer) {
      currentPlayer.setRecolorIntention(0);
    }
  }

  public getSelectedDieColor(): CoreColor | null {
    return this.selectedDieColor;
  }

  public getSelectedCardColor(): CoreColor | null {
    return this.selectedOracleCardColor;
  }

  public selectDieColor(color: CoreColor): boolean {
    const currentPlayer = this.gameEngine.getCurrentPlayer();
    if (!currentPlayer.oracleDice.includes(color)) {
      return false;
    }

    this.selectedDieColor = color;
    this.selectedOracleCardColor = null;
    return true;
  }

  public selectCardColor(color: CoreColor): boolean {
    const currentPlayer = this.gameEngine.getCurrentPlayer();
    if (!currentPlayer.oracleCards.includes(color)) {
      return false;
    }

    this.selectedOracleCardColor = color;
    this.selectedDieColor = null;
    return true;
  }

  private clearResourceSelectionAndUpdateDisplay(): void {
    this.clearResourceSelection();
    this.showMessage('Resource selection cleared');
    this.renderGameState();
  }

  private selectResource(resourceType: string, resourceColor: CoreColor): void {
    const currentPlayer = this.gameEngine.getCurrentPlayer();
    console.log(`selectResource called: ${resourceType}, ${resourceColor}`);

    currentPlayer.setRecolorIntention(0);
    if (resourceType === 'die') {
      if (this.selectDieColor(resourceColor)) {
        this.showMessage(`Selected ${resourceColor} die`);
        this.renderGameState();
      } else {
        console.log(
          `Player doesn't have ${resourceColor} die. Available dice:`,
          currentPlayer.oracleDice,
        );
      }
    } else if (resourceType === 'card') {
      if (this.selectCardColor(resourceColor)) {
        this.showMessage(`Selected ${resourceColor} oracle card`);
        this.renderGameState();
      } else {
        console.log(
          `Player doesn't have ${resourceColor} oracle card. Available cards:`,
          currentPlayer.oracleCards,
        );
      }
    }
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
      `;
    }

    if (questInfoContainer) {
      questInfoContainer.innerHTML = `
        <div class="game-rules">
          <h3>Game Rules</h3>
          <div class="rules-section">
            <h4>Phases:</h4>
            <ul>
              <li><strong>Action Phase:</strong> Select a die and perform actions (move, collect offerings, fight monsters, etc.)</li>
              <li><strong>End of Turn:</strong> Dice are automatically rolled for the next player</li>
              <li>You can change your selected die before making a move</li>
              <li>You can recolor dice and oracle cards by spending favor (1 favor per color advancement)</li>
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

    const gameState = this.gameEngine.getGameStateSnapshot();

    // Update player info display
    this.updatePlayerInfo(gameState);

    // Render the map with player positions
    this.renderMap(gameState);

    // Update game phase display
    this.updatePhaseDisplay(gameState.getPhase());

    // Check for win condition
    const winCondition = this.gameEngine.checkWinCondition();
    if (winCondition.gameOver) {
      this.showGameOver(winCondition.winner!);
    }
  }

  private updatePlayerInfo(gameState: GameState): void {
    const playerInfoContainer = document.getElementById('playerInfo');
    if (!playerInfoContainer) return;

    // Get current player for display
    const _currentPlayer = gameState.getCurrentPlayer();

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
          </div>
        </div>
        <div class="oracle-cards">
          <h4>Oracle Cards</h4>
          <div class="oracle-cards-container">
            ${
      _currentPlayer.oracleCards.length === 0
        ? '<div class="no-cards">No oracle cards</div>'
        : ''
    }
            ${
      _currentPlayer.oracleCards.map((color: string) => {
        const isSelected = this.selectedOracleCardColor === color;
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
      this.selectedOracleCardColor && _currentPlayer.oracleCards.length > 0
        ? `<div class="selected-oracle-card-info">
             Selected Oracle Card: <span class="color-swatch" style="background-color: ${
          this.getColorHex(this.selectedOracleCardColor)
        }"></span>
             ${this.selectedOracleCardColor}
             <button id="clearOracleCardSelection" class="action-btn secondary">Clear</button>
           </div>`
        : ''
    }
        </div>
        <div class="oracle-dice">
          <h4>Oracle Dice</h4>
          <div class="dice-container">
            ${
      _currentPlayer.oracleDice.map((color: string) => {
        const isSelected = this.selectedDieColor === color;
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
      _currentPlayer.oracleDice.length === 0
        ? '<div class="no-dice">No dice rolled yet</div>'
        : ''
    }
          </div>
          ${
      this.selectedDieColor && _currentPlayer.oracleDice.length > 0
        ? `<div class="selected-die-info">
             Selected: <span class="color-swatch" style="background-color: ${
          this.getColorHex(this.selectedDieColor)
        }"></span>
             ${this.selectedDieColor}
             <button id="clearDieSelection" class="action-btn secondary">Clear</button>
           </div>`
        : ''
    }
        </div>
        ${
      (this.selectedDieColor || this.selectedOracleCardColor) &&
        _currentPlayer.favor > 0
        ? this.renderRecolorOptions(_currentPlayer)
        : ''
    }
      </div>
    `;
  }

  private renderMap(gameState: GameState): void {
    const hexMapContainer = document.getElementById('hexMapSVG');
    if (!hexMapContainer) return;

    const grid = gameState.map.getHexGrid();
    console.log('Grid structure:', grid);
    console.log('Grid length:', grid.getRadius());

    try {
      // Update the hex map SVG with cube hex data
      const cityHexes = gameState.getCityHexes();
      // Debug: Log city hex details
      cityHexes.forEach((cityHex: CityHex, index: number) => {
        console.log(
          `City hex ${index}: (${cityHex.q}, ${cityHex.r}) with statues:`,
          cityHex.statues,
        );
      });

      const cubeHexes: CubeHex[] = gameState.getCubeHexes();
      console.log('Cube hexes for rendering:', cubeHexes);

      // Debug: Log cube hex details
      cubeHexes.forEach((cubeHex: CubeHex, index: number) => {
        console.log(
          `Cube hex ${index}: (${cubeHex.q}, ${cubeHex.r}) with colors:`,
          cubeHex.cubeColors,
        );
      });

      // Update the hex map SVG with monster hex data
      const monsterHexes: MonsterHex[] = gameState.getMonsterHexes() || [];
      console.log('Monster hexes for rendering:', monsterHexes);

      // Debug: Log monster hex details
      monsterHexes.forEach((monsterHex: MonsterHex, index: number) => {
        console.log(
          `Monster hex ${index}: (${monsterHex.q}, ${monsterHex.r}) with colors:`,
          monsterHex.monsterColors,
        );
      });

      // Debug: Check if cube hexes and monster hexes are being passed to SVG renderer
      console.log(
        'Setting cubeHexes in SVG options:',
        cubeHexes.length,
        'hexes',
      );
      console.log(
        'Setting monsterHexes in SVG options:',
        monsterHexes.length,
        'hexes',
      );

      this.hexMapSVG.setOptions({
        cityHexes: cityHexes,
        cubeHexes: cubeHexes,
        monsterHexes: monsterHexes,
      });

      const { svg, script } = this.hexMapSVG.generateInteractiveSVG(grid);

      hexMapContainer.innerHTML = svg;

      // Execute the interaction script
      try {
        // Use Function constructor instead of direct eval to avoid bundler warnings
        const executeScript = new Function(script);
        executeScript();
      } catch (error) {
        console.error('Error executing hex map script:', error);
      }

      // Add player markers to the map
      this.addPlayerMarkers(gameState.players);

      // Highlight available moves
      if (gameState.getPhase() === 'action') {
        this.highlightAvailableMoves(gameState);
      }
    } catch (error) {
      console.error('Error generating SVG:', error);
      const errorMessage = error instanceof Error
        ? error.message
        : String(error);
      hexMapContainer.innerHTML =
        `<div class="welcome-map"><p>Error generating map: ${errorMessage}</p></div>`;
    }
  }

  private addPlayerMarkers(players: Player[]): void {
    players.forEach((player) => {
      const position = player.getShipPosition();
      const q = position.q;
      const r = position.r;
      const cell = document.querySelector(`[data-q="${q}"][data-r="${r}"]`);
      if (cell) {
        const rect = cell.getBoundingClientRect();
        const svg = cell.closest('svg');
        if (svg) {
          const point = svg.createSVGPoint();
          const quadrant = player.id;
          let offsetX = 0;
          let offsetY = 0;

          // Reduce the offset to move dots closer to center (from 1/4 to 1/6 of the width/height)
          const offsetFactor = 6;

          switch (quadrant) {
            case 0: // Upper left
              offsetX = -rect.width / offsetFactor;
              offsetY = -rect.height / offsetFactor;
              break;
            case 1: // Upper right
              offsetX = rect.width / offsetFactor;
              offsetY = -rect.height / offsetFactor;
              break;
            case 2: // Lower left
              offsetX = -rect.width / offsetFactor;
              offsetY = rect.height / offsetFactor;
              break;
            case 3: // Lower right
              offsetX = rect.width / offsetFactor;
              offsetY = rect.height / offsetFactor;
              break;
          }

          point.x = rect.left + rect.width / 2 + offsetX;
          point.y = rect.top + rect.height / 2 + offsetY;
          const svgPoint = point.matrixTransform(
            svg.getScreenCTM()!.inverse(),
          );

          const marker = document.createElementNS(
            'http://www.w3.org/2000/svg',
            'circle',
          );
          marker.setAttribute('cx', svgPoint.x.toString());
          marker.setAttribute('cy', svgPoint.y.toString());
          marker.setAttribute('r', '8');
          marker.setAttribute('fill', this.getColorHex(player.color));
          marker.setAttribute('stroke', '#fff');
          marker.setAttribute('stroke-width', '2');
          marker.setAttribute('class', 'player-marker');
          marker.setAttribute('data-player-id', player.id.toString());

          svg.appendChild(marker);
        } else {
          console.warn(
            `Could not find SVG container for players at (${q}, ${r})`,
          );
        }
      } else {
        console.warn(`Could not find cell for players at (${q}, ${r})`);
      }
    });
  }

  private highlightAvailableMoves(gameState: GameState): void {
    const currentPlayer = gameState.getCurrentPlayer();

    // Highlight moves for selected die
    if (this.selectedDieColor) {
      this.highlightMovesForSelectedDie(currentPlayer, this.selectedDieColor);
    }

    // Highlight moves for selected oracle card
    if (this.selectedOracleCardColor && !currentPlayer.usedOracleCardThisTurn) {
      // Get available moves for the selected oracle card color and available favor
      const availableMoves = this.getAvailableMovesForOracleCard(
        currentPlayer.id,
        this.selectedOracleCardColor,
        currentPlayer.favor,
      );

      // Get the effective card color considering recoloring intention
      const selectedColor = this.selectedOracleCardColor;
      const recoloringCost = currentPlayer.getRecolorIntention();
      const effectiveCardColor = OracleSystem.applyRecolor(
        selectedColor,
        recoloringCost,
      );

      availableMoves.forEach(
        (move: { q: number; r: number; favorCost: number }) => {
          // Highlight the new hex-highlight polygons (centered, won't cover colored border)
          const highlightCell = document.querySelector(
            `.hex-highlight[data-q="${move.q}"][data-r="${move.r}"]`,
          );

          if (highlightCell) {
            if (move.favorCost > 0) {
              highlightCell.classList.add('available-move-oracle-card-favor');
              // Add tooltip to show required oracle card color and favor cost
              highlightCell.setAttribute(
                'title',
                `Move using ${effectiveCardColor} oracle card (costs ${move.favorCost} favor)`,
              );
            } else {
              highlightCell.classList.add('available-move-oracle-card');
              // Add tooltip to show required oracle card color
              highlightCell.setAttribute(
                'title',
                `Move using ${effectiveCardColor} oracle card`,
              );
            }
          }
        },
      );
    }
  }

  private highlightMovesForSelectedDie(
    currentPlayer: Player,
    selectedColor: CoreColor,
  ): void {
    // Get available moves for the selected die color and available favor
    const availableMoves = this.gameEngine.getAvailableMovesForDie(
      currentPlayer.id,
      selectedColor,
      currentPlayer.favor,
    );

    // Get the effective die color considering recoloring intention
    // let effectiveDieColor = this.selectedDieColor;
    const effectiveDieColor = OracleSystem.applyRecolor(
      selectedColor,
      currentPlayer.getRecolorIntention(),
    );

    // Debug logging
    console.log(
      `Highlighting moves for ${effectiveDieColor} die (original: ${this.selectedDieColor}):`,
      {
        availableMovesCount: availableMoves.length,
        movesWithFavor:
          availableMoves.filter((move) => move.favorCost > 0).length,
        movesWithoutFavor:
          availableMoves.filter((move) => move.favorCost === 0).length,
        playerFavor: currentPlayer.favor,
      },
    );

    availableMoves.forEach(
      (move: { q: number; r: number; favorCost: number }) => {
        // Highlight the new hex-highlight polygons (centered, won't cover colored border)
        const highlightCell = document.querySelector(
          `.hex-highlight[data-q="${move.q}"][data-r="${move.r}"]`,
        );

        if (highlightCell) {
          if (move.favorCost > 0) {
            highlightCell.classList.add('available-move-favor');
            // Add tooltip to show required die color and favor cost
            highlightCell.setAttribute(
              'title',
              `Move using ${effectiveDieColor} die (costs ${move.favorCost} favor)`,
            );
            console.log(
              `Added favor highlight to (${move.q}, ${move.r}) with cost ${move.favorCost}`,
            );
          } else {
            highlightCell.classList.add('available-move');
            // Add tooltip to show required die color
            highlightCell.setAttribute(
              'title',
              `Move using ${effectiveDieColor} die`,
            );
          }
        } else {
          console.warn(
            `Could not find hex-highlight element for (${move.q}, ${move.r})`,
          );
        }
      },
    );
  }

  private updatePhaseDisplay(phase: string): void {
    const phaseDisplay = document.getElementById('phaseDisplay');
    if (!phaseDisplay) return;

    phaseDisplay.innerHTML = `
      <div class="phase-info">
        <h3>Current Phase: ${phase.toUpperCase()}</h3>
        <div class="phase-actions">
          ${this.getPhaseActions(phase)}
        </div>
      </div>
    `;
  }

  private getPhaseActions(phase: string): string {
    const gameState = this.gameEngine.getGameStateSnapshot();
    const currentPlayer = gameState.getCurrentPlayer();

    switch (phase) {
      case 'action': {
        const position = currentPlayer.getShipPosition();
        const currentCell = gameState.map.getCell(
          position,
        );

        let actions = '';

        if (this.selectedDieColor) {
          // Die is selected - show available actions
          actions +=
            `<p>Selected die: <span class="color-swatch" style="background-color: ${
              this.getColorHex(this.selectedDieColor)
            }"></span> ${this.selectedDieColor}</p>`;

          // Show favor status
          actions += `<p>Available favor: ${currentPlayer.favor}</p>`;

          // Movement is always available during action phase with a selected die
          actions += `<p>Click on highlighted hexes to move your ship:</p>
             <ul style="margin-left: 1rem;">
               <li>White highlights: Normal range (${currentPlayer.getRange()} hexes)</li>
               <li>Tan dashed highlights: Extended range (costs favor)</li>
             </ul>`;

          // Unified resource spending actions
          actions += `<div class="resource-actions" style="margin-top: 1rem;">
            <h4>Resource Actions</h4>
            <button id="spendResourceForFavor" class="action-btn">Spend for 2 Favor</button>
            <button id="drawOracleCard" class="action-btn">Draw Oracle Card</button>
            <p style="font-size: 0.9rem; opacity: 0.8;">Spend selected resource for favor or to draw an oracle card</p>
          </div>`;

          // Recolor options for selected resource
          // Note: Recolor options are now displayed in the player info panel as radio buttons
          // The favor will be spent when the resource is actually used for movement or other actions

          if (currentCell?.terrain === 'cubes') {
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
          if (currentCell?.terrain === 'foundations') {
            actions +=
              `<button id="buildFoundation" class="action-btn">Build Foundation</button>`;
          }
          if (currentCell?.terrain === 'clouds') {
            actions +=
              `<button id="completeCloudQuest" class="action-btn">Complete Cloud Quest</button>`;
          }
          if (currentCell?.terrain === 'city') {
            // not implemented yet
          }
        } else if (this.selectedOracleCardColor) {
          // Oracle card is selected - show available actions
          actions +=
            `<p>Selected oracle card: <span class="color-swatch" style="background-color: ${
              this.getColorHex(this.selectedOracleCardColor)
            }"></span> ${this.selectedOracleCardColor}</p>`;

          // Show favor status
          actions += `<p>Available favor: ${currentPlayer.favor}</p>`;

          // Movement is available during action phase with a selected oracle card
          actions += `<p>Click on highlighted hexes to move your ship:</p>
             <ul style="margin-left: 1rem;">
               <li>Gold highlights: Normal range (${currentPlayer.getRange()} hexes)</li>
               <li>Orange dashed highlights: Extended range (costs favor)</li>
             </ul>`;

          // Unified resource spending actions
          actions += `<div class="resource-actions" style="margin-top: 1rem;">
            <h4>Resource Actions</h4>
            <button id="spendResourceForFavor" class="action-btn">Spend for 2 Favor</button>
            <button id="drawOracleCard" class="action-btn">Draw Oracle Card</button>
            <p style="font-size: 0.9rem; opacity: 0.8;">Spend selected resource for favor or to draw an oracle card</p>
          </div>`;

          // Note: Recolor options are now displayed in the player info panel as radio buttons
        } else {
          // No resource selected - show selection instructions
          actions +=
            `<p>Select a resource (die or oracle card) to perform actions</p>`;
          actions += `<p>Available dice: ${
            currentPlayer.oracleDice.join(', ')
          }</p>`;
          if (currentPlayer.oracleCards.length > 0) {
            actions += `<p>Available oracle cards: ${
              currentPlayer.oracleCards.join(', ')
            }</p>`;
          }
        }

        if (!actions) {
          actions = '<p>No actions available at this location</p>';
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

  private setupEventListeners(): void {
    console.log('Setting up event listeners...');

    // Start game button
    document.addEventListener('click', (event) => {
      const target = event.target as HTMLElement;

      if (target.id === 'startGame') {
        this.startNewGame();
      }
    });

    // Hex cell click for movement
    document.addEventListener('hexCellClick', (event: Event) => {
      this.handleHexCellClick(event);
    });

    // Delegate phase action buttons
    document.addEventListener('click', (event) => {
      this.handleButtonClick(event);
    });
  }

  private handleButtonClick(event: Event): void {
    if (!this.gameEngine.isGameInitialized()) return;

    const target = event.target as HTMLElement;
    console.log(
      'Click event detected on:',
      target,
      'classList:',
      target.classList,
    );

    if (target.id === 'collectOffering') {
      this.collectOffering();
    } else if (target.id === 'fightMonster') {
      this.fightMonster();
    } else if (target.id === 'buildTemple') {
      this.buildTemple();
    } else if (target.id === 'buildFoundation') {
      this.buildFoundation();
    } else if (target.id === 'completeCloudQuest') {
      this.completeCloudQuest();
    } else if (target.id === 'placeStatue') {
      // this.placeStatueOnCity();
    } else if (target.id === 'spendResourceForFavor') {
      this.spendResourceForFavor();
    } else if (target.id === 'drawOracleCard') {
      this.drawOracleCard();
    } else if (target.id === 'endTurn') {
      this.endTurn();
    } else if (target.id === 'clearResourceSelection') {
      this.clearResourceSelectionAndUpdateDisplay();
    } else if (target.id === 'clearDieSelection') {
      this.clearResourceSelectionAndUpdateDisplay();
    } else if (target.id === 'clearOracleCardSelection') {
      this.clearResourceSelectionAndUpdateDisplay();
    } else if (target.classList.contains('die')) {
      const dieColor = target.getAttribute('data-die-color') as CoreColor;
      if (dieColor) {
        console.log(`Die clicked: ${dieColor}`);
        this.selectResource('die', dieColor);
      }
    } else if (target.classList.contains('oracle-card')) {
      const cardColor = target.getAttribute(
        'data-oracle-card-color',
      ) as CoreColor;
      if (cardColor) {
        console.log(`Oracle card clicked: ${cardColor}`);
        this.selectResource('card', cardColor);
      }
    } else if (
      target instanceof HTMLInputElement && target.name === 'recolorOption'
    ) {
      const favorCost = parseInt(target.value || '0');
      this.setRecolorIntention(favorCost);
    }
  }

  private handleHexCellClick(event: Event): void {
    if (!this.gameEngine.isGameInitialized()) return;

    const customEvent = event as CustomEvent<{ q: number; r: number }>;
    const { q, r } = customEvent.detail;
    const gameState = this.gameEngine.getGameStateSnapshot();

    if (gameState.getPhase() !== 'action') {
      return;
    }

    const currentPlayer = gameState.getCurrentPlayer();

    // Check if moving with oracle card
    if (
      this.selectedOracleCardColor && !currentPlayer.usedOracleCardThisTurn
    ) {
      this.handleMoveWithCard(
        currentPlayer,
        q,
        r,
      );
    } // Check if moving with die
    else if (this.selectedDieColor) {
      this.handleMoveWithDie(currentPlayer, q, r);
    } else {
      this.showMessage(
        'Please select a resource (die or oracle card) first!',
      );
    }
  }

  private handleMoveWithCard(
    currentPlayer: Player,
    q: number,
    r: number,
  ): void {
    const selectedColor = this.selectedOracleCardColor;
    if (!selectedColor) {
      return;
    }
    if (!currentPlayer.oracleCards.includes(selectedColor)) {
      return;
    }
    this.handleMoveWithDieOrCard(
      currentPlayer,
      q,
      r,
      selectedColor,
      currentPlayer.getRecolorIntention(),
    );
  }

  private handleMoveWithDie(currentPlayer: Player, q: number, r: number): void {
    const selectedColor = this.selectedDieColor;
    if (!selectedColor) {
      return;
    }
    if (!currentPlayer.oracleDice.includes(selectedColor)) {
      return;
    }
    this.handleMoveWithDieOrCard(
      currentPlayer,
      q,
      r,
      selectedColor,
      currentPlayer.getRecolorIntention(),
    );
  }

  private handleMoveWithDieOrCard(
    currentPlayer: Player,
    q: number,
    r: number,
    selectedColor: CoreColor,
    recoloringCost: number,
  ): void {
    const effectiveColor = OracleSystem.applyRecolor(
      selectedColor,
      recoloringCost,
    );
    const availableFavor = currentPlayer.favor;
    const maxFavorForMovement = Math.min(availableFavor - recoloringCost, 5);
    // Get available moves for the selected color and available favor
    const availableMoves = this.gameEngine.getAvailableMovesForColor(
      currentPlayer,
      effectiveColor,
      maxFavorForMovement,
    );

    const targetMove = availableMoves.find((
      move: { q: number; r: number; favorCost: number },
    ) => move.q === q && move.r === r);

    if (!targetMove) {
      this.showMessage(
        `Cannot move to this hex using ${effectiveColor}! Must be a sea hex within range of matching color.`,
      );
      return;
    }

    const favorSpentForRange = targetMove.favorCost;

    // Confirm spending favor, if necessary
    if (favorSpentForRange > 0) {
      // Ask player if they want to spend favor
      const confirmSpend = confirm(
        `This move requires spending ${targetMove.favorCost} favor to reach. Do you want to spend favor to move here?`,
      );
      if (!confirmSpend) {
        return;
      }
    }

    const moveResult = this.gameEngine.moveShip(
      currentPlayer.id,
      q,
      r,
      this.selectedDieColor || undefined,
      this.selectedOracleCardColor || undefined,
      recoloringCost,
      favorSpentForRange,
    );
    if (moveResult.success) {
      let message = `Ship moved to (${q}, ${r}) using ${selectedColor}`;
      if (recoloringCost > 0) {
        message += ` recolored to ${effectiveColor}`;
      }
      if (this.selectedFavorSpent > 0) {
        message += ` and ${this.selectedFavorSpent} favor`;
      }
      this.showMessage(message);
      // Clear selections after successful move
      this.clearResourceSelection();
      this.renderGameState();
    } else {
      // Use the detailed error information
      const errorMessage = this.formatMoveErrorMessage(
        moveResult.error,
      );
      this.showMessage(errorMessage);

      // Debug: Log the failure details
      console.log('Move failed with details:', {
        playerId: currentPlayer.id,
        targetQ: q,
        targetR: r,
        dieColor: this.selectedDieColor,
        favorSpent: this.selectedFavorSpent,
        playerFavor: currentPlayer.favor,
        playerDice: currentPlayer.oracleDice,
        recolorIntention: currentPlayer.getRecolorIntention(),
        moveResult,
      });
    }
  }

  private startNewGame(): void {
    this.gameEngine.initializeGame();
    this.renderGameState();
    this.showMessage(
      "New game started! All players have rolled their dice. Player 1's turn begins.",
    );
  }

  private collectOffering(): void {
    const gameState = this.gameEngine.getGameStateSnapshot();
    const currentPlayer = gameState.getCurrentPlayer();
    const position = currentPlayer.getShipPosition();
    const currentCell = gameState.map.getCell(
      position,
    );

    if (currentCell?.terrain === 'cubes' && currentCell.color !== 'none') {
      const success = this.gameEngine.collectOffering(
        currentPlayer.id,
        currentCell.color,
      );
      if (success) {
        this.showMessage(`Collected ${currentCell.color} cube!`);
        // Clear selected die after successful action
        this.selectedDieColor = null;
        this.renderGameState();
      } else {
        this.showMessage('No storage space available for cube!');
      }
    }
  }

  private fightMonster(): void {
    const currentPlayer = this.gameEngine.getCurrentPlayer();
    const success = this.gameEngine.fightMonster(currentPlayer.id);
    if (success) {
      this.showMessage('Monster defeated! Quest completed!');
      // Clear selected die after successful action
      this.selectedDieColor = null;
      this.renderGameState();
    } else {
      this.showMessage('Not enough oracle dice to fight this monster');
    }
  }

  private buildTemple(): void {
    const currentPlayer = this.gameEngine.getCurrentPlayer();
    const success = this.gameEngine.buildTemple(currentPlayer.id);
    if (success) {
      this.showMessage('Temple built! Quest completed!');
      // Clear selected die after successful action
      this.selectedDieColor = null;
      this.renderGameState();
    } else {
      this.showMessage('Cannot build temple here or missing required cube');
    }
  }

  private buildFoundation(): void {
    const currentPlayer = this.gameEngine.getCurrentPlayer();
    const success = this.gameEngine.buildFoundation(currentPlayer.id);
    if (success) {
      this.showMessage('Foundation built! Quest completed!');
      // Clear selected die after successful action
      this.selectedDieColor = null;
      this.renderGameState();
    } else {
      this.showMessage('Cannot build foundation here');
    }
  }

  private completeCloudQuest(): void {
    const currentPlayer = this.gameEngine.getCurrentPlayer();
    const success = this.gameEngine.completeCloudQuest(currentPlayer.id);
    if (success) {
      this.showMessage('Cloud quest completed!');
      // Clear selected die after successful action
      this.selectedDieColor = null;
      this.renderGameState();
    } else {
      this.showMessage(
        'Cannot complete cloud quest here or missing required statue',
      );
    }
  }

  private spendResourceForFavor(): void {
    const currentPlayer = this.gameEngine.getCurrentPlayer();

    // Check if a die is selected
    if (this.selectedDieColor) {
      const success = this.gameEngine.spendDieForFavor(
        currentPlayer.id,
        this.selectedDieColor,
      );
      if (success) {
        this.showMessage(`Spent ${this.selectedDieColor} die to gain 2 favor!`);
        // Don't clear selected die - player can continue using other dice
        // The spent die will be automatically removed from the display
        this.renderGameState();
      } else {
        this.showMessage('Cannot spend die for favor at this time');
      }
    } // Check if an oracle card is selected
    else if (this.selectedOracleCardColor) {
      const success = this.gameEngine.spendOracleCardForFavor(
        currentPlayer.id,
        this.selectedOracleCardColor,
      );
      if (success) {
        this.showMessage(
          `Spent ${this.selectedOracleCardColor} oracle card to gain 2 favor!`,
        );
        // Clear selected oracle card after successful spending
        this.selectedOracleCardColor = null;
        this.renderGameState();
      } else {
        this.showMessage('Cannot spend oracle card for favor at this time');
      }
    } else {
      this.showMessage('Please select a resource (die or oracle card) first!');
    }
  }

  private drawOracleCard(): void {
    const currentPlayer = this.gameEngine.getCurrentPlayer();

    // Check if a die is selected
    if (this.selectedDieColor) {
      const success = this.gameEngine.drawOracleCard(
        currentPlayer.id,
        this.selectedDieColor,
      );
      if (success) {
        this.clearResourceSelection();
        this.showMessage(
          `Spent ${this.selectedDieColor} die to draw an oracle card!`,
        );
        // Don't clear selected die - player can continue using other dice
        // The spent die will be automatically removed from the display
        this.renderGameState();
      } else {
        this.showMessage('Cannot draw oracle card at this time');
      }
    } // Check if an oracle card is selected
    else if (this.selectedOracleCardColor) {
      const success = this.gameEngine.spendOracleCardToDrawCard(
        currentPlayer.id,
        this.selectedOracleCardColor,
      );
      if (success) {
        this.clearResourceSelection();
        this.showMessage(
          `Spent ${this.selectedOracleCardColor} oracle card to draw a new oracle card!`,
        );
        // Clear selected oracle card after successful spending
        this.selectedOracleCardColor = null;
        this.renderGameState();
      } else {
        this.showMessage(
          'Cannot spend oracle card to draw another oracle card at this time',
        );
      }
    } else {
      this.showMessage('Please select a resource (die or oracle card) first!');
    }
  }

  private setRecolorIntention(favorCost: number): void {
    const gameState = this.gameEngine.getGameStateSnapshot();
    const currentPlayer = gameState.getCurrentPlayer();

    const selectedColor = this.selectedDieColor || this.selectedOracleCardColor;
    if (!selectedColor) {
      this.showMessage('Please select a resource (die or oracle card) first!');
      return;
    }

    if (favorCost === 0) {
      // Clear recoloring intention
      let success = false;
      if (this.selectedDieColor) {
        success = this.gameEngine.clearRecolorIntention(
          currentPlayer.id,
        );
      } else if (this.selectedOracleCardColor) {
        success = this.gameEngine.clearRecolorIntention(
          currentPlayer.id,
        );
      }

      if (success) {
        this.showMessage('Recoloring intention cleared');
      } else {
        this.showMessage('Cannot clear recoloring intention');
      }
    } else {
      const success = this.gameEngine.setRecolorIntention(
        currentPlayer.id,
        favorCost,
      );

      if (success) {
        const resourceType = this.selectedDieColor ? 'die' : 'oracle card';
        const newColor = OracleSystem.applyRecolor(selectedColor, favorCost);
        this.showMessage(
          `${
            resourceType.charAt(0).toUpperCase() + resourceType.slice(1)
          } will be recolored from ${selectedColor} to ${newColor} when used (${favorCost} favor will be spent)`,
        );
      } else {
        this.showMessage('Cannot set recoloring intention');
      }
    }
    this.renderGameState();
  }

  private endTurn(): void {
    // Clear selections when ending turn
    this.selectedDieColor = null;
    this.selectedFavorSpent = 0;

    // Call the game engine's endTurn method to advance to the next player
    // This will roll dice for the next player and advance the current player index
    this.gameEngine.endTurn();

    this.showMessage(
      'Turn ended. Dice re-rolled for the previous player.',
    );

    this.renderGameState();
  }

  private showMessage(message: string): void {
    if (!document) {
      console.log(`GameMessage: ${message}`);
      return;
    }
    const messageContainer = document.getElementById('gameMessage');
    if (messageContainer) {
      messageContainer.textContent = message;
      messageContainer.style.display = 'block';

      setTimeout(() => {
        messageContainer.style.display = 'none';
      }, 3000);
    }
  }

  private renderRecolorOptions(player: Player): string {
    const selectedColor = this.selectedDieColor || this.selectedOracleCardColor;
    if (!selectedColor) return '';

    const currentIndex = COLOR_WHEEL.indexOf(selectedColor);

    if (currentIndex === -1) return '';

    const resourceType = this.selectedDieColor ? 'die' : 'oracle card';
    let options = `
      <div class="recolor-section" style="margin-top: 1rem;">
        <h4>Recolor ${
      resourceType.charAt(0).toUpperCase() + resourceType.slice(1)
    } (Favor will be spent when ${resourceType} is used)</h4>
        <p style="font-size: 0.9rem; opacity: 0.8;">Color wheel: black → pink → blue → yellow → green → red → black</p>
        <div class="recolor-options" style="margin-top: 0.5rem;">
    `;

    // Add "No Recolor" option
    const hasRecolorIntention = player.getRecolorIntention() > 0;

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

      const isSelected = player.getRecolorIntention() === favorCost;

      options += `
        <div class="recolor-option" style="margin-bottom: 0.5rem;">
          <label style="display: flex; align-items: center; gap: 0.5rem;">
            <input type="radio" name="recolorOption" value="${favorCost}" ${
        isSelected ? 'checked' : ''
      } data-recolor-favor="${favorCost}">
            <span class="color-swatch" style="background-color: ${
        this.getColorHex(newColor)
      }"></span>
            Recolor to ${newColor} (${favorCost} favor)
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

  private showGameOver(
    winner: { name: string; color: string; completedQuests: number },
  ): void {
    const message = `Game Over! ${winner.name} (${
      winner.color.charAt(0).toUpperCase() + winner.color.slice(1)
    }) wins by completing ${winner.completedQuests} quests!`;
    this.showMessage(message);

    // Disable further actions
    const actionButtons = document.querySelectorAll('.action-btn');
    actionButtons.forEach((button: Element) => {
      (button as HTMLButtonElement).disabled = true;
    });
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

  /**
   * Get available moves for a specific oracle card color and available favor
   * Returns moves that can be reached using the specified oracle card color
   * @param playerId The player ID
   * @param cardColor The oracle card color to use for movement
   * @param availableFavor The available favor that can be spent
   * @returns Array of reachable moves with favor cost information
   */
  private getAvailableMovesForOracleCard(
    playerId: number,
    cardColor: CoreColor,
    availableFavor: number,
  ): { q: number; r: number; favorCost: number }[] {
    if (!this.gameEngine.isGameInitialized()) {
      return [];
    }
    const gameState = this.gameEngine.getGameStateSnapshot();
    const player = gameState.getPlayer(playerId);
    if (!player || gameState.getPhase() !== 'action') {
      return [];
    }

    // Check if player has the specified oracle card and hasn't used one this turn
    if (
      !player.oracleCards.includes(cardColor) || player.usedOracleCardThisTurn
    ) {
      return [];
    }

    // Get the effective card color considering recoloring intention
    const recoloringCost = player.getRecolorIntention();
    const effectiveCardColor = OracleSystem.applyRecolor(
      cardColor,
      recoloringCost,
    );

    const currentPos = player.getShipPosition();
    const availableMoves: { q: number; r: number; favorCost: number }[] = [];

    // Calculate maximum favor that can be spent for extra range moves
    const maxFavorForMovement = Math.min(availableFavor - recoloringCost, 5); // Cap at 5 favor to prevent excessive computation

    // Check moves for each possible favor spending amount
    for (let favorSpent = 0; favorSpent <= maxFavorForMovement; favorSpent++) {
      const movementRange = player.getRange() + favorSpent;
      const reachableSeaTiles = this.getReachableSeaTiles(
        currentPos.q,
        currentPos.r,
        movementRange,
      );

      // Filter by the effective oracle card color and exclude current position
      for (const seaTile of reachableSeaTiles) {
        if (
          seaTile.color !== 'none' &&
          seaTile.color === effectiveCardColor &&
          !(seaTile.q === currentPos.q && seaTile.r === currentPos.r)
        ) {
          // Only show moves that the player can actually afford
          const totalFavorCost = favorSpent + recoloringCost;
          if (totalFavorCost <= availableFavor) {
            // Only add if this move isn't already available with less favor
            const existingMove = availableMoves.find((move) =>
              move.q === seaTile.q && move.r === seaTile.r
            );
            if (!existingMove) {
              availableMoves.push({
                q: seaTile.q,
                r: seaTile.r,
                favorCost: favorSpent,
              });
            }
          }
        }
      }
    }

    return availableMoves;
  }

  /**
   * Get all reachable sea tiles within movement range using BFS
   * Ships can move up to <range> steps on sea tiles, starting from the current position
   * Movement is only allowed through sea tiles (land blocks movement)
   * Ships can start on non-sea tiles (like Zeus) and move to adjacent sea tiles
   */
  private getReachableSeaTiles(
    startQ: number,
    startR: number,
    range: number,
  ): { q: number; r: number; color: HexColor }[] {
    if (!this.gameEngine.isGameInitialized()) {
      return [];
    }

    const gameState = this.gameEngine.getGameStateSnapshot();
    const reachableTiles: { q: number; r: number; color: HexColor }[] = [];
    const visited = new Set<string>();
    const queue: { q: number; r: number; steps: number }[] = [];

    // Start BFS from the current position (step 0)
    const startKey = `${startQ},${startR}`;
    visited.add(startKey);
    queue.push({ q: startQ, r: startR, steps: 0 });

    // Continue BFS up to the movement range
    while (queue.length > 0) {
      const current = queue.shift()!;

      // If we've reached the maximum range, don't explore further
      if (current.steps >= range) {
        continue;
      }

      const neighbors = gameState.map.getNeighbors(
        { q: current.q, r: current.r },
      );

      for (const neighbor of neighbors) {
        if (neighbor.terrain === 'sea') {
          const key = `${neighbor.q},${neighbor.r}`;
          if (!visited.has(key)) {
            visited.add(key);
            queue.push({
              q: neighbor.q,
              r: neighbor.r,
              steps: current.steps + 1,
            });
            reachableTiles.push({
              q: neighbor.q,
              r: neighbor.r,
              color: neighbor.color,
            });
          }
        }
      }
    }

    return reachableTiles;
  }

  /**
   * Format a detailed error message from move ship result
   */
  private formatMoveErrorMessage(error?: MoveShipResult['error']): string {
    if (!error) {
      return 'Invalid move! Unknown error occurred.';
    }

    switch (error.type) {
      case 'invalid_player':
        return 'Invalid player or not your turn!';

      case 'wrong_phase':
        return `Cannot move during ${error.details?.phase} phase!`;

      case 'invalid_target':
        return `Target cell (${error.details?.targetQ}, ${error.details?.targetR}) does not exist!`;

      case 'not_sea':
        return `Cannot move to ${error.details?.targetTerrain} terrain! Ships can only move to sea hexes.`;

      case 'no_die_or_card':
        return 'No die color specified for movement! Please select a die first.';

      case 'die_not_available':
        return `You don't have a ${error.details?.dieColor} die! Available dice: ${
          error.details?.availableDice?.join(', ') || 'none'
        }.`;

      case 'card_not_available':
        return `You don't have a ${error.details?.dieColor} card! Available cards: ${
          error.details?.availableDice?.join(', ') || 'none'
        }.`;

      case 'wrong_color':
        return `Target hex is ${error.details?.targetColor}, but die is ${error.details?.requiredColor}!`;

      case 'not_reachable':
        return `Target is not reachable within ${error.details?.movementRange} movement range!`;

      case 'not_enough_favor':
        return `Not enough favor! Need ${error.details?.favorSpent} but only have ${error.details?.availableFavor}.`;

      case 'recoloring_failed':
        return `Recoloring failed! Not enough favor for recoloring cost of ${error.details?.recoloringCost}.`;

      case 'unknown':
      default:
        return 'Invalid move! Please check your die selection, favor, and target hex.';
    }
  }
}
