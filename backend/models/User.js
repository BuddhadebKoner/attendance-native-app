import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

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
         sparse: true, // Allows multiple null values
         validate: {
            validator: function (v) {
               // Only validate if email is provided
               if (!v) return true;
               return /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(v);
            },
            message: 'Please enter a valid email address',
         },
      },
      mobile: {
         type: String,
         required: [true, 'Mobile number is required'],
         unique: true,
         trim: true,
         validate: {
            validator: function (v) {
               // Basic mobile number validation (10 digits)
               return /^[0-9]{10}$/.test(v);
            },
            message: 'Please enter a valid 10-digit mobile number',
         },
      },
      password: {
         type: String,
         required: [true, 'Password is required'],
         minlength: [6, 'Password must be at least 6 characters long'],
         select: false, // Don't return password by default
      },
      accessToken: {
         type: String,
         select: false, // Don't return token by default
      },
      // For teachers: attendances they created
      attendances: [
         {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Attendance',
         },
      ],
      // For students: classes they are enrolled in
      enrolledClasses: [
         {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Class',
         },
      ],
      // For students: individual attendance records
      myAttendanceRecords: [
         {
            attendance: {
               type: mongoose.Schema.Types.ObjectId,
               ref: 'Attendance',
            },
            class: {
               type: mongoose.Schema.Types.ObjectId,
               ref: 'Class',
            },
            status: {
               type: String,
               enum: ['present', 'absent', 'late', 'excused'],
            },
            markedAt: {
               type: Date,
            },
            notes: {
               type: String,
               trim: true,
            },
            addedAt: {
               type: Date,
               default: Date.now,
            },
         },
      ],
      // For students: attendance statistics
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
      timestamps: true, // Adds createdAt and updatedAt fields
   }
);

// Hash password before saving
userSchema.pre('save', async function () {
   // Only hash if password is modified
   if (!this.isModified('password')) {
      return;
   }

   const salt = await bcrypt.genSalt(10);
   this.password = await bcrypt.hash(this.password, salt);
});

// Method to compare passwords
userSchema.methods.comparePassword = async function (candidatePassword) {
   try {
      return await bcrypt.compare(candidatePassword, this.password);
   } catch (error) {
      throw new Error('Password comparison failed');
   }
};

// Method to generate JWT access token
userSchema.methods.generateAccessToken = function () {
   const token = jwt.sign(
      {
         _id: this._id,
         mobile: this.mobile,
      },
      process.env.JWT_SECRET || 'your-secret-key-change-in-production',
      {
         expiresIn: process.env.JWT_EXPIRES_IN || '7d',
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

// Method to update student attendance statistics
userSchema.methods.updateAttendanceStats = async function () {
   const Class = mongoose.model('Class');
   const Attendance = mongoose.model('Attendance');

   // Count total classes enrolled
   const totalClasses = await Class.countDocuments({
      students: this._id,
   });

   // Get all attendance records where this user was marked
   const attendances = await Attendance.find({
      'studentRecords.student': this._id,
      status: 'completed', // Only count completed attendances
   });

   // Calculate statistics
   let totalPresent = 0;
   let totalAbsent = 0;
   let totalLate = 0;
   let totalExcused = 0;

   attendances.forEach(attendance => {
      const studentRecord = attendance.studentRecords.find(
         record => record.student.toString() === this._id.toString()
      );
      if (studentRecord) {
         switch (studentRecord.status) {
            case 'present':
               totalPresent++;
               break;
            case 'absent':
               totalAbsent++;
               break;
            case 'late':
               totalLate++;
               break;
            case 'excused':
               totalExcused++;
               break;
         }
      }
   });

   const totalAttendanceSessions = attendances.length;
   const attendancePercentage = totalAttendanceSessions > 0
      ? Math.round((totalPresent / totalAttendanceSessions) * 100)
      : 0;

   // Update student stats
   this.studentStats = {
      totalClassesEnrolled: totalClasses,
      totalAttendanceSessions,
      totalPresent,
      totalAbsent,
      totalLate,
      totalExcused,
      attendancePercentage,
   };

   await this.save();
   return this.studentStats;
};

const User = mongoose.model('User', userSchema);

export default User;
