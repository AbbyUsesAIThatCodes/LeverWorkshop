// An ideal lever: equal practice units, a weightless beam, and a free pivot.
export const POSITIONS = [-4, -3, -2, -1, 0, 1, 2, 3, 4];
export const PIVOTS = [-2, -1, 0, 1, 2];
export const WEIGHTS = [1, 2, 3];
export const TYPES = ["weight", "distance", "pivot", "mix"];
export function valid(s) {
  return (
    WEIGHTS.includes(s.leftMass) &&
    WEIGHTS.includes(s.rightMass) &&
    POSITIONS.includes(s.leftPos) &&
    POSITIONS.includes(s.rightPos) &&
    PIVOTS.includes(s.pivot) &&
    s.leftPos < s.pivot &&
    s.rightPos > s.pivot
  );
}
export function outcome(s) {
  if (!valid(s)) throw new RangeError("Invalid lever arrangement");
  const left = s.leftMass * (s.pivot - s.leftPos),
    right = s.rightMass * (s.rightPos - s.pivot);
  return left === right ? "balance" : left > right ? "left" : "right";
}
export function allowedFields(type) {
  return (
    {
      weight: ["rightMass"],
      distance: ["rightPos"],
      pivot: ["pivot"],
      mix: ["leftMass", "rightMass", "leftPos", "rightPos", "pivot"],
    }[type] || []
  );
}
export function options(s, field) {
  const values = field.endsWith("Mass")
    ? WEIGHTS
    : field === "pivot"
      ? PIVOTS
      : POSITIONS;
  return values.filter((v) => valid({ ...s, [field]: v }));
}
export function same(a, b) {
  return ["leftMass", "rightMass", "leftPos", "rightPos", "pivot"].every(
    (k) => a[k] === b[k],
  );
}
export function signature(s) {
  return [s.leftMass, s.leftPos, s.pivot, s.rightPos, s.rightMass].join(":");
}
export function solutions(s, type) {
  let states = [s];
  for (const field of allowedFields(type))
    states = states.flatMap((state) =>
      options(state, field).map((v) => ({ ...state, [field]: v })),
    );
  return states.filter((state) => outcome(state) === "balance");
}
export function rng(seed) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
export function shuffle(arr, random = Math.random) {
  arr = [...arr];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
const pools = {};
export function pool(type) {
  if (pools[type]) return pools[type];
  const found = [];
  for (const leftMass of WEIGHTS)
    for (const rightMass of WEIGHTS)
      for (const leftPos of [-4, -3, -2, -1])
        for (const rightPos of [1, 2, 3, 4])
          for (const pivot of PIVOTS) {
            const s = { leftMass, rightMass, leftPos, rightPos, pivot };
            if (!valid(s) || outcome(s) === "balance") continue;
            // Start early rounds with a centered pivot; later rounds vary it.
            if ((type === "weight" || type === "distance") && pivot !== 0)
              continue;
            const solved = solutions(s, type);
            if (solved.length)
              found.push({
                state: s,
                solution: solved[0],
                type,
                id: type + ":" + signature(s),
              });
          }
  pools[type] = found;
  return found;
}
export function nextChallenge(
  type,
  seen = [],
  random = Math.random,
  predicate = () => true,
) {
  const candidates = pool(type).filter(predicate);
  if (!candidates.length)
    throw new RangeError("No challenges match this scaffold");
  const unused = candidates.filter((x) => !seen.includes(x.id));
  const choices = unused.length ? unused : candidates;
  const c = choices[Math.floor(random() * choices.length)];
  return { ...c, state: { ...c.state }, solution: { ...c.solution } };
}
export function reasonFor(type) {
  return {
    weight: {
      prompt: "Why can changing weight help?",
      correct:
        "At the same distance, more weight has a greater turning effect.",
      wrong: [
        "Weight has no effect on a lever.",
        "The heavier side always goes down, no matter its distance.",
      ],
    },
    distance: {
      prompt: "Why can moving a weight help?",
      correct:
        "The same weight has a greater turning effect farther from the pivot.",
      wrong: [
        "Moving a weight changes how heavy it is.",
        "Distance from the pivot does not matter.",
      ],
    },
    pivot: {
      prompt: "What changes when the pivot moves?",
      correct: "The distances from both weights to the pivot change.",
      wrong: [
        "The weights become heavier.",
        "Both distances always stay the same.",
      ],
    },
    mix: {
      prompt: "What must match for this model to balance?",
      correct:
        "Weight × distance on the left must match weight × distance on the right.",
      wrong: [
        "The two weights must always be equal.",
        "Only the total number of weights matters.",
      ],
    },
  }[type];
}
export function independent({
  predictionCorrect,
  attempts,
  hint,
  reasonErrors,
}) {
  return predictionCorrect && attempts === 1 && !hint && reasonErrors === 0;
}
export function readProgress(raw) {
  const fresh = {
    version: 1,
    counts: [0, 0, 0, 0],
    physical: [],
    duration: 180,
    labels: true,
    reducedMotion: false,
  };
  try {
    const p = JSON.parse(raw);
    if (p.version !== 1) return fresh;
    return {
      ...fresh,
      counts: fresh.counts.map((_, i) =>
        Math.max(
          0,
          Math.min(3, Number.isInteger(p.counts?.[i]) ? p.counts[i] : 0),
        ),
      ),
      physical: Array.isArray(p.physical)
        ? p.physical.filter((x) => ["equal", "unequal", "own"].includes(x))
        : [],
      duration: [0, 180, 300].includes(p.duration) ? p.duration : 180,
      labels: typeof p.labels === "boolean" ? p.labels : true,
      reducedMotion: p.reducedMotion === true,
    };
  } catch {
    return fresh;
  }
}
export function distanceWords(s) {
  return { left: s.pivot - s.leftPos, right: s.rightPos - s.pivot };
}
