// 画面遷移中に「押した瞬間」表示されるフォールバック(各routeのloading.tsxから使う)。
// このアプリは全ページがcookie認証つきの動的レンダリングで、loading.tsxが無いと
// サーバー(Turso往復を含む)の応答が返るまで画面が一切変化しない
// (Next.js docs: linking-and-navigating「Dynamic routes without loading.tsx」)。
// loading.tsxを置くことでナビゲーションが即時になり、この画面が先に描画される。
export default function RouteLoading({
  message = "じゅんびしてるよ…",
}: {
  message?: string;
}) {
  return (
    <div className="flex min-h-[70vh] flex-1 flex-col items-center justify-center gap-4">
      <span aria-hidden className="animate-bounce text-4xl">
        🐰
      </span>
      <div aria-hidden className="flex items-center gap-1.5">
        <span className="h-2.5 w-2.5 animate-bounce rounded-full bg-pink-deep" />
        <span className="h-2.5 w-2.5 animate-bounce rounded-full bg-lavender [animation-delay:120ms]" />
        <span className="h-2.5 w-2.5 animate-bounce rounded-full bg-mint [animation-delay:240ms]" />
      </div>
      <p className="text-sm text-charcoal-soft">{message}</p>
    </div>
  );
}
