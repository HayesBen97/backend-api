import mongoose from 'mongoose';
import rssconn from '../controllers/rssconnection';

const schema = new mongoose.Schema({
  Name: {
    type: String,
    trim: true,
    minlength: [1, 'A name is required'],
  },
  Link: {
    type: String,
    trim: true,
    required: [
      true,
      'A link is required',
    ],
  },
  TotalCount: {
    type: Number,
    default: 0,
  },
},

{
  timestamps: { createdAt: 'CreatedAt' },
});

const Feed = rssconn.model('feeds', schema);

export default Feed;
