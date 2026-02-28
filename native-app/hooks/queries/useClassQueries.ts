import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { classApi } from '../../services/class.api';
import { queryKeys } from '../../services/queryKeys';
import type { CreateClassRequest, UpdateClassRequest, GetClassesQuery, JoinRequestsResponse } from '../../types/api';

/**
 * Query: Get all classes
 * GET /api/classes
 */
export function useClasses(query?: GetClassesQuery, enabled = true) {
   return useQuery({
      queryKey: queryKeys.classes.list(query),
      queryFn: async () => {
         const response = await classApi.getClasses(query?.page, query?.limit);
         if (response.success && response.data) {
            return response.data;
         }
         throw new Error(response.message || 'Failed to fetch classes');
      },
      enabled,
   });
}

/**
 * Query: Get single class by ID
 * GET /api/classes/:id
 */
export function useClass(classId: string, page = 1, limit = 10, enabled = true, attendancePage = 1, attendanceLimit = 10) {
   return useQuery({
      queryKey: [...queryKeys.classes.detail(classId), { page, limit, attendancePage, attendanceLimit }],
      queryFn: async () => {
         const response = await classApi.getClass(classId, page, limit, attendancePage, attendanceLimit);
         if (response.success && response.data) {
            return response.data;
         }
         throw new Error(response.message || 'Failed to fetch class');
      },
      enabled: enabled && !!classId,
   });
}

/**
 * Mutation: Create a new class
 * POST /api/classes
 */
export function useCreateClass() {
   const queryClient = useQueryClient();

   return useMutation({
      mutationFn: async (data: CreateClassRequest) => {
         const response = await classApi.createClass(data);
         if (response.success && response.data) {
            return response.data.class;
         }
         throw new Error(response.message || 'Failed to create class');
      },
      onSuccess: () => {
         queryClient.invalidateQueries({ queryKey: queryKeys.classes.all });
         queryClient.invalidateQueries({ queryKey: queryKeys.users.me() });
      },
   });
}

/**
 * Mutation: Update class details
 * PUT /api/classes/:id
 */
export function useUpdateClass() {
   const queryClient = useQueryClient();

   return useMutation({
      mutationFn: async ({ classId, data }: { classId: string; data: UpdateClassRequest }) => {
         const response = await classApi.updateClass(classId, data);
         if (response.success && response.data) {
            return response.data.class;
         }
         throw new Error(response.message || 'Failed to update class');
      },
      onSuccess: (_, variables) => {
         queryClient.invalidateQueries({ queryKey: queryKeys.classes.detail(variables.classId) });
         queryClient.invalidateQueries({ queryKey: queryKeys.classes.list() });
         queryClient.invalidateQueries({ queryKey: queryKeys.users.me() });
      },
   });
}

/**
 * Mutation: Delete a class
 * DELETE /api/classes/:id
 */
export function useDeleteClass() {
   const queryClient = useQueryClient();

   return useMutation({
      mutationFn: async (classId: string) => {
         const response = await classApi.deleteClass(classId);
         if (response.success) {
            return true;
         }
         throw new Error(response.message || 'Failed to delete class');
      },
      onSuccess: () => {
         queryClient.invalidateQueries({ queryKey: queryKeys.classes.all });
         queryClient.invalidateQueries({ queryKey: queryKeys.users.me() });
      },
   });
}

/**
 * Mutation: Add a student to class
 * POST /api/classes/:id/students
 */
export function useAddStudent() {
   const queryClient = useQueryClient();

   return useMutation({
      mutationFn: async ({ classId, studentId }: { classId: string; studentId: string }) => {
         const response = await classApi.addStudent(classId, studentId);
         if (response.success && response.data) {
            return response.data.class;
         }
         throw new Error(response.message || 'Failed to add student');
      },
      onSuccess: (_, variables) => {
         queryClient.invalidateQueries({ queryKey: queryKeys.classes.detail(variables.classId) });
         queryClient.invalidateQueries({ queryKey: queryKeys.users.all });
      },
   });
}

/**
 * Mutation: Add multiple students to class in one request
 * POST /api/classes/:id/students/bulk
 */
export function useBulkAddStudents() {
   const queryClient = useQueryClient();

   return useMutation({
      mutationFn: async ({ classId, studentIds }: { classId: string; studentIds: string[] }) => {
         const response = await classApi.bulkAddStudents(classId, studentIds);
         if (response.success && response.data) {
            return response.data;
         }
         throw new Error(response.message || 'Failed to add students');
      },
      onSuccess: (_, variables) => {
         queryClient.invalidateQueries({ queryKey: queryKeys.classes.detail(variables.classId) });
         queryClient.invalidateQueries({ queryKey: queryKeys.users.all });
      },
   });
}

/**
 * Mutation: Remove multiple students from class in one request
 * DELETE /api/classes/:id/students/bulk
 */
export function useBulkRemoveStudents() {
   const queryClient = useQueryClient();

   return useMutation({
      mutationFn: async ({ classId, studentIds }: { classId: string; studentIds: string[] }) => {
         const response = await classApi.bulkRemoveStudents(classId, studentIds);
         if (response.success && response.data) {
            return response.data;
         }
         throw new Error(response.message || 'Failed to remove students');
      },
      onSuccess: (_, variables) => {
         queryClient.invalidateQueries({ queryKey: queryKeys.classes.detail(variables.classId) });
         queryClient.invalidateQueries({ queryKey: queryKeys.users.all });
      },
   });
}

/**
 * Mutation: Remove a student from class
 * DELETE /api/classes/:id/students/:studentId
 */
export function useRemoveStudent() {
   const queryClient = useQueryClient();

   return useMutation({
      mutationFn: async ({ classId, studentId }: { classId: string; studentId: string }) => {
         const response = await classApi.removeStudent(classId, studentId);
         if (response.success && response.data) {
            return response.data.class;
         }
         throw new Error(response.message || 'Failed to remove student');
      },
      onSuccess: (_, variables) => {
         queryClient.invalidateQueries({ queryKey: queryKeys.classes.detail(variables.classId) });
      },
   });
}

/**
 * Mutation: Accept enrollment invitation
 * PUT /api/classes/:id/students/:studentId/accept
 */
export function useAcceptEnrollment() {
   const queryClient = useQueryClient();

   return useMutation({
      mutationFn: async ({ classId, studentId }: { classId: string; studentId: string }) => {
         const response = await classApi.acceptEnrollment(classId, studentId);
         if (response.success && response.data) {
            return response.data;
         }
         throw new Error(response.message || 'Failed to accept enrollment');
      },
      onSuccess: (_, variables) => {
         queryClient.invalidateQueries({ queryKey: queryKeys.classes.detail(variables.classId) });
         queryClient.invalidateQueries({ queryKey: queryKeys.classes.list() });
         queryClient.invalidateQueries({ queryKey: queryKeys.students.enrolledClasses() });
      },
   });
}

/**
 * Mutation: Reject enrollment invitation
 * PUT /api/classes/:id/students/:studentId/reject
 */
export function useRejectEnrollment() {
   const queryClient = useQueryClient();

   return useMutation({
      mutationFn: async ({ classId, studentId }: { classId: string; studentId: string }) => {
         const response = await classApi.rejectEnrollment(classId, studentId);
         if (response.success && response.data) {
            return response.data;
         }
         throw new Error(response.message || 'Failed to reject enrollment');
      },
      onSuccess: (_, variables) => {
         queryClient.invalidateQueries({ queryKey: queryKeys.classes.detail(variables.classId) });
         queryClient.invalidateQueries({ queryKey: queryKeys.classes.list() });
         queryClient.invalidateQueries({ queryKey: queryKeys.students.enrolledClasses() });
      },
   });
}

// ============================================================
// QR-based Join Request Hooks
// ============================================================

/**
 * Query: Get all pending join requests across teacher's classes
 * GET /api/classes/join-requests
 */
export function useJoinRequests(page = 1, limit = 20, enabled = true) {
   return useQuery<JoinRequestsResponse>({
      queryKey: queryKeys.classes.joinRequests({ page, limit }),
      queryFn: async () => {
         const response = await classApi.getJoinRequests(page, limit);
         if (response.success && response.data) {
            return response.data;
         }
         throw new Error(response.message || 'Failed to fetch join requests');
      },
      enabled,
   });
}

/**
 * Mutation: Student requests to join a class via QR code
 * POST /api/classes/:id/request-join
 */
export function useRequestJoinClass() {
   const queryClient = useQueryClient();

   return useMutation({
      mutationFn: async (classId: string) => {
         const response = await classApi.requestJoinClass(classId);
         if (response.success && response.data) {
            return response.data;
         }
         throw new Error(response.message || 'Failed to request join');
      },
      onSuccess: () => {
         queryClient.invalidateQueries({ queryKey: queryKeys.students.enrolledClasses() });
         queryClient.invalidateQueries({ queryKey: queryKeys.users.me() });
      },
   });
}

/**
 * Mutation: Teacher approves a student's join request
 * PUT /api/classes/:id/students/:studentId/approve
 */
export function useApproveJoinRequest() {
   const queryClient = useQueryClient();

   return useMutation({
      mutationFn: async ({ classId, studentId }: { classId: string; studentId: string }) => {
         const response = await classApi.approveJoinRequest(classId, studentId);
         if (response.success && response.data) {
            return response.data;
         }
         throw new Error(response.message || 'Failed to approve request');
      },
      onSuccess: (_, variables) => {
         queryClient.invalidateQueries({ queryKey: queryKeys.classes.detail(variables.classId) });
         queryClient.invalidateQueries({ queryKey: queryKeys.classes.list() });
         queryClient.invalidateQueries({ queryKey: queryKeys.classes.joinRequests() });
         queryClient.invalidateQueries({ queryKey: queryKeys.users.me() });
      },
   });
}

/**
 * Mutation: Teacher denies a student's join request
 * PUT /api/classes/:id/students/:studentId/deny
 */
export function useDenyJoinRequest() {
   const queryClient = useQueryClient();

   return useMutation({
      mutationFn: async ({ classId, studentId }: { classId: string; studentId: string }) => {
         const response = await classApi.denyJoinRequest(classId, studentId);
         if (response.success && response.data) {
            return response.data;
         }
         throw new Error(response.message || 'Failed to deny request');
      },
      onSuccess: (_, variables) => {
         queryClient.invalidateQueries({ queryKey: queryKeys.classes.detail(variables.classId) });
         queryClient.invalidateQueries({ queryKey: queryKeys.classes.list() });
         queryClient.invalidateQueries({ queryKey: queryKeys.classes.joinRequests() });
         queryClient.invalidateQueries({ queryKey: queryKeys.users.me() });
      },
   });
}
