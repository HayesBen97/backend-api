import mongoose from 'mongoose';

const schema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'users',
  },
  facebookId: String,
  displayName: String,
  oauthToken: {
    type: String,
    trim: true,
  },
  parentFacebookId: String,
}, { collection: 'facebookAccounts' });

const FacebookAccount = mongoose.model('facebookAccounts', schema);

export default FacebookAccount;
