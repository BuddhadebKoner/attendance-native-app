import { useCallback } from 'react';
import { useRouter } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';

/**
 * Hook that provides auth-gating utilities.
 * - `requireAuth(callback?)`: If not authenticated, redirects to login.
 *   If authenticated, runs the optional callback.
 * - `isAuthenticated`: Current auth state.
 */
export function useRequireAuth() {
   const { isAuthenticated } = useAuth();
   const router = useRouter();

   const requireAuth = useCallback(
      (callback?: () => void) => {
         if (!isAuthenticated) {
            router.push('/(public)/login');
            return false;
         }
         if (callback) callback();
         return true;
      },
      [isAuthenticated, router]
   );

   return { requireAuth, isAuthenticated };
}
