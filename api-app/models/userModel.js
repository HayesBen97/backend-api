import mongoose from 'mongoose';

const schema = new mongoose.Schema({
  name: {
    type: String,
    trim: true,
    minlength: [1, 'A name is required'],
  },
  email1: {
    type: String,
    trim: true,
    lowercase: true,
    unique: true,
    required: [
      true,
      'An email address is required',
    ],
    match: [/^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/, 'Please enter a valid email address'],
  },
  countryName: {
    type: String,
  },
  paymentKey: String,
  nextBillingDate: Date,
  startDate: Date,
  endDate: Date,
  planKey: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'plans',
  },
  activeUser: {
    type: Boolean,
    required: true,
    default: true,
  },
  password: {
    type: String,
    trim: true,
    required: [
      true,
      'A password is required',
    ],
  },
  activeTutorial: {
    type: String,
    default: 'onboarding',
  },
  tutorialStep: {
    type: Number,
  },
  brand_selected: {
    required: false,
    type: mongoose.Schema.Types.ObjectId,
    ref: 'brands',
  },
  tracking: {
    type: Object,
    default: {
      'Entered Platform': false,
      'Finished Tutorial': false,
      'Connected A Profile': false,
      'Scheduled a Post': false,
      'Utilised Preview': false,
      'Saved Assistant': false,
      'Utilised Advance Search': false,
      'Upgrade Account': false,
      'Post Curated': false,
      'Clicked Help': false,
      'Create post': false,
      'Create assistant': false,
    },
  },
  referal: {
    type: String,
    default: '',
  },
},

{
  timestamps: true,
});

schema.pre('update', function (next) {
  this.options.runValidators = true;
  next();
});
schema.pre('findOneAndUpdate', function (next) {
  this.options.runValidators = true;
  next();
});

const User = mongoose.model('users', schema);

export default User;
