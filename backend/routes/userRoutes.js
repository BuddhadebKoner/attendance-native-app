import express from 'express';
import {
   isAuthenticatedUser,
   logout,
   updateProfile,
   getAvailableStudents,
} from '../controllers/userController.js';
import { googleSignIn } from '../controllers/googleAuthController.js';
import { isAuthenticated } from '../middleware/auth.js';

const router = express.Router();

// Public routes
router.post('/google-signin', googleSignIn);

// Protected routes (require authentication)
router.get('/me', isAuthenticated, isAuthenticatedUser);
router.get('/available', isAuthenticated, getAvailableStudents);
router.put('/profile', isAuthenticated, updateProfile);
router.post('/logout', isAuthenticated, logout);

export default router;
