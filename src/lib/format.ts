// 勉強時間の表示フォーマット(秒 → 「1時間15分」等)。
// クライアントコンポーネント(recharts)からも使うため server-only にはしない。

import { formatJstMonthDayJa } from "@/lib/jst";

export function formatDurationShort(totalSeconds: number): string {
  const totalMinutes = Math.round(Math.max(0, totalSeconds) / 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours === 0) return `${minutes}分`;
  if (minutes === 0) return `${hours}時間`;
  return `${hours}時間${minutes}分`;
}

// REQUIREMENTS.md 3-6節の表記例(「+15分」)に合わせ、符号付きだが煽らないトーンで淡々と表示する。
export function formatDiffMinutes(diffSeconds: number): string {
  const diffMinutes = Math.round(diffSeconds / 60);
  if (diffMinutes === 0) return "0分";
  const sign = diffMinutes > 0 ? "+" : "-";
  return `${sign}${Math.abs(diffMinutes)}分`;
}

// ログイン履歴(比較詳細画面)の相対時刻表示。1週間以上前は絶対日付にフォールバックする。
export function formatRelativeJa(date: Date, now: Date = new Date()): string {
  const diffMs = Math.max(0, now.getTime() - date.getTime());
  const diffMinutes = Math.floor(diffMs / 60_000);
  if (diffMinutes < 1) return "たったいま";
  if (diffMinutes < 60) return `${diffMinutes}分前`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}時間前`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}日前`;
  return formatJstMonthDayJa(date);
}
