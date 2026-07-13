// 日本時間(Asia/Tokyo)基準の日付ユーティリティ。
// Vercel本番のサーバーTZはUTCのため、date-fnsのstartOfDay等(サーバーローカルTZ基準)を
// そのまま使うと「きょう」「こんしゅう」の境界や表示時刻が最大9時間ずれる。
// ここでは常にAsia/Tokyoを明示指定するIntlベースの変換を使い、サーバーの実行環境TZに依存しない。
// JSTには夏時間(DST)が無く年間を通して+09:00固定なので、深夜0時を起点にした
// 24時間単位のミリ秒加減算は常に正しくJSTの暦日境界と一致する(jstAddDays参照)。

const JST_DATE_KEY_FORMATTER = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Tokyo",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

const JST_PARTS_FORMATTER = new Intl.DateTimeFormat("ja-JP", {
  timeZone: "Asia/Tokyo",
  year: "numeric",
  month: "numeric",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
  hour12: false,
  weekday: "short",
});

const JST_WEEKDAY_INDEX: Record<string, number> = { 日: 0, 月: 1, 火: 2, 水: 3, 木: 4, 金: 5, 土: 6 };

export type DateRange = { start: Date; end: Date };

type JstParts = {
  year: number;
  month: number; // 1-12
  day: number;
  hour: number;
  minute: string; // 2桁ゼロ埋め文字列("05"等)のまま保持
  weekday: string; // 「日」「月」…
};

function jstParts(date: Date): JstParts {
  const parts = JST_PARTS_FORMATTER.formatToParts(date);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  return {
    year: Number(get("year")),
    month: Number(get("month")),
    day: Number(get("day")),
    hour: Number(get("hour")),
    minute: get("minute"),
    weekday: get("weekday"),
  };
}

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

/** 指定時刻(省略時は現在)の日本時間での日付を "YYYY-MM-DD" 形式で返す。 */
export function jstDateKey(date: Date = new Date()): string {
  return JST_DATE_KEY_FORMATTER.format(date);
}

/** "YYYY-MM-DD"(日本時間の暦日)から、その日のJST深夜0時ちょうどの実時刻を作る。 */
export function jstMidnightFromKey(key: string): Date {
  return new Date(`${key}T00:00:00+09:00`);
}

/** 指定時刻を含む日本時間の暦日の、深夜0時ちょうどの実時刻。 */
export function startOfJstDay(date: Date = new Date()): Date {
  return jstMidnightFromKey(jstDateKey(date));
}

/** 指定時刻を含む日本時間の暦日の、23:59:59.999の実時刻。 */
export function endOfJstDay(date: Date = new Date()): Date {
  return new Date(startOfJstDay(date).getTime() + 24 * 60 * 60 * 1000 - 1);
}

function jstAddDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
}

const WEEK_STARTS_ON = 1; // 月曜(study-stats.tsの既存仕様に合わせる)

/** 指定時刻を含む日本時間の暦日1日分の範囲。 */
export function jstDayRange(reference: Date = new Date()): DateRange {
  const start = startOfJstDay(reference);
  return { start, end: new Date(jstAddDays(start, 1).getTime() - 1) };
}

/** 指定時刻を含む日本時間の週(月曜始まり)の範囲。 */
export function jstWeekRange(reference: Date = new Date()): DateRange {
  const weekdayIndex = JST_WEEKDAY_INDEX[jstParts(reference).weekday] ?? 0;
  const diffToMonday = (weekdayIndex - WEEK_STARTS_ON + 7) % 7;
  const start = jstAddDays(startOfJstDay(reference), -diffToMonday);
  return { start, end: new Date(jstAddDays(start, 7).getTime() - 1) };
}

/** 指定時刻を含む日本時間の暦月の範囲。 */
export function jstMonthRange(reference: Date = new Date()): DateRange {
  const { year, month } = jstParts(reference);
  const start = jstMidnightFromKey(`${year}-${pad2(month)}-01`);
  const nextMonthStart =
    month === 12
      ? jstMidnightFromKey(`${year + 1}-01-01`)
      : jstMidnightFromKey(`${year}-${pad2(month + 1)}-01`);
  return { start, end: new Date(nextMonthStart.getTime() - 1) };
}

/** 当日を含む直近N日間(日本時間基準のローリング窓)。 */
export function jstTrailingDaysRange(days: number, reference: Date = new Date()): DateRange {
  return {
    start: startOfJstDay(jstAddDays(reference, -(days - 1))),
    end: endOfJstDay(reference),
  };
}

// date-fnsのeachDayOfIntervalはサーバーのローカルTZ基準でstartOfDay等を再計算してしまい、
// JST深夜0時にそろえたrange.startとズレる恐れがある(サーバーTZがJST以外の場合)ため使わない。
// range.startが既にJST深夜0時の実時刻である前提で、24時間刻みに素直に足していく。
/** JST日境界にそろえたrangeの、各日の深夜0時ちょうどの実時刻の配列(rangeはstartがJST深夜0時である前提)。 */
export function jstEachDayStart(range: DateRange): Date[] {
  const days: Date[] = [];
  let cur = range.start;
  while (cur.getTime() <= range.end.getTime()) {
    days.push(cur);
    cur = jstAddDays(cur, 1);
  }
  return days;
}

/** 指定時刻を日本時間の "H:mm" で表示する(例: "8:05")。 */
export function formatJstTime(date: Date): string {
  const p = jstParts(date);
  return `${p.hour}:${p.minute}`;
}

/** 指定時刻を日本時間の "M/d" で表示する(グラフの日別ラベル等)。 */
export function formatJstMonthDay(date: Date): string {
  const p = jstParts(date);
  return `${p.month}/${p.day}`;
}

/** 指定時刻を日本時間の "M月d日" で表示する。 */
export function formatJstMonthDayJa(date: Date): string {
  const p = jstParts(date);
  return `${p.month}月${p.day}日`;
}

/** 指定時刻を日本時間の "yyyy年M月" で表示する。 */
export function formatJstYearMonth(date: Date): string {
  const p = jstParts(date);
  return `${p.year}年${p.month}月`;
}

/** 指定時刻を日本時間の "yyyy年M月d日(E)" で表示する(例: "2026年1月6日(火)")。 */
export function formatJstLongDate(date: Date): string {
  const p = jstParts(date);
  return `${p.year}年${p.month}月${p.day}日(${p.weekday})`;
}

/** 2つの時刻が同じ日本時間の暦日かどうか。 */
export function isSameJstDay(a: Date, b: Date): boolean {
  return jstDateKey(a) === jstDateKey(b);
}
