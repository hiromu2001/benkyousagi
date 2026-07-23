// おみせの商品マスタ(REQUIREMENTS.md 3-7節)。
// 2人利用で商品追加=リリース作業になるため、価格・名前・カテゴリはDBに持たずここで定数管理する。

export type ShopCategory = "food" | "charm" | "accessory" | "outfit" | "furniture";
export type FurnitureSlot = "left" | "back";

export type ShopItem = {
  id: string;
  name: string;
  price: number;
  category: ShopCategory;
  // furnitureカテゴリのみ使用。どの枠に置けるかを表す。
  slot?: FurnitureSlot;
};

// 消耗品。購入すると即座にうさぎへあげる演出を再生する(所持記録は残さない)。
export const CARROT_TREAT_ID = "carrot_treat";
export const HONEY_MILK_ID = "honey_milk";
export const CLOVER_CHARM_ID = "clover_charm";
export const CONSUMABLE_IDS = [CARROT_TREAT_ID, HONEY_MILK_ID, CLOVER_CHARM_ID] as const;
export type ConsumableId = (typeof CONSUMABLE_IDS)[number];

// 買い切りアクセサリー(あたま・かお)。装備スロットは1枠のみ(同時装備1点)。
// おみせ画面でのアイコンは絵文字ではなく、実際に装備した時と同じRabbitParts.tsxのSVGで表示する
// (2026-07-15: 絵文字が実際の見た目と乖離していて分かりにくい、というフィードバックを受けて変更)。
export const ACCESSORY_IDS = [
  "glasses",
  "beret",
  "nightcap",
  "flower_crown",
  "hair_ribbon",
  "star_clip",
  // 第3弾(2026-07-23追加)
  "sunflower_pin",
  "headphones",
  "strawberry_cap",
  "straw_hat",
  "wizard_hat",
  "tiny_crown",
] as const;
export type AccessoryId = (typeof ACCESSORY_IDS)[number];

// 買い切り「おようふく」(からだ)。アクセサリーとは別スロットのため同時装備できる。
export const OUTFIT_IDS = [
  "red_scarf",
  "tiny_apron",
  "sailor_collar",
  "fluffy_cape",
  "dot_pajama",
] as const;
export type OutfitId = (typeof OUTFIT_IDS)[number];

// 買い切り「おへや」の家具。ホーム画面でのみ表示(3-7節・2026-07-23追加)。
export const FURNITURE_IDS = ["potted_plant", "star_garland", "study_desk", "moon_window"] as const;
export type FurnitureId = (typeof FURNITURE_IDS)[number];

export const SHOP_ITEMS: ShopItem[] = [
  { id: CARROT_TREAT_ID, name: "おやつのにんじん", price: 20, category: "food" },
  { id: HONEY_MILK_ID, name: "はちみつミルク", price: 30, category: "food" },
  { id: CLOVER_CHARM_ID, name: "よつばのクローバー", price: 50, category: "charm" },

  { id: "glasses", name: "まるメガネ", price: 300, category: "accessory" },
  { id: "beret", name: "ベレー帽", price: 450, category: "accessory" },
  { id: "nightcap", name: "ナイトキャップ", price: 450, category: "accessory" },
  { id: "flower_crown", name: "花冠", price: 600, category: "accessory" },
  // 第2弾(2026-07-15追加)
  { id: "hair_ribbon", name: "ピンクのリボン", price: 250, category: "accessory" },
  { id: "star_clip", name: "ほしのヘアピン", price: 300, category: "accessory" },
  // 第3弾(2026-07-23追加)
  { id: "sunflower_pin", name: "ひまわりのヘアピン", price: 300, category: "accessory" },
  { id: "headphones", name: "ふわふわヘッドホン", price: 400, category: "accessory" },
  { id: "strawberry_cap", name: "いちごのぼうし", price: 450, category: "accessory" },
  { id: "straw_hat", name: "むぎわらぼうし", price: 500, category: "accessory" },
  { id: "wizard_hat", name: "まほうつかいのぼうし", price: 550, category: "accessory" },
  { id: "tiny_crown", name: "ちいさなおうかん", price: 800, category: "accessory" },

  // おようふく(2026-07-23追加)
  { id: "red_scarf", name: "あかいマフラー", price: 350, category: "outfit" },
  { id: "tiny_apron", name: "ちいさなエプロン", price: 400, category: "outfit" },
  { id: "sailor_collar", name: "セーラーカラー", price: 450, category: "outfit" },
  { id: "fluffy_cape", name: "ふわふわケープ", price: 550, category: "outfit" },
  { id: "dot_pajama", name: "みずたまパジャマ", price: 600, category: "outfit" },

  // おへやの家具(2026-07-23追加)
  { id: "potted_plant", name: "かんようしょくぶつ", price: 350, category: "furniture", slot: "left" },
  { id: "study_desk", name: "きのつくえとランプ", price: 650, category: "furniture", slot: "left" },
  { id: "star_garland", name: "おほしさまガーランド", price: 450, category: "furniture", slot: "back" },
  { id: "moon_window", name: "まどとおつきさま", price: 700, category: "furniture", slot: "back" },
];

export function findShopItem(itemId: string): ShopItem | undefined {
  return SHOP_ITEMS.find((item) => item.id === itemId);
}

export function isConsumableId(itemId: string | null | undefined): itemId is ConsumableId {
  return !!itemId && (CONSUMABLE_IDS as readonly string[]).includes(itemId);
}

export function isAccessoryId(itemId: string | null | undefined): itemId is AccessoryId {
  return !!itemId && (ACCESSORY_IDS as readonly string[]).includes(itemId);
}

export function isOutfitId(itemId: string | null | undefined): itemId is OutfitId {
  return !!itemId && (OUTFIT_IDS as readonly string[]).includes(itemId);
}

export function isFurnitureId(itemId: string | null | undefined): itemId is FurnitureId {
  return !!itemId && (FURNITURE_IDS as readonly string[]).includes(itemId);
}

// REQUIREMENTS.md 3-7-2節: 勉強1分+1コイン、満了/ポモドーロ全セット完了ボーナス、きぶんチェックインボーナス。
export const COIN_PER_MINUTE = 1;
export const COIN_COMPLETION_BONUS = 20;
export const COIN_MOOD_CHECKIN_BONUS = 10;
