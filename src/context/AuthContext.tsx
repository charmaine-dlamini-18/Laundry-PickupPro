import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import type { Role, User } from '../types';
import { supabase } from '../lib/supabase';

type AuthContextValue = {
  isAuthenticated: boolean;
  role: Role | null;
  user: User | null;
  hasSignedInBefore: boolean;
  lastRole: Role | null;
  signIn: (role: Role, user: User) => void;
  signOut: () => Promise<void>;
  updateUser: (patch: Partial<Omit<User, 'id' | 'role'>>) => Promise<void>;
  changePassword: (
    currentPassword: string,
    newPassword: string
  ) => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

async function loadUserProfile(userId: string): Promise<User | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, name, email, phone, role')
    .eq('id', userId)
    .single();

  if (error || !data) {
    return null;
  }

  return {
    id: data.id,
    name: data.name,
    email: data.email,
    phone: data.phone ?? '',
    role: data.role as Role,
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<Role | null>(null);
  const [hasSignedInBefore, setHasSignedInBefore] = useState(false);
  const [lastRole, setLastRole] = useState<Role | null>(null);

  const signIn = useCallback((nextRole: Role, nextUser: User) => {
    setUser(nextUser);
    setRole(nextRole);
    setHasSignedInBefore(true);
    setLastRole(nextRole);
  }, []);

  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut();

    if (error) {
      throw new Error(error.message);
    }

    setUser(null);
    setRole(null);
  }, []);

  const updateUser = useCallback(
    async (patch: Partial<Omit<User, 'id' | 'role'>>) => {
      if (!user) {
        return;
      }

      const { error } = await supabase
        .from('profiles')
        .update({
          name: patch.name,
          email: patch.email,
          phone: patch.phone,
        })
        .eq('id', user.id);

      if (error) {
        throw new Error(error.message);
      }

      setUser((current) =>
        current
          ? {
              ...current,
              ...patch,
            }
          : current
      );
    },
    [user]
  );

  const changePassword = useCallback(
    async (_currentPassword: string, newPassword: string) => {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        throw new Error(error.message);
      }
    },
    []
  );

  useEffect(() => {
    let mounted = true;

    const loadInitialSession = async () => {
      const { data, error } = await supabase.auth.getSession();

      if (error || !mounted || !data.session) {
        return;
      }

      const profile = await loadUserProfile(data.session.user.id);

      if (!mounted || !profile) {
        return;
      }

      setUser(profile);
      setRole(profile.role);
      setHasSignedInBefore(true);
      setLastRole(profile.role);
    };

    loadInitialSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) {
        return;
      }

      if (!session) {
        setUser(null);
        setRole(null);
        return;
      }

      if (event === 'SIGNED_IN') {
        const profile = await loadUserProfile(session.user.id);

        if (!mounted || !profile) {
          return;
        }

        setUser(profile);
        setRole(profile.role);
        setHasSignedInBefore(true);
        setLastRole(profile.role);

        if (typeof history !== 'undefined') {
          history.replaceState(null, '', window.location.pathname);
        }
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      isAuthenticated: user !== null,
      role,
      user,
      hasSignedInBefore,
      lastRole,
      signIn,
      signOut,
      updateUser,
      changePassword,
    }),
    [
      user,
      role,
      hasSignedInBefore,
      lastRole,
      signIn,
      signOut,
      updateUser,
      changePassword,
    ]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
}