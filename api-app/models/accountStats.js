import mongoose from 'mongoose';

const schema = new mongoose.Schema({
  account_id: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'onModel',
  },
  onModel: {
    type: String,
    required: true,
    enum: ['linkedinAccounts', 'twitterAccounts', 'facebookAccounts'],
  },
  friendCount: Number,
  followerCount: Number,
  favouriteCount: Number,
  statusCount: Number,
}, { collection: 'accountStats' }, {
  timestamps: true,
});

const AccountStats = mongoose.model('accountStats', schema);

export default AccountStats;
