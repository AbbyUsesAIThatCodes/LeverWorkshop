import test from "node:test";
import assert from "node:assert/strict";
import {
  outcome,
  valid,
  pool,
  solutions,
  nextChallenge,
  rng,
  allowedFields,
  independent,
  readProgress,
  signature,
} from "../src/model.js";
test("equal moments balance; larger turning effect goes down", () => {
  assert.equal(
    outcome({ leftMass: 2, leftPos: -3, pivot: 0, rightMass: 3, rightPos: 2 }),
    "balance",
  );
  assert.equal(
    outcome({ leftMass: 1, leftPos: -4, pivot: 0, rightMass: 3, rightPos: 1 }),
    "left",
  );
  assert.equal(
    outcome({ leftMass: 2, leftPos: -1, pivot: 0, rightMass: 1, rightPos: 4 }),
    "right",
  );
});
test("moving the pivot changes both arms, without changing loads", () => {
  const s = { leftMass: 1, rightMass: 3, leftPos: -4, rightPos: 4, pivot: 0 };
  assert.equal(outcome(s), "right");
  assert.equal(outcome({ ...s, pivot: 2 }), "balance");
});
test("invalid positions and arbitrary weights cannot enter the model", () => {
  for (const s of [
    { leftMass: 1, rightMass: 1, leftPos: 0, rightPos: 2, pivot: 0 },
    { leftMass: 4, rightMass: 1, leftPos: -1, rightPos: 2, pivot: 0 },
    { leftMass: 1, rightMass: 1, leftPos: -1, rightPos: 2, pivot: 3 },
  ]) {
    assert.equal(valid(s), false);
    assert.throws(() => outcome(s), RangeError);
  }
});
for (const type of ["weight", "distance", "pivot", "mix"]) {
  test(`${type}: every generated challenge has a reachable solution using only allowed controls`, () => {
    assert.ok(pool(type).length >= 20);
    for (const c of pool(type)) {
      assert.notEqual(outcome(c.state), "balance");
      assert.equal(outcome(c.solution), "balance");
      for (const k of Object.keys(c.state))
        if (!allowedFields(type).includes(k))
          assert.equal(c.state[k], c.solution[k]);
      assert.ok(solutions(c.state, type).length > 0);
    }
  });
  test(`${type}: varied arrangements do not repeat before the pool is exhausted`, () => {
    const seen = [],
      random = rng(413);
    for (let i = 0; i < Math.min(30, pool(type).length); i++) {
      const c = nextChallenge(type, seen, random);
      assert.ok(!seen.includes(c.id));
      seen.push(c.id);
    }
    assert.ok(
      new Set(seen.map((s) => s.split(":").slice(1).join(":"))).size >= 20,
    );
  });
}
test("a hint, incorrect prediction, repeated test, or corrected explanation is supported practice", () => {
  const success = {
    predictionCorrect: true,
    attempts: 1,
    hint: false,
    reasonErrors: 0,
  };
  assert.equal(independent(success), true);
  for (const changes of [
    { predictionCorrect: false },
    { attempts: 2 },
    { hint: true },
    { reasonErrors: 1 },
  ])
    assert.equal(independent({ ...success, ...changes }), false);
});
test("saved progress is bounded, versioned, and resilient to corrupt storage", () => {
  assert.deepEqual(readProgress("{broken").counts, [0, 0, 0, 0]);
  assert.deepEqual(
    readProgress(
      JSON.stringify({
        version: 1,
        counts: [100, -1, "3", 2],
        duration: 999,
        physical: ["equal", "fake"],
      }),
    ),
    {
      version: 1,
      counts: [3, 0, 0, 2],
      duration: 180,
      physical: ["equal"],
      labels: true,
      reducedMotion: false,
    },
  );
  assert.deepEqual(
    readProgress(JSON.stringify({ version: 5, counts: [3, 3, 3, 3] })).counts,
    [0, 0, 0, 0],
  );
});
test("challenge objects are independent copies", () => {
  const c = nextChallenge("weight", [], rng(12));
  const original = signature(c.state);
  c.state.leftMass = 99;
  assert.ok(pool("weight").some((p) => signature(p.state) === original));
});
test("the first guided arrangement isolates one easier relationship in each skill", () => {
  const criteria = {
    weight: (c) =>
      c.state.pivot - c.state.leftPos === c.state.rightPos - c.state.pivot,
    distance: (c) => c.state.leftMass === c.state.rightMass,
    pivot: (c) => c.state.leftMass === c.state.rightMass,
    mix: (c) => c.state.pivot === 0,
  };
  for (const [type, predicate] of Object.entries(criteria)) {
    const seen = [];
    for (let i = 0; i < 3; i++) {
      const c = nextChallenge(type, seen, rng(i + 1), predicate);
      assert.ok(predicate(c));
      assert.ok(!seen.includes(c.id));
      seen.push(c.id);
    }
  }
});
