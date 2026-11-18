import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { api, TOKEN_KEY } from '../services/api.ts';

export type UserRole = 'student' | 'contributor' | 'campus_lead' | 'reviewer' | 'admin';

export interface AcademicProfile {
  universityId: string | null;
  programmeId: string | null;
  branchId: string | null;
  academicYearId: string | null;
  semesterId: string | null;
  curriculumSchemeId: string | null;
  universityName?: string;
  universityCode?: string;
  programmeName?: string;
  branchName?: string;
  academicYearLabel?: string;
  semesterName?: string;
  curriculumSchemeName?: string;
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: string;
  phone?: string;
  collegeName?: string;
  onboardingCompleted: boolean;
  academicProfile: AcademicProfile;
  activeEntitlements: any[];
  createdAt?: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<AuthUser>;
  register: (data: { name: string; email: string; password: string; role?: string; collegeName?: string }) => Promise<AuthUser>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  setUser: React.Dispatch<React.SetStateAction<AuthUser | null>>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  loading: true,
  login: async () => {
    throw new Error('AuthProvider missing');
  },
  register: async () => {
    throw new Error('AuthProvider missing');
  },
  logout: () => {},
  refreshUser: async () => {},
  setUser: () => {},
});

export function getDefaultRouteForRole(user: AuthUser): string {
  if ((user.role === 'student' || user.role === 'contributor') && !user.onboardingCompleted) {
    return '/onboarding';
  }
  switch (user.role) {
    case 'admin':
      return '/admin';
    case 'reviewer':
      return '/reviewer';
    case 'campus_lead':
      return '/campus-lead';
    case 'contributor':
      return '/contributor';
    default:
      return '/student/dashboard';
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const res = await api.get('/auth/me');
      setUser(res.data.user);
    } catch {
      localStorage.removeItem(TOKEN_KEY);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const login = async (email: string, password: string) => {
    const res = await api.post('/auth/login', { email, password });
    localStorage.setItem(TOKEN_KEY, res.data.token);
    setUser(res.data.user);
    return res.data.user as AuthUser;
  };

  const register = async (data: { name: string; email: string; password: string; role?: string; collegeName?: string }) => {
    const res = await api.post('/auth/register', data);
    localStorage.setItem(TOKEN_KEY, res.data.token);
    setUser(res.data.user);
    return res.data.user as AuthUser;
  };

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
