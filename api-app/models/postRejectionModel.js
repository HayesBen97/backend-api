import mongoose from 'mongoose';

const schema = new mongoose.Schema({
  post_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'postlogs',
    required: true,
  },
  reason: {
    type: String,
  },
}, {
  timestamps: true,
});

const Rejected = mongoose.model('post_rejects', schema);

export default Rejected;
