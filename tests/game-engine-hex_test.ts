import { assert, assertGreaterOrEqual } from '@std/assert';
import { assertEquals } from '@std/assert/equals';
import type {
  DropCubeAction,
  ExploreShrineAction,
  LoadCubeAction,
} from '../src/actions.ts';
import { GameEngineHex } from '../src/GameEngineHex.ts';
import { GameState } from '../src/GameState.ts';
import { GameStateInitializer } from '../src/GameStateInitializer.ts';
import { Resource } from '../src/Resource.ts';
import { COLOR_WHEEL, type Item } from '../src/types.ts';
import { UiStateClass } from '../src/UiState.ts';
import { assertFailureContains } from './test-helpers.ts';

Deno.test('GameEngineHex - available wrong phase', () => {
  const gameState = new GameState();
  new GameStateInitializer().initializeGameState(gameState);

  const actions = GameEngineHex.getHexActions(gameState);
  assertEquals(actions.length, 0);
});

Deno.test('GameEngineHex - available at zeus', () => {
  const gameState = new GameState();
  new GameStateInitializer().initializeGameState(gameState);

  const actions = GameEngineHex.getHexActions(gameState);
  assertEquals(actions.length, 0);
});

Deno.test('GameEngineHex - available next to at least one hidden shrine', () => {
  const gameState = new GameState();
  new GameStateInitializer().initializeGameState(gameState);
  const player = gameState.getCurrentPlayer();
  const shrineHex = gameState.getShrineHexes()[0];
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
  player.oracleDice = [...COLOR_WHEEL];
  player.favor = 0;

  const actions = GameEngineHex.getHexActions(gameState);
  assertGreaterOrEqual(actions.length, 1, JSON.stringify(actions));
  const action = actions.find((action) => {
    return action.type === 'hex' && action.subType === 'exploreShrine' &&
      action.coordinates.q === shrineHex.q &&
      action.coordinates.r === shrineHex.r;
  });
  assert(action);
  assert(action.type === 'hex');
  assert(action.subType === 'exploreShrine');
  assert(
    action.coordinates.q === shrineHex.q &&
      action.coordinates.r === shrineHex.r,
  );
  assert(action.spend.isDie());
});

Deno.test('GameEngineHex - available next to at least one hidden shrine', () => {
  const gameState = new GameState();
  new GameStateInitializer().initializeGameState(gameState);
  const player = gameState.getCurrentPlayer();
  const shrineHex = gameState.getShrineHexes()[0];
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
  player.oracleDice = [...COLOR_WHEEL];
  player.favor = 0;

  const actions = GameEngineHex.getHexActions(gameState);
  assertGreaterOrEqual(actions.length, 1, JSON.stringify(actions));
  const action = actions.find((action) => {
    return action.type === 'hex' && action.subType === 'exploreShrine' &&
      action.coordinates.q === shrineHex.q &&
      action.coordinates.r === shrineHex.r;
  });
  assert(action);
  assert(action.type === 'hex');
  assert(action.subType === 'exploreShrine');
  assert(
    action.coordinates.q === shrineHex.q &&
      action.coordinates.r === shrineHex.r,
  );
  assert(action.spend.isDie());
});

Deno.test('GameEngineHex - available next to our visible shrine', () => {
  const gameState = new GameState();
  new GameStateInitializer().initializeGameState(gameState);
  const player = gameState.getCurrentPlayer();
  const shrineHex = gameState.getShrineHexes().find((hex) => {
    return hex.owner === player.color;
  });
  assert(shrineHex);
  shrineHex.status = 'visible';
  const shrineCoordinates = { q: shrineHex.q, r: shrineHex.r };
  const seaNeighbors = gameState.getMap().getHexGrid()
    .getNeighborsOfTypeByCoordinates(
      shrineCoordinates,
      'sea',
    );
  const destination = seaNeighbors[0];
  assert(destination);
  player.setShipPosition(destination.getCoordinates());
  player.oracleDice = [...COLOR_WHEEL];
  player.favor = 0;

  const actions = GameEngineHex.getHexActions(gameState);
  assertGreaterOrEqual(actions.length, 1, JSON.stringify(actions));
  const action = actions.find((action) => {
    return action.type === 'hex' && action.subType === 'exploreShrine' &&
      action.coordinates.q === shrineHex.q &&
      action.coordinates.r === shrineHex.r;
  });
  assert(action);
  assert(action.type === 'hex');
  assert(action.subType === 'exploreShrine');
  assert(
    action.coordinates.q === shrineHex.q &&
      action.coordinates.r === shrineHex.r,
  );
  assert(action.spend.isDie());
});

Deno.test('GameEngineHex - available next to needed cubes', () => {
  const gameState = new GameState();
  new GameStateInitializer().initializeGameState(gameState);
  const player = gameState.getCurrentPlayer();
  const offeringHex = gameState.getCubeHexes()[0];
  assert(offeringHex);
  const offeringCoordinates = { q: offeringHex.q, r: offeringHex.r };
  const seaNeighbors = gameState.getMap().getHexGrid()
    .getNeighborsOfTypeByCoordinates(
      offeringCoordinates,
      'sea',
    );
  const destination = seaNeighbors[0];
  assert(destination);
  player.setShipPosition(destination.getCoordinates());
  player.oracleDice = [...COLOR_WHEEL];
  player.favor = 0;

  const actions = GameEngineHex.getHexActions(gameState);
  assertGreaterOrEqual(actions.length, 2, JSON.stringify(actions));
  const action = actions.find((action) => {
    return action.type === 'hex' && action.subType === 'loadCube' &&
      action.coordinates.q === offeringHex.q &&
      action.coordinates.r === offeringHex.r;
  });
  assert(action);
  assert(action.type === 'hex');
  assert(action.subType === 'loadCube');
  assert(
    action.coordinates.q === offeringHex.q &&
      action.coordinates.r === offeringHex.r,
  );
  assert(action.spend.isDie());
});

Deno.test('GameEngineHex -available next to useful temple', () => {
  const gameState = new GameState();
  new GameStateInitializer().initializeGameState(gameState);
  const player = gameState.getCurrentPlayer();
  const templeHex = gameState.getMap().getCellsByTerrain('temple')[0];
  assert(templeHex);
  const templeColor = templeHex.color;
  assert(templeColor !== 'none');
  const templeCoordinates = { q: templeHex.q, r: templeHex.r };
  const seaNeighbors = gameState.getMap().getHexGrid()
    .getNeighborsOfTypeByCoordinates(
      templeCoordinates,
      'sea',
    );
  const destination = seaNeighbors[0];
  assert(destination);
  player.setShipPosition(destination.getCoordinates());
  player.oracleDice = [...COLOR_WHEEL];
  player.favor = 0;
  const cube: Item = { type: 'cube', color: templeColor };
  const loaded = player.loadItem(cube);
  assert(loaded.success, loaded.message);

  const actions = GameEngineHex.getHexActions(gameState);
  assertGreaterOrEqual(actions.length, 1, JSON.stringify(actions));
  const action = actions.find((action) => {
    return action.type === 'hex' && action.subType === 'dropCube' &&
      action.coordinates.q === templeHex.q &&
      action.coordinates.r === templeHex.r;
  });
  assert(action);
  assert(action.type === 'hex');
  assert(action.subType === 'dropCube');
  assert(
    action.coordinates.q === templeHex.q &&
      action.coordinates.r === templeHex.r,
  );
  assert(action.spend.isDie());
});

Deno.test('GameEngineHex - doShrineExplore (ours)', () => {
  const gameState = new GameState();
  new GameStateInitializer().initializeGameState(gameState);
  const uiState = new UiStateClass();
  const player = gameState.getCurrentPlayer();
  const shrineHex = gameState.getShrineHexes().find((hex) => {
    return hex.owner === player.color;
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
  const shrineCell = gameState.getMap().getCell(shrineCoordinates);
  assert(shrineCell);
  const shrineColor = shrineCell.color;
  assert(shrineColor !== 'none');
  player.setShipPosition(destination.getCoordinates());
  player.oracleDice = [shrineColor];
  player.favor = 0;
  uiState.setSelectedResource(Resource.createDie(shrineColor));
  uiState.setSelectedCoordinates(shrineCell.getCoordinates());

  const action: ExploreShrineAction = {
    type: 'hex',
    subType: 'exploreShrine',
    coordinates: shrineCoordinates,
    spend: Resource.createDie(shrineColor),
  };
  const result = GameEngineHex.doAction(action, gameState, uiState);
  assert(result.success, result.message);
  assertEquals(shrineHex.status, 'filled');
  const completedShrineQuests = player.getQuestsOfType('shrine').filter(
    (quest) => {
      return quest.isCompleted;
    },
  );
  assertEquals(completedShrineQuests.length, 1);
  assertEquals(player.oracleDice.length, 0);
});

Deno.test('GameEngineHex - doShrineExplore (ours already visible)', () => {
  const gameState = new GameState();
  new GameStateInitializer().initializeGameState(gameState);
  const uiState = new UiStateClass();
  const player = gameState.getCurrentPlayer();
  const shrineHex = gameState.getShrineHexes().find((hex) => {
    return hex.owner === player.color;
  });
  assert(shrineHex);
  shrineHex.status = 'visible';
  const shrineCoordinates = { q: shrineHex.q, r: shrineHex.r };
  const seaNeighbors = gameState.getMap().getHexGrid()
    .getNeighborsOfTypeByCoordinates(
      shrineCoordinates,
      'sea',
    );
  const destination = seaNeighbors[0];
  assert(destination);
  const shrineCell = gameState.getMap().getCell(shrineCoordinates);
  assert(shrineCell);
  const shrineColor = shrineCell.color;
  assert(shrineColor !== 'none');
  player.setShipPosition(destination.getCoordinates());
  player.oracleDice = [shrineColor];
  player.favor = 0;
  uiState.setSelectedResource(Resource.createDie(shrineColor));
  uiState.setSelectedCoordinates(shrineCell.getCoordinates());

  const action: ExploreShrineAction = {
    type: 'hex',
    subType: 'exploreShrine',
    coordinates: shrineCoordinates,
    spend: Resource.createDie(shrineColor),
  };
  const result = GameEngineHex.doAction(action, gameState, uiState);
  assert(result.success, result.message);
  assertEquals(shrineHex.status, 'filled');
  const completedShrineQuests = player.getQuestsOfType('shrine').filter(
    (quest) => {
      return quest.isCompleted;
    },
  );
  assertEquals(completedShrineQuests.length, 1);
  assertEquals(player.oracleDice.length, 0);
});

Deno.test('GameEngineHex - doShrineExplore (not ours, favor)', () => {
  const gameState = new GameState();
  new GameStateInitializer().initializeGameState(gameState);
  const uiState = new UiStateClass();
  const player = gameState.getCurrentPlayer();
  const shrineHex = gameState.getShrineHexes().find((hex) => {
    return hex.owner !== player.color && hex.reward === 'favor';
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
  const shrineCell = gameState.getMap().getCell(shrineCoordinates);
  assert(shrineCell);
  const shrineColor = shrineCell.color;
  assert(shrineColor !== 'none');
  player.setShipPosition(destination.getCoordinates());
  player.oracleDice = [shrineColor];
  player.favor = 0;
  uiState.setSelectedResource(Resource.createDie(shrineColor));
  uiState.setSelectedCoordinates(shrineCell.getCoordinates());

  const action: ExploreShrineAction = {
    type: 'hex',
    subType: 'exploreShrine',
    coordinates: shrineCoordinates,
    spend: Resource.createDie(shrineColor),
  };
  const result = GameEngineHex.doAction(action, gameState, uiState);
  assert(result.success, result.message);
  assertEquals(shrineHex.status, 'visible');
  const completedShrineQuests = player.getQuestsOfType('shrine').filter(
    (quest) => {
      return quest.isCompleted;
    },
  );
  assertEquals(completedShrineQuests.length, 0);
  assertEquals(player.favor, 4);
  assertEquals(player.oracleDice.length, 0);
});

Deno.test('GameEngineHex - doShrineExplore (not ours, shield)', () => {
  const gameState = new GameState();
  new GameStateInitializer().initializeGameState(gameState);
  const uiState = new UiStateClass();
  const player = gameState.getCurrentPlayer();
  const shrineHex = gameState.getShrineHexes().find((hex) => {
    return hex.owner !== player.color && hex.reward === 'shield';
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
  const shrineCell = gameState.getMap().getCell(shrineCoordinates);
  assert(shrineCell);
  const shrineColor = shrineCell.color;
  assert(shrineColor !== 'none');
  player.setShipPosition(destination.getCoordinates());
  player.oracleDice = [shrineColor];
  player.favor = 0;
  uiState.setSelectedResource(Resource.createDie(shrineColor));
  uiState.setSelectedCoordinates(shrineCell.getCoordinates());

  const action: ExploreShrineAction = {
    type: 'hex',
    subType: 'exploreShrine',
    coordinates: shrineCoordinates,
    spend: Resource.createDie(shrineColor),
  };
  const result = GameEngineHex.doAction(action, gameState, uiState);
  assertFailureContains(result, 'shield');
  assertFailureContains(result, 'yet');
  assertEquals(shrineHex.status, 'visible');
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
  const gameState = new GameState();
  new GameStateInitializer().initializeGameState(gameState);
  const uiState = new UiStateClass();
  const player = gameState.getCurrentPlayer();
  const shrineHex = gameState.getShrineHexes().find((hex) => {
    return hex.owner !== player.color && hex.reward === 'god';
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
  const shrineCell = gameState.getMap().getCell(shrineCoordinates);
  assert(shrineCell);
  const shrineColor = shrineCell.color;
  assert(shrineColor !== 'none');
  player.setShipPosition(destination.getCoordinates());
  player.oracleDice = [shrineColor];
  player.favor = 0;
  uiState.setSelectedResource(Resource.createDie(shrineColor));
  uiState.setSelectedCoordinates(shrineCell.getCoordinates());

  const action: ExploreShrineAction = {
    type: 'hex',
    subType: 'exploreShrine',
    coordinates: shrineCoordinates,
    spend: Resource.createDie(shrineColor),
  };
  const result = GameEngineHex.doAction(action, gameState, uiState);
  assertFailureContains(result, 'god');
  assertFailureContains(result, 'yet');
  assertEquals(shrineHex.status, 'visible');
  const completedShrineQuests = player.getQuestsOfType('shrine').filter(
    (quest) => {
      return quest.isCompleted;
    },
  );
  assertEquals(completedShrineQuests.length, 0);
  // assert 3 god coupons
  // assertEquals(player.oracleDice.length, 0);
});

Deno.test('GameEngineHex - doShrineExplore (not ours, card)', () => {
  const gameState = new GameState();
  new GameStateInitializer().initializeGameState(gameState);
  const uiState = new UiStateClass();
  const player = gameState.getCurrentPlayer();
  const shrineHex = gameState.getShrineHexes().find((hex) => {
    return hex.owner !== player.color && hex.reward === 'card';
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
  const shrineCell = gameState.getMap().getCell(shrineCoordinates);
  assert(shrineCell);
  const shrineColor = shrineCell.color;
  assert(shrineColor !== 'none');
  player.setShipPosition(destination.getCoordinates());
  player.oracleDice = [shrineColor];
  player.favor = 0;
  uiState.setSelectedResource(Resource.createDie(shrineColor));
  uiState.setSelectedCoordinates(shrineCell.getCoordinates());

  const action: ExploreShrineAction = {
    type: 'hex',
    subType: 'exploreShrine',
    coordinates: shrineCoordinates,
    spend: Resource.createDie(shrineColor),
  };
  const result = GameEngineHex.doAction(action, gameState, uiState);
  assert(result.success, result.message);
  assertEquals(shrineHex.status, 'visible');
  const completedShrineQuests = player.getQuestsOfType('shrine').filter(
    (quest) => {
      return quest.isCompleted;
    },
  );
  assertEquals(completedShrineQuests.length, 0);
  assertEquals(player.oracleCards.length, 2);
  assertEquals(player.oracleDice.length, 0);
});

Deno.test('GameEngineHex - doOfferingAction (existing quest)', () => {
  const gameState = new GameState();
  new GameStateInitializer().initializeGameState(gameState);
  const uiState = new UiStateClass();
  const player = gameState.getCurrentPlayer();
  const colorQuest = player.getQuestsOfType('temple').find((quest) => {
    return quest.color !== 'none';
  });
  const needColor = colorQuest?.color;
  assert(needColor);
  assert(needColor !== 'none');
  const offeringHex = gameState.getCubeHexes().find((hex) => {
    return hex.cubeColors.indexOf(needColor) >= 0;
  });
  assert(offeringHex);
  const cubeCount = offeringHex.cubeColors.length;
  const offeringCoordinates = { q: offeringHex.q, r: offeringHex.r };
  const seaNeighbors = gameState.getMap().getHexGrid()
    .getNeighborsOfTypeByCoordinates(
      offeringCoordinates,
      'sea',
    );
  const destination = seaNeighbors[0];
  assert(destination);
  player.setShipPosition(destination.getCoordinates());
  player.oracleDice = [needColor];
  player.favor = 0;
  const spend = Resource.createDie(needColor);
  uiState.setSelectedResource(spend);
  uiState.setSelectedCoordinates(offeringCoordinates);

  const action: LoadCubeAction = {
    type: 'hex',
    subType: 'loadCube',
    coordinates: offeringCoordinates,
    spend: Resource.createDie(needColor),
  };
  const result = GameEngineHex.doAction(action, gameState, uiState);
  assert(result.success, result.message);
  assertEquals(player.getItemCount(), 1);
  assertEquals(offeringHex.cubeColors.length, cubeCount - 1);
  assertEquals(player.oracleDice.length, 0);
  const wildQuest = player.getQuestsOfType('temple').find((quest) => {
    return quest.color === 'none';
  });
  assert(
    wildQuest,
    'Cube should have been used for its quest, not for the wild',
  );
});

Deno.test('GameEngineHex - doOfferingAction (wild quest)', () => {
  const gameState = new GameState();
  new GameStateInitializer().initializeGameState(gameState);
  const uiState = new UiStateClass();
  const player = gameState.getCurrentPlayer();
  const needColor = 'green';
  const offeringHex = gameState.getCubeHexes().find((hex) => {
    return hex.cubeColors.indexOf(needColor) >= 0;
  });
  assert(offeringHex);
  const cubeCount = offeringHex.cubeColors.length;
  const offeringCoordinates = { q: offeringHex.q, r: offeringHex.r };
  const seaNeighbors = gameState.getMap().getHexGrid()
    .getNeighborsOfTypeByCoordinates(
      offeringCoordinates,
      'sea',
    );
  const destination = seaNeighbors[0];
  assert(destination);
  player.setShipPosition(destination.getCoordinates());
  player.oracleDice = [needColor];
  player.favor = 0;
  const spend = Resource.createDie(needColor);
  uiState.setSelectedResource(spend);
  uiState.setSelectedCoordinates(offeringCoordinates);

  const action: LoadCubeAction = {
    type: 'hex',
    subType: 'loadCube',
    coordinates: offeringCoordinates,
    spend: Resource.createDie(needColor),
  };
  const result = GameEngineHex.doAction(action, gameState, uiState);
  assert(result.success, result.message);
  assertEquals(player.getItemCount(), 1);
  assertEquals(offeringHex.cubeColors.length, cubeCount - 1);
  assertEquals(player.oracleDice.length, 0);
  const greenQuest = player.getQuestsOfType('temple').find((quest) => {
    return quest.color === 'green';
  });
  assert(
    greenQuest,
    'Cube should have been used for the wild quest',
  );
});

Deno.test('GameEngineHex - doTempleAction', () => {
  const gameState = new GameState();
  new GameStateInitializer().initializeGameState(gameState);
  const uiState = new UiStateClass();
  const player = gameState.getCurrentPlayer();
  const quest = player.getQuestsOfType('temple').find((quest) => {
    return quest.color !== 'none';
  });
  assert(quest && !quest.isCompleted);
  const color = quest.color;
  assert(color !== 'none');
  const templeCell = gameState.getMap().getCellsByTerrain('temple').find(
    (cell) => {
      return cell.color === color;
    },
  );
  assert(templeCell);
  const templeLocation = templeCell.getCoordinates();
  const seaNeighbors = gameState.getMap().getHexGrid()
    .getNeighborsOfTypeByCoordinates(
      templeLocation,
      'sea',
    );
  const destination = seaNeighbors[0];
  assert(destination);
  player.setShipPosition(destination.getCoordinates());
  player.oracleDice = [color];
  player.favor = 0;
  const item: Item = { type: 'cube', color };
  player.loadItem(item);
  const resource = Resource.createDie(color);
  uiState.setSelectedResource(resource);
  uiState.setSelectedCoordinates(templeLocation);

  const action: DropCubeAction = {
    type: 'hex',
    subType: 'dropCube',
    coordinates: templeLocation,
    spend: resource,
  };
  const result = GameEngineHex.doAction(action, gameState, uiState);
  assert(result.success, result.message);
  assert(quest.isCompleted);
  assertEquals(player.favor, 3);
  assertEquals(player.getItemCount(), 0);
  assertEquals(player.oracleDice.length, 0);
});
