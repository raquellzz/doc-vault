"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bot, FileText, Home, LayoutDashboard, LogOut, Menu, Settings, User } from "lucide-react";
import { useSession, signOut } from "next-auth/react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ThemeToggle } from "./ThemeToggle";

export function Navbar() {
  const pathname = usePathname();
  const { data: session } = useSession();

  if (pathname === "/" || pathname === "/login") return null;

    const isAdmin = session?.roles?.includes("admin");

    const navItems = [
        { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, requiredRole: "viewer" }, // Todos acessam
        { href: "/dashboard/chat", label: "Chat IA", icon: Bot, requiredRole: "viewer" },
        { href: "/dashboard/documents", label: "Documentos", icon: FileText, requiredRole: "admin" }, 
    ];

    const filteredNavItems = navItems.filter(item => {
    if (item.requiredRole === "admin") return isAdmin;
    return true;
  });

  const handleLogout = async () => {
    const keycloakLogoutUrl = process.env.NEXT_PUBLIC_KEYCLOAK_ISSUER 
      ? `${process.env.NEXT_PUBLIC_KEYCLOAK_ISSUER}/protocol/openid-connect/logout`
      : "http://localhost:8080/realms/DocVault/protocol/openid-connect/logout";
    const returnTo = window.location.origin;
    const idToken = session?.idToken;

    document.cookie.split(";").forEach(cookie => {
        const eqPos = cookie.indexOf("=");
        const name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie;
        document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/";
    });
    localStorage.clear();
    sessionStorage.clear();

    let finalUrl = `${keycloakLogoutUrl}?post_logout_redirect_uri=${encodeURIComponent(returnTo)}`;
    if (idToken) finalUrl += `&id_token_hint=${idToken}`;

    await signOut({ redirect: false });
    window.location.href = finalUrl;
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200 dark:border-slate-800 bg-white/75 dark:bg-slate-950/75 backdrop-blur-md">
      <div className="container flex h-16 items-center justify-between px-4 md:px-8 mx-auto max-w-7xl">
        
        <div className="flex items-center gap-6 md:gap-10">
          <Link href="/dashboard" className="flex items-center space-x-2">
            <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-emerald-500 bg-clip-text text-transparent">
              DocVault
            </span>
          </Link>

          <nav className="hidden md:flex gap-6">
            {filteredNavItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center text-sm font-medium transition-colors hover:text-blue-600 dark:hover:text-blue-400",
                  pathname === item.href
                    ? "text-blue-600 dark:text-blue-400"
                    : "text-slate-600 dark:text-slate-400"
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>

        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="md:hidden shrink-0">
              <Menu className="h-5 w-5" />
              <span className="sr-only">Menu de navegação</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="dark:bg-slate-950 dark:border-slate-800">
            <nav className="grid gap-6 text-lg font-medium mt-10">
              <Link href="/dashboard" className="flex items-center gap-2 text-lg font-bold mb-4 bg-gradient-to-r from-blue-600 to-emerald-500 bg-clip-text text-transparent">
                DocVault
              </Link>
              {filteredNavItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-4 px-2.5 text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-all",
                    pathname === item.href && "text-blue-600 dark:text-blue-400 font-semibold"
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  {item.label}
                </Link>
              ))}
            </nav>
          </SheetContent>
        </Sheet>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                <Avatar className="h-9 w-9 border-2 border-slate-200 dark:border-slate-800">
                  <AvatarFallback className="bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200">
                    <User className="h-5 w-5" />
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{session?.user?.name || "Usuário"}</p>
                  <p className="text-xs leading-none text-muted-foreground">{session?.user?.email}</p>
                  <p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold mt-1">
                    {isAdmin ? "Administrador" : "Visualizador"}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/dashboard/profile" className="cursor-pointer">
                  <User className="mr-2 h-4 w-4" /> Perfil
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem disabled>
                <Settings className="mr-2 h-4 w-4" /> Configurações
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-red-600 dark:text-red-400 cursor-pointer focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950/50">
                <LogOut className="mr-2 h-4 w-4" /> Sair
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}