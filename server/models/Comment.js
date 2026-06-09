import mongoose from 'mongoose';

const commentSchema = new mongoose.Schema(
  {
    blogId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
    authorName: { type: String, required: true, trim: true },
    content: { type: String, required: true, trim: true },
    status: {
      type: String,
      enum: ['Pending', 'Approved', 'Rejected'],
      default: 'Pending',
    },
  },
  { timestamps: true, versionKey: false }
);

export default mongoose.model('Comment', commentSchema);

