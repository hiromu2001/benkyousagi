// おみせの商品マスタ(REQUIREMENTS.md 3-7節)。
// 2人利用で商品追加=リリース作業になるため、価格・名前・カテゴリはDBに持たずここで定数管理する。

export type ShopCategory = "food" | "accessory";

export type ShopItem = {
  id: string;
  name: string;
  price: number;
  category: ShopCategory;
};

// 消耗品。購入すると即座にうさぎへあげる演出を再生する(所持記録は残さない)。
export const CARROT_TREAT_ID = "carrot_treat";

// 買い切りアクセサリー第1弾。装備スロットは「あたま・かお」の1枠のみ(同時装備1点)。
// おみせ画面でのアイコンは絵文字ではなく、実際に装備した時と同じRabbitParts.tsxのSVGで表示する
// (2026-07-15: 絵文字が実際の見た目と乖離していて分かりにくい、というフィードバックを受けて変更)。
export const ACCESSORY_IDS = ["glasses", "beret", "nightcap", "flower_crown"] as const;
export type AccessoryId = (typeof ACCESSORY_IDS)[number];

export const SHOP_ITEMS: ShopItem[] = [
  { id: CARROT_TREAT_ID, name: "おやつのにんじん", price: 20, category: "food" },
  { id: "glasses", name: "まるメガネ", price: 300, category: "accessory" },
  { id: "beret", name: "ベレー帽", price: 450, category: "accessory" },
  { id: "nightcap", name: "ナイトキャップ", price: 450, category: "accessory" },
  { id: "flower_crown", name: "花冠", price: 600, category: "accessory" },
];

export function findShopItem(itemId: string): ShopItem | undefined {
  return SHOP_ITEMS.find((item) => item.id === itemId);
}

export function isAccessoryId(itemId: string | null | undefined): itemId is AccessoryId {
  return !!itemId && (ACCESSORY_IDS as readonly string[]).includes(itemId);
}

// REQUIREMENTS.md 3-7-2節: 勉強1分+1コイン、満了/ポモドーロ全セット完了ボーナス、きぶんチェックインボーナス。
export const COIN_PER_MINUTE = 1;
export const COIN_COMPLETION_BONUS = 20;
export const COIN_MOOD_CHECKIN_BONUS = 10;
