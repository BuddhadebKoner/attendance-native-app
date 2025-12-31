import Class from '../models/Class.js';
import User from '../models/User.js';

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
      await newClass.populate('createdBy', 'name email mobile');

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
      // Find classes created by user or where user is a student
      const classes = await Class.find({
         $or: [
            { createdBy: req.userId },
            { students: req.userId },
         ],
      })
         .populate('createdBy', 'name email mobile')
         .populate('students', 'name email mobile')
         .sort({ createdAt: -1 });

      res.status(200).json({
         success: true,
         data: {
            classes,
            count: classes.length,
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
      const classData = await Class.findById(req.params.id)
         .populate('createdBy', 'name email mobile')
         .populate('students', 'name email mobile');

      if (!classData) {
         return res.status(404).json({
            success: false,
            message: 'Class not found',
         });
      }

      // Check if user has access to this class
      const isCreator = classData.createdBy._id.toString() === req.userId.toString();
      const isStudent = classData.students.some(student => student._id.toString() === req.userId.toString());
      const hasAccess = isCreator || isStudent;

      if (!hasAccess) {
         return res.status(403).json({
            success: false,
            message: 'Access denied',
         });
      }

      res.status(200).json({
         success: true,
         data: {
            class: classData,
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
      await classData.populate('createdBy', 'name email mobile');
      await classData.populate('students', 'name email mobile');

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

// @desc    Add student to class
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

      // Check if student already enrolled
      if (classData.students.includes(studentId)) {
         return res.status(400).json({
            success: false,
            message: 'Student already enrolled in this class',
         });
      }

      // Add student
      classData.students.push(studentId);
      await classData.save();

      // Populate details for response
      await classData.populate('createdBy', 'name email mobile');
      await classData.populate('students', 'name email mobile');

      res.status(200).json({
         success: true,
         message: 'Student added successfully',
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

      // Check if student is enrolled
      const studentIndex = classData.students.indexOf(studentId);
      if (studentIndex === -1) {
         return res.status(404).json({
            success: false,
            message: 'Student not found in this class',
         });
      }

      // Remove student
      classData.students.splice(studentIndex, 1);
      await classData.save();

      // Populate details for response
      await classData.populate('createdBy', 'name email mobile');
      await classData.populate('students', 'name email mobile');

      res.status(200).json({
         success: true,
         message: 'Student removed successfully',
         data: {
            class: classData,
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

      await Class.findByIdAndDelete(req.params.id);

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
