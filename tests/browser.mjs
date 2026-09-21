import { chromium } from "playwright";
import { spawn } from "node:child_process";
import { mkdir } from "node:fs/promises";
import assert from "node:assert/strict";
import { outcome, solutions, allowedFields, reasonFor } from "../src/model.js";
const url = "http://127.0.0.1:4173/LeverWorkshop/";
let server;
try {
  await fetch(url);
} catch {
  server = spawn(process.execPath, ["scripts/serve.mjs"], { stdio: "ignore" });
  for (let i = 0; i < 30; i++) {
    try {
      await fetch(url);
      break;
    } catch {
      await new Promise((r) => setTimeout(r, 100));
    }
  }
}
const args = ["--no-sandbox"];
if (process.env.BROWSER_SOFTWARE_GL === "1")
  args.push(
    "--use-gl=angle",
    "--use-angle=swiftshader",
    "--enable-unsafe-swiftshader",
  );
const browser = await chromium.launch({
  headless: true,
  args,
  executablePath: process.env.CHROMIUM_EXECUTABLE || undefined,
});
const errors = [],
  external = [];
await mkdir("artifacts", { recursive: true });
const page = await browser.newPage({ viewport: { width: 1366, height: 900 } });
page.on("pageerror", (e) => errors.push(e.message));
page.on("request", (r) => {
  if (
    !r.url().startsWith("http://127.0.0.1:4173/") &&
    !r.url().startsWith("blob:")
  )
    external.push(r.url());
});
async function readState() {
  return page.evaluate(() => {
    const text = document.querySelector("#scene").getAttribute("aria-label");
    const match = text.match(
      /Left: (\d+) units, (\d+) spaces from pivot\. Right: (\d+) units, (\d+) spaces/,
    );
    const pivot = Number(
      document
        .querySelectorAll(".reading b")[1]
        .textContent.replace("Slot ", ""),
    );
    return {
      leftMass: +match[1],
      leftPos: pivot - Number(match[2]),
      pivot,
      rightMass: +match[3],
      rightPos: pivot + Number(match[4]),
    };
  });
}
async function solveRound(
  type,
  { hint = false, wrongPrediction = false } = {},
) {
  const s = await readState();
  const prediction = wrongPrediction
    ? outcome(s) === "left"
      ? "right"
      : "left"
    : outcome(s);
  await page.locator(`[data-prediction="${prediction}"]`).click();
  assert.equal(
    await page.evaluate(() => document.activeElement.dataset.prediction),
    prediction,
    "keyboard focus survives a choice",
  );
  await page.locator("#predict-test").click();
  if (hint) await page.locator("#hint").click();
  const solution = solutions(s, type)[0];
  for (const field of allowedFields(type)) {
    const b = page.locator(
      `[data-field="${field}"][data-value="${solution[field]}"]`,
    );
    if (await b.count()) await b.click();
  }
  await page.locator("#test-change").click();
  await page
    .getByRole("button", { name: reasonFor(type).correct, exact: false })
    .click();
}
try {
  await page.clock.install();
  await page.goto(url);
  await page.waitForFunction(
    () =>
      document.querySelector("#scene canvas") ||
      !document.querySelector("#fallback").hidden,
  );
  await page.waitForTimeout(600);
  assert.equal(
    await page.locator("#fallback").isVisible(),
    false,
    "3D renders on the primary browser",
  );
  assert.equal(
    await page.locator("#predict-test").isDisabled(),
    true,
    "prediction is required",
  );
  assert.equal(
    await page.locator("[data-field]").count(),
    0,
    "editing is locked until prediction",
  );
  await page.screenshot({
    path: "artifacts/workshop-desktop.png",
    fullPage: true,
  });
  await solveRound("weight", { hint: true });
  assert.match(await page.locator("#lesson").innerText(), /Practice complete/);
  assert.equal(
    JSON.parse(
      (await page.evaluate(() => localStorage.getItem("lever-workshop-v1"))) ||
        '{"counts":[0]}',
    ).counts[0],
    0,
  );
  await page.locator("#next").click();
  await solveRound("weight", { wrongPrediction: true });
  assert.match(await page.locator("#lesson").innerText(), /Practice complete/);
  await page.locator("#next").click();
  for (const type of ["weight", "distance", "pivot", "mix"]) {
    for (let i = 0; i < 3; i++) {
      await solveRound(type);
      assert.match(
        await page.locator("#lesson").innerText(),
        /Independent success/,
      );
      await page.locator("#next").click();
    }
  }
  assert.equal(
    await page.locator("#start-trials").isVisible(),
    true,
    "all guided skills unlock trials",
  );
  await page.reload();
  assert.deepEqual(
    JSON.parse(
      await page.evaluate(() => localStorage.getItem("lever-workshop-v1")),
    ).counts,
    [3, 3, 3, 3],
  );
  await page.getByRole("button", { name: "Challenge", exact: true }).click();
  await page.locator("#start-trials").click();
  await page.locator("#teacher").click();
  const before = await page.locator("#timer").textContent();
  await page.clock.fastForward(10000);
  await page.locator("#close-dialog").click();
  assert.equal(
    await page.locator("#timer").textContent(),
    before,
    "teacher panel pauses timer",
  );
  for (const type of [
    "weight",
    "distance",
    "pivot",
    "weight",
    "distance",
    "mix",
  ]) {
    await solveRound(type);
    if (type !== "mix") await page.locator("#next").click();
  }
  assert.match(await page.locator("#lesson").innerText(), /6 \/ 6/);
  await page.screenshot({
    path: "artifacts/challenge-complete.png",
    fullPage: true,
  });
  await page.locator("#start-trials").click();
  await page.clock.fastForward(181000);
  assert.match(await page.locator("#lesson").innerText(), /timer ended/);
  await page.locator("#untimed").click();
  assert.equal(await page.locator("#timer").textContent(), "No timer");
  await page
    .getByRole("button", { name: "Real-world lab", exact: true })
    .click();
  await page.locator('[data-lab-prediction="balance"]').click();
  await page.locator("#lab-ready").click();
  await page.locator('[data-observation="right"]').click();
  assert.match(
    await page.locator("#lesson").innerText(),
    /different from your prediction/,
  );
  assert.match(
    await page.locator("#beam-status").innerText(),
    /Observed: right side down/,
  );
  await page.locator('[data-lab="own"]').click();
  await page.locator('[data-physical-pivot="1"]').click();
  await page.locator('[data-hole-side="left"][data-hole="3"]').click();
  await page.locator('[data-recipe-side="left"][data-recipe="1"]').click();
  assert.match(
    await page.locator("#readings").innerText(),
    /Bracket at hole 3/,
  );
  assert.match(await page.locator("#readings").innerText(), /12 & 13/);
  await page.screenshot({ path: "artifacts/physical-lab.png", fullPage: true });
  await page.locator("#teacher").click();
  const downloadPromise = page.waitForEvent("download");
  await page.locator("#export").click();
  const download = await downloadPromise;
  assert.equal(download.suggestedFilename(), "lever-workshop-evidence.json");
  await page.locator("#reset").click();
  await page.locator("#confirm-reset").click();
  assert.deepEqual(
    JSON.parse(
      await page.evaluate(() => localStorage.getItem("lever-workshop-v1")),
    ).counts,
    [0, 0, 0, 0],
  );
  await page.setViewportSize({ width: 390, height: 844 });
  await page.clock.runFor(100);
  await page.screenshot({
    path: "artifacts/workshop-mobile.png",
    fullPage: true,
  });
  assert.equal(
    await page.evaluate(
      () => document.documentElement.scrollWidth > innerWidth,
    ),
    false,
    "no horizontal overflow on small screens",
  );
  const fallback = await browser.newPage({
    viewport: { width: 1024, height: 768 },
  });
  fallback.on("pageerror", (e) => errors.push(e.message));
  await fallback.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (kind, ...rest) {
      return kind.startsWith("webgl")
        ? null
        : original.call(this, kind, ...rest);
    };
    Object.defineProperty(window, "localStorage", {
      get() {
        throw Error("Storage disabled");
      },
    });
  });
  await fallback.goto(url);
  await fallback.locator("#fallback").waitFor({ state: "visible" });
  await fallback.locator('[data-prediction="left"]').click();
  await fallback.locator("#predict-test").click();
  assert.equal(
    await fallback.locator("#test-change").count(),
    1,
    "diagram mode supports the same interaction without storage",
  );
  await fallback.close();
  assert.deepEqual(errors, [], "no unhandled browser errors");
  assert.deepEqual(external, [], "no external runtime requests");
  console.log(
    "PASS: 3D; prediction gate; assisted practice; 12 independent rounds; unlock; persistence; six trials; timer pause/expiry/untimed; physical observations and controls; export/reset; mobile layout; WebGL/storage fallback; local-only assets.",
  );
} finally {
  await browser.close();
  server?.kill();
}
