import mongoose from 'mongoose';

const schema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'users',
    required: false,
  },
  automatedPosts: Number,
  displayName: {
    type: String,
    trim: true,
  },
  oauthToken: {
    type: String,
    trim: true,
  },
  email: {
    type: String,
    trim: true,
  },
  provider: {
    type: String,
    trim: true,
  },
  linkedinID: {
    type: String,
    trim: true,
    unique: true,
  },
  pageIDs: Array,
  pagesSelected: Boolean,
  // Array of objects: [{name: 'artimus', id:'123445}]
}, {
  collection: 'linkedinAccounts',
  timestamps: true,
});

const LinkedinAccount = mongoose.model('linkedinAccounts', schema);

export default LinkedinAccount;
