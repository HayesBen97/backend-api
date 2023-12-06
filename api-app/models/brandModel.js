import mongoose from 'mongoose';

const schema = new mongoose.Schema({
  name: {
    type: String,
    required: false,
    trim: true,
  },
  twitterAccount_id: [{
    required: false,
    type: mongoose.Schema.Types.ObjectId,
    ref: 'twitterAccounts',
  }],
  linkedinAccount_id: [{
    required: false,
    type: mongoose.Schema.Types.ObjectId,
    ref: 'linkedinAccounts',
  }],
  facebookAccount_id: [{
    required: false,
    type: mongoose.Schema.Types.ObjectId,
    ref: 'facebookAccounts',
  }],
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'users',
  },
  linkedinAccountPage_ids: [{
    required: false,
    type: Object,
  }],
  status: {
    type: Number,
    default: 1,
  },
  postUserCreated: {
    type: Number,
  },
  feeds: {
    type: Array,
    default: [],
  },
  signature: {
    type: String,
    default: '',
  },
  banned: {
    type: Array,
  },
  bannedSources: {
    type: Array,
  },
},
{
  timestamps: true,
});

const Brands = mongoose.model('brands', schema);

export default Brands;
