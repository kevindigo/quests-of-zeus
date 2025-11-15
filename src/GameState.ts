import { HexMap, type HexMapJson } from './hexmap/HexMap.ts';
import { Player, type PlayerJson } from './Player.ts';
import type { CityHex, CubeHex, MonsterHex, Phase } from './types.ts';

export type GameStateJson = {
  map: HexMapJson;
  players: PlayerJson[];
  currentPlayerIndex: number;
  round: number;
  phase: Phase;
  cubeHexes: CubeHex[];
  monsterHexes: MonsterHex[];
  cityHexes: CityHex[];
};
export class GameState {
  public constructor(
    map: HexMap,
    players: Player[],
  ) {
    this.map = map;
    this.players = players;
    this.currentPlayerIndex = 0;
    this.round = 1;
    this.phase = 'setup';
    this.cubeHexes = [];
    this.monsterHexes = [];
    this.cityHexes = [];
  }

  public static fromJson(rawJson: unknown): GameState {
    const json = rawJson as GameStateJson;
    const map = HexMap.fromJson(json.map);
    const players = json.players.map((player) => Player.fromJson(player));
    const state = new GameState(map, players);
    state.currentPlayerIndex = json.currentPlayerIndex;
    state.round = json.round;
    state.phase = json.phase;
    state.cubeHexes = json.cubeHexes;
    state.monsterHexes = json.monsterHexes;
    state.cityHexes = json.cityHexes;
    return state;
  }

  public toJson(): GameStateJson {
    return {
      map: this.map.toJson(),
      players: this.players.map((player) => {
        return player.toJson();
      }),
      currentPlayerIndex: this.currentPlayerIndex,
      round: this.round,
      phase: this.phase,
      cubeHexes: this.cubeHexes,
      monsterHexes: this.monsterHexes,
      cityHexes: this.cityHexes,
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

  public map: HexMap;
  public players: Player[];
  private currentPlayerIndex: number;
  private round: number;
  private phase: Phase;
  private cubeHexes: CubeHex[];
  private monsterHexes: MonsterHex[];
  private cityHexes: CityHex[];
}
