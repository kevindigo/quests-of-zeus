import { type HexCoordinates, HexGrid } from './hexmap/HexGrid.ts';
import type { Resource } from './Resource.ts';
import type { CoreColor } from './types.ts';

export type ActionType =
  | 'free'
  | 'color'
  | 'resource'
  | 'advance'
  | 'hex'
  | 'move';

export interface ActionBase {
  type: ActionType;
}

// ------------------ Free Actions ------------------
export interface FreeAction extends ActionBase {
  type: 'free';
  subType:
    | 'endTurn'
    | 'activateGod';
}

export interface FreeEndTurnAction extends FreeAction {
  subType: 'endTurn';
}

// ------------------ Color Actions ------------------
export interface ColorAction extends ActionBase {
  type: 'color';
  subType: 'activateGod';
  color: CoreColor;
}

export interface ColorActivateGodAction extends ColorAction {
  subType: 'activateGod';
}

// ------------------ Resource Actions ------------------
export interface ResourceAction extends ActionBase {
  type: 'resource';
  spend: Resource;
  subType:
    | 'gainFavor'
    | 'gainOracleCard';
}

export interface ResourceGainFavorAction extends ResourceAction {
  subType: 'gainFavor';
}

export interface ResourceGainOracleCardAction extends ResourceAction {
  subType: 'gainOracleCard';
}

// ------------------ God (advance) Actions ------------------
export interface AdvanceGodAction extends ActionBase {
  type: 'advance';
  godColor: CoreColor;
  spend: Resource;
}

// ------------------ Hex Actions ------------------
export interface HexAction extends ActionBase {
  type: 'hex';
  coordinates: HexCoordinates;
  spend: Resource;
  subType:
    | 'loadCube'
    | 'dropCube'
    | 'loadStatue'
    | 'dropStatue'
    | 'fightMonster'
    | 'exploreShrine';
}

export interface HexLoadCubeAction extends HexAction {
  subType: 'loadCube';
}

export interface HexDropCubeAction extends HexAction {
  subType: 'dropCube';
}

export interface HexLoadStatueAction extends HexAction {
  subType: 'loadStatue';
}

export interface HexDropStatueAction extends HexAction {
  subType: 'dropStatue';
}

export interface HexFightMonsterAction extends HexAction {
  subType: 'fightMonster';
}

export interface HexExploreShrineAction extends HexAction {
  subType: 'exploreShrine';
}

// ------------------ Ship Move Actions ------------------
export interface MoveShipAction extends ActionBase {
  type: 'move';
  destination: HexCoordinates;
  spend: Resource;
  favorToExtendRange: number;
}

// ------------------ Miscellaneous Actions ------------------
export type Action =
  // implemented
  | FreeEndTurnAction
  | ColorActivateGodAction
  | ResourceGainFavorAction
  | ResourceGainOracleCardAction
  | AdvanceGodAction
  | HexLoadCubeAction
  | HexDropCubeAction
  | HexLoadStatueAction
  | HexDropStatueAction
  | HexFightMonsterAction
  | HexExploreShrineAction
  | MoveShipAction;
// speculation
// | FreeGainDieFromFavorAction // equipment
// | FreeSuperturnAction // yellow god
// | FreeHealAllAction // red god
// | CouponSkipTurnAction //automatic
// | HexPeekAction // die action (2x)
// | GainCompanionAction // reward for statue
// | GainEquipmentAction // reward for monster
// | ResourceGainPeeksAction
// | ResourceHealColorAction // heal all of that color
// | ResourceGainCardFavorGodAction; // get card+favor+god advance

export class Actions {
  public static find(actions: Action[], lookFor: Action): Action | undefined {
    return actions.find((candidate) => {
      return Actions.areEqual(candidate, lookFor);
    });
  }

  public static findOne(
    actions: Action[],
    lookFor: Action,
  ): Action | undefined {
    const matches = actions.filter((candidate) => {
      return Actions.areEqual(candidate, lookFor);
    });
    return (matches.length === 1 ? matches[0] : undefined);
  }

  public static filter(actions: Action[], lookFor: Action): Action[] {
    return actions.filter((candidate) => {
      return Actions.areEqual(candidate, lookFor);
    });
  }

  public static areEqual(candidate: Action, reference: Action): boolean {
    if (candidate.type !== reference.type) {
      return false;
    }
    switch (candidate.type) {
      case 'free':
        return this.areEqualFree(candidate, reference as FreeAction);
      case 'color':
        return this.areEqualColor(candidate, reference as ColorAction);
      case 'resource':
        return this.areEqualResource(candidate, reference as ResourceAction);
      case 'advance':
        return this.areEqualAdvance(candidate, reference as AdvanceGodAction);
      case 'hex':
        return this.areEqualHex(candidate, reference as HexAction);
      case 'move':
        return this.areEqualMove(candidate, reference as MoveShipAction);
    }

    throw new Error(
      'Actions.areEqual not implemented for ' + JSON.stringify(candidate),
    );
  }

  public static areEqualFree(
    candidate: FreeAction,
    reference: FreeAction,
  ): boolean {
    if (candidate.subType !== reference.subType) {
      return false;
    }
    switch (candidate.subType) {
      case 'endTurn':
        return true;
    }
    throw new Error(
      'Actions.areEqualFree not implemented for ' + JSON.stringify(candidate),
    );
  }

  public static areEqualColor(
    candidate: ColorAction,
    reference: ColorAction,
  ): boolean {
    return candidate.color === reference.color;
  }

  public static areEqualResource(
    candidate: ResourceAction,
    reference: ResourceAction,
  ): boolean {
    if (candidate.subType !== reference.subType) {
      return false;
    }
    return candidate.spend.equals(reference.spend);
  }

  public static areEqualAdvance(
    candidate: AdvanceGodAction,
    reference: AdvanceGodAction,
  ): boolean {
    return candidate.godColor === reference.godColor &&
      candidate.spend.equals(reference.spend);
  }

  public static areEqualHex(
    candidate: HexAction,
    reference: HexAction,
  ): boolean {
    if (candidate.subType !== reference.subType) {
      return false;
    }
    return candidate.spend.equals(reference.spend) &&
      HexGrid.isSameLocation(candidate.coordinates, reference.coordinates);
  }

  public static areEqualMove(
    candidate: MoveShipAction,
    reference: MoveShipAction,
  ): boolean {
    return candidate.spend.equals(reference.spend) &&
      HexGrid.isSameLocation(candidate.destination, reference.destination);
  }
}
