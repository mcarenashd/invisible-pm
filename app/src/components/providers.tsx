"use client";

import { useEffect } from "react";
import { SessionProvider, useSession } from "next-auth/react";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import { useAuthStore } from "@/stores/auth-store";

function AuthLoader({ children }: { children: React.ReactNode }) {
  const { status } = useSession();
  const fetchMe = useAuthStore((s) => s.fetchMe);

  useEffect(() => {
    if (status === "authenticated") {
      fetchMe();
    }
  }, [status, fetchMe]);

  return <>{children}</>;
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <TooltipProvider>
        <AuthLoader>
          {children}
          <Toaster position="bottom-right" richColors />
        </AuthLoader>
      </TooltipProvider>
    </SessionProvider>
  );
}
