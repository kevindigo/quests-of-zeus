import type { StorageSlot } from "./game-engine.ts";
import type { CoreColor, PlayerColorName } from "./types.ts";

export interface Player {
  id: number;
  name: string;
  color: PlayerColorName;
  shipPosition: { q: number; r: number };
  storage: [StorageSlot, StorageSlot]; // 2 storage slots, each can hold 1 cube or 1 statue
  completedQuests: number;
  completedQuestTypes: {
    temple_offering: number;
    monster: number;
    foundation: number;
    cloud: number;
  };
  oracleDice: CoreColor[]; // Current oracle dice values
  favor: number; // Player's favor resource
  shield: number; // Player's shield resource
  recoloredDice: {
    [dieColor: string]: { newColor: CoreColor; favorCost: number };
  }; // Track recoloring intentions for dice
  recoloredCards?: {
    [cardColor: string]: { newColor: CoreColor; favorCost: number };
  }; // Track recoloring intentions for oracle cards
  oracleCards: CoreColor[]; // Oracle cards held by player
  usedOracleCardThisTurn: boolean; // Track if player has used an oracle card this turn
}
