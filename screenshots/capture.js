const { chromium } = require('playwright');
const path = require('path');
const outDir = __dirname;
const BASE = 'http://localhost:8082';

async function openPage(browser) {
  const page = await browser.newPage();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(BASE, { waitUntil: 'networkidle', timeout: 30000 });
  // wait for the app to fully render
  await page.locator('input[placeholder="New task..."]').waitFor({ timeout: 15000 });
  await page.waitForTimeout(1000);
  return page;
}

async function addTodo(page, title, prio = 1) {
  // prio: 0=Low, 1=Med, 2=High
  const prioLabels = ['Low', 'Med', 'High'];
  const input = page.locator('input[placeholder="New task..."]');
  await input.click();
  await input.fill(title);
  // click priority
  await page.getByText(prioLabels[prio], { exact: true }).first().click();
  await page.waitForTimeout(150);
  await input.press('Enter');
  // wait for the task count to update (or just wait)
  await page.waitForTimeout(700);
}

async function shot(page, name) {
  await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(outDir, `${name}.png`) });
  console.log(`✓ ${name}.png`);
}

async function toggleTheme(page) {
  // Theme button is top-right corner — sun/moon icon
  await page.mouse.click(367, 47);
  await page.waitForTimeout(500);
}

(async () => {
  const browser = await chromium.launch({ headless: true });

  // ── 1. Dark – Empty state ──────────────────────────────────────────
  {
    const page = await openPage(browser);
    await shot(page, '01_dark_empty');
    await page.close();
  }

  // ── 2. Dark – List with tasks ──────────────────────────────────────
  {
    const page = await openPage(browser);
    await addTodo(page, 'Design landing page', 2);
    await addTodo(page, 'Fix auth bug', 2);
    await addTodo(page, 'Write unit tests', 1);
    await addTodo(page, 'Update documentation', 0);
    await addTodo(page, 'Deploy to production', 2);
    // wait for all to render
    await page.waitForFunction(() => {
      const nums = document.querySelectorAll('*');
      for (const el of nums) {
        if (el.textContent === '5' && el.children.length === 0) return true;
      }
      return false;
    }, { timeout: 5000 }).catch(() => page.waitForTimeout(1000));
    await shot(page, '02_dark_list_with_tasks');
    await page.close();
  }

  // ── 3. Dark – filter Active ────────────────────────────────────────
  {
    const page = await openPage(browser);
    await addTodo(page, 'Design landing page', 2);
    await addTodo(page, 'Fix auth bug', 2);
    await addTodo(page, 'Write unit tests', 1);
    await page.getByText('Active', { exact: true }).first().click();
    await page.waitForTimeout(400);
    await shot(page, '03_dark_filter_active');
    await page.close();
  }

  // ── 4. Dark – Calendar view ────────────────────────────────────────
  {
    const page = await openPage(browser);
    await addTodo(page, 'Morning standup', 0);
    await addTodo(page, 'Code review', 1);
    await addTodo(page, 'Deploy hotfix', 2);
    await page.getByText('Calendar', { exact: true }).first().click();
    await page.waitForTimeout(1000);
    await shot(page, '04_dark_calendar');
    await page.close();
  }

  // ── 5. Add todo – input focused with text & High priority ──────────
  {
    const page = await openPage(browser);
    await addTodo(page, 'Design landing page', 2);
    await addTodo(page, 'Fix auth bug', 1);
    const input = page.locator('input[placeholder="New task..."]');
    await input.fill('Plan quarterly review');
    await page.getByText('High', { exact: true }).first().click();
    await page.waitForTimeout(300);
    await shot(page, '05_dark_add_input');
    await page.close();
  }

  // ── 6. Dark – Done filter (empty) ─────────────────────────────────
  {
    const page = await openPage(browser);
    await addTodo(page, 'Design landing page', 2);
    await addTodo(page, 'Fix auth bug', 1);
    await page.getByText('Done', { exact: true }).first().click();
    await page.waitForTimeout(400);
    await shot(page, '06_dark_filter_done_empty');
    await page.close();
  }

  // ── 7. Light – Empty state ─────────────────────────────────────────
  {
    const page = await openPage(browser);
    await toggleTheme(page);
    await shot(page, '07_light_empty');
    await page.close();
  }

  // ── 8. Light – List with tasks ─────────────────────────────────────
  {
    const page = await openPage(browser);
    await toggleTheme(page);
    await addTodo(page, 'Review design specs', 1);
    await addTodo(page, 'Team meeting at 3pm', 0);
    await addTodo(page, 'Submit weekly report', 2);
    await page.waitForTimeout(800);
    await shot(page, '08_light_list_with_tasks');
    await page.close();
  }

  // ── 9. Light – Calendar ────────────────────────────────────────────
  {
    const page = await openPage(browser);
    await toggleTheme(page);
    await addTodo(page, 'Morning standup', 0);
    await addTodo(page, 'Sprint planning', 1);
    await page.getByText('Calendar', { exact: true }).first().click();
    await page.waitForTimeout(1000);
    await shot(page, '09_light_calendar');
    await page.close();
  }

  await browser.close();
  console.log('\nAll screenshots saved to:', outDir);
})();
