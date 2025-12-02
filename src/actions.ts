import { type HexCoordinates, HexGrid } from './hexmap/HexGrid.ts';
import type { Resource } from './Resource.ts';
import type { CoreColor } from './types.ts';

export type ActionType =
  | 'free'
  | 'color'
  | 'resource'
  | 'hex'
  | 'move'
  | 'teleport';

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
    | 'gainOracleCard'
    | 'advanceGod';
}

export interface ResourceGainFavorAction extends ResourceAction {
  subType: 'gainFavor';
}

export interface ResourceGainOracleCardAction extends ResourceAction {
  subType: 'gainOracleCard';
}

export interface ResourceAdvanceGodAction extends ResourceAction {
  subType: 'advanceGod';
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

export interface LoadCubeAction extends HexAction {
  subType: 'loadCube';
}

export interface DropCubeAction extends HexAction {
  subType: 'dropCube';
}

export interface LoadStatueAction extends HexAction {
  subType: 'loadStatue';
}

export interface DropStatueAction extends HexAction {
  subType: 'dropStatue';
}

export interface FightMonsterAction extends HexAction {
  subType: 'fightMonster';
}

export interface ExploreShrineAction extends HexAction {
  subType: 'exploreShrine';
}

// ------------------ Ship Move Actions ------------------
export interface ShipMoveAction extends ActionBase {
  type: 'move';
  destination: HexCoordinates;
  spend: Resource;
  favorToExtendRange: number;
}

// ------------------ Miscellaneous Actions ------------------
export interface TeleportAction extends ActionBase {
  type: 'teleport';
  coordinates: HexCoordinates;
}

export type Action =
  // implemented
  | FreeEndTurnAction
  | ColorActivateGodAction
  | ResourceGainFavorAction
  | ResourceGainOracleCardAction
  | ResourceAdvanceGodAction
  | LoadCubeAction
  | DropCubeAction
  | LoadStatueAction
  | DropStatueAction
  | FightMonsterAction
  | ExploreShrineAction
  | ShipMoveAction
  | TeleportAction; // blue god
// speculation
// | FreeGainDieFromFavorAction // equipment
// | FreeSuperturnAction // yellow god
// | FreeExploreAnyShrineAction // green god
// | FreeHealAllAction // red god
// | FreeDefeatMonsterAction // black god
// | FreeGrabAnyStatueAction // pink god
// | CouponSkipTurnAction //automatic
// | CouponPeekAction // die action (2x)
// | CouponGrabCubeAction // equipment
// | CouponGrabStatueAction // equipment
// | CouponGainCompanionAction // reward for statue
// | CouponGainEquipmentAction // reward for monster
// | ResourceGainPeekCouponsAction
// | ColorHealAction // heal all of that color
// | ColorGainCardFavorGodAction; // get card+favor+god advance coupon

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
        return this.areEqualAny(candidate, reference as ResourceAction);
      case 'hex':
        return this.areEqualHex(candidate, reference as HexAction);
      case 'move':
        return this.areEqualMove(candidate, reference as ShipMoveAction);
    }

    throw new Error(
      'Actions.areEqual not implemented for ' + JSON.stringify(candidate),
    );
  }

  public static areEqualAny(
    candidate: ResourceAction,
    reference: ResourceAction,
  ): boolean {
    if (candidate.subType !== reference.subType) {
      return false;
    }
    return candidate.spend.equals(reference.spend);
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
    candidate: ShipMoveAction,
    reference: ShipMoveAction,
  ): boolean {
    return candidate.spend.equals(reference.spend) &&
      HexGrid.isSameLocation(candidate.destination, reference.destination);
  }
}
