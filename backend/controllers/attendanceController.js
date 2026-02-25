import Attendance from '../models/Attendance.js';
import Class from '../models/Class.js';
import User from '../models/User.js';

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

      // Validate scheduled attendance has scheduledFor date
      if (attendanceType === 'scheduled' && !scheduledFor) {
         return res.status(400).json({
            success: false,
            message: 'Scheduled attendance requires a scheduledFor date',
         });
      }

      // Get all students from the class
      const studentRecords = classData.students.map(studentId => ({
         student: studentId,
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
      await attendance.populate('studentRecords.student', 'name mobile');

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
         .populate('studentRecords.student', 'name mobile email');

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

      res.status(200).json({
         success: true,
         data: {
            attendance,
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

      // Update student's attendance record
      try {
         const existingRecord = await User.findOne({
            _id: studentId,
            'myAttendanceRecords.attendance': attendance._id
         });

         if (existingRecord) {
            // Update existing record
            await User.updateOne(
               {
                  _id: studentId,
                  'myAttendanceRecords.attendance': attendance._id
               },
               {
                  $set: {
                     'myAttendanceRecords.$.status': status,
                     'myAttendanceRecords.$.markedAt': new Date(),
                     'myAttendanceRecords.$.notes': notes || '',
                  }
               }
            );
         } else {
            // Add new record
            await User.findByIdAndUpdate(studentId, {
               $push: {
                  myAttendanceRecords: {
                     attendance: attendance._id,
                     class: attendance.class,
                     status: status,
                     markedAt: new Date(),
                     notes: notes || '',
                  }
               }
            });
         }
      } catch (recordError) {
         console.error('Failed to update student attendance record:', recordError);
         // Don't fail the request if record update fails
      }

      // Update student's attendance statistics if attendance is completed
      if (attendance.status === 'completed') {
         try {
            const student = await User.findById(studentId);
            if (student) {
               await student.updateAttendanceStats();
            }
         } catch (statsError) {
            console.error('Failed to update student stats:', statsError);
            // Don't fail the request if stats update fails
         }
      }

      // Populate details
      await attendance.populate('class', 'className subject');
      await attendance.populate('takenBy', 'name mobile');
      await attendance.populate('studentRecords.student', 'name mobile');

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

      // Update all students' attendance records
      const bulkUserOps = [];

      for (const update of studentUpdates) {
         // Check if record already exists
         const existingUser = await User.findOne({
            _id: update.studentId,
            'myAttendanceRecords.attendance': attendance._id
         });

         if (existingUser) {
            // Update existing record
            bulkUserOps.push({
               updateOne: {
                  filter: {
                     _id: update.studentId,
                     'myAttendanceRecords.attendance': attendance._id
                  },
                  update: {
                     $set: {
                        'myAttendanceRecords.$.status': update.status,
                        'myAttendanceRecords.$.markedAt': new Date(),
                        'myAttendanceRecords.$.notes': update.notes || '',
                     }
                  }
               }
            });
         } else {
            // Add new record
            bulkUserOps.push({
               updateOne: {
                  filter: { _id: update.studentId },
                  update: {
                     $push: {
                        myAttendanceRecords: {
                           attendance: attendance._id,
                           class: attendance.class,
                           status: update.status,
                           markedAt: new Date(),
                           notes: update.notes || '',
                        }
                     }
                  }
               }
            });
         }
      }

      if (bulkUserOps.length > 0) {
         await User.bulkWrite(bulkUserOps);
      }

      // Populate details
      await attendance.populate('class', 'className subject');
      await attendance.populate('takenBy', 'name mobile');
      await attendance.populate('studentRecords.student', 'name mobile');

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

      // Remove attendance record from student's myAttendanceRecords
      try {
         await User.findByIdAndUpdate(studentId, {
            $pull: {
               myAttendanceRecords: {
                  attendance: attendance._id
               }
            }
         });
      } catch (recordError) {
         console.error('Failed to remove student attendance record:', recordError);
         // Don't fail the request if record removal fails
      }

      // Populate details
      await attendance.populate('class', 'className subject');
      await attendance.populate('takenBy', 'name mobile');
      await attendance.populate('studentRecords.student', 'name mobile');

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

      // Update all students' attendance statistics
      const studentIds = attendance.studentRecords.map(record => record.student);
      try {
         for (const studentId of studentIds) {
            const student = await User.findById(studentId);
            if (student) {
               await student.updateAttendanceStats();
            }
         }
      } catch (statsError) {
         console.error('Failed to update student stats:', statsError);
         // Don't fail the request if stats update fails
      }

      // Populate details
      await attendance.populate('class', 'className subject');
      await attendance.populate('takenBy', 'name mobile');
      await attendance.populate('studentRecords.student', 'name mobile');

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
      await attendance.populate('studentRecords.student', 'name mobile');

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

      await Attendance.findByIdAndDelete(req.params.id);

      // Remove from user's attendances array
      await User.findByIdAndUpdate(req.userId, {
         $pull: { attendances: req.params.id },
      });

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

      // Get user's statistics
      const user = await User.findById(req.userId);
      await user.updateAttendanceStats(); // Ensure stats are up to date

      res.status(200).json({
         success: true,
         data: {
            attendances: formattedAttendances,
            statistics: user.studentStats,
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

      // Get classes enrolled
      const classes = await Class.find({ students: req.userId })
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
