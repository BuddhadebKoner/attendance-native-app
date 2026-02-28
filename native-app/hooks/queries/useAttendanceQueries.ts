import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { attendanceApi } from '../../services/attendance.api';
import { queryKeys } from '../../services/queryKeys';
import type {
   CreateAttendanceRequest,
   UpdateAttendanceRequest,
   MarkStudentRequest,
   MarkBulkRequest,
   GetAttendancesQuery,
} from '../../types/api';

/**
 * Query: Get all attendances with filters
 * GET /api/attendances
 */
export function useAttendances(query?: GetAttendancesQuery, enabled = true) {
   return useQuery({
      queryKey: queryKeys.attendances.list(query),
      queryFn: async () => {
         const response = await attendanceApi.getAttendances(query);
         if (response.success && response.data) {
            return response.data;
         }
         throw new Error(response.message || 'Failed to fetch attendances');
      },
      enabled,
   });
}

/**
 * Query: Get single attendance by ID
 * GET /api/attendances/:id
 */
export function useAttendanceDetail(attendanceId: string, enabled = true) {
   return useQuery({
      queryKey: queryKeys.attendances.detail(attendanceId),
      queryFn: async () => {
         const response = await attendanceApi.getAttendance(attendanceId);
         if (response.success && response.data) {
            const { attendance, isCreator } = response.data as any;
            return { ...attendance, isCreator: isCreator ?? true };
         }
         throw new Error(response.message || 'Failed to fetch attendance');
      },
      enabled: enabled && !!attendanceId,
   });
}

/**
 * Query: Get attendance summary
 * GET /api/attendances/:id/summary
 */
export function useAttendanceSummary(attendanceId: string, enabled = true) {
   return useQuery({
      queryKey: queryKeys.attendances.summary(attendanceId),
      queryFn: async () => {
         const response = await attendanceApi.getAttendanceSummary(attendanceId);
         if (response.success && response.data) {
            return response.data.summary;
         }
         throw new Error(response.message || 'Failed to fetch attendance summary');
      },
      enabled: enabled && !!attendanceId,
   });
}

/**
 * Query: Get student's own attendance history
 * GET /api/attendances/my-attendances
 */
export function useMyAttendances(
   query?: { classId?: string; page?: number; limit?: number },
   enabled = true
) {
   return useQuery({
      queryKey: queryKeys.attendances.myAttendances(query),
      queryFn: async () => {
         const response = await attendanceApi.getMyAttendances(query);
         if (response.success && response.data) {
            return response.data;
         }
         throw new Error(response.message || 'Failed to fetch attendance history');
      },
      enabled,
   });
}

/**
 * Query: Get student's attendance statistics
 * GET /api/attendances/my-stats
 */
export function useMyAttendanceStats(enabled = true) {
   return useQuery({
      queryKey: queryKeys.attendances.myStats(),
      queryFn: async () => {
         const response = await attendanceApi.getMyStats();
         if (response.success && response.data) {
            return response.data;
         }
         throw new Error(response.message || 'Failed to fetch attendance stats');
      },
      enabled,
   });
}

/**
 * Mutation: Create attendance
 * POST /api/attendances
 */
export function useCreateAttendance() {
   const queryClient = useQueryClient();

   return useMutation({
      mutationFn: async (data: CreateAttendanceRequest) => {
         const response = await attendanceApi.createAttendance(data);
         if (response.success && response.data) {
            return response.data.attendance;
         }
         throw new Error(response.message || 'Failed to create attendance');
      },
      onSuccess: () => {
         queryClient.invalidateQueries({ queryKey: queryKeys.attendances.all });
      },
   });
}

/**
 * Mutation: Update attendance
 * PUT /api/attendances/:id
 */
export function useUpdateAttendance() {
   const queryClient = useQueryClient();

   return useMutation({
      mutationFn: async ({
         attendanceId,
         data,
      }: {
         attendanceId: string;
         data: UpdateAttendanceRequest;
      }) => {
         const response = await attendanceApi.updateAttendance(attendanceId, data);
         if (response.success && response.data) {
            return response.data.attendance;
         }
         throw new Error(response.message || 'Failed to update attendance');
      },
      onSuccess: (_, variables) => {
         queryClient.invalidateQueries({
            queryKey: queryKeys.attendances.detail(variables.attendanceId),
         });
      },
   });
}

/**
 * Mutation: Mark single student
 * PUT /api/attendances/:id/mark-student
 */
export function useMarkStudent() {
   const queryClient = useQueryClient();

   return useMutation({
      mutationFn: async ({
         attendanceId,
         data,
      }: {
         attendanceId: string;
         data: MarkStudentRequest;
      }) => {
         const response = await attendanceApi.markStudent(attendanceId, data);
         if (response.success && response.data) {
            return response.data.attendance;
         }
         throw new Error(response.message || 'Failed to mark student');
      },
      onSuccess: (updatedAttendance, variables) => {
         // Update cache directly for immediate UI feedback
         queryClient.setQueryData(
            queryKeys.attendances.detail(variables.attendanceId),
            updatedAttendance
         );
      },
   });
}

/**
 * Mutation: Mark multiple students (bulk)
 * PUT /api/attendances/:id/mark-bulk
 */
export function useMarkBulk() {
   const queryClient = useQueryClient();

   return useMutation({
      mutationFn: async ({
         attendanceId,
         data,
      }: {
         attendanceId: string;
         data: MarkBulkRequest;
      }) => {
         const response = await attendanceApi.markBulk(attendanceId, data);
         if (response.success && response.data) {
            return response.data.attendance;
         }
         throw new Error(response.message || 'Failed to mark students');
      },
      onSuccess: (updatedAttendance, variables) => {
         queryClient.setQueryData(
            queryKeys.attendances.detail(variables.attendanceId),
            updatedAttendance
         );
      },
   });
}

/**
 * Mutation: Complete attendance
 * PUT /api/attendances/:id/complete
 */
export function useCompleteAttendance() {
   const queryClient = useQueryClient();

   return useMutation({
      mutationFn: async (attendanceId: string) => {
         const response = await attendanceApi.completeAttendance(attendanceId);
         if (response.success && response.data) {
            return response.data;
         }
         throw new Error(response.message || 'Failed to complete attendance');
      },
      onSuccess: (data, attendanceId) => {
         queryClient.setQueryData(
            queryKeys.attendances.detail(attendanceId),
            data.attendance
         );
         queryClient.invalidateQueries({ queryKey: queryKeys.attendances.list() });
      },
   });
}

/**
 * Mutation: Remove student from attendance
 * DELETE /api/attendances/:id/students/:studentId
 */
export function useRemoveAttendanceStudent() {
   const queryClient = useQueryClient();

   return useMutation({
      mutationFn: async ({
         attendanceId,
         studentId,
      }: {
         attendanceId: string;
         studentId: string;
      }) => {
         const response = await attendanceApi.removeStudent(attendanceId, studentId);
         if (response.success && response.data) {
            return response.data.attendance;
         }
         throw new Error(response.message || 'Failed to remove student');
      },
      onSuccess: (updatedAttendance, variables) => {
         queryClient.setQueryData(
            queryKeys.attendances.detail(variables.attendanceId),
            updatedAttendance
         );
      },
   });
}

/**
 * Mutation: Delete attendance
 * DELETE /api/attendances/:id
 */
export function useDeleteAttendance() {
   const queryClient = useQueryClient();

   return useMutation({
      mutationFn: async (attendanceId: string) => {
         const response = await attendanceApi.deleteAttendance(attendanceId);
         if (response.success) {
            return true;
         }
         throw new Error(response.message || 'Failed to delete attendance');
      },
      onSuccess: () => {
         queryClient.invalidateQueries({ queryKey: queryKeys.attendances.all });
      },
   });
}
