import mongoose from 'mongoose';

const courseContactSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
  phone: {
    type: String,
    required: true,
    trim: true
  },
  courseName: {
    type: String,
    required: true,
    trim: true
  },
  message: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['pending', 'contacted', 'enrolled', 'rejected'],
    default: 'pending'
  }
}, {
  timestamps: true
});

// Indexes
courseContactSchema.index({ email: 1 });
courseContactSchema.index({ status: 1, createdAt: -1 });

const courseContactModel = mongoose.models.courseContact || mongoose.model('courseContact', courseContactSchema);

export default courseContactModel;