import axios from "axios";
import { getSession, signOut } from "next-auth/react";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
});

api.interceptors.request.use(async (config) => {
  const session = await getSession();
  
  if (session && session.accessToken) {
    config.headers.Authorization = `Bearer ${session.accessToken}`;
  }
  
  return config;
});

api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    if (error.response && error.response.status === 401) {
      console.warn("Sessão inválida ou expirada. Redirecionando...");
      
      if (typeof window !== "undefined") {
        await signOut({ redirect: false });
        window.location.href = "/"; 
      }
    }
    return Promise.reject(error);
  }
);

export default api;