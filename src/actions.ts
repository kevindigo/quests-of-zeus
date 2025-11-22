import type { HexCoordinates } from './hexmap/HexGrid.ts';
import type { CoreColor, Resource } from './types.ts';

export type ActionType = 'free' | 'coupon' | 'noTargetColor' | 'normal';

// Base action interface
export interface ActionBase {
  type: ActionType; // general category
  playerId: number; // who performs the action
}

// God action interface
export interface FreeGodAction extends ActionBase {
  type: 'free';
  subType: 'god';
  godColor: CoreColor;
}

export interface ResourceAction extends ActionBase {
  spend: Resource;
}

export interface ResourceColorAction extends ResourceAction {
  targetColor: CoreColor;
}

// ------------------ Free God Actions ------------------
export interface FreeBlueGodAction extends FreeGodAction {
  godColor: 'blue';
  coordinates: HexCoordinates;
}

export interface FreeYellowGodAction extends FreeGodAction {
  godColor: 'yellow';
}

export interface FreeGreenGodAction extends FreeGodAction {
  godColor: 'green';
}

export interface FreeRedGodAction extends FreeGodAction {
  godColor: 'red';
}

export interface FreeBlackGodAction extends FreeGodAction {
  godColor: 'black';
  coordinates: HexCoordinates;
  monsterColor: CoreColor;
}

export interface FreePinkGodAction extends FreeGodAction {
  godColor: 'pink';
}

// ------------------ Other Free Actions ------------------
export interface FreeContinueMonsterFightAction extends ActionBase {
  type: 'free';
  subType: 'continueMonsterFight';
}

export interface FreeAbandonMonsterFightAction extends ActionBase {
  type: 'free';
  subType: 'abandonMonsterFight';
}

export interface FreeSkipTurnHealAction extends ActionBase {
  type: 'free';
  subType: 'skipTurnHeal';
  skipColors: [CoreColor, CoreColor, CoreColor];
}

export interface FreeUseEquipmentExtraDieAction extends ActionBase {
  type: 'free';
  subType: 'useEquipmentExtraDie';
}

// ------------------ Coupon Actions ------------------
export interface CouponPeekAction extends ActionBase {
  type: 'coupon';
  subType: 'peek';
  coordinates: HexCoordinates;
}

export interface CouponGodAdvanceAction extends ActionBase {
  type: 'coupon';
  subType: 'godAdvance';
  color: CoreColor;
}

export interface CouponGrabCubeAction extends ActionBase {
  type: 'coupon';
  subType: 'grabCube';
  color: CoreColor;
}

export interface CouponGrabStatueAction extends ActionBase {
  type: 'coupon';
  subType: 'grabStatue';
  color: CoreColor;
}

export interface CouponFlipCloudAction extends ActionBase {
  type: 'coupon';
  subType: 'flipCloud';
  coordinates: HexCoordinates;
}

// ------------------ No-Target-Color Actions ------------------
export interface NoColorGainFavorAction extends ResourceAction {
  type: 'noTargetColor';
  subType: 'gainFavor';
}

export interface NoColorGainOracleCardAction extends ResourceAction {
  type: 'noTargetColor';
  subType: 'gainOracleCard';
}

export interface NoColorGainPeekCouponsAction extends ResourceAction {
  type: 'noTargetColor';
  subType: 'gainPeekCoupons';
}

// ------------------ Color Actions ------------------
export interface HealAction extends ResourceColorAction {
  type: 'normal';
  subType: 'heal';
}

export interface ShipMoveAction extends ResourceColorAction {
  type: 'normal';
  subType: 'shipMove';
  coordinates: HexCoordinates;
  favorToRecolor: number;
  favorToExtendRange: number;
}

export interface LoadCubeAction extends ResourceColorAction {
  type: 'normal';
  subType: 'loadCube';
  coordinates: HexCoordinates;
}

export interface DropCubeAction extends ResourceColorAction {
  type: 'normal';
  subType: 'dropCube';
  coordinates: HexCoordinates;
}

export interface LoadStatueAction extends ResourceColorAction {
  type: 'normal';
  subType: 'loadStatue';
  coordinates: HexCoordinates;
}

export interface DropStatueAction extends ResourceColorAction {
  type: 'normal';
  subType: 'dropStatue';
  coordinates: HexCoordinates;
}

export interface FightMonsterAction extends ResourceColorAction {
  type: 'normal';
  subType: 'fightMonster';
  coordinates: HexCoordinates;
}

export interface ExploreShrineAction extends ResourceColorAction {
  type: 'normal';
  subType: 'exploreShrine';
  coordinates: HexCoordinates;
}

export interface UseEquipmentGainFavorCardAdvanceAction
  extends ResourceColorAction {
  type: 'normal';
  subType: 'useEquipmentGainFavorCardAdvance';
}

export type Action =
  | FreeBlueGodAction
  | FreeYellowGodAction
  | FreeGreenGodAction
  | FreeRedGodAction
  | FreeBlackGodAction
  | FreePinkGodAction
  | FreeContinueMonsterFightAction
  | FreeAbandonMonsterFightAction
  | FreeSkipTurnHealAction
  | FreeUseEquipmentExtraDieAction
  | CouponPeekAction
  | CouponGodAdvanceAction
  | CouponGrabCubeAction
  | CouponGrabStatueAction
  | CouponFlipCloudAction
  | NoColorGainFavorAction
  | NoColorGainOracleCardAction
  | NoColorGainPeekCouponsAction
  | HealAction
  | ShipMoveAction
  | LoadCubeAction
  | DropCubeAction
  | LoadStatueAction
  | DropStatueAction
  | FightMonsterAction
  | ExploreShrineAction
  | UseEquipmentGainFavorCardAdvanceAction;
