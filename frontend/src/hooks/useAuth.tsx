import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { CarbonDeveloper } from '../types';
import * as authService from '../services/auth.service';

interface AuthContextType {
  developer: CarbonDeveloper | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  register: (payload: authService.RegisterPayload) => Promise<void>;
  login: (payload: authService.LoginPayload) => Promise<void>;
  logout: () => void;
  updateProfile: (payload: Partial<CarbonDeveloper>) => Promise<void>;
  refreshProfile: () => Promise<CarbonDeveloper | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [developer, setDeveloper] = useState<CarbonDeveloper | null>(() => {
    try {
      const saved = localStorage.getItem('developer');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState<string | null>(() => {
    try {
      return localStorage.getItem('token') || null;
    } catch {
      return null;
    }
  });
  const [isLoading, setIsLoading] = useState(false);

  const refreshProfile = async (): Promise<CarbonDeveloper | null> => {
    try {
      const res = await authService.getMe();
      if (res.developer) {
        setDeveloper(res.developer);
        localStorage.setItem('developer', JSON.stringify(res.developer));
        return res.developer;
      }
    } catch (err) {
      // ignore
    }
    return null;
  };

  // Sync with server in background if token exists
  useEffect(() => {
    const savedToken = localStorage.getItem('token');
    if (savedToken) {
      refreshProfile();
    }
  }, []);


  const register = async (payload: authService.RegisterPayload) => {
    const result = await authService.register(payload);
    if (result.token && result.developer) {
      setToken(result.token);
      setDeveloper(result.developer);
      localStorage.setItem('token', result.token);
      localStorage.setItem('developer', JSON.stringify(result.developer));
    }
  };

  const login = async (payload: authService.LoginPayload) => {
    const result = await authService.login(payload);
    if (result.token && result.developer) {
      setToken(result.token);
      setDeveloper(result.developer);
      localStorage.setItem('token', result.token);
      localStorage.setItem('developer', JSON.stringify(result.developer));
    }
  };

  const logout = () => {
    setDeveloper(null);
    setToken(null);
    localStorage.removeItem('token');
    localStorage.removeItem('developer');
  };

  const updateProfile = async (payload: Partial<CarbonDeveloper>) => {
    const result = await authService.updateProfile(payload);
    if (result.developer) {
      setDeveloper(result.developer);
      localStorage.setItem('developer', JSON.stringify(result.developer));
    }
  };

  return (
    <AuthContext.Provider
      value={{
        developer,
        token,
        isLoading,
        isAuthenticated: !!token,
        register,
        login,
        logout,
        updateProfile,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
