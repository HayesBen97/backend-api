import mongoose from 'mongoose';

const schema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user',
  },
  twitterAccount_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'twitterAccounts',
  },
  linkedinAccount_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'linkedinAccounts',
  },
  facebookAccount_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'facebookAccounts',
  },
  search_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'search',
  },
  paraphrasedContent: {
    type: String,
    trim: true,
  },
  originalContent: {
    type: String,
    trim: true,
  },
  sentiment: Number,
  dissimilarity: Number,
  dateTime: Date,
  link: {
    type: String,
    trim: true,
  },
  status: { // 0 - to do 1 - complete  2 - curation 3 - paused 4 - bot deleted 5 - deleted via curation
    type: Number,
    min: 0,
    max: 4,
  },
  reviewed: {
    type: Boolean,
    default: false,
  },
  curated: {
    type: Boolean,
    default: false,
  },
  isBusinessPost: Boolean,
  linkedinAccountPage_id: String,
  paraphrasedWords: Array,
  paraphrasedWordIdxs: Array,
  parsedIdxs: Object,
  imagePath: String,
  brand_selected: {
    required: false,
    type: mongoose.Schema.Types.ObjectId,
    ref: 'brands',
  },
  signature: Boolean,
}, {
  timestamps: true,
});

const Post = mongoose.model('postlogs', schema);

export default Post;
