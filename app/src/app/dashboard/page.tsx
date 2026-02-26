import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { FolderKanban, Clock, Users, TrendingUp } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const stats = [
  { name: "Proyectos activos", value: "0", icon: FolderKanban },
  { name: "Tareas pendientes", value: "0", icon: TrendingUp },
  { name: "Horas esta semana", value: "0h", icon: Clock },
  { name: "Miembros del equipo", value: "0", icon: Users },
];

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">
          Bienvenido, {session.user.name}
        </h1>
        <p className="text-muted-foreground">
          Resumen de tu espacio de trabajo
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.name}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardDescription className="text-sm font-medium">
                {stat.name}
              </CardDescription>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <CardTitle className="text-2xl">{stat.value}</CardTitle>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
