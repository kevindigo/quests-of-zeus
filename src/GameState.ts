import { HexMap, type HexMapJson } from './hexmap/HexMap.ts';
import { OracleSystem } from './oracle-system.ts';
import { Player, type PlayerJson } from './Player.ts';
import type {
  CityHex,
  CoreColor,
  CubeHex,
  MonsterHex,
  Phase,
  ShrineHex,
  StatueHex,
} from './types.ts';

export type GameStateJson = {
  map: HexMapJson;
  players: PlayerJson[];
  currentPlayerIndex: number;
  favorToRecolor: number;
  round: number;
  phase: Phase;
  cubeHexes: CubeHex[];
  monsterHexes: MonsterHex[];
  cityHexes: CityHex[];
  statueHexes: StatueHex[];
  shrineHexes: ShrineHex[];
  selectedDieColor: CoreColor | null;
  selectedOracleCardColor: CoreColor | null;
};

export class GameState {
  public constructor(
    map: HexMap,
    players: Player[],
  ) {
    this.map = map;
    this.players = players;
    this.currentPlayerIndex = 0;
    this.favorToRecolor = 0;
    this.round = 1;
    this.phase = 'setup';
    this.cubeHexes = [];
    this.monsterHexes = [];
    this.cityHexes = [];
    this.statueHexes = [];
    this.shrineHexes = [];
    this.selectedDieColor = null;
    this.selectedOracleCardColor = null;
  }

  public static fromJson(rawJson: unknown): GameState {
    const json = rawJson as GameStateJson;
    const map = HexMap.fromJson(json.map);
    const players = json.players.map((player) => Player.fromJson(player));
    const state = new GameState(map, players);
    state.currentPlayerIndex = json.currentPlayerIndex;
    state.favorToRecolor = json.favorToRecolor;
    state.round = json.round;
    state.phase = json.phase;
    state.cubeHexes = json.cubeHexes;
    state.monsterHexes = json.monsterHexes;
    state.cityHexes = json.cityHexes;
    state.statueHexes = json.statueHexes;
    state.shrineHexes = json.shrineHexes;
    state.selectedDieColor = json.selectedDieColor;
    state.selectedOracleCardColor = json.selectedOracleCardColor;
    return state;
  }

  public toJson(): GameStateJson {
    return {
      map: this.map.toJson(),
      players: this.players.map((player) => {
        return player.toJson();
      }),
      currentPlayerIndex: this.currentPlayerIndex,
      favorToRecolor: this.favorToRecolor,
      round: this.round,
      phase: this.phase,
      cubeHexes: this.cubeHexes,
      monsterHexes: this.monsterHexes,
      cityHexes: this.cityHexes,
      statueHexes: this.statueHexes,
      shrineHexes: this.shrineHexes,
      selectedDieColor: this.selectedDieColor,
      selectedOracleCardColor: this.selectedOracleCardColor,
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

  public getRecolorIntention(): number {
    return this.favorToRecolor || 0;
  }

  public setRecolorIntention(
    playerId: number,
    favorSpent: number,
  ): boolean {
    const player = this.getPlayer(playerId);
    if (player.favor < favorSpent) {
      return false;
    }

    this.favorToRecolor = favorSpent;
    return true;
  }

  public clearRecolorIntention(): void {
    this.favorToRecolor = 0;
  }

  public getSelectedDieColor(): CoreColor | null {
    return this.selectedDieColor;
  }

  public setSelectedDieColor(color: CoreColor | null): void {
    this.selectedDieColor = color;
  }

  public getSelectedOracleCardColor(): CoreColor | null {
    return this.selectedOracleCardColor;
  }

  public setSelectedOracleCardColor(color: CoreColor | null): void {
    this.selectedOracleCardColor = color;
  }

  public getEffectiveSelectedColor(): CoreColor | null {
    const selectedColor = this.getSelectedDieColor() ||
      this.getSelectedOracleCardColor();
    if (!selectedColor) {
      return null;
    }
    const favorForRecoloring = this.getRecolorIntention();
    const effectiveColor = OracleSystem.applyRecolor(
      selectedColor,
      favorForRecoloring,
    );
    return effectiveColor;
  }

  public clearResourceSelection(): void {
    this.clearRecolorIntention();
    this.setSelectedDieColor(null);
    this.setSelectedOracleCardColor(null);
  }

  public map: HexMap;
  public players: Player[];
  private currentPlayerIndex: number;
  private favorToRecolor: number;
  private round: number;
  private phase: Phase;
  private cubeHexes: CubeHex[];
  private monsterHexes: MonsterHex[];
  private cityHexes: CityHex[];
  private statueHexes: StatueHex[];
  private shrineHexes: ShrineHex[];
  private selectedDieColor: CoreColor | null;
  private selectedOracleCardColor: CoreColor | null;
}
