import Link from "next/link";
import { db } from "@/lib/db";
import { Prisma } from "@/generated/prisma";
import { getOptionalCurrentUser } from "@/lib/dal";
import { computeCurrentEnergy } from "@/lib/rabbit-status";
import { RIBBON_COLOR_HEX, PALETTE } from "@/lib/theme";
import Rabbit from "@/components/rabbit/Rabbit";
import { getTodaySeconds, getThisWeekSeconds } from "@/lib/study-stats";
import { formatDurationShort, formatDiffMinutes } from "@/lib/format";
import { resolveDistinctPersonColors, hexToRgba } from "@/lib/chart-colors";

type UserWithRabbit = Prisma.UserGetPayload<{ include: { rabbit: true } }>;
type RibbonColor = "PINK" | "LAVENDER" | "MINT" | "CREAM";

async function loadSummary(user: UserWithRabbit, now: Date) {
  const [todaySeconds, weekSeconds] = await Promise.all([
    getTodaySeconds(user.id, now),
    getThisWeekSeconds(user.id, now),
  ]);
  return { user, todaySeconds, weekSeconds };
}

// 全画面共通で常時表示される、ふたりの勉強くらべミニウィジェット(REQUIREMENTS.md 3-6節)。
// 配置(sticky ヘッダー/サイドバーへの組み込み)は統合担当が行う前提で、
// ここでは単体で見栄えがするコンパクトな角丸カードとして実装する。
export default async function ComparisonWidget() {
  const me = await getOptionalCurrentUser();
  if (!me) return null;

  const allUsers = await db.user.findMany({
    include: { rabbit: true },
    orderBy: { createdAt: "asc" },
  });

  const now = new Date();
  const summaries = await Promise.all(allUsers.map((user) => loadSummary(user, now)));

  const mine = summaries.find((s) => s.user.id === me.id);
  const rival = summaries.find((s) => s.user.id !== me.id) ?? null;

  if (!mine) return null;

  const diffSeconds = rival ? mine.weekSeconds - rival.weekSeconds : null;

  const myColorRaw = mine.user.rabbit ? RIBBON_COLOR_HEX[mine.user.rabbit.ribbonColor] : PALETTE.pinkDeep;
  const rivalColorRaw = rival?.user.rabbit ? RIBBON_COLOR_HEX[rival.user.rabbit.ribbonColor] : PALETTE.lavender;
  const [myColor, rivalColor] = resolveDistinctPersonColors(myColorRaw, rivalColorRaw);

  return (
    <Link
      href="/compare"
      aria-label="ふたりの勉強くらべを詳しく見る"
      className="flex w-full flex-wrap items-center gap-x-3 gap-y-1.5 rounded-2xl border border-pink-deep/25 bg-milk/95 px-3 py-2 shadow-sm transition hover:shadow-md"
    >
      <span className="whitespace-nowrap text-xs font-bold text-charcoal-soft">ふたりの勉強くらべ</span>

      <div className="flex flex-1 flex-wrap gap-2">
        <UserPanel
          name={mine.user.rabbit?.name ?? mine.user.displayName}
          energy={
            mine.user.rabbit
              ? computeCurrentEnergy(mine.user.rabbit.energy, mine.user.rabbit.lastSessionEndAt, now)
              : 0
          }
          ribbonColor={mine.user.rabbit?.ribbonColor ?? "CREAM"}
          equippedItem={mine.user.rabbit?.equippedItemId ?? null}
          todaySeconds={mine.todaySeconds}
          weekSeconds={mine.weekSeconds}
          accentColor={myColor}
        />
        {rival && (
          <UserPanel
            name={rival.user.rabbit?.name ?? rival.user.displayName}
            energy={
              rival.user.rabbit
                ? computeCurrentEnergy(rival.user.rabbit.energy, rival.user.rabbit.lastSessionEndAt, now)
                : 0
            }
            ribbonColor={rival.user.rabbit?.ribbonColor ?? "LAVENDER"}
            equippedItem={rival.user.rabbit?.equippedItemId ?? null}
            todaySeconds={rival.todaySeconds}
            weekSeconds={rival.weekSeconds}
            accentColor={rivalColor}
          />
        )}
      </div>

      {diffSeconds !== null && (
        <span className="whitespace-nowrap text-xs font-bold text-charcoal">
          こんしゅうの差 {formatDiffMinutes(diffSeconds)}
        </span>
      )}
    </Link>
  );
}

function UserPanel({
  name,
  energy,
  ribbonColor,
  equippedItem,
  todaySeconds,
  weekSeconds,
  accentColor,
}: {
  name: string;
  energy: number;
  ribbonColor: RibbonColor;
  equippedItem: string | null;
  todaySeconds: number;
  weekSeconds: number;
  accentColor: string;
}) {
  return (
    <div
      className="flex min-w-[9.5rem] flex-1 items-center gap-2 rounded-xl px-2.5 py-1.5"
      style={{ backgroundColor: hexToRgba(accentColor, 0.15) }}
    >
      <Rabbit size="sm" energy={energy} name={name} ribbonColor={ribbonColor} equippedItem={equippedItem} />
      <div className="flex min-w-0 flex-col leading-tight">
        <span className="truncate text-xs font-bold text-charcoal">{name}</span>
        <span className="text-[11px] text-charcoal-soft">きょう {formatDurationShort(todaySeconds)}</span>
        <span className="text-[11px] text-charcoal-soft">こんしゅう {formatDurationShort(weekSeconds)}</span>
      </div>
    </div>
  );
}
