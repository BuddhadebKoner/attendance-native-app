import express from 'express';
import {
   createClass,
   getClasses,
   getClass,
   updateClass,
   addStudent,
   removeStudent,
   deleteClass,
} from '../controllers/classController.js';
import { isAuthenticated } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(isAuthenticated);

// Class CRUD operations
router.post('/', createClass);
router.get('/', getClasses);
router.get('/:id', getClass);
router.put('/:id', updateClass);
router.delete('/:id', deleteClass);

// Student management
router.post('/:id/students', addStudent);
router.delete('/:id/students/:studentId', removeStudent);

export default router;
