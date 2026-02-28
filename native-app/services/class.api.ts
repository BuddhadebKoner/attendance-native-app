import api from './api';
import type { ApiResponse, Class, CreateClassRequest, UpdateClassRequest, ClassListResponse, ActiveAttendance, PaginationInfo, JoinRequestsResponse, RequestJoinResponse } from '../types/api';

// Class API endpoints
export const classApi = {
   /**
    * Create a new class
    * POST /api/classes
    */
   async createClass(data: CreateClassRequest): Promise<ApiResponse<{ class: Class }>> {
      try {
         const response = await api.post<ApiResponse<{ class: Class }>>('/classes', data);
         return response.data;
      } catch (error) {
         throw error;
      }
   },

   /**
    * Get all classes (created by user or enrolled in)
    * GET /api/classes
    */
   async getClasses(page: number = 1, limit: number = 20): Promise<ApiResponse<ClassListResponse>> {
      try {
         const response = await api.get<ApiResponse<ClassListResponse>>(`/classes?page=${page}&limit=${limit}`);
         return response.data;
      } catch (error) {
         throw error;
      }
   },

   /**
    * Get single class by ID
    * GET /api/classes/:id
    */
   async getClass(classId: string, page: number = 1, limit: number = 10, attendancePage: number = 1, attendanceLimit: number = 10): Promise<ApiResponse<{ class: Class; isCreator: boolean; pagination?: any; activeAttendances?: ActiveAttendance[]; attendancePagination?: PaginationInfo }>> {
      try {
         const response = await api.get<ApiResponse<{ class: Class; isCreator: boolean; pagination?: any; activeAttendances?: ActiveAttendance[]; attendancePagination?: PaginationInfo }>>(`/classes/${classId}?page=${page}&limit=${limit}&attendancePage=${attendancePage}&attendanceLimit=${attendanceLimit}`);
         return response.data;
      } catch (error) {
         throw error;
      }
   },

   /**
    * Update class details
    * PUT /api/classes/:id
    */
   async updateClass(classId: string, data: UpdateClassRequest): Promise<ApiResponse<{ class: Class }>> {
      try {
         const response = await api.put<ApiResponse<{ class: Class }>>(`/classes/${classId}`, data);
         return response.data;
      } catch (error) {
         throw error;
      }
   },

   /**
    * Delete a class
    * DELETE /api/classes/:id
    */
   async deleteClass(classId: string): Promise<ApiResponse> {
      try {
         const response = await api.delete<ApiResponse>(`/classes/${classId}`);
         return response.data;
      } catch (error) {
         throw error;
      }
   },

   /**
    * Add a student to class
    * POST /api/classes/:id/students
    */
   async addStudent(classId: string, studentId: string): Promise<ApiResponse<{ class: Class }>> {
      try {
         const response = await api.post<ApiResponse<{ class: Class }>>(`/classes/${classId}/students`, { studentId });
         return response.data;
      } catch (error) {
         throw error;
      }
   },

   /**
    * Add multiple students to class in one request
    * POST /api/classes/:id/students/bulk
    */
   async bulkAddStudents(classId: string, studentIds: string[]): Promise<ApiResponse<{ class: Class; addedCount: number; skippedCount: number }>> {
      try {
         const response = await api.post<ApiResponse<{ class: Class; addedCount: number; skippedCount: number }>>(`/classes/${classId}/students/bulk`, { studentIds });
         return response.data;
      } catch (error) {
         throw error;
      }
   },

   /**
    * Remove multiple students from class in one request
    * DELETE /api/classes/:id/students/bulk
    */
   async bulkRemoveStudents(classId: string, studentIds: string[]): Promise<ApiResponse<{ class: Class; removedCount: number; skippedCount: number }>> {
      try {
         const response = await api.delete<ApiResponse<{ class: Class; removedCount: number; skippedCount: number }>>(`/classes/${classId}/students/bulk`, { data: { studentIds } });
         return response.data;
      } catch (error) {
         throw error;
      }
   },

   /**
    * Remove a student from class
    * DELETE /api/classes/:id/students/:studentId
    */
   async removeStudent(classId: string, studentId: string): Promise<ApiResponse<{ class: Class }>> {
      try {
         const response = await api.delete<ApiResponse<{ class: Class }>>(`/classes/${classId}/students/${studentId}`);
         return response.data;
      } catch (error) {
         throw error;
      }
   },

   /**
    * Accept enrollment invitation
    * PUT /api/classes/:id/students/:studentId/accept
    */
   async acceptEnrollment(classId: string, studentId: string): Promise<ApiResponse<{ classId: string; status: string }>> {
      try {
         const response = await api.put<ApiResponse<{ classId: string; status: string }>>(`/classes/${classId}/students/${studentId}/accept`);
         return response.data;
      } catch (error) {
         throw error;
      }
   },

   /**
    * Reject enrollment invitation
    * PUT /api/classes/:id/students/:studentId/reject
    */
   async rejectEnrollment(classId: string, studentId: string): Promise<ApiResponse<{ classId: string; status: string }>> {
      try {
         const response = await api.put<ApiResponse<{ classId: string; status: string }>>(`/classes/${classId}/students/${studentId}/reject`);
         return response.data;
      } catch (error) {
         throw error;
      }
   },

   /**
    * Request to join a class via QR code scan
    * POST /api/classes/:id/request-join
    */
   async requestJoinClass(classId: string): Promise<ApiResponse<RequestJoinResponse>> {
      try {
         const response = await api.post<ApiResponse<RequestJoinResponse>>(`/classes/${classId}/request-join`);
         return response.data;
      } catch (error) {
         throw error;
      }
   },

   /**
    * Approve a student's join request (teacher only)
    * PUT /api/classes/:id/students/:studentId/approve
    */
   async approveJoinRequest(classId: string, studentId: string): Promise<ApiResponse<{ classId: string; studentId: string; status: string }>> {
      try {
         const response = await api.put<ApiResponse<{ classId: string; studentId: string; status: string }>>(`/classes/${classId}/students/${studentId}/approve`);
         return response.data;
      } catch (error) {
         throw error;
      }
   },

   /**
    * Deny a student's join request (teacher only)
    * PUT /api/classes/:id/students/:studentId/deny
    */
   async denyJoinRequest(classId: string, studentId: string): Promise<ApiResponse<{ classId: string; studentId: string; status: string }>> {
      try {
         const response = await api.put<ApiResponse<{ classId: string; studentId: string; status: string }>>(`/classes/${classId}/students/${studentId}/deny`);
         return response.data;
      } catch (error) {
         throw error;
      }
   },

   /**
    * Get all pending join requests across teacher's classes
    * GET /api/classes/join-requests
    */
   async getJoinRequests(page: number = 1, limit: number = 20): Promise<ApiResponse<JoinRequestsResponse>> {
      try {
         const response = await api.get<ApiResponse<JoinRequestsResponse>>(`/classes/join-requests?page=${page}&limit=${limit}`);
         return response.data;
      } catch (error) {
         throw error;
      }
   },
};

export default classApi;
