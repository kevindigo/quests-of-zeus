import type {
  Action,
  DropCubeAction,
  ExploreShrineAction,
  HexAction,
  LoadCubeAction,
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
import type { Item } from './types.ts';
import type { UiState } from './UiState.ts';

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
              ...GameEngineHex.getShrineActions(gameState, neighbor, resource),
            );
            break;
          case 'offerings':
            actions.push(
              ...GameEngineHex.getOfferingActions(
                gameState,
                neighbor,
                resource,
              ),
            );
            break;
          case 'temple':
            actions.push(
              ...GameEngineHex.getTempleActions(gameState, neighbor, resource),
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
    uiState: UiState,
  ): ResultWithMessage {
    switch (action.subType) {
      case 'shipMove':
        break;
      case 'loadCube':
        return GameEngineHex.doLoadCube(action, gameState, uiState);
      case 'dropCube':
        return GameEngineHex.doDropCube(action, gameState, uiState);
      case 'loadStatue':
        break;
      case 'dropStatue':
        break;
      case 'fightMonster':
        break;
      case 'exploreShrine': {
        return GameEngineHex.doExploreShrine(action, gameState, uiState);
      }
    }
    return new Failure(
      `GameHexAction.doAction(${JSON.stringify(action)}) not yet implemented`,
    );
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
    if (!player.validateItemIsLoadable(cube)) {
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

  private static doExploreShrine(
    action: HexAction,
    gameState: GameState,
    uiState: UiState,
  ): ResultWithMessage {
    const availableActions = GameEngineHex.getHexActions(gameState);
    const isAvailable = availableActions.find((aa) => {
      return aa.type === action.type &&
        aa.subType === action.subType &&
        aa.coordinates.q === action.coordinates.q &&
        aa.coordinates.r === action.coordinates.r &&
        aa.spend.equals(action.spend);
    });
    if (!isAvailable) {
      return new Failure(`Action not available ${JSON.stringify(action)}`);
    }

    const selectedCoordinates = uiState.getSelectedCoordinates();
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
    const color = uiState.getEffectiveSelectedColor();
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
      const spent = GameEngine.spendResource(gameState, uiState);
      if (!spent.success) {
        return new Failure(
          'Completed the quest, but failed spendResource: ' + spent.message,
        );
      }
      return new Success(`Completed shrine quest -- God reward not available`);
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
    const spent = GameEngine.spendResource(gameState, uiState);
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
    uiState: UiState,
  ): ResultWithMessage {
    const availableActions = GameEngineHex.getHexActions(gameState);
    if (
      !availableActions.find((aa) => {
        return aa.type === action.type &&
          aa.subType === action.subType &&
          aa.coordinates.q === action.coordinates.q &&
          aa.coordinates.r === action.coordinates.r &&
          aa.spend.equals(action.spend);
      })
    ) {
      return new Failure(`Action not available ${JSON.stringify(action)}`);
    }

    const coordinates = uiState.getSelectedCoordinates();
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
    const spent = GameEngine.spendResource(gameState, uiState);
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
    uiState: UiState,
  ): ResultWithMessage {
    const availableActions = GameEngineHex.getHexActions(gameState);
    if (
      !availableActions.find((aa) => {
        return aa.type === action.type &&
          aa.subType === action.subType &&
          aa.coordinates.q === action.coordinates.q &&
          aa.coordinates.r === action.coordinates.r &&
          aa.spend.equals(action.spend);
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

    GameEngine.spendResource(gameState, uiState);

    return new Success('faked');
  }
}
