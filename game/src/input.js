// Keyboard and pointer input. Clicks are resolved by the renderer's hit
// test, so input never repeats the layout math. Keys 1-9 play hand cards,
// Space or Enter confirms (start, end turn), P also ends the turn.
export const ACTION_CONFIRM = 1;
export const ACTION_END_TURN = 2;

const CONFIRM = new Set(['Space', 'Enter']);
const END_TURN_KEYS = new Set(['KeyE', 'KeyP']);

export function createInput(canvas, renderer) {
  let actions = 0;
  let cardKey = -1;
  let click = null;

  window.addEventListener('keydown', (event) => {
    if (event.repeat) return;
    if (CONFIRM.has(event.code)) actions |= ACTION_CONFIRM;
    else if (END_TURN_KEYS.has(event.code)) actions |= ACTION_END_TURN;
    else if (event.code.startsWith('Digit')) {
      const n = Number(event.code.slice(5));
      if (n >= 1 && n <= 9) cardKey = n - 1;
    } else return;
    event.preventDefault();
  });

  canvas.addEventListener('pointermove', (event) => {
    const point = renderer.toLogical(event.clientX, event.clientY);
    renderer.hover(window.__runState, point.x, point.y);
  });
  canvas.addEventListener('pointerdown', (event) => {
    const point = renderer.toLogical(event.clientX, event.clientY);
    click = point;
    if (window.__runState && window.__runState.phase === 'title') actions |= ACTION_CONFIRM;
  });

  return {
    /** The one-shot presses since the last call, as ACTION_* flags. */
    takeActions() {
      const taken = actions;
      actions = 0;
      return taken;
    },
    /** The hand index a number key asked to play, or -1. */
    takeCardKey() {
      const taken = cardKey;
      cardKey = -1;
      return taken;
    },
    /** The last pointer-down point in table coordinates, or null. */
    takeClick() {
      const taken = click;
      click = null;
      return taken;
    },
  };
}
