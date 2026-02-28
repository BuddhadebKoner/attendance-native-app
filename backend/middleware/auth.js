import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { JWT_SECRET } from '../config/jwt.js';

// Middleware to check if user is authenticated
export const isAuthenticated = async (req, res, next) => {
   try {
      // Get token from Authorization header
      // Expected format: "Bearer <token>"
      const authHeader = req.headers.authorization;

      if (!authHeader || !authHeader.startsWith('Bearer ')) {
         return res.status(401).json({
            success: false,
            message: 'Access denied. No token provided.',
         });
      }

      // Extract token from "Bearer <token>"
      const token = authHeader.split(' ')[1];

      if (!token) {
         return res.status(401).json({
            success: false,
            message: 'Access denied. Invalid token format.',
         });
      }

      // Verify token
      const decoded = jwt.verify(token, JWT_SECRET);

      // Find user by ID from token — include accessToken for session validation
      const user = await User.findById(decoded._id).select('+accessToken');

      if (!user) {
         return res.status(401).json({
            success: false,
            message: 'User not found. Please login again.',
         });
      }

      // Validate that the token matches the one stored in the DB.
      // This ensures logout actually revokes access and prevents
      // old tokens from working after a new login.
      if (!user.accessToken || user.accessToken !== token) {
         return res.status(401).json({
            success: false,
            message: 'Session invalidated. Please login again.',
         });
      }

      // Strip accessToken before attaching to request
      const userObj = user.toObject();
      delete userObj.accessToken;
      delete userObj.password;

      // Attach user to request object
      req.user = userObj;
      req.userId = user._id;

      next();
   } catch (error) {
      if (error.name === 'JsonWebTokenError') {
         return res.status(401).json({
            success: false,
            message: 'Invalid token. Please login again.',
         });
      }

      if (error.name === 'TokenExpiredError') {
         return res.status(401).json({
            success: false,
            message: 'Token expired. Please login again.',
         });
      }

      return res.status(500).json({
         success: false,
         message: 'Authentication failed',
         error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
   }
};
