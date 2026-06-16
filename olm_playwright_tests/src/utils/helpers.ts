import fs from 'fs';
import path from 'path';
import type { Locator, Page } from '@playwright/test';

export class Timer {
  private readonly start = performance.now();

  elapsed(): number {
    return Math.round((performance.now() - this.start) / 10) / 100;
  }

  static fmt(seconds: number): string {
    const s = Math.floor(seconds);
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sc = s % 60;
    if (h) return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(sc).padStart(2, '0')}`;
    return `${String(m).padStart(2, '0')}:${String(sc).padStart(2, '0')}`;
  }
}

export function parseOlmData(filepath: string): Record<number, string[]> {
  const lessonsByGrade: Record<number, string[]> = {};
  for (let i = 1; i <= 12; i++) lessonsByGrade[i] = [];

  if (!fs.existsSync(filepath)) {
    console.log(`Không tìm thấy file dữ liệu tại: ${filepath}`);
    return lessonsByGrade;
  }

  let currentGrade: number | null = null;
  const content = fs.readFileSync(filepath, 'utf-8');

  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    const gradeMatch = trimmed.match(/^# Lớp\s+(\d+)/);
    if (gradeMatch) {
      currentGrade = parseInt(gradeMatch[1], 10);
      continue;
    }
    if (trimmed.startsWith('- [ ]') && currentGrade && lessonsByGrade[currentGrade]) {
      const linkMatch = trimmed.match(/\]\((https?:\/\/olm\.vn\/chu-de\/[^\s)]+)\)/);
      if (linkMatch) {
        const url = linkMatch[1];
        if (!lessonsByGrade[currentGrade].includes(url)) {
          lessonsByGrade[currentGrade].push(url);
        }
      }
    }
  }

  return lessonsByGrade;
}

export async function scrollToBottom(page: Page, pauseMs = 800): Promise<void> {
  let last = await page.evaluate(() => document.body.scrollHeight);
  while (true) {
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(pauseMs);
    const now = await page.evaluate(() => document.body.scrollHeight);
    if (now === last) break;
    last = now;
  }
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(300);
}

export async function safeClick(page: Page, locator: Locator): Promise<void> {
  try {
    await locator.scrollIntoViewIfNeeded();
    await page.waitForTimeout(300);
    await locator.click({ force: true });
  } catch {
    // ignore
  }
}

export async function createStealthContext(page: Page): Promise<void> {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
    Object.defineProperty(navigator, 'plugins', { get: () => [1, 2, 3, 4, 5] });
    Object.defineProperty(navigator, 'languages', {
      get: () => ['vi-VN', 'vi', 'en-US', 'en'],
    });
  });
}

export function humanDelay(minSec = 1.2, maxSec = 3.8): number {
  return Math.random() * (maxSec - minSec) + minSec;
}
