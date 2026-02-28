import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import { JWT_SECRET, JWT_EXPIRES_IN } from '../config/jwt.js';

const userSchema = new mongoose.Schema(
   {
      name: {
         type: String,
         trim: true,
      },
      email: {
         type: String,
         trim: true,
         lowercase: true,
         sparse: true,
         validate: {
            validator: function (v) {
               if (!v) return true;
               return /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(v);
            },
            message: 'Please enter a valid email address',
         },
      },
      mobile: {
         type: String,
         unique: true,
         sparse: true,
         trim: true,
         validate: {
            validator: function (v) {
               if (!v) return true;
               return /^[0-9]{10}$/.test(v);
            },
            message: 'Please enter a valid 10-digit mobile number',
         },
      },
      googleId: {
         type: String,
         unique: true,
         sparse: true,
      },
      authProvider: {
         type: String,
         enum: ['google'],
         default: 'google',
      },
      role: {
         type: String,
         enum: ['teacher', 'student'],
      },
      profilePicture: {
         type: String,
         trim: true,
      },
      accessToken: {
         type: String,
         select: false,
      },
      // For teachers: attendances they created
      attendances: [
         {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Attendance',
         },
      ],
      // For students: classes they are enrolled in (denormalized for quick lookup)
      enrolledClasses: [
         {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Class',
         },
      ],
      // For students: cached attendance statistics (updated on write operations)
      studentStats: {
         totalClassesEnrolled: {
            type: Number,
            default: 0,
         },
         totalAttendanceSessions: {
            type: Number,
            default: 0,
         },
         totalPresent: {
            type: Number,
            default: 0,
         },
         totalAbsent: {
            type: Number,
            default: 0,
         },
         totalLate: {
            type: Number,
            default: 0,
         },
         totalExcused: {
            type: Number,
            default: 0,
         },
         attendancePercentage: {
            type: Number,
            default: 0,
         },
      },
   },
   {
      timestamps: true,
   }
);

// Method to generate JWT access token
userSchema.methods.generateAccessToken = function () {
   const token = jwt.sign(
      {
         _id: this._id,
         email: this.email,
      },
      JWT_SECRET,
      {
         expiresIn: JWT_EXPIRES_IN,
      }
   );

   return token;
};

// Method to save access token
userSchema.methods.saveAccessToken = async function () {
   const token = this.generateAccessToken();
   this.accessToken = token;
   await this.save();
   return token;
};

// Method to update student attendance statistics using aggregation
userSchema.methods.updateAttendanceStats = async function () {
   const Class = mongoose.model('Class');
   const StudentAttendanceRecord = mongoose.model('StudentAttendanceRecord');

   // Count total classes enrolled (using $elemMatch for correctness)
   const totalClasses = await Class.countDocuments({
      students: { $elemMatch: { student: this._id, status: 'accepted' } },
   });

   // Aggregate attendance stats from StudentAttendanceRecord collection (single DB call)
   const statsResult = await StudentAttendanceRecord.aggregate([
      { $match: { student: this._id } },
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
   ]);

   const stats = statsResult[0] || {
      totalAttendanceSessions: 0,
      totalPresent: 0,
      totalAbsent: 0,
      totalLate: 0,
      totalExcused: 0,
   };

   const attendancePercentage =
      stats.totalAttendanceSessions > 0
         ? Math.round((stats.totalPresent / stats.totalAttendanceSessions) * 100)
         : 0;

   this.studentStats = {
      totalClassesEnrolled: totalClasses,
      totalAttendanceSessions: stats.totalAttendanceSessions,
      totalPresent: stats.totalPresent,
      totalAbsent: stats.totalAbsent,
      totalLate: stats.totalLate,
      totalExcused: stats.totalExcused,
      attendancePercentage,
   };

   await this.save();
   return this.studentStats;
};

const User = mongoose.model('User', userSchema);

export default User;
