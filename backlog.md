== Short-term ==

- action: spend a die to advance god

== Cosmetic/Usability ==

- Clicking on a shrine with shield reward doesn't update the display immediately
  - Working as intended, since no other failure causes a re-rendering
  - When it is working, and returns success, it will redraw
- Can't click on anything on a hex (icon, cubes, monsters)
- Make monster triangles larger
- Make statue bar taller
- Move city icon down slightly
- Display icons for quests:
  - Temple offering 🛕 🫴
  - Statue 🪦 ⛏️ ⛲ 🗿
  - Monster 💀 ⚔️
  - Shrine ☁️ ⛩️
- Display symbols for accessibility: ➰🌀♨️🔆🌱🌸
  - Black: Cloverleaf 🔲🔳 🌢 ➰ ⧇ ⬟ ⧉ ▣ ▩
  - Blue: @ 🌀
  - Red: Bell U 💢 📛 ♨️
  - Pink: 8 / infinity / hourglass ∞ ⌛ Ꝏ 🌸 🩷
  - Yellow: * 🔆
  - Green: Leaf 🌱
- Ideally sort cards by color
- Ideally only highlight the actual selected die/card
- Ideally unselect (clear) a die/card by clicking it again

== Features/bugs ==

- Allow spending more than 5 favor to extend move range
- Cache all distances to avoid repeated BFS searches
  - For each sea cell, have an array for each core color
  - Each color array would hold a map of destination coordinates -> distance
  - Could do something similar for equipment that allows cubes/statues not
    adjacent

== Code improvement ==

- Put all the map navigation in one place
- Should ship loading rules enforcement all be in one place?
  - Currently, duplicate and full ship are in player, but
  - No valid quest is in GameEngineHex

== Quests ==

- Monsters
  - Should roll dice during battle

== Round end/Game end ==

- effect: free god advance for other players' rolls
- effect: ability to move to zeus after 12 quests completed
- round: detect end of game and determine winner

== Peek ==

- action: peek at up to 2 shrine tiles

== Injuries ==

- setup: initial injury
- action: spend a die to heal
- round: end of round, roll Titan die
- turn: if too many injuries, skip and heal
- During fight, bad roll causes injury
- Shrine quest reward: Heal injuries
  - Any reason not to pick random color from among "most"?

== Gods ==

- Shrine reward: God advance
- free: god effects:
  - effect: Fully heal
  - effect: Teleport
  - effect: Defeat (adjacent) monster
  - effect: Superturn
  - effect: Grab non-adjacent statue (when adjacent to a city)
  - effect: Flip any face-down shrine

== Equipment ==

- setup: equipment
- reward for raising statue: equipment coupon
- free action: spend coupon to gain equipment
- free: equipment one-time gains (new task for each specific type)
  - effect: get gain statue coupon
  - effect: get gain cube coupon
  - effect: advance any god to top (coupon)
  - effect: peek under 2 face-down shrines; flip one and take reward (coupon)
  - effect: +3 favor & +oracle card & 2 god advance coupons
- effect: equipment ongoing (new task for each specific type)
  - stat: +1 range
  - stat: +1 storage
  - stat: injury limit 8 & 4-same
  - ability: skip over shallows
  - ability: monster/shrine from 1 space away
  - ability: statue load/drop from 1 space away
  - ability: cube load/drop from 1 space away
  - trigger: temple/statue/monster -> 1 god advance
  - trigger (color): rolling a die matching this color -> +2 favor
  - trigger (color): spend die -> +1 oracle card & +1 favor & +1 god advance
    coupon
  - free: 1x/turn, spend 3 favor to gain a wild action

== Companions ==

- setup: companion deck
- Reward for defeating monster: gain companion coupon
- Free action: spend coupon to gain companion
- Companion effects:
  - effect range: color -> +3 range and land on any color
  - effect wounds: +2 shield and color -> discard and ignore all wounds
  - effect wild: gain oracle card and color -> wild

== Ships ==

- setup: ships (new task for each specific ship)
  - +2 range
  - +2 shield
  - gain favor get +1
  - recoloring cost -1
  - +2 storage and recolor either direction
  - effect: start gods higher
  - setup: gain 1 oracle card and 1 equipment coupon
  - setup: remove 1 quest from the game
