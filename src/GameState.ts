import type { HexMap } from './hexmap/HexMap.ts';
import { Player } from './Player.ts';
import type { CityHex, CubeHex, MonsterHex } from './types.ts';

export class GameState {
  public constructor(
    map: HexMap,
    players: Player[],
    currentPlayerIndex: number,
    round: number,
    phase: 'setup' | 'action' | 'end',
    monsterStrength: number,
    cubeHexes: CubeHex[],
    monsterHexes: MonsterHex[],
    cityHexes: CityHex[],
  ) {
    this.map = map;
    this.players = players;
    this.currentPlayerIndex = currentPlayerIndex;
    this.round = round;
    this.phase = phase;
    this.monsterStrength = monsterStrength;
    this.cubeHexes = cubeHexes;
    this.monsterHexes = monsterHexes;
    this.cityHexes = cityHexes;
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
    return new GameState(
      JSON.parse(JSON.stringify(this.map)),
      copyOfPlayers,
      this.currentPlayerIndex,
      JSON.parse(JSON.stringify(this.round)),
      this.phase,
      this.monsterStrength,
      JSON.parse(JSON.stringify(this.cubeHexes)),
      JSON.parse(JSON.stringify(this.monsterHexes)),
      JSON.parse(JSON.stringify(this.cityHexes)),
    );
  }

  public map: HexMap;
  public players: Player[];
  public currentPlayerIndex: number;
  public round: number;
  public phase: 'setup' | 'action' | 'end';
  public monsterStrength: number;
  public cubeHexes: CubeHex[];
  public monsterHexes: MonsterHex[];
  public cityHexes: CityHex[];
}
