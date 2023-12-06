import mongoose from 'mongoose';

const schema = new mongoose.Schema({
  event_id: {
    type: String,
    trim: true,
  },
  start: {
    type: Date,
  },
  end: {
    type: Date,
  },
  name: {
    type: String,
    trim: true,
  },
}, {
  timestamps: true,
});

const Event = mongoose.model('events', schema);

export default Event;
