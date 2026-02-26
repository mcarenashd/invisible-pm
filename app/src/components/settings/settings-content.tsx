"use client";

import { useEffect, useState } from "react";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Pencil } from "lucide-react";
import { usePermissions } from "@/hooks/use-permissions";
import { MemberEditDialog } from "@/components/settings/member-edit-dialog";

interface WorkspaceMember {
  id: string;
  email: string;
  full_name: string;
  hourly_rate: string | null;
  is_active: boolean;
  role: { id: string; name: string };
  workspace_user_id: string;
}

export function SettingsContent() {
  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [editMember, setEditMember] = useState<WorkspaceMember | null>(null);
  const { can, workspaceId, workspaceName } = usePermissions();

  const canManageUsers = can("user:manage");

  useEffect(() => {
    if (!workspaceId) return;

    fetch(`/api/users?workspace_id=${workspaceId}`)
      .then((res) => res.json())
      .then(setMembers)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [workspaceId]);

  function handleMemberUpdated(updated: WorkspaceMember) {
    setMembers((prev) =>
      prev.map((m) => (m.id === updated.id ? { ...m, ...updated } : m))
    );
    setEditMember(null);
  }

  return (
    <Tabs defaultValue="general" className="w-full">
      <TabsList>
        <TabsTrigger value="general">General</TabsTrigger>
        <TabsTrigger value="members">Miembros</TabsTrigger>
      </TabsList>

      <TabsContent value="general" className="mt-4">
        <Card>
          <CardHeader>
            <CardTitle>Espacio de trabajo</CardTitle>
            <CardDescription>
              Información general del workspace
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Nombre
              </p>
              <p className="text-sm">{workspaceName || "—"}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                ID del workspace
              </p>
              <p className="font-mono text-xs text-muted-foreground">
                {workspaceId || "—"}
              </p>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="members" className="mt-4">
        <Card>
          <CardHeader>
            <CardTitle>Miembros del equipo</CardTitle>
            <CardDescription>
              {members.length} miembros en el workspace
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-sm text-muted-foreground">Cargando...</p>
            ) : members.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No hay miembros registrados.
              </p>
            ) : (
              <div className="space-y-3">
                {members.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium">
                        {member.full_name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {member.email}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className="text-xs">
                        {member.role.name}
                      </Badge>
                      {member.hourly_rate && (
                        <span className="text-xs text-muted-foreground">
                          ${Number(member.hourly_rate).toFixed(2)}/h
                        </span>
                      )}
                      {canManageUsers && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setEditMember(member)}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {editMember && (
          <MemberEditDialog
            member={editMember}
            open={!!editMember}
            onOpenChange={(open) => !open && setEditMember(null)}
            onUpdated={handleMemberUpdated}
          />
        )}
      </TabsContent>
    </Tabs>
  );
}
