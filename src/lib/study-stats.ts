import "server-only";
import { addDays, addWeeks, addMonths } from "date-fns";
import { db } from "@/lib/db";
import { Prisma } from "@/generated/prisma";
import {
  jstDayRange,
  jstWeekRange,
  jstMonthRange,
  jstTrailingDaysRange,
  jstEachDayStart,
  formatJstMonthDay,
  isSameJstDay,
  type DateRange as JstDateRange,
} from "@/lib/jst";

export type DateRange = JstDateRange;
export type HistoryRange = "day" | "week" | "month";

// 日付境界は日本時間(Asia/Tokyo)基準にそろえる(jst.ts参照。本番サーバーTZがUTCのため、
// date-fnsのstartOfDay等のサーバーローカルTZ基準をそのまま使うと最大9時間ずれる)。
export function dayRange(reference: Date): DateRange {
  return jstDayRange(reference);
}

// 週の起点は月曜(REQUIREMENTS.md未規定のため実装裁量。ウィジェット・履歴・比較画面で統一)。
export function weekRange(reference: Date): DateRange {
  return jstWeekRange(reference);
}

export function monthRange(reference: Date): DateRange {
  return jstMonthRange(reference);
}

export function resolveRange(range: HistoryRange, reference: Date): DateRange {
  if (range === "day") return dayRange(reference);
  if (range === "week") return weekRange(reference);
  return monthRange(reference);
}

// reference は常にJST深夜0時にそろえた実時刻として渡ってくる前提。JSTは年間+09:00固定(DST無し)
// なので、date-fnsのaddDays/addWeeks/addMonths(サーバーローカルTZ基準の暦計算)で日/週/月を
// 移動しても、UTC等の固定オフセットサーバーであればJST深夜0時のそろえは崩れない。
export function shiftReference(range: HistoryRange, reference: Date, direction: 1 | -1): Date {
  if (range === "day") return addDays(reference, direction);
  if (range === "week") return addWeeks(reference, direction);
  return addMonths(reference, direction);
}

// 当日を含む直近 N 日間。比較詳細画面の「30日間」トレンドのように、
// カレンダー境界ではなく常に今日で終わるローリング窓が欲しい場面で使う。
export function trailingDaysRange(days: number, now: Date = new Date()): DateRange {
  return jstTrailingDaysRange(days, now);
}

const sessionSelect = {
  id: true,
  startedAt: true,
  durationSeconds: true,
  tags: { select: { tag: { select: { id: true, name: true } } } },
} satisfies Prisma.StudySessionSelect;

export type ConfirmedSession = Prisma.StudySessionGetPayload<{ select: typeof sessionSelect }>;

// 確定済み(durationSeconds が入っている)セッションのみを対象にする。
// 日付の集計基準は startedAt(勉強を始めた日)に統一する。
async function findConfirmedSessions(userId: string, { start, end }: DateRange): Promise<ConfirmedSession[]> {
  return db.studySession.findMany({
    where: {
      userId,
      startedAt: { gte: start, lte: end },
      durationSeconds: { not: null },
    },
    select: sessionSelect,
    orderBy: { startedAt: "asc" },
  });
}

// 期間合計のみを求める軽量版(比較ウィジェットの「きょう/こんしゅう」表示用)。
// DailyAggregate はセッション確定のたびに upsert される新しい仕組みで、導入以前の
// 日付には行が無い可能性があるため、正しさを優先し常に StudySession を直接集計する。
export async function getTotalSeconds(userId: string, range: DateRange): Promise<number> {
  const result = await db.studySession.aggregate({
    where: {
      userId,
      startedAt: { gte: range.start, lte: range.end },
      durationSeconds: { not: null },
    },
    _sum: { durationSeconds: true },
  });
  return result._sum.durationSeconds ?? 0;
}

export async function getTodaySeconds(userId: string, now: Date = new Date()): Promise<number> {
  return getTotalSeconds(userId, dayRange(now));
}

export async function getThisWeekSeconds(userId: string, now: Date = new Date()): Promise<number> {
  return getTotalSeconds(userId, weekRange(now));
}

// 期間を問わない累計版(全期間の「これまでの合計」表示用)。getTotalSeconds と同じく
// StudySession を直接集計する(DailyAggregate は導入以前の日付を持たないため)。
export async function getAllTimeSeconds(userId: string): Promise<number> {
  const result = await db.studySession.aggregate({
    where: { userId, durationSeconds: { not: null } },
    _sum: { durationSeconds: true },
  });
  return result._sum.durationSeconds ?? 0;
}

export type DailyPoint = { date: Date; label: string; totalSeconds: number };
export type TagBreakdownPoint = { tagId: string; tagName: string; totalSeconds: number };

export type PeriodSummary = {
  totalSeconds: number;
  sessions: ConfirmedSession[];
  dailyBreakdown: DailyPoint[];
  tagBreakdown: TagBreakdownPoint[];
};

const NO_TAG_ID = "__no_tag__";
const NO_TAG_LABEL = "タグなし";

// タグは1セッションに複数付けられる(多対多)。「時間配分」の円グラフにすると
// 重複計上で合計が100%を超え誤解を招くため、内訳はタグごとの実時間を横棒グラフで見せる方針とし、
// ここでは各タグへセッションの全時間を計上する(Toggl等のタグ別レポートと同じ考え方)。
function buildTagBreakdown(sessions: ConfirmedSession[]): TagBreakdownPoint[] {
  const tagTotals = new Map<string, TagBreakdownPoint>();
  for (const session of sessions) {
    const duration = session.durationSeconds ?? 0;
    const tags = session.tags.length > 0 ? session.tags.map((t) => t.tag) : [{ id: NO_TAG_ID, name: NO_TAG_LABEL }];
    for (const tag of tags) {
      const existing = tagTotals.get(tag.id);
      tagTotals.set(tag.id, {
        tagId: tag.id,
        tagName: tag.name,
        totalSeconds: (existing?.totalSeconds ?? 0) + duration,
      });
    }
  }
  return Array.from(tagTotals.values()).sort((a, b) => b.totalSeconds - a.totalSeconds);
}

// 期間内のセッションを一度だけ取得し、合計・日別・タグ別の内訳をまとめて算出する
// (可視化画面・比較詳細画面のどちらも同じ形の集計を複数回に分けて問い合わせずに済むように)。
export async function getPeriodSummary(userId: string, range: DateRange): Promise<PeriodSummary> {
  const sessions = await findConfirmedSessions(userId, range);
  const totalSeconds = sessions.reduce((sum, s) => sum + (s.durationSeconds ?? 0), 0);

  const days = jstEachDayStart(range);
  const dailyBreakdown: DailyPoint[] = days.map((date) => ({
    date,
    label: formatJstMonthDay(date),
    totalSeconds: sessions
      .filter((s) => isSameJstDay(s.startedAt, date))
      .reduce((sum, s) => sum + (s.durationSeconds ?? 0), 0),
  }));

  const tagBreakdown = buildTagBreakdown(sessions);

  return { totalSeconds, sessions, dailyBreakdown, tagBreakdown };
}

export type AllTimeSummary = {
  totalSeconds: number;
  tagBreakdown: TagBreakdownPoint[];
};

// 累計タブ用: 期間を絞らず全確定セッションを集計する(日別内訳は対象外)。
export async function getAllTimeSummary(userId: string): Promise<AllTimeSummary> {
  const sessions = await db.studySession.findMany({
    where: { userId, durationSeconds: { not: null } },
    select: sessionSelect,
    orderBy: { startedAt: "asc" },
  });
  const totalSeconds = sessions.reduce((sum, s) => sum + (s.durationSeconds ?? 0), 0);
  const tagBreakdown = buildTagBreakdown(sessions);

  return { totalSeconds, tagBreakdown };
}
