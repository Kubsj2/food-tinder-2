import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { api } from '../api';

type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';
type Credentials = { email: string; password: string };

type AuthContextType = {
  status: AuthStatus;
  token: string | null;
  login: (c: Credentials) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  status: 'loading',
  token: null,
  login: async () => {},
  logout: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>('loading');
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const t = await AsyncStorage.getItem('token');
      setToken(t);
      setStatus(t ? 'authenticated' : 'unauthenticated');
    })();
  }, []);

  const login = useCallback(async ({ email, password }: Credentials) => {
    const data = await api.login({ email, password });
    const t = data.token as string;
    await AsyncStorage.setItem('token', t);
    setToken(t);
    setStatus('authenticated');
  }, []);

  // ...
const logout = useCallback(async () => {
  try {
    await api.logout();
  } catch (e) {
    console.warn(e);
  }
  await AsyncStorage.removeItem('token');
  setToken(null);
  setStatus('unauthenticated');
}, []);



  return <AuthContext.Provider value={{ status, token, login, logout }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
