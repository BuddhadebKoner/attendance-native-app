import mongoose from 'mongoose';

const attendanceRecordSchema = new mongoose.Schema({
   student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
   },
   status: {
      type: String,
      enum: ['present', 'absent', 'late', 'excused'],
      default: 'absent',
   },
   markedAt: {
      type: Date,
   },
   notes: {
      type: String,
      trim: true,
   },
});

const locationSchema = new mongoose.Schema({
   latitude: {
      type: Number,
   },
   longitude: {
      type: Number,
   },
   address: {
      type: String,
      trim: true,
   },
   accuracy: {
      type: Number,
   },
}, { _id: false });

const attendanceSchema = new mongoose.Schema(
   {
      // Type of attendance
      attendanceType: {
         type: String,
         enum: ['quick', 'scheduled'],
         required: [true, 'Attendance type is required'],
         default: 'quick',
      },

      // References
      class: {
         type: mongoose.Schema.Types.ObjectId,
         ref: 'Class',
         required: [true, 'Class is required'],
      },
      takenBy: {
         type: mongoose.Schema.Types.ObjectId,
         ref: 'User',
         required: [true, 'Attendance taker is required'],
      },

      // Date and Time
      attendanceDate: {
         type: Date,
         required: [true, 'Attendance date is required'],
         default: Date.now,
      },
      startedAt: {
         type: Date,
         required: [true, 'Start time is required'],
         default: Date.now,
      },
      finishedAt: {
         type: Date,
      },

      // For scheduled attendance
      scheduledFor: {
         type: Date,
      },
      reminderSent: {
         type: Boolean,
         default: false,
      },

      // Location information
      location: locationSchema,

      // Student attendance records
      studentRecords: [attendanceRecordSchema],

      // Quick statistics
      totalStudents: {
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

      // Status
      status: {
         type: String,
         enum: ['in-progress', 'completed', 'cancelled'],
         default: 'in-progress',
      },

      // Additional notes
      notes: {
         type: String,
         trim: true,
      },

      // Duration in minutes
      duration: {
         type: Number,
      },
   },
   {
      timestamps: true, // Adds createdAt and updatedAt fields
   }
);

// Create indexes for better query performance
attendanceSchema.index({ class: 1, attendanceDate: -1 });
attendanceSchema.index({ takenBy: 1, attendanceDate: -1 });
attendanceSchema.index({ attendanceType: 1 });
attendanceSchema.index({ status: 1 });
attendanceSchema.index({ 'studentRecords.student': 1 });

// Virtual field to get attendance percentage
attendanceSchema.virtual('attendancePercentage').get(function () {
   if (this.totalStudents === 0) return 0;
   return Math.round((this.totalPresent / this.totalStudents) * 100);
});

// Pre-save middleware to calculate statistics
attendanceSchema.pre('save', async function () {
   if (this.isModified('studentRecords')) {
      this.totalStudents = this.studentRecords.length;
      this.totalPresent = this.studentRecords.filter(record => record.status === 'present').length;
      this.totalAbsent = this.studentRecords.filter(record => record.status === 'absent').length;
      this.totalLate = this.studentRecords.filter(record => record.status === 'late').length;
      this.totalExcused = this.studentRecords.filter(record => record.status === 'excused').length;
   }

   // Calculate duration if attendance is completed
   if (this.status === 'completed' && this.finishedAt && this.startedAt) {
      this.duration = Math.round((this.finishedAt - this.startedAt) / 1000 / 60); // Duration in minutes
   }
});

// Method to mark student attendance
attendanceSchema.methods.markStudent = function (studentId, status, notes = '') {
   const studentRecord = this.studentRecords.find(
      record => record.student.toString() === studentId.toString()
   );

   if (studentRecord) {
      studentRecord.status = status;
      studentRecord.markedAt = new Date();
      if (notes) studentRecord.notes = notes;
   } else {
      this.studentRecords.push({
         student: studentId,
         status,
         markedAt: new Date(),
         notes,
      });
   }

   return this;
};

// Method to complete attendance
attendanceSchema.methods.complete = function () {
   this.status = 'completed';
   this.finishedAt = new Date();
   return this;
};

// Method to get summary
attendanceSchema.methods.getSummary = function () {
   return {
      attendanceId: this._id,
      class: this.class,
      attendanceDate: this.attendanceDate,
      attendanceType: this.attendanceType,
      status: this.status,
      totalStudents: this.totalStudents,
      totalPresent: this.totalPresent,
      totalAbsent: this.totalAbsent,
      totalLate: this.totalLate,
      totalExcused: this.totalExcused,
      attendancePercentage: this.attendancePercentage,
      duration: this.duration,
   };
};

// Ensure virtuals are included in JSON output
attendanceSchema.set('toJSON', { virtuals: true });
attendanceSchema.set('toObject', { virtuals: true });

const Attendance = mongoose.model('Attendance', attendanceSchema);

export default Attendance;
