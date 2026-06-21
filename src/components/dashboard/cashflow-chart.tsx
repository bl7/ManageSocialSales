"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Card } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";

interface Props {
  data: { date: string; money_in: number; money_out: number }[];
  currency: string;
}

export function CashflowChart({ data, currency }: Props) {
  const totalIn = data.reduce((s, d) => s + d.money_in, 0);
  const totalOut = data.reduce((s, d) => s + d.money_out, 0);

  return (
    <Card>
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h3 className="font-semibold">Cashflow (Last 7 Days)</h3>
        <div className="flex flex-wrap gap-4 text-sm">
          <span className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            Money In: <span className="font-medium text-success">{formatCurrency(totalIn, currency)}</span>
          </span>
          <span className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-rose-500" />
            Money Out: <span className="font-medium text-danger">{formatCurrency(totalOut, currency)}</span>
          </span>
        </div>
      </div>

      {data.every((d) => d.money_in === 0 && d.money_out === 0) ? (
        <div className="flex h-56 items-center justify-center text-sm text-muted">
          No cash movements in the last 7 days
        </div>
      ) : (
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
                formatCurrency(Number(value), currency) + (name === "money_out" ? "" : "")
              }
              labelFormatter={(label) => new Date(label).toLocaleDateString()}
            />
            <Legend />
            <Bar dataKey="money_in" fill="#10b981" radius={[4, 4, 0, 0]} name="Money In" />
            <Bar dataKey="money_out" fill="#f43f5e" radius={[4, 4, 0, 0]} name="Money Out" />
          </BarChart>
        </ResponsiveContainer>
      )}
    </Card>
  );
}
