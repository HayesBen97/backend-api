import mongoose from 'mongoose';

const schema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'users',
  },
  post_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'postlogs',
    required: true,
  },
  review: {
    type: Number,
    required: true,
    min: 0,
    max: 1,
  },
  message: {
    type: String,
    trim: true,
    default: 'NO MESSAGE',
  },
});

const Review = mongoose.model('post_reviews', schema);

export default Review;
