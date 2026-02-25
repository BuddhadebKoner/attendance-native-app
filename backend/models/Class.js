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
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
         },
      ],
   },
   {
      timestamps: true, // Adds createdAt and updatedAt fields
   }
);

// Validate maximum student limit
classSchema.path('students').validate(function (students) {
   return students.length <= 100;
}, 'Cannot add more than 100 students to a class');

// Create indexes for better query performance
classSchema.index({ createdBy: 1 });
classSchema.index({ students: 1 });
classSchema.index({ className: 1, subject: 1 });

// Virtual field to get student count
classSchema.virtual('studentCount').get(function () {
   return this.students?.length || 0;
});

// Ensure virtuals are included in JSON output
classSchema.set('toJSON', { virtuals: true });
classSchema.set('toObject', { virtuals: true });

const Class = mongoose.model('Class', classSchema);

export default Class;
