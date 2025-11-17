// Game Controller for Quests of Zeus
// Manages the game UI and user interactions

import { ControllerForBasicActions } from './ControllerForBasicActions.ts';
import { ControllerForHexClicks } from './ControllerForHexClicks.ts';
import { QuestsZeusGameEngine } from './game-engine-core.ts';
import type { GameState } from './GameState.ts';
import { HexMapSVG } from './hexmap-svg.ts';
import type { HexCoordinates } from './hexmap/HexGrid.ts';
import { OracleSystem } from './oracle-system.ts';
import type { Player } from './Player.ts';
import {
  type CityHex,
  COLOR_WHEEL,
  type CoreColor,
  type CubeHex,
  type MonsterHex,
  type TerrainType,
} from './types.ts';

export class GameController {
  private gameEngine: QuestsZeusGameEngine;
  private hexMapSVG: HexMapSVG;
  private selectedDieColor: CoreColor | null = null;
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
          <div><strong>Favor:</strong> ${_currentPlayer.favor}</div>
          <div><strong>Shield:</strong> ${_currentPlayer.shield}</div>
        </div>
        <div class="quest-progress">
          <h4>Quest Progress</h4>
          <div class="quest-types">
            <div class="quest-type-item">Temple Offering: ${_currentPlayer.completedQuestTypes.temple_offering}/3</div>
            <div class="quest-type-item">Monster: ${_currentPlayer.completedQuestTypes.monster}/3</div>
            <div class="quest-type-item">Statue: ${_currentPlayer.completedQuestTypes.statue}/3</div>
            <div class="quest-type-item">Shrine: ${_currentPlayer.completedQuestTypes.shrine}/3</div>
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

      const statueHexes = gameState.getStatueHexes();

      this.hexMapSVG.setOptions({
        cityHexes: cityHexes,
        cubeHexes: cubeHexes,
        monsterHexes: monsterHexes,
        statueHexes: statueHexes,
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

    const selectedColor = this.selectedDieColor || this.selectedOracleCardColor;
    if (!selectedColor) {
      return;
    }

    const effectiveColor = OracleSystem.applyRecolor(
      selectedColor,
      currentPlayer.getRecolorIntention(),
    );

    // Get available moves for the selected die color and available favor
    const availableMoves = this.gameEngine.getAvailableMovesForColor(
      currentPlayer,
      effectiveColor,
      currentPlayer.favor,
    );

    // Debug logging
    console.log(
      `Highlighting moves for ${effectiveColor} (original: ${this.selectedDieColor}):`,
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
              `Move using ${effectiveColor} (costs ${move.favorCost} favor)`,
            );
            console.log(
              `Added favor highlight to (${move.q}, ${move.r}) with cost ${move.favorCost}`,
            );
          } else {
            highlightCell.classList.add('available-move');
            // Add tooltip to show required die color
            highlightCell.setAttribute(
              'title',
              `Move using ${effectiveColor}`,
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

        const selectedColor = this.selectedDieColor ||
          this.selectedOracleCardColor;
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
      this.handleHexClickEvent(event);
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
    } else if (target.id === 'buildStatue') {
      this.buildStatue();
    } else if (target.id === 'completeShrineQuest') {
      this.completeShrineQuest();
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

  private handleHexClickEvent(event: Event): void {
    if (!this.gameEngine.isGameInitialized()) return;

    const customEvent = event as CustomEvent<
      { q: number; r: number; terrain: TerrainType }
    >;
    const { q, r, terrain } = customEvent.detail;
    const coordinates: HexCoordinates = { q, r };
    const handlers = new ControllerForHexClicks(this.gameEngine);
    const result = handlers.handleHexClick(
      coordinates,
      terrain,
      this.selectedDieColor,
      this.selectedOracleCardColor,
    );
    if (result.success) {
      this.clearResourceSelection();
      this.renderGameState();
      if (result.message) {
        this.showMessage(result.message);
      }
    } else {
      this.showMessage(result.message);
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

    if (currentCell?.terrain === 'offerings' && currentCell.color !== 'none') {
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

  private buildStatue(): void {
    const currentPlayer = this.gameEngine.getCurrentPlayer();
    const success = this.gameEngine.buildStatue(currentPlayer.id);
    if (success) {
      this.showMessage('Statue built! Quest completed!');
      // Clear selected die after successful action
      this.selectedDieColor = null;
      this.renderGameState();
    } else {
      this.showMessage('Cannot build statue here');
    }
  }

  private completeShrineQuest(): void {
    const currentPlayer = this.gameEngine.getCurrentPlayer();
    const success = this.gameEngine.completeShrineQuest(currentPlayer.id);
    if (success) {
      this.showMessage('Shrine quest completed!');
      // Clear selected die after successful action
      this.selectedDieColor = null;
      this.renderGameState();
    } else {
      this.showMessage(
        'Cannot complete shrine quest here or missing required statue',
      );
    }
  }

  private spendResourceForFavor(): void {
    const handler = new ControllerForBasicActions(this.gameEngine);
    const result = handler.spendResourceForFavor(
      this.selectedDieColor,
      this.selectedOracleCardColor,
    );
    if (result.success) {
      this.clearResourceSelection();
      this.renderGameState();
    }
    this.showMessage(result.message);
  }

  private drawOracleCard(): void {
    const handler = new ControllerForBasicActions(this.gameEngine);
    const result = handler.drawOracleCard(
      this.selectedDieColor,
      this.selectedOracleCardColor,
    );
    if (result.success) {
      this.clearResourceSelection();
      this.renderGameState();
    }
    this.showMessage(result.message);
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
    this.clearResourceSelection();

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
      }, 5000);
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
    } 
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
    winner: { name: string; color: string },
  ): void {
    const message = `Game Over! ${winner.name} (${
      winner.color.charAt(0).toUpperCase() + winner.color.slice(1)
    }) wins!`;
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
}
