import express from 'express';
import {
   getMyEnrolledClasses,
   getMyAttendanceRecords,
   getMyAttendanceForClass,
   getMyAttendanceStats,
   getMyAttendanceSummary,
} from '../controllers/studentController.js';
import { isAuthenticated } from '../middleware/auth.js';

const router = express.Router();

// All routes are protected (require authentication)
router.use(isAuthenticated);

// Student-specific routes
router.get('/me/classes', getMyEnrolledClasses);
router.get('/me/attendance', getMyAttendanceRecords);
router.get('/me/attendance/class/:classId', getMyAttendanceForClass);
router.get('/me/stats', getMyAttendanceStats);
router.get('/me/summary', getMyAttendanceSummary);

export default router;
