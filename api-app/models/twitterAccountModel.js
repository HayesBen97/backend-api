import mongoose from 'mongoose';

const schema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user',
    required: false,
  },
  twitterHandle: {
    type: String,
    trim: true,
    unique: true,
  },
  oauthToken: {
    type: String,
    trim: true,
  },
  oauthTokenSecret: {
    type: String,
    trim: true,
  },
  twitterID: {
    type: String,
  },
  initialFollowersCount: Number,
  initialFavouritesCount: Number,
  initialFriendsCount: Number,
  initialStatusesCount: Number,
  fromAPIFollowersCount: Number,
  fromAPIFavouritesCount: Number,
  fromAPIFriendsCount: Number,
  fromAPIStatusesCount: Number,
  currentFavouritesCount: Number,
  currentFriendsCount: Number,
  currentStatusesCount: Number,
}, { collection: 'twitterAccounts' }, {
  timestamps: true,
});

const TwitterAccount = mongoose.model('twitterAccounts', schema);

export default TwitterAccount;
