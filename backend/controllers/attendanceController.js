import mongoose from 'mongoose';
import Attendance from '../models/Attendance.js';
import Class from '../models/Class.js';
import User from '../models/User.js';
import StudentAttendanceRecord from '../models/StudentAttendanceRecord.js';

// @desc    Create new attendance (quick or scheduled)
// @route   POST /api/attendances
// @access  Private
export const createAttendance = async (req, res) => {
   try {
      const {
         classId,
         attendanceType = 'quick',
         attendanceDate,
         scheduledFor,
         location,
         notes,
      } = req.body;

      // Validate required fields
      if (!classId) {
         return res.status(400).json({
            success: false,
            message: 'Class ID is required',
         });
      }

      // Verify class exists and user has access
      const classData = await Class.findById(classId);
      if (!classData) {
         return res.status(404).json({
            success: false,
            message: 'Class not found',
         });
      }

      // Only class creator can take attendance
      if (classData.createdBy.toString() !== req.userId.toString()) {
         return res.status(403).json({
            success: false,
            message: 'Only the class creator can take attendance',
         });
      }

      // Block if there's already an in-progress attendance for this class
      const existingInProgress = await Attendance.exists({ class: classId, status: 'in-progress' });
      if (existingInProgress) {
         return res.status(400).json({
            success: false,
            message: 'An attendance session is already in progress for this class. Complete or cancel it before creating a new one.',
         });
      }

      // Check enrollment statuses — only accepted students can be in attendance
      // 'pending' = teacher invited, student hasn't accepted → blocks attendance
      // 'requested' = student asked to join via QR, teacher hasn't approved → does NOT block
      const pendingStudents = classData.students.filter(s => s.status === 'pending');
      const acceptedStudents = classData.students.filter(s => s.status === 'accepted');

      if (acceptedStudents.length === 0) {
         return res.status(400).json({
            success: false,
            message: 'No accepted students in this class. All students must accept their enrollment before attendance can be taken.',
         });
      }

      if (pendingStudents.length > 0) {
         return res.status(400).json({
            success: false,
            message: `${pendingStudents.length} student(s) have pending enrollment. All students must accept their enrollment before attendance can be taken.`,
            data: { pendingCount: pendingStudents.length },
         });
      }

      // Validate scheduled attendance has scheduledFor date
      if (attendanceType === 'scheduled' && !scheduledFor) {
         return res.status(400).json({
            success: false,
            message: 'Scheduled attendance requires a scheduledFor date',
         });
      }

      // Get only accepted students for attendance records
      const studentRecords = acceptedStudents.map(entry => ({
         student: entry.student,
         status: 'absent', // Default status
      }));

      console.log('Creating attendance with data:', {
         attendanceType,
         classId,
         userId: req.userId,
         studentRecordsCount: studentRecords.length,
         scheduledFor,
      });

      // Create attendance
      const attendance = await Attendance.create({
         attendanceType,
         class: classId,
         takenBy: req.userId,
         attendanceDate: attendanceDate || new Date(),
         scheduledFor: attendanceType === 'scheduled' ? scheduledFor : undefined,
         location,
         notes,
         studentRecords,
         status: attendanceType === 'scheduled' ? 'in-progress' : 'in-progress',
      });

      console.log('Attendance created successfully:', attendance._id);

      // Add attendance to user's attendances array
      await User.findByIdAndUpdate(req.userId, {
         $push: { attendances: attendance._id },
      });

      console.log('User updated with attendance reference');

      // Populate details
      await attendance.populate('class', 'className subject');
      await attendance.populate('takenBy', 'name mobile');
      await attendance.populate('studentRecords.student', 'name mobile email profilePicture');

      res.status(201).json({
         success: true,
         message: 'Attendance created successfully',
         data: {
            attendance,
         },
      });
   } catch (error) {
      console.error('Create Attendance Error:', error);
      res.status(500).json({
         success: false,
         message: 'Failed to create attendance',
         error: process.env.NODE_ENV === 'development' ? error.message : undefined,
         stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      });
   }
};

// @desc    Get all attendances (for user or class)
// @route   GET /api/attendances
// @access  Private
export const getAttendances = async (req, res) => {
   try {
      const { classId, attendanceType, status, page = 1, limit = 10 } = req.query;

      // Build query
      const query = { takenBy: req.userId };

      if (classId) {
         query.class = classId;
      }

      if (attendanceType) {
         query.attendanceType = attendanceType;
      }

      if (status) {
         query.status = status;
      }

      // Pagination
      const skip = (parseInt(page) - 1) * parseInt(limit);

      // Get attendances
      const attendances = await Attendance.find(query)
         .populate('class', 'className subject')
         .populate('takenBy', 'name mobile')
         .sort({ attendanceDate: -1 })
         .skip(skip)
         .limit(parseInt(limit));

      const total = await Attendance.countDocuments(query);

      res.status(200).json({
         success: true,
         data: {
            attendances,
            pagination: {
               currentPage: parseInt(page),
               totalPages: Math.ceil(total / parseInt(limit)),
               totalAttendances: total,
               hasNextPage: parseInt(page) < Math.ceil(total / parseInt(limit)),
               hasPrevPage: parseInt(page) > 1,
            },
         },
      });
   } catch (error) {
      res.status(500).json({
         success: false,
         message: 'Failed to fetch attendances',
         error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
   }
};

// @desc    Get single attendance by ID
// @route   GET /api/attendances/:id
// @access  Private
export const getAttendance = async (req, res) => {
   try {
      const attendance = await Attendance.findById(req.params.id)
         .populate('class', 'className subject')
         .populate('takenBy', 'name mobile email')
         .populate('studentRecords.student', 'name mobile email profilePicture');

      if (!attendance) {
         return res.status(404).json({
            success: false,
            message: 'Attendance not found',
         });
      }

      // Check if user has access (creator or student in the attendance)
      const isCreator = attendance.takenBy._id.toString() === req.userId.toString();
      const isStudent = attendance.studentRecords.some(
         record => record.student._id.toString() === req.userId.toString()
      );

      if (!isCreator && !isStudent) {
         return res.status(403).json({
            success: false,
            message: 'Access denied',
         });
      }

      // Non-creator view: basic info + only their own record
      if (!isCreator) {
         const myRecord = attendance.studentRecords.find(
            record => record.student._id.toString() === req.userId.toString()
         );

         const basicAttendance = {
            _id: attendance._id,
            attendanceType: attendance.attendanceType,
            class: attendance.class,
            takenBy: { _id: attendance.takenBy._id, name: attendance.takenBy.name },
            attendanceDate: attendance.attendanceDate,
            startedAt: attendance.startedAt,
            finishedAt: attendance.finishedAt,
            scheduledFor: attendance.scheduledFor,
            status: attendance.status,
            notes: attendance.notes,
            totalStudents: attendance.totalStudents,
            totalPresent: attendance.totalPresent,
            totalAbsent: attendance.totalAbsent,
            totalLate: attendance.totalLate,
            totalExcused: attendance.totalExcused,
            attendancePercentage: attendance.attendancePercentage,
            duration: attendance.duration,
            studentRecords: [],
            createdAt: attendance.createdAt,
            updatedAt: attendance.updatedAt,
            myRecord: myRecord ? {
               status: myRecord.status,
               markedAt: myRecord.markedAt,
               notes: myRecord.notes,
            } : null,
         };

         return res.status(200).json({
            success: true,
            data: {
               attendance: basicAttendance,
               isCreator: false,
            },
         });
      }

      res.status(200).json({
         success: true,
         data: {
            attendance,
            isCreator: true,
         },
      });
   } catch (error) {
      res.status(500).json({
         success: false,
         message: 'Failed to fetch attendance',
         error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
   }
};

// @desc    Mark single student attendance
// @route   PUT /api/attendances/:id/mark-student
// @access  Private (Only creator)
export const markStudentAttendance = async (req, res) => {
   try {
      const { studentId, status, notes } = req.body;

      // Validate required fields
      if (!studentId || !status) {
         return res.status(400).json({
            success: false,
            message: 'Student ID and status are required',
         });
      }

      // Validate status
      const validStatuses = ['present', 'absent', 'late', 'excused'];
      if (!validStatuses.includes(status)) {
         return res.status(400).json({
            success: false,
            message: `Status must be one of: ${validStatuses.join(', ')}`,
         });
      }

      const attendance = await Attendance.findById(req.params.id);

      if (!attendance) {
         return res.status(404).json({
            success: false,
            message: 'Attendance not found',
         });
      }

      // Only creator can mark attendance
      if (attendance.takenBy.toString() !== req.userId.toString()) {
         return res.status(403).json({
            success: false,
            message: 'Only the attendance creator can mark students',
         });
      }

      // Check if attendance is completed or cancelled
      if (attendance.status !== 'in-progress') {
         return res.status(400).json({
            success: false,
            message: `Cannot mark attendance in ${attendance.status} status`,
         });
      }

      // Mark student
      attendance.markStudent(studentId, status, notes);
      await attendance.save();

      // Upsert student's attendance record in StudentAttendanceRecord collection
      try {
         await StudentAttendanceRecord.findOneAndUpdate(
            { student: studentId, attendance: attendance._id },
            {
               $set: {
                  class: attendance.class,
                  status: status,
                  markedAt: new Date(),
                  notes: notes || '',
               },
            },
            { upsert: true, new: true }
         );
      } catch (recordError) {
         console.error('Failed to update student attendance record:', recordError);
      }

      // Populate details
      await attendance.populate('class', 'className subject');
      await attendance.populate('takenBy', 'name mobile');
      await attendance.populate('studentRecords.student', 'name mobile email profilePicture');

      res.status(200).json({
         success: true,
         message: 'Student marked successfully',
         data: {
            attendance,
         },
      });
   } catch (error) {
      res.status(500).json({
         success: false,
         message: 'Failed to mark student attendance',
         error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
   }
};

// @desc    Mark multiple students attendance (bulk)
// @route   PUT /api/attendances/:id/mark-bulk
// @access  Private (Only creator)
export const markBulkAttendance = async (req, res) => {
   try {
      const { studentUpdates } = req.body;

      // Validate required fields
      if (!Array.isArray(studentUpdates) || studentUpdates.length === 0) {
         return res.status(400).json({
            success: false,
            message: 'studentUpdates array is required and must not be empty',
         });
      }

      const attendance = await Attendance.findById(req.params.id);

      if (!attendance) {
         return res.status(404).json({
            success: false,
            message: 'Attendance not found',
         });
      }

      // Only creator can mark attendance
      if (attendance.takenBy.toString() !== req.userId.toString()) {
         return res.status(403).json({
            success: false,
            message: 'Only the attendance creator can mark students',
         });
      }

      // Check if attendance is in-progress
      if (attendance.status !== 'in-progress') {
         return res.status(400).json({
            success: false,
            message: `Cannot mark attendance in ${attendance.status} status`,
         });
      }

      // Validate statuses
      const validStatuses = ['present', 'absent', 'late', 'excused'];
      for (const update of studentUpdates) {
         if (!update.studentId || !update.status) {
            return res.status(400).json({
               success: false,
               message: 'Each update must have studentId and status',
            });
         }
         if (!validStatuses.includes(update.status)) {
            return res.status(400).json({
               success: false,
               message: `Status must be one of: ${validStatuses.join(', ')}`,
            });
         }
      }

      // Mark all students
      for (const update of studentUpdates) {
         attendance.markStudent(update.studentId, update.status, update.notes || '');
      }

      await attendance.save();

      // Upsert all student attendance records in bulk (single DB call, no N+1)
      const bulkRecordOps = studentUpdates.map(update => ({
         updateOne: {
            filter: {
               student: update.studentId,
               attendance: attendance._id,
            },
            update: {
               $set: {
                  class: attendance.class,
                  status: update.status,
                  markedAt: new Date(),
                  notes: update.notes || '',
               },
            },
            upsert: true,
         },
      }));

      if (bulkRecordOps.length > 0) {
         await StudentAttendanceRecord.bulkWrite(bulkRecordOps);
      }

      // Populate details
      await attendance.populate('class', 'className subject');
      await attendance.populate('takenBy', 'name mobile');
      await attendance.populate('studentRecords.student', 'name mobile email profilePicture');

      res.status(200).json({
         success: true,
         message: `${studentUpdates.length} student(s) marked successfully`,
         data: {
            attendance,
         },
      });
   } catch (error) {
      res.status(500).json({
         success: false,
         message: 'Failed to mark bulk attendance',
         error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
   }
};

// @desc    Remove student from attendance
// @route   DELETE /api/attendances/:id/students/:studentId
// @access  Private (Only creator)
export const removeStudentFromAttendance = async (req, res) => {
   try {
      const { studentId } = req.params;

      const attendance = await Attendance.findById(req.params.id);

      if (!attendance) {
         return res.status(404).json({
            success: false,
            message: 'Attendance not found',
         });
      }

      // Only creator can remove students
      if (attendance.takenBy.toString() !== req.userId.toString()) {
         return res.status(403).json({
            success: false,
            message: 'Only the attendance creator can remove students',
         });
      }

      // Find and remove student record
      const recordIndex = attendance.studentRecords.findIndex(
         record => record.student.toString() === studentId
      );

      if (recordIndex === -1) {
         return res.status(404).json({
            success: false,
            message: 'Student not found in attendance',
         });
      }

      attendance.studentRecords.splice(recordIndex, 1);
      await attendance.save();

      // Remove student's record from StudentAttendanceRecord collection
      try {
         await StudentAttendanceRecord.deleteOne({
            student: studentId,
            attendance: attendance._id,
         });
      } catch (recordError) {
         console.error('Failed to remove student attendance record:', recordError);
      }

      // Populate details
      await attendance.populate('class', 'className subject');
      await attendance.populate('takenBy', 'name mobile');
      await attendance.populate('studentRecords.student', 'name mobile email profilePicture');

      res.status(200).json({
         success: true,
         message: 'Student removed from attendance',
         data: {
            attendance,
         },
      });
   } catch (error) {
      res.status(500).json({
         success: false,
         message: 'Failed to remove student from attendance',
         error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
   }
};

// @desc    Complete attendance
// @route   PUT /api/attendances/:id/complete
// @access  Private (Only creator)
export const completeAttendance = async (req, res) => {
   try {
      const attendance = await Attendance.findById(req.params.id);

      if (!attendance) {
         return res.status(404).json({
            success: false,
            message: 'Attendance not found',
         });
      }

      // Only creator can complete attendance
      if (attendance.takenBy.toString() !== req.userId.toString()) {
         return res.status(403).json({
            success: false,
            message: 'Only the attendance creator can complete attendance',
         });
      }

      // Check if already completed or cancelled
      if (attendance.status !== 'in-progress') {
         return res.status(400).json({
            success: false,
            message: `Attendance is already ${attendance.status}`,
         });
      }

      // Complete attendance
      attendance.complete();
      await attendance.save();

      // Batch update all students' cached stats using aggregation (single pipeline per student replaced by bulk)
      const studentIds = attendance.studentRecords.map(record => record.student);
      try {
         // Aggregate stats for all affected students at once
         const allStats = await StudentAttendanceRecord.aggregate([
            { $match: { student: { $in: studentIds } } },
            {
               $group: {
                  _id: '$student',
                  totalAttendanceSessions: { $sum: 1 },
                  totalPresent: { $sum: { $cond: [{ $eq: ['$status', 'present'] }, 1, 0] } },
                  totalAbsent: { $sum: { $cond: [{ $eq: ['$status', 'absent'] }, 1, 0] } },
                  totalLate: { $sum: { $cond: [{ $eq: ['$status', 'late'] }, 1, 0] } },
                  totalExcused: { $sum: { $cond: [{ $eq: ['$status', 'excused'] }, 1, 0] } },
               },
            },
         ]);

         // Build bulk update for User.studentStats
         const bulkStatsOps = allStats.map(s => ({
            updateOne: {
               filter: { _id: s._id },
               update: {
                  $set: {
                     'studentStats.totalAttendanceSessions': s.totalAttendanceSessions,
                     'studentStats.totalPresent': s.totalPresent,
                     'studentStats.totalAbsent': s.totalAbsent,
                     'studentStats.totalLate': s.totalLate,
                     'studentStats.totalExcused': s.totalExcused,
                     'studentStats.attendancePercentage':
                        s.totalAttendanceSessions > 0
                           ? Math.round((s.totalPresent / s.totalAttendanceSessions) * 100)
                           : 0,
                  },
               },
            },
         }));

         if (bulkStatsOps.length > 0) {
            await User.bulkWrite(bulkStatsOps);
         }
      } catch (statsError) {
         console.error('Failed to update student stats:', statsError);
      }

      // Populate details
      await attendance.populate('class', 'className subject');
      await attendance.populate('takenBy', 'name mobile');
      await attendance.populate('studentRecords.student', 'name mobile email profilePicture');

      res.status(200).json({
         success: true,
         message: 'Attendance completed successfully',
         data: {
            attendance,
            summary: attendance.getSummary(),
         },
      });
   } catch (error) {
      res.status(500).json({
         success: false,
         message: 'Failed to complete attendance',
         error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
   }
};

// @desc    Update attendance details
// @route   PUT /api/attendances/:id
// @access  Private (Only creator)
export const updateAttendance = async (req, res) => {
   try {
      const { attendanceDate, scheduledFor, location, notes, status } = req.body;

      const attendance = await Attendance.findById(req.params.id);

      if (!attendance) {
         return res.status(404).json({
            success: false,
            message: 'Attendance not found',
         });
      }

      // Only creator can update attendance
      if (attendance.takenBy.toString() !== req.userId.toString()) {
         return res.status(403).json({
            success: false,
            message: 'Only the attendance creator can update attendance',
         });
      }

      // Update fields if provided
      if (attendanceDate) attendance.attendanceDate = attendanceDate;
      if (scheduledFor && attendance.attendanceType === 'scheduled') {
         attendance.scheduledFor = scheduledFor;
      }
      if (location) attendance.location = location;
      if (notes !== undefined) attendance.notes = notes;
      if (status && ['in-progress', 'completed', 'cancelled'].includes(status)) {
         attendance.status = status;
         if (status === 'completed' && !attendance.finishedAt) {
            attendance.finishedAt = new Date();
         }
      }

      await attendance.save();

      // Populate details
      await attendance.populate('class', 'className subject');
      await attendance.populate('takenBy', 'name mobile');
      await attendance.populate('studentRecords.student', 'name mobile email profilePicture');

      res.status(200).json({
         success: true,
         message: 'Attendance updated successfully',
         data: {
            attendance,
         },
      });
   } catch (error) {
      res.status(500).json({
         success: false,
         message: 'Failed to update attendance',
         error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
   }
};

// @desc    Bulk remove students from attendance
// @route   DELETE /api/attendances/:id/students/bulk
// @access  Private (Only creator)
export const bulkRemoveStudentsFromAttendance = async (req, res) => {
   try {
      const { studentIds } = req.body;

      if (!studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
         return res.status(400).json({
            success: false,
            message: 'studentIds array is required and must not be empty',
         });
      }

      const attendance = await Attendance.findById(req.params.id);

      if (!attendance) {
         return res.status(404).json({
            success: false,
            message: 'Attendance not found',
         });
      }

      // Only creator can remove students
      if (attendance.takenBy.toString() !== req.userId.toString()) {
         return res.status(403).json({
            success: false,
            message: 'Only the attendance creator can remove students',
         });
      }

      // Only allow removal from in-progress attendance
      if (attendance.status !== 'in-progress') {
         return res.status(400).json({
            success: false,
            message: 'Can only remove students from in-progress attendance',
         });
      }

      // Filter to only students that are actually in the attendance
      const existingIds = attendance.studentRecords.map(r => r.student.toString());
      const toRemove = studentIds.filter(id => existingIds.includes(id));

      if (toRemove.length === 0) {
         return res.status(400).json({
            success: false,
            message: 'None of the specified students are in this attendance',
         });
      }

      // Remove matching student records
      attendance.studentRecords = attendance.studentRecords.filter(
         r => !toRemove.includes(r.student.toString())
      );
      await attendance.save();

      // Remove student attendance records from StudentAttendanceRecord collection
      try {
         await StudentAttendanceRecord.deleteMany({
            student: { $in: toRemove },
            attendance: attendance._id,
         });
      } catch (recordError) {
         console.error('Failed to remove student attendance records:', recordError);
      }

      // Populate details
      await attendance.populate('class', 'className subject');
      await attendance.populate('takenBy', 'name mobile');
      await attendance.populate('studentRecords.student', 'name mobile email profilePicture');

      res.status(200).json({
         success: true,
         message: `${toRemove.length} student(s) removed from attendance`,
         data: {
            attendance,
            removedCount: toRemove.length,
            skippedCount: studentIds.length - toRemove.length,
         },
      });
   } catch (error) {
      res.status(500).json({
         success: false,
         message: 'Failed to remove students from attendance',
         error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
   }
};

// @desc    Delete attendance
// @route   DELETE /api/attendances/:id
// @access  Private (Only creator)
export const deleteAttendance = async (req, res) => {
   try {
      const attendance = await Attendance.findById(req.params.id);

      if (!attendance) {
         return res.status(404).json({
            success: false,
            message: 'Attendance not found',
         });
      }

      // Only creator can delete attendance
      if (attendance.takenBy.toString() !== req.userId.toString()) {
         return res.status(403).json({
            success: false,
            message: 'Only the attendance creator can delete attendance',
         });
      }

      const attendanceId = req.params.id;

      // Delete attendance and clean up all related data in parallel
      await Promise.all([
         Attendance.findByIdAndDelete(attendanceId),
         // Remove from teacher's attendances array
         User.findByIdAndUpdate(req.userId, {
            $pull: { attendances: attendanceId },
         }),
         // Remove all student attendance records for this attendance
         StudentAttendanceRecord.deleteMany({ attendance: attendanceId }),
      ]);

      res.status(200).json({
         success: true,
         message: 'Attendance deleted successfully',
      });
   } catch (error) {
      res.status(500).json({
         success: false,
         message: 'Failed to delete attendance',
         error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
   }
};

// @desc    Get attendance summary/statistics
// @route   GET /api/attendances/:id/summary
// @access  Private
export const getAttendanceSummary = async (req, res) => {
   try {
      const attendance = await Attendance.findById(req.params.id)
         .populate('class', 'className subject')
         .populate('takenBy', 'name mobile');

      if (!attendance) {
         return res.status(404).json({
            success: false,
            message: 'Attendance not found',
         });
      }

      // Check if user has access
      const isCreator = attendance.takenBy._id.toString() === req.userId.toString();
      const isStudent = attendance.studentRecords.some(
         record => record.student.toString() === req.userId.toString()
      );

      if (!isCreator && !isStudent) {
         return res.status(403).json({
            success: false,
            message: 'Access denied',
         });
      }

      res.status(200).json({
         success: true,
         data: {
            summary: attendance.getSummary(),
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

// @desc    Get student's own attendance history
// @route   GET /api/attendances/my-attendances
// @access  Private (Student)
export const getMyAttendances = async (req, res) => {
   try {
      const { classId, page = 1, limit = 10 } = req.query;

      // Build query to find attendances where current user is a student
      const query = {
         'studentRecords.student': req.userId,
         status: 'completed', // Only show completed attendances
      };

      if (classId) {
         query.class = classId;
      }

      // Pagination
      const skip = (parseInt(page) - 1) * parseInt(limit);

      // Get attendances
      const attendances = await Attendance.find(query)
         .populate('class', 'className subject')
         .populate('takenBy', 'name mobile')
         .sort({ attendanceDate: -1 })
         .skip(skip)
         .limit(parseInt(limit));

      // Filter student records to only show current user's status
      const formattedAttendances = attendances.map(attendance => {
         const studentRecord = attendance.studentRecords.find(
            record => record.student.toString() === req.userId.toString()
         );

         return {
            _id: attendance._id,
            attendanceType: attendance.attendanceType,
            class: attendance.class,
            takenBy: attendance.takenBy,
            attendanceDate: attendance.attendanceDate,
            myStatus: studentRecord ? studentRecord.status : 'absent',
            markedAt: studentRecord ? studentRecord.markedAt : null,
            notes: studentRecord ? studentRecord.notes : null,
            totalStudents: attendance.totalStudents,
            totalPresent: attendance.totalPresent,
         };
      });

      const total = await Attendance.countDocuments(query);

      // Get cached user stats (no expensive recalculation on reads)
      const user = await User.findById(req.userId).select('studentStats').lean();

      res.status(200).json({
         success: true,
         data: {
            attendances: formattedAttendances,
            statistics: user?.studentStats || {},
            pagination: {
               currentPage: parseInt(page),
               totalPages: Math.ceil(total / parseInt(limit)),
               totalAttendances: total,
               hasNextPage: parseInt(page) < Math.ceil(total / parseInt(limit)),
               hasPrevPage: parseInt(page) > 1,
            },
         },
      });
   } catch (error) {
      console.error('Get My Attendances Error:', error);
      res.status(500).json({
         success: false,
         message: 'Failed to fetch your attendances',
         error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
   }
};

// @desc    Get student's attendance statistics
// @route   GET /api/attendances/my-stats
// @access  Private (Student)
export const getMyAttendanceStats = async (req, res) => {
   try {
      const user = await User.findById(req.userId);

      if (!user) {
         return res.status(404).json({
            success: false,
            message: 'User not found',
         });
      }

      // Update statistics
      const stats = await user.updateAttendanceStats();

      // Get classes enrolled (fix: use dot notation for subdocument field)
      const classes = await Class.find({ 'students.student': req.userId })
         .select('className subject createdBy')
         .populate('createdBy', 'name mobile');

      res.status(200).json({
         success: true,
         data: {
            statistics: stats,
            classesEnrolled: classes,
         },
      });
   } catch (error) {
      console.error('Get My Stats Error:', error);
      res.status(500).json({
         success: false,
         message: 'Failed to fetch your statistics',
         error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
   }
};
