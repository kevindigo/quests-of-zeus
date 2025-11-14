import type { HexMap } from './hexmap/HexMap.ts';
import { Player } from './Player.ts';
import type { CityHex, CubeHex, MonsterHex, Phase } from './types.ts';

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

  public deepCopy(): GameState {
    const copyOfPlayers = this.players.map((oldPlayer) => {
      const newPlayer = new Player(
        oldPlayer.id,
        oldPlayer.name,
        oldPlayer.color,
        oldPlayer.getShipPosition(),
      );
      newPlayer.oracleCards = JSON.parse(JSON.stringify(oldPlayer.oracleCards));
      newPlayer.oracleDice = JSON.parse(JSON.stringify(oldPlayer.oracleDice));
      if (oldPlayer.recoloredCards) {
        newPlayer.recoloredCards = JSON.parse(
          JSON.stringify(oldPlayer.recoloredCards),
        );
      }
      newPlayer.recoloredDice = JSON.parse(
        JSON.stringify(oldPlayer.recoloredDice),
      );
      newPlayer.favor = oldPlayer.favor;
      newPlayer.shield = oldPlayer.shield;
      newPlayer.usedOracleCardThisTurn = oldPlayer.usedOracleCardThisTurn;
      return newPlayer;
    });
    const newGameState = new GameState(
      JSON.parse(JSON.stringify(this.map)),
      copyOfPlayers,
    );

    newGameState.setCurrentPlayerIndex(this.getCurrentPlayerIndex());
    newGameState.setRound(this.getRound());
    newGameState.setPhase(this.getPhase());
    newGameState.setCubeHexes(this.getCubeHexes());
    newGameState.setMonsterHexes(this.getMonsterHexes());
    newGameState.setCityHexes(this.getCityHexes());

    return newGameState;
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
