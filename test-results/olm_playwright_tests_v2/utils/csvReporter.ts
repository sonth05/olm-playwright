import fs from 'fs';
import path from 'path';
import type {
  FullConfig,
  FullResult,
  Reporter,
  Suite,
  TestCase,
  TestResult,
} from '@playwright/test/reporter';

interface CsvRow {
  testName: string;
  status: string;
  startTime: string;
  durationSec: string;
  errorMessage: string;
  screenshotPath: string;
  videoPath: string;
}

export default class CsvReporter implements Reporter {
  private rows: CsvRow[] = [];
  private runId = '';
  private csvPath = '';
  private reportsDir = '';

  onBegin(_config: FullConfig, _suite: Suite): void {
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    this.runId = [
      pad(now.getDate()),
      pad(now.getMonth() + 1),
      now.getFullYear(),
      pad(now.getHours()),
      pad(now.getMinutes()),
      pad(now.getSeconds()),
    ].join('-');
    this.reportsDir = path.join(process.cwd(), 'reports');
    fs.mkdirSync(this.reportsDir, { recursive: true });
    this.csvPath = path.join(this.reportsDir, `test_report_${this.runId}.csv`);
    fs.writeFileSync(
      this.csvPath,
      'test_name,status,start_time,duration_sec,error_message,screenshot_path,video_path\n',
      'utf-8'
    );
  }

  onTestEnd(test: TestCase, result: TestResult): void {
    const screenshot = result.attachments.find((a) => a.name === 'screenshot');
    const video = result.attachments.find((a) => a.name === 'video');
    const errorMessage =
      result.errors.map((e) => e.message?.replace(/\r?\n/g, ' ') ?? '').join(' ') || '';

    const row: CsvRow = {
      testName: test.title,
      status: result.status.toUpperCase(),
      startTime: new Date(result.startTime).toISOString().replace('T', ' ').slice(0, 19),
      durationSec: (result.duration / 1000).toFixed(2),
      errorMessage,
      screenshotPath: screenshot?.path ?? '',
      videoPath: video?.path ?? '',
    };
    this.rows.push(row);

    const line = [
      row.testName,
      row.status,
      row.startTime,
      row.durationSec,
      `"${row.errorMessage.replace(/"/g, '""')}"`,
      row.screenshotPath,
      row.videoPath,
    ].join(',');
    fs.appendFileSync(this.csvPath, line + '\n', 'utf-8');
  }

  onEnd(_result: FullResult): void {
    console.log(`\nBáo cáo CSV đã được lưu tại: ${this.csvPath}`);
  }
}
