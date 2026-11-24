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
    color: "var(--accent)",
  },
} satisfies ChartConfig;

export function VagasPorSetorChart({
  data,
}: {
  data: { setor: string; quantidade: number }[];
}) {
  return (
    <ChartContainer config={chartConfig} className="aspect-auto h-64 w-full">
      <BarChart data={data}>
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="setor"
          tickLine={false}
          axisLine={false}
          interval={0}
          angle={-30}
          textAnchor="end"
          height={60}
        />
        <YAxis allowDecimals={false} />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Bar dataKey="quantidade" fill="var(--color-quantidade)" radius={4} />
      </BarChart>
    </ChartContainer>
  );
}
