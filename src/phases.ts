import type { Action, FreeEndTurnAction, TeleportAction } from './actions.ts';
import { GameEngineColor } from './GameEngineColor.ts';
import { GameEngineFree } from './GameEngineFree.ts';
import { GameEngineHex } from './GameEngineHex.ts';
import { GameEngineMove } from './GameEngineMove.ts';
import { GameEngineResource } from './GameEngineResource.ts';
import type { GameState } from './GameState.ts';

// each player will have:
//  export const phaseQueue: Phase[] = [];

export interface Phase {
  getName(): string;
  getAvailableActions(gameState: GameState): Action[];
}

export function createPhase(phaseName: string): Phase {
  switch (phaseName) {
    case PhaseWelcome.phaseName:
      return new PhaseWelcome();
    case PhaseMain.phaseName:
      return new PhaseMain();
    case PhaseTeleporting.phaseName:
      return new PhaseTeleporting();
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
    actions.push(...GameEngineColor.getColorActions(gameState));
    actions.push(...GameEngineFree.getFreeActions(gameState));
    actions.push(...GameEngineResource.getAnyResourceActions(gameState));
    actions.push(...GameEngineHex.getHexActions(gameState));
    actions.push(...GameEngineMove.getMoveActions(gameState));
    return actions;
  }

  public static readonly phaseName = 'main';
}

// export class PhaseAdvancingGod implements Phase {
//   private allowedColors: CoreColor[];
//   private canAdvanceFromZero: boolean;
//   private remainingCount: number;
// }

export class PhaseTeleporting implements Phase {
  public getName(): string {
    return PhaseTeleporting.phaseName;
  }

  public getAvailableActions(gameState: GameState): Action[] {
    const actions: Action[] = [];

    const teleportActions = gameState.getMap().getCellsByTerrain('sea').map(
      (cell) => {
        const action: TeleportAction = {
          type: 'teleport',
          coordinates: cell.getCoordinates(),
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

// export class PhasePeeking implements Phase {
// }

// export class PhaseExploringAnyShrine implements Phase {
// }

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
