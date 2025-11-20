// Game type definitions for Quests of Zeus
import type { HexCoordinates } from './hexmap/HexGrid.ts';

// Terrain types for the hexagonal map
export type TerrainType =
  | 'zeus' // Zeus locations
  | 'sea' // Sea tiles
  | 'shallow' // Shallow water
  | 'monsters' // Monster locations
  | 'offerings' // Offerings (cubes) locations
  | 'temple' // Temple locations
  | 'shrine' // Shrine locations
  | 'city' // City locations
  | 'statue'; // Statue base locations

// Color types for hex cells
export type CoreColor =
  | 'black'
  | 'pink'
  | 'blue'
  | 'yellow'
  | 'green'
  | 'red';

// Color constants for the 6 fundamental colors
// These colors are used to power actions in the game
export const CORE_COLORS = {
  BLACK: 'black' as CoreColor,
  PINK: 'pink' as CoreColor,
  BLUE: 'blue' as CoreColor,
  YELLOW: 'yellow' as CoreColor,
  GREEN: 'green' as CoreColor,
  RED: 'red' as CoreColor,
} as const;

export const COLOR_WHEEL: CoreColor[] = [
  CORE_COLORS.BLUE,
  CORE_COLORS.YELLOW,
  CORE_COLORS.GREEN,
  CORE_COLORS.RED,
  CORE_COLORS.BLACK,
  CORE_COLORS.PINK,
];

// Color types for hex cells
export type HexColor =
  | 'none'
  | CoreColor;

export type PlayerColorName =
  | 'blue'
  | 'yellow'
  | 'green'
  | 'red';

export const PLAYER_COLOR_NAMES = {
  BLACK: 'black' as PlayerColorName,
  PINK: 'pink' as PlayerColorName,
  BLUE: 'blue' as PlayerColorName,
  YELLOW: 'yellow' as PlayerColorName,
  GREEN: 'green' as PlayerColorName,
  RED: 'red' as PlayerColorName,
} as const;

export const PLAYER_COLORS = [
  PLAYER_COLOR_NAMES.GREEN,
  PLAYER_COLOR_NAMES.BLUE,
  PLAYER_COLOR_NAMES.YELLOW,
  PLAYER_COLOR_NAMES.RED,
];

export interface StorageSlot {
  type: 'cube' | 'statue' | 'empty';
  color?: HexColor;
}

export class CubeHex {
  public constructor(coordinates: HexCoordinates) {
    this.q = coordinates.q;
    this.r = coordinates.r;
    this.cubeColors = [];
  }

  q: number;
  r: number;
  cubeColors: CoreColor[]; // Array of colors that have cubes on this hex (no duplicates)
}

export class MonsterHex {
  public constructor(coordinates: HexCoordinates) {
    this.q = coordinates.q;
    this.r = coordinates.r;
    this.monsterColors = [];
  }
  q: number;
  r: number;
  monsterColors: CoreColor[];
}

export class CityHex {
  public constructor(coordinates: HexCoordinates) {
    this.q = coordinates.q;
    this.r = coordinates.r;
    this.statues = 3;
  }

  q: number;
  r: number;
  statues: number;
}

export class StatueHex {
  public constructor(coordinates: HexCoordinates) {
    this.q = coordinates.q;
    this.r = coordinates.r;
    this.statueBaseColors = [];
  }

  q: number;
  r: number;
  statueBaseColors: CoreColor[];
}

export type ShrineStatus = 'hidden' | 'visible' | 'filled';
export type ShrineReward = 'favor' | 'card' | 'god' | 'shield';
export const SHRINE_REWARDS: ShrineReward[] = [
  'favor',
  'card',
  'god',
  'shield',
];

export class ShrineHex {
  public constructor(
    coordinates: HexCoordinates,
    owner: PlayerColorName,
    reward: ShrineReward,
  ) {
    this.q = coordinates.q;
    this.r = coordinates.r;
    this.status = 'hidden';
    this.owner = owner;
    this.reward = reward;
  }
  q: number;
  r: number;
  status: ShrineStatus;
  owner: PlayerColorName;
  reward: ShrineReward;
}

export type QuestType = 'temple' | 'statue' | 'monster' | 'shrine';

export class Quest {
  public constructor(playerId: number, type: QuestType, color: HexColor) {
    this.playerId = playerId;
    this.type = type;
    this.color = color;
    this.isCompleted = false;
  }
  playerId: number;
  type: QuestType;
  color: HexColor;
  isCompleted: boolean;
}

export type PossibleShipMove = {
  q: number;
  r: number;
  favorCost: number;
};

export type ControllerActionResult = {
  success: boolean;
  message: string;
};

export interface MoveShipResult {
  success: boolean;
  error?: {
    type:
      | 'invalid_player'
      | 'wrong_phase'
      | 'invalid_target'
      | 'not_sea'
      | 'no_die_or_card'
      | 'both_die_and_card'
      | 'die_not_available'
      | 'card_not_available'
      | 'wrong_color'
      | 'not_reachable'
      | 'not_enough_favor'
      | 'recoloring_failed'
      | 'second_card'
      | 'unknown';
    message: string;
    details?: {
      playerId?: number;
      targetQ?: number;
      targetR?: number;
      dieColor?: HexColor;
      favorSpent?: number;
      availableFavor?: number;
      availableDice?: HexColor[];
      targetTerrain?: string;
      targetColor?: HexColor;
      requiredColor?: HexColor;
      movementRange?: number;
      recoloringCost?: number;
      phase?: string;
      originalDieColor?: HexColor;
      currentQ?: number;
      currentR?: number;
    };
  };
}

export type ResultWithMessage = {
  success: boolean;
  message: string;
};

export type Phase = 'setup' | 'action' | 'end';
