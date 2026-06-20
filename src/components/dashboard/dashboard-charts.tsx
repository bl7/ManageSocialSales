"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { Card } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";

const COLORS = ["#0d9488", "#14b8a6", "#2dd4bf", "#5eead4", "#99f6e4", "#64748b"];

interface SalesChartProps {
  data: { date: string; revenue: number; units: number }[];
  currency: string;
}

export function SalesChart({ data, currency }: SalesChartProps) {
  if (data.length === 0) {
    return (
      <Card className="flex h-72 items-center justify-center">
        <p className="text-sm text-muted">No sales data yet</p>
      </Card>
    );
  }

  return (
    <Card>
      <h3 className="mb-4 font-semibold">Sales — Last 30 Days</h3>
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 11 }}
            tickFormatter={(v) => {
              const d = new Date(v);
              return `${d.getDate()}/${d.getMonth() + 1}`;
            }}
          />
          <YAxis tick={{ fontSize: 11 }} />
          <Tooltip
            formatter={(value, name) =>
              name === "revenue" ? formatCurrency(Number(value), currency) : value
            }
            labelFormatter={(label) => new Date(label).toLocaleDateString()}
          />
          <Bar dataKey="revenue" fill="#0d9488" radius={[4, 4, 0, 0]} name="Revenue" />
        </BarChart>
      </ResponsiveContainer>
    </Card>
  );
}

interface PlatformChartProps {
  data: { platform: string; revenue: number; count: number }[];
  currency: string;
}

export function PlatformChart({ data, currency }: PlatformChartProps) {
  if (data.length === 0) {
    return (
      <Card className="flex h-72 items-center justify-center">
        <p className="text-sm text-muted">No platform data this month</p>
      </Card>
    );
  }

  return (
    <Card>
      <h3 className="mb-4 font-semibold">Sales by Platform — This Month</h3>
      <ResponsiveContainer width="100%" height={260}>
        <PieChart>
          <Pie
            data={data}
            dataKey="revenue"
            nameKey="platform"
            cx="50%"
            cy="50%"
            outerRadius={90}
            label={({ name, percent }) =>
              `${name} ${((percent ?? 0) * 100).toFixed(0)}%`
            }
          >
            {data.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip formatter={(value) => formatCurrency(Number(value), currency)} />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </Card>
  );
}
