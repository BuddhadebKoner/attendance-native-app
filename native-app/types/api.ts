// User related types
export interface User {
   _id: string;
   name?: string;
   email?: string;
   mobile?: string;
   authProvider?: 'google';
   role?: 'teacher' | 'student' | null;
   profilePicture?: string;
   googleId?: boolean; // true if Google account is linked (actual ID not exposed)
   studentStats?: StudentStats;
   totalJoinRequests?: number;
   createdAt: string;
   updatedAt: string;
}

export interface UserWithClasses extends User {
   classes?: Class[];
}

export interface StudentStats {
   totalClassesEnrolled: number;
   totalAttendanceSessions: number;
   totalPresent: number;
   totalAbsent: number;
   totalLate: number;
   totalExcused: number;
   attendancePercentage: number;
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
export interface AuthResponse {
   user: User;
   token: string;
}

export interface GoogleSignInRequest {
   idToken?: string;
   code?: string;
   redirectUri?: string;
}

export interface GoogleAuthResponse {
   user: User;
   token: string;
   isNewUser: boolean;
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
export type EnrollmentStatus = 'pending' | 'requested' | 'accepted';

export interface StudentEnrollment {
   student: User | string;
   status: EnrollmentStatus;
   enrolledAt?: string;
   _id?: string;
}

export interface Class {
   _id: string;
   className: string;
   subject: string;
   createdBy: User | string;
   students?: StudentEnrollment[] | User[] | string[];
   studentCount?: number;
   acceptedCount?: number;
   pendingCount?: number;
   requestedCount?: number;
   createdAt: string;
   updatedAt: string;
}

// Enrolled class from student perspective (includes enrollment status)
export interface EnrolledClass {
   _id: string;
   className: string;
   subject: string;
   createdBy: User | string;
   enrollmentStatus: EnrollmentStatus;
   enrolledAt?: string | null;
   createdAt: string;
   updatedAt?: string;
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

// Attendance related types
export interface Location {
   latitude?: number;
   longitude?: number;
   address?: string;
   accuracy?: number;
}

export interface AttendanceRecord {
   student: User | string;
   status: 'present' | 'absent' | 'late' | 'excused';
   markedAt?: string;
   notes?: string;
}

export interface MyAttendanceRecord {
   status: 'present' | 'absent' | 'late' | 'excused';
   markedAt?: string;
   notes?: string;
}

export interface Attendance {
   _id: string;
   attendanceType: 'quick' | 'scheduled';
   class: Class | string;
   takenBy: User | string;
   attendanceDate: string;
   startedAt: string;
   finishedAt?: string;
   scheduledFor?: string;
   reminderSent?: boolean;
   location?: Location;
   studentRecords: AttendanceRecord[];
   totalStudents: number;
   totalPresent: number;
   totalAbsent: number;
   totalLate: number;
   totalExcused: number;
   status: 'in-progress' | 'completed' | 'cancelled';
   notes?: string;
   duration?: number;
   attendancePercentage?: number;
   isCreator?: boolean;
   myRecord?: MyAttendanceRecord | null;
   createdAt: string;
   updatedAt: string;
}

export interface CreateAttendanceRequest {
   classId: string;
   attendanceType?: 'quick' | 'scheduled';
   attendanceDate?: string;
   scheduledFor?: string;
   location?: Location;
   notes?: string;
}

export interface UpdateAttendanceRequest {
   attendanceDate?: string;
   scheduledFor?: string;
   location?: Location;
   notes?: string;
   status?: 'in-progress' | 'completed' | 'cancelled';
}

export interface MarkStudentRequest {
   studentId: string;
   status: 'present' | 'absent' | 'late' | 'excused';
   notes?: string;
}

export interface MarkBulkRequest {
   studentUpdates: {
      studentId: string;
      status: 'present' | 'absent' | 'late' | 'excused';
      notes?: string;
   }[];
}

export interface AttendanceSummary {
   attendanceId: string;
   class: Class | string;
   attendanceDate: string;
   attendanceType: 'quick' | 'scheduled';
   status: 'in-progress' | 'completed' | 'cancelled';
   totalStudents: number;
   totalPresent: number;
   totalAbsent: number;
   totalLate: number;
   totalExcused: number;
   attendancePercentage: number;
   duration?: number;
}

// Active attendance session for student view
export interface ActiveAttendance {
   _id: string;
   attendanceType: 'quick' | 'scheduled';
   attendanceDate: string;
   scheduledFor?: string;
   status: 'in-progress' | 'completed' | 'cancelled';
   takenBy: { _id: string; name: string } | string;
   location?: Location;
   notes?: string;
   myStatus: 'present' | 'absent' | 'late' | 'excused' | null;
   markedAt?: string | null;
   createdAt: string;
}

export interface GetAttendancesQuery {
   classId?: string;
   attendanceType?: 'quick' | 'scheduled';
   status?: 'in-progress' | 'completed' | 'cancelled';
   page?: number;
   limit?: number;
}

export interface PaginationInfo {
   currentPage: number;
   totalPages: number;
   totalAttendances?: number;
   totalStudents?: number;
   studentsPerPage?: number;
   hasNextPage: boolean;
   hasPrevPage: boolean;
}

// Student attendance types
export interface MyAttendance {
   _id: string;
   attendanceType: 'quick' | 'scheduled';
   class: Class;
   takenBy: User;
   attendanceDate: string;
   myStatus: 'present' | 'absent' | 'late' | 'excused';
   markedAt?: string;
   notes?: string;
   totalStudents: number;
   totalPresent: number;
}

export interface MyAttendancesResponse {
   attendances: MyAttendance[];
   statistics: StudentStats;
   pagination: PaginationInfo;
}

export interface MyStatsResponse {
   statistics: StudentStats;
   classesEnrolled: Class[];
}

// Student-specific types
export interface MyAttendanceRecord {
   _id: string;
   attendance: Attendance | string;
   class: Class | string;
   student: User | string;
   status: 'present' | 'absent' | 'late' | 'excused';
   markedAt?: string;
   notes?: string;
   createdAt: string;
   updatedAt: string;
}

export interface EnrolledClassesResponse {
   enrolledClasses: EnrolledClass[];
   totalClasses: number;
   pagination: PaginationInfo & { totalClasses?: number };
}

export interface MyAttendanceRecordsResponse {
   attendanceRecords: MyAttendanceRecord[];
   pagination: PaginationInfo;
}

export interface ClassAttendanceResponse {
   class: Class;
   attendanceRecords: MyAttendanceRecord[];
   statistics: {
      totalSessions: number;
      present: number;
      absent: number;
      late: number;
      excused: number;
      attendancePercentage: number;
   };
   pagination: PaginationInfo;
}

export interface StudentStatsResponse {
   statistics: StudentStats;
   totalEnrolledClasses: number;
}

export interface ClassSummary {
   classId: string;
   className: string;
   subject: string;
   totalSessions: number;
   present: number;
   absent: number;
   late: number;
   excused: number;
   attendancePercentage: number;
}

export interface AttendanceSummaryResponse {
   overallStats: StudentStats;
   classSummaries: ClassSummary[];
   totalClasses: number;
   pagination?: {
      currentPage: number;
      totalPages: number;
      totalClasses: number;
      hasNextPage: boolean;
      hasPrevPage: boolean;
   };
}

export interface GetMyAttendanceQuery {
   classId?: string;
   status?: 'present' | 'absent' | 'late' | 'excused';
   page?: number;
   limit?: number;
}

export interface GetClassesQuery {
   page?: number;
   limit?: number;
}

export interface GetEnrolledClassesQuery {
   page?: number;
   limit?: number;
}

export interface GetClassAttendanceQuery {
   page?: number;
   limit?: number;
}

export interface ClassListResponse {
   classes: Class[];
   count: number;
   pagination: PaginationInfo & { totalClasses?: number };
}

// QR Code join request types
export interface JoinRequestItem {
   classId: string;
   className: string;
   subject: string;
   student: {
      _id: string;
      name?: string;
      email?: string;
      mobile?: string;
      profilePicture?: string;
   };
   requestedAt: string;
}

export interface JoinRequestsResponse {
   requests: JoinRequestItem[];
   totalRequests: number;
   pagination: PaginationInfo & { totalRequests?: number };
}

export interface RequestJoinResponse {
   classId: string;
   className: string;
   subject: string;
   status: 'requested';
}
