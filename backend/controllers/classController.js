import mongoose from 'mongoose';
import Class from '../models/Class.js';
import User from '../models/User.js';
import Attendance from '../models/Attendance.js';
import StudentAttendanceRecord from '../models/StudentAttendanceRecord.js';

// @desc    Create a new class
// @route   POST /api/classes
// @access  Private
export const createClass = async (req, res) => {
   try {
      const { className, subject } = req.body;

      // Validate required fields
      if (!className || !subject) {
         return res.status(400).json({
            success: false,
            message: 'Class name and subject are required',
         });
      }

      // Create new class
      const newClass = await Class.create({
         className,
         subject,
         createdBy: req.userId,
         students: [],
      });

      // Populate creator details
      await newClass.populate('createdBy', 'name email mobile profilePicture');

      res.status(201).json({
         success: true,
         message: 'Class created successfully',
         data: {
            class: newClass,
         },
      });
   } catch (error) {
      res.status(500).json({
         success: false,
         message: 'Failed to create class',
         error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
   }
};

// @desc    Get all classes (created by user or enrolled in)
// @route   GET /api/classes
// @access  Private
export const getClasses = async (req, res) => {
   try {
      const { page = 1, limit = 20 } = req.query;
      const skip = (parseInt(page) - 1) * parseInt(limit);
      const userId = new mongoose.Types.ObjectId(req.userId);

      const query = {
         $or: [
            { createdBy: userId },
            { 'students.student': userId },
         ],
      };

      // Count + paginated fetch in parallel (no full student populate on list)
      const [total, classes] = await Promise.all([
         Class.countDocuments(query),
         Class.find(query)
            .select('className subject createdBy students createdAt updatedAt')
            .populate('createdBy', 'name email mobile profilePicture')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit))
            .lean(),
      ]);

      // Add computed counts without populating every student
      const classesWithCounts = classes.map(cls => {
         const students = cls.students || [];
         const acceptedCount = students.filter(s => s.status === 'accepted').length;
         const pendingCount = students.filter(s => s.status === 'pending').length;
         const requestedCount = students.filter(s => s.status === 'requested').length;
         // Remove full students array from list response
         const { students: _, ...classData } = cls;
         return {
            ...classData,
            studentCount: students.length,
            acceptedCount,
            pendingCount,
            requestedCount,
         };
      });

      res.status(200).json({
         success: true,
         data: {
            classes: classesWithCounts,
            count: total,
            pagination: {
               currentPage: parseInt(page),
               totalPages: Math.ceil(total / parseInt(limit)),
               totalClasses: total,
               hasNextPage: parseInt(page) < Math.ceil(total / parseInt(limit)),
               hasPrevPage: parseInt(page) > 1,
            },
         },
      });
   } catch (error) {
      res.status(500).json({
         success: false,
         message: 'Failed to fetch classes',
         error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
   }
};

// @desc    Get single class by ID
// @route   GET /api/classes/:id
// @access  Private
export const getClass = async (req, res) => {
   try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const skip = (page - 1) * limit;
      const classId = new mongoose.Types.ObjectId(req.params.id);
      const userId = new mongoose.Types.ObjectId(req.userId);

      // Use aggregation to get class with sliced students + counts in one query
      const [result] = await Class.aggregate([
         { $match: { _id: classId } },
         {
            $addFields: {
               studentCount: { $size: '$students' },
               acceptedCount: {
                  $size: {
                     $filter: {
                        input: '$students',
                        as: 's',
                        cond: { $eq: ['$$s.status', 'accepted'] },
                     },
                  },
               },
               pendingCount: {
                  $size: {
                     $filter: {
                        input: '$students',
                        as: 's',
                        cond: { $eq: ['$$s.status', 'pending'] },
                     },
                  },
               },
               requestedCount: {
                  $size: {
                     $filter: {
                        input: '$students',
                        as: 's',
                        cond: { $eq: ['$$s.status', 'requested'] },
                     },
                  },
               },
               paginatedStudents: { $slice: ['$students', skip, limit] },
            },
         },
         {
            $project: {
               className: 1,
               subject: 1,
               createdBy: 1,
               createdAt: 1,
               updatedAt: 1,
               studentCount: 1,
               acceptedCount: 1,
               pendingCount: 1,
               requestedCount: 1,
               paginatedStudents: 1,
            },
         },
      ]);

      if (!result) {
         return res.status(404).json({
            success: false,
            message: 'Class not found',
         });
      }

      // Populate createdBy
      await Class.populate(result, {
         path: 'createdBy',
         select: 'name email mobile profilePicture',
      });

      // Check access
      const isCreator = result.createdBy._id.toString() === req.userId.toString();
      const isStudent = await Class.exists({
         _id: classId,
         'students.student': userId,
      });

      if (!isCreator && !isStudent) {
         return res.status(403).json({
            success: false,
            message: 'Access denied',
         });
      }

      // Non-creator view: return class info + active attendance sessions
      if (!isCreator) {
         const classResponse = {
            _id: result._id,
            className: result.className,
            subject: result.subject,
            createdBy: result.createdBy,
            createdAt: result.createdAt,
            updatedAt: result.updatedAt,
         };

         // Fetch active (in-progress / scheduled) attendance sessions for this class
         const attendancePage = parseInt(req.query.attendancePage) || 1;
         const attendanceLimit = parseInt(req.query.attendanceLimit) || 10;
         const skip = (attendancePage - 1) * attendanceLimit;

         const [activeAttendances, totalActiveAttendances] = await Promise.all([
            Attendance.find({
               class: classId,
               status: 'in-progress',
            })
               .sort({ scheduledFor: 1, createdAt: -1 })
               .skip(skip)
               .limit(attendanceLimit)
               .populate('takenBy', 'name')
               .select('attendanceType attendanceDate scheduledFor status takenBy location notes studentRecords createdAt')
               .lean(),
            Attendance.countDocuments({
               class: classId,
               status: 'in-progress',
            }),
         ]);

         // Extract only the current student's record from each attendance
         const attendancesWithMyStatus = activeAttendances.map(att => {
            const myRecord = att.studentRecords?.find(
               r => r.student.toString() === userId.toString()
            );
            return {
               _id: att._id,
               attendanceType: att.attendanceType,
               attendanceDate: att.attendanceDate,
               scheduledFor: att.scheduledFor,
               status: att.status,
               takenBy: att.takenBy,
               location: att.location,
               notes: att.notes,
               myStatus: myRecord?.status || null,
               markedAt: myRecord?.markedAt || null,
               createdAt: att.createdAt,
            };
         });

         const attendancePagination = {
            currentPage: attendancePage,
            totalPages: Math.ceil(totalActiveAttendances / attendanceLimit),
            totalAttendances: totalActiveAttendances,
            hasNextPage: attendancePage < Math.ceil(totalActiveAttendances / attendanceLimit),
            hasPrevPage: attendancePage > 1,
         };

         return res.status(200).json({
            success: true,
            data: {
               class: classResponse,
               isCreator: false,
               activeAttendances: attendancesWithMyStatus,
               attendancePagination,
            },
         });
      }

      // Creator view: full details with students, counts, and pagination
      const studentIds = result.paginatedStudents.map(s => s.student);
      const studentUsers = await User.find({ _id: { $in: studentIds } })
         .select('name email mobile profilePicture')
         .lean();

      const studentsWithStatus = result.paginatedStudents.map(entry => {
         const userData = studentUsers.find(u => u._id.toString() === entry.student.toString());
         return {
            ...userData,
            enrollmentStatus: entry.status,
            enrolledAt: entry.enrolledAt,
         };
      });

      const classResponse = {
         _id: result._id,
         className: result.className,
         subject: result.subject,
         createdBy: result.createdBy,
         createdAt: result.createdAt,
         updatedAt: result.updatedAt,
         studentCount: result.studentCount,
         acceptedCount: result.acceptedCount,
         pendingCount: result.pendingCount,
         requestedCount: result.requestedCount,
         students: studentsWithStatus,
      };

      const paginationInfo = {
         currentPage: page,
         totalPages: Math.ceil(result.studentCount / limit),
         totalStudents: result.studentCount,
         studentsPerPage: limit,
         hasNextPage: page < Math.ceil(result.studentCount / limit),
         hasPrevPage: page > 1,
      };

      res.status(200).json({
         success: true,
         data: {
            class: classResponse,
            isCreator: true,
            pagination: paginationInfo,
         },
      });
   } catch (error) {
      res.status(500).json({
         success: false,
         message: 'Failed to fetch class',
         error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
   }
};

// @desc    Update class (name and subject)
// @route   PUT /api/classes/:id
// @access  Private (Only creator)
export const updateClass = async (req, res) => {
   try {
      const { className, subject } = req.body;

      const classData = await Class.findById(req.params.id);

      if (!classData) {
         return res.status(404).json({
            success: false,
            message: 'Class not found',
         });
      }

      // Only creator can update class details
      if (classData.createdBy.toString() !== req.userId.toString()) {
         return res.status(403).json({
            success: false,
            message: 'Only the creator can update class details',
         });
      }

      // Update fields if provided
      if (className) classData.className = className;
      if (subject) classData.subject = subject;

      await classData.save();

      // Populate details for response
      await classData.populate('createdBy', 'name email mobile profilePicture');
      await classData.populate('students.student', 'name email mobile profilePicture');

      res.status(200).json({
         success: true,
         message: 'Class updated successfully',
         data: {
            class: classData,
         },
      });
   } catch (error) {
      res.status(500).json({
         success: false,
         message: 'Failed to update class',
         error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
   }
};

// @desc    Add student to class (teacher invites, status = pending)
// @route   POST /api/classes/:id/students
// @access  Private (Only creator)
export const addStudent = async (req, res) => {
   try {
      const { studentId } = req.body;

      if (!studentId) {
         return res.status(400).json({
            success: false,
            message: 'Student ID is required',
         });
      }

      // Verify student exists
      const student = await User.findById(studentId);
      if (!student) {
         return res.status(404).json({
            success: false,
            message: 'Student not found',
         });
      }

      const classData = await Class.findById(req.params.id);

      if (!classData) {
         return res.status(404).json({
            success: false,
            message: 'Class not found',
         });
      }

      // Only creator can add students
      if (classData.createdBy.toString() !== req.userId.toString()) {
         return res.status(403).json({
            success: false,
            message: 'Only the creator can add students',
         });
      }

      // Block adding students when any in-progress attendance exists
      const hasInProgress = await Attendance.exists({
         class: req.params.id,
         status: 'in-progress',
      });
      if (hasInProgress) {
         return res.status(400).json({
            success: false,
            message: 'Cannot add students while an attendance session is in progress. Please complete or cancel the active attendance first.',
         });
      }

      // Check if student already exists in class (any status)
      const existingEntry = classData.students.find(
         s => s.student.toString() === studentId
      );
      if (existingEntry) {
         return res.status(400).json({
            success: false,
            message: `Student already ${existingEntry.status} in this class`,
         });
      }

      // Add student with pending status
      classData.students.push({
         student: studentId,
         status: 'pending',
      });
      await classData.save();

      // Add class to student's enrolledClasses so they can see the invite
      await User.findByIdAndUpdate(studentId, {
         $addToSet: { enrolledClasses: classData._id },
      });

      // Populate details for response
      await classData.populate('createdBy', 'name email mobile profilePicture');
      await classData.populate('students.student', 'name email mobile profilePicture');

      res.status(200).json({
         success: true,
         message: 'Student invited successfully (pending acceptance)',
         data: {
            class: classData,
         },
      });
   } catch (error) {
      res.status(500).json({
         success: false,
         message: 'Failed to add student',
         error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
   }
};

// @desc    Remove student from class
// @route   DELETE /api/classes/:id/students/:studentId
// @access  Private (Only creator)
export const removeStudent = async (req, res) => {
   try {
      const { studentId } = req.params;

      const classData = await Class.findById(req.params.id);

      if (!classData) {
         return res.status(404).json({
            success: false,
            message: 'Class not found',
         });
      }

      // Only creator can remove students
      if (classData.createdBy.toString() !== req.userId.toString()) {
         return res.status(403).json({
            success: false,
            message: 'Only the creator can remove students',
         });
      }

      // Check if student is in class
      const studentEntry = classData.students.find(
         s => s.student.toString() === studentId
      );
      if (!studentEntry) {
         return res.status(404).json({
            success: false,
            message: 'Student not found in this class',
         });
      }

      // Remove student subdocument using $pull
      await Class.findByIdAndUpdate(req.params.id, {
         $pull: { students: { student: studentId } },
      });

      // Remove class from student's enrolled classes
      await User.findByIdAndUpdate(studentId, {
         $pull: { enrolledClasses: classData._id },
      });

      // Fetch updated class with populated fields
      const updatedClass = await Class.findById(req.params.id)
         .populate('createdBy', 'name email mobile profilePicture')
         .populate('students.student', 'name email mobile profilePicture');

      res.status(200).json({
         success: true,
         message: 'Student removed successfully',
         data: {
            class: updatedClass,
         },
      });
   } catch (error) {
      res.status(500).json({
         success: false,
         message: 'Failed to remove student',
         error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
   }
};

// @desc    Add multiple students to class in one request
// @route   POST /api/classes/:id/students/bulk
// @access  Private (Only creator)
export const bulkAddStudents = async (req, res) => {
   try {
      const { studentIds } = req.body;

      if (!studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
         return res.status(400).json({
            success: false,
            message: 'studentIds array is required and must not be empty',
         });
      }

      const classData = await Class.findById(req.params.id);

      if (!classData) {
         return res.status(404).json({
            success: false,
            message: 'Class not found',
         });
      }

      // Only creator can add students
      if (classData.createdBy.toString() !== req.userId.toString()) {
         return res.status(403).json({
            success: false,
            message: 'Only the creator can add students',
         });
      }

      // Verify all students exist
      const students = await User.find({ _id: { $in: studentIds } });
      const foundIds = students.map(s => s._id.toString());
      const notFound = studentIds.filter(id => !foundIds.includes(id));

      if (notFound.length > 0) {
         return res.status(404).json({
            success: false,
            message: `Students not found: ${notFound.join(', ')}`,
         });
      }

      // Block adding students when any in-progress attendance exists
      const hasInProgress = await Attendance.exists({
         class: req.params.id,
         status: 'in-progress',
      });
      if (hasInProgress) {
         return res.status(400).json({
            success: false,
            message: 'Cannot add students while an attendance session is in progress. Please complete or cancel the active attendance first.',
         });
      }

      // Filter out already enrolled students (any status)
      const existingStudentIds = classData.students.map(s => s.student.toString());
      const newStudentIds = studentIds.filter(id => !existingStudentIds.includes(id));

      if (newStudentIds.length === 0) {
         return res.status(400).json({
            success: false,
            message: 'All students are already enrolled in this class',
         });
      }

      // Add all new students with pending status
      const newEntries = newStudentIds.map(id => ({
         student: id,
         status: 'pending',
      }));
      classData.students.push(...newEntries);
      await classData.save();

      // Add class to each student's enrolledClasses so they can see the invite
      await User.updateMany(
         { _id: { $in: newStudentIds } },
         { $addToSet: { enrolledClasses: classData._id } }
      );

      // Populate details for response
      await classData.populate('createdBy', 'name email mobile profilePicture');
      await classData.populate('students.student', 'name email mobile profilePicture');

      res.status(200).json({
         success: true,
         message: `${newStudentIds.length} student${newStudentIds.length > 1 ? 's' : ''} invited successfully (pending acceptance)`,
         data: {
            class: classData,
            addedCount: newStudentIds.length,
            skippedCount: studentIds.length - newStudentIds.length,
         },
      });
   } catch (error) {
      res.status(500).json({
         success: false,
         message: 'Failed to add students',
         error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
   }
};

// @desc    Remove multiple students from class in one request
// @route   DELETE /api/classes/:id/students/bulk
// @access  Private (Only creator)
export const bulkRemoveStudents = async (req, res) => {
   try {
      const { studentIds } = req.body;

      if (!studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
         return res.status(400).json({
            success: false,
            message: 'studentIds array is required and must not be empty',
         });
      }

      const classData = await Class.findById(req.params.id);

      if (!classData) {
         return res.status(404).json({
            success: false,
            message: 'Class not found',
         });
      }

      // Only creator can remove students
      if (classData.createdBy.toString() !== req.userId.toString()) {
         return res.status(403).json({
            success: false,
            message: 'Only the creator can remove students',
         });
      }

      // Filter to only students that are actually in the class
      const existingStudentIds = classData.students.map(s => s.student.toString());
      const toRemove = studentIds.filter(id => existingStudentIds.includes(id));

      if (toRemove.length === 0) {
         return res.status(400).json({
            success: false,
            message: 'None of the specified students are enrolled in this class',
         });
      }

      // Remove student subdocuments using $pull (single DB operation)
      await Class.findByIdAndUpdate(req.params.id, {
         $pull: { students: { student: { $in: toRemove } } },
      });

      // Remove class from all students' enrolledClasses (single DB operation)
      await User.updateMany(
         { _id: { $in: toRemove } },
         { $pull: { enrolledClasses: classData._id } }
      );

      // Fetch updated class with populated fields
      const updatedClass = await Class.findById(req.params.id)
         .populate('createdBy', 'name email mobile profilePicture')
         .populate('students.student', 'name email mobile profilePicture');

      res.status(200).json({
         success: true,
         message: `${toRemove.length} student${toRemove.length > 1 ? 's' : ''} removed successfully`,
         data: {
            class: updatedClass,
            removedCount: toRemove.length,
            skippedCount: studentIds.length - toRemove.length,
         },
      });
   } catch (error) {
      res.status(500).json({
         success: false,
         message: 'Failed to remove students',
         error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
   }
};

// @desc    Accept enrollment invitation
// @route   PUT /api/classes/:id/students/:studentId/accept
// @access  Private (Only the invited student)
export const acceptEnrollment = async (req, res) => {
   try {
      const { id: classId, studentId } = req.params;

      // Only the student themselves can accept
      if (studentId !== req.userId.toString()) {
         return res.status(403).json({
            success: false,
            message: 'You can only accept your own enrollment invitation',
         });
      }

      const classData = await Class.findById(classId);
      if (!classData) {
         return res.status(404).json({
            success: false,
            message: 'Class not found',
         });
      }

      const studentEntry = classData.students.find(
         s => s.student.toString() === studentId
      );

      if (!studentEntry) {
         return res.status(404).json({
            success: false,
            message: 'You are not invited to this class',
         });
      }

      if (studentEntry.status === 'accepted') {
         return res.status(400).json({
            success: false,
            message: 'You have already accepted this enrollment',
         });
      }

      // Only teacher-invited students can self-accept (status must be 'pending', not 'requested')
      if (studentEntry.status === 'requested') {
         return res.status(400).json({
            success: false,
            message: 'Your join request is awaiting teacher approval. Only the teacher can approve it.',
         });
      }

      // Update status to accepted
      studentEntry.status = 'accepted';
      studentEntry.enrolledAt = new Date();
      await classData.save();

      res.status(200).json({
         success: true,
         message: 'Enrollment accepted successfully',
         data: {
            classId,
            status: 'accepted',
         },
      });
   } catch (error) {
      res.status(500).json({
         success: false,
         message: 'Failed to accept enrollment',
         error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
   }
};

// @desc    Reject enrollment invitation
// @route   PUT /api/classes/:id/students/:studentId/reject
// @access  Private (Only the invited student)
export const rejectEnrollment = async (req, res) => {
   try {
      const { id: classId, studentId } = req.params;

      // Only the student themselves can reject
      if (studentId !== req.userId.toString()) {
         return res.status(403).json({
            success: false,
            message: 'You can only reject your own enrollment invitation',
         });
      }

      const classData = await Class.findById(classId);
      if (!classData) {
         return res.status(404).json({
            success: false,
            message: 'Class not found',
         });
      }

      const studentEntry = classData.students.find(
         s => s.student.toString() === studentId
      );

      if (!studentEntry) {
         return res.status(404).json({
            success: false,
            message: 'You are not invited to this class',
         });
      }

      // Remove student from class
      await Class.findByIdAndUpdate(classId, {
         $pull: { students: { student: studentId } },
      });

      // Remove class from student's enrolledClasses
      await User.findByIdAndUpdate(studentId, {
         $pull: { enrolledClasses: classId },
      });

      res.status(200).json({
         success: true,
         message: 'Enrollment rejected successfully',
         data: {
            classId,
            status: 'rejected',
         },
      });
   } catch (error) {
      res.status(500).json({
         success: false,
         message: 'Failed to reject enrollment',
         error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
   }
};

// @desc    Delete class
// @route   DELETE /api/classes/:id
// @access  Private (Only creator)
export const deleteClass = async (req, res) => {
   try {
      const classData = await Class.findById(req.params.id);

      if (!classData) {
         return res.status(404).json({
            success: false,
            message: 'Class not found',
         });
      }

      // Only creator can delete class
      if (classData.createdBy.toString() !== req.userId.toString()) {
         return res.status(403).json({
            success: false,
            message: 'Only the creator can delete this class',
         });
      }

      const classId = classData._id;
      const studentIds = classData.students.map(s => s.student);

      // Delete class and clean up all orphaned references in parallel
      await Promise.all([
         Class.findByIdAndDelete(classId),
         // Remove class from all students' enrolledClasses
         studentIds.length > 0
            ? User.updateMany(
               { _id: { $in: studentIds } },
               { $pull: { enrolledClasses: classId } }
            )
            : Promise.resolve(),
         // Delete all attendances for this class
         Attendance.deleteMany({ class: classId }),
         // Delete all student attendance records for this class
         StudentAttendanceRecord.deleteMany({ class: classId }),
      ]);

      res.status(200).json({
         success: true,
         message: 'Class deleted successfully',
      });
   } catch (error) {
      res.status(500).json({
         success: false,
         message: 'Failed to delete class',
         error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
   }
};

// @desc    Student requests to join a class via QR code
// @route   POST /api/classes/:id/request-join
// @access  Private (Students only)
export const requestJoinClass = async (req, res) => {
   try {
      const classId = req.params.id;

      // Verify the requesting user is a student
      const user = await User.findById(req.userId).select('role');
      if (!user || user.role !== 'student') {
         return res.status(403).json({
            success: false,
            message: 'Only students can request to join a class',
         });
      }

      const classData = await Class.findById(classId).select('className subject createdBy students');
      if (!classData) {
         return res.status(404).json({
            success: false,
            message: 'Class not found',
         });
      }

      // Cannot join own class
      if (classData.createdBy.toString() === req.userId.toString()) {
         return res.status(400).json({
            success: false,
            message: 'You cannot join a class you created',
         });
      }

      // Check if student already exists in class (any status)
      const existingEntry = classData.students.find(
         s => s.student.toString() === req.userId.toString()
      );
      if (existingEntry) {
         const statusMessages = {
            pending: 'You have already been invited to this class. Check your enrolled classes to accept.',
            requested: 'You have already requested to join this class. Waiting for teacher approval.',
            accepted: 'You are already enrolled in this class.',
         };
         return res.status(400).json({
            success: false,
            message: statusMessages[existingEntry.status] || 'You are already associated with this class.',
         });
      }

      // Check student limit
      if (classData.students.length >= 100) {
         return res.status(400).json({
            success: false,
            message: 'This class has reached the maximum student limit (100)',
         });
      }

      // Add student with 'requested' status
      classData.students.push({
         student: req.userId,
         status: 'requested',
      });
      await classData.save();

      // Add class to student's enrolledClasses so they can see the request status
      await User.findByIdAndUpdate(req.userId, {
         $addToSet: { enrolledClasses: classData._id },
      });

      res.status(200).json({
         success: true,
         message: 'Join request sent successfully. Waiting for teacher approval.',
         data: {
            classId: classData._id,
            className: classData.className,
            subject: classData.subject,
            status: 'requested',
         },
      });
   } catch (error) {
      res.status(500).json({
         success: false,
         message: 'Failed to request to join class',
         error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
   }
};

// @desc    Teacher approves a student's join request
// @route   PUT /api/classes/:id/students/:studentId/approve
// @access  Private (Only class creator)
export const approveJoinRequest = async (req, res) => {
   try {
      const { id: classId, studentId } = req.params;

      const classData = await Class.findById(classId);
      if (!classData) {
         return res.status(404).json({
            success: false,
            message: 'Class not found',
         });
      }

      // Only creator can approve
      if (classData.createdBy.toString() !== req.userId.toString()) {
         return res.status(403).json({
            success: false,
            message: 'Only the class creator can approve join requests',
         });
      }

      const studentEntry = classData.students.find(
         s => s.student.toString() === studentId
      );

      if (!studentEntry) {
         return res.status(404).json({
            success: false,
            message: 'Student not found in this class',
         });
      }

      if (studentEntry.status !== 'requested') {
         return res.status(400).json({
            success: false,
            message: studentEntry.status === 'accepted'
               ? 'This student is already accepted'
               : 'This student was invited, not requested. They need to accept the invitation themselves.',
         });
      }

      // Approve: set status to accepted
      studentEntry.status = 'accepted';
      studentEntry.enrolledAt = new Date();
      await classData.save();

      res.status(200).json({
         success: true,
         message: 'Join request approved successfully',
         data: {
            classId,
            studentId,
            status: 'accepted',
         },
      });
   } catch (error) {
      res.status(500).json({
         success: false,
         message: 'Failed to approve join request',
         error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
   }
};

// @desc    Teacher denies a student's join request
// @route   PUT /api/classes/:id/students/:studentId/deny
// @access  Private (Only class creator)
export const denyJoinRequest = async (req, res) => {
   try {
      const { id: classId, studentId } = req.params;

      const classData = await Class.findById(classId);
      if (!classData) {
         return res.status(404).json({
            success: false,
            message: 'Class not found',
         });
      }

      // Only creator can deny
      if (classData.createdBy.toString() !== req.userId.toString()) {
         return res.status(403).json({
            success: false,
            message: 'Only the class creator can deny join requests',
         });
      }

      const studentEntry = classData.students.find(
         s => s.student.toString() === studentId
      );

      if (!studentEntry) {
         return res.status(404).json({
            success: false,
            message: 'Student not found in this class',
         });
      }

      if (studentEntry.status !== 'requested') {
         return res.status(400).json({
            success: false,
            message: studentEntry.status === 'accepted'
               ? 'Cannot deny an already accepted student. Remove them instead.'
               : 'This student was invited, not requested. Use remove instead.',
         });
      }

      // Remove student from class
      await Class.findByIdAndUpdate(classId, {
         $pull: { students: { student: studentId } },
      });

      // Remove class from student's enrolledClasses
      await User.findByIdAndUpdate(studentId, {
         $pull: { enrolledClasses: classId },
      });

      res.status(200).json({
         success: true,
         message: 'Join request denied',
         data: {
            classId,
            studentId,
            status: 'denied',
         },
      });
   } catch (error) {
      res.status(500).json({
         success: false,
         message: 'Failed to deny join request',
         error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
   }
};

// @desc    Get all pending join requests across teacher's classes
// @route   GET /api/classes/join-requests
// @access  Private (Teachers only)
export const getPendingJoinRequests = async (req, res) => {
   try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;
      const skip = (page - 1) * limit;
      const userId = new mongoose.Types.ObjectId(req.userId);

      const pipeline = [
         // Match classes created by this teacher that have requested students
         { $match: { createdBy: userId } },
         { $unwind: '$students' },
         { $match: { 'students.status': 'requested' } },
         {
            $facet: {
               metadata: [{ $count: 'totalRequests' }],
               requests: [
                  { $sort: { 'students._id': -1 } },
                  { $skip: skip },
                  { $limit: limit },
                  {
                     $lookup: {
                        from: 'users',
                        localField: 'students.student',
                        foreignField: '_id',
                        as: 'studentInfo',
                        pipeline: [
                           { $project: { name: 1, email: 1, mobile: 1, profilePicture: 1 } },
                        ],
                     },
                  },
                  {
                     $project: {
                        classId: '$_id',
                        className: 1,
                        subject: 1,
                        student: { $arrayElemAt: ['$studentInfo', 0] },
                        requestedAt: '$students._id',
                     },
                  },
               ],
            },
         },
      ];

      const [result] = await Class.aggregate(pipeline);
      const totalRequests = result.metadata[0]?.totalRequests || 0;
      const requests = result.requests || [];

      res.status(200).json({
         success: true,
         data: {
            requests,
            totalRequests,
            pagination: {
               currentPage: page,
               totalPages: Math.ceil(totalRequests / limit),
               totalRequests,
               hasNextPage: page < Math.ceil(totalRequests / limit),
               hasPrevPage: page > 1,
            },
         },
      });
   } catch (error) {
      res.status(500).json({
         success: false,
         message: 'Failed to fetch join requests',
         error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
   }
};
