import type { HexCoordinates } from './hexmap/HexGrid.ts';
import { HexMap, type HexMapSnapshot } from './hexmap/HexMap.ts';
import { createPhase, type Phase, PhaseWelcome } from './phases.ts';
import { Player, type PlayerSnapshot } from './Player.ts';
import type { Resource } from './Resource.ts';
import {
  Failure,
  type ResultWithMessage,
  Success,
} from './ResultWithMessage.ts';
import {
  type CityHex,
  COLOR_WHEEL,
  type CoreColor,
  type CubeHex,
  type MonsterHex,
  type ShrineHex,
  type StatueHex,
} from './types.ts';
import { UtilityService } from './UtilityService.ts';

export type GameStateSnapshot = {
  map: HexMapSnapshot;
  players: PlayerSnapshot[];
  currentPlayerIndex: number;
  round: number;
  phaseName: string;
  cubeHexes: CubeHex[];
  monsterHexes: MonsterHex[];
  cityHexes: CityHex[];
  statueHexes: StatueHex[];
  shrineHexes: ShrineHex[];
  oracleCardDeck: CoreColor[];
};

export class GameState {
  public constructor() {
    this.map = new HexMap();
    this.players = [];
    this.currentPlayerIndex = 0;
    this.round = 1;
    this.phase = createPhase(PhaseWelcome.phaseName);
    this.cubeHexes = [];
    this.monsterHexes = [];
    this.cityHexes = [];
    this.statueHexes = [];
    this.shrineHexes = [];
    this.oracleCardDeck = [];
    this.resetOracleCardDeck();
  }

  public static fromSnapshot(snapshot: unknown): GameState {
    const json = snapshot as GameStateSnapshot;
    const state = new GameState();
    state.map = HexMap.fromSnapshot(json.map);
    state.players = json.players.map((player) => Player.fromSnapshot(player));
    state.currentPlayerIndex = json.currentPlayerIndex;
    state.round = json.round;
    state.phase = createPhase(json.phaseName);
    state.cubeHexes = json.cubeHexes;
    state.monsterHexes = json.monsterHexes;
    state.cityHexes = json.cityHexes;
    state.statueHexes = json.statueHexes;
    state.shrineHexes = json.shrineHexes;
    state.oracleCardDeck = json.oracleCardDeck;
    return state;
  }

  public toSnapshot(): GameStateSnapshot {
    return {
      map: this.map.toSnapshot(),
      players: this.players.map((player) => {
        return player.toSnapshot();
      }),
      currentPlayerIndex: this.currentPlayerIndex,
      round: this.round,
      phaseName: this.phase.getName(),
      cubeHexes: this.cubeHexes,
      monsterHexes: this.monsterHexes,
      cityHexes: this.cityHexes,
      statueHexes: this.statueHexes,
      shrineHexes: this.shrineHexes,
      oracleCardDeck: this.oracleCardDeck,
    };
  }

  public getMap(): HexMap {
    return this.map;
  }

  public getPlayerCount(): number {
    return this.players.length;
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

  public setPlayers(players: Player[]): void {
    this.players = players;
    this.currentPlayerIndex = 0;
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

  public findCubeHexAt(coordinates: HexCoordinates): CubeHex | undefined {
    return this.getCubeHexes().find((hex) => {
      return hex.q === coordinates.q && hex.r === coordinates.r;
    });
  }

  public setCubeHexes(hexes: CubeHex[]): void {
    this.cubeHexes = hexes;
  }

  public getMonsterHexes(): MonsterHex[] {
    return this.monsterHexes;
  }

  public findMonsterHexAt(coordinates: HexCoordinates): MonsterHex | undefined {
    return this.getMonsterHexes().find((hex) => {
      return hex.q === coordinates.q && hex.r === coordinates.r;
    });
  }

  public setMonsterHexes(hexes: MonsterHex[]): void {
    this.monsterHexes = hexes;
  }

  public getCityHexes(): CityHex[] {
    return this.cityHexes;
  }

  public findCityHexAt(coordinates: HexCoordinates): CityHex | undefined {
    return this.getCityHexes().find((hex) => {
      return hex.q === coordinates.q && hex.r === coordinates.r;
    });
  }

  public setCityHexes(hexes: CityHex[]): void {
    this.cityHexes = hexes;
  }

  public getStatueHexes(): StatueHex[] {
    return this.statueHexes;
  }

  public findStatueHexAt(coordinates: HexCoordinates): StatueHex | undefined {
    return this.getStatueHexes().find((hex) => {
      return hex.q === coordinates.q && hex.r === coordinates.r;
    });
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

  public getOracleCardDeck(): CoreColor[] {
    return this.oracleCardDeck;
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
    const originalColor = resource.getBaseColor();
    const index = resourceArray.indexOf(originalColor);
    if (index < 0) {
      return new Failure(
        `Could not remove ${originalColor} from ${resourceArray}`,
      );
    }

    resourceArray.splice(index, 1);
    return new Success('Resource was spent');
  }

  public resetOracleCardDeck(): void {
    this.oracleCardDeck = [];
    const cardColors = [...COLOR_WHEEL];
    for (const color of cardColors) {
      for (let i = 0; i < 5; i++) {
        this.oracleCardDeck.push(color);
      }
    }

    UtilityService.shuffleArray(this.oracleCardDeck);
  }

  private map: HexMap;
  private players: Player[];
  private currentPlayerIndex: number;
  private round: number;
  private phase: Phase;
  private cubeHexes: CubeHex[];
  private monsterHexes: MonsterHex[];
  private cityHexes: CityHex[];
  private statueHexes: StatueHex[];
  private shrineHexes: ShrineHex[];
  private oracleCardDeck: CoreColor[];
}
