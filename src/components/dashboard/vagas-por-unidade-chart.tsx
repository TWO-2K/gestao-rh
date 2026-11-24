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
    label: "Vagas abertas",
    color: "var(--primary)",
  },
} satisfies ChartConfig;

export function VagasPorUnidadeChart({
  data,
}: {
  data: { unidade: string; quantidade: number }[];
}) {
  return (
    <ChartContainer config={chartConfig} className="aspect-auto h-64 w-full">
      <BarChart data={data} layout="vertical" margin={{ left: 12 }}>
        <CartesianGrid horizontal={false} />
        <XAxis type="number" allowDecimals={false} />
        <YAxis
          dataKey="unidade"
          type="category"
          width={110}
          tickLine={false}
          axisLine={false}
        />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Bar dataKey="quantidade" fill="var(--color-quantidade)" radius={4} />
      </BarChart>
    </ChartContainer>
  );
}
