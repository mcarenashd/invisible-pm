import { SettingsContent } from "@/components/settings/settings-content";

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Configuración</h1>
        <p className="text-muted-foreground">
          Gestiona tu espacio de trabajo y equipo
        </p>
      </div>
      <SettingsContent />
    </div>
  );
}
