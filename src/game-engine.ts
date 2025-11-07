// Oracle of Delphi Game Engine
// Core game mechanics and state management

import type { HexColor } from "./hexmap.ts";
import { ALL_COLORS, COLORS, HexMap } from "./hexmap.ts";

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
  favor: number; // Player's favor resource
}

export interface CubeHex {
  q: number;
  r: number;
  cubeColors: HexColor[]; // Array of colors that have cubes on this hex (no duplicates)
}

export interface MonsterHex {
  q: number;
  r: number;
  monsterColors: HexColor[]; // Array of monster colors on this hex (no duplicates, max 2 per hex)
}

export interface GameState {
  map: HexMap;
  players: Player[];
  currentPlayerIndex: number;
  round: number;
  phase: "setup" | "oracle" | "action" | "end";
  monsterStrength: number;
  weatherDice: HexColor[];
  cubeHexes: CubeHex[];
  monsterHexes: MonsterHex[];
}

// Helper function to create empty storage slots
function createEmptyStorage(): [StorageSlot, StorageSlot] {
  return [
    { type: "empty", color: "none" },
    { type: "empty", color: "none" },
  ];
}

// Helper function to check if player has a cube of specific color
function hasCubeOfColor(player: Player, color: HexColor): boolean {
  return player.storage.some((slot) =>
    slot.type === "cube" && slot.color === color
  );
}

// Helper function to check if player has a statue of specific color
function hasStatueOfColor(player: Player, color: HexColor): boolean {
  return player.storage.some((slot) =>
    slot.type === "statue" && slot.color === color
  );
}

// Helper function to add a cube to storage (returns true if successful)
function addCubeToStorage(player: Player, color: HexColor): boolean {
  const emptySlotIndex = player.storage.findIndex((slot) =>
    slot.type === "empty"
  );
  if (emptySlotIndex !== -1) {
    player.storage[emptySlotIndex] = { type: "cube", color };
    return true;
  }
  return false;
}

// Helper function to remove a cube of specific color from storage (returns true if successful)
function removeCubeFromStorage(player: Player, color: HexColor): boolean {
  const cubeSlotIndex = player.storage.findIndex((slot) =>
    slot.type === "cube" && slot.color === color
  );
  if (cubeSlotIndex !== -1) {
    player.storage[cubeSlotIndex] = { type: "empty", color: "none" };
    return true;
  }
  return false;
}

// Helper function to remove a statue of specific color from storage (returns true if successful)
function removeStatueFromStorage(player: Player, color: HexColor): boolean {
  const statueSlotIndex = player.storage.findIndex((slot) =>
    slot.type === "statue" && slot.color === color
  );
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
    const zeusPosition = zeusCell
      ? { q: zeusCell.q, r: zeusCell.r }
      : { q: 0, r: 0 };

    // Initialize players (2-4 players)
    const playerColors = [COLORS.RED, COLORS.BLUE, COLORS.GREEN, COLORS.YELLOW];
    const players: Player[] = [];

    for (let i = 0; i < 2; i++) { // Start with 2 players for now
      players.push({
        id: i + 1,
        name: `Player ${i + 1}`,
        color: playerColors[i],
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
        favor: 3 + i, // First player gets 3 favor, each subsequent gets 1 more
      });
    }

    // Initialize cube hexes with Offering cubes
    const cubeHexes = this.initializeOfferingCubes(map, players.length);

    // Initialize monster hexes with monster distribution
    const monsterHexes = this.initializeMonsters(map, players.length);

    this.state = {
      map,
      players,
      currentPlayerIndex: 0,
      round: 1,
      phase: "oracle",
      monsterStrength: 3,
      weatherDice: [],
      cubeHexes,
      monsterHexes,
    };

    return this.state;
  }

  // Game Actions
  public rollOracleDice(playerId: number): HexColor[] {
    if (!this.state) {
      throw new Error("Game not initialized. Call initializeGame() first.");
    }
    const player = this.state.players.find((p) => p.id === playerId);
    if (
      !player || this.state.currentPlayerIndex !== this.getPlayerIndex(playerId)
    ) {
      throw new Error("Invalid player or turn");
    }

    // Roll 3 oracle dice (random colors)
    const dice: HexColor[] = [];
    for (let i = 0; i < 3; i++) {
      const randomColor =
        ALL_COLORS[Math.floor(Math.random() * ALL_COLORS.length)];
      dice.push(randomColor);
    }

    player.oracleDice = dice;
    this.state.phase = "action";

    return dice;
  }

  public moveShip(
    playerId: number,
    targetQ: number,
    targetR: number,
    dieColor?: HexColor,
  ): boolean {
    if (!this.state) {
      throw new Error("Game not initialized. Call initializeGame() first.");
    }
    const player = this.state.players.find((p) => p.id === playerId);
    if (
      !player || this.state.currentPlayerIndex !== this.getPlayerIndex(playerId)
    ) {
      return false;
    }

    if (this.state.phase !== "action") {
      return false;
    }

    const currentPos = player.shipPosition;
    const targetCell = this.state.map.getCell(targetQ, targetR);

    if (!targetCell) {
      return false;
    }

    // Rule 1: You can only move to sea spaces
    if (targetCell.terrain !== "sea") {
      return false;
    }

    // Rule 3: Can only land on sea hexes of the color of the die they used
    if (!dieColor || targetCell.color !== dieColor) {
      return false;
    }

    // Check if player has the required oracle die
    if (!player.oracleDice.includes(dieColor)) {
      return false;
    }

    // Rule 2: Each ship has a movement value of 3 (can move up to 3 steps on sea tiles)
    // Check if the target is reachable within 3 steps on sea tiles
    const reachableSeaTiles = this.getReachableSeaTiles(
      currentPos.q,
      currentPos.r,
      3,
    );

    const isReachable = reachableSeaTiles.some((tile) =>
      tile.q === targetQ && tile.r === targetR
    );

    if (!isReachable) {
      return false;
    }

    // Consume the oracle die
    const dieIndex = player.oracleDice.indexOf(dieColor);
    if (dieIndex !== -1) {
      player.oracleDice.splice(dieIndex, 1);
    } else {
      // This should not happen since we checked above, but log for debugging
      console.warn(
        `Attempted to consume die ${dieColor} but it was not found in player's oracle dice: [${
          player.oracleDice.join(", ")
        }]`,
      );
      return false;
    }

    // Move the ship
    player.shipPosition = { q: targetQ, r: targetR };

    return true;
  }

  public collectOffering(playerId: number, color: HexColor): boolean {
    if (!this.state) {
      throw new Error("Game not initialized. Call initializeGame() first.");
    }
    const player = this.state.players.find((p) => p.id === playerId);
    if (!player || this.state.phase !== "action") {
      return false;
    }

    // Check if player is on a cube hex
    const currentCell = this.state.map.getCell(
      player.shipPosition.q,
      player.shipPosition.r,
    );
    if (!currentCell || currentCell.terrain !== "cubes") {
      return false;
    }

    // Find the cube hex in our tracking
    const cubeHex = this.state.cubeHexes.find((ch) =>
      ch.q === currentCell.q && ch.r === currentCell.r
    );

    if (!cubeHex) {
      return false;
    }

    // Check if the requested color is available on this hex
    if (!cubeHex.cubeColors.includes(color)) {
      return false;
    }

    // Try to add cube to storage
    const success = addCubeToStorage(player, color);
    if (success) {
      // Remove this color from the hex
      const colorIndex = cubeHex.cubeColors.indexOf(color);
      cubeHex.cubeColors.splice(colorIndex, 1);
      this.endTurn();
    }

    return success;
  }

  public fightMonster(playerId: number): boolean {
    if (!this.state) {
      throw new Error("Game not initialized. Call initializeGame() first.");
    }
    const player = this.state.players.find((p) => p.id === playerId);
    if (!player || this.state.phase !== "action") {
      return false;
    }

    // Check if player is on a monster hex
    const currentCell = this.state.map.getCell(
      player.shipPosition.q,
      player.shipPosition.r,
    );
    if (!currentCell || currentCell.terrain !== "monsters") {
      return false;
    }

    // Find the monster hex in our tracking
    const monsterHex = this.state.monsterHexes.find((mh) =>
      mh.q === currentCell.q && mh.r === currentCell.r
    );

    if (!monsterHex || monsterHex.monsterColors.length === 0) {
      return false; // No monsters on this hex
    }

    // Check if player has required oracle dice
    const requiredDice = this.state.monsterStrength;
    if (player.oracleDice.length < requiredDice) {
      return false;
    }

    // Consume oracle dice
    player.oracleDice.splice(0, requiredDice);

    // Remove one monster from this hex (first one)
    monsterHex.monsterColors.shift();

    // Complete monster quest
    this.completeQuestType(playerId, "monster");
    this.endTurn();

    return true;
  }

  public buildTemple(playerId: number): boolean {
    if (!this.state) {
      throw new Error("Game not initialized. Call initializeGame() first.");
    }
    const player = this.state.players.find((p) => p.id === playerId);
    if (!player || this.state.phase !== "action") {
      return false;
    }

    // Check if player is on a temple hex
    const currentCell = this.state.map.getCell(
      player.shipPosition.q,
      player.shipPosition.r,
    );
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
    const player = this.state.players.find((p) => p.id === playerId);
    if (!player || this.state.phase !== "action") {
      return false;
    }

    // Check if player is on a foundation hex
    const currentCell = this.state.map.getCell(
      player.shipPosition.q,
      player.shipPosition.r,
    );
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
    const player = this.state.players.find((p) => p.id === playerId);
    if (!player || this.state.phase !== "action") {
      return false;
    }

    // Check if player is on a cloud hex
    const currentCell = this.state.map.getCell(
      player.shipPosition.q,
      player.shipPosition.r,
    );
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

  /**
   * Place a statue on a city
   * Player must be on the city and have a statue of the city's color in storage
   */
  public placeStatueOnCity(playerId: number): boolean {
    if (!this.state) {
      throw new Error("Game not initialized. Call initializeGame() first.");
    }
    const player = this.state.players.find((p) => p.id === playerId);
    if (!player || this.state.phase !== "action") {
      return false;
    }

    // Check if player is on a city hex
    const currentCell = this.state.map.getCell(
      player.shipPosition.q,
      player.shipPosition.r,
    );
    if (!currentCell || currentCell.terrain !== "city") {
      return false;
    }

    // Check if city already has all 3 statues
    if (currentCell.statues === 3) {
      return false;
    }

    // Check if player has a statue of the city's color
    const requiredColor = currentCell.color;
    if (!hasStatueOfColor(player, requiredColor)) {
      return false;
    }

    // Consume statue from storage and add to city
    const success = removeStatueFromStorage(player, requiredColor);
    if (success) {
      this.state.map.addStatueToCity(currentCell.q, currentCell.r);
      this.endTurn();
    }

    return success;
  }

  /**
   * Spend any die to gain 2 favor during the action phase
   */
  public spendDieForFavor(playerId: number, dieColor: HexColor): boolean {
    if (!this.state) {
      throw new Error("Game not initialized. Call initializeGame() first.");
    }
    const player = this.state.players.find((p) => p.id === playerId);
    if (!player || this.state.phase !== "action") {
      return false;
    }

    // Check if player has the specified die
    if (!player.oracleDice.includes(dieColor)) {
      return false;
    }

    // Consume the oracle die
    const dieIndex = player.oracleDice.indexOf(dieColor);
    if (dieIndex !== -1) {
      player.oracleDice.splice(dieIndex, 1);
    } else {
      // This should not happen since we checked above, but log for debugging
      console.warn(
        `Attempted to consume die ${dieColor} but it was not found in player's oracle dice: [${
          player.oracleDice.join(", ")
        }]`,
      );
      return false;
    }

    // Gain 2 favor
    player.favor += 2;

    return true;
  }

  /**
   * Check if a player can place a statue on the current city
   */
  public canPlaceStatueOnCity(playerId: number): boolean {
    if (!this.state) {
      throw new Error("Game not initialized. Call initializeGame() first.");
    }
    const player = this.state.players.find((p) => p.id === playerId);
    if (!player || this.state.phase !== "action") {
      return false;
    }

    // Check if player is on a city hex
    const currentCell = this.state.map.getCell(
      player.shipPosition.q,
      player.shipPosition.r,
    );
    if (!currentCell || currentCell.terrain !== "city") {
      return false;
    }

    // Check if city already has all 3 statues
    if (currentCell.statues === 3) {
      return false;
    }

    // Check if player has a statue of the city's color
    const requiredColor = currentCell.color;
    return hasStatueOfColor(player, requiredColor);
  }

  private completeQuestType(
    playerId: number,
    questType: "temple_offering" | "monster" | "foundation" | "cloud",
  ): void {
    if (!this.state) {
      throw new Error("Game not initialized. Call initializeGame() first.");
    }
    const player = this.state.players.find((p) => p.id === playerId);
    if (!player) return;

    player.completedQuests++;
    player.completedQuestTypes[questType]++;
  }

  public endTurn(): void {
    if (!this.state) {
      throw new Error("Game not initialized. Call initializeGame() first.");
    }
    // Reset oracle dice
    const currentPlayer = this.state.players[this.state.currentPlayerIndex];
    currentPlayer.oracleDice = [];

    // Move to next player
    this.state.currentPlayerIndex = (this.state.currentPlayerIndex + 1) %
      this.state.players.length;

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
    return this.state.players.findIndex((p) => p.id === playerId);
  }

  /**
   * Initialize Offering cubes on cube hexes
   * Each cube hex gets as many cubes as there are players,
   * but no hex can contain more than one cube of the same color
   */
  private initializeOfferingCubes(map: HexMap, playerCount: number): CubeHex[] {
    const cubeHexes: CubeHex[] = [];

    // Get all cube hexes from the map
    const cubeCells = map.getCellsByTerrain("cubes");

    // We should have exactly 6 cube hexes
    if (cubeCells.length !== 6) {
      console.warn(`Expected 6 cube hexes but found ${cubeCells.length}`);
    }

    // Use a Latin square approach to ensure perfect distribution
    // Each hex gets exactly playerCount cubes, each color appears exactly playerCount times
    // and no color appears twice on the same hex

    // Create a base pattern that ensures each color appears once in each position
    const basePattern: HexColor[][] = [];

    // Create a shuffled copy of colors for the first hex
    const shuffledColors = [...ALL_COLORS];
    this.shuffleArray(shuffledColors);

    // For the first hex, use the shuffled colors
    basePattern.push([...shuffledColors]);

    // For subsequent hexes, rotate the pattern to ensure no duplicates in columns
    for (let i = 1; i < 6; i++) {
      const rotated = [...basePattern[i - 1]];
      // Rotate the array to create a Latin square
      const first = rotated.shift();
      if (first) rotated.push(first);
      basePattern.push(rotated);
    }

    // Now assign cubes to hexes based on playerCount
    // For playerCount = 2, each hex gets the first 2 colors from its pattern
    // For playerCount = 3, each hex gets the first 3 colors, etc.
    for (let i = 0; i < cubeCells.length && i < 6; i++) {
      const cell = cubeCells[i];
      const hexColors = basePattern[i].slice(0, playerCount);

      cubeHexes.push({
        q: cell.q,
        r: cell.r,
        cubeColors: hexColors,
      });
    }

    return cubeHexes;
  }

  /**
   * Initialize monsters on monster hexes with simplified distribution:
   * - All monster hexes are treated equally (no marked/unmarked distinction)
   * - Monsters are distributed as evenly as possible across all 9 hexes
   * - Total monsters per color = number of players
   * - No hex can have more than one monster of the same color
   */
  private initializeMonsters(map: HexMap, playerCount: number): MonsterHex[] {
    const monsterHexes: MonsterHex[] = [];

    // Get all monster hexes from the map
    const monsterCells = map.getCellsByTerrain("monsters");

    // Check if we have exactly 9 monster hexes as expected
    if (monsterCells.length !== 9) {
      console.warn(`Expected 9 monster hexes but found ${monsterCells.length}`);
    }

    // Shuffle the monster hexes for random distribution
    const shuffledMonsterHexes = [...monsterCells];
    this.shuffleArray(shuffledMonsterHexes);

    // Calculate total monsters needed
    const totalMonstersPerColor = playerCount;
    const totalMonsters = totalMonstersPerColor * ALL_COLORS.length;

    // Create a shuffled list of all monster colors to place
    const monsterColors = [...ALL_COLORS];
    this.shuffleArray(monsterColors);

    // We need playerCount copies of each color
    const monsterColorsToPlace: HexColor[] = [];
    for (let i = 0; i < playerCount; i++) {
      monsterColorsToPlace.push(...monsterColors);
    }

    // Initialize empty monster hexes
    for (const cell of shuffledMonsterHexes) {
      monsterHexes.push({
        q: cell.q,
        r: cell.r,
        monsterColors: [],
      });
    }

    // Distribute monsters evenly by stepping through hexes and colors
    // This algorithm ensures we can always place all monsters without getting stuck
    let colorIndex = 0;
    let hexIndex = 0;
    const totalColors = monsterColorsToPlace.length;

    while (colorIndex < totalColors) {
      const currentHex = monsterHexes[hexIndex];
      const currentColor = monsterColorsToPlace[colorIndex];
      currentHex.monsterColors.push(currentColor);
      hexIndex = (hexIndex + 1) % monsterHexes.length;
      colorIndex++;
    }

    return monsterHexes;
  }

  /**
   * Shuffle array using Fisher-Yates algorithm
   */
  private shuffleArray<T>(array: T[]): void {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
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
    return this.state.players.find((p) => p.id === playerId);
  }

  public getAvailableMoves(
    playerId: number,
  ): { q: number; r: number; dieColor: HexColor }[] {
    if (!this.state) {
      throw new Error("Game not initialized. Call initializeGame() first.");
    }
    const player = this.state.players.find((p) => p.id === playerId);
    if (!player || this.state.phase !== "action") {
      return [];
    }

    const currentPos = player.shipPosition;
    const availableMoves: { q: number; r: number; dieColor: HexColor }[] = [];
    const movementRange = 3;

    // Get all reachable sea tiles within range using BFS
    const reachableSeaTiles = this.getReachableSeaTiles(
      currentPos.q,
      currentPos.r,
      movementRange,
    );

    // Filter by player's available dice colors and exclude current position
    for (const seaTile of reachableSeaTiles) {
      if (
        seaTile.color !== "none" &&
        player.oracleDice.includes(seaTile.color) &&
        !(seaTile.q === currentPos.q && seaTile.r === currentPos.r)
      ) {
        availableMoves.push({
          q: seaTile.q,
          r: seaTile.r,
          dieColor: seaTile.color,
        });
      }
    }

    return availableMoves;
  }

  /**
   * Get cube hex information for display
   */
  public getCubeHexes(): CubeHex[] {
    if (!this.state) {
      throw new Error("Game not initialized. Call initializeGame() first.");
    }
    return this.state.cubeHexes;
  }

  /**
   * Get monster hex information for display
   */
  public getMonsterHexes(): MonsterHex[] {
    if (!this.state) {
      throw new Error("Game not initialized. Call initializeGame() first.");
    }
    return this.state.monsterHexes;
  }

  /**
   * Get monsters on a specific hex
   */
  public getMonstersOnHex(q: number, r: number): HexColor[] {
    if (!this.state) {
      throw new Error("Game not initialized. Call initializeGame() first.");
    }
    const monsterHex = this.state.monsterHexes.find((mh) =>
      mh.q === q && mh.r === r
    );
    return monsterHex ? monsterHex.monsterColors : [];
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
    if (!this.state) {
      return [];
    }

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

      const neighbors = this.state.map.getNeighbors(current.q, current.r);

      for (const neighbor of neighbors) {
        if (neighbor.terrain === "sea") {
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
   * Calculate distance between two hex cells using axial coordinates
   */
  private hexDistance(q1: number, r1: number, q2: number, r2: number): number {
    const s1 = -q1 - r1;
    const s2 = -q2 - r2;
    return (Math.abs(q1 - q2) + Math.abs(r1 - r2) + Math.abs(s1 - s2)) / 2;
  }

  public checkWinCondition(): { winner: Player | null; gameOver: boolean } {
    if (!this.state) {
      throw new Error("Game not initialized. Call initializeGame() first.");
    }
    // Game ends when any player completes 3 of each quest type
    const winner = this.state.players.find((p) =>
      p.completedQuestTypes.temple_offering >= 3 &&
      p.completedQuestTypes.monster >= 3 &&
      p.completedQuestTypes.foundation >= 3 &&
      p.completedQuestTypes.cloud >= 3
    );
    return {
      winner: winner || null,
      gameOver: !!winner,
    };
  }
}
