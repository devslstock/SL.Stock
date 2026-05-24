import React, { createContext, useContext, useState, useEffect } from 'react';
import { usersApi } from '@/api/users';
import { companiesApi } from '@/api/companies';
import type { User, UserPermissions, Company } from '@/types/database';

interface AuthContextType {
  user: User | null;
  company: Company | null;
  login: (username: string, password_hash: string) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
  hasPermission: (permission: keyof UserPermissions) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Global variable for API layer to use
export let currentCompanyId: string | null = localStorage.getItem('auth_company_id');

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check local storage for existing session
    const storedUserId = localStorage.getItem('auth_user_id');
    if (storedUserId) {
      usersApi.getUsers().then(async users => {
        const found = users.find(u => u.id === storedUserId && u.active);
        if (found) {
          const comp = await companiesApi.getCompany(found.company_id);
          if (comp && comp.active) {
            currentCompanyId = comp.id;
            localStorage.setItem('auth_company_id', comp.id);
            setUser(found);
            setCompany(comp);
          } else {
            currentCompanyId = null;
            localStorage.removeItem('auth_user_id');
            localStorage.removeItem('auth_company_id');
          }
        } else {
          currentCompanyId = null;
          localStorage.removeItem('auth_user_id');
          localStorage.removeItem('auth_company_id');
        }
      }).finally(() => {
        setIsLoading(false);
      });
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = async (username: string, password_hash: string) => {
    try {
      const found = await usersApi.login(username, password_hash);

      if (found) {
        const comp = await companiesApi.getCompany(found.company_id);
        if (comp && comp.active) {
          currentCompanyId = comp.id;
          localStorage.setItem('auth_company_id', comp.id);
          setUser(found);
          setCompany(comp);
          localStorage.setItem('auth_user_id', found.id);
          return true;
        }
      }
      return false;
    } catch (e) {
      console.error('Login error', e);
      return false;
    }
  };

  const logout = () => {
    currentCompanyId = null;
    setUser(null);
    setCompany(null);
    localStorage.removeItem('auth_user_id');
    localStorage.removeItem('auth_company_id');
  };

  const hasPermission = (permission: keyof UserPermissions) => {
    // Admin has all permissions implicitly
    if (user?.role === 'admin') return true;
    return user?.permissions?.[permission] === true;
  };

  return (
    <AuthContext.Provider value={{ user, company, login, logout, isLoading, hasPermission }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
