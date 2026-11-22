// Boot and the one loop: input is read every frame, the run's state is
// painted, and the renderer is told what the pointer hovers. The game moves
// between five phases — title, battle, draft, victory and defeat — all owned
// by the run in world.js; this file only routes input to the run's actions.
//
// ?seed=N fixes the dungeon's shuffles. ?shot=start|play|end (with &seed=N)
// stages that scene instead of running the loop, paints it twice and sets
// window.__shotReady for a screenshot.
import { BEST_KEY, STEP } from './config.js';
import { createRandom } from './random.js';
import { createRun, PHASE_BATTLE, PHASE_DEFEAT, PHASE_DRAFT, PHASE_TITLE, PHASE_VICTORY } from './world.js';
import { ACTION_CONFIRM, ACTION_END_TURN, createInput } from './input.js';
import { createRenderer } from './render.js';
import { stageShot } from './shots.js';

const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
const seedParam = Number.parseInt(params.get('seed') ?? '', 10);
const seed = Number.isInteger(seedParam) ? seedParam : Math.floor(Math.random() * 4294967296);

const canvas = document.getElementById('game');
const status = document.getElementById('status');
const run = createRun(createRandom(seed));
const renderer = createRenderer(canvas);
const input = createInput(canvas, renderer);
window.__runState = run.state;

function readBest() {
  try {
    return Number.parseInt(window.localStorage.getItem(BEST_KEY) ?? '0', 10) || 0;
  } catch {
    return 0;
  }
}

function saveBest(value) {
  try {
    window.localStorage.setItem(BEST_KEY, String(value));
  } catch {
    // Storage can be off (private windows): the best then lasts this visit only.
  }
}

let best = readBest();
run.state.best = best;

function recordBest() {
  const reached = run.state.phase === PHASE_VICTORY ? 5 : run.state.floor;
  if (reached > best) {
    best = reached;
    run.state.best = best;
    saveBest(best);
  }
}

function runShot(name) {
  stageShot(name, run);
  run.state.best = best;
  let painted = 0;
  function paint() {
    renderer.draw(run.state, 0);
    painted += 1;
    if (painted < 2) requestAnimationFrame(paint);
    else window.__shotReady = true;
  }
  requestAnimationFrame(paint);
}

function runGame() {
  let last = performance.now();

  function announce(message) {
    status.textContent = message;
  }

  function startRun() {
    run.startRun();
    run.state.best = best;
    announce(`Floor 1. ${run.state.enemy.name} blocks the way.`);
  }

  function handleInput() {
    const state = run.state;
    const actions = input.takeActions();
    const cardKey = input.takeCardKey();
    const click = input.takeClick();

    if (cardKey >= 0 && state.phase === PHASE_BATTLE && cardKey < state.hand.length) {
      run.playCard(cardKey);
      if (state.phase === PHASE_DEFEAT || state.phase === PHASE_VICTORY) recordBest();
      return;
    }
    if (click !== null) {
      const hit = renderer.hitTest(state, click.x, click.y);
      if (hit !== null) {
        if (hit.type === 'card' && state.phase === PHASE_BATTLE) {
          run.playCard(hit.index);
          if (state.phase === PHASE_DEFEAT || state.phase === PHASE_VICTORY) recordBest();
        } else if (hit.type === 'endTurn') {
          run.endTurn();
          if (state.phase === PHASE_DEFEAT || state.phase === PHASE_VICTORY) recordBest();
        } else if (hit.type === 'draft') {
          run.chooseDraft(hit.index);
        } else if (hit.type === 'start') {
          if (state.phase === PHASE_TITLE || state.phase === PHASE_VICTORY || state.phase === PHASE_DEFEAT) startRun();
        }
        return;
      }
    }
    if (actions & ACTION_CONFIRM) {
      if (state.phase === PHASE_TITLE || state.phase === PHASE_VICTORY || state.phase === PHASE_DEFEAT) startRun();
    } else if (actions & ACTION_END_TURN) {
      if (state.phase === PHASE_BATTLE) {
        run.endTurn();
        if (state.phase === PHASE_DEFEAT || state.phase === PHASE_VICTORY) recordBest();
      }
    }
  }

  function frame(now) {
    requestAnimationFrame(frame);
    const elapsed = Math.min((now - last) / 1000, STEP * 5);
    last = now;
    void elapsed;
    handleInput();
    renderer.draw(run.state, now);
  }

  // Leaving the tab does nothing to a turn-based game: the monster waits.
  announce('Dungeon Draft. Press Space or click to delve.');
  requestAnimationFrame(frame);
}

if (shot) runShot(shot);
else runGame();
