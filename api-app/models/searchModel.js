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
  paymentDefaulter: {
    type: Boolean,
    default: false,
    required: true,
  },
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
  bannedList: [{
    type: String,
    trim: true,
  }],
  bannedSources: [{
    type: String,
    trim: true,
  }],
  keyword: [{
    type: String,
  }],
  keywordBool: {
    type: String,
    default: 'OR',
  },
  locations: [{
    type: String,
  }],
  operatingWindow: Number,
  similarityMetric: Number,
  sentimentMetric: Number,
  lastSearchCount: Number,
  sinceTime: Number,
  startTime: Date,
  daysToRun: {
    type: [Number],
  },
  totalPostsPerDay: Number,
  pauseStatus: {
    type: Boolean,
    required: true,
    default: false,
  },
  curation: {
    type: Boolean,
    required: true,
    default: false,
  },
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'users',
  },
  paymentDefaulter: Boolean,
  archived: {
    type: Boolean,
    default: false,
  },
  brand_selected: {
    required: false,
    type: mongoose.Schema.Types.ObjectId,
    ref: 'brands',
  },
  keepPosts: {
    required: false,
    type: Boolean,
  },
  post_to_linkedin_personal: Boolean,
  linkedinAccountPage_ids: Object,
}, {
  timestamps: true,
});

schema.statics.findWithoutArchived = function (query) {
  query.archived = { $ne: true };
  return this.find(query);
};

const Search = mongoose.model('searches', schema);

export default Search;
