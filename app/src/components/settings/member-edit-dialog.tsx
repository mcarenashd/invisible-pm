"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

interface RoleOption {
  id: string;
  name: string;
  description: string | null;
}

interface MemberData {
  id: string;
  email: string;
  full_name: string;
  hourly_rate: string | null;
  is_active: boolean;
  role: { id: string; name: string };
  workspace_user_id: string;
}

interface MemberEditDialogProps {
  member: MemberData;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdated: (updated: MemberData) => void;
}

export function MemberEditDialog({
  member,
  open,
  onOpenChange,
  onUpdated,
}: MemberEditDialogProps) {
  const [roles, setRoles] = useState<RoleOption[]>([]);
  const [roleName, setRoleName] = useState(member.role.name);
  const [hourlyRate, setHourlyRate] = useState(
    member.hourly_rate ? String(member.hourly_rate) : ""
  );
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/roles")
      .then((res) => res.json())
      .then(setRoles)
      .catch(() => {});
  }, []);

  useEffect(() => {
    setRoleName(member.role.name);
    setHourlyRate(member.hourly_rate ? String(member.hourly_rate) : "");
  }, [member]);

  async function handleSave() {
    setSaving(true);

    const body: Record<string, unknown> = {};
    if (roleName !== member.role.name) {
      body.role_name = roleName;
    }
    const newRate = hourlyRate ? Number(hourlyRate) : null;
    const oldRate = member.hourly_rate ? Number(member.hourly_rate) : null;
    if (newRate !== oldRate) {
      body.hourly_rate = newRate;
    }

    if (Object.keys(body).length === 0) {
      onOpenChange(false);
      setSaving(false);
      return;
    }

    const res = await fetch(`/api/users/${member.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    setSaving(false);

    if (res.ok) {
      const updated = await res.json();
      toast.success("Miembro actualizado");
      onUpdated(updated);
    } else {
      const data = await res.json();
      toast.error(data.error || "Error al actualizar");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Editar miembro</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <p className="text-sm font-medium">{member.full_name}</p>
            <p className="text-xs text-muted-foreground">{member.email}</p>
          </div>

          <div className="space-y-2">
            <Label>Rol</Label>
            <Select value={roleName} onValueChange={setRoleName}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {roles.map((role) => (
                  <SelectItem key={role.id} value={role.name}>
                    {role.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="rate">Tarifa por hora (USD)</Label>
            <Input
              id="rate"
              type="number"
              min="0"
              step="0.01"
              value={hourlyRate}
              onChange={(e) => setHourlyRate(e.target.value)}
              placeholder="0.00"
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Guardando..." : "Guardar"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
