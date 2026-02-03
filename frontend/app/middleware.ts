export { default } from "next-auth/middleware";

// Define quais rotas são protegidas
export const config = {
  matcher: [
    "/dashboard/:path*", // Protege tudo que estiver dentro de /dashboard
    "/chat/:path*"       // Protege o chat
  ],
};