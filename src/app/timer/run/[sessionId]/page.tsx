import Link from "next/link";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/dal";
import { recoverStaleSessionsForUser } from "@/lib/session-finalize";
import { computeCurrentEnergy } from "@/lib/rabbit-status";
import TimerRunClient, { type RunConfig } from "./_components/TimerRunClient";

type SearchParams = Record<string, string | string[] | undefined>;

function readParam(searchParams: SearchParams, key: string): string | null {
  const value = searchParams[key];
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

function readPositiveInt(searchParams: SearchParams, key: string): number | null {
  const raw = readParam(searchParams, key);
  if (raw == null) return null;
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

type PersistedConfig = {
  targetSeconds: number | null;
  pomodoroWorkSeconds: number | null;
  pomodoroShortBreakSeconds: number | null;
  pomodoroLongBreakSeconds: number | null;
  pomodoroSetsUntilLong: number | null;
};

// URLクエリは開始画面が組み立てた値(遷移直後のみ存在)。ホーム経由で離脱後に/timerの再開バナー等、
// このURL無しで再訪した場合はDBに保存済みの開始時設定(persisted)にフォールバックする。
// でないと設定を復元できず/timerへリダイレクトループしてしまう。
function parseRunConfig(
  timerType: "COUNTUP" | "COUNTDOWN" | "POMODORO",
  searchParams: SearchParams,
  persisted: PersistedConfig,
): RunConfig | null {
  if (timerType === "COUNTUP") {
    return { timerType: "COUNTUP" };
  }
  if (timerType === "COUNTDOWN") {
    const targetSeconds = readPositiveInt(searchParams, "target") ?? persisted.targetSeconds;
    if (!targetSeconds) return null;
    return { timerType: "COUNTDOWN", targetSeconds };
  }
  const work = readPositiveInt(searchParams, "work") ?? persisted.pomodoroWorkSeconds;
  const shortBreak = readPositiveInt(searchParams, "shortBreak") ?? persisted.pomodoroShortBreakSeconds;
  const long = readPositiveInt(searchParams, "long") ?? persisted.pomodoroLongBreakSeconds;
  const setsUntilLong = readPositiveInt(searchParams, "sets") ?? persisted.pomodoroSetsUntilLong;
  if (!work || !shortBreak || !long || !setsUntilLong) return null;
  return { timerType: "POMODORO", work, shortBreak, long, setsUntilLong };
}

export default async function TimerRunPage({
  params,
  searchParams,
}: {
  params: Promise<{ sessionId: string }>;
  searchParams: Promise<SearchParams>;
}) {
  const [{ sessionId }, query, user] = await Promise.all([
    params,
    searchParams,
    getCurrentUser(),
  ]);

  // 3-3-1-8節: このセッション自身が救済対象(異常終了)であれば、表示前に確定させておく。
  // /timer 経由(救済呼び出し)を通らずに直接このURLへ再訪した場合の抜け道を防ぐ。
  // セッション取得と並列で走らせ、救済が実際に起きた場合のみ取り直す(直列DB往復の削減)。
  const [recoveredCount, initialSession] = await Promise.all([
    recoverStaleSessionsForUser(user.id),
    db.studySession.findFirst({
      where: { id: sessionId, userId: user.id },
    }),
  ]);
  const session =
    recoveredCount > 0 && initialSession && !initialSession.endedAt
      ? await db.studySession.findFirst({
          where: { id: sessionId, userId: user.id },
        })
      : initialSession;

  if (!session) {
    redirect("/timer");
  }

  if (session.endedAt) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center gap-4 px-6 text-center">
        <p className="text-charcoal-soft">このタイマーは もう おわってるみたい</p>
        <Link
          href="/"
          className="rounded-full bg-pink px-6 py-3 font-bold text-charcoal shadow-sm transition active:scale-95"
        >
          ホームへもどる
        </Link>
      </div>
    );
  }

  const config = parseRunConfig(session.timerType, query, session);
  if (!config) {
    redirect("/timer");
  }

  const rabbit = user.rabbit;
  const baselineEnergy = rabbit
    ? computeCurrentEnergy(rabbit.energy, rabbit.lastSessionEndAt)
    : 60;

  return (
    <TimerRunClient
      sessionId={session.id}
      startedAtMs={session.startedAt.getTime()}
      config={config}
      rabbitName={rabbit?.name ?? "おもち"}
      ribbonColor={rabbit?.ribbonColor ?? "CREAM"}
      equippedItem={rabbit?.equippedItemId ?? null}
      baselineEnergy={baselineEnergy}
    />
  );
}
