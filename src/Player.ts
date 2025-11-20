import type { HexCoordinates } from './hexmap/HexGrid.ts';
import type {
  CoreColor,
  Item,
  PlayerColorName,
  Quest,
  StorageSlot,
} from './types.ts';

export type PlayerJson = {
  id: number;
  name: string;
  color: PlayerColorName;
  shipPosition: HexCoordinates;
  storage: [StorageSlot, StorageSlot];
  oracleDice: CoreColor[];
  favor: number;
  shield: number;
  oracleCards: CoreColor[];
  usedOracleCardThisTurn: boolean;
  quests: Quest[];
};

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
    this.shipPosition = { q: shipPosition.q, r: shipPosition.r };
    this.storage = [{ type: 'empty' }, { type: 'empty' }];
    this.completedQuestTypes = {
      temple_offering: 0,
      monster: 0,
      statue: 0,
      shrine: 0,
    };
    this.oracleCards = [];
    this.oracleDice = [];
    this.favor = 0;
    this.shield = 0;
    this.usedOracleCardThisTurn = false;
    this.quests = [];
  }

  public static fromJson(json: PlayerJson): Player {
    const player = new Player(
      json.id,
      json.name,
      json.color,
      json.shipPosition,
    );
    player.storage = json.storage;
    player.oracleCards = json.oracleCards;
    player.oracleDice = json.oracleDice;
    player.favor = json.favor;
    player.shield = json.shield;
    player.usedOracleCardThisTurn = json.usedOracleCardThisTurn;
    player.quests = json.quests;
    return player;
  }

  public toJson(): PlayerJson {
    return {
      id: this.id,
      name: this.name,
      color: this.color,
      shipPosition: this.shipPosition,
      storage: this.storage,
      oracleDice: this.oracleDice,
      favor: this.favor,
      shield: this.shield,
      oracleCards: this.oracleCards,
      usedOracleCardThisTurn: this.usedOracleCardThisTurn,
      quests: this.quests,
    };
  }

  public getShipPosition(): HexCoordinates {
    return { q: this.shipPosition.q, r: this.shipPosition.r };
  }

  public setShipPosition(newCoordinates: HexCoordinates): void {
    this.shipPosition.q = newCoordinates.q;
    this.shipPosition.r = newCoordinates.r;
  }

  public getRange(): number {
    return 3;
  }

  public getItemCapacity(): number {
    return 2;
  }

  public getItems(): Item[] {
    return [];
  }

  public getQuests(): Quest[] {
    return this.quests;
  }

  public readonly id: number;
  public readonly name: string;
  public readonly color: PlayerColorName;
  private shipPosition: HexCoordinates;
  public storage: [StorageSlot, StorageSlot]; // 2 storage slots, each can hold 1 cube or 1 statue
  public completedQuestTypes: {
    temple_offering: number;
    monster: number;
    statue: number;
    shrine: number;
  };
  public oracleDice: CoreColor[];
  public favor: number;
  public shield: number;
  public oracleCards: CoreColor[];
  public usedOracleCardThisTurn: boolean;
  private quests: Quest[];
}
