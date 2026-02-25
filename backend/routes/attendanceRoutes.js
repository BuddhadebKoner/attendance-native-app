import express from 'express';
import {
   createAttendance,
   getAttendances,
   getAttendance,
   markStudentAttendance,
   markBulkAttendance,
   removeStudentFromAttendance,
   completeAttendance,
   updateAttendance,
   deleteAttendance,
   getAttendanceSummary,
   getMyAttendances,
   getMyAttendanceStats,
} from '../controllers/attendanceController.js';
import { isAuthenticated } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(isAuthenticated);

// Create new attendance (quick or scheduled)
router.post('/', createAttendance);

// Get all attendances with filters
router.get('/', getAttendances);

// Student routes - MUST come before /:id routes
router.get('/my-attendances', getMyAttendances);
router.get('/my-stats', getMyAttendanceStats);

// Get single attendance by ID
router.get('/:id', getAttendance);

// Get attendance summary/statistics
router.get('/:id/summary', getAttendanceSummary);

// Update attendance details
router.put('/:id', updateAttendance);

// Mark single student attendance
router.put('/:id/mark-student', markStudentAttendance);

// Mark multiple students (bulk)
router.put('/:id/mark-bulk', markBulkAttendance);

// Complete attendance
router.put('/:id/complete', completeAttendance);

// Remove student from attendance
router.delete('/:id/students/:studentId', removeStudentFromAttendance);

// Delete attendance
router.delete('/:id', deleteAttendance);

export default router;
