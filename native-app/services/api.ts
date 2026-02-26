import axios, { AxiosError, AxiosInstance } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import config from '../constants/config';
import type {
   ApiResponse,
   AuthResponse,
   GoogleSignInRequest,
   GoogleAuthResponse,
   User,
   ApiError,
} from '../types/api';

// Storage keys
const TOKEN_KEY = 'auth_token';
const USER_KEY = 'user_data';

// Create axios instance
const api: AxiosInstance = axios.create({
   baseURL: config.apiUrl,
   timeout: 10000,
   headers: {
      'Content-Type': 'application/json',
   },
});

// Request interceptor - Add token to all requests
api.interceptors.request.use(
   async (config) => {
      const token = await AsyncStorage.getItem(TOKEN_KEY);
      if (token) {
         config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
   },
   (error) => {
      return Promise.reject(error);
   }
);

// Response interceptor - Handle errors globally
api.interceptors.response.use(
   (response) => response,
   async (error: AxiosError<ApiError>) => {
      if (error.response?.status === 401) {
         // Token expired or invalid - clear storage
         await AsyncStorage.multiRemove([TOKEN_KEY, USER_KEY]);
      }
      return Promise.reject(error);
   }
);

// Token management
export const tokenManager = {
   async getToken(): Promise<string | null> {
      return await AsyncStorage.getItem(TOKEN_KEY);
   },

   async setToken(token: string): Promise<void> {
      await AsyncStorage.setItem(TOKEN_KEY, token);
   },

   async removeToken(): Promise<void> {
      await AsyncStorage.removeItem(TOKEN_KEY);
   },
};

// User data management
export const userManager = {
   async getUser(): Promise<User | null> {
      const userData = await AsyncStorage.getItem(USER_KEY);
      return userData ? JSON.parse(userData) : null;
   },

   async setUser(user: User): Promise<void> {
      await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
   },

   async removeUser(): Promise<void> {
      await AsyncStorage.removeItem(USER_KEY);
   },
};

// Auth API endpoints
export const authApi = {
   /**
    * Google Sign-In (login or register)
    * POST /api/users/google-signin
    */
   async googleSignIn(data: GoogleSignInRequest): Promise<ApiResponse<GoogleAuthResponse>> {
      try {
         const response = await api.post<ApiResponse<GoogleAuthResponse>>('/users/google-signin', data);

         // Save token and user data
         if (response.data.success && response.data.data) {
            await tokenManager.setToken(response.data.data.token);
            await userManager.setUser(response.data.data.user);
         }

         return response.data;
      } catch (error) {
         throw handleApiError(error);
      }
   },

   /**
    * Logout user
    * POST /api/users/logout
    */
   async logout(): Promise<ApiResponse> {
      try {
         const response = await api.post<ApiResponse>('/users/logout');

         // Clear local storage
         await AsyncStorage.multiRemove([TOKEN_KEY, USER_KEY]);

         return response.data;
      } catch (error) {
         // Clear local storage even if request fails
         await AsyncStorage.multiRemove([TOKEN_KEY, USER_KEY]);
         throw handleApiError(error);
      }
   },

   /**
    * Check if user is authenticated and get user details
    * GET /api/users/me
    */
   async me(): Promise<ApiResponse<{ user: User; classes?: any[] }>> {
      try {
         const response = await api.get<ApiResponse<{ user: User; classes?: any[] }>>('/users/me');

         // Update local user data
         if (response.data.success && response.data.data) {
            await userManager.setUser(response.data.data.user);
         }

         return response.data;
      } catch (error) {
         throw handleApiError(error);
      }
   },

   /**
    * Check if user is authenticated (has valid token)
    */
   async isAuthenticated(): Promise<boolean> {
      const token = await tokenManager.getToken();
      if (!token) return false;

      try {
         await this.me();
         return true;
      } catch {
         return false;
      }
   },

   /**
    * Update user profile
    * PUT /api/users/profile
    */
   async updateProfile(data: { name?: string; email?: string; mobile?: string }): Promise<ApiResponse<{ user: User }>> {
      try {
         const response = await api.put<ApiResponse<{ user: User }>>('/users/profile', data);

         // Update local user data
         if (response.data.success && response.data.data) {
            await userManager.setUser(response.data.data.user);
         }

         return response.data;
      } catch (error) {
         throw handleApiError(error);
      }
   },

   /**
    * Get available students for a class (excluding current user and already enrolled students)
    * GET /api/users/available?classId=xxx&page=1&limit=10&search=query
    */
   async getAvailableStudents(classId: string, page: number = 1, limit: number = 10, search: string = ''): Promise<ApiResponse<{
      users: User[];
      pagination: {
         currentPage: number;
         totalPages: number;
         totalUsers: number;
         limit: number;
         hasNextPage: boolean;
         hasPrevPage: boolean;
      };
   }>> {
      try {
         const params = new URLSearchParams({
            classId,
            page: page.toString(),
            limit: limit.toString(),
         });

         if (search) {
            params.append('search', search);
         }

         const response = await api.get(`/users/available?${params.toString()}`);
         return response.data;
      } catch (error) {
         throw handleApiError(error);
      }
   },
};

// Helper function to handle API errors
function handleApiError(error: any): ApiError {
   if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError<ApiError>;

      if (axiosError.response) {
         // Server responded with error
         return {
            success: false,
            message: axiosError.response.data?.message || 'An error occurred',
            error: axiosError.response.data?.error,
            errors: axiosError.response.data?.errors,
            status: axiosError.response.status,
         };
      } else if (axiosError.request) {
         // Request made but no response
         return {
            success: false,
            message: 'No response from server. Please check your connection.',
            status: 0,
         };
      }
   }

   // Other errors
   return {
      success: false,
      message: error.message || 'An unexpected error occurred',
   };
}

// Export the configured api instance for custom requests
export default api;
