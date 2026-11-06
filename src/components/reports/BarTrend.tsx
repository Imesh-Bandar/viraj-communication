"use client";

import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export type Point = { key: string; label: string; value: number };

const compact = (value: number) => Intl.NumberFormat("en", { notation: "compact" }).format(value);

/** One series, one axis. The highlighted bar is drawn darker than the rest. */
export function BarTrend({ data, format, highlight, onPick }: {
  data: Point[];
  format: (value: number) => string;
  highlight?: string;
  onPick?: (key: string) => void;
}) {
  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 4, bottom: 0, left: 0 }}>
          <CartesianGrid vertical={false} stroke="#e2e8f0" />
          <XAxis dataKey="label" tickLine={false} axisLine={{ stroke: "#cbd5e1" }} tick={{ fill: "#64748b", fontSize: 12 }} interval="preserveStartEnd" minTickGap={12} />
          <YAxis width={44} tickLine={false} axisLine={false} tick={{ fill: "#64748b", fontSize: 12 }} tickFormatter={compact} allowDecimals={false} />
          <Tooltip
            cursor={{ fill: "#f1f5f9" }}
            formatter={(value) => [format(Number(value)), ""]}
            separator=""
            contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 13 }}
          />
          <Bar
            dataKey="value" maxBarSize={28} radius={[4, 4, 0, 0]} isAnimationActive={false}
            cursor={onPick ? "pointer" : undefined}
            onClick={onPick ? (entry) => onPick((entry as unknown as { payload: Point }).payload.key) : undefined}
          >
            {data.map((point) => (
              <Cell key={point.key} fill={!highlight || point.key === highlight ? "#1c7470" : "#aedfda"} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
