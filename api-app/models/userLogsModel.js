import mongoose from 'mongoose';

const schema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'users',
  },
  pageName: String,
}, {
  timestamps: true,
});

const UserLogs = mongoose.model('userLogs', schema);

export default UserLogs;
