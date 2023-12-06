import mongoose from 'mongoose';

import fs from 'fs';
import e from 'express';
import Post from '../models/postModel';
import Event from '../models/eventsModel';
import Review from '../models/postReviewModel';
import Rejected from '../models/postRejectionModel';
import Search from '../models/searchModel';
import Twitter from '../models/twitterAccountModel';
import User from '../models/userModel';
import Brand from '../models/brandModel';
import { trackApiEvent } from './tracking';

import { handleError, updateUserLogs } from '../scripts/helper';

import config from '../config';
import Brands from '../models/brandModel';

const metascraper = require('metascraper')([
  require('metascraper-author')(),
  require('metascraper-date')(),
  require('metascraper-description')(),
  require('metascraper-image')(),
  require('metascraper-logo')(),
  require('metascraper-clearbit')(),
  require('metascraper-publisher')(),
  require('metascraper-title')(),
  require('metascraper-url')(),
]);

const got = require('got');

const { ObjectId } = mongoose.Types;

const express = require('express');

const { FRONTEND_URL } = config;
const multer = require('multer');

const ImageRouter = express.Router();

// var upload_path = require('path').join(__dirname, '/uploads')
// var upload_path = "/var/www/html/marketmate-api/uploads"
const upload_path = process.env.UPLOAD_PATH;

const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, './uploads');
  },
  filename(req, file, cb) {
    cb(null, file.originalname);
  },
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png') {
    cb(null, true);
  } else {
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

export const createPost = async (req, res) => {
  try {
    if (!req.body) {
      return res.status(400).json({
        status: 400,
        message: 'A request body is required',
      });
    }
    const postData = {
      sentiment: req.body.sentiment || -0.5,
      curation: req.body.curated || true,
      reviewed: req.body.reviewed || true,
      dissimilarity: req.body.dissimilarity || 0,
      dateTime: req.body.dateTime || new Date(Date.now()).toISOString(),
      search_id: ObjectId(req.body.search_id),
      paraphrasedContent: req.body.paraphrasedContent,
      originalContent: req.body.originalContent,
      status: req.body.status || 0,
      link: req.body.link,
      parsedIdxs: {},
      user_id: req.user._id,
      imagePath: req.body.imagePath || '',
      brand_selected: ObjectId(req.body.brand_selected),
      signature: req.body.signature,

      // ObjectId("5e1d96ecf770ed0a616bdb4b")
    };
    if (typeof (req.body.twitterAccount_id) === 'undefined'
    && typeof (req.body.facebookAccount_id) === 'undefined') {
      postData.linkedinAccount_id = ObjectId(req.body.linkedinAccount_id);
      if (typeof (req.body.linkedinAccountPage_id) !== 'undefined') {
        postData.isBusinessPost = true;
        postData.linkedinAccountPage_id = req.body.linkedinAccountPage_id;
      } else {
        postData.isBusinessPost = false;
      }
    } else if (typeof (req.body.linkedinAccount_id) === 'undefined'
    && typeof (req.body.facebookAccount_id) === 'undefined') {
      postData.twitterAccount_id = ObjectId(req.body.twitterAccount_id);
    } else {
      postData.facebookAccount_id = ObjectId(req.body.facebookAccount_id);
    }

    try {
      const post = new Post(postData);

      await post.save();
    } catch (err) {
      console.log('error', err);
      handleError(err, res);
    }
    if ((req.body.status || 0) === 0) {
      trackApiEvent('Scheduled a Post', req.user._id);
    }
    updateUserLogs('User created assistant', req);
  } catch (err) {
    console.error(err);
    return res.status(204).json({
      message: 'something',
      status: 201,
    });
  }
};

export const updatePostStatus = async (req, res) => {
  if (!req.params.id) {
    return res.status(400).json({
      status: 400,
      message: 'Please provide a post ID',
    });
  }

  if (!Number.isInteger(req.body.status)) {
    return res.status(400).json({
      status: 400,
      message: 'Please provide a status',
    });
  }
  console.log('DETAILS: ', req.body);
  let dateTime;
  if (!req.body.DateTime && req.body.status === 0) {
    dateTime = new Date();
  } else {
    dateTime = req.body.DateTime;
  }

  try {
    console.log('PARAMS.ID', req.params.id);
    const original_post = await Post.findOneAndUpdate({ _id: req.params.id }, { status: req.body.status, dateTime, curated: true });
    console.log('original_post', original_post);
    if (original_post.status === 2 && req.body.status === 0) {
      trackApiEvent('Post Curated', req.user._id);
      trackApiEvent('Scheduled a Post', req.user._id);
    }
  } catch (err) {
    console.log('ERROR', err);
    return handleError(err, res);
  }

  console.log('STATUS', req.body.status);
  if (req.body.status === 0) {
    updateUserLogs('User approved post', req);
  } else if (req.body.status === 5) {
    updateUserLogs('User rejected post', req);
    console.log('REJECTED');
    try {
      const newRejection = new Rejected({
        post_id: ObjectId(req.params.id),
        reason: req.body.reject_reason,
      });
      await newRejection.save();

      console.log('post id', req.params.id);
      console.log('reject reason', req.body.reject_reason);
    } catch (err) {
      console.log('ERROR', err);
      return handleError(err, res);
    }
  }

  return res.status(200).json({
    status: 200,
    message: 'Updated the post',
  });
};

export const updatePostContent = async (req, res) => {
  try {
    if (req.body.paraphrasedWordIdxs) {
      await Post.findOneAndUpdate({ _id: req.params.id },
        {
          paraphrasedContent: req.body.content,
          paraphrasedWordIdxs: req.body.paraphrasedWordIdxs,
          dateTime: req.body.dateTime,
        });
    } else {
      await Post.findOneAndUpdate({ _id: req.params.id }, { paraphrasedContent: req.body.content });
    }
  } catch (err) {
    return handleError(err, res);
  }

  updateUserLogs('User updated post content', req);

  return res.status(200).json({
    status: 200,
    message: 'Updated the post',
  });
};

export const reviewPost = async (req, res) => {
  if (!req.params.id) {
    return res.status(400).json({
      status: 400,
      message: 'Please proide a post id',
    });
  }

  if (!Number.isInteger(req.body.review)) {
    return res.status(400).json({
      status: 400,
      message: 'Please provide a review',
    });
  }

  try {
    const reviewData = {
      post_id: ObjectId(req.params.id),
      review: req.body.review,
      message: req.body.message || 'NO MESSAGE',
    };

    const newReview = new Review(reviewData);

    await newReview.save();
    await Post.findOneAndUpdate({ _id: req.params.id }, { reviewed: true });
  } catch (err) {
    return handleError(err, res);
  }

  updateUserLogs('review post', req);

  return res.status(201).json({
    message: 'Review created',
    status: 201,
  });
};

function sleep(milliseconds) {
  const date = Date.now();
  let currentDate = null;
  do {
    currentDate = Date.now();
  } while (currentDate - date < milliseconds);
}

async function asyncMap(posts, callback) {
  for (let index = 0; index < posts.length; index++) {
    posts.metadata = await callback(posts[index], index, posts);
  }
  return posts;
}

function readFromFile(post, index) {
  return new Promise((resolve, reject) => {
    fs.readFile(upload_path.concat(`/${post.imagePath}`), (err, data) => {
      if (err) {
        console.error(err);
        reject(err);
      } else {
        resolve([new Buffer(data).toString('base64'), index]);
      }
    });
  }).catch((err) => ['', index]);
}

export const getMetadata = async (req, res) => {
  try {
    const { body: html, url } = await got(req.query.link);
    const metadata = await metascraper({ html, url });// .then((result) => {metadata = result})
    return res.status(200).json({
      status: 200,
      data: {
        link: req.query.link,
        metadata,
      },
    });
  } catch (err) {
    return handleError(err, res);
  }
};

export const getAllPosts = async (req, res) => {
  let posts;
  const promises = [];
  try {
    const query = {
      user_id: ObjectId(req.user._id),
      status: 1,
    };
    // if (!req.query.logs) {
    //   query.reviewed = false
    //   query.curated = false
    // } else{
    //   query['$or'] = [{reviewed: true}, {curated: true}]
    // }
    if (req.query.logs) {
      query.$or = [{ reviewed: true }, { curated: true }];
    } else if (req.query.other) {
      query.reviewed = false;
      query.curated = false;
    }
    if (req.query.status > -1) {
      query.status = req.query.status;
    }

    if (req.query.scheduled) {
      posts = await Post.find(query).sort({ dateTime: 1 });
    } else if (req.query.fortnite) {
      query.createdAt = { $gte: new Date(new Date() - 14 * 60 * 60 * 24 * 1000) };
      posts = await Post.find(query).sort({ dateTime: 1 });
    } else {
      posts = await Post.find(query).sort({ dateTime: 1 });
    }
  } catch (err) {
    return handleError(err, res);
  }

  for (const index in posts) {
    if (typeof (posts[index].imagePath) !== 'undefined' && posts[index].imagePath.length > 0) {
      promises.push(readFromFile(posts[index], index));
    }
  }
  Promise.all(promises).then((result) => {
    // console.log(result)
    for (const i in result) {
      posts[result[i][1]].imagePath = result[i][0];
    }
    updateUserLogs('get all posts', req);

    return res.status(200).json({
      status: 200,
      message: `${posts.length} posts returned`,
      data: posts,
    });
  });
};

export const getPostCounts = async (req, res) => {
  let curationCount = 0;
  let reviewCount = 0;
  let scheduledCount = 0;
  const user = await User.findOne({ _id: req.user._id });
  const { brand_selected } = user;
  try {
    curationCount = await Post.aggregate([
      {
        $match: {
          status: 2,
          // Caused issues when a user post had a posting error and was moved to curation
          // curated: false,
          // reviewed: false,
          user_id: ObjectId(req.user._id),
          brand_selected: ObjectId(brand_selected),
        },
      },
      {
        $group: {
          _id: {
            paraphrasedContent: '$paraphrasedContent',
            link: '$link',
            dateTime: '$dateTime',
            search_id: '$search_id',
            brand_selected: '$brand_selected',
          },
        },
      },
      { $count: 'count' },
    ]);
    console.log(curationCount);
    curationCount = curationCount.length ? curationCount[0].count : 0;

    reviewCount = await Post.aggregate([
      {
        $match: {
          status: 1,
          reviewed: false,
          curated: false,
          user_id: ObjectId(req.user._id),
          brand_selected: ObjectId(brand_selected),
        },
      },
      {
        $group: {
          _id: {
            paraphrasedContent: '$paraphrasedContent',
            link: '$link',
            dateTime: '$dateTime',
            search_id: '$search_id',
            brand_selected: '$brand_selected',
          },
        },
      },
      { $count: 'count' },
    ]);
    reviewCount = reviewCount.length ? reviewCount[0].count : 0;

    scheduledCount = await Post.aggregate([
      {
        $match: {
          status: 0,
          user_id: ObjectId(req.user._id),
          brand_selected: ObjectId(brand_selected),
        },
      },
      {
        $group: {
          _id: {
            paraphrasedContent: '$paraphrasedContent',
            link: '$link',
            dateTime: '$dateTime',
            search_id: '$search_id',
            brand_selected: '$brand_selected',
          },
        },
      },
      { $count: 'count' },
    ]);
    scheduledCount = scheduledCount.length ? scheduledCount[0].count : 0;
    console.log('HERE',
      curationCount,
      reviewCount,
      scheduledCount);
  } catch (err) {
    console.error(err);
    handleError(err, res);
  }

  return res.status(200).json({
    status: 200,
    data: {
      curationCount,
      reviewCount,
      scheduledCount,
    },
  });
};

export const getAllBrandsPostCounts = async (req, res) => {
  const user = await User.findOne({ _id: req.user._id });
  const user_id = req.user._id;
  const brands = await Brand.find({
    user_id,
    status: 1,
  });
  const brandCounts = {};

  console.log(brands);

  for (let i = 0; i < brands.length; i++) {
    const brand = brands[i];
    try {
      let brandCount = await Post.aggregate([
        {
          $match: {
            $or: [
              {
                status: 2,
                curated: false,
                reviewed: false,
                user_id: ObjectId(user_id),
                brand_selected: ObjectId(brand._id),
              },
              {
                status: 1,
                reviewed: false,
                curated: false,
                user_id: ObjectId(user_id),
                brand_selected: ObjectId(brand._id),
              },
              {
                status: 0,
                user_id: ObjectId(user_id),
                brand_selected: ObjectId(brand._id),
              },
            ],
          },
        },
        {
          $group: {
            _id: {
              paraphrasedContent: '$paraphrasedContent',
              link: '$link',
              dateTime: '$dateTime',
              search_id: '$search_id',
              brand_selected: '$brand_selected',
            },
          },
        },
        { $count: 'count' },
      ]);
      console.log(brandCount);
      brandCount = brandCount.length ? brandCount[0].count : 0;
      console.log(typeof `${brand._id}`, `${brand._id}`, brandCount);
      brandCounts[`${brand._id}`] = brandCount;
      console.log(brandCounts);
    } catch (err) {
      brandCounts[`${brand._id}`] = 0;
      console.error(err);
    }
  }

  console.log('BRAND COUNTS', brandCounts);

  return res.status(200).json({
    status: 200,
    data: brandCounts,
  });
};

export const getAllEvents = async (req, res) => {
  let events = [];
  try {
    events = await Event.find({});
  } catch (err) {
    handleError(err, res);
  }

  return res.status(200).json({
    status: 200,
    message: `${events.length} posts returned`,
    data: events,
  });
};

// db.postlogs.aggregate([
//   {
//     $match: {
//       $or: [
//         {
//           status: 2,
//           curated: false,
//           reviewed: false,
//           user_id: ObjectId(user_id),
//           brand_selected: ObjectId(brand_selected)
//         },
//         {
//           status: 1,
//           reviewed: false,
//           curated: false,
//           user_id: ObjectId(user_id),
//           brand_selected: ObjectId(brand_selected)
//         },
//         {
//           status: 0,
//           user_id: ObjectId(user_id),
//           brand_selected: ObjectId(brand_selected)
//         }
//       ]
//     }
//   },
//   {
//     "$group": {
//       "_id": {
//         'paraphrasedContent': '$paraphrasedContent',
//         'link': '$link',
//         'dateTime': '$dateTime',
//         'search_id': '$search_id',
//         'brand_selected': '$brand_selected'
//       }
//     }
//   },
//   { $count: 'count' }
// ])
