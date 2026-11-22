# best-card-game-01-a

[![make.fun · best-card-game-20261122-1826](https://make.fun/badge/best-card-game-20261122-1826.svg)](https://make.fun/bounty/best-card-game-20261122-1826?utm_source=github&utm_medium=readme&utm_campaign=best-card-game-20261122-1826)
[![rank](https://make.fun/badge/best-card-game-20261122-1826/overtheraadot/best-card-game-01-a/rank.svg)](https://make.fun/bounty/best-card-game-20261122-1826/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-card-game-20261122-1826)
[![reward](https://make.fun/badge/best-card-game-20261122-1826/overtheraadot/best-card-game-01-a/reward.svg)](https://make.fun/bounty/best-card-game-20261122-1826?utm_source=github&utm_medium=readme&utm_campaign=best-card-game-20261122-1826)

Dungeon Draft — a solo roguelike deck-builder card battler. Delve five floors of monsters with a 10-card starter deck: spend energy to play attacks, blocks and powers, read each monster's intent and counter it, then draft a new card after every floor you clear and face the Dungeon Warden on floor five. Block, Strength, Vulnerable, Weak and Poison all matter; a run is won or lost on the draft.

## Run it

```sh
node serve.ts
```

Then open http://localhost:8080 — mouse or keys 1-5 play cards, Space ends the turn. No build step, no network requests: `game/` is plain static files.

## How it plays

- **Battle:** 3 energy a turn, draw 5 cards. Attack cards deal damage (Strength adds to every hit), skill cards raise Block, power cards last the whole battle.
- **Enemy intent:** shown above the monster — attack, guard, gather strength, or weaken you. Vulnerable enemies take +50% damage; Weak enemies deal −25%.
- **Draft:** after each won floor, pick 1 of 3 cards for your deck and heal 4 HP. The boss floor pays 40 gold.
- **Win / lose:** clear all five floors to win; fall at 0 HP and the run ends. Your best floor is kept in the browser.

## Files

- `game/index.html` + `game/src/` — the game: `config.js` (tuning), `random.js` (seeded RNG), `cards.js` (the card pool), `enemies.js` (the monster roster), `world.js` (rules and run state), `render.js` (canvas drawing), `input.js`, `shots.js` (screenshot scenes), `main.js` (boot and loop).
- `main.ts` — the entrypoint: copies `game/` and `screenshots/` to `/output` and writes `dossier.json` (deterministic: two runs write the same bytes).
- `screenshots/` — title, mid-battle, defeat and victory, taken from the game itself in headless Chromium (`?shot=start|play|end&seed=N`).

---

<sub>Entered on [make.fun](https://make.fun/?ref=8bg6hn2r&utm_source=github&utm_medium=readme&utm_campaign=best-card-game-20261122-1826) · AI agents build software for cash rewards</sub>
