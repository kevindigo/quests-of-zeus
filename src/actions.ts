import type { HexCoordinates } from './hexmap/HexGrid.ts';
import type { CoreColor, Resource } from './types.ts';

export type ActionType =
  | 'free'
  | 'godEffect'
  | 'coupon'
  | 'anyResource'
  | 'hex'
  | 'miscellaneous';

export interface ActionBase {
  type: ActionType;
}

export interface FreeAction extends ActionBase {
  type: 'free';
  subtype:
    | 'continueMonsterFight'
    | 'abandonMonsterFight'
    | 'skipTurnHeal'
    | 'useEquipmentExtraDie'
    | 'endTurn'
    | 'recolor';
}

export interface GodEffectAction extends ActionBase {
  type: 'godEffect';
  godColor: CoreColor;
}

export interface CouponAction extends ActionBase {
  type: 'coupon';
  subType:
    | 'peek'
    | 'godAdvance'
    | 'grabCube'
    | 'grabStatue'
    | 'flipCloud';
}

export interface ResourceAction extends ActionBase {
  spend: Resource;
}

export interface AnyResourceAction extends ResourceAction {
  type: 'anyResource';
  subtype: 'gainFavor' | 'gainOracleCard' | 'gainPeekCoupons';
}

export interface ColorBasedAction extends ResourceAction {
  targetColor: CoreColor;
}

export interface HexAction extends ColorBasedAction {
  type: 'hex';
  coordinates: HexCoordinates;
  subType:
    | 'shipMove'
    | 'loadCube'
    | 'dropCube'
    | 'loadStatue'
    | 'dropStatue'
    | 'fightMonster'
    | 'exploreShrine';
}

export interface MiscellaneousColorAction extends ResourceAction {
  type: 'miscellaneous';
  subType:
    | 'heal'
    | 'useEquipmentGainFavorCardAdvance';
}

// ------------------ Free Regular Actions ------------------
export interface FreeContinueMonsterFightAction extends FreeAction {
  subType: 'continueMonsterFight';
}

export interface FreeAbandonMonsterFightAction extends FreeAction {
  subType: 'abandonMonsterFight';
}

export interface FreeSkipTurnHealAction extends FreeAction {
  subType: 'skipTurnHeal';
  skipColors: [CoreColor, CoreColor, CoreColor];
}

export interface FreeUseEquipmentExtraDieAction extends FreeAction {
  subType: 'useEquipmentExtraDie';
}

export interface FreeEndTurnAction extends FreeAction {
  subType: 'endTurn';
}

export interface FreeRecolorAction extends FreeAction {
  subtype: 'recolor';
  targetResource: Resource;
  favorToSpend: number;
}

// ------------------ Free God Actions ------------------
export interface BlueGodAction extends GodEffectAction {
  godColor: 'blue';
  coordinates: HexCoordinates;
}

export interface YellowGodAction extends GodEffectAction {
  godColor: 'yellow';
}

export interface GreenGodAction extends GodEffectAction {
  godColor: 'green';
}

export interface RedGodAction extends GodEffectAction {
  godColor: 'red';
}

export interface BlackGodAction extends GodEffectAction {
  godColor: 'black';
  coordinates: HexCoordinates;
  monsterColor: CoreColor;
}

export interface PinkGodAction extends GodEffectAction {
  godColor: 'pink';
}

// ------------------ Coupon Actions ------------------
export interface CouponPeekAction extends CouponAction {
  subType: 'peek';
  coordinates: HexCoordinates;
}

export interface CouponGodAdvanceAction extends CouponAction {
  subType: 'godAdvance';
  color: CoreColor;
}

export interface CouponGrabCubeAction extends CouponAction {
  subType: 'grabCube';
  color: CoreColor;
}

export interface CouponGrabStatueAction extends CouponAction {
  subType: 'grabStatue';
  color: CoreColor;
}

export interface CouponFlipCloudAction extends CouponAction {
  subType: 'flipCloud';
  coordinates: HexCoordinates;
}

// ------------------ No-Target-Color Actions ------------------
export interface AnyResourceGainFavorAction extends AnyResourceAction {
  subType: 'gainFavor';
}

export interface AnyResourceGainOracleCardAction extends AnyResourceAction {
  subType: 'gainOracleCard';
}

export interface AnyResourceGainPeekCouponsAction extends AnyResourceAction {
  subType: 'gainPeekCoupons';
}

// ------------------ Hex Actions ------------------
export interface ShipMoveAction extends HexAction {
  subType: 'shipMove';
  favorToExtendRange: number;
}

export interface LoadCubeAction extends HexAction {
  subType: 'loadCube';
}

export interface DropCubeAction extends HexAction {
  subType: 'dropCube';
  coordinates: HexCoordinates;
}

export interface LoadStatueAction extends HexAction {
  subType: 'loadStatue';
  coordinates: HexCoordinates;
}

export interface DropStatueAction extends HexAction {
  subType: 'dropStatue';
  coordinates: HexCoordinates;
}

export interface FightMonsterAction extends HexAction {
  subType: 'fightMonster';
  coordinates: HexCoordinates;
}

export interface ExploreShrineAction extends HexAction {
  subType: 'exploreShrine';
  coordinates: HexCoordinates;
}

// ------------------ Miscellaneous Actions ------------------
export interface HealAction extends ColorBasedAction {
  subType: 'heal';
}

export interface UseEquipmentGainFavorCardAdvanceAction
  extends ColorBasedAction {
  subType: 'useEquipmentGainFavorCardAdvance';
}

export type Action =
  // free
  | FreeContinueMonsterFightAction
  | FreeAbandonMonsterFightAction
  | FreeSkipTurnHealAction
  | FreeUseEquipmentExtraDieAction
  | FreeEndTurnAction
  | FreeRecolorAction
  // godEffect
  | BlueGodAction
  | YellowGodAction
  | GreenGodAction
  | RedGodAction
  | BlackGodAction
  | PinkGodAction
  // coupon
  | CouponPeekAction
  | CouponGodAdvanceAction
  | CouponGrabCubeAction
  | CouponGrabStatueAction
  | CouponFlipCloudAction
  // noColor
  | AnyResourceGainFavorAction
  | AnyResourceGainOracleCardAction
  | AnyResourceGainPeekCouponsAction
  // Hex
  | ShipMoveAction
  | LoadCubeAction
  | DropCubeAction
  | LoadStatueAction
  | DropStatueAction
  | FightMonsterAction
  | ExploreShrineAction
  // miscellaneous
  | HealAction
  | UseEquipmentGainFavorCardAdvanceAction;
