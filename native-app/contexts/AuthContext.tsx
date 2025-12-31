import React, { createContext, useContext, useState, useEffect } from 'react';
import { authApi, userManager } from '../services/api';
import type { User, LoginRequest, RegisterRequest } from '../types/api';

interface AuthContextType {
   user: User | null;
   isLoading: boolean;
   isAuthenticated: boolean;
   login: (credentials: LoginRequest) => Promise<void>;
   register: (data: RegisterRequest) => Promise<void>;
   logout: () => Promise<void>;
   refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
   const [user, setUser] = useState<User | null>(null);
   const [isLoading, setIsLoading] = useState(true);

   useEffect(() => {
      // Check if user is already logged in
      checkAuthStatus();
   }, []);

   const checkAuthStatus = async () => {
      try {
         // Check if user is authenticated via API
         const isAuth = await authApi.isAuthenticated();

         if (isAuth) {
            // Always fetch fresh user data with classes from API
            await refreshUser();
         }
      } catch (error) {
         console.error('Error checking auth status:', error);
         // Clear user data if authentication fails
         setUser(null);
      } finally {
         setIsLoading(false);
      }
   };

   const login = async (credentials: LoginRequest) => {
      try {
         const response = await authApi.login(credentials);
         if (response.success && response.data) {
            setUser(response.data.user);
         } else {
            throw new Error(response.message || 'Login failed');
         }
      } catch (error) {
         console.error('Login error:', error);
         throw error;
      }
   };

   const register = async (data: RegisterRequest) => {
      try {
         const response = await authApi.register(data);
         if (response.success && response.data) {
            setUser(response.data.user);
         } else {
            throw new Error(response.message || 'Registration failed');
         }
      } catch (error) {
         console.error('Registration error:', error);
         throw error;
      }
   };

   const logout = async () => {
      try {
         await authApi.logout();
      } catch (error) {
         console.error('Error logging out:', error);
      } finally {
         setUser(null);
      }
   };

   const refreshUser = async () => {
      try {
         const response = await authApi.me();
         if (response.success && response.data) {
            // Store user with classes data
            const userData = {
               ...response.data.user,
               classes: response.data.classes || [],
            };
            setUser(userData);
         }
      } catch (error) {
         console.error('Error refreshing user:', error);
         throw error;
      }
   };

   return (
      <AuthContext.Provider
         value={{
            user,
            isLoading,
            isAuthenticated: !!user,
            login,
            register,
            logout,
            refreshUser,
         }}
      >
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
