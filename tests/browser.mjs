import { chromium } from "playwright";
import { spawn } from "node:child_process";
import { mkdir } from "node:fs/promises";
import assert from "node:assert/strict";
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
const page = await browser.newPage({ viewport: { width: 1366, height: 768 } });
page.on("pageerror", (e) => errors.push(e.message));
page.on("request", (r) => {
  if (
    !r.url().startsWith("http://127.0.0.1:4173/") &&
    !r.url().startsWith("blob:")
  )
    external.push(r.url());
});
const state = () =>
  page.evaluate(
    () => JSON.parse(localStorage.getItem("lever-workshop-v2")).state,
  );
async function range(id, value) {
  await page.locator(id).evaluate((el, value) => {
    el.value = value;
    el.dispatchEvent(new Event("input", { bubbles: true }));
  }, String(value));
}
async function tagCenter(part) {
  const b = await page.locator(`[data-part="${part}"]`).boundingBox();
  assert.ok(b, `visible ${part} tag`);
  return { x: b.x + b.width / 2, y: b.y + b.height / 2 };
}
async function dragTag(part, pixels) {
  const p = await tagCenter(part);
  await page.mouse.move(p.x, p.y);
  await page.mouse.down();
  await page.mouse.move(p.x + pixels, p.y, { steps: 12 });
  await page.mouse.up();
}
async function fits() {
  assert.equal(
    await page.evaluate(
      () =>
        document.documentElement.scrollWidth > innerWidth ||
        document.documentElement.scrollHeight > innerHeight,
    ),
    false,
    "no viewport overflow",
  );
  const b = await page.locator("#scene canvas").boundingBox();
  const size = page.viewportSize();
  assert.equal(b.width, size.width);
  assert.equal(b.height, size.height);
}
try {
  await page.goto(url);
  await page.waitForFunction(
    () => document.querySelector("#app").dataset.ready === "true",
  );
  await page.waitForTimeout(400);
  await fits();
  assert.match(await page.locator("#beam-status").innerText(), /Balanced/);
  assert.equal(
    await page.getByRole("button", { name: "Challenge", exact: true }).count(),
    0,
  );
  assert.equal(await page.locator("#lesson").count(), 0);
  await page.screenshot({ path: "artifacts/workshop.png" });
  await page.locator("#hold").click();
  await page.locator("#view-side").click();
  await page.waitForTimeout(150);
  // An actual CAD upright, beneath the A tag, must be directly draggable.
  let a = await tagCenter("a");
  await page.mouse.move(a.x - 7, a.y + 150);
  await page.mouse.down();
  await page.mouse.move(a.x + 103, a.y + 150, { steps: 12 });
  await page.mouse.up();
  let s = await state();
  assert.ok(
    s.a > 1 && s.a < s.pivot,
    `mesh drag moved load A: ${JSON.stringify(s)}`,
  );
  // Dragging tags provides larger touch targets for the same parts.
  await dragTag("b", -110);
  s = await state();
  assert.ok(s.b < 20 && s.b > s.pivot + 1);
  await dragTag("pivot", 70);
  s = await state();
  assert.ok(s.pivot > 10 && s.pivot < s.b - 1);
  await dragTag("a", 800);
  s = await state();
  assert.equal(s.a, s.pivot - 1, "A cannot cross either pivot mounting column");
  await dragTag("pivot", -800);
  s = await state();
  assert.equal(s.pivot, s.a + 1, "pivot cannot cross A");
  await dragTag("b", -800);
  s = await state();
  assert.equal(s.b, s.pivot + 2, "B cannot cross pivot");
  await page.locator("#reset").click();
  await page.locator("#hold").click();
  // Two quarter turns reverse screen sides. A remains A and drag direction reverses.
  await page.locator("#view-turn").click();
  await page.locator("#view-turn").click();
  await page.waitForTimeout(150);
  a = await tagCenter("a");
  let b = await tagCenter("b");
  assert.ok(a.x > b.x, "camera reaches the opposite side");
  await dragTag("a", -100);
  s = await state();
  assert.ok(s.a > 1, "back-view drag moves A toward pivot");
  await page.locator("#load-a").hover();
  assert.ok(
    await page
      .locator(".load-a")
      .evaluate((el) => el.classList.contains("active")),
  );
  await range("#load-a", 4);
  s = await state();
  assert.equal(s.loadA, 4);
  assert.equal(s.loadB, 2);
  assert.match(await page.locator("#mass-a").innerText(), /38 g/);
  assert.match(await page.locator("#recipe-a").innerText(), /12 pins/);
  await page.screenshot({ path: "artifacts/opposite-view.png" });
  await page.locator("#view-turn").click();
  await page.locator("#view-turn").click();
  await page.waitForTimeout(150);
  a = await tagCenter("a");
  b = await tagCenter("b");
  assert.ok(a.x < b.x, "full horizontal orbit returns to original side");
  // Keyboard editing retains focus, respects limits, and is immediately repeatable.
  await page.locator('[data-select="pivot"]').click();
  await page.locator("#position").focus();
  const before = (await state()).pivot;
  await page.keyboard.press("ArrowRight");
  assert.equal((await state()).pivot, before + 1);
  assert.equal(
    await page
      .locator("#position")
      .evaluate((el) => el === document.activeElement),
    true,
  );
  await page.reload();
  await page.waitForFunction(
    () => document.querySelector("#app").dataset.ready === "true",
  );
  assert.equal((await state()).pivot, before + 1);
  assert.equal((await state()).loadA, 4);
  await page.locator("#reset").click();
  await page.locator("#hold").click();
  await page.locator("#view-side").click();
  // Cancellation restores the pre-drag arrangement.
  const original = await state();
  a = await tagCenter("a");
  await page.mouse.move(a.x, a.y);
  await page.mouse.down();
  await page.mouse.move(a.x + 90, a.y, { steps: 8 });
  await page.evaluate(() =>
    window.dispatchEvent(new PointerEvent("pointercancel", { pointerId: 1 })),
  );
  await page.mouse.up();
  assert.deepEqual(await state(), original);
  a = await tagCenter("a");
  await page.mouse.move(a.x, a.y);
  await page.mouse.down();
  await page.mouse.move(a.x + 90, a.y, { steps: 8 });
  await page.keyboard.press("Escape");
  await page.mouse.up();
  assert.deepEqual(
    await state(),
    original,
    "Escape cancels a captured label drag",
  );
  // The unobstructed background controls orbit without changing the parts.
  a = await tagCenter("a");
  await page.mouse.move(850, 110);
  await page.mouse.down();
  await page.mouse.move(1100, 160, { steps: 20 });
  await page.mouse.up();
  await page.waitForTimeout(400);
  const afterOrbit = await tagCenter("a");
  assert.ok(Math.abs(a.x - afterOrbit.x) > 30, "background drag orbits");
  assert.deepEqual(await state(), original);
  await page.locator("#view-reset").click();
  await range("#load-b", 1);
  await page.locator("#hold").click();
  await page.waitForTimeout(600);
  assert.equal(await page.locator("#beam-status").innerText(), "Load A dips");
  await page.screenshot({ path: "artifacts/lever-tilt.png" });
  // Settings reject invalid component masses and permit real measurements.
  await page.locator("#settings").click();
  await page.locator("summary").click();
  await page.locator("#mass-pin").fill("4");
  await page.locator("#calibration-form button[type=submit]").click();
  assert.match(
    await page.locator("#calibration-error").innerText(),
    /more than/,
  );
  await page.locator("#defaults").click();
  await page.locator("#mass-beam").fill("20");
  await page.locator("#calibration-form button[type=submit]").click();
  assert.equal(
    await page.evaluate(
      () =>
        JSON.parse(localStorage.getItem("lever-workshop-v2")).calibration.beam,
    ),
    20,
  );
  await page.locator("#reduced-motion").check();
  await page.locator("#settings-dialog .dialog-close").first().click();
  await page.locator("#reset").click();
  await page.locator("#view-reset").click();
  await page.setViewportSize({ width: 1024, height: 600 });
  await page.waitForTimeout(200);
  await fits();
  await page.screenshot({ path: "artifacts/workshop-small-laptop.png" });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(200);
  await fits();
  for (const part of ["a", "pivot", "b"]) {
    const tag = await page.locator(`[data-part="${part}"]`).boundingBox();
    assert.ok(
      tag.x >= 0 && tag.x + tag.width <= 390,
      `${part} stays in the portrait view`,
    );
  }
  await page.screenshot({ path: "artifacts/workshop-mobile.png" });
  await page.locator("#help").click();
  assert.ok(await page.locator("#help-dialog").isVisible());
  await page.keyboard.press("Escape");
  assert.equal(await page.locator("#help-dialog").isVisible(), false);
  // Touch uses the same snapping and constraints on a small laptop.
  const touch = await browser.newPage({
    viewport: { width: 1024, height: 768 },
    hasTouch: true,
  });
  touch.on("pageerror", (e) => errors.push(e.message));
  await touch.goto(url);
  await touch.waitForFunction(
    () => document.querySelector("#app").dataset.ready === "true",
  );
  await touch.locator("#hold").click();
  await touch.locator("#view-side").click();
  const box = await touch.locator('[data-part="a"]').boundingBox(),
    tx = box.x + box.width / 2,
    ty = box.y + box.height / 2;
  const cdp = await touch.context().newCDPSession(touch);
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: [{ x: tx, y: ty }],
  });
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchMove",
    touchPoints: [{ x: tx + 100, y: ty }],
  });
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchEnd",
    touchPoints: [],
  });
  assert.ok(
    await touch.evaluate(
      () => JSON.parse(localStorage.getItem("lever-workshop-v2")).state.a > 1,
    ),
  );
  await touch.close();
  // Devices without WebGL or storage retain the same controls and mechanics.
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
  await fallback.locator('[data-select="a"]').click();
  await fallback.locator("#position").focus();
  await fallback.keyboard.press("ArrowRight");
  assert.equal(await fallback.locator("#position-value").innerText(), "Hole 2");
  assert.equal(
    await fallback.locator("#beam-status").innerText(),
    "Load B dips",
  );
  await fallback.screenshot({ path: "artifacts/diagram-fallback.png" });
  await fallback.close();
  assert.deepEqual(errors, [], "no unhandled browser errors");
  assert.deepEqual(external, [], "all runtime resources are local");
  console.log(
    "PASS: real-mesh and tag dragging; all crossing limits; reverse-view drag; 360° orbit; load sliders; keyboard controls; persistence; cancellation; model settings; small screens; touch; WebGL/storage fallback; local-only assets.",
  );
} finally {
  await browser.close();
  server?.kill();
}
