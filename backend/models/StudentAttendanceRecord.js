import mongoose from 'mongoose';

const studentAttendanceRecordSchema = new mongoose.Schema(
   {
      student: {
         type: mongoose.Schema.Types.ObjectId,
         ref: 'User',
         required: [true, 'Student is required'],
      },
      attendance: {
         type: mongoose.Schema.Types.ObjectId,
         ref: 'Attendance',
         required: [true, 'Attendance is required'],
      },
      class: {
         type: mongoose.Schema.Types.ObjectId,
         ref: 'Class',
         required: [true, 'Class is required'],
      },
      status: {
         type: String,
         enum: ['present', 'absent', 'late', 'excused'],
         required: [true, 'Status is required'],
         default: 'absent',
      },
      markedAt: {
         type: Date,
      },
      notes: {
         type: String,
         trim: true,
      },
   },
   {
      timestamps: true, // createdAt = when the record was first created
   }
);

// Compound unique index: one record per student per attendance session
studentAttendanceRecordSchema.index({ student: 1, attendance: 1 }, { unique: true });

// Query indexes for efficient lookups
studentAttendanceRecordSchema.index({ student: 1, class: 1, createdAt: -1 });
studentAttendanceRecordSchema.index({ student: 1, status: 1 });
studentAttendanceRecordSchema.index({ student: 1, createdAt: -1 });
studentAttendanceRecordSchema.index({ attendance: 1 });
studentAttendanceRecordSchema.index({ class: 1 });

const StudentAttendanceRecord = mongoose.model(
   'StudentAttendanceRecord',
   studentAttendanceRecordSchema
);

export default StudentAttendanceRecord;
