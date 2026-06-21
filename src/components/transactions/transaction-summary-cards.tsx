import { Card, CardTitle, CardValue } from "@/components/ui/card";
import { SummaryGrid } from "@/components/ui/page";
import { formatCurrency } from "@/lib/utils";
import { ArrowDownLeft, ArrowUpRight, Scale } from "lucide-react";

interface Props {
  summary: { money_in: number; money_out: number; net: number; count: number };
  currency: string;
}

export function TransactionSummaryCards({ summary, currency }: Props) {
  return (
    <SummaryGrid cols={3}>
      <Card className="border-emerald-200 bg-gradient-to-br from-emerald-50/80 to-white">
        <div className="flex items-start justify-between">
          <CardTitle>Money In</CardTitle>
          <ArrowDownLeft className="h-5 w-5 text-success" />
        </div>
        <CardValue className="text-success">{formatCurrency(summary.money_in, currency)}</CardValue>
      </Card>
      <Card className="border-rose-200 bg-gradient-to-br from-rose-50/80 to-white">
        <div className="flex items-start justify-between">
          <CardTitle>Money Out</CardTitle>
          <ArrowUpRight className="h-5 w-5 text-danger" />
        </div>
        <CardValue className="text-danger">{formatCurrency(summary.money_out, currency)}</CardValue>
      </Card>
      <Card>
        <div className="flex items-start justify-between">
          <CardTitle>Net Flow</CardTitle>
          <Scale className="h-5 w-5 text-primary/70" />
        </div>
        <CardValue className={summary.net >= 0 ? "text-success" : "text-danger"}>
          {formatCurrency(summary.net, currency)}
        </CardValue>
        <p className="mt-1 text-xs text-muted">{summary.count} transaction(s)</p>
      </Card>
    </SummaryGrid>
  );
}
