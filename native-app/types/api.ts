// User related types
export interface User {
   _id: string;
   name?: string;
   email?: string;
   mobile?: string;
   authProvider?: 'google';
   profilePicture?: string;
   googleId?: boolean; // true if Google account is linked (actual ID not exposed)
   studentStats?: StudentStats;
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
   attendance: Attendance | string;
   class: Class | string;
   status: 'present' | 'absent' | 'late' | 'excused';
   markedAt?: string;
   notes?: string;
   addedAt: string;
}

export interface EnrolledClassesResponse {
   enrolledClasses: Class[];
   totalClasses: number;
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
}

export interface GetMyAttendanceQuery {
   classId?: string;
   status?: 'present' | 'absent' | 'late' | 'excused';
   page?: number;
   limit?: number;
}
