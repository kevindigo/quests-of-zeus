import type { HexCoordinates } from './hexmap/HexGrid.ts';
import { Resource } from './Resource.ts';
import {
  Failure,
  type ResultWithMessage,
  Success,
} from './ResultWithMessage.ts';
import {
  COLOR_WHEEL,
  type CoreColor,
  type God,
  type Item,
  type PlayerColorName,
  type Quest,
  type QuestType,
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
  gods: God[];
  wounds: CoreColor[];
  freeloadOpportunities: Set<CoreColor>[];
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
    this.oracleCards = [];
    this.oracleDice = [];
    this.favor = 0;
    this.shield = 0;
    this.usedOracleCardThisTurn = false;
    this.quests = [];
    this.gods = Player.createGods();
    this.wounds = [];
    this.freeloadOpportunities = [];
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
    json.gods.forEach((god) => {
      player.gods.set(god.color, god);
    });
    player.wounds = json.wounds;
    player.freeloadOpportunities = json.freeloadOpportunities;
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
      gods: [...this.gods.values()],
      wounds: [...this.wounds],
      freeloadOpportunities: this.freeloadOpportunities,
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

  public getAvailableResourcesWithRecoloring(): Resource[] {
    const available: Resource[] = [];
    const baseResources = this.getAvailableResourcesWithoutRecoloring();
    for (let favor = 0; favor <= this.favor; ++favor) {
      baseResources.forEach((resource) => {
        const recolored = Resource.createRecoloredVersionOf(resource, favor);
        available.push(recolored);
      });
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
      return item.type === itemToUnload.type &&
        item.color === itemToUnload.color;
    });
    if (at < 0) {
      return new Failure(
        `Impossible: ${JSON.stringify(itemToUnload)} loaded but not in array`,
      );
    }
    this.items.splice(at, 1);

    return new Success('Unloaded');
  }

  public getGod(color: CoreColor): God {
    return this.gods.get(color)!;
  }

  public getGodLevel(color: CoreColor): number {
    return this.getGod(color).level;
  }

  public advanceGod(color: CoreColor): void {
    this.getGod(color).level += 1;
  }

  public resetGod(color: CoreColor): void {
    this.getGod(color).level = 0;
  }

  private static createGods(): Map<CoreColor, God> {
    const map = new Map<CoreColor, God>();
    COLOR_WHEEL.forEach((color) => {
      const god: God = { color, level: 0 };
      map.set(color, god);
    });

    return map;
  }

  public addWound(color: CoreColor): void {
    this.wounds.push(color);
  }

  public getTotalWoundCount(): number {
    return this.wounds.length;
  }

  public getWoundCount(color: CoreColor): number {
    return this.wounds.filter((wound) => {
      return wound === color;
    }).length;
  }

  public getCurrentFreeloadOpportunities(): Set<CoreColor> | null {
    return this.freeloadOpportunities[0] ?? null;
  }

  public addFreeloadOpportunities(dice: CoreColor[]): void {
    this.freeloadOpportunities.push(new Set<CoreColor>(dice));
  }

  public removeCurrentFreeloadOpportunities(): void {
    this.freeloadOpportunities.shift();
  }

  public readonly id: number;
  public readonly name: string;
  public readonly color: PlayerColorName;
  private shipPosition: HexCoordinates;
  public items: Item[];
  public oracleDice: CoreColor[];
  public favor: number;
  public shield: number;
  public oracleCards: CoreColor[];
  public usedOracleCardThisTurn: boolean;
  private quests: Quest[];
  private gods: Map<CoreColor, God>;
  private wounds: CoreColor[];
  private freeloadOpportunities: Set<CoreColor>[];
}
