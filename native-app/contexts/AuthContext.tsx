import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface User {
   id: string;
   name: string;
   email: string;
}

interface AuthContextType {
   user: User | null;
   isLoading: boolean;
   isAuthenticated: boolean;
   login: () => Promise<void>;
   logout: () => Promise<void>;
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
         const userData = await AsyncStorage.getItem('user');
         if (userData) {
            setUser(JSON.parse(userData));
         }
      } catch (error) {
         console.error('Error checking auth status:', error);
      } finally {
         setIsLoading(false);
      }
   };

   const login = async () => {
      try {
         // Create a default authenticated user
         const userData: User = {
            id: '1',
            name: 'User',
            email: 'user@example.com',
         };
         await AsyncStorage.setItem('user', JSON.stringify(userData));
         setUser(userData);
      } catch (error) {
         throw error;
      }
   };

   const logout = async () => {
      try {
         await AsyncStorage.removeItem('user');
         setUser(null);
      } catch (error) {
         console.error('Error logging out:', error);
      }
   };

   return (
      <AuthContext.Provider
         value={{
            user,
            isLoading,
            isAuthenticated: !!user,
            login,
            logout,
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
