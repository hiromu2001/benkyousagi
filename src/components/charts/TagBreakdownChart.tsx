"use client";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  type TooltipContentProps,
} from "recharts";
import { PALETTE } from "@/lib/theme";
import { formatDurationShort } from "@/lib/format";

const GRID_COLOR = "rgba(107, 91, 91, 0.14)";
const CURSOR_COLOR = "rgba(107, 91, 91, 0.06)";
const AXIS_TEXT_COLOR = PALETTE.charcoalSoft;

export type TagPoint = { tagId: string; tagName: string; totalSeconds: number };

function TagTooltip({ active, payload }: TooltipContentProps) {
  if (!active || !payload || payload.length === 0) return null;
  const point = payload[0];
  const row = point.payload as TagPoint;
  const value = typeof point.value === "number" ? point.value : 0;
  return (
    <div className="rounded-lg border border-pink-deep/30 bg-milk px-3 py-2 text-xs shadow-md">
      <p className="font-bold text-charcoal">{formatDurationShort(value)}</p>
      <p className="text-charcoal-soft">{row.tagName}</p>
    </div>
  );
}

export default function TagBreakdownChart({
  data,
  color = PALETTE.pinkDeep,
  height,
}: {
  data: TagPoint[];
  color?: string;
  height?: number;
}) {
  const rowHeight = 34;
  const chartHeight = height ?? Math.max(120, data.length * rowHeight + 24);

  return (
    <ResponsiveContainer width="100%" height={chartHeight}>
      <BarChart data={data} layout="vertical" margin={{ left: 4, right: 16, top: 4, bottom: 4 }}>
        <CartesianGrid stroke={GRID_COLOR} horizontal={false} />
        <XAxis
          type="number"
          tick={{ fill: AXIS_TEXT_COLOR, fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          allowDecimals={false}
          tickFormatter={(seconds: number) => String(Math.round(seconds / 60))}
        />
        <YAxis
          type="category"
          dataKey="tagName"
          tick={{ fill: AXIS_TEXT_COLOR, fontSize: 12 }}
          axisLine={false}
          tickLine={false}
          width={84}
        />
        <Tooltip content={TagTooltip} cursor={{ fill: CURSOR_COLOR }} />
        <Bar dataKey="totalSeconds" fill={color} radius={[0, 4, 4, 0]} maxBarSize={20} />
      </BarChart>
    </ResponsiveContainer>
  );
}
