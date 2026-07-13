import Link from "next/link";
import { format, parseISO, isValid } from "date-fns";
import { ja } from "date-fns/locale";
import { getCurrentUser } from "@/lib/dal";
import {
  resolveRange,
  shiftReference,
  getPeriodSummary,
  getAllTimeSummary,
  type HistoryRange,
  type PeriodSummary,
} from "@/lib/study-stats";
import { formatDurationShort } from "@/lib/format";
import { RIBBON_COLOR_HEX, PALETTE } from "@/lib/theme";
import TimeSeriesBarChart from "@/components/charts/TimeSeriesBarChart";
import TagBreakdownChart from "@/components/charts/TagBreakdownChart";

// "all" は日/週/月と違い期間ナビゲーションを持たない累計タブ(study-stats.tsのHistoryRangeには含めない。
// resolveRange/shiftReference は日付範囲を前提とするため、こちらの画面内だけの表示用区分として扱う)。
type ViewRange = HistoryRange | "all";

const VALID_RANGES: HistoryRange[] = ["day", "week", "month"];
const VALID_VIEW_RANGES: ViewRange[] = [...VALID_RANGES, "all"];
const RANGE_LABELS: Record<ViewRange, string> = { day: "日", week: "週", month: "月", all: "累計" };
const TODAY_LABELS: Record<HistoryRange, string> = { day: "きょうへ", week: "こんしゅうへ", month: "こんげつへ" };

function parseRange(value: string | string[] | undefined): ViewRange {
  const v = Array.isArray(value) ? value[0] : value;
  return (VALID_VIEW_RANGES as string[]).includes(v ?? "") ? (v as ViewRange) : "week";
}

function parseReferenceDate(value: string | string[] | undefined): Date {
  const v = Array.isArray(value) ? value[0] : value;
  if (!v) return new Date();
  const parsed = parseISO(v);
  return isValid(parsed) ? parsed : new Date();
}

function buildHref(range: ViewRange, date?: Date) {
  const params = new URLSearchParams({ range });
  if (date) params.set("date", format(date, "yyyy-MM-dd"));
  return `/history?${params.toString()}`;
}

function periodLabel(range: HistoryRange, referenceDate: Date, start: Date, end: Date) {
  if (range === "day") return format(referenceDate, "yyyy年M月d日(E)", { locale: ja });
  if (range === "week") {
    return `${format(start, "M月d日", { locale: ja })}〜${format(end, "M月d日", { locale: ja })}`;
  }
  return format(referenceDate, "yyyy年M月", { locale: ja });
}

export default async function HistoryPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string; date?: string }>;
}) {
  const params = await searchParams;
  const user = await getCurrentUser();
  const range = parseRange(params.range);
  const isAllTimeView = range === "all";
  const referenceDate = parseReferenceDate(params.date);

  let summary: { totalSeconds: number; tagBreakdown: { tagId: string; tagName: string; totalSeconds: number }[]; sessions: PeriodSummary["sessions"]; dailyBreakdown: PeriodSummary["dailyBreakdown"] };
  let periodRange: { start: Date; end: Date } | null = null;
  let prevHref = "";
  let nextHref = "";

  if (isAllTimeView) {
    const allTime = await getAllTimeSummary(user.id);
    summary = { ...allTime, sessions: [], dailyBreakdown: [] };
  } else {
    periodRange = resolveRange(range, referenceDate);
    summary = await getPeriodSummary(user.id, periodRange);
    prevHref = buildHref(range, shiftReference(range, referenceDate, -1));
    nextHref = buildHref(range, shiftReference(range, referenceDate, 1));
  }

  const isDayView = range === "day";
  const todayHref = buildHref(range);

  const accentColor = user.rabbit ? RIBBON_COLOR_HEX[user.rabbit.ribbonColor] : PALETTE.pinkDeep;
  const displayName = user.rabbit?.name ?? user.displayName;

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-4 p-4 pb-24">
      <header className="flex flex-col gap-1">
        <h1 className="text-lg font-bold text-charcoal">がくしゅうのきろく</h1>
        <p className="text-xs text-charcoal-soft">{displayName}のこれまで</p>
      </header>

      <nav className="flex gap-2" aria-label="期間の切り替え">
        {VALID_VIEW_RANGES.map((r) => (
          <Link
            key={r}
            href={buildHref(r)}
            className={`rounded-full px-4 py-1.5 text-sm font-bold transition ${
              r === range ? "bg-pink-deep text-charcoal" : "bg-pink/40 text-charcoal-soft hover:bg-pink/60"
            }`}
          >
            {RANGE_LABELS[r]}
          </Link>
        ))}
      </nav>

      {periodRange && (
        <div className="flex items-center justify-between rounded-2xl border border-pink-deep/20 bg-milk px-3 py-2 shadow-sm">
          <Link
            href={prevHref}
            aria-label="前の期間へ"
            className="rounded-full px-3 py-1.5 text-lg text-charcoal-soft hover:bg-pink/30"
          >
            ‹
          </Link>
          <div className="flex flex-col items-center gap-0.5">
            <span className="text-sm font-bold text-charcoal">
              {periodLabel(range as HistoryRange, referenceDate, periodRange.start, periodRange.end)}
            </span>
            <Link href={todayHref} className="text-[11px] text-charcoal-soft underline underline-offset-2">
              {TODAY_LABELS[range as HistoryRange]}
            </Link>
          </div>
          <Link
            href={nextHref}
            aria-label="次の期間へ"
            className="rounded-full px-3 py-1.5 text-lg text-charcoal-soft hover:bg-pink/30"
          >
            ›
          </Link>
        </div>
      )}

      <section className="rounded-2xl bg-pink/30 p-4 text-center shadow-sm">
        <p className="text-xs font-bold text-charcoal-soft">{isAllTimeView ? "これまでのごうけい" : "ごうけい"}</p>
        <p className="text-3xl font-bold text-charcoal">{formatDurationShort(summary.totalSeconds)}</p>
      </section>

      {summary.totalSeconds === 0 ? (
        <p className="rounded-2xl border border-pink-deep/20 bg-milk p-4 text-center text-sm text-charcoal-soft">
          {isAllTimeView ? "まだ記録がありません。" : "この期間の記録はまだありません。"}
        </p>
      ) : (
        <>
          {!isDayView && !isAllTimeView && (
            <section className="rounded-2xl border border-pink-deep/20 bg-milk p-4 shadow-sm">
              <h2 className="mb-2 text-sm font-bold text-charcoal">日ごとの勉強時間</h2>
              <TimeSeriesBarChart
                data={summary.dailyBreakdown.map((d) => ({ label: d.label, seconds: d.totalSeconds }))}
                series={[{ key: "seconds", name: displayName, color: accentColor }]}
              />
              <details className="mt-2 text-xs text-charcoal-soft">
                <summary className="cursor-pointer select-none">表で見る</summary>
                <table className="mt-2 w-full text-left">
                  <thead>
                    <tr className="border-b border-pink-deep/20">
                      <th className="py-1 font-bold text-charcoal">日付</th>
                      <th className="py-1 font-bold text-charcoal">勉強時間</th>
                    </tr>
                  </thead>
                  <tbody>
                    {summary.dailyBreakdown.map((d) => (
                      <tr key={d.label} className="border-b border-pink-deep/10">
                        <td className="py-1">{d.label}</td>
                        <td className="py-1">{formatDurationShort(d.totalSeconds)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </details>
            </section>
          )}

          {summary.tagBreakdown.length > 0 && (
            <section className="rounded-2xl border border-pink-deep/20 bg-milk p-4 shadow-sm">
              <h2 className="mb-2 text-sm font-bold text-charcoal">タグ別の内訳</h2>
              <TagBreakdownChart data={summary.tagBreakdown} color={accentColor} />
              <details className="mt-2 text-xs text-charcoal-soft">
                <summary className="cursor-pointer select-none">表で見る</summary>
                <table className="mt-2 w-full text-left">
                  <thead>
                    <tr className="border-b border-pink-deep/20">
                      <th className="py-1 font-bold text-charcoal">タグ</th>
                      <th className="py-1 font-bold text-charcoal">勉強時間</th>
                    </tr>
                  </thead>
                  <tbody>
                    {summary.tagBreakdown.map((t) => (
                      <tr key={t.tagId} className="border-b border-pink-deep/10">
                        <td className="py-1">{t.tagName}</td>
                        <td className="py-1">{formatDurationShort(t.totalSeconds)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </details>
            </section>
          )}

          {isDayView && (
            <section className="rounded-2xl border border-pink-deep/20 bg-milk p-4 shadow-sm">
              <h2 className="mb-2 text-sm font-bold text-charcoal">この日のセッション</h2>
              <ul className="flex flex-col gap-2">
                {summary.sessions.map((s) => (
                  <li
                    key={s.id}
                    className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 rounded-xl bg-pink/20 px-3 py-2 text-sm"
                  >
                    <span className="text-charcoal-soft">{format(s.startedAt, "H:mm")}〜</span>
                    <span className="font-bold text-charcoal">{formatDurationShort(s.durationSeconds ?? 0)}</span>
                    <span className="text-xs text-charcoal-soft">
                      {s.tags.length > 0 ? s.tags.map((t) => t.tag.name).join(" / ") : "タグなし"}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </>
      )}
    </div>
  );
}
