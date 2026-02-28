// Auth hooks
export {
   useCurrentUser,
   useGoogleSignIn,
   useLogout,
   useUpdateProfile,
   useAvailableStudents,
} from './useAuthQueries';

// Class hooks
export {
   useClasses,
   useClass,
   useCreateClass,
   useUpdateClass,
   useDeleteClass,
   useAddStudent,
   useBulkAddStudents,
   useBulkRemoveStudents,
   useRemoveStudent,
   useAcceptEnrollment,
   useRejectEnrollment,
   useJoinRequests,
   useRequestJoinClass,
   useApproveJoinRequest,
   useDenyJoinRequest,
} from './useClassQueries';

// Attendance hooks
export {
   useAttendances,
   useAttendanceDetail,
   useAttendanceSummary,
   useMyAttendances,
   useMyAttendanceStats,
   useCreateAttendance,
   useUpdateAttendance,
   useMarkStudent,
   useMarkBulk,
   useCompleteAttendance,
   useRemoveAttendanceStudent,
   useDeleteAttendance,
} from './useAttendanceQueries';

// Student hooks
export {
   useEnrolledClasses,
   useMyAttendanceRecords,
   useMyClassAttendance,
   useStudentStats,
   useStudentSummary,
} from './useStudentQueries';

// Query keys
export { queryKeys } from '../../services/queryKeys';
