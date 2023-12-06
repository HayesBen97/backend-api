import express from 'express';
import passport from 'passport';

import checkAuth from '../middleware/checkAuth';

import {
  register,
  login,
  verify,
  forgotPassword,
  twitterCallback,
  linkedinCallback,
  facebookCallback,
  authenticateWithTwitter,
  authenticateWithLinkedIn,
  authenticateWithFacebook,
  refreshToken,
  linkAccounts,
} from '../controllers/auth';

import {
  getMembershipPlans,
} from '../controllers/memberships';

import {
  getAllAccounts,
  getAccountStats,
  getFortniteStats,
  getLinkedinFortnite,
  getLinkedinStats,
  getLinkedInPages,
  updatePages,
  pagesUpdates,
  removeAccount,
  purgeAccountLinks,
} from '../controllers/accounts';

import {
  createAssistant,
  getAllAssistants,
  updateAssistant,
  updateAssistantBanned,
  pauseAssistant,
  playAssistant,
  archiveAssistant,

} from '../controllers/assistant';

import {
  createBrand,
  getAllBrands,
  updateBrand,
} from '../controllers/brands';

import {
  createPost,
  updatePostStatus,
  reviewPost,
  getAllPosts,
  getAllEvents,
  updatePostContent,
  getPostCounts,
  getAllBrandsPostCounts,
  getMetadata,
} from '../controllers/post';

import {
  updateUserProfile,
  updateTutorialStep,
  getUserProfile,
} from '../controllers/user';

import {
  trackEvent,
} from '../controllers/tracking';

import {
  getFeeds,
  addFeeds,
} from '../controllers/feeds';

import { getUserLogs } from '../controllers/logs';

import { predict } from '../controllers/predict';
import { receiveSubscriptionData } from '../controllers/chargebee';
import { googleSearch } from '../controllers/search';

const router = express.Router();
const TWITTER_FAILURE_REDIRECT = '/';
const LINKEDIN_FAILURE_REDIRECT = '/';
const multer = require('multer');

const storage = multer.diskStorage({
  destination(req, file, cb) {
    console.log(file);
    cb(null, './uploads/');
  },
  filename(req, file, cb) {
    console.log(file);

    cb(null, file.originalname);
  },
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png') {
    cb(null, true);
  } else {
    // rejects storing a file
    cb(null, false);
  }
};

const upload = multer({
  storage,
  limits: {
    fileSize: 1024 * 1024 * 25,
  },
  fileFilter,
});

router.route('/uploadmulter')
  .post(upload.single('imageData'));

// Search
router.post('/search', googleSearch);

// Auth
router.post('/auth/login', login); // SignInPage
router.post('/auth/register', register); // SignUpPage
router.post('/auth/verify/:id', verify);
router.get('/auth/token_refresh', refreshToken);
router.get('/auth/twitter', authenticateWithTwitter);
router.get('/auth/twitter/callback', twitterCallback);
router.get('/auth/linkedin', authenticateWithLinkedIn);
router.get('/auth/linkedin/callback', linkedinCallback); // linkedin_callback
router.get('/auth/facebook', authenticateWithFacebook);
router.get('/auth/facebook/callback', facebookCallback);
router.post('/auth/forgot', forgotPassword); // forgotpassword
router.post('/auth/link', checkAuth, linkAccounts);

// Accounts
router.get('/accounts', checkAuth, getAllAccounts);
router.get('/accounts/:id/stats', checkAuth, getAccountStats);
router.get('/accounts/:id/:brand_id/fortnite_stats', checkAuth, getFortniteStats);
router.get('/accounts/:id/:pageid/fornite_linkedin', checkAuth, getLinkedinFortnite);

router.get('/accounts/linkedin/:id/:pageid', checkAuth, getLinkedinStats);
router.get('/purge/:id/:type/:linkedin_key', checkAuth, purgeAccountLinks);
// Assistants
router.post('/assistants', checkAuth, createAssistant);
router.get('/assistants', checkAuth, getAllAssistants);
router.post('/assistants/:id', checkAuth, updateAssistant);
router.post('/assistants/:id/banned', checkAuth, updateAssistantBanned);
router.post('/assistants/:id/pause', checkAuth, pauseAssistant);
router.post('/assistants/:id/play', checkAuth, playAssistant);
router.delete('/assistants/:id/archive/:keep', checkAuth, archiveAssistant);

// Post
router.get('/posts', checkAuth, getAllPosts);
router.get('/posts/counts', checkAuth, getPostCounts);
router.get('/posts/brandcounts', checkAuth, getAllBrandsPostCounts);
router.post('/posts/:id', checkAuth, updatePostStatus);
router.post('/posts/:id/content', checkAuth, updatePostContent);
router.post('/posts/:id/review', checkAuth, reviewPost);
router.get('/posts/metadata', checkAuth, getMetadata);

// Brands
router.post('/brands', checkAuth, createBrand);
router.get('/brands', checkAuth, getAllBrands);
router.post('/brands/:id', checkAuth, updateBrand);

// Create
router.post('/create/post', checkAuth, createPost);
// router.route('/create/post', upload.single('imageData'))

// Remove
router.post('/removeAccount', checkAuth, removeAccount);

// Remove
router.post('/removeAccount', checkAuth, removeAccount);

// Linkedin
router.post('/linkedinPages', checkAuth, getLinkedInPages);
router.post('/updatePages', checkAuth, updatePages);
router.post('/pagesUpdates', checkAuth, pagesUpdates);

// User
router.post('/user', checkAuth, updateUserProfile);
router.get('/user', checkAuth, getUserProfile);
router.post('/user/tutorial/:tutorial/:step', checkAuth, updateTutorialStep);

// Logs
router.get('/logs', checkAuth, getUserLogs);

// Predict
router.post('/predict', checkAuth, predict);

// Chargebee
router.post('/chargebee', receiveSubscriptionData);

// Memberships
router.get('/memberships', getMembershipPlans);

// Events
router.get('/events', getAllEvents);

// Tracking
router.post('/tracking', checkAuth, trackEvent);

// Feeds
router.post('/feeds', checkAuth, getFeeds);
router.post('/feeds/add', checkAuth, addFeeds);



export default router;
