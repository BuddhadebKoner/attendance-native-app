import mongoose from 'mongoose';
import User from '../models/User.js';
import Class from '../models/Class.js';
import StudentAttendanceRecord from '../models/StudentAttendanceRecord.js';

// @desc    Get student's enrolled classes (with enrollment status)
// @route   GET /api/students/me/classes
// @access  Private
export const getMyEnrolledClasses = async (req, res) => {
   try {
      const { page = 1, limit = 20 } = req.query;
      const skip = (parseInt(page) - 1) * parseInt(limit);
      const userId = new mongoose.Types.ObjectId(req.userId);

      // Aggregation: filter to only current user's enrollment entry, paginate at DB level
      const pipeline = [
         { $match: { 'students.student': userId } },
         {
            $addFields: {
               myEnrollment: {
                  $arrayElemAt: [
                     {
                        $filter: {
                           input: '$students',
                           as: 's',
                           cond: { $eq: ['$$s.student', userId] },
                        },
                     },
                     0,
                  ],
               },
            },
         },
         {
            $project: {
               className: 1,
               subject: 1,
               createdBy: 1,
               createdAt: 1,
               enrollmentStatus: '$myEnrollment.status',
               enrolledAt: '$myEnrollment.enrolledAt',
            },
         },
         { $sort: { createdAt: -1 } },
         {
            $facet: {
               metadata: [{ $count: 'totalClasses' }],
               enrolledClasses: [
                  { $skip: skip },
                  { $limit: parseInt(limit) },
               ],
            },
         },
      ];

      const [result] = await Class.aggregate(pipeline);

      const totalClasses = result.metadata[0]?.totalClasses || 0;
      const enrolledClasses = result.enrolledClasses;

      // Populate createdBy for the paginated results
      await Class.populate(enrolledClasses, {
         path: 'createdBy',
         select: 'name mobile email',
      });

      res.status(200).json({
         success: true,
         data: {
            enrolledClasses,
            totalClasses,
            pagination: {
               currentPage: parseInt(page),
               totalPages: Math.ceil(totalClasses / parseInt(limit)),
               totalClasses,
               hasNextPage: parseInt(page) < Math.ceil(totalClasses / parseInt(limit)),
               hasPrevPage: parseInt(page) > 1,
            },
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
      const skip = (parseInt(page) - 1) * parseInt(limit);
      const userId = new mongoose.Types.ObjectId(req.userId);

      // Build match filter
      const matchFilter = { student: userId };
      if (classId) matchFilter.class = new mongoose.Types.ObjectId(classId);
      if (status) matchFilter.status = status;

      // Count total + fetch paginated records in parallel
      const [totalRecords, attendanceRecords] = await Promise.all([
         StudentAttendanceRecord.countDocuments(matchFilter),
         StudentAttendanceRecord.find(matchFilter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit))
            .populate('attendance', 'attendanceDate attendanceType status location notes duration')
            .populate('class', 'className subject')
            .lean(),
      ]);

      res.status(200).json({
         success: true,
         data: {
            attendanceRecords,
            pagination: {
               currentPage: parseInt(page),
               totalPages: Math.ceil(totalRecords / parseInt(limit)),
               totalRecords,
               hasNextPage: parseInt(page) < Math.ceil(totalRecords / parseInt(limit)),
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
      const { page = 1, limit = 20 } = req.query;
      const skip = (parseInt(page) - 1) * parseInt(limit);
      const userId = new mongoose.Types.ObjectId(req.userId);
      const classObjId = new mongoose.Types.ObjectId(classId);

      // Check if student is enrolled (using $elemMatch for correctness)
      const classEnrollment = await Class.findOne({
         _id: classObjId,
         students: { $elemMatch: { student: userId } },
      });

      if (!classEnrollment) {
         return res.status(403).json({
            success: false,
            message: 'You are not enrolled in this class',
         });
      }

      // Single aggregation: stats + paginated records in one DB call
      const [result] = await StudentAttendanceRecord.aggregate([
         { $match: { student: userId, class: classObjId } },
         { $sort: { createdAt: -1 } },
         {
            $facet: {
               statistics: [
                  {
                     $group: {
                        _id: null,
                        totalSessions: { $sum: 1 },
                        present: {
                           $sum: { $cond: [{ $eq: ['$status', 'present'] }, 1, 0] },
                        },
                        absent: {
                           $sum: { $cond: [{ $eq: ['$status', 'absent'] }, 1, 0] },
                        },
                        late: {
                           $sum: { $cond: [{ $eq: ['$status', 'late'] }, 1, 0] },
                        },
                        excused: {
                           $sum: { $cond: [{ $eq: ['$status', 'excused'] }, 1, 0] },
                        },
                     },
                  },
               ],
               records: [
                  { $skip: skip },
                  { $limit: parseInt(limit) },
               ],
               totalCount: [{ $count: 'count' }],
            },
         },
      ]);

      const stats = result.statistics[0] || {
         totalSessions: 0,
         present: 0,
         absent: 0,
         late: 0,
         excused: 0,
      };
      stats.attendancePercentage =
         stats.totalSessions > 0
            ? Math.round((stats.present / stats.totalSessions) * 100)
            : 0;
      delete stats._id;

      const totalRecords = result.totalCount[0]?.count || 0;
      const attendanceRecords = result.records;

      // Populate the paginated records
      await StudentAttendanceRecord.populate(attendanceRecords, [
         {
            path: 'attendance',
            select: 'attendanceDate attendanceType status location notes duration',
         },
         {
            path: 'class',
            select: 'className subject',
         },
      ]);

      // Get class info
      const classInfo = await Class.findById(classId)
         .select('className subject')
         .populate('createdBy', 'name mobile');

      res.status(200).json({
         success: true,
         data: {
            class: classInfo,
            attendanceRecords,
            statistics: stats,
            pagination: {
               currentPage: parseInt(page),
               totalPages: Math.ceil(totalRecords / parseInt(limit)),
               totalRecords,
               hasNextPage: parseInt(page) < Math.ceil(totalRecords / parseInt(limit)),
               hasPrevPage: parseInt(page) > 1,
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
      const userId = new mongoose.Types.ObjectId(req.userId);

      // Aggregate stats from StudentAttendanceRecord (single DB call)
      const [statsResult, totalEnrolledClasses] = await Promise.all([
         StudentAttendanceRecord.aggregate([
            { $match: { student: userId } },
            {
               $group: {
                  _id: null,
                  totalAttendanceSessions: { $sum: 1 },
                  totalPresent: {
                     $sum: { $cond: [{ $eq: ['$status', 'present'] }, 1, 0] },
                  },
                  totalAbsent: {
                     $sum: { $cond: [{ $eq: ['$status', 'absent'] }, 1, 0] },
                  },
                  totalLate: {
                     $sum: { $cond: [{ $eq: ['$status', 'late'] }, 1, 0] },
                  },
                  totalExcused: {
                     $sum: { $cond: [{ $eq: ['$status', 'excused'] }, 1, 0] },
                  },
               },
            },
         ]),
         // Use $elemMatch for correct enrolled class count
         Class.countDocuments({
            students: { $elemMatch: { student: userId, status: 'accepted' } },
         }),
      ]);

      const stats = statsResult[0] || {
         totalAttendanceSessions: 0,
         totalPresent: 0,
         totalAbsent: 0,
         totalLate: 0,
         totalExcused: 0,
      };
      delete stats._id;

      stats.attendancePercentage =
         stats.totalAttendanceSessions > 0
            ? Math.round((stats.totalPresent / stats.totalAttendanceSessions) * 100)
            : 0;
      stats.totalClassesEnrolled = totalEnrolledClasses;

      res.status(200).json({
         success: true,
         data: {
            statistics: stats,
            totalEnrolledClasses,
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
      const { page = 1, limit = 10 } = req.query;
      const skip = (parseInt(page) - 1) * parseInt(limit);
      const userId = new mongoose.Types.ObjectId(req.userId);

      // Single aggregation: group by class, compute stats per class, lookup class info
      const [classSummariesResult, overallResult, totalEnrolledClasses] = await Promise.all([
         StudentAttendanceRecord.aggregate([
            { $match: { student: userId } },
            {
               $group: {
                  _id: '$class',
                  totalSessions: { $sum: 1 },
                  present: {
                     $sum: { $cond: [{ $eq: ['$status', 'present'] }, 1, 0] },
                  },
                  absent: {
                     $sum: { $cond: [{ $eq: ['$status', 'absent'] }, 1, 0] },
                  },
                  late: {
                     $sum: { $cond: [{ $eq: ['$status', 'late'] }, 1, 0] },
                  },
                  excused: {
                     $sum: { $cond: [{ $eq: ['$status', 'excused'] }, 1, 0] },
                  },
               },
            },
            {
               $lookup: {
                  from: 'classes',
                  localField: '_id',
                  foreignField: '_id',
                  as: 'classInfo',
               },
            },
            { $unwind: '$classInfo' },
            {
               $project: {
                  classId: '$_id',
                  className: '$classInfo.className',
                  subject: '$classInfo.subject',
                  totalSessions: 1,
                  present: 1,
                  absent: 1,
                  late: 1,
                  excused: 1,
                  attendancePercentage: {
                     $cond: [
                        { $gt: ['$totalSessions', 0] },
                        {
                           $round: [
                              { $multiply: [{ $divide: ['$present', '$totalSessions'] }, 100] },
                              0,
                           ],
                        },
                        0,
                     ],
                  },
               },
            },
            { $sort: { className: 1 } },
            {
               $facet: {
                  summaries: [
                     { $skip: skip },
                     { $limit: parseInt(limit) },
                  ],
                  totalCount: [{ $count: 'count' }],
               },
            },
         ]),
         StudentAttendanceRecord.aggregate([
            { $match: { student: userId } },
            {
               $group: {
                  _id: null,
                  totalAttendanceSessions: { $sum: 1 },
                  totalPresent: {
                     $sum: { $cond: [{ $eq: ['$status', 'present'] }, 1, 0] },
                  },
                  totalAbsent: {
                     $sum: { $cond: [{ $eq: ['$status', 'absent'] }, 1, 0] },
                  },
                  totalLate: {
                     $sum: { $cond: [{ $eq: ['$status', 'late'] }, 1, 0] },
                  },
                  totalExcused: {
                     $sum: { $cond: [{ $eq: ['$status', 'excused'] }, 1, 0] },
                  },
               },
            },
         ]),
         Class.countDocuments({
            students: { $elemMatch: { student: userId, status: 'accepted' } },
         }),
      ]);

      const overallStats = overallResult[0] || {
         totalAttendanceSessions: 0,
         totalPresent: 0,
         totalAbsent: 0,
         totalLate: 0,
         totalExcused: 0,
      };
      delete overallStats._id;

      overallStats.attendancePercentage =
         overallStats.totalAttendanceSessions > 0
            ? Math.round((overallStats.totalPresent / overallStats.totalAttendanceSessions) * 100)
            : 0;
      overallStats.totalClassesEnrolled = totalEnrolledClasses;

      const classSummaries = classSummariesResult[0]?.summaries || [];
      const totalClassSummaries = classSummariesResult[0]?.totalCount[0]?.count || 0;

      res.status(200).json({
         success: true,
         data: {
            overallStats,
            classSummaries,
            totalClasses: totalClassSummaries,
            pagination: {
               currentPage: parseInt(page),
               totalPages: Math.ceil(totalClassSummaries / parseInt(limit)),
               totalClasses: totalClassSummaries,
               hasNextPage: parseInt(page) < Math.ceil(totalClassSummaries / parseInt(limit)),
               hasPrevPage: parseInt(page) > 1,
            },
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
