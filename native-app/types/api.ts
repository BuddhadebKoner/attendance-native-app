// API Response types
export interface ApiResponse<T = any> {
   status: string;
   message?: string;
   data?: T;
}

// User types
export interface User {
   id: string;
   name: string;
   email: string;
}

// Error response type
export interface ApiError {
   status: number;
   message: string;
   error?: string;
}
