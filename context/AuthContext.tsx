import React, { createContext, useContext, useState } from "react";
import * as SecureStore from "expo-secure-store";
import { login, logout } from "../api/auth";
import { setToken } from "../api/client";

interface AuthContextType {
  user: any;
  handleLogin: (email: string, password: string) => Promise<void>;
  handleLogout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<any>(null);

  const handleLogin = async (email: string, password: string) => {
    const data = await login(email, password);
    setUser(data.user);
    setToken(data.token);
    await SecureStore.setItemAsync("token", data.token);
  };

  const handleLogout = async () => {
    await logout();
    await SecureStore.deleteItemAsync("token");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, handleLogin, handleLogout }}>
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
