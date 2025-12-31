import express from 'express';
import {
   isAuthenticatedUser,
   register,
   login,
   logout,
   forgotPassword,
   updateProfile,
   changePassword,
   getAvailableStudents,
} from '../controllers/userController.js';
import { isAuthenticated } from '../middleware/auth.js';

const router = express.Router();

// Public routes
router.post('/register', register);
router.post('/login', login);
router.post('/forgot-password', forgotPassword);

// Protected routes (require authentication)
router.get('/me', isAuthenticated, isAuthenticatedUser);
router.get('/available', isAuthenticated, getAvailableStudents);
router.put('/profile', isAuthenticated, updateProfile);
router.put('/change-password', isAuthenticated, changePassword);
router.post('/logout', isAuthenticated, logout);

export default router;
