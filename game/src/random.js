// A small seeded random number generator (mulberry32). The same seed always
// deals the same dungeon, which is what makes the screenshot scenes and the
// graded runs repeatable. Nothing in the graded path reads the wall clock or
// an unseeded Math.random().
export function createRandom(seed) {
  let a = seed | 0;
  return function random() {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Pick one element of `list` with the seeded generator. */
export function pick(random, list) {
  return list[Math.floor(random() * list.length)];
}

/** Fisher–Yates shuffle in place, driven by the seeded generator. */
export function shuffle(random, list) {
  for (let i = list.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    const tmp = list[i];
    list[i] = list[j];
    list[j] = tmp;
  }
  return list;
}
