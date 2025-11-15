== Short-term ==

- Use GameEngine.moveShip for card movement
- Need to get all the map navigation in one place

== Oracle cards ==

- action: spend oracle card
  - Should be able to recolor a card
  - Selecting die should clear selected card and vice versa
  - Ideally sort cards by color
  - Ideally only highlight the actual selected die/card
  - Ideally unselect (clear) a die/card by clicking it again

== Other ==

- Remove the "how to play" contents from the setup page
- Remove console output from tests

== Quests ==

- Temples
  - setup: correct cube quests
  - action: cube pickup (slot open, not a repeat color)
  - This will be the first quest completion
- Statues
  - action: statue pickup (slot open, not a repeat color)
  - action: temple dropoff
  - setup: foundations
  - action: foundations dropoff
- Clouds
  - setup: clouds
  - action: cloud flip (success)
  - action: cloud flip (consolation prize)
- Monsters
  - setup: correct monster quests
  - action: monster fight

== Game end ==

- effect: ability to move to zeus after 12 quests completed
- round: detect end of game and determine winner

== Peek ==

- action: peek at up to 2 cloud tiles

== Wounds ==

- setup: initial wound
- action: spend a die to heal
- round: end of round, roll attack die
- turn: if too wounded, skip and heal

== Gods ==

- setup: gods
- action: spend a die to advance god
- free: god effects (new task for each specific god)

== Equipment ==

- setup: equipment
- reward: equipment
- free: equipment one-time gains (new task for each specific type)
- effect: equipment ongoing (new task for each specific type)

== Companions ==

- setup: companion deck
- reward: gain companion (non-functional)
- effect: companion +move
- effect: companion -wounds
- effect: companion wild color

== Ships ==

- setup: ships (new task for each specific ship)
