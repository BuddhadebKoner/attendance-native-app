import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';
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

// ---------------------------------------------------------------------------
// TokenStore — in-memory token cache with a monotonic generation counter.
//
// The generation counter is the core fix for the intermittent 401 bug:
//   1. Every call to setToken() increments the generation.
//   2. Every outgoing request is stamped with the current generation.
//   3. When a 401 response arrives, clearIfStale() only clears the token
//      if the generation hasn't changed since the request was sent.
//   → A stale 401 from a pre-login request can never wipe a post-login token.
// ---------------------------------------------------------------------------
class TokenStore {
   private token: string | null = null;
   private generation = 0;
   private initialized = false;

   /** Boot-time: load token from AsyncStorage into memory (call once). */
   async initialize(): Promise<boolean> {
      if (this.initialized) return !!this.token;
      const stored = await AsyncStorage.getItem(TOKEN_KEY);
      this.token = stored;
      this.initialized = true;
      return !!this.token;
   }

   /** Synchronous in-memory read — no I/O per request. */
   getToken(): string | null {
      return this.token;
   }

   /** Current generation number (stamped onto outgoing requests). */
   getGeneration(): number {
      return this.generation;
   }

   /** Store a new token: bump generation, write memory, persist async. */
   async setToken(token: string): Promise<void> {
      this.generation++;
      this.token = token;
      this.initialized = true;
      await AsyncStorage.setItem(TOKEN_KEY, token);
   }

   /**
    * Unconditional clear (used by explicit logout).
    * Always clears regardless of generation.
    */
   async clear(): Promise<void> {
      this.generation++;
      this.token = null;
      await AsyncStorage.multiRemove([TOKEN_KEY, USER_KEY]);
   }

   /**
    * Conditional clear — only clears if no newer token has been stored
    * since the request was sent (i.e. the generation hasn't changed).
    * This is the race-condition guard.
    */
   async clearIfStale(requestGeneration: number): Promise<void> {
      if (this.generation !== requestGeneration) {
         // A newer token was stored after this request was sent — do NOT clear.
         return;
      }
      this.generation++;
      this.token = null;
      await AsyncStorage.multiRemove([TOKEN_KEY, USER_KEY]);
   }
}

export const tokenStore = new TokenStore();

// Extend Axios config to carry the token generation for 401 guard
interface RequestConfigWithGeneration extends InternalAxiosRequestConfig {
   _tokenGeneration?: number;
}

// Create axios instance
const api: AxiosInstance = axios.create({
   baseURL: config.apiUrl,
   timeout: 10000,
   headers: {
      'Content-Type': 'application/json',
   },
});

// Request interceptor — attach token synchronously from in-memory store
api.interceptors.request.use(
   (config: RequestConfigWithGeneration) => {
      const token = tokenStore.getToken();
      if (token) {
         config.headers.Authorization = `Bearer ${token}`;
      }
      // Stamp generation so the 401 interceptor can detect stale responses
      config._tokenGeneration = tokenStore.getGeneration();
      return config;
   },
   (error) => {
      return Promise.reject(error);
   }
);

// Response interceptor — guard against stale 401 clearing a fresh token
api.interceptors.response.use(
   (response) => response,
   async (error: AxiosError<ApiError>) => {
      if (error.response?.status === 401) {
         const reqConfig = error.config as RequestConfigWithGeneration | undefined;
         const requestGeneration = reqConfig?._tokenGeneration ?? -1;
         // Only clear token if no new login has occurred since this request was sent
         await tokenStore.clearIfStale(requestGeneration);
      }
      return Promise.reject(error);
   }
);

// Token management — delegates to the in-memory TokenStore
export const tokenManager = {
   getToken(): string | null {
      return tokenStore.getToken();
   },

   async setToken(token: string): Promise<void> {
      await tokenStore.setToken(token);
   },

   async removeToken(): Promise<void> {
      await tokenStore.clear();
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

         // Unconditional clear — this is an explicit user action
         await tokenStore.clear();

         return response.data;
      } catch (error) {
         // Clear local storage even if request fails
         await tokenStore.clear();
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
      const token = tokenStore.getToken();
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
   async updateProfile(data: { name?: string; email?: string; mobile?: string; role?: 'teacher' | 'student' }): Promise<ApiResponse<{ user: User }>> {
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
