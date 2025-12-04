import type {
  Action,
  AdvanceGodAction,
  FreeEndTurnAction,
  HexExploreShrineAction,
  HexPeekShrineAction,
  MoveShipAction,
} from './actions.ts';
import { GameEngine } from './GameEngine.ts';
import { GameEngineAdvance } from './GameEngineAdvance.ts';
import { GameEngineColor } from './GameEngineColor.ts';
import { GameEngineFree } from './GameEngineFree.ts';
import { GameEngineHex } from './GameEngineHex.ts';
import { GameEngineMove } from './GameEngineMove.ts';
import { GameEngineResource } from './GameEngineResource.ts';
import type { GameState } from './GameState.ts';
import { Resource } from './Resource.ts';
import { COLOR_WHEEL } from './types.ts';

export interface Phase {
  getName(): string;
  getAvailableActions(gameState: GameState): Action[];
}

export function createPhase(phaseName: string): Phase {
  switch (phaseName) {
    case PhaseAdvancingGod.phaseName:
      return new PhaseAdvancingGod();
    case PhaseExploring.phaseName:
      return new PhaseExploring();
    case PhaseMain.phaseName:
      return new PhaseMain();
    case PhasePeeking.phaseName:
      return new PhasePeeking();
    case PhaseTeleporting.phaseName:
      return new PhaseTeleporting();
    case PhaseWelcome.phaseName:
      return new PhaseWelcome();
  }

  throw new Error('Cannot create unknown phase: ' + phaseName);
}

export class PhaseWelcome implements Phase {
  public getName(): string {
    return PhaseWelcome.phaseName;
  }

  public getAvailableActions(_gameState: GameState): Action[] {
    return [];
  }

  public static readonly phaseName = 'welcome';
}

export class PhaseMain implements Phase {
  public getName(): string {
    return PhaseMain.phaseName;
  }

  public getAvailableActions(gameState: GameState): Action[] {
    const actions: Action[] = [];
    actions.push(...GameEngineFree.getFreeActions(gameState));
    actions.push(...GameEngineColor.getColorActions(gameState));
    actions.push(...GameEngineResource.getResourceActions(gameState));
    actions.push(...GameEngineAdvance.getAdvanceActions(gameState));
    actions.push(...GameEngineHex.getHexActions(gameState));
    actions.push(...GameEngineMove.getMoveActions(gameState));
    return actions;
  }

  public static readonly phaseName = 'main';
}

export class PhaseAdvancingGod implements Phase {
  getName(): string {
    return PhaseAdvancingGod.phaseName;
  }

  public getAvailableActions(gameState: GameState): Action[] {
    const actions: Action[] = [];

    const maxLevel = GameEngine.getMaxGodLevel(gameState);
    const player = gameState.getCurrentPlayer();
    COLOR_WHEEL.forEach((color) => {
      const level = player.getGodLevel(color);
      if (level < maxLevel) {
        const action: AdvanceGodAction = {
          type: 'advance',
          godColor: color,
          spend: Resource.none,
        };
        actions.push(action);
      }
    });

    const endTurn: FreeEndTurnAction = { type: 'free', subType: 'endTurn' };
    actions.push(endTurn);

    return actions;
  }
  public static readonly phaseName = 'advancingGod';
}

export class PhaseTeleporting implements Phase {
  public getName(): string {
    return PhaseTeleporting.phaseName;
  }

  public getAvailableActions(gameState: GameState): Action[] {
    const actions: Action[] = [];

    const teleportActions = gameState.getMap().getCellsByTerrain('sea').map(
      (cell) => {
        const action: MoveShipAction = {
          type: 'move',
          destination: cell.getCoordinates(),
          spend: Resource.none,
          favorToExtendRange: 0,
        };
        return action;
      },
    );
    actions.push(...teleportActions);

    const endTurn: FreeEndTurnAction = { type: 'free', subType: 'endTurn' };
    actions.push(endTurn);

    return actions;
  }
  public static readonly phaseName = 'teleporting';
}

export class PhaseExploring implements Phase {
  public getName(): string {
    return PhaseExploring.phaseName;
  }

  public getAvailableActions(gameState: GameState): Action[] {
    const actions: Action[] = [];

    actions.push(...this.getAvailableExploreActions(gameState));

    const endTurn: FreeEndTurnAction = { type: 'free', subType: 'endTurn' };
    actions.push(endTurn);

    return actions;
  }

  private getAvailableExploreActions(
    gameState: GameState,
  ): HexExploreShrineAction[] {
    const maxLevel = GameEngine.getMaxGodLevel(gameState);
    const player = gameState.getCurrentPlayer();
    const greenGodLevel = player.getGodLevel('green');
    if (greenGodLevel < maxLevel) {
      console.log('Impossible: Exploring phase without the green god ready');
      gameState.endPhase();
      return [];
    }

    const shrineHexes = gameState.getShrineHexes();
    const availableShrineHexes = shrineHexes.filter((hex) => {
      return hex.status === 'hidden';
    });
    return availableShrineHexes.map((hex): HexExploreShrineAction => {
      const action: HexExploreShrineAction = {
        type: 'hex',
        subType: 'exploreShrine',
        coordinates: hex.getCoordinates(),
        spend: Resource.none,
      };
      return action;
    });
  }

  public static readonly phaseName = 'exploring';
}

export class PhasePeeking implements Phase {
  getName(): string {
    return PhasePeeking.phaseName;
  }
  getAvailableActions(gameState: GameState): Action[] {
    const actions = [];

    const hiddenShrineHexes = gameState.getShrineHexes().filter((hex) => {
      return hex.status === 'hidden';
    });
    const peekActions = hiddenShrineHexes.map((hex) => {
      const action: HexPeekShrineAction = {
        type: 'hex',
        subType: 'peekShrine',
        coordinates: hex.getCoordinates(),
        spend: Resource.none,
      };
      return action;
    });
    actions.push(...peekActions);

    const endTurn: FreeEndTurnAction = { type: 'free', subType: 'endTurn' };
    actions.push(endTurn);

    return actions;
  }

  public static readonly phaseName = 'peeking';
}

// export class PhaseGrabbingStatue implements Phase {
//   private allowedColors: CoreColor[];
// }

// export class PhaseGrabbingOffering implements Phase {
//   private allowedColors: CoreColor[];
// }

// export class PhaseGainingEquipment implements Phase {
// }

// export class PhaseGainingCompanion implements Phase {
// }

// export class PhaseHealingColor implements Phase {
// }

// export class PhaseFightingMonster implements Phase {
// }
