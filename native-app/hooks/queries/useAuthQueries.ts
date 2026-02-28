import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { authApi, tokenManager, userManager } from '../../services/api';
import { queryKeys } from '../../services/queryKeys';
import type { User } from '../../types/api';

/**
 * Query: Get current authenticated user
 * GET /api/users/me
 */
export function useCurrentUser(enabled = true) {
   return useQuery({
      queryKey: queryKeys.users.me(),
      queryFn: async () => {
         const response = await authApi.me();
         if (response.success && response.data) {
            return {
               user: response.data.user,
               classes: response.data.classes ?? [],
               totalJoinRequests: response.data.totalJoinRequests ?? 0,
            };
         }
         throw new Error(response.message || 'Failed to fetch user');
      },
      enabled,
   });
}

/**
 * Mutation: Google Sign-In
 * POST /api/users/google-signin
 */
export function useGoogleSignIn() {
   const queryClient = useQueryClient();

   return useMutation({
      mutationFn: async (params: { idToken?: string; code?: string; redirectUri?: string }) => {
         const response = await authApi.googleSignIn(params);
         if (response.success && response.data) {
            return response.data;
         }
         throw new Error(response.message || 'Google Sign-In failed');
      },
      onSuccess: (data) => {
         // Hydrate user cache immediately
         queryClient.setQueryData(queryKeys.users.me(), {
            user: data.user,
            classes: [],
         });
      },
   });
}

/**
 * Mutation: Logout
 * POST /api/users/logout
 */
export function useLogout() {
   const queryClient = useQueryClient();

   return useMutation({
      mutationFn: async () => {
         await authApi.logout();
      },
      onSettled: () => {
         // Always clear cache regardless of success/failure
         queryClient.clear();
      },
   });
}

/**
 * Mutation: Update user profile
 * PUT /api/users/profile
 */
export function useUpdateProfile() {
   const queryClient = useQueryClient();

   return useMutation({
      mutationFn: async (data: { name?: string; email?: string; mobile?: string; role?: 'teacher' | 'student' }) => {
         const response = await authApi.updateProfile(data);
         if (response.success && response.data) {
            return response.data.user;
         }
         throw new Error(response.message || 'Failed to update profile');
      },
      onSuccess: () => {
         queryClient.invalidateQueries({ queryKey: queryKeys.users.me() });
      },
   });
}

/**
 * Query: Get available students for a class
 * GET /api/users/available
 */
export function useAvailableStudents(
   classId: string,
   page = 1,
   limit = 10,
   search = '',
   enabled = true
) {
   return useQuery({
      queryKey: queryKeys.users.available({ classId, page, limit, search }),
      queryFn: async () => {
         const response = await authApi.getAvailableStudents(classId, page, limit, search);
         if (response.success && response.data) {
            return response.data;
         }
         throw new Error(response.message || 'Failed to fetch available students');
      },
      enabled: enabled && !!classId,
   });
}
