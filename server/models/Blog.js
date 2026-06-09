import mongoose from 'mongoose';

const blogSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    content: { type: String, required: true },
    image: { type: String, default: '' },
    category: { type: String, default: '' },
    author: { type: String, default: '' },
    status: {
      type: String,
      enum: ['Published', 'Draft'],
      default: 'Draft',
    },
    createdAt: { type: Date, default: Date.now },
  },
  { versionKey: false }
);

export default mongoose.model('Blog', blogSchema);

