import type { HexCoordinates } from './hexmap/HexGrid.ts';
import { Resource } from './Resource.ts';
import {
  Failure,
  type ResultWithMessage,
  Success,
} from './ResultWithMessage.ts';
import type {
  CoreColor,
  Item,
  PlayerColorName,
  Quest,
  QuestType,
} from './types.ts';

export type PlayerSnapshot = {
  id: number;
  name: string;
  color: PlayerColorName;
  shipPosition: HexCoordinates;
  items: Item[];
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
    this.items = [];
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

  public static fromSnapshot(json: PlayerSnapshot): Player {
    const player = new Player(
      json.id,
      json.name,
      json.color,
      json.shipPosition,
    );
    player.items = json.items;
    player.oracleCards = json.oracleCards;
    player.oracleDice = json.oracleDice;
    player.favor = json.favor;
    player.shield = json.shield;
    player.usedOracleCardThisTurn = json.usedOracleCardThisTurn;
    player.quests = json.quests;
    return player;
  }

  public toSnapshot(): PlayerSnapshot {
    return {
      id: this.id,
      name: this.name,
      color: this.color,
      shipPosition: this.shipPosition,
      items: this.items,
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

  public getAvailableResourcesWithoutRecoloring(): Resource[] {
    const available = this.getResourcesForDice();
    if (!this.usedOracleCardThisTurn) {
      available.push(...this.getResourcesForCards());
    }
    return available;
  }

  public getResourcesForDice(): Resource[] {
    return Array.from(
      new Map(this.oracleDice.map((color) => {
        return [color, Resource.createDie(color)];
      })).values(),
    );
  }

  public getResourcesForCards(): Resource[] {
    return Array.from(
      new Map(this.oracleCards.map((color) => {
        return [color, Resource.createCard(color)];
      })).values(),
    );
  }

  public getQuests(): Quest[] {
    return this.quests;
  }

  public getQuestsOfType(type: QuestType): Quest[] {
    return this.getQuests().filter((quest) => {
      return quest.type === type;
    });
  }

  public getItemCapacity(): number {
    return 2;
  }

  public getItemCount(): number {
    return this.items.length;
  }

  public validateItemIsLoadable(item: Item): ResultWithMessage {
    if (this.getItemCount() >= this.getItemCapacity()) {
      return new Failure(`Storage is already full`);
    }
    if (this.isItemLoaded(item)) {
      return new Failure(`Item already loaded: ${JSON.stringify(item)}`);
    }

    return new Success(`OK to load ${JSON.stringify(item)}`);
  }

  public loadItem(item: Item): ResultWithMessage {
    const validation = this.validateItemIsLoadable(item);
    if (!validation.success) {
      return validation;
    }
    this.items.push(item);
    return new Success(`Player loaded item ${JSON.stringify(item)}`);
  }

  public isItemLoaded(item: Item): boolean {
    const found = this.items.find((loadedItem) => {
      return loadedItem.type == item.type && loadedItem.color === item.color;
    });
    return found ? true : false;
  }

  public getLoadedItems(): Item[] {
    return [...this.items];
  }

  public unloadItem(itemToUnload: Item): ResultWithMessage {
    if (!this.isItemLoaded(itemToUnload)) {
      return new Failure(
        `Item ${JSON.stringify(itemToUnload)} not found in cargo`,
      );
    }

    const at = this.items.findIndex((item) => {
      return item.type === 'cube' && item.color === itemToUnload.color;
    });
    if (at < 0) {
      return new Failure(
        `Impossible: ${JSON.stringify(itemToUnload)} loaded but not in array`,
      );
    }
    this.items.splice(at, 1);

    return new Success('Unloaded');
  }

  public readonly id: number;
  public readonly name: string;
  public readonly color: PlayerColorName;
  private shipPosition: HexCoordinates;
  public items: Item[];
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
