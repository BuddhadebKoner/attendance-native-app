import config from '../constants/config';
import { ApiResponse, ApiError } from '../types/api';

/**
 * Base API service class
 */
class ApiService {
   private baseUrl: string;

   constructor() {
      this.baseUrl = config.apiUrl;
   }

   /**
    * Generic fetch wrapper with error handling
    */
   private async request<T>(
      endpoint: string,
      options?: RequestInit
   ): Promise<T> {
      try {
         const url = `${this.baseUrl}${endpoint}`;

         console.log(`🌐 API Request: ${options?.method || 'GET'} ${url}`);

         const response = await fetch(url, {
            ...options,
            headers: {
               'Content-Type': 'application/json',
               ...options?.headers,
            },
         });

         const data = await response.json();

         if (!response.ok) {
            throw {
               status: response.status,
               message: data.message || 'Something went wrong',
               error: data.error,
            } as ApiError;
         }

         console.log(`✅ API Response:`, data);
         return data;
      } catch (error: any) {
         console.error(`❌ API Error:`, error);
         throw error;
      }
   }

   /**
    * GET request
    */
   async get<T>(endpoint: string): Promise<T> {
      return this.request<T>(endpoint, {
         method: 'GET',
      });
   }

   /**
    * POST request
    */
   async post<T>(endpoint: string, body?: any): Promise<T> {
      return this.request<T>(endpoint, {
         method: 'POST',
         body: JSON.stringify(body),
      });
   }

   /**
    * PUT request
    */
   async put<T>(endpoint: string, body?: any): Promise<T> {
      return this.request<T>(endpoint, {
         method: 'PUT',
         body: JSON.stringify(body),
      });
   }

   /**
    * DELETE request
    */
   async delete<T>(endpoint: string): Promise<T> {
      return this.request<T>(endpoint, {
         method: 'DELETE',
      });
   }

   // ============ API Endpoints ============

   /**
    * Test API connection - hits root endpoint
    */
   async testConnection(): Promise<ApiResponse> {
      return this.get<ApiResponse>('/');
   }

   /**
    * Health check endpoint
    */
   async healthCheck(): Promise<ApiResponse> {
      return this.get<ApiResponse>('/health');
   }

   // Add more API methods here as you build features
   // Example:
   // async login(email: string, password: string) {
   //   return this.post('/auth/login', { email, password });
   // }
}

// Export singleton instance
export const apiService = new ApiService();
export default apiService;
