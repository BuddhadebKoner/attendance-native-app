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

const User = mongoose.model('User', userSchema);

export default User;
