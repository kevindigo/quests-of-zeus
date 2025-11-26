import {
  assert,
  assertGreaterOrEqual,
  assertStringIncludes,
} from '@std/assert';
import { assertEquals } from '@std/assert/equals';
import type { ExploreShrineAction } from '../src/actions.ts';
import { GameEngineHex } from '../src/GameEngineHex.ts';
import { GameState } from '../src/GameState.ts';
import { GameStateInitializer } from '../src/GameStateInitializer.ts';
import { Resource } from '../src/Resource.ts';
import {
  COLOR_WHEEL,
  type ShrineHex,
  type ShrineReward,
} from '../src/types.ts';
import { type UiState, UiStateClass } from '../src/UiState.ts';
import { assertFailureContains } from './test-helpers.ts';

let gameState: GameState;
let uiState: UiState;

function setupNextToShrine(
  isOurs: boolean,
  reward: ShrineReward | null,
): void {
  gameState = new GameState();
  new GameStateInitializer().initializeGameState(gameState);
  uiState = new UiStateClass();
  const player = gameState.getCurrentPlayer();

  const shrineHex = gameState.getShrineHexes().find((hex) => {
    const thisIsOurs = hex.owner === player.color;
    const thisReward = hex.reward;
    return thisIsOurs === isOurs && (!reward || thisReward === reward);
  });
  assert(shrineHex);
  const shrineCoordinates = { q: shrineHex.q, r: shrineHex.r };
  const seaNeighbors = gameState.getMap().getHexGrid()
    .getNeighborsOfTypeByCoordinates(
      shrineCoordinates,
      'sea',
    );
  const destination = seaNeighbors[0];
  assert(destination);

  player.setShipPosition(destination.getCoordinates());
  player.oracleDice = [];
  player.oracleCards = [...COLOR_WHEEL];
  player.favor = 0;

  const shrineCell = gameState.getMap().getCell(shrineHex.getCoordinates());
  assert(shrineCell);
  uiState.setSelectedCoordinates(shrineCell.getCoordinates());
}

function getSelectedShrineHex(): ShrineHex {
  const shrineCoordinates = uiState.getSelectedCoordinates();
  assert(shrineCoordinates);
  const shrineHex = gameState.findShrineHexAt(shrineCoordinates);
  assert(shrineHex);
  return shrineHex;
}

function createExploreAction(): ExploreShrineAction {
  const shrineHex = getSelectedShrineHex();
  const shrineCell = gameState.getMap().getCell(shrineHex.getCoordinates());
  const shrineColor = shrineCell?.color;
  assert(shrineColor && shrineColor != 'none');
  uiState.setSelectedResource(Resource.createCard(shrineColor));
  uiState.setSelectedCoordinates(shrineCell.getCoordinates());
  const action: ExploreShrineAction = {
    type: 'hex',
    subType: 'exploreShrine',
    coordinates: shrineHex.getCoordinates(),
    spend: Resource.createCard(shrineColor),
  };
  return action;
}

Deno.test('GameEngineHex - available next to at least one hidden shrine', () => {
  setupNextToShrine(false, null);
  const action = createExploreAction();

  const actions = GameEngineHex.getHexActions(gameState);
  assertGreaterOrEqual(actions.length, 1, JSON.stringify(actions));
  const found = actions.filter((availableAction) => {
    return GameEngineHex.areEqualHexActions(action, availableAction);
  });
  assertEquals(found.length, 1);
});

Deno.test('GameEngineHex - available next to our visible shrine', () => {
  setupNextToShrine(true, null);
  const shrineHex = getSelectedShrineHex();
  shrineHex.status = 'visible';
  const action = createExploreAction();

  const actions = GameEngineHex.getHexActions(gameState);
  assertGreaterOrEqual(actions.length, 1, JSON.stringify(actions));
  const found = actions.filter((availableAction) => {
    return GameEngineHex.areEqualHexActions(action, availableAction);
  });
  assertEquals(found.length, 1);
});

Deno.test('GameEngineHex - doShrineExplore (ours)', () => {
  setupNextToShrine(true, null);
  const shrineHex = getSelectedShrineHex();

  const action = createExploreAction();
  const result = GameEngineHex.doAction(action, gameState, uiState);
  assert(result.success, result.message);
  assertStringIncludes(result.message, 'completed');
  assertEquals(shrineHex.status, 'filled');
  const player = gameState.getCurrentPlayer();
  const completedShrineQuests = player.getQuestsOfType('shrine').filter(
    (quest) => {
      return quest.isCompleted;
    },
  );
  assertEquals(completedShrineQuests.length, 1);
  assert(player.usedOracleCardThisTurn);
  assertEquals(player.oracleCards.length, 5);
});

Deno.test('GameEngineHex - doShrineExplore (ours already visible)', () => {
  setupNextToShrine(true, null);
  const shrineHex = getSelectedShrineHex();
  shrineHex.status = 'visible';

  const action = createExploreAction();
  const result = GameEngineHex.doAction(action, gameState, uiState);
  assert(result.success, result.message);
  assertEquals(shrineHex.status, 'filled');
  const player = gameState.getCurrentPlayer();
  const completedShrineQuests = player.getQuestsOfType('shrine').filter(
    (quest) => {
      return quest.isCompleted;
    },
  );
  assertEquals(completedShrineQuests.length, 1);
  assert(player.usedOracleCardThisTurn);
  assertEquals(player.oracleCards.length, 5);
});

Deno.test('GameEngineHex - doShrineExplore (not ours, favor)', () => {
  setupNextToShrine(false, 'favor');
  const shrineHex = getSelectedShrineHex();

  const action = createExploreAction();
  const result = GameEngineHex.doAction(action, gameState, uiState);
  assert(result.success, result.message);
  assertEquals(shrineHex.status, 'visible');
  const player = gameState.getCurrentPlayer();
  const completedShrineQuests = player.getQuestsOfType('shrine').filter(
    (quest) => {
      return quest.isCompleted;
    },
  );
  assertEquals(completedShrineQuests.length, 0);
  assertEquals(player.favor, 4);
  assert(player.usedOracleCardThisTurn);
  assertEquals(player.oracleCards.length, 5);
});

Deno.test('GameEngineHex - doShrineExplore (not ours, shield)', () => {
  setupNextToShrine(false, 'shield');
  const shrineHex = getSelectedShrineHex();

  const action = createExploreAction();
  const result = GameEngineHex.doAction(action, gameState, uiState);
  assertFailureContains(result, 'shield');
  assertFailureContains(result, 'yet');
  assertEquals(shrineHex.status, 'visible');
  const player = gameState.getCurrentPlayer();
  const completedShrineQuests = player.getQuestsOfType('shrine').filter(
    (quest) => {
      return quest.isCompleted;
    },
  );
  assertEquals(completedShrineQuests.length, 0);
  assertEquals(player.shield, 1);
  // assertEquals(player.oracleDice.length, 0);
});

Deno.test('GameEngineHex - doShrineExplore (not ours, god)', () => {
  setupNextToShrine(false, 'god');
  const shrineHex = getSelectedShrineHex();

  const action = createExploreAction();
  const result = GameEngineHex.doAction(action, gameState, uiState);
  assertFailureContains(result, 'god');
  assertFailureContains(result, 'yet');
  assertEquals(shrineHex.status, 'visible');
  const player = gameState.getCurrentPlayer();
  const completedShrineQuests = player.getQuestsOfType('shrine').filter(
    (quest) => {
      return quest.isCompleted;
    },
  );
  assertEquals(completedShrineQuests.length, 0);
  // assert 3 god coupons
  // assertEquals(player.oracleCards.length, 0);
});

Deno.test('GameEngineHex - doShrineExplore (not ours, card)', () => {
  setupNextToShrine(false, 'card');
  const shrineHex = getSelectedShrineHex();

  const action = createExploreAction();
  const result = GameEngineHex.doAction(action, gameState, uiState);
  assert(result.success, result.message);
  assertEquals(shrineHex.status, 'visible');
  const player = gameState.getCurrentPlayer();
  const completedShrineQuests = player.getQuestsOfType('shrine').filter(
    (quest) => {
      return quest.isCompleted;
    },
  );
  assertEquals(completedShrineQuests.length, 0);
  assertEquals(player.oracleCards.length, 7);
  assertEquals(player.oracleDice.length, 0);
});
