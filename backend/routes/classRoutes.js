import express from 'express';
import {
   createClass,
   getClasses,
   getClass,
   updateClass,
   addStudent,
   bulkAddStudents,
   removeStudent,
   bulkRemoveStudents,
   acceptEnrollment,
   rejectEnrollment,
   deleteClass,
   requestJoinClass,
   approveJoinRequest,
   denyJoinRequest,
   getPendingJoinRequests,
} from '../controllers/classController.js';
import { isAuthenticated } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(isAuthenticated);

// Join requests (must be before /:id to avoid route conflict)
router.get('/join-requests', getPendingJoinRequests);

// Class CRUD operations
router.post('/', createClass);
router.get('/', getClasses);
router.get('/:id', getClass);
router.put('/:id', updateClass);
router.delete('/:id', deleteClass);

// Student management
router.post('/:id/students', addStudent);
router.post('/:id/students/bulk', bulkAddStudents);
router.delete('/:id/students/bulk', bulkRemoveStudents);
router.delete('/:id/students/:studentId', removeStudent);

// Enrollment status management
router.put('/:id/students/:studentId/accept', acceptEnrollment);
router.put('/:id/students/:studentId/reject', rejectEnrollment);

// QR code join flow
router.post('/:id/request-join', requestJoinClass);
router.put('/:id/students/:studentId/approve', approveJoinRequest);
router.put('/:id/students/:studentId/deny', denyJoinRequest);

export default router;
