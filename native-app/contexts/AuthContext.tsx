import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useCurrentUser, useGoogleSignIn, useLogout } from '../hooks/queries';
import { queryKeys } from '../services/queryKeys';
import { tokenStore } from '../services/api';
import type { User } from '../types/api';

interface AuthContextType {
   user: User | null;
   isLoading: boolean;
   isAuthenticated: boolean;
   googleSignIn: (params: { idToken?: string; code?: string; redirectUri?: string }) => Promise<void>;
   logout: () => Promise<void>;
   refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
   const [hasToken, setHasToken] = useState<boolean | null>(null);
   const queryClient = useQueryClient();

   // Boot: load token from AsyncStorage into the in-memory TokenStore once
   useEffect(() => {
      tokenStore.initialize().then((exists) => {
         setHasToken(exists);
      });
   }, []);

   // Only enable the user query once we know a token exists
   const {
      data: userData,
      isLoading: isQueryLoading,
      error: queryError,
   } = useCurrentUser(hasToken === true);

   const googleSignInMutation = useGoogleSignIn();
   const logoutMutation = useLogout();

   // Derive user: attach classes to user object for backward compatibility
   const user: User | null = userData
      ? { ...userData.user, classes: userData.classes, totalJoinRequests: userData.totalJoinRequests } as User & { classes: any[] }
      : null;

   // Auth is loading while we check for token, or while the user query runs
   const isLoading = hasToken === null || (hasToken === true && isQueryLoading && !queryError);
   const isAuthenticated = !!user;

   const googleSignInHandler = async (params: { idToken?: string; code?: string; redirectUri?: string }) => {
      console.log('[AuthContext] googleSignIn called with:', {
         idToken: !!params.idToken,
         code: !!params.code,
         redirectUri: params.redirectUri,
      });
      await googleSignInMutation.mutateAsync(params);
      setHasToken(true);
      // Force a fresh /users/me fetch — covers the case where hasToken was
      // already true (e.g. re-login after 401 cleared only the token but
      // not the React state). Without this, setHasToken(true) is a no-op
      // and useCurrentUser won't re-fire.
      await queryClient.invalidateQueries({ queryKey: queryKeys.users.me() });
   };

   const logoutHandler = async () => {
      try {
         await logoutMutation.mutateAsync();
      } catch (error) {
         console.error('Error logging out:', error);
      } finally {
         setHasToken(false);
      }
   };

   const refreshUser = async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.users.me() });
   };

   return (
      <AuthContext.Provider
         value={{
            user,
            isLoading,
            isAuthenticated,
            googleSignIn: googleSignInHandler,
            logout: logoutHandler,
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
