"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  FolderKanban,
  Clock,
  Users,
  TrendingUp,
  DollarSign,
  ArrowRight,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { usePermissions } from "@/hooks/use-permissions";
import { formatCurrency } from "@/lib/format";
import { ProgressBar } from "@/components/ui/progress-bar";

const STATUS_LABELS: Record<string, string> = {
  BACKLOG: "Backlog",
  TODO: "Por hacer",
  IN_PROGRESS: "En progreso",
  IN_REVIEW: "En revisión",
  DONE: "Hecho",
};

const PRIORITY_COLORS: Record<string, string> = {
  LOW: "bg-gray-100 text-gray-600",
  MEDIUM: "bg-blue-100 text-blue-700",
  HIGH: "bg-orange-100 text-orange-700",
  URGENT: "bg-red-100 text-red-700",
};

interface RecentTask {
  id: string;
  title: string;
  status: string;
  priority: string;
  project: { id: string; name: string };
}

interface BudgetStats {
  totalBudget: number;
  totalConsumed: number;
  remaining: number;
  weeklyBurn: number;
  projectCount: number;
}

interface DashboardStats {
  activeProjects: number;
  pendingTasks: number;
  hoursThisWeek: number;
  teamMembers: number;
  recentTasks: RecentTask[];
  role: string | null;
  budgetStats: BudgetStats | null;
}

interface DashboardContentProps {
  userName: string;
}

export function DashboardContent({ userName }: DashboardContentProps) {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const { isManager } = usePermissions();

  useEffect(() => {
    fetch("/api/dashboard/stats")
      .then((res) => res.json())
      .then(setStats)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const statCards: { name: string; value: string | number; icon: typeof FolderKanban }[] = [
    {
      name: "Proyectos activos",
      value: stats?.activeProjects ?? 0,
      icon: FolderKanban,
    },
    {
      name: "Tareas pendientes",
      value: stats?.pendingTasks ?? 0,
      icon: TrendingUp,
    },
    {
      name: "Horas esta semana",
      value: `${(stats?.hoursThisWeek ?? 0).toFixed(1)}h`,
      icon: Clock,
    },
  ];

  if (isManager) {
    statCards.push({
      name: "Miembros del equipo",
      value: stats?.teamMembers ?? 0,
      icon: Users,
    });
  }

  const budget = stats?.budgetStats;
  const percentageUsed =
    budget && budget.totalBudget > 0
      ? Math.min(Math.round((budget.totalConsumed / budget.totalBudget) * 100), 100)
      : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Bienvenido, {userName}</h1>
        <p className="text-muted-foreground">
          Resumen de tu espacio de trabajo
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <Card key={stat.name}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardDescription className="text-sm font-medium">
                {stat.name}
              </CardDescription>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <CardTitle className="text-2xl">
                {loading ? "—" : stat.value}
              </CardTitle>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Financial cards (managers only) */}
      {isManager && budget && (
        <div className="grid gap-4 sm:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardDescription className="text-sm font-medium">
                Presupuesto total
              </CardDescription>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <CardTitle className="text-2xl">
                {loading ? "—" : formatCurrency(budget.totalBudget)}
              </CardTitle>
              <p className="mt-1 text-xs text-muted-foreground">
                {budget.projectCount} proyecto{budget.projectCount !== 1 ? "s" : ""} con presupuesto
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardDescription className="text-sm font-medium">
                Costo consumido
              </CardDescription>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <CardTitle className="text-2xl">
                {loading ? "—" : formatCurrency(budget.totalConsumed)}
              </CardTitle>
              <div className="mt-2">
                <ProgressBar value={percentageUsed} />
                <p className="mt-1 text-xs text-muted-foreground">
                  {percentageUsed}% del presupuesto — Restante: {formatCurrency(budget.remaining)}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardDescription className="text-sm font-medium">
                Burn rate semanal
              </CardDescription>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <CardTitle className="text-2xl">
                {loading ? "—" : formatCurrency(budget.weeklyBurn)}
              </CardTitle>
              <p className="mt-1 text-xs text-muted-foreground">
                Últimos 7 días
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Recent tasks */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Mis tareas recientes</CardTitle>
          <CardDescription>
            Últimas tareas asignadas a ti
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground">Cargando...</p>
          ) : !stats?.recentTasks.length ? (
            <p className="text-sm text-muted-foreground">
              No tienes tareas asignadas aún.
            </p>
          ) : (
            <div className="space-y-3">
              {stats.recentTasks.map((task) => (
                <Link
                  key={task.id}
                  href={`/dashboard/projects/${task.project.id}`}
                  className="flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-muted/50"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      {task.title}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {task.project.name} — {STATUS_LABELS[task.status] || task.status}
                    </p>
                  </div>
                  <div className="ml-3 flex items-center gap-2">
                    <Badge
                      variant="secondary"
                      className={`text-[10px] ${PRIORITY_COLORS[task.priority] || ""}`}
                    >
                      {task.priority}
                    </Badge>
                    <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
