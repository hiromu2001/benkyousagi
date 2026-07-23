import Rabbit, { type RabbitProps } from "@/components/rabbit/Rabbit";
import { FURNITURE_COMPONENTS } from "@/components/rabbit/RoomFurniture";
import { isFurnitureId } from "@/lib/shop";

// ホーム画面専用の「おへや」演出(REQUIREMENTS.md 3-7節・2026-07-23追加)。
// Rabbit.tsx自体の座標系(240x260固定)は変更せず、CSSでうさぎの周囲に家具を配置する
// (比較ウィジェット等の小さい表示では家具を出さない=Rabbitをそのまま使う設計を維持できる)。
export function RabbitRoomScene({
  rabbit,
  leftItemId,
  backItemId,
}: {
  rabbit: RabbitProps;
  leftItemId: string | null;
  backItemId: string | null;
}) {
  const LeftComponent = isFurnitureId(leftItemId) ? FURNITURE_COMPONENTS[leftItemId] : null;
  const BackComponent = isFurnitureId(backItemId) ? FURNITURE_COMPONENTS[backItemId] : null;

  return (
    <div className="relative flex items-end justify-center">
      {BackComponent && (
        <div className="pointer-events-none absolute inset-x-0 top-0 z-0 flex justify-center opacity-90">
          <BackComponent className="h-20 w-auto sm:h-24" />
        </div>
      )}
      <div className="relative z-10">
        <Rabbit {...rabbit} />
      </div>
      {LeftComponent && (
        <div className="pointer-events-none absolute bottom-0 left-0 z-10 translate-x-[-10%]">
          <LeftComponent className="h-14 w-auto sm:h-16" />
        </div>
      )}
    </div>
  );
}
