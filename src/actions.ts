import { type HexCoordinates, HexGrid } from './hexmap/HexGrid.ts';
import type { Resource } from './Resource.ts';
import type { CoreColor } from './types.ts';

export type ActionType =
  | 'free'
  | 'coupon'
  | 'resource'
  | 'color'
  | 'hex'
  | 'move'
  | 'miscellaneous';

export interface ActionBase {
  type: ActionType;
}

export interface FreeAction extends ActionBase {
  type: 'free';
  subType:
    | 'endTurn'
    | 'activateGod'
    | 'teleport'
    | 'superturn'
    | 'exploreAnyShrine'
    | 'healAll'
    | 'defeatMonster'
    | 'grabAnyStatue'
    | 'gainDieFromFavor';
}

export interface CouponAction extends ActionBase {
  type: 'coupon';
  subType:
    | 'skipTurn'
    | 'peek'
    | 'grabCube'
    | 'grabStatue'
    | 'flipCloud'
    | 'gainCompanion'
    | 'gainEquipment';
}

export interface ResourceAction extends ActionBase {
  type: 'resource';
  spend: Resource;
  subType: 'gainFavor' | 'gainOracleCard' | 'gainPeekCoupons' | 'advanceGod';
}

export interface ColorAction extends ActionBase {
  type: 'color';
  spend: Resource;
  subType: 'healColor' | 'gainCardFavorGod';
}

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

// ------------------ Free Actions ------------------
export interface FreeEndTurnAction extends FreeAction {
  subType: 'endTurn';
}

export interface FreeActivateGodAction extends FreeAction {
  subType: 'activateGod';
  godColor: CoreColor;
}

export interface FreeTeleportAction extends FreeAction {
  subType: 'teleport';
  coordinates: HexCoordinates;
}

export interface FreeSuperturnAction extends FreeAction {
  subType: 'superturn';
}

export interface FreeExploreAnyShrineAction extends FreeAction {
  subType: 'exploreAnyShrine';
  coordinates: HexCoordinates;
}

export interface FreeHealAllAction extends FreeAction {
  subType: 'healAll';
}

export interface FreeDefeatMonsterAction extends FreeAction {
  subType: 'defeatMonster';
  coordinates: HexCoordinates;
  monsterColor: CoreColor;
}

export interface FreeGrabAnyStatueAction extends FreeAction {
  subType: 'grabAnyStatue';
  color: CoreColor;
}

export interface FreeGainDieFromFavorAction extends FreeAction {
  subType: 'gainDieFromFavor';
}

// ------------------ Coupon Actions ------------------
export interface CouponSkipTurnAction extends CouponAction {
  subType: 'skipTurn';
  skipColors: [CoreColor, CoreColor, CoreColor];
}

export interface CouponPeekAction extends CouponAction {
  subType: 'peek';
  coordinates: HexCoordinates;
}

export interface CouponGrabCubeAction extends CouponAction {
  subType: 'grabCube';
  color: CoreColor;
}

export interface CouponGrabStatueAction extends CouponAction {
  subType: 'grabStatue';
  color: CoreColor;
}

export interface CouponGainCompanionAction extends CouponAction {
  subType: 'gainCompanion';
  color: CoreColor;
  companionType: 'wounds' | 'range' | 'wild';
}

export interface CouponGainEquipmentAction extends CouponAction {
  subType: 'gainEquipment';
  equipmentId: number;
}

// ------------------ Any-resource Actions ------------------
export interface ResourceGainFavorAction extends ResourceAction {
  subType: 'gainFavor';
}

export interface ResourceGainOracleCardAction extends ResourceAction {
  subType: 'gainOracleCard';
}

export interface ResourceGainPeekCouponsAction extends ResourceAction {
  subType: 'gainPeekCoupons';
}

export interface ResourceAdvanceGodAction extends ResourceAction {
  subType: 'advanceGod';
}

// ------------------ Color Actions ------------------
export interface ColorHealAction extends ColorAction {
  subType: 'healColor';
}

export interface ColorGainCardFavorGodAction extends ColorAction {
  subType: 'gainCardFavorGod';
}

// ------------------ Hex Actions ------------------
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
export type Action =
  // free
  | FreeEndTurnAction
  | FreeActivateGodAction
  | FreeGainDieFromFavorAction // equipment
  | FreeTeleportAction // blue god
  | FreeSuperturnAction // yellow god
  | FreeExploreAnyShrineAction // green god
  | FreeHealAllAction // red god
  | FreeDefeatMonsterAction // black god
  | FreeGrabAnyStatueAction // pink god
  // coupon
  | CouponSkipTurnAction //automatic
  | CouponPeekAction // die action (2x)
  | CouponGrabCubeAction // equipment
  | CouponGrabStatueAction // equipment
  | CouponGainCompanionAction // reward for statue
  | CouponGainEquipmentAction // reward for monster
  // anyResource
  | ResourceGainFavorAction
  | ResourceGainOracleCardAction
  | ResourceGainPeekCouponsAction
  // color
  | ResourceAdvanceGodAction // advance that god
  | ColorHealAction // heal all of that color
  | ColorGainCardFavorGodAction // get card+favor+god advance coupon
  // Hex
  | LoadCubeAction
  | DropCubeAction
  | LoadStatueAction
  | DropStatueAction
  | FightMonsterAction
  | ExploreShrineAction
  // move
  | ShipMoveAction;

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
      case 'coupon':
        break;
      case 'resource':
        return this.areEqualAny(candidate, reference as ResourceAction);
      case 'color':
        return this.areEqualColor(candidate, reference as ColorAction);
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

  public static areEqualColor(
    candidate: ColorAction,
    reference: ColorAction,
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
      case 'activateGod':
        return this.areEqualActivateGod(
          candidate as FreeActivateGodAction,
          reference as FreeActivateGodAction,
        );
      case 'teleport':
      case 'superturn':
      case 'exploreAnyShrine':
      case 'healAll':
      case 'defeatMonster':
      case 'grabAnyStatue':
      case 'gainDieFromFavor':
    }
    throw new Error(
      'Actions.areEqualFree not implemented for ' + JSON.stringify(candidate),
    );
  }

  public static areEqualActivateGod(
    candidate: FreeActivateGodAction,
    reference: FreeActivateGodAction,
  ): boolean {
    return candidate.godColor === reference.godColor;
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
