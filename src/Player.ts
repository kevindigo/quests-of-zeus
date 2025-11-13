import type { HexCoordinates } from './hexmap/HexGrid.ts';
import type { CoreColor, PlayerColorName, StorageSlot } from './types.ts';

export class Player {
  public constructor(
    id: number,
    name: string,
    color: PlayerColorName,
    shipPosition: { q: number; r: number },
  ) {
    this.id = id;
    this.name = name;
    this.color = color;
    this.shipPosition = shipPosition;
    this.storage = [{ type: 'empty' }, { type: 'empty' }];
    this.completedQuests = 0;
    this.completedQuestTypes = {
      temple_offering: 0,
      monster: 0,
      foundation: 0,
      cloud: 0,
    };
    this.oracleCards = [];
    this.oracleDice = [];
    this.recoloredCards = {};
    this.recoloredDice = {};
    this.favor = 0;
    this.shield = 0;
    this.usedOracleCardThisTurn = false;
  }

  public getShipPosition(): HexCoordinates {
    return { q: this.shipPosition.q, r: this.shipPosition.r };
  }

  public readonly id: number;
  public readonly name: string;
  public readonly color: PlayerColorName;
  public shipPosition: { q: number; r: number };
  public readonly storage: [StorageSlot, StorageSlot]; // 2 storage slots, each can hold 1 cube or 1 statue
  public completedQuests: number;
  public readonly completedQuestTypes: {
    temple_offering: number;
    monster: number;
    foundation: number;
    cloud: number;
  };
  public oracleDice: CoreColor[]; // Current oracle dice values
  public favor: number; // Player's favor resource
  public shield: number; // Player's shield resource
  public recoloredDice: {
    [dieColor: string]: { newColor: CoreColor; favorCost: number };
  }; // Track recoloring intentions for dice
  public recoloredCards?: {
    [cardColor: string]: { newColor: CoreColor; favorCost: number };
  }; // Track recoloring intentions for oracle cards
  public oracleCards: CoreColor[]; // Oracle cards held by player
  public usedOracleCardThisTurn: boolean; // Track if player has used an oracle card this turn
}
