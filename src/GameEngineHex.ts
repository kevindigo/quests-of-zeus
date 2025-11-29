import type {
  Action,
  DropCubeAction,
  DropStatueAction,
  ExploreShrineAction,
  FightMonsterAction,
  HexAction,
  LoadCubeAction,
  LoadStatueAction,
} from './actions.ts';
import { GameEngine } from './GameEngine.ts';
import type { GameState } from './GameState.ts';
import type { HexCell } from './hexmap/HexCell.ts';
import type { HexCoordinates } from './hexmap/HexGrid.ts';
import type { Resource } from './Resource.ts';
import {
  Failure,
  type ResultWithMessage,
  Success,
} from './ResultWithMessage.ts';
import type { CoreColor, Item, Quest } from './types.ts';

export class GameEngineHex {
  public static getHexActions(gameState: GameState): Action[] {
    const actions: Action[] = [];
    if (gameState.getPhase() !== 'action') {
      return actions;
    }

    const grid = gameState.getMap().getHexGrid();
    const player = gameState.getCurrentPlayer();
    const shipAt = player.getShipPosition();
    const neighbors = grid.getNeighborsByCoordinates(shipAt);

    const resources = player.getAvailableResourcesWithRecoloring();
    resources.forEach((resource) => {
      neighbors.forEach((neighbor) => {
        switch (neighbor.terrain) {
          case 'shrine':
            actions.push(
              ...this.getShrineActions(gameState, neighbor, resource),
            );
            break;
          case 'offerings':
            actions.push(
              ...this.getOfferingActions(
                gameState,
                neighbor,
                resource,
              ),
            );
            break;
          case 'temple':
            actions.push(
              ...this.getTempleActions(gameState, neighbor, resource),
            );
            break;
          case 'city':
            actions.push(
              ...this.getCityActions(gameState, neighbor, resource),
            );
            break;
          case 'statue':
            actions.push(
              ...this.getStatueActions(gameState, neighbor, resource),
            );
            break;
          case 'monsters':
            actions.push(
              ...this.getMonsterActions(gameState, neighbor, resource),
            );
            break;
        }
      });
    });

    return actions;
  }

  public static doAction(
    action: HexAction,
    gameState: GameState,
  ): ResultWithMessage {
    switch (action.subType) {
      case 'loadCube':
        return this.doLoadCube(action, gameState);
      case 'dropCube':
        return this.doDropCube(action, gameState);
      case 'loadStatue':
        return this.doLoadStatue(action, gameState);
      case 'dropStatue':
        return this.doDropStatue(action, gameState);
      case 'fightMonster':
        break;
      case 'exploreShrine': {
        return this.doExploreShrine(action, gameState);
      }
    }
    return new Failure(
      `GameHexAction.doAction(${JSON.stringify(action)}) not yet implemented`,
    );
  }

  public static areEqualHexActions(aa: Action, action: Action): boolean {
    return aa.type === 'hex' && action.type === 'hex' &&
      aa.subType === action.subType &&
      aa.coordinates.q === action.coordinates.q &&
      aa.coordinates.r === action.coordinates.r &&
      aa.spend.equals(action.spend);
  }

  private static getShrineActions(
    gameState: GameState,
    shrineCell: HexCell,
    resource: Resource,
  ): Action[] {
    if (shrineCell.color !== resource.getEffectiveColor()) {
      return [];
    }

    const coordinates = shrineCell.getCoordinates();
    if (GameEngineHex.canExploreShrine(gameState, coordinates)) {
      const action: ExploreShrineAction = {
        type: 'hex',
        subType: 'exploreShrine',
        spend: resource,
        coordinates,
      };

      return [action];
    }

    return [];
  }

  private static canExploreShrine(
    gameState: GameState,
    coordinates: HexCoordinates,
  ): boolean {
    const shrineHex = gameState.findShrineHexAt(coordinates);
    if (!shrineHex) {
      return false;
    }

    const player = gameState.getCurrentPlayer();
    const isHidden = shrineHex.status === 'hidden';
    const isVisibleAndOurs = shrineHex?.status === 'visible' &&
      shrineHex.owner === player.color;

    return (isHidden || isVisibleAndOurs);
  }

  private static getOfferingActions(
    gameState: GameState,
    offeringCell: HexCell,
    resource: Resource,
  ): LoadCubeAction[] {
    const effectiveColor = resource.getEffectiveColor();
    if (!effectiveColor) {
      return [];
    }

    const cube: Item = { type: 'cube', color: effectiveColor };
    const player = gameState.getCurrentPlayer();
    if (!player.validateItemIsLoadable(cube).success) {
      return [];
    }

    const quests = player.getQuestsOfType('temple');
    if (!this.willSatisfyQuest(quests, cube.color)) {
      return [];
    }

    const offeringHex = gameState.findCubeHexAt(offeringCell.getCoordinates());
    if (!offeringHex) {
      return [];
    }

    if (offeringHex.cubeColors.indexOf(effectiveColor) >= 0) {
      const action: LoadCubeAction = {
        type: 'hex',
        subType: 'loadCube',
        coordinates: offeringCell.getCoordinates(),
        spend: resource,
      };
      return [action];
    }

    return [];
  }

  private static willSatisfyQuest(quests: Quest[], color: CoreColor): boolean {
    const questItCanUse = quests.find((quest) => {
      return !quest.isCompleted &&
        (quest.color === 'none' || quest.color === color);
    });

    const wouldTakeWildQuest = questItCanUse?.color === 'none';
    if (wouldTakeWildQuest) {
      const questExistsForThatColor = quests.find((quest) => {
        return quest.color === color;
      });
      if (questExistsForThatColor) {
        return false;
      }
    }

    return questItCanUse ? true : false;
  }

  private static getTempleActions(
    gameState: GameState,
    templeCell: HexCell,
    resource: Resource,
  ): DropCubeAction[] {
    const selectedColor = resource.getEffectiveColor();
    const templeColor = templeCell.color;
    if (
      !selectedColor || templeColor === 'none' || selectedColor !== templeColor
    ) {
      return [];
    }

    const player = gameState.getCurrentPlayer();
    const requiredCube = player.getLoadedItems().find((item) => {
      return item.type === 'cube' && item.color === templeColor;
    });
    if (!requiredCube) {
      return [];
    }

    const action: DropCubeAction = {
      type: 'hex',
      subType: 'dropCube',
      coordinates: templeCell.getCoordinates(),
      spend: resource,
    };
    return [action];
  }

  private static getCityActions(
    gameState: GameState,
    cityCell: HexCell,
    resource: Resource,
  ): LoadStatueAction[] {
    const effectiveColor = resource.getEffectiveColor();
    const cityColor = cityCell.color;
    if (cityColor !== effectiveColor) {
      return [];
    }

    const player = gameState.getCurrentPlayer();
    const item: Item = { type: 'statue', color: effectiveColor };
    if (!player.validateItemIsLoadable(item).success) {
      return [];
    }

    const quests = player.getQuestsOfType('statue');
    const wildQuest = quests.find((quest) => {
      return quest.color === 'none';
    });
    if (!wildQuest) {
      return [];
    }
    const duplicateQuest = quests.find((quest) => {
      return quest.color === effectiveColor;
    });
    if (duplicateQuest) {
      return [];
    }

    const cityCoordinates = cityCell.getCoordinates();
    const cityHex = gameState.findCityHexAt(cityCoordinates);
    if (!cityHex || cityHex.statues < 1) {
      return [];
    }

    const action: LoadStatueAction = {
      type: 'hex',
      subType: 'loadStatue',
      coordinates: cityCoordinates,
      spend: resource,
    };
    return [action];
  }

  private static getStatueActions(
    gameState: GameState,
    statueCell: HexCell,
    resource: Resource,
  ): DropStatueAction[] {
    const effectiveColor = resource.getEffectiveColor();
    if (!effectiveColor) {
      return [];
    }

    const player = gameState.getCurrentPlayer();
    const statue: Item = { type: 'statue', color: effectiveColor };
    if (!player.isItemLoaded(statue)) {
      return [];
    }

    const statueCoordinates = statueCell.getCoordinates();
    const statueHex = gameState.findStatueHexAt(statueCoordinates);
    if (!statueHex) {
      return [];
    }
    if (statueHex.emptyBases.indexOf(effectiveColor) < 0) {
      return [];
    }

    const action: DropStatueAction = {
      type: 'hex',
      subType: 'dropStatue',
      coordinates: statueCoordinates,
      spend: resource,
    };
    return [action];
  }

  private static getMonsterActions(
    gameState: GameState,
    monsterCell: HexCell,
    resource: Resource,
  ): FightMonsterAction[] {
    const color = resource.getEffectiveColor();
    if (!color) {
      return [];
    }

    const monsterCoordinates = monsterCell.getCoordinates();
    const monsterHex = gameState.findMonsterHexAt(monsterCoordinates);
    if (!monsterHex) {
      return [];
    }
    if (monsterHex.monsterColors.indexOf(color) < 0) {
      return [];
    }

    const player = gameState.getCurrentPlayer();
    if (!this.willSatisfyQuest(player.getQuestsOfType('monster'), color)) {
      return [];
    }

    const action: FightMonsterAction = {
      type: 'hex',
      subType: 'fightMonster',
      coordinates: monsterCoordinates,
      spend: resource,
    };
    return [action];
  }

  private static doExploreShrine(
    action: HexAction,
    gameState: GameState,
  ): ResultWithMessage {
    const availableActions = GameEngineHex.getHexActions(gameState);
    const isAvailable = availableActions.find((aa) => {
      return this.areEqualHexActions(aa, action as Action);
    });
    if (!isAvailable) {
      return new Failure(`Action not available ${JSON.stringify(action)}`);
    }

    const selectedCoordinates = action.coordinates;
    if (!selectedCoordinates) {
      return new Failure(
        `No coordinates selected for action ${JSON.stringify(action)}`,
      );
    }
    const shrineHex = gameState.findShrineHexAt(selectedCoordinates);
    if (!shrineHex) {
      return new Failure(
        `Explore shrine not where expected: ${JSON.stringify(action)}`,
      );
    }
    const color = action.spend.getEffectiveColor();
    if (!color) {
      return new Failure(
        `Explore shrine without a color selected ${JSON.stringify(action)}`,
      );
    }

    const player = gameState.getCurrentPlayer();
    if (shrineHex.owner === player.color) {
      const unfilledShrineQuest = player.getQuestsOfType('shrine').find(
        (quest) => {
          return !quest.isCompleted;
        },
      );
      if (!unfilledShrineQuest) {
        return new Failure('All shrines were already built!?');
      }
      unfilledShrineQuest.isCompleted = true;
      shrineHex.status = 'filled';
      const spent = GameEngine.spendResource(gameState, action.spend);
      if (!spent.success) {
        return new Failure(
          'Completed the quest, but failed spendResource: ' + spent.message,
        );
      }
      return new Success(`Shrine quest completed -- God reward not available`);
    }

    shrineHex.status = 'visible';
    switch (shrineHex.reward) {
      case 'favor':
        player.favor += 4;
        break;
      case 'card': {
        const deck = gameState.getOracleCardDeck();
        for (let i = 0; i < 2; ++i) {
          const card = deck.pop();
          if (!card) {
            return new Failure('Cloud flipped -- oracle card deck is empty');
          }
          player.oracleCards.push(card);
        }
        break;
      }
      case 'god':
        return new Failure('Cloud flipped -- god reward not available yet');
      case 'shield':
        player.shield += 1;
        return new Failure(
          'Cloud flipped and gained shield -- healing injuries not available yet',
        );
    }
    const spent = GameEngine.spendResource(gameState, action.spend);
    if (!spent.success) {
      return new Failure(
        'Cloud flipped but spend failed: ' + spent.message,
      );
    }
    return new Success(`Cloud flipped -- reward ${shrineHex.reward}`);
  }

  private static doLoadCube(
    action: HexAction,
    gameState: GameState,
  ): ResultWithMessage {
    const availableActions = GameEngineHex.getHexActions(gameState);
    if (
      !availableActions.find((availableAction) => {
        return this.areEqualHexActions(availableAction, action);
      })
    ) {
      return new Failure(`Action not available ${JSON.stringify(action)}`);
    }

    const coordinates = action.coordinates;
    if (!coordinates) {
      return new Failure('doLoadCube failed because no location was selected');
    }

    const effectiveColor = action.spend.getEffectiveColor();
    if (!effectiveColor) {
      return new Failure('doLoadCube failed because no resource was selected');
    }
    const item: Item = {
      type: 'cube',
      color: effectiveColor,
    };

    const offeringHex = gameState.findCubeHexAt(coordinates);
    if (!offeringHex) {
      return new Failure(
        'doLoadCube failed because the offering hex was not found',
      );
    }

    const player = gameState.getCurrentPlayer();
    const loaded = player.loadItem(item);
    if (!loaded.success) {
      return loaded;
    }
    const removalResult = offeringHex.remove(effectiveColor);
    if (!removalResult.success) {
      return removalResult;
    }
    GameEngine.updateWildQuestIfNecessary(player, item);
    const spent = GameEngine.spendResource(gameState, action.spend);
    if (!spent.success) {
      return new Failure(
        'Loaded cube but spend failed: ' + spent.message,
      );
    }
    return new Success('Offering was loaded');
  }

  private static doDropCube(
    action: HexAction,
    gameState: GameState,
  ): ResultWithMessage {
    const availableActions = GameEngineHex.getHexActions(gameState);
    if (
      !availableActions.find((availableAction) => {
        return this.areEqualHexActions(availableAction, action);
      })
    ) {
      return new Failure(`Action not available ${JSON.stringify(action)}`);
    }

    const player = gameState.getCurrentPlayer();
    const effectiveColor = action.spend.getEffectiveColor();
    if (!effectiveColor) {
      return new Failure('Drop cube no resource selected');
    }
    const quests = player.getQuestsOfType('temple');
    const quest = quests.find((quest) => {
      return quest.color === effectiveColor;
    });
    if (!quest) {
      return new Failure(
        `Drop cube ${effectiveColor} quest not found in ${
          JSON.stringify(quests)
        }`,
      );
    }
    quest.isCompleted = true;
    player.favor += 3;
    const item: Item = { type: 'cube', color: effectiveColor };
    player.unloadItem(item);

    GameEngine.spendResource(gameState, action.spend);

    return new Success(
      `Dropped cube ${effectiveColor} at temple; gained favor`,
    );
  }

  public static doLoadStatue(
    action: HexAction,
    gameState: GameState,
  ): ResultWithMessage {
    const availableActions = GameEngineHex.getHexActions(gameState);
    if (
      !availableActions.find((availableAction) => {
        return this.areEqualHexActions(availableAction, action);
      })
    ) {
      return new Failure(`Action not available ${JSON.stringify(action)}`);
    }

    const cityHex = gameState.findCityHexAt(action.coordinates);
    if (!cityHex) {
      return new Failure(`No city hex at ${action.coordinates}`);
    }
    cityHex.statues -= 1;

    const player = gameState.getCurrentPlayer();
    const resource = action.spend;
    const effectiveColor = resource.getEffectiveColor();
    if (!effectiveColor) {
      return new Failure(`No resource selected`);
    }
    const statue: Item = { type: 'statue', color: effectiveColor };
    player.loadItem(statue);

    const quests = player.getQuestsOfType('statue');
    const wildQuest = quests.find((quest) => {
      return quest.color === 'none';
    });
    if (!wildQuest) {
      return new Failure('No wild quests available');
    }
    wildQuest.color = effectiveColor;

    GameEngine.spendResource(gameState, resource);

    return new Success(
      `Dropped cube ${effectiveColor} at temple; gained favor`,
    );
  }

  private static doDropStatue(
    action: HexAction,
    gameState: GameState,
  ): ResultWithMessage {
    const availableActions = GameEngineHex.getHexActions(gameState);
    if (
      !availableActions.find((availableAction) => {
        return this.areEqualHexActions(availableAction, action);
      })
    ) {
      return new Failure(`Action not available ${JSON.stringify(action)}`);
    }

    const effectiveColor = action.spend.getEffectiveColor();
    if (!effectiveColor) {
      return new Failure('Cannot raise statue -- no resource selected');
    }

    const statue: Item = { type: 'statue', color: effectiveColor };
    const player = gameState.getCurrentPlayer();
    const unloaded = player.unloadItem(statue);
    if (!unloaded.success) {
      return unloaded;
    }

    const statueCoordinates = action.coordinates;
    const statueHex = gameState.findStatueHexAt(statueCoordinates);
    if (!statueHex) {
      return new Failure(
        'Impossible: statueHex not at ' + JSON.stringify(statueCoordinates),
      );
    }
    const thisIndex = statueHex.emptyBases.indexOf(effectiveColor);
    if (thisIndex < 0) {
      return new Failure('Impossible: no empty base ' + effectiveColor);
    }
    statueHex.emptyBases.splice(thisIndex, 1);
    statueHex.raisedStatues.push(effectiveColor);

    const thisQuest = player.getQuestsOfType('statue').find((quest) => {
      return quest.color === effectiveColor;
    });
    if (!thisQuest) {
      return new Failure('Impossible: no quest of ' + effectiveColor);
    }
    thisQuest.isCompleted = true;

    const spent = GameEngine.spendResource(gameState, action.spend);
    if (!spent.success) {
      return spent;
    }

    return new Success(
      `Successfully raised ${effectiveColor} statue (but no companion reward)`,
    );
  }
}
