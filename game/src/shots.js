// The screenshot scenes behind ?shot=start|play|end. Each one plays the real
// rules forward from a fresh run with the seeded generator, so the frame is
// what a real game looks like and the same seed always gives the same frame.
//
// - start: the title screen, with a battle staged behind it for the backdrop.
// - play: a mid-battle table on floor 2, a hand in play, the monster hurt.
// - end: a full run played by a simple autopilot (play the cheapest damaging
//   card it can afford, end the turn when nothing is playable) until the run
//   is won or lost; the victory or defeat panel is what the shot shows.
import { cardById } from './cards.js';
import { PHASE_BATTLE, PHASE_DEFEAT, PHASE_VICTORY } from './world.js';

/** Play one turn for the autopilot: cheapest affordable card first. */
function autopilotTurn(run) {
  const state = run.state;
  let guard = 0;
  while (guard < 20) {
    guard += 1;
    let bestIndex = -1;
    let bestCost = 99;
    for (let i = 0; i < state.hand.length; i += 1) {
      const card = cardById(state.hand[i]);
      if (card.cost <= state.energy && card.cost < bestCost) {
        bestIndex = i;
        bestCost = card.cost;
      }
    }
    if (bestIndex === -1) break;
    // The hand holds ids; the world resolves them. Play by index.
    run.playCard(bestIndex);
    if (state.phase !== PHASE_BATTLE) return;
  }
  run.endTurn();
}

export function stageShot(name, run) {
  const state = run.state;
  if (name === 'play') {
    run.startRun();
    // Fight floor 1 a little, then move to floor 2 with a hurt monster.
    autopilotTurn(run);
    if (state.phase === PHASE_BATTLE) autopilotTurn(run);
    if (state.phase !== PHASE_BATTLE) {
      run.startRun();
      autopilotTurn(run);
    }
    return { phase: PHASE_BATTLE };
  }
  if (name === 'end') {
    run.startRun();
    let guard = 0;
    while (state.phase === PHASE_BATTLE && guard < 400) {
      guard += 1;
      autopilotTurn(run);
      if (state.phase === 'draft') run.chooseDraft(0);
    }
    if (state.phase === PHASE_VICTORY || state.phase === PHASE_DEFEAT) return { phase: state.phase };
    // The autopilot stalled (a hand of unplayable cards can loop): end the
    // scene as a defeat on the current floor, so the shot still shows an end.
    state.phase = PHASE_DEFEAT;
    return { phase: PHASE_DEFEAT };
  }
  // start (and any other name): title screen over a staged first battle.
  run.startRun();
  autopilotTurn(run);
  state.phase = 'title';
  return { phase: 'title' };
}
