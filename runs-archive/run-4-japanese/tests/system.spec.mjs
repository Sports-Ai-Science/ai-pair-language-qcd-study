// System tests via Playwright. Uses node:test runner with Playwright API
// directly (no Playwright test runner) so we stay on a single test stack.
import { test } from "node:test";
import { strict as assert } from "node:assert";
import { chromium } from "playwright";
import { fileURLToPath, pathToFileURL } from "node:url";
import { dirname, resolve } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const indexUrl = pathToFileURL(resolve(here, "..", "src", "index.html")).href;

async function withPage(fn) {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    locale: "en-US",
    timezoneId: "Asia/Tokyo",
  });
  const page = await context.newPage();
  try {
    await page.goto(indexUrl);
    await page.waitForSelector("#display");
    await fn(page);
  } finally {
    await browser.close();
  }
}

// AC-10: local launch via file:// — page renders within 5 s and is interactive
test("AC-10 local launch via file:// shows calculator UI within 5 s", async () => {
  const t0 = Date.now();
  await withPage(async (page) => {
    await page.locator('[data-key="1"]').waitFor({ timeout: 5000 });
    const elapsed = Date.now() - t0;
    assert.ok(elapsed < 5000, `Took ${elapsed}ms, exceeds 5 s budget`);
    const display = await page.locator("#display").textContent();
    assert.equal(display.trim(), "0");
  });
});

// AC-08: keyboard input
test("AC-08 keyboard: 1+2= produces 3", async () => {
  await withPage(async (page) => {
    await page.keyboard.type("1+2");
    await page.keyboard.press("Enter");
    await page.waitForFunction(
      () => document.getElementById("display").textContent.trim() === "3"
    );
    const display = await page.locator("#display").textContent();
    assert.equal(display.trim(), "3");
  });
});

// AC-08: backspace key deletes last char
test("AC-08 keyboard: Backspace deletes", async () => {
  await withPage(async (page) => {
    await page.keyboard.type("123");
    await page.keyboard.press("Backspace");
    const display = await page.locator("#display").textContent();
    assert.equal(display.trim(), "12");
  });
});

// AC-08: Escape clears display
test("AC-08 keyboard: Escape clears", async () => {
  await withPage(async (page) => {
    await page.keyboard.type("999");
    await page.keyboard.press("Escape");
    const display = await page.locator("#display").textContent();
    assert.equal(display.trim(), "0");
  });
});

// Cross-AC system: button click flow
test("system: click 7 * 8 = produces 56", async () => {
  await withPage(async (page) => {
    await page.locator('[data-key="7"]').click();
    await page.locator('[data-key="*"]').click();
    await page.locator('[data-key="8"]').click();
    await page.locator('[data-key="="]').click();
    await page.waitForFunction(
      () => document.getElementById("display").textContent.trim() === "56"
    );
  });
});

// History entry visible after evaluation
test("system: history list shows last evaluation", async () => {
  await withPage(async (page) => {
    await page.keyboard.type("3+4");
    await page.keyboard.press("Enter");
    // Wait for the result to appear in display (proves evaluate ran)
    await page.waitForFunction(
      () => document.getElementById("display").textContent.trim() === "7"
    );
    // Then assert history item is rendered
    const liText = await page.locator("#history li").first().textContent();
    assert.match(liText, /3\+4 = 7/);
  });
});

// Mode toggle (DEG vs RAD) changes computation. Use keyboard "d" for mode
// toggle to avoid focus race between button click and subsequent typing.
test("system: DEG mode makes sin(90)=1", async () => {
  await withPage(async (page) => {
    // Press "d" to toggle to DEG (default is RAD; one press flips it).
    await page.keyboard.press("d");
    // Click sin button to append "sin(" then type the operand and close.
    await page.locator('[data-key="sin"]').click();
    // Wait for the click effect to land in display before typing.
    await page.waitForFunction(
      () => document.getElementById("display").textContent.includes("sin(")
    );
    await page.keyboard.type("90)");
    await page.keyboard.press("Enter");
    await page.waitForFunction(() => {
      const t = document.getElementById("display").textContent.trim();
      return t !== "" && t !== "0" && !t.startsWith("sin");
    });
    const display = (await page.locator("#display").textContent()).trim();
    const value = parseFloat(display);
    assert.ok(Math.abs(value - 1) < 1e-9, `Got '${display}'`);
  });
});
