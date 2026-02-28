import type { GetAttendancesQuery, GetMyAttendanceQuery, GetClassesQuery, GetEnrolledClassesQuery, GetClassAttendanceQuery } from '../types/api';

export const queryKeys = {
   users: {
      all: ['users'] as const,
      me: () => [...queryKeys.users.all, 'me'] as const,
      available: (params: { classId: string; page?: number; limit?: number; search?: string }) =>
         [...queryKeys.users.all, 'available', params] as const,
   },

   classes: {
      all: ['classes'] as const,
      list: (params?: GetClassesQuery) => [...queryKeys.classes.all, 'list', params ?? {}] as const,
      detail: (id: string) => [...queryKeys.classes.all, 'detail', id] as const,
      joinRequests: (params?: { page?: number; limit?: number }) =>
         [...queryKeys.classes.all, 'join-requests', params ?? {}] as const,
   },

   attendances: {
      all: ['attendances'] as const,
      list: (params?: GetAttendancesQuery) =>
         [...queryKeys.attendances.all, 'list', params ?? {}] as const,
      detail: (id: string) => [...queryKeys.attendances.all, 'detail', id] as const,
      summary: (id: string) => [...queryKeys.attendances.all, 'summary', id] as const,
      myAttendances: (params?: { classId?: string; page?: number; limit?: number }) =>
         [...queryKeys.attendances.all, 'my', params ?? {}] as const,
      myStats: () => [...queryKeys.attendances.all, 'my-stats'] as const,
   },

   students: {
      all: ['students'] as const,
      enrolledClasses: (params?: GetEnrolledClassesQuery) =>
         [...queryKeys.students.all, 'enrolled-classes', params ?? {}] as const,
      myRecords: (params?: GetMyAttendanceQuery) =>
         [...queryKeys.students.all, 'my-records', params ?? {}] as const,
      classAttendance: (classId: string, params?: GetClassAttendanceQuery) =>
         [...queryKeys.students.all, 'class-attendance', classId, params ?? {}] as const,
      myStats: () => [...queryKeys.students.all, 'my-stats'] as const,
      mySummary: (params?: { page?: number; limit?: number }) =>
         [...queryKeys.students.all, 'my-summary', params ?? {}] as const,
   },
};
