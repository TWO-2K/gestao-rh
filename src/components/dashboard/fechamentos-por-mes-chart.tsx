"use client";

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

const chartConfig = {
  quantidade: {
    label: "Fechamentos",
    color: "var(--chart-2)",
  },
} satisfies ChartConfig;

export function FechamentosPorMesChart({
  data,
}: {
  data: { mes: string; label: string; quantidade: number }[];
}) {
  return (
    <div className="overflow-x-auto">
      <ChartContainer
        config={chartConfig}
        className="aspect-auto h-64"
        style={{ minWidth: Math.max(320, data.length * 56) }}
      >
        <BarChart data={data}>
          <CartesianGrid vertical={false} />
          <XAxis dataKey="label" tickLine={false} axisLine={false} />
          <YAxis allowDecimals={false} />
          <ChartTooltip content={<ChartTooltipContent />} />
          <Bar dataKey="quantidade" fill="var(--color-quantidade)" radius={4} />
        </BarChart>
      </ChartContainer>
    </div>
  );
}
