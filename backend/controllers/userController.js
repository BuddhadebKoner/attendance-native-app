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
// REMOVED: Mobile/password registration - Google Sign-In is the only auth method

// @desc    Login user
// @route   POST /api/users/login
// @access  Public
// REMOVED: Mobile/password login - Google Sign-In is the only auth method

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
// REMOVED: Forgot password - Google Sign-In is the only auth method

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
export const updateProfile = async (req, res) => {
   try {
      const { name, email, mobile } = req.body;

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
      if (mobile !== undefined) user.mobile = mobile;

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
// REMOVED: Change password - Google Sign-In is the only auth method

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
