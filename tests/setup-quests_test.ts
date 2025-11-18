import { assert } from '@std/assert';
import { assertEquals } from '@std/assert/equals';
import { assertFalse } from '@std/assert/false';
import { GameEngine } from '../src/game-engine-core.ts';
import type { HexColor } from '../src/types.ts';

Deno.test('Quests - Each player has 12 quests, not yet completed', () => {
  const engine = new GameEngine();
  engine.initializeGame();
  const state = engine.getGameState();

  state.players.forEach((player) => {
    const quests = player.getQuests();
    assertEquals(quests.length, 12, 'Not exactly 12 quests?');
    quests.forEach((quest) => {
      assertFalse(quest.isCompleted, 'Already completed?');
    });
  });
});

Deno.test('Quests - Each player has 3 shrine quests', () => {
  const engine = new GameEngine();
  engine.initializeGame();
  const state = engine.getGameState();

  state.players.forEach((player) => {
    const matchingQuests = player.getQuests().filter((quest) => {
      return quest.type === 'shrine';
    });
    assertEquals(matchingQuests.length, 3, 'Not 3 shrine quests?');

    matchingQuests.forEach((quest) => {
      assertEquals(quest.playerId, player.id, 'Wrong owner?');
      assertEquals(quest.color, 'none', 'Has a color?');
    });
  });
});

Deno.test('Quests - Each player has 3 statue quests', () => {
  const engine = new GameEngine();
  engine.initializeGame();
  const state = engine.getGameState();

  state.players.forEach((player) => {
    const matchingQuests = player.getQuests().filter((quest) => {
      return quest.type === 'statue';
    });
    assertEquals(matchingQuests.length, 3, 'Not 3 statue quests?');

    matchingQuests.forEach((quest) => {
      assertEquals(quest.playerId, player.id, 'Wrong owner?');
      assertEquals(quest.color, 'none', 'Has a color?');
    });
  });
});

Deno.test('Quests = Each player has 3 temple quests', () => {
  const engine = new GameEngine();
  engine.initializeGame();
  const state = engine.getGameState();

  const colorsAcrossPlayers: Set<HexColor> = new Set();
  state.players.forEach((player) => {
    const matchingQuests = player.getQuests().filter((quest) => {
      return quest.type === 'temple';
    });
    assertEquals(matchingQuests.length, 3, 'Not 3 temple quests?');

    const colorsForThisPlayer: Set<HexColor> = new Set();
    matchingQuests.forEach((quest) => {
      assertEquals(quest.playerId, player.id, 'Wrong owner?');
      colorsForThisPlayer.add(quest.color);
      colorsAcrossPlayers.add(quest.color);
    });
    assertEquals(colorsForThisPlayer.size, 3, 'Player does not have 3 colors?');
    assert(
      colorsForThisPlayer.has('none'),
      'Player missing the uncolored quest?',
    );
  });
  assertEquals(
    colorsAcrossPlayers.size,
    3,
    'Every player should have the same 3 colors',
  );
});

Deno.test('Quests = Each player has 3 monster quests', () => {
  const engine = new GameEngine();
  engine.initializeGame();
  const state = engine.getGameState();

  const colorsAcrossPlayers: Set<HexColor> = new Set();
  state.players.forEach((player) => {
    const matchingQuests = player.getQuests().filter((quest) => {
      return quest.type === 'monster';
    });
    assertEquals(matchingQuests.length, 3, 'Not 3 monster quests?');

    const colorsForThisPlayer: Set<HexColor> = new Set();
    matchingQuests.forEach((quest) => {
      assertEquals(quest.playerId, player.id, 'Wrong owner?');
      colorsForThisPlayer.add(quest.color);
      colorsAcrossPlayers.add(quest.color);
    });
    assertEquals(colorsForThisPlayer.size, 3, 'Player does not have 3 colors?');
    assert(
      colorsForThisPlayer.has('none'),
      'Player missing the uncolored quest?',
    );
  });
  assertEquals(
    colorsAcrossPlayers.size,
    3,
    'Every player should have the same 3 colors',
  );
});

Deno.test('Quest - monster and temple quest colors should not overlap', () => {
  const engine = new GameEngine();
  engine.initializeGame();
  const state = engine.getGameState();

  const colorsAcrossPlayers: Set<HexColor> = new Set();
  state.players.forEach((player) => {
    const templeQuests = player.getQuests().filter((quest) => {
      return quest.type === 'temple';
    });
    templeQuests.forEach((quest) => {
      colorsAcrossPlayers.add(quest.color);
    });
    const monsterQuests = player.getQuests().filter((quest) => {
      return quest.type === 'monster';
    });
    monsterQuests.forEach((quest) => {
      colorsAcrossPlayers.add(quest.color);
    });
  });
  assertEquals(
    colorsAcrossPlayers.size,
    5,
    'Not exactly 2 temple colors and 2 monster colors',
  );
  assert(colorsAcrossPlayers.has('none'), 'Missing the uncolored quests?');
});
