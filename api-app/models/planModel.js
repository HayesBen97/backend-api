import mongoose from 'mongoose';

const schema = new mongoose.Schema({
  planKey: {
    type: String,
    trim: true,
  },
  totalPostsPerWeek: {
    type: Number,
  },
  totalPostsPerDay: {
    type: Number,
  },
  maxNumberOfAccounts: {
    type: Number,
  },
}, {
  timestamps: true,
});

const Plan = mongoose.model('plans', schema);

export default Plan;
