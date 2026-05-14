// system.spec.mjs — system tests using Playwright Chromium against
// the page loaded over file://. Runs under `node --test`.
import { test } from "node:test";
import assert from "node:assert/strict";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const here = dirname(fileURLToPath(import.meta.url));
const PAGE_URL = "file://" + resolve(here, "..", "src", "index.html");
const READY_TIMEOUT_MS = 5000;

async function withPage(fn) {
  const browser = await chromium.launch();
  try {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    await page.goto(PAGE_URL);
    // AC-10 budget: UI must be visible within 5 seconds.
    await page.waitForSelector(".display-result", { state: "visible", timeout: READY_TIMEOUT_MS });
    await fn(page);
  } finally {
    await browser.close();
  }
}

test("AC-10 page loads from file:// and renders the calculator UI", async () => {
  await withPage(async (page) => {
    const display = await page.locator(".display-result").innerText();
    assert.equal(display, "0");
    // First operation succeeds: 2 + 3 = 5
    await page.locator(".btn[data-action='ins:2']").click();
    await page.locator(".btn[data-action='ins:+']").click();
    await page.locator(".btn[data-action='ins:3']").click();
    await page.locator(".btn[data-action='eq']").click();
    const result = await page.locator(".display-result").innerText();
    assert.equal(result, "5");
  });
});

test("AC-08 keyboard input drives the calculator", async () => {
  await withPage(async (page) => {
    await page.keyboard.type("12+30");
    await page.keyboard.press("Enter");
    const result = await page.locator(".display-result").innerText();
    assert.equal(result, "42");
  });
});

test("AC-08 Backspace and Escape keys behave correctly", async () => {
  await withPage(async (page) => {
    await page.keyboard.type("99");
    await page.keyboard.press("Backspace");
    await page.keyboard.press("Enter");
    let result = await page.locator(".display-result").innerText();
    assert.equal(result, "9");
    await page.keyboard.press("Escape");
    result = await page.locator(".display-result").innerText();
    assert.equal(result, "0");
  });
});

test("AC-09 division-by-zero shows an error in the UI", async () => {
  await withPage(async (page) => {
    await page.keyboard.type("1/0");
    await page.keyboard.press("Enter");
    const result = await page.locator(".display-result").innerText();
    assert.match(result, /Division by zero/);
  });
});

test("AC-07 history shows entries after evaluations", async () => {
  await withPage(async (page) => {
    await page.keyboard.type("1+1");
    await page.keyboard.press("Enter");
    await page.keyboard.press("Escape");
    await page.keyboard.type("2*3");
    await page.keyboard.press("Enter");
    const items = await page.locator(".history-item").count();
    assert.ok(items >= 2);
  });
});
