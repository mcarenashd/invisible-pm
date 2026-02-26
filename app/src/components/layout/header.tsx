"use client";

import { signOut, useSession } from "next-auth/react";
import { LogOut, User } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function Header() {
  const { data: session } = useSession();

  return (
    <header className="flex h-14 items-center justify-between border-b bg-background px-6">
      <div />

      <DropdownMenu>
        <DropdownMenuTrigger className="flex items-center gap-2 rounded-md p-1.5 hover:bg-muted">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="text-xs">
              {session?.user?.name ? getInitials(session.user.name) : "?"}
            </AvatarFallback>
          </Avatar>
          <span className="text-sm font-medium">
            {session?.user?.name ?? "Usuario"}
          </span>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <div className="px-2 py-1.5">
            <p className="text-sm font-medium">{session?.user?.name}</p>
            <p className="text-xs text-muted-foreground">
              {session?.user?.email}
            </p>
          </div>
          <DropdownMenuSeparator />
          <DropdownMenuItem>
            <User className="mr-2 h-4 w-4" />
            Mi perfil
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => signOut({ callbackUrl: "/login" })}>
            <LogOut className="mr-2 h-4 w-4" />
            Cerrar sesión
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
