// 日本時間(Asia/Tokyo)基準の日付ユーティリティ。
// 既存の study-stats.ts は date-fns の startOfDay(=サーバープロセスのローカルTZ)基準だが、
// Vercel 本番のサーバーTZはUTCのため、そのままでは「きょう」が9時間ずれる。
// 「きょうのきぶん」はJSTの深夜0時リセットを保証したいので、サーバーTZに依存しないこちらを使う。
const JST_DATE_FORMATTER = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Tokyo",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

/** 指定時刻(省略時は現在)の日本時間での日付を "YYYY-MM-DD" 形式で返す。 */
export function jstDateKey(date: Date = new Date()): string {
  return JST_DATE_FORMATTER.format(date);
}
