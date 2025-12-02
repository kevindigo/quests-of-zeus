import type { Action } from './actions.ts';
import { GameEngineAnyResource } from './GameEngineAnyResource.ts';
import { GameEngineColor } from './GameEngineColor.ts';
import { GameEngineFree } from './GameEngineFree.ts';
import { GameEngineHex } from './GameEngineHex.ts';
import { GameEngineMove } from './GameEngineMove.ts';
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

  public getAvailableActions(GameState: GameState): Action[] {
    const actions: Action[] = [];
    actions.push(...GameEngineFree.getFreeActions(GameState));
    actions.push(...GameEngineAnyResource.getAnyResourceActions(GameState));
    actions.push(...GameEngineHex.getHexActions(GameState));
    actions.push(...GameEngineMove.getMoveActions(GameState));
    actions.push(...GameEngineColor.getColorActions(GameState));
    return actions;
  }

  public static readonly phaseName = 'main';
}

// export class PhaseAdvancingGod implements Phase {
//   private allowedColors: CoreColor[];
//   private canAdvanceFromZero: boolean;
//   private remainingCount: number;
// }

// export class PhaseTeleporting implements Phase {
// }

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
