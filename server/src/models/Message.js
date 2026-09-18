import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema(
  {
    author: { type: String, required: true, trim: true, maxlength: 32 },
    text: { type: String, required: true, trim: true, maxlength: 1000 }
  },
  { timestamps: true }
);

export const Message = mongoose.model('Message', messageSchema);
