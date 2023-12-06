require('dotenv').config();

export default {
  TWITTER_CONSUMER_KEY: process.env.TWITTER_CONSUMER_KEY,
  TWITTER_CONSUMER_SECRET: process.env.TWITTER_CONSUMER_SECRET,
  TWITTER_CALLBACK_URL: process.env.TWITTER_CALLBACK_URL,
  SESSION_KEY: process.env.SESSION_KEY,
  LINKEDIN_CONSUMER_KEY: process.env.LINKEDIN_CONSUMER_KEY,
  LINKEDIN_CONSUMER_SECRET: process.env.LINKEDIN_CONSUMER_SECRET,
  LINKEDIN_CALLBACK_URL: process.env.LINKEDIN_CALLBACK_URL,
  MONGO_CONNECTION_STRING: process.env.MONGO_CONNECTION_STRING,
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:3000',
  JWT_TOKEN: process.env.JWT_TOKEN,
  FACEBOOK_APP_ID: process.env.FACEBOOK_APP_ID,
  FACEBOOK_APP_SECRET: process.env.FACEBOOK_APP_SECRET,
  FACEBOOK_CALLBACK_URL: process.env.FACEBOOK_CALLBACK_URL,
  POSTMARK_API_KEY: process.env.POSTMARK_API_KEY,
  POSTMARK_FROM_EMAIL: process.env.POSTMARK_FROM_EMAIL,
  MAILCHIMP_API_KEY: process.env.MAILCHIMP_API_KEY,
  MAILCHIMP_LIST: process.env.MAILCHIMP_LIST,
  MAILCHIMP_URL: process.env.MAILCHIMP_URL,
  HUBSPOT_API_KEY: process.env.HUBSPOT_API_KEY,
  PYHTONPATH: process.env.PYTHONPATH,
  SERP_API_KEY: process.env.SERP_API_KEY,
  AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY,
  AWS_ACCESS_KEY: process.env.AWS_ACCESS_KEY
};