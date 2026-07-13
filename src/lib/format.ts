// 勉強時間の表示フォーマット(秒 → 「1時間15分」等)。
// クライアントコンポーネント(recharts)からも使うため server-only にはしない。

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
