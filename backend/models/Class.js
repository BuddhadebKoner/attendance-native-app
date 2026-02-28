import mongoose from 'mongoose';

const classSchema = new mongoose.Schema(
   {
      className: {
         type: String,
         required: [true, 'Class name is required'],
         trim: true,
      },
      subject: {
         type: String,
         required: [true, 'Subject name is required'],
         trim: true,
      },
      createdBy: {
         type: mongoose.Schema.Types.ObjectId,
         ref: 'User',
         required: [true, 'Creator is required'],
      },
      students: [
         {
            student: {
               type: mongoose.Schema.Types.ObjectId,
               ref: 'User',
               required: true,
            },
            status: {
               type: String,
               enum: ['pending', 'requested', 'accepted'],
               default: 'pending',
            },
            enrolledAt: {
               type: Date,
            },
         },
      ],
   },
   {
      timestamps: true, // Adds createdAt and updatedAt fields
   }
);

// Validate maximum student limit (only count accepted students)
classSchema.path('students').validate(function (students) {
   return students.length <= 100;
}, 'Cannot add more than 100 students to a class');

// Create indexes for better query performance
classSchema.index({ createdBy: 1 });
classSchema.index({ 'students.student': 1 });
classSchema.index({ 'students.status': 1 });
classSchema.index({ className: 1, subject: 1 });

// Virtual field to get total student count
classSchema.virtual('studentCount').get(function () {
   return this.students?.length || 0;
});

// Virtual field to get accepted student count
classSchema.virtual('acceptedStudentCount').get(function () {
   return this.students?.filter(s => s.status === 'accepted').length || 0;
});

// Virtual field to get pending student count (teacher invitations)
classSchema.virtual('pendingStudentCount').get(function () {
   return this.students?.filter(s => s.status === 'pending').length || 0;
});

// Virtual field to get requested student count (student QR join requests)
classSchema.virtual('requestedStudentCount').get(function () {
   return this.students?.filter(s => s.status === 'requested').length || 0;
});

// Ensure virtuals are included in JSON output
classSchema.set('toJSON', { virtuals: true });
classSchema.set('toObject', { virtuals: true });

const Class = mongoose.model('Class', classSchema);

export default Class;
