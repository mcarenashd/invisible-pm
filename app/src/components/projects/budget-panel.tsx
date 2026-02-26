"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ProgressBar } from "@/components/ui/progress-bar";
import { usePermissions } from "@/hooks/use-permissions";
import { formatCurrency, formatHours } from "@/lib/format";

interface BudgetBreakdown {
  user_id: string;
  name: string;
  hours: number;
  cost: number;
}

interface BudgetData {
  total_budget: number;
  total_cost: number;
  remaining: number;
  total_hours: number;
  currency: string;
  percentage_used: number;
  breakdown: BudgetBreakdown[];
}

interface BudgetPanelProps {
  projectId: string;
  totalBudget: number | null;
  currency: string;
  moduleBudget: boolean;
}

export function BudgetPanel({
  projectId,
  totalBudget,
  currency,
  moduleBudget,
}: BudgetPanelProps) {
  const [data, setData] = useState<BudgetData | null>(null);
  const [loading, setLoading] = useState(true);
  const { can } = usePermissions();

  const visible = moduleBudget && can("budget:read");

  useEffect(() => {
    if (!visible) {
      setLoading(false);
      return;
    }

    fetch(`/api/projects/${projectId}/budget`)
      .then((res) => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [projectId, visible]);

  if (!visible) return null;

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Presupuesto</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Cargando...</p>
        </CardContent>
      </Card>
    );
  }

  if (!data) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Presupuesto</CardTitle>
        <CardDescription>
          {formatHours(data.total_hours)} registradas en este proyecto
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Summary */}
        <div className="grid grid-cols-3 gap-4">
          <div>
            <p className="text-xs font-medium text-muted-foreground">
              Planificado
            </p>
            <p className="text-lg font-semibold">
              {formatCurrency(data.total_budget, currency)}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground">
              Consumido
            </p>
            <p className="text-lg font-semibold">
              {formatCurrency(data.total_cost, currency)}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground">
              Restante
            </p>
            <p className="text-lg font-semibold">
              {formatCurrency(data.remaining, currency)}
            </p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{data.percentage_used}% consumido</span>
            <span>{100 - data.percentage_used}% restante</span>
          </div>
          <ProgressBar value={data.percentage_used} />
        </div>

        {/* Breakdown by member */}
        {data.breakdown.length > 0 && (
          <>
            <Separator />
            <div>
              <p className="mb-2 text-sm font-medium">Desglose por miembro</p>
              <div className="space-y-2">
                {data.breakdown.map((row) => (
                  <div
                    key={row.user_id}
                    className="flex items-center justify-between text-sm"
                  >
                    <span>{row.name}</span>
                    <div className="flex items-center gap-3 text-muted-foreground">
                      <span>{formatHours(row.hours)}</span>
                      <span className="font-medium text-foreground">
                        {formatCurrency(row.cost, currency)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
