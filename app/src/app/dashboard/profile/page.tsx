import { ProfileContent } from "@/components/profile/profile-content";

export default function ProfilePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Mi Perfil</h1>
        <p className="text-muted-foreground">
          Gestiona tu información personal y contraseña
        </p>
      </div>
      <ProfileContent />
    </div>
  );
}
