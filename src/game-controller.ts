// Game Controller for Quests of Zeus
// Manages the game UI and user interactions

import { QuestsZeusGameEngine } from "./game-engine.ts";
import { HexMapSVG } from "./hexmap-svg.ts";
import type { HexColor } from "./hexmap.ts";
import type { CubeHex, GameState, MonsterHex, Player } from "./game-engine.ts";

// Type declarations for DOM APIs (for Deno type checking)

export class GameController {
  private gameEngine: QuestsZeusGameEngine;
  private hexMapSVG: HexMapSVG;
  private selectedDieColor: HexColor | null = null;
  private selectedFavorSpent: number = 0;
  private isFavorMode: boolean = false;

  constructor() {
    this.gameEngine = new QuestsZeusGameEngine();
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

  private showWelcomeScreen(): void {
    const playerInfoContainer = document.getElementById("playerInfo");
    const questInfoContainer = document.getElementById("questInfo");
    const phaseDisplay = document.getElementById("phaseDisplay");
    const hexMapContainer = document.getElementById("hexMapSVG");

    if (playerInfoContainer) {
      playerInfoContainer.innerHTML = `
        <div class="welcome-screen">
          <h3>Welcome to Quests of Zeus</h3>
          <p>A strategic board game of ancient Greece</p>
          <button id="startGame" class="action-btn">Start New Game</button>
          <div class="game-info">
            <h4>How to Play:</h4>
            <ul>
              <li>Roll oracle dice to determine movement options</li>
              <li>Move your ship across the sea and land hexes</li>
              <li>Spend favor to extend your movement range (1 extra hex per favor spent)</li>
              <li>Recolor dice by spending favor (1 favor per color advancement)</li>
              <li>Collect cubes and statues, fight monsters, and build temples</li>
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
              <li><strong>Oracle Phase:</strong> Roll 3 colored dice</li>
              <li><strong>Action Phase:</strong> First select a die, then perform actions (move, collect offerings, fight monsters, etc.)</li>
              <li>You can change your selected die before making a move</li>
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
      this.showGameOver(winCondition.winner!);
    }
  }

  private updatePlayerInfo(_gameState: unknown): void {
    const playerInfoContainer = document.getElementById("playerInfo");
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
      _currentPlayer.storage.map((slot: { type: string; color: string }, index: number) =>
        `<div class="storage-slot slot-${index} ${slot.type}">
                <div class="slot-content">
                  ${
          slot.type === "empty"
            ? '<span class="empty-slot">Empty</span>'
            : `<span class="item-type">${slot.type}</span>
                     <span class="color-swatch" style="background-color: ${
              this.getColorHex(slot.color)
            }"></span>
                     <span class="item-color">${slot.color}</span>`
        }
                </div>
              </div>`
      ).join("")
    }
          </div>
        </div>
        <div class="oracle-dice">
          <h4>Oracle Dice</h4>
          <div class="dice-container">
            ${
      _currentPlayer.oracleDice.map((color: string) => {
        const isSelected = this.selectedDieColor === color;
        return `<div class="die color-${color} ${
          isSelected ? "selected-die" : ""
        }" 
                     style="background-color: ${this.getColorHex(color)}"
                     data-die-color="${color}">
                ${color.charAt(0).toUpperCase()}
              </div>`;
      }).join("")
    }
            ${
      _currentPlayer.oracleDice.length === 0
        ? '<div class="no-dice">No dice rolled yet</div>'
        : ""
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
        : ""
    }
        </div>
        ${
      this.selectedDieColor && _currentPlayer.favor > 0
        ? this.renderRecolorOptions(_currentPlayer)
        : ""
    }
      </div>
    `;
  }

  private renderMap(gameState: GameState): void {
    const hexMapContainer = document.getElementById("hexMapSVG");
    if (!hexMapContainer) return;

    const grid = gameState.map.serialize();
    console.log("Grid structure:", grid);
    console.log("Grid length:", grid.length);

    if (grid && grid.length > 0) {
      console.log("First row length:", grid[0].length);
      console.log("First cell:", grid[0][0]);
    }

    try {
      // Update the hex map SVG with cube hex data
      const cubeHexes: CubeHex[] = gameState.cubeHexes || [];
      console.log("Cube hexes for rendering:", cubeHexes);

      // Debug: Log cube hex details
      cubeHexes.forEach((cubeHex: CubeHex, index: number) => {
        console.log(
          `Cube hex ${index}: (${cubeHex.q}, ${cubeHex.r}) with colors:`,
          cubeHex.cubeColors,
        );
      });

      // Update the hex map SVG with monster hex data
      const monsterHexes: MonsterHex[] = gameState.monsterHexes || [];
      console.log("Monster hexes for rendering:", monsterHexes);

      // Debug: Log monster hex details
      monsterHexes.forEach((monsterHex: MonsterHex, index: number) => {
        console.log(
          `Monster hex ${index}: (${monsterHex.q}, ${monsterHex.r}) with colors:`,
          monsterHex.monsterColors,
        );
      });

      // Debug: Check if cube hexes and monster hexes are being passed to SVG renderer
      console.log(
        "Setting cubeHexes in SVG options:",
        cubeHexes.length,
        "hexes",
      );
      console.log(
        "Setting monsterHexes in SVG options:",
        monsterHexes.length,
        "hexes",
      );

      this.hexMapSVG.setOptions({
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
        console.error("Error executing hex map script:", error);
      }

      // Add player markers to the map
      this.addPlayerMarkers(gameState.players);

      // Highlight available moves
      if (gameState.phase === "action") {
        this.highlightAvailableMoves();
      }
    } catch (error) {
      console.error("Error generating SVG:", error);
      const errorMessage = error instanceof Error
        ? error.message
        : String(error);
      hexMapContainer.innerHTML =
        `<div class="welcome-map"><p>Error generating map: ${errorMessage}</p></div>`;
    }
  }

  private addPlayerMarkers(players: Player[]): void {
    // Group players by their position
    const playersByPosition = new Map<string, Player[]>();
    players.forEach((player) => {
      const positionKey = `${player.shipPosition.q},${player.shipPosition.r}`;
      if (!playersByPosition.has(positionKey)) {
        playersByPosition.set(positionKey, []);
      }
      playersByPosition.get(positionKey)!.push(player);
    });

    // Add markers for each position group
    playersByPosition.forEach((playersAtPosition: Player[], positionKey) => {
      const [q, r] = positionKey.split(",").map(Number);
      const cell = document.querySelector(`[data-q="${q}"][data-r="${r}"]`);
      if (cell) {
        const rect = cell.getBoundingClientRect();
        const svg = cell.closest("svg");
        if (svg) {
          const point = svg.createSVGPoint();

          playersAtPosition.forEach((player: Player, index: number) => {
            // Calculate position in one of the four quadrants of the hex
            // Use smaller offsets to position dots closer to the center
            const quadrant = index % 4;
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
              "http://www.w3.org/2000/svg",
              "circle",
            );
            marker.setAttribute("cx", svgPoint.x.toString());
            marker.setAttribute("cy", svgPoint.y.toString());
            marker.setAttribute("r", "8");
            marker.setAttribute("fill", this.getColorHex(player.color));
            marker.setAttribute("stroke", "#fff");
            marker.setAttribute("stroke-width", "2");
            marker.setAttribute("class", "player-marker");
            marker.setAttribute("data-player-id", player.id.toString());

            svg.appendChild(marker);
          });
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

  private highlightAvailableMoves(): void {
    const currentPlayer = this.gameEngine.getCurrentPlayer();
    const availableMoves = this.gameEngine.getAvailableMovesWithFavor(
      currentPlayer.id,
    );

    // Clear previous highlights
    document.querySelectorAll(".available-move").forEach((cell) => {
      cell.classList.remove("available-move");
      cell.classList.remove("available-move-favor");
      cell.removeAttribute("title");
    });

    // Only highlight moves if a die is selected
    if (this.selectedDieColor) {
      // Get the effective die color considering recoloring intention
      let effectiveDieColor = this.selectedDieColor;
      if (currentPlayer.recoloredDice && currentPlayer.recoloredDice[this.selectedDieColor]) {
        effectiveDieColor = currentPlayer.recoloredDice[this.selectedDieColor].newColor;
      }

      availableMoves.forEach((move: { q: number; r: number; dieColor: string; favorCost: number }) => {
        // Only highlight moves that match the effective die color
        // The game engine returns moves based on sea tile color, which should match our effective die color
        if (move.dieColor === effectiveDieColor) {
          // Highlight the new hex-highlight polygons (centered, won't cover colored border)
          const highlightCell = document.querySelector(
            `.hex-highlight[data-q="${move.q}"][data-r="${move.r}"]`,
          );

          if (highlightCell) {
            if (move.favorCost > 0) {
              highlightCell.classList.add("available-move-favor");
              // Add tooltip to show required die color and favor cost
              highlightCell.setAttribute(
                "title",
                `Move using ${effectiveDieColor} die (costs ${move.favorCost} favor)`,
              );
            } else {
              highlightCell.classList.add("available-move");
              // Add tooltip to show required die color
              highlightCell.setAttribute(
                "title",
                `Move using ${effectiveDieColor} die`,
              );
            }
          }
        }
      });
    }
  }

  private updatePhaseDisplay(phase: string): void {
    const phaseDisplay = document.getElementById("phaseDisplay");
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
    const currentPlayer = this.gameEngine.getCurrentPlayer();

    switch (phase) {
      case "oracle": {
        return `
          <button id="rollDice" class="action-btn">Roll Oracle Dice</button>
        `;
      }
      case "action": {
        const currentCell = this.gameEngine.getGameState().map.getCell(
          currentPlayer.shipPosition.q,
          currentPlayer.shipPosition.r,
        );

        let actions = "";

        if (this.selectedDieColor) {
          // Die is selected - show available actions
          actions +=
            `<p>Selected die: <span class="color-swatch" style="background-color: ${
              this.getColorHex(this.selectedDieColor)
            }"></span> ${this.selectedDieColor}</p>`;

          // Show favor status
          actions += `<p>Available favor: ${currentPlayer.favor}</p>`;

          // Movement is always available during action phase with a selected die
          if (this.isFavorMode) {
            actions +=
              `<p><strong>Favor Mode Active:</strong> Ready to spend ${this.selectedFavorSpent} favor. Click a silver-highlighted hex to confirm move.</p>`;
          } else {
            actions += `<p>Click on highlighted hexes to move your ship:</p>
               <ul style="margin-left: 1rem;">
                 <li>White highlights: Normal range (3 hexes)</li>
                 <li>Silver highlights: Extended range (costs favor)</li>
               </ul>`;
          }

          // Spend die for favor action is always available during action phase with a selected die
          actions +=
            `<button id="spendDieForFavor" class="action-btn">Spend Die for 2 Favor</button>`;

          // Recolor die options are now displayed in the player info panel as radio buttons
          // The favor will be spent when the die is actually used for movement or other actions

          if (currentCell?.terrain === "cubes") {
            actions +=
              `<button id="collectOffering" class="action-btn">Collect Offering</button>`;
          }
          if (currentCell?.terrain === "monsters") {
            actions +=
              `<button id="fightMonster" class="action-btn">Fight Monster</button>`;
          }
          if (currentCell?.terrain === "temple") {
            actions +=
              `<button id="buildTemple" class="action-btn">Build Temple</button>`;
          }
          if (currentCell?.terrain === "foundations") {
            actions +=
              `<button id="buildFoundation" class="action-btn">Build Foundation</button>`;
          }
          if (currentCell?.terrain === "clouds") {
            actions +=
              `<button id="completeCloudQuest" class="action-btn">Complete Cloud Quest</button>`;
          }
          if (currentCell?.terrain === "city") {
            const canPlaceStatue = this.gameEngine.canPlaceStatueOnCity(
              currentPlayer.id,
            );
            if (canPlaceStatue) {
              actions +=
                `<button id="placeStatue" class="action-btn">Place Statue on City</button>`;
            } else {
              actions += `<p>Cannot place statue: ${
                currentCell.statues === 3
                  ? "City already has all 3 statues"
                  : "No statue of city's color in storage"
              }</p>`;
            }
          }
        } else {
          // No die selected - show selection instructions
          actions += `<p>Select an oracle die to perform actions</p>`;
          actions += `<p>Available dice: ${
            currentPlayer.oracleDice.join(", ")
          }</p>`;
        }

        if (!actions) {
          actions = "<p>No actions available at this location</p>";
        }

        actions +=
          `<button id="endTurn" class="action-btn secondary">End Turn</button>`;
        return actions;
      }
      default: {
        return "<p>Game phase not recognized</p>";
      }
    }
  }

  private setupEventListeners(): void {
    // Start game button
    document.addEventListener("click", (event) => {
      const target = event.target as HTMLElement;

      if (target.id === "startGame") {
        this.startNewGame();
      }
    });

    // Hex cell click for movement
    document.addEventListener("hexCellClick", (event: Event) => {
      if (!this.gameEngine.isGameInitialized()) return;

      const customEvent = event as CustomEvent<{ q: number; r: number }>;
      const { q, r } = customEvent.detail;
      const gameState = this.gameEngine.getGameState();

      if (gameState.phase === "action") {
        const currentPlayer = this.gameEngine.getCurrentPlayer();

        if (!this.selectedDieColor) {
          this.showMessage("Please select a die first!");
          return;
        }

        // Get available moves with favor options
        const availableMoves = this.gameEngine.getAvailableMovesWithFavor(
          currentPlayer.id,
        );
        
        // Get the effective die color considering recoloring intention
        let effectiveDieColor = this.selectedDieColor;
        if (currentPlayer.recoloredDice && currentPlayer.recoloredDice[this.selectedDieColor]) {
          effectiveDieColor = currentPlayer.recoloredDice[this.selectedDieColor].newColor;
        }
        
        const targetMove = availableMoves.find((move: { q: number; r: number; dieColor: string; favorCost: number }) =>
          move.q === q && move.r === r &&
          move.dieColor === effectiveDieColor
        );

        if (targetMove) {
          // Check if this move requires favor spending
          if (targetMove.favorCost > 0 && !this.isFavorMode) {
            // Ask player if they want to spend favor
            const confirmSpend = confirm(
              `This move requires spending ${targetMove.favorCost} favor to reach using ${effectiveDieColor} die. Do you want to spend favor to move here?`,
            );
            if (confirmSpend) {
              this.selectedFavorSpent = targetMove.favorCost;
              this.isFavorMode = true;
              this.showMessage(
                `Ready to move! Will spend ${targetMove.favorCost} favor. Click the hex again to confirm.`,
              );
              return;
            } else {
              return; // Player declined
            }
          }

          // Use the selected die color and favor spent
          // The game engine will handle recoloring internally
          const success = this.gameEngine.moveShip(
            currentPlayer.id,
            q,
            r,
            this.selectedDieColor,
            this.selectedFavorSpent,
          );
          if (success) {
            // Get the effective die color that was actually used
            let effectiveDieColor = this.selectedDieColor;
            if (currentPlayer.recoloredDice && currentPlayer.recoloredDice[this.selectedDieColor]) {
              effectiveDieColor = currentPlayer.recoloredDice[this.selectedDieColor].newColor;
            }
            
            let message =
              `Ship moved to (${q}, ${r}) using ${effectiveDieColor} die`;
            if (this.selectedFavorSpent > 0) {
              message += ` and ${this.selectedFavorSpent} favor`;
            }
            this.showMessage(message);
            // Clear selections after successful move
            this.selectedDieColor = null;
            this.selectedFavorSpent = 0;
            this.isFavorMode = false;
            this.renderGameState();
          } else {
            this.showMessage("Invalid move!");
          }
        } else {
          if (this.isFavorMode) {
            // Cancel favor mode if clicking a different hex
            this.selectedFavorSpent = 0;
            this.isFavorMode = false;
            this.showMessage("Favor spending cancelled.");
          } else {
            this.showMessage(
              `Cannot move to this hex using ${effectiveDieColor} die! Must be a sea hex within range of matching color.`,
            );
          }
        }
      }
    });

    // Delegate phase action buttons
    document.addEventListener("click", (event) => {
      if (!this.gameEngine.isGameInitialized()) return;

      const target = event.target as HTMLElement;

      if (target.id === "rollDice") {
        this.rollOracleDice();
      } else if (target.id === "collectOffering") {
        this.collectOffering();
      } else if (target.id === "fightMonster") {
        this.fightMonster();
      } else if (target.id === "buildTemple") {
        this.buildTemple();
      } else if (target.id === "buildFoundation") {
        this.buildFoundation();
      } else if (target.id === "completeCloudQuest") {
        this.completeCloudQuest();
      } else if (target.id === "placeStatue") {
        this.placeStatueOnCity();
      } else if (target.id === "spendDieForFavor") {
        this.spendDieForFavor();
      } else if (target.id === "endTurn") {
        this.endTurn();
      } else if (target.id === "clearDieSelection") {
        this.clearDieSelection();
      } else if (target.classList.contains("die")) {
        const dieColor = target.getAttribute("data-die-color") as HexColor;
        if (dieColor) {
          this.selectDie(dieColor);
        }
      } else if (target instanceof HTMLInputElement && target.name === "recolorOption") {
        const favorCost = parseInt(target.value || "0");
        this.setRecolorIntention(favorCost);
      }
    });
  }

  private startNewGame(): void {
    this.gameEngine.initializeGame();
    this.renderGameState();
    this.showMessage("New game started! Player 1's turn begins.");
  }

  private rollOracleDice(): void {
    try {
      const currentPlayer = this.gameEngine.getCurrentPlayer();
      const dice = this.gameEngine.rollOracleDice(currentPlayer.id);
      this.showMessage(`Rolled oracle dice: ${dice.join(", ")}`);
      this.renderGameState();
    } catch (_error) {
      this.showMessage("Cannot roll dice at this time");
    }
  }

  private collectOffering(): void {
    const currentPlayer = this.gameEngine.getCurrentPlayer();
    const currentCell = this.gameEngine.getGameState().map.getCell(
      currentPlayer.shipPosition.q,
      currentPlayer.shipPosition.r,
    );

    if (currentCell?.terrain === "cubes" && currentCell.color !== "none") {
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
        this.showMessage("No storage space available for cube!");
      }
    }
  }

  private fightMonster(): void {
    const currentPlayer = this.gameEngine.getCurrentPlayer();
    const success = this.gameEngine.fightMonster(currentPlayer.id);
    if (success) {
      this.showMessage("Monster defeated! Quest completed!");
      // Clear selected die after successful action
      this.selectedDieColor = null;
      this.renderGameState();
    } else {
      this.showMessage("Not enough oracle dice to fight this monster");
    }
  }

  private buildTemple(): void {
    const currentPlayer = this.gameEngine.getCurrentPlayer();
    const success = this.gameEngine.buildTemple(currentPlayer.id);
    if (success) {
      this.showMessage("Temple built! Quest completed!");
      // Clear selected die after successful action
      this.selectedDieColor = null;
      this.renderGameState();
    } else {
      this.showMessage("Cannot build temple here or missing required cube");
    }
  }

  private buildFoundation(): void {
    const currentPlayer = this.gameEngine.getCurrentPlayer();
    const success = this.gameEngine.buildFoundation(currentPlayer.id);
    if (success) {
      this.showMessage("Foundation built! Quest completed!");
      // Clear selected die after successful action
      this.selectedDieColor = null;
      this.renderGameState();
    } else {
      this.showMessage("Cannot build foundation here");
    }
  }

  private completeCloudQuest(): void {
    const currentPlayer = this.gameEngine.getCurrentPlayer();
    const success = this.gameEngine.completeCloudQuest(currentPlayer.id);
    if (success) {
      this.showMessage("Cloud quest completed!");
      // Clear selected die after successful action
      this.selectedDieColor = null;
      this.renderGameState();
    } else {
      this.showMessage(
        "Cannot complete cloud quest here or missing required statue",
      );
    }
  }

  private placeStatueOnCity(): void {
    const currentPlayer = this.gameEngine.getCurrentPlayer();
    const success = this.gameEngine.placeStatueOnCity(currentPlayer.id);
    if (success) {
      const currentCell = this.gameEngine.getGameState().map.getCell(
        currentPlayer.shipPosition.q,
        currentPlayer.shipPosition.r,
      );
      if (currentCell) {
        this.showMessage(
          `Statue placed on city! (${currentCell.statues}/3 statues)`,
        );
      } else {
        this.showMessage("Statue placed on city!");
      }
      // Clear selected die after successful action
      this.selectedDieColor = null;
      this.renderGameState();
    } else {
      this.showMessage("Cannot place statue on this city");
    }
  }

  private spendDieForFavor(): void {
    const currentPlayer = this.gameEngine.getCurrentPlayer();

    if (!this.selectedDieColor) {
      this.showMessage("Please select a die first!");
      return;
    }

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
      this.showMessage("Cannot spend die for favor at this time");
    }
  }

  private setRecolorIntention(favorCost: number): void {
    const currentPlayer = this.gameEngine.getCurrentPlayer();

    if (!this.selectedDieColor) {
      this.showMessage("Please select a die first!");
      return;
    }

    if (favorCost === 0) {
      // Clear recoloring intention
      const success = this.gameEngine.clearRecolorIntention(
        currentPlayer.id,
        this.selectedDieColor,
      );
      if (success) {
        this.showMessage("Recoloring intention cleared");
        this.renderGameState();
        // Update available moves since die color intention changed
        this.highlightAvailableMoves();
      } else {
        this.showMessage("Cannot clear recoloring intention");
      }
    } else {
      // Set recoloring intention
      const success = this.gameEngine.setRecolorIntention(
        currentPlayer.id,
        this.selectedDieColor,
        favorCost,
      );
      if (success) {
        const colorWheel: HexColor[] = ["black", "pink", "blue", "yellow", "green", "red"];
        const currentIndex = colorWheel.indexOf(this.selectedDieColor);
        const newIndex = (currentIndex + favorCost) % colorWheel.length;
        const newColor = colorWheel[newIndex];
        
        this.showMessage(
          `Die will be recolored from ${this.selectedDieColor} to ${newColor} when used (${favorCost} favor will be spent)`,
        );
        this.renderGameState();
        // Update available moves since die color intention changed
        this.highlightAvailableMoves();
      } else {
        this.showMessage("Cannot set recoloring intention");
      }
    }
  }

  private selectDie(dieColor: HexColor): void {
    const currentPlayer = this.gameEngine.getCurrentPlayer();

    // Check if the player has this die
    if (currentPlayer.oracleDice.includes(dieColor)) {
      this.selectedDieColor = dieColor;
      this.showMessage(`Selected ${dieColor} die`);
      this.renderGameState();
    }
  }

  private clearDieSelection(): void {
    this.selectedDieColor = null;
    this.selectedFavorSpent = 0;
    this.isFavorMode = false;
    this.showMessage("Die selection cleared");
    this.renderGameState();
  }

  private endTurn(): void {
    // Clear selections when ending turn
    this.selectedDieColor = null;
    this.selectedFavorSpent = 0;
    this.isFavorMode = false;

    // Call the game engine's endTurn method to advance to the next player
    // Note: This will reset oracle dice and advance the current player index
    this.gameEngine.endTurn();

    this.showMessage(
      "Turn ended. Next player's turn begins.",
    );

    this.renderGameState();
  }

  private showMessage(message: string): void {
    const messageContainer = document.getElementById("gameMessage");
    if (messageContainer) {
      messageContainer.textContent = message;
      messageContainer.style.display = "block";

      setTimeout(() => {
        messageContainer.style.display = "none";
      }, 3000);
    }
  }

  private renderRecolorOptions(player: Player): string {
    if (!this.selectedDieColor) return "";

    const colorWheel: HexColor[] = ["black", "pink", "blue", "yellow", "green", "red"];
    const currentIndex = colorWheel.indexOf(this.selectedDieColor);
    
    if (currentIndex === -1) return "";

    let options = `
      <div class="recolor-section" style="margin-top: 1rem;">
        <h4>Recolor Die (Favor will be spent when die is used)</h4>
        <p style="font-size: 0.9rem; opacity: 0.8;">Color wheel: black → pink → blue → yellow → green → red → black</p>
        <div class="recolor-options" style="margin-top: 0.5rem;">
    `;

    // Add "No Recolor" option
    const hasRecolorIntention = player.recoloredDice && player.recoloredDice[this.selectedDieColor];
    options += `
      <div class="recolor-option" style="margin-bottom: 0.5rem;">
        <label style="display: flex; align-items: center; gap: 0.5rem;">
          <input type="radio" name="recolorOption" value="0" ${
            !hasRecolorIntention ? 'checked' : ''
          } data-recolor-favor="0">
          <span class="color-swatch" style="background-color: ${this.getColorHex(this.selectedDieColor)}"></span>
          Keep ${this.selectedDieColor} (0 favor)
        </label>
      </div>
    `;

    // Add recolor options
    for (let favorCost = 1; favorCost <= Math.min(player.favor, 5); favorCost++) {
      const newIndex = (currentIndex + favorCost) % colorWheel.length;
      const newColor = colorWheel[newIndex];
      const isSelected = hasRecolorIntention && player.recoloredDice[this.selectedDieColor].favorCost === favorCost;
      
      options += `
        <div class="recolor-option" style="margin-bottom: 0.5rem;">
          <label style="display: flex; align-items: center; gap: 0.5rem;">
            <input type="radio" name="recolorOption" value="${favorCost}" ${
              isSelected ? 'checked' : ''
            } data-recolor-favor="${favorCost}">
            <span class="color-swatch" style="background-color: ${this.getColorHex(newColor)}"></span>
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
    const actionButtons = document.querySelectorAll(".action-btn");
    actionButtons.forEach((button: Element) => {
      (button as HTMLButtonElement).disabled = true;
    });
  }

  private getColorHex(color: string): string {
    const colors: Record<string, string> = {
      red: "#DC143C",
      pink: "#ff69b4",
      blue: "#0000ff",
      black: "#000000",
      green: "#008000",
      yellow: "#ffff00",
    };
    return colors[color] || "#333333";
  }
}
