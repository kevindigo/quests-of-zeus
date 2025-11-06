// Oracle of Delphi Game Engine
// Core game mechanics and state management

import type { HexCell, HexColor, TerrainType } from "./hexmap.ts";
import { HexMap, ALL_COLORS, COLORS } from "./hexmap.ts";

export interface StorageSlot {
  type: "cube" | "statue" | "empty";
  color: HexColor;
}

export interface Player {
  id: number;
  name: string;
  color: HexColor;
  shipPosition: { q: number; r: number };
  storage: [StorageSlot, StorageSlot]; // 2 storage slots, each can hold 1 cube or 1 statue
  completedQuests: number;
  completedQuestTypes: {
    temple_offering: number;
    monster: number;
    foundation: number;
    cloud: number;
  };
  oracleDice: HexColor[]; // Current oracle dice values
}



export interface GameState {
  map: HexMap;
  players: Player[];
  currentPlayerIndex: number;
  round: number;
  phase: "setup" | "oracle" | "movement" | "action" | "end";
  monsterStrength: number;
  weatherDice: HexColor[];
}

// Helper function to create empty storage slots
function createEmptyStorage(): [StorageSlot, StorageSlot] {
  return [
    { type: "empty", color: "none" },
    { type: "empty", color: "none" }
  ];
}

// Helper function to check if player has a cube of specific color
function hasCubeOfColor(player: Player, color: HexColor): boolean {
  return player.storage.some(slot => slot.type === "cube" && slot.color === color);
}

// Helper function to check if player has a statue of specific color
function hasStatueOfColor(player: Player, color: HexColor): boolean {
  return player.storage.some(slot => slot.type === "statue" && slot.color === color);
}

// Helper function to check if player has any cube
function hasAnyCube(player: Player): boolean {
  return player.storage.some(slot => slot.type === "cube");
}

// Helper function to check if player has any statue
function hasAnyStatue(player: Player): boolean {
  return player.storage.some(slot => slot.type === "statue");
}

// Helper function to count how many cubes of specific color player has
function countCubesOfColor(player: Player, color: HexColor): number {
  return player.storage.filter(slot => slot.type === "cube" && slot.color === color).length;
}

// Helper function to count how many statues of specific color player has
function countStatuesOfColor(player: Player, color: HexColor): number {
  return player.storage.filter(slot => slot.type === "statue" && slot.color === color).length;
}

// Helper function to add a cube to storage (returns true if successful)
function addCubeToStorage(player: Player, color: HexColor): boolean {
  const emptySlotIndex = player.storage.findIndex(slot => slot.type === "empty");
  if (emptySlotIndex !== -1) {
    player.storage[emptySlotIndex] = { type: "cube", color };
    return true;
  }
  return false;
}

// Helper function to add a statue to storage (returns true if successful)
function addStatueToStorage(player: Player, color: HexColor): boolean {
  const emptySlotIndex = player.storage.findIndex(slot => slot.type === "empty");
  if (emptySlotIndex !== -1) {
    player.storage[emptySlotIndex] = { type: "statue", color };
    return true;
  }
  return false;
}

// Helper function to remove a cube of specific color from storage (returns true if successful)
function removeCubeFromStorage(player: Player, color: HexColor): boolean {
  const cubeSlotIndex = player.storage.findIndex(slot => slot.type === "cube" && slot.color === color);
  if (cubeSlotIndex !== -1) {
    player.storage[cubeSlotIndex] = { type: "empty", color: "none" };
    return true;
  }
  return false;
}

// Helper function to remove a statue of specific color from storage (returns true if successful)
function removeStatueFromStorage(player: Player, color: HexColor): boolean {
  const statueSlotIndex = player.storage.findIndex(slot => slot.type === "statue" && slot.color === color);
  if (statueSlotIndex !== -1) {
    player.storage[statueSlotIndex] = { type: "empty", color: "none" };
    return true;
  }
  return false;
}

export class OracleGameEngine {
  private state: GameState | null = null;

  constructor() {
    // Game is not initialized by default
  }

  public initializeGame(): GameState {
    const map = new HexMap();
    
    // Find the Zeus hex coordinates
    const zeusCell = map.getCellsByTerrain("zeus")[0];
    const zeusPosition = zeusCell ? { q: zeusCell.q, r: zeusCell.r } : { q: 0, r: 0 };
    
    // Initialize players (2-4 players)
    const players: Player[] = [
      {
        id: 1,
        name: "Player 1",
        color: COLORS.RED,
        shipPosition: zeusPosition, // All players start on Zeus hex
        storage: createEmptyStorage(),
        completedQuests: 0,
        completedQuestTypes: {
          temple_offering: 0,
          monster: 0,
          foundation: 0,
          cloud: 0,
        },
        oracleDice: [],
      },
      {
        id: 2,
        name: "Player 2",
        color: COLORS.BLUE,
        shipPosition: zeusPosition, // All players start on Zeus hex
        storage: createEmptyStorage(),
        completedQuests: 0,
        completedQuestTypes: {
          temple_offering: 0,
          monster: 0,
          foundation: 0,
          cloud: 0,
        },
        oracleDice: [],
      },
    ];

    this.state = {
      map,
      players,
      currentPlayerIndex: 0,
      round: 1,
      phase: "setup",
      monsterStrength: 3,
      weatherDice: [],
    };

    return this.state;
  }



  // Game Actions
  public rollOracleDice(playerId: number): HexColor[] {
    if (!this.state) {
      throw new Error("Game not initialized. Call initializeGame() first.");
    }
    const player = this.state.players.find(p => p.id === playerId);
    if (!player || this.state.currentPlayerIndex !== this.getPlayerIndex(playerId)) {
      throw new Error("Invalid player or turn");
    }

    // Roll 3 oracle dice (random colors)
    const dice: HexColor[] = [];
    for (let i = 0; i < 3; i++) {
      const randomColor = ALL_COLORS[Math.floor(Math.random() * ALL_COLORS.length)];
      dice.push(randomColor);
    }

    player.oracleDice = dice;
    this.state.phase = "movement";
    
    return dice;
  }

  public moveShip(playerId: number, targetQ: number, targetR: number): boolean {
    if (!this.state) {
      throw new Error("Game not initialized. Call initializeGame() first.");
    }
    const player = this.state.players.find(p => p.id === playerId);
    if (!player || this.state.currentPlayerIndex !== this.getPlayerIndex(playerId)) {
      return false;
    }

    if (this.state.phase !== "movement") {
      return false;
    }

    // Check if movement is valid (adjacent hex)
    const currentPos = player.shipPosition;
    const targetCell = this.state.map.getCell(targetQ, targetR);
    
    if (!targetCell) {
      return false;
    }

    // Check adjacency
    const neighbors = this.state.map.getNeighbors(currentPos.q, currentPos.r);
    const isAdjacent = neighbors.some(neighbor => 
      neighbor.q === targetQ && neighbor.r === targetR
    );

    if (!isAdjacent) {
      return false;
    }

    // Check if player has required oracle dice for sea movement
    if (targetCell.terrain === "sea" && targetCell.color !== "none") {
      const requiredColor = targetCell.color;
      const hasDice = player.oracleDice.includes(requiredColor);
      
      if (!hasDice) {
        return false;
      }

      // Consume the oracle die
      const dieIndex = player.oracleDice.indexOf(requiredColor);
      player.oracleDice.splice(dieIndex, 1);
    }

    // Move the ship
    player.shipPosition = { q: targetQ, r: targetR };
    this.state.phase = "action";
    
    return true;
  }

  public collectOffering(playerId: number, color: HexColor): boolean {
    if (!this.state) {
      throw new Error("Game not initialized. Call initializeGame() first.");
    }
    const player = this.state.players.find(p => p.id === playerId);
    if (!player || this.state.phase !== "action") {
      return false;
    }

    // Check if player is on a cube hex of the specified color
    const currentCell = this.state.map.getCell(player.shipPosition.q, player.shipPosition.r);
    if (!currentCell || currentCell.terrain !== "cubes" || currentCell.color !== color) {
      return false;
    }

    // Try to add cube to storage
    const success = addCubeToStorage(player, color);
    if (success) {
      this.endTurn();
    }
    
    return success;
  }

  public fightMonster(playerId: number): boolean {
    if (!this.state) {
      throw new Error("Game not initialized. Call initializeGame() first.");
    }
    const player = this.state.players.find(p => p.id === playerId);
    if (!player || this.state.phase !== "action") {
      return false;
    }

    // Check if player is on a monster hex
    const currentCell = this.state.map.getCell(player.shipPosition.q, player.shipPosition.r);
    if (!currentCell || currentCell.terrain !== "monsters") {
      return false;
    }

    // Check if player has required oracle dice
    const requiredDice = this.state.monsterStrength;
    if (player.oracleDice.length < requiredDice) {
      return false;
    }

    // Consume oracle dice
    player.oracleDice.splice(0, requiredDice);
    
    // Complete monster quest
    this.completeQuestType(playerId, "monster");
    this.endTurn();
    
    return true;
  }

  public buildTemple(playerId: number): boolean {
    if (!this.state) {
      throw new Error("Game not initialized. Call initializeGame() first.");
    }
    const player = this.state.players.find(p => p.id === playerId);
    if (!player || this.state.phase !== "action") {
      return false;
    }

    // Check if player is on a temple hex
    const currentCell = this.state.map.getCell(player.shipPosition.q, player.shipPosition.r);
    if (!currentCell || currentCell.terrain !== "temple") {
      return false;
    }

    // Check if player has a cube of the required color
    const requiredColor = currentCell.color;
    if (!hasCubeOfColor(player, requiredColor)) {
      return false;
    }

    // Consume cube and complete temple
    const success = removeCubeFromStorage(player, requiredColor);
    if (success) {
      this.completeQuestType(playerId, "temple_offering");
      this.endTurn();
    }
    
    return success;
  }

  public buildFoundation(playerId: number): boolean {
    if (!this.state) {
      throw new Error("Game not initialized. Call initializeGame() first.");
    }
    const player = this.state.players.find(p => p.id === playerId);
    if (!player || this.state.phase !== "action") {
      return false;
    }

    // Check if player is on a foundation hex
    const currentCell = this.state.map.getCell(player.shipPosition.q, player.shipPosition.r);
    if (!currentCell || currentCell.terrain !== "foundations") {
      return false;
    }

    // Complete foundation quest
    this.completeQuestType(playerId, "foundation");
    this.endTurn();
    
    return true;
  }

  public completeCloudQuest(playerId: number): boolean {
    if (!this.state) {
      throw new Error("Game not initialized. Call initializeGame() first.");
    }
    const player = this.state.players.find(p => p.id === playerId);
    if (!player || this.state.phase !== "action") {
      return false;
    }

    // Check if player is on a cloud hex
    const currentCell = this.state.map.getCell(player.shipPosition.q, player.shipPosition.r);
    if (!currentCell || currentCell.terrain !== "clouds") {
      return false;
    }

    // Check if player has a statue of the required color
    const requiredColor = currentCell.color;
    if (!hasStatueOfColor(player, requiredColor)) {
      return false;
    }

    // Consume statue and complete cloud quest
    const success = removeStatueFromStorage(player, requiredColor);
    if (success) {
      this.completeQuestType(playerId, "cloud");
      this.endTurn();
    }
    
    return success;
  }

  private completeQuestType(playerId: number, questType: "temple_offering" | "monster" | "foundation" | "cloud"): void {
    if (!this.state) {
      throw new Error("Game not initialized. Call initializeGame() first.");
    }
    const player = this.state.players.find(p => p.id === playerId);
    if (!player) return;

    player.completedQuests++;
    player.completedQuestTypes[questType]++;
  }

  private endTurn(): void {
    if (!this.state) {
      throw new Error("Game not initialized. Call initializeGame() first.");
    }
    // Reset oracle dice
    const currentPlayer = this.state.players[this.state.currentPlayerIndex];
    currentPlayer.oracleDice = [];

    // Move to next player
    this.state.currentPlayerIndex = (this.state.currentPlayerIndex + 1) % this.state.players.length;
    
    // If all players have taken their turn, advance round
    if (this.state.currentPlayerIndex === 0) {
      this.state.round++;
    }

    // Reset phase for next player
    this.state.phase = "oracle";
  }

  private getPlayerIndex(playerId: number): number {
    if (!this.state) {
      throw new Error("Game not initialized. Call initializeGame() first.");
    }
    return this.state.players.findIndex(p => p.id === playerId);
  }

  // Game status
  public isGameInitialized(): boolean {
    return this.state !== null;
  }

  // Public getters
  public getGameState(): GameState {
    if (!this.state) {
      throw new Error("Game not initialized. Call initializeGame() first.");
    }
    // Create a deep copy of the state, but preserve the HexMap instance
    const stateCopy = JSON.parse(JSON.stringify(this.state));
    // Replace the serialized map with the actual HexMap instance
    stateCopy.map = this.state.map;
    return stateCopy;
  }

  public getCurrentPlayer(): Player {
    if (!this.state) {
      throw new Error("Game not initialized. Call initializeGame() first.");
    }
    return this.state.players[this.state.currentPlayerIndex];
  }

  public getPlayer(playerId: number): Player | undefined {
    if (!this.state) {
      throw new Error("Game not initialized. Call initializeGame() first.");
    }
    return this.state.players.find(p => p.id === playerId);
  }

  public getAvailableMoves(playerId: number): { q: number; r: number }[] {
    if (!this.state) {
      throw new Error("Game not initialized. Call initializeGame() first.");
    }
    const player = this.state.players.find(p => p.id === playerId);
    if (!player || this.state.phase !== "movement") {
      return [];
    }

    const currentPos = player.shipPosition;
    const neighbors = this.state.map.getNeighbors(currentPos.q, currentPos.r);
    
    return neighbors.filter(neighbor => {
      // Check if movement to this hex is possible
      if (neighbor.terrain === "sea" && neighbor.color !== "none") {
        return player.oracleDice.includes(neighbor.color);
      }
      return true; // Land hexes are always accessible
    }).map(neighbor => ({ q: neighbor.q, r: neighbor.r }));
  }

  public checkWinCondition(): { winner: Player | null; gameOver: boolean } {
    if (!this.state) {
      throw new Error("Game not initialized. Call initializeGame() first.");
    }
    // Game ends when any player completes 3 of each quest type
    const winner = this.state.players.find(p => 
      p.completedQuestTypes.temple_offering >= 3 &&
      p.completedQuestTypes.monster >= 3 &&
      p.completedQuestTypes.foundation >= 3 &&
      p.completedQuestTypes.cloud >= 3
    );
    return {
      winner: winner || null,
      gameOver: !!winner
    };
  }
}