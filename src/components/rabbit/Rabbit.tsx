"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { motion, useAnimationControls } from "framer-motion";
import { energyStage } from "@/lib/rabbit-status";
import { PALETTE, RIBBON_COLOR_HEX } from "@/lib/theme";
import { STAGE_CONFIG } from "./rabbit-config";
import {
  BODY_PATH,
  Ear,
  Eyes,
  Mouth,
  Nose,
  Blush,
  Paws,
  Tail,
  Ribbon,
  GroundShadow,
  Blanket,
  SpeechBubble,
  SparkleField,
  HeartBurst,
  AmbientHeart,
  Glasses,
  Beret,
  Nightcap,
  FlowerCrown,
  HairRibbon,
  StarClip,
  SunflowerPin,
  Headphones,
  StrawberryCap,
  StrawHat,
  WizardHat,
  TinyCrown,
  RedScarf,
  TinyApron,
  SailorCollar,
  FluffyCape,
  DotPajama,
} from "./RabbitParts";
import { isAccessoryId, isOutfitId, type AccessoryId, type OutfitId } from "@/lib/shop";

export type RabbitProps = {
  energy: number;
  name: string;
  ribbonColor: "PINK" | "LAVENDER" | "MINT" | "CREAM";
  size?: "sm" | "md" | "lg";
  celebrate?: boolean;
  equippedItem?: string | null;
  equippedOutfit?: string | null;
};

const ACCESSORY_COMPONENTS: Record<AccessoryId, () => React.JSX.Element> = {
  glasses: Glasses,
  beret: Beret,
  nightcap: Nightcap,
  flower_crown: FlowerCrown,
  hair_ribbon: HairRibbon,
  star_clip: StarClip,
  sunflower_pin: SunflowerPin,
  headphones: Headphones,
  strawberry_cap: StrawberryCap,
  straw_hat: StrawHat,
  wizard_hat: WizardHat,
  tiny_crown: TinyCrown,
};

const OUTFIT_COMPONENTS: Record<OutfitId, () => React.JSX.Element> = {
  red_scarf: RedScarf,
  tiny_apron: TinyApron,
  sailor_collar: SailorCollar,
  fluffy_cape: FluffyCape,
  dot_pajama: DotPajama,
};

function Accessory({ itemId }: { itemId?: string | null }) {
  if (!isAccessoryId(itemId)) return null;
  const Component = ACCESSORY_COMPONENTS[itemId];
  return <Component />;
}

function Outfit({ itemId }: { itemId?: string | null }) {
  if (!isOutfitId(itemId)) return null;
  const Component = OUTFIT_COMPONENTS[itemId];
  return <Component />;
}

const SIZE_CLASSES: Record<NonNullable<RabbitProps["size"]>, string> = {
  sm: "w-14 h-14",
  md: "w-40 h-40 sm:w-48 sm:h-48",
  lg: "w-60 h-60 sm:w-72 sm:h-72 md:w-80 md:h-80",
};

const BODY_FILL = RIBBON_COLOR_HEX.CREAM;

function SwayWrap({ active, children }: { active: boolean; children: ReactNode }) {
  if (!active) return <>{children}</>;
  return (
    <motion.g
      style={{ originX: 0.5, originY: 0.85 }}
      animate={{ rotate: [-2.5, 2.5, -2.5] }}
      transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
    >
      {children}
    </motion.g>
  );
}

function AmbientHop({ active, children }: { active: boolean; children: ReactNode }) {
  if (!active) return <>{children}</>;
  return (
    <motion.g
      animate={{ y: [0, 0, -10, 0, 0] }}
      transition={{ duration: 7, repeat: Infinity, times: [0, 0.82, 0.88, 0.94, 1], ease: "easeOut" }}
    >
      {children}
    </motion.g>
  );
}

export default function Rabbit({
  energy,
  name,
  ribbonColor,
  size = "md",
  celebrate = false,
  equippedItem = null,
  equippedOutfit = null,
}: RabbitProps) {
  const stage = energyStage(energy);
  const config = STAGE_CONFIG[stage];
  const detailed = size !== "sm";
  const ribbonHex = RIBBON_COLOR_HEX[ribbonColor];

  const jumpControls = useAnimationControls();
  const [burstTick, setBurstTick] = useState(0);
  const wasCelebrating = useRef(false);

  useEffect(() => {
    if (celebrate && !wasCelebrating.current) {
      setBurstTick((t) => t + 1);
      void jumpControls.start({
        y: [0, -22, -4, -16, 0],
        transition: { duration: 1.3, times: [0, 0.35, 0.55, 0.8, 1], ease: "easeOut" },
      });
    }
    wasCelebrating.current = celebrate;
  }, [celebrate, jumpControls]);

  return (
    <div
      className={`${SIZE_CLASSES[size]} select-none`}
      role="img"
      aria-label={`${name}(元気度${Math.round(energy)})`}
    >
      <motion.svg
        viewBox="0 0 240 260"
        className="h-full w-full overflow-visible"
        style={config.saturate < 1 ? { filter: `saturate(${config.saturate})` } : undefined}
      >
        <motion.g animate={jumpControls} initial={{ y: 0 }}>
          <AmbientHop active={config.ambientHeart && detailed}>
            <SwayWrap active={config.sway}>
              <motion.g
                style={{ originX: 0.5, originY: 0.5 }}
                animate={{ scale: [1, 1 + config.breathScale, 1] }}
                transition={{ duration: config.breathDuration, repeat: Infinity, ease: "easeInOut" }}
              >
                {detailed && <GroundShadow />}
                <Ear
                  side="left"
                  restDeg={config.earRestDeg}
                  wiggleDeg={config.earWiggleDeg}
                  wiggleDuration={config.earWiggleDuration}
                  bodyFill={BODY_FILL}
                />
                <Ear
                  side="right"
                  restDeg={config.earRestDeg}
                  wiggleDeg={config.earWiggleDeg}
                  wiggleDuration={config.earWiggleDuration}
                  bodyFill={BODY_FILL}
                />
                <Tail bodyFill={BODY_FILL} />
                <path d={BODY_PATH} fill={BODY_FILL} stroke={PALETTE.charcoal} strokeWidth={5.5} strokeLinejoin="round" />
                <Paws bodyFill={BODY_FILL} />
                <Outfit itemId={equippedOutfit} />
                <Ribbon color={ribbonHex} />
                {detailed && config.showBlanket && <Blanket />}
                <Blush />
                <Nose />
                <Eyes shape={config.eyes} blinkDuration={config.blinkDuration} />
                <Mouth shape={config.mouth} />
                <Accessory itemId={equippedItem} />
              </motion.g>
            </SwayWrap>
          </AmbientHop>
        </motion.g>

        {detailed && config.showSparkleField && <SparkleField />}
        {detailed && config.ambientHeart && <AmbientHeart />}
        {detailed && config.showWaitBubble && <SpeechBubble text="まってるよ…" />}
        {detailed && config.showSighBubble && <SpeechBubble text="ふぅ…" small fadeInOut />}
        {burstTick > 0 && <HeartBurst key={burstTick} />}
      </motion.svg>
    </div>
  );
}
