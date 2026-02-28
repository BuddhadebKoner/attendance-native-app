import { useQuery } from '@tanstack/react-query';
import { studentApi } from '../../services/student.api';
import { queryKeys } from '../../services/queryKeys';
import type { GetMyAttendanceQuery, GetEnrolledClassesQuery, GetClassAttendanceQuery } from '../../types/api';

/**
 * Query: Get student's enrolled classes
 * GET /api/students/me/classes
 */
export function useEnrolledClasses(query?: GetEnrolledClassesQuery, enabled = true) {
   return useQuery({
      queryKey: queryKeys.students.enrolledClasses(query),
      queryFn: async () => {
         const response = await studentApi.getMyEnrolledClasses(query);
         if (response.success && response.data) {
            return response.data;
         }
         throw new Error(response.message || 'Failed to fetch enrolled classes');
      },
      enabled,
   });
}

/**
 * Query: Get student's attendance records
 * GET /api/students/me/attendance
 */
export function useMyAttendanceRecords(query?: GetMyAttendanceQuery, enabled = true) {
   return useQuery({
      queryKey: queryKeys.students.myRecords(query),
      queryFn: async () => {
         const response = await studentApi.getMyAttendanceRecords(query);
         if (response.success && response.data) {
            return response.data;
         }
         throw new Error(response.message || 'Failed to fetch attendance records');
      },
      enabled,
   });
}

/**
 * Query: Get student's attendance for a specific class
 * GET /api/students/me/attendance/class/:classId
 */
export function useMyClassAttendance(classId: string, query?: GetClassAttendanceQuery, enabled = true) {
   return useQuery({
      queryKey: queryKeys.students.classAttendance(classId, query),
      queryFn: async () => {
         const response = await studentApi.getMyAttendanceForClass(classId, query);
         if (response.success && response.data) {
            return response.data;
         }
         throw new Error(response.message || 'Failed to fetch class attendance');
      },
      enabled: enabled && !!classId,
   });
}

/**
 * Query: Get student's overall stats
 * GET /api/students/me/stats
 */
export function useStudentStats(enabled = true) {
   return useQuery({
      queryKey: queryKeys.students.myStats(),
      queryFn: async () => {
         const response = await studentApi.getMyAttendanceStats();
         if (response.success && response.data) {
            return response.data;
         }
         throw new Error(response.message || 'Failed to fetch student stats');
      },
      enabled,
   });
}

/**
 * Query: Get student's attendance summary by class
 * GET /api/students/me/summary
 */
export function useStudentSummary(query?: { page?: number; limit?: number }, enabled = true) {
   return useQuery({
      queryKey: queryKeys.students.mySummary(query),
      queryFn: async () => {
         const response = await studentApi.getMyAttendanceSummary(query);
         if (response.success && response.data) {
            return response.data;
         }
         throw new Error(response.message || 'Failed to fetch student summary');
      },
      enabled,
   });
}
