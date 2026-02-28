import api from './api';
import type {
   ApiResponse,
   Class,
   EnrolledClassesResponse,
   MyAttendanceRecord,
   MyAttendanceRecordsResponse,
   ClassAttendanceResponse,
   StudentStatsResponse,
   AttendanceSummaryResponse,
   GetMyAttendanceQuery,
   GetEnrolledClassesQuery,
   GetClassAttendanceQuery,
} from '../types/api';

// Student API endpoints
export const studentApi = {
   /**
    * Get student's enrolled classes
    * GET /api/students/me/classes
    */
   async getMyEnrolledClasses(query?: GetEnrolledClassesQuery): Promise<ApiResponse<EnrolledClassesResponse>> {
      try {
         const params = new URLSearchParams();
         if (query?.page) params.append('page', query.page.toString());
         if (query?.limit) params.append('limit', query.limit.toString());
         const queryString = params.toString();
         const url = queryString ? `/students/me/classes?${queryString}` : '/students/me/classes';
         const response = await api.get<ApiResponse<EnrolledClassesResponse>>(url);
         return response.data;
      } catch (error) {
         throw error;
      }
   },

   /**
    * Get student's attendance records with optional filters
    * GET /api/students/me/attendance
    */
   async getMyAttendanceRecords(query?: GetMyAttendanceQuery): Promise<ApiResponse<MyAttendanceRecordsResponse>> {
      try {
         const params = new URLSearchParams();

         if (query?.classId) params.append('classId', query.classId);
         if (query?.status) params.append('status', query.status);
         if (query?.page) params.append('page', query.page.toString());
         if (query?.limit) params.append('limit', query.limit.toString());

         const queryString = params.toString();
         const url = queryString ? `/students/me/attendance?${queryString}` : '/students/me/attendance';

         const response = await api.get<ApiResponse<MyAttendanceRecordsResponse>>(url);
         return response.data;
      } catch (error) {
         throw error;
      }
   },

   /**
    * Get student's attendance for a specific class
    * GET /api/students/me/attendance/class/:classId
    */
   async getMyAttendanceForClass(classId: string, query?: GetClassAttendanceQuery): Promise<ApiResponse<ClassAttendanceResponse>> {
      try {
         const params = new URLSearchParams();
         if (query?.page) params.append('page', query.page.toString());
         if (query?.limit) params.append('limit', query.limit.toString());
         const queryString = params.toString();
         const url = queryString
            ? `/students/me/attendance/class/${classId}?${queryString}`
            : `/students/me/attendance/class/${classId}`;
         const response = await api.get<ApiResponse<ClassAttendanceResponse>>(url);
         return response.data;
      } catch (error) {
         throw error;
      }
   },

   /**
    * Get student's overall attendance statistics
    * GET /api/students/me/stats
    */
   async getMyAttendanceStats(): Promise<ApiResponse<StudentStatsResponse>> {
      try {
         const response = await api.get<ApiResponse<StudentStatsResponse>>('/students/me/stats');
         return response.data;
      } catch (error) {
         throw error;
      }
   },

   /**
    * Get student's attendance summary by class
    * GET /api/students/me/summary
    */
   async getMyAttendanceSummary(query?: { page?: number; limit?: number }): Promise<ApiResponse<AttendanceSummaryResponse>> {
      try {
         const params = new URLSearchParams();
         if (query?.page) params.append('page', query.page.toString());
         if (query?.limit) params.append('limit', query.limit.toString());
         const queryString = params.toString();
         const url = queryString ? `/students/me/summary?${queryString}` : '/students/me/summary';
         const response = await api.get<ApiResponse<AttendanceSummaryResponse>>(url);
         return response.data;
      } catch (error) {
         throw error;
      }
   },
};

export default studentApi;
