/**
 * Script tự động học bài theo danh sách lessons-by-grade.json
 */
import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import { BASE_URL, HEADLESS } from '../config/config';
import { loadLessonsByGrade, PASSWORD, USERNAME } from '../config/testData';
import { LoginPage } from '@modules/dung-chung/auth/pages/LoginPage';
import { humanDelay } from '../utils/helpers';
import { LOGS_DIR } from '../config/config';

async function main(): Promise<void> {
  if (!fs.existsSync(LOGS_DIR)) fs.mkdirSync(LOGS_DIR, { recursive: true });
  const logFile = path.join(LOGS_DIR, `auto-learning-${Date.now()}.log`);

  const log = (msg: string): void => {
    const line = `[${new Date().toISOString()}] ${msg}`;
    console.log(line);
    fs.appendFileSync(logFile, line + '\n');
  };

  const lessons = loadLessonsByGrade();
  const browser = await chromium.launch({ headless: HEADLESS });
  const page = await browser.newPage();

  log('Đăng nhập...');
  const loginPage = new LoginPage(page);
  await loginPage.login(USERNAME, PASSWORD);

  for (const [grade, items] of Object.entries(lessons)) {
    if (!Array.isArray(items) || items.length === 0) continue;
    log(`Lớp ${grade}: ${items.length} mục`);

    for (const item of items) {
      const entry = item as { url?: string; title?: string };
      if (!entry.url) continue;
      const url = entry.url.startsWith('http') ? entry.url : `${BASE_URL}${entry.url}`;
      log(`  → ${entry.title ?? url}`);
      await page.goto(url, { waitUntil: 'domcontentloaded' });
      await humanDelay(1, 2);
    }
  }

  await browser.close();
  log(`Hoàn thành. Log: ${logFile}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
