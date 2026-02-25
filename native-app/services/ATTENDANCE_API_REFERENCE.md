# Attendance API Documentation

## Complete API Reference

---

### 1. Create Attendance
**POST** `/api/attendances`

**Request Body:**
```typescript
{
  classId: string;              // REQUIRED - Class ID reference
  attendanceType?: string;      // OPTIONAL - "quick" | "scheduled" (default: "quick")
  attendanceDate?: string;      // OPTIONAL - ISO date string (default: current date)
  scheduledFor?: string;        // REQUIRED for "scheduled" type - ISO date string
  location?: {                  // OPTIONAL
    latitude?: number;
    longitude?: number;
    address?: string;
    accuracy?: number;
  };
  notes?: string;               // OPTIONAL - Additional notes
}
```

**Response (201 Created):**
```typescript
{
  success: true,
  message: "Attendance created successfully",
  data: {
    attendance: {
      _id: string;
      attendanceType: "quick" | "scheduled";
      class: {
        _id: string;
        className: string;
        subject: string;
      };
      takenBy: {
        _id: string;
        name: string;
        mobile: string;
      };
      attendanceDate: string;
      startedAt: string;
      finishedAt: null;
      scheduledFor?: string;      // Only for scheduled type
      reminderSent: boolean;
      location?: {
        latitude?: number;
        longitude?: number;
        address?: string;
        accuracy?: number;
      };
      studentRecords: [
        {
          student: {
            _id: string;
            name: string;
            mobile: string;
          };
          status: "absent";       // Default status
          markedAt: null;
          notes: string;
        }
      ];
      totalStudents: number;
      totalPresent: 0;
      totalAbsent: number;
      totalLate: 0;
      totalExcused: 0;
      status: "in-progress";
      notes?: string;
      duration: null;
      attendancePercentage: 0;
      createdAt: string;
      updatedAt: string;
    }
  }
}
```

---

### 2. Get All Attendances
**GET** `/api/attendances`

**Query Parameters:**
```typescript
?classId=string          // OPTIONAL - Filter by class ID
&attendanceType=string   // OPTIONAL - "quick" | "scheduled"
&status=string           // OPTIONAL - "in-progress" | "completed" | "cancelled"
&page=number             // OPTIONAL - Page number (default: 1)
&limit=number            // OPTIONAL - Items per page (default: 10)
```

**Response (200 OK):**
```typescript
{
  success: true,
  data: {
    attendances: [
      {
        _id: string;
        attendanceType: "quick" | "scheduled";
        class: {
          _id: string;
          className: string;
          subject: string;
        };
        takenBy: {
          _id: string;
          name: string;
          mobile: string;
        };
        attendanceDate: string;
        startedAt: string;
        finishedAt?: string;
        status: "in-progress" | "completed" | "cancelled";
        totalStudents: number;
        totalPresent: number;
        totalAbsent: number;
        totalLate: number;
        totalExcused: number;
        attendancePercentage: number;
        duration?: number;
        createdAt: string;
        updatedAt: string;
      }
    ],
    pagination: {
      currentPage: number;
      totalPages: number;
      totalAttendances: number;
      hasNextPage: boolean;
      hasPrevPage: boolean;
    }
  }
}
```

---

### 3. Get Single Attendance
**GET** `/api/attendances/:id`

**URL Parameters:**
```typescript
:id = string  // Attendance ID
```

**Response (200 OK):**
```typescript
{
  success: true,
  data: {
    attendance: {
      _id: string;
      attendanceType: "quick" | "scheduled";
      class: {
        _id: string;
        className: string;
        subject: string;
      };
      takenBy: {
        _id: string;
        name: string;
        mobile: string;
        email?: string;
      };
      attendanceDate: string;
      startedAt: string;
      finishedAt?: string;
      scheduledFor?: string;
      reminderSent: boolean;
      location?: {
        latitude?: number;
        longitude?: number;
        address?: string;
        accuracy?: number;
      };
      studentRecords: [
        {
          _id: string;
          student: {
            _id: string;
            name: string;
            mobile: string;
            email?: string;
          };
          status: "present" | "absent" | "late" | "excused";
          markedAt?: string;
          notes?: string;
        }
      ];
      totalStudents: number;
      totalPresent: number;
      totalAbsent: number;
      totalLate: number;
      totalExcused: number;
      status: "in-progress" | "completed" | "cancelled";
      notes?: string;
      duration?: number;
      attendancePercentage: number;
      createdAt: string;
      updatedAt: string;
    }
  }
}
```

---

### 4. Get Attendance Summary
**GET** `/api/attendances/:id/summary`

**URL Parameters:**
```typescript
:id = string  // Attendance ID
```

**Response (200 OK):**
```typescript
{
  success: true,
  data: {
    summary: {
      attendanceId: string;
      class: string | {
        _id: string;
        className: string;
        subject: string;
      };
      attendanceDate: string;
      attendanceType: "quick" | "scheduled";
      status: "in-progress" | "completed" | "cancelled";
      totalStudents: number;
      totalPresent: number;
      totalAbsent: number;
      totalLate: number;
      totalExcused: number;
      attendancePercentage: number;
      duration?: number;
    }
  }
}
```

---

### 5. Mark Single Student
**PUT** `/api/attendances/:id/mark-student`

**URL Parameters:**
```typescript
:id = string  // Attendance ID
```

**Request Body:**
```typescript
{
  studentId: string;              // REQUIRED - Student ID to mark
  status: string;                 // REQUIRED - "present" | "absent" | "late" | "excused"
  notes?: string;                 // OPTIONAL - Additional notes
}
```

**Response (200 OK):**
```typescript
{
  success: true,
  message: "Student marked successfully",
  data: {
    attendance: {
      // Same structure as "Get Single Attendance"
      // Updated studentRecords with new status and markedAt timestamp
      _id: string;
      // ... all other fields
      studentRecords: [
        {
          student: { ... };
          status: "present";      // Updated status
          markedAt: string;       // Timestamp when marked
          notes?: string;
        }
      ];
      totalPresent: number;       // Updated count
      totalAbsent: number;        // Updated count
      attendancePercentage: number; // Recalculated
    }
  }
}
```

---

### 6. Mark Multiple Students (Bulk)
**PUT** `/api/attendances/:id/mark-bulk`

**URL Parameters:**
```typescript
:id = string  // Attendance ID
```

**Request Body:**
```typescript
{
  studentUpdates: [              // REQUIRED - Array of updates
    {
      studentId: string;         // REQUIRED - Student ID
      status: string;            // REQUIRED - "present" | "absent" | "late" | "excused"
      notes?: string;            // OPTIONAL - Notes for this student
    }
  ]
}
```

**Response (200 OK):**
```typescript
{
  success: true,
  message: "5 student(s) marked successfully",
  data: {
    attendance: {
      // Same structure as "Get Single Attendance"
      // All specified students updated
      _id: string;
      // ... all other fields
      studentRecords: [
        // Updated records with new statuses
      ];
      totalPresent: number;       // Updated
      totalAbsent: number;        // Updated
      totalLate: number;          // Updated
      totalExcused: number;       // Updated
      attendancePercentage: number; // Recalculated
    }
  }
}
```

---

### 7. Complete Attendance
**PUT** `/api/attendances/:id/complete`

**URL Parameters:**
```typescript
:id = string  // Attendance ID
```

**Request Body:**
```typescript
// No body required
```

**Response (200 OK):**
```typescript
{
  success: true,
  message: "Attendance completed successfully",
  data: {
    attendance: {
      // Same structure as "Get Single Attendance"
      _id: string;
      status: "completed";        // Changed to completed
      finishedAt: string;         // Set to current timestamp
      duration: number;           // Calculated in minutes
      // ... all other fields
    },
    summary: {
      attendanceId: string;
      class: string;
      attendanceDate: string;
      attendanceType: "quick" | "scheduled";
      status: "completed";
      totalStudents: number;
      totalPresent: number;
      totalAbsent: number;
      totalLate: number;
      totalExcused: number;
      attendancePercentage: number;
      duration: number;
    }
  }
}
```

---

### 8. Update Attendance Details
**PUT** `/api/attendances/:id`

**URL Parameters:**
```typescript
:id = string  // Attendance ID
```

**Request Body:**
```typescript
{
  attendanceDate?: string;       // OPTIONAL - Update date
  scheduledFor?: string;         // OPTIONAL - Only for scheduled type
  location?: {                   // OPTIONAL - Update location
    latitude?: number;
    longitude?: number;
    address?: string;
    accuracy?: number;
  };
  notes?: string;                // OPTIONAL - Update notes
  status?: string;               // OPTIONAL - "in-progress" | "completed" | "cancelled"
}
```

**Response (200 OK):**
```typescript
{
  success: true,
  message: "Attendance updated successfully",
  data: {
    attendance: {
      // Same structure as "Get Single Attendance"
      // Updated fields reflected
      _id: string;
      // ... updated fields
    }
  }
}
```

---

### 9. Remove Student from Attendance
**DELETE** `/api/attendances/:id/students/:studentId`

**URL Parameters:**
```typescript
:id = string         // Attendance ID
:studentId = string  // Student ID to remove
```

**Response (200 OK):**
```typescript
{
  success: true,
  message: "Student removed from attendance",
  data: {
    attendance: {
      // Same structure as "Get Single Attendance"
      // Specified student removed from studentRecords array
      _id: string;
      studentRecords: [
        // Student removed, array updated
      ];
      totalStudents: number;      // Decremented
      // Statistics recalculated
    }
  }
}
```

---

### 10. Delete Attendance
**DELETE** `/api/attendances/:id`

**URL Parameters:**
```typescript
:id = string  // Attendance ID
```

**Response (200 OK):**
```typescript
{
  success: true,
  message: "Attendance deleted successfully"
}
```

---

## Error Responses

All endpoints can return the following error responses:

### 400 Bad Request
```typescript
{
  success: false,
  message: "Error description",
  // Examples:
  // "Class ID is required"
  // "Student ID and status are required"
  // "Status must be one of: present, absent, late, excused"
}
```

### 403 Forbidden
```typescript
{
  success: false,
  message: "Access denied"
  // or "Only the class creator can take attendance"
  // or "Only the attendance creator can mark students"
}
```

### 404 Not Found
```typescript
{
  success: false,
  message: "Attendance not found"
  // or "Class not found"
  // or "Student not found in attendance"
}
```

### 500 Internal Server Error
```typescript
{
  success: false,
  message: "Failed to create/update/delete attendance",
  error: "Error details" // Only in development mode
}
```

---

## Notes

1. **Authentication**: All endpoints require a valid JWT token in the Authorization header:
   ```
   Authorization: Bearer <token>
   ```

2. **Access Control**:
   - Only class creators can create attendance for their classes
   - Only attendance creators can mark, update, or delete attendance
   - Students can view attendance they're enrolled in

3. **Status Flow**:
   - Attendance starts as "in-progress"
   - Can be marked as "completed" via complete endpoint
   - Can be set to "cancelled" via update endpoint
   - Cannot mark students in "completed" or "cancelled" status

4. **Automatic Calculations**:
   - Statistics (totalPresent, totalAbsent, etc.) are auto-calculated
   - Attendance percentage is computed automatically
   - Duration is calculated when attendance is completed

5. **Student Records**:
   - All class students are added with "absent" status by default
   - Students must be explicitly marked present/late/excused
