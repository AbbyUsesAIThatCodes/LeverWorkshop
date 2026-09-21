import { WorkshopScene } from "./scene.js";
import {
  TYPES,
  allowedFields,
  options,
  outcome,
  nextChallenge,
  reasonFor,
  shuffle,
  independent,
  readProgress,
  distanceWords,
  signature,
} from "./model.js";
const $ = (s) => document.querySelector(s);
const names = [
  "Change the weight",
  "Move the weight",
  "Move the pivot",
  "Bring it together",
];
const shortNames = ["Weight", "Distance", "Pivot", "Combine"];
const storageKey = "lever-workshop-v1";
let storageOK = true,
  progress;
try {
  progress = readProgress(localStorage.getItem(storageKey));
} catch {
  progress = readProgress(null);
  storageOK = false;
}
let mode = "guided",
  level = Math.min(
    progress.counts.findIndex((x) => x < 3) < 0
      ? 3
      : progress.counts.findIndex((x) => x < 3),
    3,
  ),
  challenge,
  state,
  phase = "predict",
  prediction = null,
  predictionCorrect = false,
  attempts = 0,
  hint = false,
  reasonErrors = 0,
  feedback = "",
  feedbackGood = false,
  reasonChoices = [],
  seen = [],
  history = [],
  trialRound = 0,
  trialIndependent = 0,
  remaining = progress.duration,
  clockLast = 0,
  timerRunning = false,
  lab = "equal",
  labObservation = null,
  labPrediction = null,
  labStep = "predict",
  leftRecipe = 2,
  rightRecipe = 2,
  physicalPivot = 0,
  leftHole = 1,
  rightHole = 20,
  scene = null,
  sceneReady = false,
  currentResult = null;
const descriptions = [
  "At the same distance, more weight has a greater turning effect. Change only the right weight.",
  "The same weight has a greater turning effect farther from the pivot. Move only the right weight.",
  "Moving the pivot changes both distances. Keep the weights in place and move only the pivot.",
  "Choose your changes. Use weight, distance, or the pivot to find a balance.",
];
function save() {
  try {
    localStorage.setItem(storageKey, JSON.stringify(progress));
  } catch {
    storageOK = false;
  }
}
function toast(s) {
  $("#toast").textContent = s;
  $("#toast").classList.add("show");
  setTimeout(() => $("#toast").classList.remove("show"), 3500);
}
function type() {
  return mode === "trials" ? challenge.type : TYPES[level];
}
function startChallenge(t) {
  const count = progress.counts[TYPES.indexOf(t)];
  const scaffold =
    mode === "guided" && count === 0
      ? (c) =>
          t === "weight"
            ? c.state.pivot - c.state.leftPos ===
              c.state.rightPos - c.state.pivot
            : t === "distance" || t === "pivot"
              ? c.state.leftMass === c.state.rightMass
              : c.state.pivot === 0
      : () => true;
  challenge = nextChallenge(t, seen, Math.random, scaffold);
  seen.push(challenge.id);
  state = { ...challenge.state };
  phase = "predict";
  prediction = null;
  predictionCorrect = false;
  attempts = 0;
  hint = false;
  reasonErrors = 0;
  feedback = "";
  currentResult = null;
  reasonChoices = shuffle([
    { text: reasonFor(t).correct, correct: true },
    ...reasonFor(t).wrong.map((text) => ({ text, correct: false })),
  ]);
  render();
}
function setMode(next) {
  timerRunning = false;
  mode = next;
  document
    .querySelectorAll("[data-mode]")
    .forEach((b) => b.classList.toggle("active", b.dataset.mode === mode));
  if (mode === "physical") {
    startLab("equal");
  } else if (mode === "trials") {
    phase = "intro";
    render();
  } else startChallenge(TYPES[level]);
}
function startTrials() {
  trialRound = 0;
  trialIndependent = 0;
  remaining = progress.duration;
  clockLast = performance.now();
  timerRunning = remaining > 0;
  startChallenge("weight");
}
function startLab(name) {
  lab = name;
  labObservation = null;
  labPrediction = null;
  labStep = "predict";
  physicalPivot = 0;
  leftHole = 1;
  rightHole = 20;
  leftRecipe = name === "unequal" ? 1 : 2;
  rightRecipe = 2;
  state = { leftMass: 2, rightMass: 2, leftPos: -4, rightPos: 4, pivot: 0 };
  feedback = "";
  currentResult = null;
  render();
}
function button(text, id, kind = "primary", disabled = false) {
  return `<button id="${id}" class="${kind}" ${disabled ? "disabled" : ""}>${text}</button>`;
}
function choiceButtons(selected, attr = "prediction") {
  return `<div class="choices" role="group" aria-label="Choose which way the lever will move">${[
    ["left", "↙", "Left down"],
    ["balance", "↔", "Balance"],
    ["right", "↘", "Right down"],
  ]
    .map(
      ([v, a, t]) =>
        `<button class="choice ${selected === v ? "selected" : ""}" data-${attr}="${v}" aria-pressed="${selected === v}"><span class="symbol" aria-hidden="true">${a}</span>${t}</button>`,
    )
    .join("")}</div>`;
}
function feedbackHTML() {
  return feedback
    ? `<div class="feedback ${feedbackGood ? "good" : ""}" role="status">${feedback}</div>`
    : "";
}
function timeString() {
  const seconds = Math.ceil(remaining);
  return progress.duration === 0
    ? "No timer"
    : `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}
function readable(value) {
  return {
    left: "left side down",
    balance: "balanced",
    right: "right side down",
  }[value];
}
function render() {
  const active = document.activeElement;
  const shouldRestore = $("#lesson").contains(active);
  const attributes = shouldRestore
    ? [...active.attributes].filter(
        (a) => a.name === "id" || a.name.startsWith("data-"),
      )
    : [];
  const focusSelector = attributes
    .map((a) => `[${a.name}="${CSS.escape(a.value)}"]`)
    .join("");
  $("#session-label").textContent =
    mode === "trials"
      ? "Challenge session"
      : mode === "physical"
        ? "Hands-on discovery"
        : "Your workshop";
  $("#model-label").textContent =
    mode === "physical" ? "YOUR VEX IQ BUILD" : "EQUAL PRACTICE WEIGHTS";
  $("#model-note").innerHTML =
    mode === "physical"
      ? "<b>Your observation drives this view.</b> Support the real lever before moving any parts."
      : "Each practice disc is <b>one equal weight unit</b>. The game beam is treated as weightless.";
  $("#labels").hidden = mode === "physical";
  $("#labels").textContent = progress.labels ? "Distances on" : "Distances off";
  $("#labels").setAttribute("aria-pressed", String(progress.labels));
  const d = distanceWords(state || { pivot: 0, leftPos: -4, rightPos: 4 });
  $("#readings").innerHTML =
    mode === "physical"
      ? `<div class="reading left"><small>LEFT RECIPE</small><b>${leftRecipe === 2 ? "Large + small" : "Large gear"}</b><span>Bracket at hole ${leftHole}</span></div><div class="reading"><small>PIVOT HOLES</small><b>${10 + physicalPivot * 2} &amp; ${11 + physicalPivot * 2}</b><span>Both outer rows</span></div><div class="reading right"><small>RIGHT RECIPE</small><b>${rightRecipe === 2 ? "Large + small" : "Large gear"}</b><span>Bracket at hole ${rightHole}</span></div>`
      : `<div class="reading left"><small>LEFT SIDE</small><b>${state?.leftMass || 2} weight unit${state?.leftMass === 1 ? "" : "s"}</b><span>${d.left} space${d.left === 1 ? "" : "s"} from pivot</span></div><div class="reading"><small>THE PIVOT</small><b>${state?.pivot === 0 ? "Slot 0" : `Slot ${state?.pivot > 0 ? "+" : ""}${state?.pivot}`}</b><span>The point the lever turns around</span></div><div class="reading right"><small>RIGHT SIDE</small><b>${state?.rightMass || 2} weight unit${state?.rightMass === 1 ? "" : "s"}</b><span>${d.right} space${d.right === 1 ? "" : "s"} from pivot</span></div>`;
  $("#journey-steps").innerHTML = shortNames
    .map(
      (n, i) =>
        `<button class="journey-step ${progress.counts[i] === 3 ? "done" : ""} ${mode === "guided" && i === level ? "active" : ""}" data-level="${i}" ${i > 0 && progress.counts[i - 1] < 3 ? "disabled" : ""}><span class="step-number">${progress.counts[i] === 3 ? "✓" : String(i + 1).padStart(2, "0")}</span><span><b>${n}</b><small>${progress.counts[i]} / 3 independent</small></span></button>`,
    )
    .join("");
  if (mode === "physical") renderLab();
  else if (mode === "trials" && phase === "intro") renderTrialIntro();
  else if (phase === "summary") renderSummary();
  else renderLesson();
  updateScene();
  bindLesson();
  if (shouldRestore) {
    const target = (focusSelector && $(focusSelector)) || $("#lesson h2");
    if (target) {
      if (target.tagName === "H2") target.tabIndex = -1;
      target.focus({ preventScroll: true });
    }
  }
}
function renderTrialIntro() {
  const unlocked = progress.counts.every((x) => x === 3);
  $("#lesson").innerHTML =
    `<p class="eyebrow">PUT YOUR IDEAS TO WORK</p><h2>The balance challenge</h2><p>Six fresh problems. A mix of weight, distance, and pivot changes.</p><div class="instruction"><p><b>Accuracy comes first.</b></p><p>Predict, balance, and explain each arrangement.</p><p>Current timer: <b>${progress.duration === 0 ? "off" : progress.duration / 60 + " minutes"}</b>.</p></div>${unlocked ? button('Start the challenge <span class="arrow">→</span>', "start-trials") : `<p>Finish three independent rounds in each learning step to unlock the challenge.</p>${button("Continue learning", "continue-learning")}`}<p class="fine">Hints remain available. A round with help counts as practice. Teacher tools can extend or turn off the timer.</p>`;
}
function renderLesson() {
  const t = type(),
    i = TYPES.indexOf(t);
  let html = `<div class="lesson-top"><span class="eyebrow">${mode === "trials" ? "BALANCE CHALLENGE" : `GUIDED WORKSHOP · ${i + 1} / 4`}</span>${mode === "trials" ? `<span id="timer" class="time" aria-label="Time remaining">${timeString()}</span>` : `<span class="progress-dots" aria-label="${progress.counts[i]} of 3 independent rounds">${[0, 1, 2].map((n) => `<span class="dot ${n < progress.counts[i] ? "filled" : ""}"></span>`).join("")}</span>`}</div><h2>${names[i]}</h2><p>${descriptions[i]}</p>`;
  if (phase === "predict")
    html += `<div class="instruction"><p><b>1) Look at both sides.</b></p><p>Count the weight units and the spaces from the pivot.</p></div><span class="question">2) What will happen when we let go?</span>${choiceButtons(prediction)}${button('Test my prediction <span class="arrow">→</span>', "predict-test", "primary", !prediction)}<p class="fine">The lever stays level while you decide.</p>`;
  else if (phase === "edit") {
    html += feedbackHTML();
    html += `<span class="question">${attempts ? "Try another idea." : "3) Make the lever balance."}</span>`;
    for (const field of allowedFields(t)) html += controlHTML(field);
    html += button(
      'Test my change <span class="arrow">→</span>',
      "test-change",
      "primary",
      signature(state) === signature(challenge.state) && attempts === 0,
    );
    html += `<div class="hint-line"><button id="hint" class="text-button">${hint ? "Show the worked example again" : "I need a worked example"}</button></div><p class="fine">The lever is held level while you make changes.</p>`;
  } else if (phase === "reason")
    html += `<div class="feedback good">The lever balances. Now explain your idea.</div><span class="question">4) ${reasonFor(t).prompt}</span><div class="reason-choices">${reasonChoices.map((r, i) => `<button class="reason" data-reason="${i}">${i + 1}) ${r.text}</button>`).join("")}</div>${feedbackHTML()}`;
  else if (phase === "done")
    html += `${feedbackHTML()}<div class="instruction"><p><b>${mode === "trials" ? `${trialIndependent} independent / ${trialRound} rounds` : `${progress.counts[i]} / 3 independent rounds`}</b></p><p>Try different arrangements to make your idea stronger.</p></div>${button(mode === "guided" && progress.counts[i] === 3 && i < 3 ? 'Next discovery <span class="arrow">→</span>' : mode === "guided" && progress.counts.every((x) => x === 3) ? 'Open the challenge <span class="arrow">→</span>' : 'Next arrangement <span class="arrow">→</span>', "next")}${mode === "guided" && (i === 0 || i === 2) ? button("Try it with your real lever", "physical-check", "secondary") : ""}`;
  if (mode === "trials")
    html += `<p class="fine">Round ${Math.min(trialRound + (phase === "done" ? 0 : 1), 6)} / 6 · ${trialIndependent} independent</p>`;
  $("#lesson").innerHTML = html;
}
function controlHTML(field) {
  const label = {
    leftMass: "Left weight units",
    rightMass: "Right weight units",
    leftPos: "Left weight slot",
    rightPos: "Right weight slot",
    pivot: "Pivot slot",
  }[field];
  return `<div class="control ${field.startsWith("left") ? "left-control" : "right-control"}"><label>${label}<span>${field.endsWith("Mass") ? "equal units" : "snap positions"}</span></label><div class="control-row">${options(
    state,
    field,
  )
    .map(
      (v) =>
        `<button class="slot ${state[field] === v ? "selected" : ""}" data-field="${field}" data-value="${v}" aria-pressed="${state[field] === v}" aria-label="${label}: ${v}">${v > 0 && !field.endsWith("Mass") ? "+" : ""}${v}</button>`,
    )
    .join("")}</div></div>`;
}
function renderSummary() {
  timerRunning = false;
  $("#lesson").innerHTML =
    `<p class="eyebrow">SESSION COMPLETE</p><h2>Look what you explored.</h2><div class="result-number">${trialIndependent} / ${trialRound}</div><p>rounds completed independently</p><p class="muted">${trialRound < 6 ? "The timer ended. You can take more time." : "You worked through all six arrangements."}</p><div class="badges">${TYPES.map((t) => `<span class="badge">${shortNames[TYPES.indexOf(t)]}</span>`).join("")}</div>${button("New challenge", "start-trials")}${button("Keep practicing without a timer", "untimed", "secondary")}${button("Try your real lever", "physical-check", "secondary")}<p class="fine">Your teacher can ask you to explain or rebuild an arrangement. This local score is practice evidence, not a verified grade.</p>`;
}
function renderLab() {
  const custom = lab === "own";
  let html = `<p class="eyebrow">SCREEN ↔ WORKBENCH</p><h2>${lab === "equal" ? "Build it. Match it." : lab === "unequal" ? "Change one gear." : "Bring your build on screen."}</h2><p>${lab === "equal" ? "Start with the matching-load build from your packet." : lab === "unequal" ? "Remove the small gear from the left side. Leave the right side as it is." : "Tell the workshop where your real pivot is and where each bracket is attached, and which gear recipe it holds."}</p><div class="control-row">${[
    ["equal", "A · Matching"],
    ["unequal", "B · Unequal"],
    ["own", "Your build"],
  ]
    .map(
      ([v, label]) =>
        `<button class="slot ${lab === v ? "selected" : ""}" data-lab="${v}">${label}</button>`,
    )
    .join("")}</div>`;
  if (custom) {
    for (const side of ["left", "right"])
      html += `<div class="control"><label>${side === "left" ? "Left" : "Right"} gear recipe</label><div class="control-row">${[1, 2].map((v) => `<button class="slot ${(side === "left" ? leftRecipe : rightRecipe) === v ? "selected" : ""}" data-recipe-side="${side}" data-recipe="${v}">${v === 1 ? "Large only" : "Large + small"}</button>`).join("")}</div></div>`;
    html += `<div class="control"><label>Pivot hole pair · both outer rows</label><div class="control-row">${[
      -2, -1, 0, 1, 2,
    ]
      .filter(
        (v) => 11 + v * 2 - leftHole >= 3 && rightHole - (11 + v * 2) >= 3,
      )
      .map(
        (v) =>
          `<button class="slot ${v === physicalPivot ? "selected" : ""}" data-physical-pivot="${v}">${10 + v * 2}–${11 + v * 2}</button>`,
      )
      .join("")}</div></div>`;
  }
  if (custom) {
    for (const side of ["left", "right"]) {
      const values = (side === "left" ? [1, 3, 5] : [16, 18, 20]).filter((v) =>
        side === "left"
          ? 11 + physicalPivot * 2 - v >= 3
          : v - (11 + physicalPivot * 2) >= 3,
      );
      html += `<div class="control"><label>${side === "left" ? "Left" : "Right"} bracket · hole column</label><div class="control-row">${values.map((v) => `<button class="slot ${(side === "left" ? leftHole : rightHole) === v ? "selected" : ""}" data-hole-side="${side}" data-hole="${v}">${v}</button>`).join("")}</div></div>`;
    }
  }
  html += `<ol class="lab-steps"><li><b><u><em>Support both ends.</em></u></b> Match the gear recipes, bracket locations, and pivot holes.</li><li><b>Predict</b> what will happen.</li><li>Gently let go. <b>Watch your real lever.</b></li></ol>`;
  if (labStep === "predict")
    html += `<span class="question">My prediction</span>${choiceButtons(labPrediction, "lab-prediction")}${button("I’m ready to test the real lever", "lab-ready", "primary", !labPrediction)}`;
  else if (labStep === "observe")
    html += `<span class="question">What did your real lever do?</span>${choiceButtons(labObservation, "observation")}<p class="fine">Choose what you actually saw. The 3D lever will follow your observation.</p>`;
  else
    html += `<div class="feedback good">Recorded: <b>${readable(labObservation)}</b>.<br>${labPrediction === labObservation ? "Your prediction matched your observation." : "Your observation was different from your prediction. That is useful evidence."}</div><span class="question">Tell your partner:</span><p>“I predicted ___. I observed ___. I think this happened because ___.”</p>${custom ? `<p class="fine">An off-center pivot also changes the turning effect of the beam itself. We are recording observations here, not calculating a calibrated prediction.</p>` : ""}${button(lab === "equal" ? "Try removing one small gear" : lab === "unequal" ? "Try moving your real pivot" : "Test another arrangement", "next-lab")}${button("Back to guided practice", "continue-learning", "secondary")}`;
  html += `<p class="fine">Real gear recipes are not 1-unit and 2-unit weights. Match your build packet. Get your teacher’s help before moving the physical pivot.</p>`;
  $("#lesson").innerHTML = html;
}
function updateScene() {
  if (sceneReady) {
    scene.setup(
      mode === "physical" ? { ...state, pivot: physicalPivot } : state,
      {
        physical: mode === "physical",
        leftRecipe,
        rightRecipe,
        leftHole,
        rightHole,
        labels: progress.labels,
        reduced:
          progress.reducedMotion ||
          matchMedia("(prefers-reduced-motion: reduce)").matches,
      },
    );
    if (currentResult) scene.tilt(currentResult);
  }
  $("#beam-status").innerHTML =
    `<span class="status-dot"></span>${currentResult ? (mode === "physical" ? "Observed: " : "Test result: ") + readable(currentResult) : "Supported · ready to predict"}`;
  const s = mode === "physical" ? { ...state, pivot: physicalPivot } : state;
  $("#scene").setAttribute(
    "aria-label",
    mode === "physical"
      ? `VEX IQ lever. Pivot holes ${10 + physicalPivot * 2} and ${11 + physicalPivot * 2}. Left ${leftRecipe === 1 ? "large gear" : "large and small gear"}. Right ${rightRecipe === 1 ? "large gear" : "large and small gear"}. ${currentResult ? "Observed " + readable(currentResult) : "Supported level"}.`
      : `Lever. Left: ${s.leftMass} units, ${s.pivot - s.leftPos} spaces from pivot. Right: ${s.rightMass} units, ${s.rightPos - s.pivot} spaces from pivot. ${currentResult ? readable(currentResult) : "Supported level"}.`,
  );
  if ($("#fallback").hidden === false) renderFallback(s);
}
function renderFallback(s) {
  const px = 350 + s.pivot * 45 + (mode === "physical" ? 11.25 : 0),
    lx =
      mode === "physical"
        ? 350 + (leftHole - 10.5) * 22.5
        : 350 + s.leftPos * 45,
    rx =
      mode === "physical"
        ? 350 + (rightHole - 10.5) * 22.5
        : 350 + s.rightPos * 45,
    deg = currentResult === "left" ? -6 : currentResult === "right" ? 6 : 0;
  $("#fallback-svg").innerHTML =
    `<path d="M${px} 145l-24 60h48Z" fill="#819b8c"/><g transform="rotate(${deg} ${px} 145)"><rect x="120" y="130" width="460" height="15" rx="4" fill="#67857f"/><circle cx="${lx}" cy="95" r="28" fill="#348e84"/><circle cx="${rx}" cy="95" r="28" fill="#946caf"/><text x="${lx}" y="102" text-anchor="middle" fill="white" font-size="22">${mode === "physical" ? (leftRecipe === 1 ? "L" : "L+S") : s.leftMass}</text><text x="${rx}" y="102" text-anchor="middle" fill="white" font-size="22">${mode === "physical" ? (rightRecipe === 1 ? "L" : "L+S") : s.rightMass}</text></g><text x="${px}" y="235" text-anchor="middle" fill="#264f48" font-size="18">Pivot</text>`;
}
function bindLesson() {
  document.querySelectorAll("[data-prediction]").forEach(
    (b) =>
      (b.onclick = () => {
        prediction = b.dataset.prediction;
        render();
      }),
  );
  $("#predict-test")?.addEventListener("click", () => {
    predictionCorrect = prediction === outcome(state);
    currentResult = outcome(state);
    phase = "edit";
    feedbackGood = predictionCorrect;
    feedback = `${predictionCorrect ? "Your prediction matched." : "You predicted " + readable(prediction) + "."} The test shows <b>${readable(currentResult)}</b>. Now change the arrangement to make it balance.`;
    render();
  });
  document.querySelectorAll("[data-field]").forEach(
    (b) =>
      (b.onclick = () => {
        state[b.dataset.field] = Number(b.dataset.value);
        currentResult = null;
        feedback = "";
        render();
      }),
  );
  $("#test-change")?.addEventListener("click", () => {
    attempts++;
    currentResult = outcome(state);
    if (currentResult === "balance") {
      phase = "reason";
      feedback = "";
    } else {
      feedbackGood = false;
      feedback = `The <b>${currentResult} side went down</b>. Its turning effect is greater. Change your arrangement and test again.`;
    }
    render();
  });
  $("#hint")?.addEventListener("click", () => {
    hint = true;
    const sol = challenge.solution,
      d = distanceWords(sol);
    const prompt =
      type() === "weight"
        ? `Set the right weight to ${sol.rightMass} unit${sol.rightMass === 1 ? "" : "s"}.`
        : type() === "distance"
          ? `Move the right weight to slot ${sol.rightPos}.`
          : type() === "pivot"
            ? `Move the pivot to slot ${sol.pivot}.`
            : `One solution uses left ${sol.leftMass} at slot ${sol.leftPos}, right ${sol.rightMass} at slot ${sol.rightPos}, and pivot ${sol.pivot}.`;
    feedbackGood = false;
    feedback = `<b>Worked example</b><br>${prompt}<br>Left: ${sol.leftMass} × ${d.left} = ${sol.leftMass * d.left}.<br>Right: ${sol.rightMass} × ${d.right} = ${sol.rightMass * d.right}.<br>Equal turning effects balance. Finish this practice, then try a fresh round independently.`;
    render();
  });
  document.querySelectorAll("[data-reason]").forEach(
    (b) =>
      (b.onclick = () => {
        if (!reasonChoices[Number(b.dataset.reason)].correct) {
          reasonErrors++;
          feedbackGood = false;
          feedback =
            "Look again at what changed. Which explanation fits the test?";
          render();
          return;
        }
        const credit = independent({
          predictionCorrect,
          attempts,
          hint,
          reasonErrors,
        });
        history.push({
          mode,
          type: type(),
          start: { ...challenge.state },
          finish: { ...state },
          prediction,
          predictionCorrect,
          attempts,
          hint,
          reasonErrors,
          independent: credit,
        });
        if (mode === "guided" && credit) {
          progress.counts[level] = Math.min(3, progress.counts[level] + 1);
          save();
        }
        if (mode === "trials") {
          trialRound++;
          if (credit) trialIndependent++;
        }
        phase = "done";
        feedbackGood = true;
        feedback = credit
          ? "<b>Independent success!</b> Your prediction, change, and explanation fit the evidence."
          : "<b>Practice complete.</b> You used feedback to work it out. Try a fresh arrangement without help to earn an independent success.";
        if (mode === "trials" && trialRound === 6) phase = "summary";
        render();
      }),
  );
  $("#next")?.addEventListener("click", () => {
    if (mode === "guided" && progress.counts[level] === 3) {
      if (level < 3) level++;
      else {
        setMode("trials");
        return;
      }
    }
    startChallenge(
      mode === "trials"
        ? ["weight", "distance", "pivot", "weight", "distance", "mix"][
            trialRound
          ]
        : TYPES[level],
    );
  });
  $("#start-trials")?.addEventListener("click", startTrials);
  $("#untimed")?.addEventListener("click", () => {
    progress.duration = 0;
    save();
    startTrials();
  });
  $("#continue-learning")?.addEventListener("click", () => {
    level = progress.counts.findIndex((x) => x < 3);
    if (level < 0) level = 3;
    setMode("guided");
  });
  $("#physical-check")?.addEventListener("click", () => setMode("physical"));
  document.querySelectorAll("[data-level]").forEach(
    (b) =>
      (b.onclick = () => {
        level = Number(b.dataset.level);
        setMode("guided");
      }),
  );
  document
    .querySelectorAll("[data-lab]")
    .forEach((b) => (b.onclick = () => startLab(b.dataset.lab)));
  document.querySelectorAll("[data-lab-prediction]").forEach(
    (b) =>
      (b.onclick = () => {
        labPrediction = b.dataset.labPrediction;
        render();
      }),
  );
  $("#lab-ready")?.addEventListener("click", () => {
    labStep = "observe";
    render();
  });
  document.querySelectorAll("[data-observation]").forEach(
    (b) =>
      (b.onclick = () => {
        labObservation = b.dataset.observation;
        currentResult = labObservation;
        labStep = "done";
        if (!progress.physical.includes(lab)) progress.physical.push(lab);
        save();
        history.push({
          mode: "physical",
          lab,
          pivotHoles: [10 + physicalPivot * 2, 11 + physicalPivot * 2],
          leftRecipe,
          rightRecipe,
          leftHole,
          rightHole,
          prediction: labPrediction,
          observation: labObservation,
        });
        render();
      }),
  );
  document.querySelectorAll("[data-recipe-side]").forEach(
    (b) =>
      (b.onclick = () => {
        if (b.dataset.recipeSide === "left")
          leftRecipe = Number(b.dataset.recipe);
        else rightRecipe = Number(b.dataset.recipe);
        labStep = "predict";
        labPrediction = null;
        currentResult = null;
        render();
      }),
  );
  document.querySelectorAll("[data-physical-pivot]").forEach(
    (b) =>
      (b.onclick = () => {
        physicalPivot = Number(b.dataset.physicalPivot);
        labStep = "predict";
        labPrediction = null;
        currentResult = null;
        render();
      }),
  );
  document.querySelectorAll("[data-hole-side]").forEach(
    (b) =>
      (b.onclick = () => {
        if (b.dataset.holeSide === "left") leftHole = Number(b.dataset.hole);
        else rightHole = Number(b.dataset.hole);
        labStep = "predict";
        labPrediction = null;
        currentResult = null;
        render();
      }),
  );
  $("#next-lab")?.addEventListener("click", () =>
    startLab(lab === "equal" ? "unequal" : "own"),
  );
}
function showDialog(content) {
  $("#dialog-content").innerHTML = content;
  $("#dialog").showModal();
}
function teacher() {
  showDialog(
    `<p class="eyebrow">TEACHER TOOLS</p><h2>A workshop at your pace.</h2><p>Students need three independent successes per learning step. Feedback and examples lead to extra practice.</p><label>Challenge time <select id="duration"><option value="180">3 minutes</option><option value="300">5 minutes</option><option value="0">No timer</option></select></label><label><input id="motion" type="checkbox" ${progress.reducedMotion ? "checked" : ""}> Reduce lever animation</label><p class="fine">Timers pause while this panel is open, while the browser tab is hidden, and during physical work.</p><table class="table"><thead><tr><th>Concept</th><th>Independent rounds</th></tr></thead><tbody>${shortNames.map((n, i) => `<tr><td>${n}</td><td>${progress.counts[i]} / 3</td></tr>`).join("")}</tbody></table><p class="fine">Progress belongs to this browser profile. Start a new student session on shared devices. ${storageOK ? "Progress is saved locally." : "Storage is unavailable; keep this tab open."} Downloaded evidence covers this tab’s completed rounds.</p><div class="teacher-actions">${button("Download evidence", "export", "secondary")}${button("New student", "reset", "secondary")}</div><p><a href="https://github.com/AbbyUsesAIThatCodes/LeverWorkshop/blob/main/docs/TEACHER-GUIDE.md" target="_blank" rel="noopener">Teacher guide and physical checks ↗</a></p>`,
  );
  $("#duration").value = String(progress.duration);
  $("#duration").onchange = (e) => {
    const previous = progress.duration;
    progress.duration = Number(e.target.value);
    if (mode === "trials" && phase !== "intro" && phase !== "summary") {
      remaining =
        progress.duration === 0
          ? 0
          : previous === 0
            ? progress.duration
            : Math.max(0, remaining + progress.duration - previous);
      timerRunning = progress.duration > 0;
      clockLast = performance.now();
    }
    save();
  };
  $("#motion").onchange = (e) => {
    progress.reducedMotion = e.target.checked;
    save();
    if (scene) scene.reduced = progress.reducedMotion;
  };
  $("#export").onclick = () => {
    const blob = new Blob(
      [
        JSON.stringify(
          {
            app: "Lever Workshop",
            version: 1,
            warning: "Local practice evidence, not authenticated assessment.",
            progress,
            rounds: history,
          },
          null,
          2,
        ),
      ],
      { type: "application/json" },
    );
    const url = URL.createObjectURL(blob),
      a = document.createElement("a");
    a.href = url;
    a.download = "lever-workshop-evidence.json";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  $("#reset").onclick = () => {
    showDialog(
      `<h2>Start a new student session?</h2><p>This clears the saved practice counts on this browser and this tab’s round history.</p>${button("Clear progress and start fresh", "confirm-reset", "secondary")}`,
    );
    $("#confirm-reset").onclick = () => {
      progress = readProgress(null);
      history = [];
      seen = [];
      save();
      level = 0;
      $("#dialog").close();
      setMode("guided");
    };
  };
}
$("#teacher").onclick = teacher;
$("#about").onclick = () =>
  showDialog(
    `<p class="eyebrow">ABOUT THIS WORKSHOP</p><h2>One lever. Two kinds of learning.</h2><p><b>Guided practice and challenges</b> use equal weight units, discrete slots, a weightless beam, and a free pivot. A tilt shows direction, not a measured angle or time.</p><p><b>Real-world lab</b> uses the large and small gear recipes from your build packet. You test the real lever and enter what happened. This is manual observation, not a sensor connection or a calibrated prediction.</p><p>The part meshes come from VEX IQ CAD. Assembly positions and classroom behavior still need a teacher’s physical check. VEX Robotics is not affiliated with this independent classroom project.</p><p>Comic Sans is used when installed. Comic Neue is included as a local fallback. No student account or analytics is used.</p>`,
  );
$("#close-dialog").onclick = () => {
  $("#dialog").close();
  clockLast = performance.now();
};
$("#dialog").addEventListener("close", () => {
  clockLast = performance.now();
  if (mode === "trials" && phase !== "intro" && phase !== "summary") render();
});
$(".brand").onclick = (e) => {
  e.preventDefault();
  setMode("guided");
};
document
  .querySelectorAll("[data-mode]")
  .forEach((b) => (b.onclick = () => setMode(b.dataset.mode)));
$("#labels").onclick = () => {
  progress.labels = !progress.labels;
  save();
  render();
};
function setCamera(side) {
  if (sceneReady) {
    side ? scene.sideCamera() : scene.resetCamera();
  }
  $("#view-side").setAttribute("aria-pressed", String(side));
  $("#view-3d").setAttribute("aria-pressed", String(!side));
}
$("#view-side").onclick = () => setCamera(true);
$("#view-3d").onclick = () => setCamera(false);
$("#view-reset").onclick = () => setCamera(false);
setInterval(() => {
  const now = performance.now(),
    delta = Math.max(0, (now - clockLast) / 1000);
  clockLast = now;
  if (
    timerRunning &&
    (sceneReady || !$("#fallback").hidden) &&
    mode === "trials" &&
    !document.hidden &&
    !$("#dialog").open
  ) {
    remaining = Math.max(0, remaining - delta);
    if ($("#timer")) $("#timer").textContent = timeString();
    if (remaining === 0) {
      phase = "summary";
      render();
    }
  }
}, 200);
document.addEventListener("visibilitychange", () => {
  clockLast = performance.now();
});
$("#scene").addEventListener("scene-unavailable", () => {
  sceneReady = false;
  $("#scene").hidden = true;
  $("#fallback").hidden = false;
  $(".view-controls").hidden = true;
  renderFallback(state);
  toast("The 3D view paused. You can keep learning with the diagram.");
});
startChallenge(TYPES[level]);
try {
  scene = new WorkshopScene($("#scene"));
  await scene.init();
  sceneReady = true;
  updateScene();
} catch (error) {
  console.warn("3D unavailable; using the accessible diagram.", error.message);
  $("#scene").hidden = true;
  $("#fallback").hidden = false;
  $(".view-controls").hidden = true;
  renderFallback(state);
}
if (!storageOK) toast("Progress will last while this tab stays open.");
