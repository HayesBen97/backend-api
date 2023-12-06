import mongoose from 'mongoose';
import rssconn from '../controllers/rssconnection';

const schema = new mongoose.Schema({
  title: {
    type: String,
    trim: true,
  },
  summary: {
    type: String,
    trim: true,
  },
  link: {
    type: String,
    trim: true,
  },
  publishedDate: {
    type: Date,
    default: 0,
  },
  mediaUrl: {
    type: String,
    trim: true,
  },
  articleDate: {
    type: Date,
    default: 0,
  },
  RSSFeedName: {
    type: String,
    trim: true,
  },
},

{
  timestamps: { createdAt: 'CreatedAt', updatedAt: 'UpdatedAt' },
});

const Article = rssconn.model('articles', schema);

export default Article;
