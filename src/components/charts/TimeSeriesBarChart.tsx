"use client";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  type TooltipContentProps,
} from "recharts";
import { PALETTE } from "@/lib/theme";
import { formatDurationShort } from "@/lib/format";

export type BarSeries = { key: string; name: string; color: string };
export type TimeSeriesPoint = { label: string } & Record<string, number | string>;

const GRID_COLOR = "rgba(107, 91, 91, 0.14)";
const CURSOR_COLOR = "rgba(107, 91, 91, 0.06)";
const AXIS_TEXT_COLOR = PALETTE.charcoalSoft;

function CustomTooltip({ active, payload, label }: TooltipContentProps) {
  if (!active || !payload || payload.length === 0) return null;
  const showNames = payload.length > 1;
  return (
    <div className="rounded-lg border border-pink-deep/30 bg-milk px-3 py-2 text-xs shadow-md">
      <p className="mb-1 font-bold text-charcoal">{label}</p>
      {payload.map((entry) => (
        <p key={String(entry.dataKey)} className="flex items-center gap-1.5">
          <span
            aria-hidden
            className="inline-block h-2 w-2 shrink-0 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span className="font-bold text-charcoal">
            {formatDurationShort(typeof entry.value === "number" ? entry.value : 0)}
          </span>
          {showNames && <span className="text-charcoal-soft">{entry.name}</span>}
        </p>
      ))}
    </div>
  );
}

export default function TimeSeriesBarChart({
  data,
  series,
  height = 220,
}: {
  data: TimeSeriesPoint[];
  series: BarSeries[];
  height?: number;
}) {
  const showLegend = series.length > 1;
  // カテゴリ数が多い(月表示など)場合はラベルが重なるので間引く。
  const xAxisInterval = data.length > 10 ? Math.ceil(data.length / 8) - 1 : 0;

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} barGap={2} barCategoryGap={showLegend ? "24%" : "35%"}>
        <CartesianGrid stroke={GRID_COLOR} vertical={false} />
        <XAxis
          dataKey="label"
          interval={xAxisInterval}
          tick={{ fill: AXIS_TEXT_COLOR, fontSize: 11 }}
          axisLine={{ stroke: GRID_COLOR }}
          tickLine={false}
        />
        <YAxis
          tick={{ fill: AXIS_TEXT_COLOR, fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          width={32}
          allowDecimals={false}
          tickFormatter={(seconds: number) => String(Math.round(seconds / 60))}
        />
        <Tooltip content={CustomTooltip} cursor={{ fill: CURSOR_COLOR }} />
        {showLegend && (
          <Legend
            verticalAlign="top"
            align="right"
            height={28}
            iconType="circle"
            iconSize={8}
            formatter={(value: string) => <span className="text-xs text-charcoal-soft">{value}</span>}
          />
        )}
        {series.map((s) => (
          <Bar key={s.key} dataKey={s.key} name={s.name} fill={s.color} radius={[4, 4, 0, 0]} maxBarSize={24} />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}
