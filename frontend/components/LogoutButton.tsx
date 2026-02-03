"use client";

import { signOut, useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";


export function LogoutButton() {
  const { data: session } = useSession();

  const handleLogout = async () => {
    const keycloakLogoutUrl = process.env.NEXT_PUBLIC_KEYCLOAK_ISSUER 
      ? `${process.env.NEXT_PUBLIC_KEYCLOAK_ISSUER}/protocol/openid-connect/logout`
      : "http://localhost:8080/realms/DocVault/protocol/openid-connect/logout";
      
    const returnTo = window.location.origin;

    const idToken = session?.idToken;

    const cookies = document.cookie.split(";");

    for (let i = 0; i < cookies.length; i++) {
        const cookie = cookies[i];
        const eqPos = cookie.indexOf("=");
        const name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie;
        document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/";
    }
    
    localStorage.clear();
    sessionStorage.clear();

    console.log("🧹 Cookies locais limpos via script.");

    let finalUrl = `${keycloakLogoutUrl}?post_logout_redirect_uri=${encodeURIComponent(returnTo)}`;
    
    if (idToken) {
      finalUrl += `&id_token_hint=${idToken}`;
    }

    await signOut({ redirect: false });
    window.location.href = finalUrl;
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