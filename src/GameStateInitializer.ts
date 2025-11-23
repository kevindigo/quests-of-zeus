// Game initialization and setup for Quests of Zeus
import type { GameState } from './GameState.ts';
import type { HexCell } from './hexmap/HexCell.ts';
import type { HexCoordinates } from './hexmap/HexGrid.ts';
import type { HexMap } from './hexmap/HexMap.ts';
import { Player } from './Player.ts';
import {
  CityHex,
  COLOR_WHEEL,
  type CoreColor,
  CubeHex,
  type HexColor,
  MonsterHex,
  PLAYER_COLORS,
  type PlayerColorName,
  type Quest,
  SHRINE_REWARDS,
  ShrineHex,
  StatueHex,
} from './types.ts';
import { UtilityService } from './UtilityService.ts';

export function findZeus(map: HexMap): HexCell {
  const zeusCell = map.getCellsByTerrain('zeus')[0];
  if (zeusCell) {
    return zeusCell;
  }

  throw new Error('Zeus not found in map!');
}

export class GameStateInitializer {
  public initializeGameState(state: GameState): void {
    const map = state.map;
    map.reset();
    const zeusCell = findZeus(map);
    const players = this.initializePlayers(zeusCell.getCoordinates());
    state.setPlayers([...players]);

    const cubeHexes = this.initializeOfferingCubes(map, players.length);
    state.setCubeHexes(cubeHexes);
    const monsterHexes = this.initializeMonsters(map, players.length);
    state.setMonsterHexes(monsterHexes);
    const cityHexes = this.initializeCities(map);
    state.setCityHexes(cityHexes);
    const statueHexes = this.initializeStatues(map);
    state.setStatueHexes(statueHexes);
    const shrineHexes = this.initializeShrines(map);
    state.setShrineHexes(shrineHexes);

    state.resetOracleCardDeck();

    state.setPhase('action');
  }

  /**
   * Initialize players with starting positions and resources
   */
  private initializePlayers(startPosition: HexCoordinates): Player[] {
    const players: Player[] = [];

    const templeAndMonsterColors: HexColor[] = [
      'black',
      'blue',
      'pink',
      'yellow',
    ];
    UtilityService.shuffleArray(templeAndMonsterColors);
    const templeColors = templeAndMonsterColors.splice(0, 2);
    templeColors.push('none');
    const monsterColors = templeAndMonsterColors.splice(0, 2);
    monsterColors.push('none');

    for (let i = 0; i < 2; i++) { // Start with 2 players for now
      const player = new Player(
        i,
        `Player ${i + 1}`,
        PLAYER_COLORS[i]!,
        startPosition,
      );
      player.favor = 3 + player.id;
      this.createQuests(player, templeColors, monsterColors);
      this.rollInitialDice(player);
      players.push(player);
    }
    return players;
  }

  private createQuests(
    player: Player,
    templeColors: HexColor[],
    monsterColors: HexColor[],
  ): void {
    for (let i = 0; i < 3; ++i) {
      const shrineQuest: Quest = {
        playerId: player.id,
        type: 'shrine',
        color: 'none',
        isCompleted: false,
      };
      player.getQuests().push(shrineQuest);

      const statueQuest: Quest = {
        playerId: player.id,
        type: 'statue',
        color: 'none',
        isCompleted: false,
      };
      player.getQuests().push(statueQuest);

      const templeQuest: Quest = {
        playerId: player.id,
        type: 'temple',
        color: templeColors[i]!,
        isCompleted: false,
      };
      player.getQuests().push(templeQuest);

      const monsterQuest: Quest = {
        playerId: player.id,
        type: 'monster',
        color: monsterColors[i]!,
        isCompleted: false,
      };
      player.getQuests().push(monsterQuest);
    }
  }

  private rollInitialDice(player: Player): void {
    // Roll initial oracle dice for all players during setup
    const initialDice: CoreColor[] = [];
    for (let j = 0; j < 3; j++) {
      const randomColor =
        COLOR_WHEEL[Math.floor(Math.random() * COLOR_WHEEL.length)];
      if (randomColor) {
        initialDice.push(randomColor);
      }
    }

    player.oracleDice = initialDice;
  }

  /**
   * Initialize Offering cubes on cube hexes
   * Each cube hex gets as many cubes as there are players,
   * but no hex can contain more than one cube of the same color
   */
  private initializeOfferingCubes(map: HexMap, playerCount: number): CubeHex[] {
    const cubeHexes: CubeHex[] = [];

    // Get all cube hexes from the map
    const cubeCells = map.getCellsByTerrain('offerings');

    // We should have exactly 6 cube hexes
    if (cubeCells.length !== 6) {
      console.warn(`Expected 6 cube hexes but found ${cubeCells.length}`);
    }

    // Use a Latin square approach to ensure perfect distribution
    // Each hex gets exactly playerCount cubes, each color appears exactly playerCount times
    // and no color appears twice on the same hex

    // Create a base pattern that ensures each color appears once in each position
    const basePattern: CoreColor[][] = [];

    // Create a shuffled copy of colors for the first hex
    const shuffledColors = [...COLOR_WHEEL];
    UtilityService.shuffleArray(shuffledColors);

    // For the first hex, use the shuffled colors
    basePattern.push([...shuffledColors]);

    // For subsequent hexes, rotate the pattern to ensure no duplicates in columns
    for (let i = 1; i < 6; i++) {
      const previousPattern = basePattern[i - 1] || [];
      const rotated = [...previousPattern];
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
      if (!cell) {
        throw new Error('Missing some cube cells?');
      }
      const thisPattern = basePattern[i] || [];
      const hexColors = thisPattern.slice(0, playerCount);

      const cubeHex = new CubeHex(cell.getCoordinates());
      cubeHex.cubeColors = hexColors;
      cubeHexes.push(cubeHex);
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
    const monsterCells = map.getCellsByTerrain('monsters');

    // Check if we have exactly 9 monster hexes as expected
    if (monsterCells.length !== 9) {
      console.warn(`Expected 9 monster cells but found ${monsterCells.length}`);
    }
    if (monsterCells.length !== 9) {
      throw new Error(
        `monsterCells expected 9 but have ${monsterCells.length}`,
      );
    }

    // Shuffle the monster cells for random distribution
    const shuffledMonsterCells = [...monsterCells];
    if (monsterCells.length !== 9) {
      throw new Error(
        `monsterCells expected 9 but have ${monsterCells.length}`,
      );
    }
    UtilityService.shuffleArray(shuffledMonsterCells);
    if (shuffledMonsterCells.length !== 9) {
      throw new Error(
        `shuffledMonsterCells expected 9 but have ${shuffledMonsterCells.length}`,
      );
    }

    // Create a shuffled list of all monster colors to place
    const monsterColors = [...COLOR_WHEEL];
    UtilityService.shuffleArray(monsterColors);

    // We need playerCount copies of each color
    const monsterColorsToPlace: CoreColor[] = [];
    for (let i = 0; i < playerCount; i++) {
      monsterColorsToPlace.push(...monsterColors);
    }

    // Initialize empty monster hexes
    for (const cell of shuffledMonsterCells) {
      monsterHexes.push(new MonsterHex(cell.getCoordinates()));
    }
    if (monsterHexes.length !== 9) {
      throw new Error(
        `monsterHexes expected 9 but have ${monsterHexes.length}`,
      );
    }

    // Distribute monsters evenly by stepping through hexes and colors
    // This algorithm ensures we can always place all monsters without getting stuck
    let colorIndex = 0;
    let hexIndex = 0;
    const totalColors = monsterColorsToPlace.length;

    while (colorIndex < totalColors) {
      if (monsterHexes.length !== 9) {
        throw new Error(
          `Expected 9 hexes but have ${monsterHexes.length} (colorIndex is ${colorIndex})`,
        );
      }
      const currentHex = monsterHexes[hexIndex];
      if (!currentHex) {
        throw new Error(
          `Missing monster hex (${hexIndex} of ${monsterHexes.length})?`,
        );
      }
      const currentColor = monsterColorsToPlace[colorIndex];
      if (currentColor) {
        currentHex.monsterColors.push(currentColor);
      }
      hexIndex = (hexIndex + 1) % monsterHexes.length;
      colorIndex++;
    }

    return monsterHexes;
  }

  private initializeCities(map: HexMap): CityHex[] {
    const cityCells = map.getCellsByTerrain('city');

    if (cityCells.length !== 6) {
      console.warn(`Expected 6 city hexes but found ${cityCells.length}`);
    }

    const cityHexes = cityCells.map((cityCell) => {
      return new CityHex(cityCell.getCoordinates());
    });

    return cityHexes;
  }

  private initializeStatues(map: HexMap): StatueHex[] {
    const statueCells = map.getCellsByTerrain('statue');

    if (statueCells.length !== 6) {
      console.warn(`Expected 6 statue hexes but found ${statueCells.length}`);
    }

    const threeOfEach: CoreColor[] = [];
    const shuffledColors = [...COLOR_WHEEL];
    UtilityService.shuffleArray(shuffledColors);
    for (let i = 0; i < 3; ++i) {
      const rotateBy = Math.floor(Math.random() * 3);
      UtilityService.rotateArray(shuffledColors, rotateBy);
      threeOfEach.push(...shuffledColors);
    }

    const statueHexes = statueCells.map((statueCell) => {
      const hex = new StatueHex(statueCell.getCoordinates());
      for (let i = 0; i < 3; ++i) {
        const thisStatueColor = threeOfEach.shift();
        if (!thisStatueColor) {
          throw new Error(`Ran out of statue colors to place!`);
        }
        hex.statueBaseColors.push(thisStatueColor);
      }
      return hex;
    });

    return statueHexes;
  }

  private initializeShrines(map: HexMap): ShrineHex[] {
    const shrineCells = map.getCellsByTerrain('shrine');
    if (shrineCells.length !== 12) {
      console.warn(`Expected 12 shrine hexes but found ${shrineCells.length}`);
    }
    UtilityService.shuffleArray(shrineCells);

    const rewards = [...SHRINE_REWARDS];
    UtilityService.shuffleArray(rewards);

    const playerColors: PlayerColorName[] = [...PLAYER_COLORS];
    UtilityService.shuffleArray(playerColors);

    const shrineHexes: ShrineHex[] = [];
    playerColors.forEach((color, playerIndex) => {
      for (let rewardIndex = 0; rewardIndex < 3; ++rewardIndex) {
        const thisCell = shrineCells[shrineHexes.length];
        if (!thisCell) {
          throw new Error(`Missing shrineCells[${shrineHexes.length}]`);
        }
        const nthTilePlaced = playerIndex * 3 + rewardIndex;
        const reward = rewards[nthTilePlaced % rewards.length]!;
        const hex = new ShrineHex(thisCell.getCoordinates(), color, reward);
        shrineHexes.push(hex);
      }
    });

    return shrineHexes;
  }
}
