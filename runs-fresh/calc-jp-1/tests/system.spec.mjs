// system.spec.mjs — Playwright（Chromium）でブラウザシステムテストを行う
// AC-08（キーボード入力）と AC-10（file:// ダブルクリック起動 5 秒以内）を検証
import { test } from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { pathToFileURL, fileURLToPath } from "node:url";
import { chromium } from "playwright";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const INDEX_URL = pathToFileURL(path.resolve(__dirname, "..", "src", "index.html")).href;

async function withPage(fn) {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  try {
    await fn(page);
  } finally {
    await browser.close();
  }
}

// AC-10: file:// ダブルクリック起動で 5 秒以内に UI 描画 + 最初の演算
test("AC-10 file:// で 5 秒以内に UI 描画", async () => {
  await withPage(async (page) => {
    const t0 = Date.now();
    await page.goto(INDEX_URL);
    await page.waitForSelector("#display", { timeout: 5000 });
    const elapsed = Date.now() - t0;
    assert.ok(elapsed < 5000, `起動が 5 秒以内であること: ${elapsed}ms`);

    // 最初の演算: 1 + 2 = 3
    await page.click('[data-key="1"]');
    await page.click('[data-key="+"]');
    await page.click('[data-key="2"]');
    await page.click('[data-key="="]');
    const text = await page.textContent("#display");
    assert.equal(text, "3");
  });
});

// AC-08: キーボード入力で同じ計算ができる
test("AC-08 キーボード入力で 12*3 = 36", async () => {
  await withPage(async (page) => {
    await page.goto(INDEX_URL);
    await page.waitForSelector("#display");
    await page.keyboard.type("12*3");
    await page.keyboard.press("Enter");
    const text = await page.textContent("#display");
    assert.equal(text, "36");
  });
});

test("AC-08 Backspace で末尾削除", async () => {
  await withPage(async (page) => {
    await page.goto(INDEX_URL);
    await page.waitForSelector("#display");
    await page.keyboard.type("123");
    await page.keyboard.press("Backspace");
    const text = await page.textContent("#display");
    assert.equal(text, "12");
  });
});

test("AC-08 Escape で全クリア", async () => {
  await withPage(async (page) => {
    await page.goto(INDEX_URL);
    await page.waitForSelector("#display");
    await page.keyboard.type("999");
    await page.keyboard.press("Escape");
    const text = await page.textContent("#display");
    assert.equal(text, "0");
  });
});

// AC-09 のシステム経路: ゼロ除算で Error 表示
test("AC-09 ゼロ除算で表示が Error になる", async () => {
  await withPage(async (page) => {
    await page.goto(INDEX_URL);
    await page.waitForSelector("#display");
    await page.keyboard.type("1/0");
    await page.keyboard.press("Enter");
    const text = await page.textContent("#display");
    assert.equal(text, "Error");
  });
});
