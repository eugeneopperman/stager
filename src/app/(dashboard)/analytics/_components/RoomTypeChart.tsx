"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { ChartCard } from "./ChartCard";
import type { RoomTypeBreakdown } from "@/lib/analytics/types";

interface RoomTypeChartProps {
  data: RoomTypeBreakdown[];
}

// Chart colors - semantic palette
const COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
  "hsl(var(--muted-foreground))",
];

export function RoomTypeChart({ data }: RoomTypeChartProps) {
  const hasData = data.length > 0;

  return (
    <ChartCard title="Room Types" tourId="analytics-rooms">
      <div className="h-[240px]">
        {hasData ? (
          <div className="flex items-center gap-4 h-full">
            <div className="w-1/2 h-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="count"
                    nameKey="label"
                  >
                    {data.map((_, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                        stroke="none"
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--popover))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                    }}
                    formatter={(value, name) => [
                      `${value} (${data.find((d) => d.label === name)?.percentage}%)`,
                      name,
                    ]}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="w-1/2 space-y-2">
              {data.slice(0, 5).map((item, index) => (
                <div key={item.roomType} className="flex items-center gap-2 text-sm">
                  <div
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  />
                  <span className="text-foreground truncate flex-1">{item.label}</span>
                  <span className="text-muted-foreground font-medium">{item.percentage}%</span>
                </div>
              ))}
              {data.length > 5 && (
                <p className="text-xs text-muted-foreground pl-5">
                  +{data.length - 5} more
                </p>
              )}
            </div>
          </div>
        ) : (
          <div className="h-full flex items-center justify-center">
            <p className="text-muted-foreground text-sm">
              No room type data available
            </p>
          </div>
        )}
      </div>
    </ChartCard>
  );
}
