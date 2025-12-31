// User related types
export interface User {
   _id: string;
   name?: string;
   email?: string;
   mobile: string;
   createdAt: string;
   updatedAt: string;
}

export interface UserWithClasses extends User {
   classes?: Class[];
}

// API Response types
export interface ApiResponse<T = any> {
   success: boolean;
   message: string;
   data?: T;
   error?: string;
   errors?: string[];
}

// Auth related types
export interface RegisterRequest {
   mobile: string;
   password: string;
   name?: string;
   email?: string;
}

export interface LoginRequest {
   mobile: string;
   password: string;
}

export interface ForgotPasswordRequest {
   mobile: string;
}

export interface AuthResponse {
   user: User;
   token: string;
}

// API Error type
export interface ApiError {
   success: false;
   message: string;
   error?: string;
   errors?: string[];
   status?: number;
}

// Class related types
export interface Class {
   _id: string;
   className: string;
   subject: string;
   createdBy: User | string;
   students: User[] | string[];
   studentCount?: number;
   createdAt: string;
   updatedAt: string;
}

export interface CreateClassRequest {
   className: string;
   subject: string;
}

export interface UpdateClassRequest {
   className?: string;
   subject?: string;
}

export interface AddStudentRequest {
   studentId: string;
}
