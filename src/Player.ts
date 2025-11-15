import type { HexCoordinates } from './hexmap/HexGrid.ts';
import type { CoreColor, PlayerColorName, StorageSlot } from './types.ts';

export type PlayerJson = {
  id: number;
  name: string;
  color: PlayerColorName;
  shipPosition: HexCoordinates;
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
  recolorIntention: number;
  oracleCards: CoreColor[]; // Oracle cards held by player
  usedOracleCardThisTurn: boolean; // Track if player has used an oracle card this turn
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
    this.completedQuests = 0;
    this.completedQuestTypes = {
      temple_offering: 0,
      monster: 0,
      foundation: 0,
      cloud: 0,
    };
    this.oracleCards = [];
    this.oracleDice = [];
    this.recolorIntention = 0;
    this.favor = 0;
    this.shield = 0;
    this.usedOracleCardThisTurn = false;
  }

  public static fromJson(json: PlayerJson): Player {
    const player = new Player(
      json.id,
      json.name,
      json.color,
      json.shipPosition,
    );
    player.storage = json.storage;
    player.completedQuests = json.completedQuests;
    player.completedQuestTypes = json.completedQuestTypes;
    player.oracleCards = json.oracleCards;
    player.oracleDice = json.oracleDice;
    player.recolorIntention = json.recolorIntention;
    player.favor = json.favor;
    player.shield = json.shield;
    player.usedOracleCardThisTurn = json.usedOracleCardThisTurn;
    return player;
  }

  public toJson(): PlayerJson {
    return {
      id: this.id,
      name: this.name,
      color: this.color,
      shipPosition: this.shipPosition,
      storage: this.storage,
      completedQuests: this.completedQuests,
      completedQuestTypes: this.completedQuestTypes,
      oracleDice: this.oracleDice,
      favor: this.favor,
      shield: this.shield,
      recolorIntention: this.recolorIntention,
      oracleCards: this.oracleCards,
      usedOracleCardThisTurn: this.usedOracleCardThisTurn,
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

  public getRecolorIntention(): number {
    return this.recolorIntention;
  }

  public setRecolorIntention(newIntention: number): void {
    this.recolorIntention = newIntention;
  }

  public readonly id: number;
  public readonly name: string;
  public readonly color: PlayerColorName;
  private shipPosition: HexCoordinates;
  public storage: [StorageSlot, StorageSlot]; // 2 storage slots, each can hold 1 cube or 1 statue
  public completedQuests: number;
  public completedQuestTypes: {
    temple_offering: number;
    monster: number;
    foundation: number;
    cloud: number;
  };
  public oracleDice: CoreColor[]; // Current oracle dice values
  public favor: number; // Player's favor resource
  public shield: number; // Player's shield resource
  private recolorIntention: number;
  public oracleCards: CoreColor[]; // Oracle cards held by player
  public usedOracleCardThisTurn: boolean; // Track if player has used an oracle card this turn
}
