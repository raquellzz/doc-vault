import NextAuth from "next-auth";

declare module "next-auth" {
  /**
   * O que é retornado no hook useSession, getSession e getServerSession
   */
  interface Session {
    accessToken?: string;
    idToken?: string;
    user: {
      id?: string;
    } & DefaultSession["user"]
  }
}

declare module "next-auth/jwt" {
  /**
   * O que é retornado no callback JWT
   */
  interface JWT {
    accessToken?: string;
    refreshToken?: string;
    idToken?: string;
  }
}