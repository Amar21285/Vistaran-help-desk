
import React, { createContext, useState, useContext, ReactNode, useCallback, useEffect } from 'react';
import { User, Role, LoginStatus, UserStatus, Permission } from '../types';
import { USERS } from '../constants';
import { logUserAction } from '../utils/auditLogger';
import { useSettings } from './useSettings';

interface AuthContextType {
  user: User | null; // The effective user (admin or impersonated)
  realUser: User | null; // The originally logged-in admin
  login: (identity: string, password?: string) => { status: LoginStatus; pendingUser?: User };
  finalizeLogin: (user: User) => void;
  logout: () => void;
  updateUser: (updatedUserData: Partial<User> & { id: string }) => void;
  startImpersonation: (userId: string) => void;
  stopImpersonation: () => void;
  can: (permission: Permission) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Helper to get users from localStorage or fallback to constants
const getCurrentUsers = (): User[] => {
    try {
        const stored = localStorage.getItem('vistaran-helpdesk-users');
        return stored ? JSON.parse(stored) : USERS;
    } catch {
        return USERS;
    }
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [realUser, setRealUser] = useState<User | null>(null);
  const { rolePermissions } = useSettings();

  useEffect(() => {
    try {
        const savedUserId = localStorage.getItem('vistaran-helpdesk-userId');
        const impersonatedUserId = localStorage.getItem('vistaran-helpdesk-impersonatedUserId');

        if (savedUserId) {
            const currentUsers = getCurrentUsers();
            const loggedInUser = currentUsers.find(u => u.id === savedUserId);
            if (loggedInUser) {
                setRealUser(loggedInUser);
                if (impersonatedUserId && loggedInUser.role === Role.ADMIN) {
                    const targetUser = currentUsers.find(u => u.id === impersonatedUserId);
                    setUser(targetUser || loggedInUser); 
                } else {
                    setUser(loggedInUser);
                }
                // Lock layout for logged in users
                document.body.classList.add('app-is-logged-in');
            }
        }
    } catch (error) {
        console.error("Failed to load user from localStorage", error);
    }
  }, []);

  const can = useCallback((permission: Permission): boolean => {
    if (!user) return false;
    const permissions = rolePermissions[user.role] || [];
    return permissions.includes(permission);
  }, [user, rolePermissions]);

  const finalizeLogin = useCallback((foundUser: User) => {
    setUser(foundUser);
    setRealUser(foundUser);
    localStorage.setItem('vistaran-helpdesk-userId', foundUser.id);
    localStorage.removeItem('vistaran-helpdesk-impersonatedUserId');
    logUserAction(foundUser, 'Logged in.');
    // Lock layout
    document.body.classList.add('app-is-logged-in');
  }, []);


  const login = useCallback((identity: string, password?: string): { status: LoginStatus; pendingUser?: User } => {
    const currentUsers = getCurrentUsers();
    const foundUser = currentUsers.find(u => 
        (u.email.toLowerCase() === identity.toLowerCase() || u.name.toLowerCase() === identity.toLowerCase()) && 
        u.password === password
    );
    
    if (!foundUser) return { status: LoginStatus.INVALID_CREDENTIALS };
    if (foundUser.status !== UserStatus.ACTIVE) return { status: LoginStatus.USER_INACTIVE };
    if (foundUser.phone || foundUser.whatsapp) return { status: LoginStatus.OTP_REQUIRED, pendingUser: foundUser };
    
    finalizeLogin(foundUser);
    return { status: LoginStatus.SUCCESS };
  }, [finalizeLogin]);

  const logout = useCallback(() => {
    if (user) {
        logUserAction(user, 'Logged out.');
    }
    setUser(null);
    setRealUser(null);
    localStorage.removeItem('vistaran-helpdesk-userId');
    localStorage.removeItem('vistaran-helpdesk-impersonatedUserId');
    document.body.classList.remove('app-is-logged-in');
  }, [user]);

  const updateUser = useCallback((updatedUserData: Partial<User> & { id: string }) => {
    const isForRealUser = realUser?.id === updatedUserData.id;
    const isForCurrentUser = user?.id === updatedUserData.id;
    if (isForCurrentUser) setUser(currentUser => currentUser ? { ...currentUser, ...updatedUserData } : null);
    if (isForRealUser) setRealUser(currentRealUser => currentRealUser ? { ...currentRealUser, ...updatedUserData } : null);
  }, [user, realUser]);

  const startImpersonation = useCallback((userId: string) => {
    if (realUser?.role !== Role.ADMIN) return;
    const currentUsers = getCurrentUsers();
    const targetUser = currentUsers.find(u => u.id === userId);
    if (targetUser) {
        setUser(targetUser);
        localStorage.setItem('vistaran-helpdesk-impersonatedUserId', userId);
        logUserAction(realUser, `Started impersonating: ${targetUser.name}`);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [realUser]);

  const stopImpersonation = useCallback(() => {
    if (realUser) {
      logUserAction(realUser, 'Stopped impersonation.');
      setUser(realUser);
      localStorage.removeItem('vistaran-helpdesk-impersonatedUserId');
    }
  }, [realUser]);

  return (
    <AuthContext.Provider value={{ user, realUser, login, finalizeLogin, logout, updateUser, startImpersonation, stopImpersonation, can }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
