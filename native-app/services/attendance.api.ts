import api from './api';
import type {
   ApiResponse,
   Attendance,
   AttendanceSummary,
   CreateAttendanceRequest,
   UpdateAttendanceRequest,
   MarkStudentRequest,
   MarkBulkRequest,
   GetAttendancesQuery,
   PaginationInfo,
   MyAttendancesResponse,
   MyStatsResponse,
} from '../types/api';

// Attendance API endpoints
export const attendanceApi = {
   /**
    * Create a new attendance (quick or scheduled)
    * POST /api/attendances
    */
   async createAttendance(data: CreateAttendanceRequest): Promise<ApiResponse<{ attendance: Attendance }>> {
      try {
         const response = await api.post<ApiResponse<{ attendance: Attendance }>>('/attendances', data);
         return response.data;
      } catch (error) {
         throw error;
      }
   },

   /**
    * Get all attendances with optional filters
    * GET /api/attendances
    */
   async getAttendances(query?: GetAttendancesQuery): Promise<ApiResponse<{ attendances: Attendance[]; pagination: PaginationInfo }>> {
      try {
         const params = new URLSearchParams();

         if (query?.classId) params.append('classId', query.classId);
         if (query?.attendanceType) params.append('attendanceType', query.attendanceType);
         if (query?.status) params.append('status', query.status);
         if (query?.page) params.append('page', query.page.toString());
         if (query?.limit) params.append('limit', query.limit.toString());

         const queryString = params.toString();
         const url = queryString ? `/attendances?${queryString}` : '/attendances';

         const response = await api.get<ApiResponse<{ attendances: Attendance[]; pagination: PaginationInfo }>>(url);
         return response.data;
      } catch (error) {
         throw error;
      }
   },

   /**
    * Get single attendance by ID
    * GET /api/attendances/:id
    */
   async getAttendance(attendanceId: string): Promise<ApiResponse<{ attendance: Attendance }>> {
      try {
         const response = await api.get<ApiResponse<{ attendance: Attendance }>>(`/attendances/${attendanceId}`);
         return response.data;
      } catch (error) {
         throw error;
      }
   },

   /**
    * Get attendance summary/statistics
    * GET /api/attendances/:id/summary
    */
   async getAttendanceSummary(attendanceId: string): Promise<ApiResponse<{ summary: AttendanceSummary }>> {
      try {
         const response = await api.get<ApiResponse<{ summary: AttendanceSummary }>>(`/attendances/${attendanceId}/summary`);
         return response.data;
      } catch (error) {
         throw error;
      }
   },

   /**
    * Update attendance details
    * PUT /api/attendances/:id
    */
   async updateAttendance(attendanceId: string, data: UpdateAttendanceRequest): Promise<ApiResponse<{ attendance: Attendance }>> {
      try {
         const response = await api.put<ApiResponse<{ attendance: Attendance }>>(`/attendances/${attendanceId}`, data);
         return response.data;
      } catch (error) {
         throw error;
      }
   },

   /**
    * Mark single student attendance
    * PUT /api/attendances/:id/mark-student
    */
   async markStudent(attendanceId: string, data: MarkStudentRequest): Promise<ApiResponse<{ attendance: Attendance }>> {
      try {
         const response = await api.put<ApiResponse<{ attendance: Attendance }>>(`/attendances/${attendanceId}/mark-student`, data);
         return response.data;
      } catch (error) {
         throw error;
      }
   },

   /**
    * Mark multiple students attendance (bulk)
    * PUT /api/attendances/:id/mark-bulk
    */
   async markBulk(attendanceId: string, data: MarkBulkRequest): Promise<ApiResponse<{ attendance: Attendance }>> {
      try {
         const response = await api.put<ApiResponse<{ attendance: Attendance }>>(`/attendances/${attendanceId}/mark-bulk`, data);
         return response.data;
      } catch (error) {
         throw error;
      }
   },

   /**
    * Complete attendance
    * PUT /api/attendances/:id/complete
    */
   async completeAttendance(attendanceId: string): Promise<ApiResponse<{ attendance: Attendance; summary: AttendanceSummary }>> {
      try {
         const response = await api.put<ApiResponse<{ attendance: Attendance; summary: AttendanceSummary }>>(`/attendances/${attendanceId}/complete`);
         return response.data;
      } catch (error) {
         throw error;
      }
   },

   /**
    * Remove student from attendance
    * DELETE /api/attendances/:id/students/:studentId
    */
   async removeStudent(attendanceId: string, studentId: string): Promise<ApiResponse<{ attendance: Attendance }>> {
      try {
         const response = await api.delete<ApiResponse<{ attendance: Attendance }>>(`/attendances/${attendanceId}/students/${studentId}`);
         return response.data;
      } catch (error) {
         throw error;
      }
   },

   /**
    * Delete attendance
    * DELETE /api/attendances/:id
    */
   async deleteAttendance(attendanceId: string): Promise<ApiResponse> {
      try {
         const response = await api.delete<ApiResponse>(`/attendances/${attendanceId}`);
         return response.data;
      } catch (error) {
         throw error;
      }
   },

   /**
    * Get student's own attendance history
    * GET /api/attendances/my-attendances
    */
   async getMyAttendances(query?: { classId?: string; page?: number; limit?: number }): Promise<ApiResponse<MyAttendancesResponse>> {
      try {
         const params = new URLSearchParams();

         if (query?.classId) params.append('classId', query.classId);
         if (query?.page) params.append('page', query.page.toString());
         if (query?.limit) params.append('limit', query.limit.toString());

         const queryString = params.toString();
         const url = queryString ? `/attendances/my-attendances?${queryString}` : '/attendances/my-attendances';

         const response = await api.get<ApiResponse<MyAttendancesResponse>>(url);
         return response.data;
      } catch (error) {
         throw error;
      }
   },

   /**
    * Get student's attendance statistics
    * GET /api/attendances/my-stats
    */
   async getMyStats(): Promise<ApiResponse<MyStatsResponse>> {
      try {
         const response = await api.get<ApiResponse<MyStatsResponse>>('/attendances/my-stats');
         return response.data;
      } catch (error) {
         throw error;
      }
   },
};

export default attendanceApi;
