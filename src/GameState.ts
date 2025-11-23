import type { HexCoordinates } from './hexmap/HexGrid.ts';
import { HexMap, type HexMapJson } from './hexmap/HexMap.ts';
import { OracleSystem } from './OracleSystem.ts';
import { Player, type PlayerJson } from './Player.ts';
import {
  Failure,
  type ResultWithMessage,
  Success,
} from './ResultWithMessage.ts';
import {
  type CityHex,
  type CoreColor,
  type CubeHex,
  type MonsterHex,
  type Phase,
  Resource,
  type ShrineHex,
  type StatueHex,
} from './types.ts';
import type { UiState } from './UiState.ts';

export type GameStateJson = {
  map: HexMapJson;
  players: PlayerJson[];
  currentPlayerIndex: number;
  round: number;
  phase: Phase;
  cubeHexes: CubeHex[];
  monsterHexes: MonsterHex[];
  cityHexes: CityHex[];
  statueHexes: StatueHex[];
  shrineHexes: ShrineHex[];
  selectedResource: Resource;
  selectedRecoloring: number;
};

export class GameState implements UiState {
  public constructor(
    map: HexMap,
    players: Player[],
  ) {
    this.map = map;
    this.players = players;
    this.currentPlayerIndex = 0;
    this.selectedRecoloring = 0;
    this.round = 1;
    this.phase = 'setup';
    this.cubeHexes = [];
    this.monsterHexes = [];
    this.cityHexes = [];
    this.statueHexes = [];
    this.shrineHexes = [];
    this.selectedResource = Resource.none;
  }

  public static fromJson(rawJson: unknown): GameState {
    const json = rawJson as GameStateJson;
    const map = HexMap.fromJson(json.map);
    const players = json.players.map((player) => Player.fromJson(player));
    const state = new GameState(map, players);
    state.currentPlayerIndex = json.currentPlayerIndex;
    state.selectedRecoloring = json.selectedRecoloring;
    state.round = json.round;
    state.phase = json.phase;
    state.cubeHexes = json.cubeHexes;
    state.monsterHexes = json.monsterHexes;
    state.cityHexes = json.cityHexes;
    state.statueHexes = json.statueHexes;
    state.shrineHexes = json.shrineHexes;
    state.selectedResource = Resource.fromJson(json.selectedResource);
    return state;
  }

  public toJson(): GameStateJson {
    return {
      map: this.map.toJson(),
      players: this.players.map((player) => {
        return player.toJson();
      }),
      currentPlayerIndex: this.currentPlayerIndex,
      selectedRecoloring: this.selectedRecoloring,
      round: this.round,
      phase: this.phase,
      cubeHexes: this.cubeHexes,
      monsterHexes: this.monsterHexes,
      cityHexes: this.cityHexes,
      statueHexes: this.statueHexes,
      shrineHexes: this.shrineHexes,
      selectedResource: this.selectedResource,
    };
  }

  public getPlayer(index: number): Player {
    const player = this.players[index];
    if (!player) {
      throw new Error(`GameState: Unable to get player ${index}`);
    }
    return player;
  }

  public getCurrentPlayer(): Player {
    return this.getPlayer(this.getCurrentPlayerIndex());
  }

  public getCurrentPlayerIndex(): number {
    return this.currentPlayerIndex;
  }

  public setCurrentPlayerIndex(newIndex: number): void {
    this.currentPlayerIndex = newIndex;
  }

  public getRound(): number {
    return this.round;
  }

  public setRound(newRound: number): void {
    this.round = newRound;
  }

  public advanceRound(): void {
    ++this.round;
  }

  public getPhase(): Phase {
    return this.phase;
  }

  public setPhase(newPhase: Phase): void {
    this.phase = newPhase;
  }

  public getCubeHexes(): CubeHex[] {
    return this.cubeHexes;
  }

  public setCubeHexes(hexes: CubeHex[]): void {
    this.cubeHexes = hexes;
  }

  public getMonsterHexes(): MonsterHex[] {
    return this.monsterHexes;
  }

  public setMonsterHexes(hexes: MonsterHex[]): void {
    this.monsterHexes = hexes;
  }

  public getCityHexes(): CityHex[] {
    return this.cityHexes;
  }

  public setCityHexes(hexes: CityHex[]): void {
    this.cityHexes = hexes;
  }

  public getStatueHexes(): StatueHex[] {
    return this.statueHexes;
  }

  public setStatueHexes(hexes: StatueHex[]): void {
    this.statueHexes = hexes;
  }

  public getShrineHexes(): ShrineHex[] {
    return this.shrineHexes;
  }

  public setShrineHexes(hexes: ShrineHex[]): void {
    this.shrineHexes = hexes;
  }

  public findShrineHexAt(coordinates: HexCoordinates): ShrineHex | undefined {
    return this.getShrineHexes().find((sh) => {
      return sh.q === coordinates.q && sh.r === coordinates.r;
    });
  }

  public getSelectedRecoloring(): number {
    return this.selectedRecoloring || 0;
  }

  public setSelectedRecoloring(
    favorSpent: number,
  ): boolean {
    const player = this.getCurrentPlayer();
    if (player.favor < favorSpent) {
      return false;
    }

    this.selectedRecoloring = favorSpent;
    return true;
  }

  public clearSelectedRecoloring(): void {
    this.selectedRecoloring = 0;
  }

  public getSelectedResource(): Resource {
    return this.selectedResource;
  }

  public setSelectedDieColor(color: CoreColor | null): void {
    this.selectedResource = color ? Resource.createDie(color) : Resource.none;
  }

  public setSelectedOracleCardColor(color: CoreColor | null): void {
    this.selectedResource = color ? Resource.createCard(color) : Resource.none;
  }

  public getEffectiveSelectedColor(): CoreColor | null {
    if (!this.selectedResource.hasColor()) {
      return null;
    }
    const selectedColor = this.selectedResource.getColor();

    const favorForRecoloring = this.getSelectedRecoloring();
    const effectiveColor = OracleSystem.applyRecolor(
      selectedColor,
      favorForRecoloring,
    );
    return effectiveColor;
  }

  public clearResourceSelection(): void {
    this.selectedResource = Resource.none;
  }

  public removeSpentResourceFromPlayer(
    player: Player,
    resource: Resource,
  ): ResultWithMessage {
    if (!resource.hasColor()) {
      return new Failure('Impossible: no resource was selected');
    }
    const resourceArray = resource.isDie()
      ? player.oracleDice
      : player.oracleCards;
    const originalColor = resource.getColor();
    const index = resourceArray.indexOf(originalColor);
    if (index < 0) {
      return new Failure(
        `Could not remove ${originalColor} from ${resourceArray}`,
      );
    }

    resourceArray.splice(index, 1);
    return new Success('Resource was spent');
  }

  public map: HexMap;
  public players: Player[];
  private currentPlayerIndex: number;
  private round: number;
  private phase: Phase;
  private cubeHexes: CubeHex[];
  private monsterHexes: MonsterHex[];
  private cityHexes: CityHex[];
  private statueHexes: StatueHex[];
  private shrineHexes: ShrineHex[];
  private selectedResource: Resource;
  private selectedRecoloring: number;
}
