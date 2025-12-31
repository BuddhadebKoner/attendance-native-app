import User from '../models/User.js';
import Class from '../models/Class.js';

// @desc    Check if user is authenticated
// @route   GET /api/users/me
// @access  Private
export const isAuthenticatedUser = async (req, res) => {
   try {
      // User is already attached to req by middleware
      const user = await User.findById(req.userId).select('-password -accessToken');

      if (!user) {
         return res.status(404).json({
            success: false,
            message: 'User not found',
         });
      }

      // Fetch recent 5 classes created by the user
      const classes = await Class.find({ createdBy: req.userId })
         .sort({ createdAt: -1 })
         .limit(5)
         .select('className subject studentCount createdAt updatedAt')
         .lean();

      res.status(200).json({
         success: true,
         data: {
            user,
            classes,
         },
      });
   } catch (error) {
      res.status(500).json({
         success: false,
         message: 'Failed to fetch user details',
         error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
   }
};

// @desc    Register a new user
// @route   POST /api/users/register
// @access  Public
export const register = async (req, res) => {
   try {
      const { mobile, password, name, email } = req.body;

      // Validate required fields
      if (!mobile || !password) {
         return res.status(400).json({
            success: false,
            message: 'Mobile number and password are required',
         });
      }

      // Check if user already exists
      const existingUser = await User.findOne({ mobile });

      if (existingUser) {
         return res.status(409).json({
            success: false,
            message: 'User with this mobile number already exists',
         });
      }

      // Create new user
      const user = await User.create({
         mobile,
         password,
         name,
         email,
      });

      // Generate access token
      const token = user.generateAccessToken();

      // Update user with token (avoid triggering pre-save hook again)
      await User.findByIdAndUpdate(user._id, { accessToken: token });

      // Prepare response without sensitive data
      const userResponse = {
         _id: user._id,
         mobile: user.mobile,
         name: user.name,
         email: user.email,
         createdAt: user.createdAt,
         updatedAt: user.updatedAt,
      };

      res.status(201).json({
         success: true,
         message: 'User registered successfully',
         data: {
            user: userResponse,
            token,
         },
      });
   } catch (error) {
      // Handle validation errors
      if (error.name === 'ValidationError') {
         const errors = Object.values(error.errors).map(err => err.message);
         return res.status(400).json({
            success: false,
            message: 'Validation failed',
            errors,
         });
      }

      // Handle duplicate key error
      if (error.code === 11000) {
         return res.status(409).json({
            success: false,
            message: 'Mobile number already exists',
         });
      }

      res.status(500).json({
         success: false,
         message: 'Failed to register user',
         error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
   }
};

// @desc    Login user
// @route   POST /api/users/login
// @access  Public
export const login = async (req, res) => {
   try {
      const { mobile, password } = req.body;

      // Validate required fields
      if (!mobile || !password) {
         return res.status(400).json({
            success: false,
            message: 'Mobile number and password are required',
         });
      }

      // Find user by mobile and include password field
      const user = await User.findOne({ mobile }).select('+password');

      if (!user) {
         return res.status(401).json({
            success: false,
            message: 'Invalid mobile number or password',
         });
      }

      // Compare passwords
      const isPasswordMatch = await user.comparePassword(password);

      if (!isPasswordMatch) {
         return res.status(401).json({
            success: false,
            message: 'Invalid mobile number or password',
         });
      }

      // Generate new access token
      const token = user.generateAccessToken();

      // Save token to user
      user.accessToken = token;
      await user.save();

      // Remove password from response
      const userResponse = user.toObject();
      delete userResponse.password;
      delete userResponse.accessToken;

      res.status(200).json({
         success: true,
         message: 'Login successful',
         data: {
            user: userResponse,
            token,
         },
      });
   } catch (error) {
      res.status(500).json({
         success: false,
         message: 'Login failed',
         error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
   }
};

// @desc    Logout user
// @route   POST /api/users/logout
// @access  Private
export const logout = async (req, res) => {
   try {
      // Clear user's access token from database
      const user = await User.findById(req.userId);

      if (user) {
         user.accessToken = null;
         await user.save();
      }

      res.status(200).json({
         success: true,
         message: 'Logout successful',
      });
   } catch (error) {
      res.status(500).json({
         success: false,
         message: 'Logout failed',
         error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
   }
};

// @desc    Forgot password - Send reset instructions
// @route   POST /api/users/forgot-password
// @access  Public
export const forgotPassword = async (req, res) => {
   try {
      const { mobile } = req.body;

      // Validate required field
      if (!mobile) {
         return res.status(400).json({
            success: false,
            message: 'Mobile number is required',
         });
      }

      // Find user by mobile
      const user = await User.findOne({ mobile });

      if (!user) {
         // Don't reveal if user exists for security
         return res.status(200).json({
            success: true,
            message: 'If the mobile number exists, password reset instructions will be sent',
         });
      }

      // TODO: Implement OTP or password reset logic here
      // For now, just return success message
      // You can add SMS service integration for sending OTP

      res.status(200).json({
         success: true,
         message: 'Password reset instructions sent successfully',
         data: {
            mobile: user.mobile,
            // In production, you would send an OTP via SMS
            // and not return it in the response
         },
      });
   } catch (error) {
      res.status(500).json({
         success: false,
         message: 'Failed to process forgot password request',
         error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
   }
};

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
export const updateProfile = async (req, res) => {
   try {
      const { name, email } = req.body;

      // Find user
      const user = await User.findById(req.userId);

      if (!user) {
         return res.status(404).json({
            success: false,
            message: 'User not found',
         });
      }

      // Update fields if provided
      if (name !== undefined) user.name = name;
      if (email !== undefined) user.email = email;

      await user.save();

      // Return updated user without sensitive data
      const userResponse = {
         _id: user._id,
         mobile: user.mobile,
         name: user.name,
         email: user.email,
         createdAt: user.createdAt,
         updatedAt: user.updatedAt,
      };

      res.status(200).json({
         success: true,
         message: 'Profile updated successfully',
         data: {
            user: userResponse,
         },
      });
   } catch (error) {
      // Handle validation errors
      if (error.name === 'ValidationError') {
         const errors = Object.values(error.errors).map(err => err.message);
         return res.status(400).json({
            success: false,
            message: 'Validation failed',
            errors,
         });
      }

      res.status(500).json({
         success: false,
         message: 'Failed to update profile',
         error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
   }
};

// @desc    Change user password
// @route   PUT /api/users/change-password
// @access  Private
export const changePassword = async (req, res) => {
   try {
      const { oldPassword, newPassword } = req.body;

      // Validate required fields
      if (!oldPassword || !newPassword) {
         return res.status(400).json({
            success: false,
            message: 'Old password and new password are required',
         });
      }

      // Validate new password length
      if (newPassword.length < 6) {
         return res.status(400).json({
            success: false,
            message: 'New password must be at least 6 characters long',
         });
      }

      // Find user with password field
      const user = await User.findById(req.userId).select('+password');

      if (!user) {
         return res.status(404).json({
            success: false,
            message: 'User not found',
         });
      }

      // Verify old password
      const isPasswordMatch = await user.comparePassword(oldPassword);

      if (!isPasswordMatch) {
         return res.status(401).json({
            success: false,
            message: 'Old password is incorrect',
         });
      }

      // Update password
      user.password = newPassword;
      user.accessToken = null; // Invalidate current token
      await user.save();

      res.status(200).json({
         success: true,
         message: 'Password changed successfully. Please login with your new password.',
      });
   } catch (error) {
      res.status(500).json({
         success: false,
         message: 'Failed to change password',
         error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
   }
};

// @desc    Get available users to add to a class (excluding current user and already enrolled students)
// @route   GET /api/users/available?classId=xxx
// @access  Private
export const getAvailableStudents = async (req, res) => {
   try {
      const { classId } = req.query;
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const search = req.query.search || '';
      const skip = (page - 1) * limit;

      // Validate classId
      if (!classId) {
         return res.status(400).json({
            success: false,
            message: 'Class ID is required',
         });
      }

      // Get the class to find already enrolled students
      const classData = await Class.findById(classId);

      if (!classData) {
         return res.status(404).json({
            success: false,
            message: 'Class not found',
         });
      }

      // Build search query
      const searchQuery = {
         _id: {
            $ne: req.userId, // Exclude current user
            $nin: classData.students, // Exclude already enrolled students
         },
      };

      // Add search filter if provided
      if (search) {
         searchQuery.$or = [
            { name: { $regex: search, $options: 'i' } },
            { mobile: { $regex: search, $options: 'i' } },
            { email: { $regex: search, $options: 'i' } },
         ];
      }

      // Get total count for pagination
      const totalUsers = await User.countDocuments(searchQuery);

      // Fetch users
      const users = await User.find(searchQuery)
         .select('name mobile email createdAt')
         .sort({ createdAt: -1 })
         .skip(skip)
         .limit(limit)
         .lean();

      res.status(200).json({
         success: true,
         data: {
            users,
            pagination: {
               currentPage: page,
               totalPages: Math.ceil(totalUsers / limit),
               totalUsers,
               limit,
               hasNextPage: page < Math.ceil(totalUsers / limit),
               hasPrevPage: page > 1,
            },
         },
      });
   } catch (error) {
      res.status(500).json({
         success: false,
         message: 'Failed to fetch users',
         error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
   }
};
