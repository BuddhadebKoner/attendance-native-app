import User from '../models/User.js';
import Class from '../models/Class.js';
import Attendance from '../models/Attendance.js';

// @desc    Get student's enrolled classes
// @route   GET /api/students/me/classes
// @access  Private
export const getMyEnrolledClasses = async (req, res) => {
   try {
      const user = await User.findById(req.userId)
         .populate({
            path: 'enrolledClasses',
            select: 'className subject createdBy createdAt',
            populate: {
               path: 'createdBy',
               select: 'name mobile email',
            },
         });

      if (!user) {
         return res.status(404).json({
            success: false,
            message: 'User not found',
         });
      }

      res.status(200).json({
         success: true,
         data: {
            enrolledClasses: user.enrolledClasses || [],
            totalClasses: user.enrolledClasses?.length || 0,
         },
      });
   } catch (error) {
      res.status(500).json({
         success: false,
         message: 'Failed to fetch enrolled classes',
         error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
   }
};

// @desc    Get student's attendance records
// @route   GET /api/students/me/attendance
// @access  Private
export const getMyAttendanceRecords = async (req, res) => {
   try {
      const { classId, status, page = 1, limit = 20 } = req.query;

      const user = await User.findById(req.userId);

      if (!user) {
         return res.status(404).json({
            success: false,
            message: 'User not found',
         });
      }

      // Build filter
      let records = user.myAttendanceRecords || [];

      // Filter by class if provided
      if (classId) {
         records = records.filter(
            record => record.class.toString() === classId
         );
      }

      // Filter by status if provided
      if (status) {
         records = records.filter(record => record.status === status);
      }

      // Sort by markedAt (most recent first)
      records.sort((a, b) => {
         const dateA = a.markedAt || a.addedAt;
         const dateB = b.markedAt || b.addedAt;
         return dateB - dateA;
      });

      // Pagination
      const skip = (parseInt(page) - 1) * parseInt(limit);
      const paginatedRecords = records.slice(skip, skip + parseInt(limit));

      // Populate attendance and class details
      await User.populate(paginatedRecords, [
         {
            path: 'attendance',
            select: 'attendanceDate attendanceType status location notes duration',
         },
         {
            path: 'class',
            select: 'className subject',
         },
      ]);

      res.status(200).json({
         success: true,
         data: {
            attendanceRecords: paginatedRecords,
            pagination: {
               currentPage: parseInt(page),
               totalPages: Math.ceil(records.length / parseInt(limit)),
               totalRecords: records.length,
               hasNextPage: parseInt(page) < Math.ceil(records.length / parseInt(limit)),
               hasPrevPage: parseInt(page) > 1,
            },
         },
      });
   } catch (error) {
      res.status(500).json({
         success: false,
         message: 'Failed to fetch attendance records',
         error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
   }
};

// @desc    Get student's attendance for a specific class
// @route   GET /api/students/me/attendance/class/:classId
// @access  Private
export const getMyAttendanceForClass = async (req, res) => {
   try {
      const { classId } = req.params;

      const user = await User.findById(req.userId);

      if (!user) {
         return res.status(404).json({
            success: false,
            message: 'User not found',
         });
      }

      // Check if student is enrolled in this class
      if (!user.enrolledClasses?.includes(classId)) {
         return res.status(403).json({
            success: false,
            message: 'You are not enrolled in this class',
         });
      }

      // Filter records for this class
      const classRecords = (user.myAttendanceRecords || []).filter(
         record => record.class.toString() === classId
      );

      // Sort by markedAt (most recent first)
      classRecords.sort((a, b) => {
         const dateA = a.markedAt || a.addedAt;
         const dateB = b.markedAt || b.addedAt;
         return dateB - dateA;
      });

      // Populate details
      await User.populate(classRecords, [
         {
            path: 'attendance',
            select: 'attendanceDate attendanceType status location notes duration',
         },
         {
            path: 'class',
            select: 'className subject',
         },
      ]);

      // Calculate statistics for this class
      const totalSessions = classRecords.length;
      const present = classRecords.filter(r => r.status === 'present').length;
      const absent = classRecords.filter(r => r.status === 'absent').length;
      const late = classRecords.filter(r => r.status === 'late').length;
      const excused = classRecords.filter(r => r.status === 'excused').length;
      const percentage = totalSessions > 0 ? Math.round((present / totalSessions) * 100) : 0;

      // Get class info
      const classInfo = await Class.findById(classId)
         .select('className subject')
         .populate('createdBy', 'name mobile');

      res.status(200).json({
         success: true,
         data: {
            class: classInfo,
            attendanceRecords: classRecords,
            statistics: {
               totalSessions,
               present,
               absent,
               late,
               excused,
               attendancePercentage: percentage,
            },
         },
      });
   } catch (error) {
      res.status(500).json({
         success: false,
         message: 'Failed to fetch class attendance',
         error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
   }
};

// @desc    Get student's overall attendance statistics
// @route   GET /api/students/me/stats
// @access  Private
export const getMyAttendanceStats = async (req, res) => {
   try {
      const user = await User.findById(req.userId);

      if (!user) {
         return res.status(404).json({
            success: false,
            message: 'User not found',
         });
      }

      // Refresh statistics from database
      await user.updateAttendanceStats();

      // Get updated user with stats
      const updatedUser = await User.findById(req.userId)
         .select('studentStats enrolledClasses');

      res.status(200).json({
         success: true,
         data: {
            statistics: updatedUser.studentStats,
            totalEnrolledClasses: updatedUser.enrolledClasses?.length || 0,
         },
      });
   } catch (error) {
      res.status(500).json({
         success: false,
         message: 'Failed to fetch attendance statistics',
         error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
   }
};

// @desc    Get student's attendance summary by class
// @route   GET /api/students/me/summary
// @access  Private
export const getMyAttendanceSummary = async (req, res) => {
   try {
      const user = await User.findById(req.userId)
         .populate('enrolledClasses', 'className subject');

      if (!user) {
         return res.status(404).json({
            success: false,
            message: 'User not found',
         });
      }

      // Get attendance summary for each class
      const classSummaries = await Promise.all(
         (user.enrolledClasses || []).map(async (classDoc) => {
            const classRecords = (user.myAttendanceRecords || []).filter(
               record => record.class.toString() === classDoc._id.toString()
            );

            const totalSessions = classRecords.length;
            const present = classRecords.filter(r => r.status === 'present').length;
            const absent = classRecords.filter(r => r.status === 'absent').length;
            const late = classRecords.filter(r => r.status === 'late').length;
            const excused = classRecords.filter(r => r.status === 'excused').length;
            const percentage = totalSessions > 0 ? Math.round((present / totalSessions) * 100) : 0;

            return {
               classId: classDoc._id,
               className: classDoc.className,
               subject: classDoc.subject,
               totalSessions,
               present,
               absent,
               late,
               excused,
               attendancePercentage: percentage,
            };
         })
      );

      res.status(200).json({
         success: true,
         data: {
            overallStats: user.studentStats,
            classSummaries,
            totalClasses: user.enrolledClasses?.length || 0,
         },
      });
   } catch (error) {
      res.status(500).json({
         success: false,
         message: 'Failed to fetch attendance summary',
         error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
   }
};
