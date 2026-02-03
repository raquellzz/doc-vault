"use client";

import { signOut, useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

export function LogoutButton() {
  const { data: session } = useSession();

  const handleLogout = async () => {
    console.log("Tentando logout. ID Token disponível?", !!session?.idToken);
    console.log("Token:", session?.idToken ? session.idToken.substring(0, 10) + "..." : "NENHUM");

    const keycloakUrl = process.env.NEXT_PUBLIC_KEYCLOAK_ISSUER || "http://localhost:8080/realms/DocVault";
    const logoutUrl = `${keycloakUrl}/protocol/openid-connect/logout`;
    const redirectUri = window.location.origin; 

    const idToken = session?.idToken;

    if (idToken) {
        const fullUrl = `${logoutUrl}?post_logout_redirect_uri=${encodeURIComponent(redirectUri)}&id_token_hint=${idToken}`;
        await signOut({ callbackUrl: fullUrl });
    } else {
        console.warn("Sem idToken para logout federado. Deslogando apenas localmente.");
        await signOut({ callbackUrl: "/" });
    }
  };

  return (
    <Button 
      variant="outline" 
      className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
      onClick={handleLogout}
    >
      <LogOut className="mr-2 h-4 w-4" /> 
      Sair
    </Button>
  );
}