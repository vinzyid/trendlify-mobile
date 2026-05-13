import { createContext, useContext, useState, useEffect, useCallback } from "react";
import * as SecureStore from "expo-secure-store";

type AuthUser = {
  id: number;
  name: string;
  email: string;
  role: string;
  business_category: string | null;
  region_code: string | null;
};

type AuthContextType = {
  token: string | null;
  user: AuthUser | null;
  isLoggedIn: boolean;
  login: (token: string, user: AuthUser) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType>({
  token: null, user: null, isLoggedIn: false,
  login: () => {}, logout: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    (async () => {
      const t = await SecureStore.getItemAsync("trendlify_token");
      const u = await SecureStore.getItemAsync("trendlify_user");
      if (t && u) { setToken(t); setUser(JSON.parse(u)); }
    })();
  }, []);

  const login = useCallback(async (newToken: string, newUser: AuthUser) => {
    await SecureStore.setItemAsync("trendlify_token", newToken);
    await SecureStore.setItemAsync("trendlify_user", JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
  }, []);

  const logout = useCallback(async () => {
    await SecureStore.deleteItemAsync("trendlify_token");
    await SecureStore.deleteItemAsync("trendlify_user");
    setToken(null);
    setUser(null);
  }, []);

  return (
    <AuthContext value={{ token, user, isLoggedIn: !!token, login, logout }}>
      {children}
    </AuthContext>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
