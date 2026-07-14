import Link from "next/link";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/dal";
import { computeCurrentEnergy } from "@/lib/rabbit-status";
import { RIBBON_COLOR_HEX, PALETTE } from "@/lib/theme";
import Rabbit from "@/components/rabbit/Rabbit";
import {
  getPeriodSummary,
  getTodaySeconds,
  weekRange,
  trailingDaysRange,
  buildDailyTagBreakdown,
} from "@/lib/study-stats";
import { jstDateKey } from "@/lib/jst";
import { asMoodLevel, MOOD_CONFIG, type MoodLevel } from "@/lib/mood";
import { formatDurationShort, formatDiffMinutes, formatRelativeJa } from "@/lib/format";
import { resolveDistinctPersonColors, hexToRgba, tagColor, NO_TAG_COLOR } from "@/lib/chart-colors";
import TimeSeriesBarChart from "@/components/charts/TimeSeriesBarChart";

type Span = "week" | "month";
type RibbonColor = "PINK" | "LAVENDER" | "MINT" | "CREAM";

// 「週」はウィジェットの「こんしゅう」と同じカレンダー週(月曜始まり)にそろえ、
// タップ元の数値と食い違わないようにする。「月」は直近30日のローリング窓
// (暦月にすると月初は残りが全部未来の空データになり、推移グラフとして読みにくいため)。
const SPAN_LABELS: Record<Span, string> = { week: "今週", month: "直近30日間" };
const SPAN_TAB_LABELS: Record<Span, string> = { week: "週", month: "30日" };

function parseSpan(value: string | string[] | undefined): Span {
  const v = Array.isArray(value) ? value[0] : value;
  return v === "month" ? "month" : "week";
}

export default async function ComparePage({
  searchParams,
}: {
  searchParams: Promise<{ span?: string }>;
}) {
  const params = await searchParams;
  const span = parseSpan(params.span);
  const me = await getCurrentUser();
  const allUsers = await db.user.findMany({
    include: { rabbit: true },
    orderBy: { createdAt: "asc" },
  });
  const partner = allUsers.find((u) => u.id !== me.id) ?? null;

  const now = new Date();
  const range = span === "week" ? weekRange(now) : trailingDaysRange(30, now);

  // 「きょうのきぶん」はJST基準の1日1回チェックイン(src/lib/mood.ts)。
  const moodDate = jstDateKey(now);

  const [mySummary, partnerSummary, myToday, partnerToday, myMoodEntry, partnerMoodEntry, loginEvents, activeSessions] =
    await Promise.all([
      getPeriodSummary(me.id, range),
      partner ? getPeriodSummary(partner.id, range) : null,
      getTodaySeconds(me.id, now),
      partner ? getTodaySeconds(partner.id, now) : Promise.resolve(0),
      db.moodEntry.findUnique({
        where: { userId_moodDate: { userId: me.id, moodDate } },
      }),
      partner
        ? db.moodEntry.findUnique({
            where: { userId_moodDate: { userId: partner.id, moodDate } },
          })
        : null,
      partner
        ? db.loginEvent.findMany({
            where: { userId: { in: [me.id, partner.id] } },
            orderBy: { loggedInAt: "desc" },
            take: 12,
            select: { userId: true, loggedInAt: true },
          })
        : Promise.resolve([]),
      // 「今べんきょう中」表示用: endedAt=nullのセッションが有るかどうか(一時停止中も含む。
      // 一時停止はサーバーに送るpausedAtがあるがUI上は「タイマー使用中」で一括りにする)。
      db.studySession.findMany({
        where: {
          userId: partner ? { in: [me.id, partner.id] } : me.id,
          endedAt: null,
        },
        select: { userId: true, tags: { select: { tag: { select: { name: true } } } } },
      }),
    ]);

  const myMood = asMoodLevel(myMoodEntry?.level);
  const partnerMood = asMoodLevel(partnerMoodEntry?.level);

  const myActiveSession = activeSessions.find((s) => s.userId === me.id) ?? null;
  const partnerActiveSession = partner ? activeSessions.find((s) => s.userId === partner.id) ?? null : null;

  const myColorRaw = me.rabbit ? RIBBON_COLOR_HEX[me.rabbit.ribbonColor] : PALETTE.pinkDeep;
  const partnerColorRaw = partner?.rabbit ? RIBBON_COLOR_HEX[partner.rabbit.ribbonColor] : PALETTE.lavender;
  const [myColor, partnerColor] = resolveDistinctPersonColors(myColorRaw, partnerColorRaw);

  const myName = me.rabbit?.name ?? me.displayName;
  const partnerName = partner?.rabbit?.name ?? partner?.displayName ?? "パートナー";

  const trendData = mySummary.dailyBreakdown.map((point, i) => ({
    label: point.label,
    self: point.totalSeconds,
    partner: partnerSummary?.dailyBreakdown[i]?.totalSeconds ?? 0,
  }));

  const diffSeconds = partner ? mySummary.totalSeconds - (partnerSummary?.totalSeconds ?? 0) : null;

  // タグごとに色分けした日別内訳(REQUIREMENTS.md 3-6節: タグ機能)。
  const myTagBreakdown = buildDailyTagBreakdown(mySummary.sessions, mySummary.dailyBreakdown);
  const partnerTagBreakdown = partnerSummary
    ? buildDailyTagBreakdown(partnerSummary.sessions, partnerSummary.dailyBreakdown)
    : null;

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-4 p-4 pb-24">
      <header className="flex flex-col gap-1">
        <h1 className="text-lg font-bold text-charcoal">ふたりの勉強くらべ</h1>
        <p className="text-xs text-charcoal-soft">{SPAN_LABELS[span]}のきろく</p>
      </header>

      {!partner ? (
        <p className="rounded-2xl border border-pink-deep/20 bg-milk p-4 text-center text-sm text-charcoal-soft">
          まだ ふたりめの アカウントが ないみたい
        </p>
      ) : (
        <>
          <div className="flex flex-wrap gap-2">
            <PersonCard
              label="じぶん"
              name={myName}
              energy={me.rabbit ? computeCurrentEnergy(me.rabbit.energy, me.rabbit.lastSessionEndAt, now) : 0}
              ribbonColor={me.rabbit?.ribbonColor ?? "CREAM"}
              equippedItem={me.rabbit?.equippedItemId ?? null}
              todaySeconds={myToday}
              periodSeconds={mySummary.totalSeconds}
              accentColor={myColor}
              moodLevel={myMood}
              activeTagNames={myActiveSession?.tags.map((t) => t.tag.name) ?? null}
              isStudying={myActiveSession !== null}
            />
            <PersonCard
              label="パートナー"
              name={partnerName}
              energy={
                partner.rabbit
                  ? computeCurrentEnergy(partner.rabbit.energy, partner.rabbit.lastSessionEndAt, now)
                  : 0
              }
              ribbonColor={partner.rabbit?.ribbonColor ?? "LAVENDER"}
              equippedItem={partner.rabbit?.equippedItemId ?? null}
              todaySeconds={partnerToday}
              periodSeconds={partnerSummary?.totalSeconds ?? 0}
              accentColor={partnerColor}
              moodLevel={partnerMood}
              activeTagNames={partnerActiveSession?.tags.map((t) => t.tag.name) ?? null}
              isStudying={partnerActiveSession !== null}
            />
          </div>

          {diffSeconds !== null && (
            <p className="rounded-2xl bg-pink/25 p-3 text-center text-sm font-bold text-charcoal">
              {SPAN_LABELS[span]}の差 {formatDiffMinutes(diffSeconds)}
            </p>
          )}

          <nav className="flex gap-2" aria-label="表示期間の切り替え">
            {(Object.keys(SPAN_LABELS) as Span[]).map((s) => (
              <Link
                key={s}
                href={`/compare?span=${s}`}
                className={`rounded-full px-4 py-1.5 text-sm font-bold transition ${
                  s === span ? "bg-pink-deep text-charcoal" : "bg-pink/40 text-charcoal-soft hover:bg-pink/60"
                }`}
              >
                {SPAN_TAB_LABELS[s]}
              </Link>
            ))}
          </nav>

          <section className="rounded-2xl border border-pink-deep/20 bg-milk p-4 shadow-sm">
            <h2 className="mb-2 text-sm font-bold text-charcoal">日ごとの勉強時間</h2>
            <TimeSeriesBarChart
              data={trendData}
              series={[
                { key: "self", name: myName, color: myColor },
                { key: "partner", name: partnerName, color: partnerColor },
              ]}
              height={240}
            />
            <details className="mt-2 text-xs text-charcoal-soft">
              <summary className="cursor-pointer select-none">表で見る</summary>
              <table className="mt-2 w-full text-left">
                <thead>
                  <tr className="border-b border-pink-deep/20">
                    <th className="py-1 font-bold text-charcoal">日付</th>
                    <th className="py-1 font-bold text-charcoal">{myName}</th>
                    <th className="py-1 font-bold text-charcoal">{partnerName}</th>
                  </tr>
                </thead>
                <tbody>
                  {trendData.map((point) => (
                    <tr key={point.label} className="border-b border-pink-deep/10">
                      <td className="py-1">{point.label}</td>
                      <td className="py-1">{formatDurationShort(point.self)}</td>
                      <td className="py-1">{formatDurationShort(point.partner)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </details>
          </section>

          {(myTagBreakdown.tagNames.length > 0 || (partnerTagBreakdown?.tagNames.length ?? 0) > 0) && (
            <section className="rounded-2xl border border-pink-deep/20 bg-milk p-4 shadow-sm">
              <h2 className="mb-2 text-sm font-bold text-charcoal">タグ別の勉強時間の内訳</h2>
              <TagCompositionChart label={myName} breakdown={myTagBreakdown} />
              {partnerTagBreakdown && (
                <TagCompositionChart label={partnerName} breakdown={partnerTagBreakdown} />
              )}
            </section>
          )}

          {loginEvents.length > 0 && (
            <section className="rounded-2xl border border-pink-deep/20 bg-milk p-4 shadow-sm">
              <h2 className="mb-2 text-sm font-bold text-charcoal">ログイン履歴</h2>
              <ul className="flex flex-col gap-1.5">
                {loginEvents.map((ev) => {
                  const isMe = ev.userId === me.id;
                  return (
                    <li
                      key={`${ev.userId}-${ev.loggedInAt.toISOString()}`}
                      className="flex items-center justify-between text-xs text-charcoal-soft"
                    >
                      <span className="font-bold" style={{ color: isMe ? myColor : partnerColor }}>
                        {isMe ? me.displayName : (partner?.displayName ?? "パートナー")}
                      </span>
                      <span>{formatRelativeJa(ev.loggedInAt, now)}</span>
                    </li>
                  );
                })}
              </ul>
            </section>
          )}
        </>
      )}
    </div>
  );
}

function PersonCard({
  label,
  name,
  energy,
  ribbonColor,
  equippedItem,
  todaySeconds,
  periodSeconds,
  accentColor,
  moodLevel,
  isStudying,
  activeTagNames,
}: {
  label: string;
  name: string;
  energy: number;
  ribbonColor: RibbonColor;
  equippedItem: string | null;
  todaySeconds: number;
  periodSeconds: number;
  accentColor: string;
  moodLevel: MoodLevel | null;
  isStudying: boolean;
  activeTagNames: string[] | null;
}) {
  return (
    <div
      className="flex min-w-[13rem] flex-1 items-center gap-3 rounded-2xl p-3"
      style={{ backgroundColor: hexToRgba(accentColor, 0.15) }}
    >
      <Rabbit size="md" energy={energy} name={name} ribbonColor={ribbonColor} equippedItem={equippedItem} />
      <div className="flex flex-col leading-tight">
        <span className="text-[11px] font-bold text-charcoal-soft">{label}</span>
        <span className="text-sm font-bold text-charcoal">{name}</span>
        {isStudying && (
          <div className="mt-0.5 flex flex-col items-start gap-0.5">
            <span className="inline-flex w-fit items-center gap-1 rounded-full bg-mint/70 px-2 py-0.5 text-[10px] font-bold text-charcoal">
              <span className="inline-block h-1.5 w-1.5 shrink-0 animate-pulse rounded-full bg-charcoal" aria-hidden />
              べんきょう中
            </span>
            {activeTagNames && activeTagNames.length > 0 && (
              <span className="text-[10px] leading-tight text-charcoal-soft">{activeTagNames.join("・")}</span>
            )}
          </div>
        )}
        <span className="text-xs text-charcoal-soft">
          きぶん{" "}
          {moodLevel !== null ? (
            <span className="font-bold text-charcoal">
              <span aria-hidden>{MOOD_CONFIG[moodLevel].emoji}</span> {MOOD_CONFIG[moodLevel].label}
            </span>
          ) : (
            "まだ こたえてないよ"
          )}
        </span>
        <span className="text-xs text-charcoal-soft">きょう {formatDurationShort(todaySeconds)}</span>
        <span className="text-xs text-charcoal-soft">期間合計 {formatDurationShort(periodSeconds)}</span>
      </div>
    </div>
  );
}

function TagCompositionChart({
  label,
  breakdown,
}: {
  label: string;
  breakdown: ReturnType<typeof buildDailyTagBreakdown>;
}) {
  if (breakdown.tagNames.length === 0) return null;

  return (
    <div className="mt-3 first:mt-0">
      <p className="mb-1 text-xs font-bold text-charcoal-soft">{label}</p>
      <TimeSeriesBarChart
        data={breakdown.data}
        series={breakdown.tagNames.map((tagName) => ({
          key: tagName,
          name: tagName,
          color: tagName === "タグなし" ? NO_TAG_COLOR : tagColor(tagName),
        }))}
        stacked
        height={160}
      />
      <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1">
        {breakdown.tagNames.map((tagName) => (
          <span key={tagName} className="flex items-center gap-1 text-[11px] text-charcoal-soft">
            <span
              aria-hidden
              className="inline-block h-2 w-2 rounded-full"
              style={{ backgroundColor: tagName === "タグなし" ? NO_TAG_COLOR : tagColor(tagName) }}
            />
            {tagName}
          </span>
        ))}
      </div>
    </div>
  );
}
