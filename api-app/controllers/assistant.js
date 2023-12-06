import mongoose from 'mongoose';
import fs from 'fs';
import child_process from 'child_process';
import User from '../models/userModel';
import Search from '../models/searchModel';
import Post from '../models/postModel';
import linkedinAccount from '../models/linkedinAccountModel';
import { trackApiEvent } from './tracking';

import { setHours1, handleError, updateUserLogs } from '../scripts/helper';

const { ObjectId } = mongoose.Types;

const { spawn } = child_process;
// const path = '/var/www/html/Algorithms/RSS/googlenews.py'

const googleNews = (keyword, locations = '') => new Promise((resolve, reject) => {
  fs.access(`${process.env.PYTHONPATH}marketmate/rss/googlenews.py`, fs.F_OK, async (err) => {
    if (err) {
      console.error(err);
      reject(err);
    }

    spawn('python3', ['-m', 'marketmate.rss.googlenews', keyword, locations]);
    // console.log('python3', path, keyword, locations)
  });
});

export const createAssistant = async (req, res) => {
  if (!req.body) {
    return res.status(400).json({
      status: 400,
      message: 'A request body is required',
    });
  }

  const user = await User.findOne({ _id: req.user._id }).populate('planKey');

  const searches = await Search.findWithoutArchived({ user_id: req.user._id });
  const totalPostsPerDay = searches.map((search) => search.totalPostsPerDay * search.daysToRun.length).reduce((a, b) => a + b, 0);
  const newTotalPosts = totalPostsPerDay + parseInt(req.body.totalPostsPerDay) * parseInt(req.body.daysToRun.length);

  if (newTotalPosts > user.planKey.totalPostsPerWeek) {
    return res.status(400).json({
      reason: 'max-posts-reached',
      message: `Creating this assistant puts you over your maximum post count per week of ${user.planKey.totalPostsPerWeek}. You have ${user.planKey.totalPostsPerWeek - totalPostsPerDay} post per week remaining.`,
      status: 400,
    });
  }

  let postToPersonal = false;
  if (typeof (req.body.linkedAccount_id) === 'undefined' || req.body.linkedAccount_id.length < 1) {
    postToPersonal = false;
  } else {
    postToPersonal = true;
  }
  const assistantData = {
    name: req.body.name,
    keyword: req.body.keyword,
    keywordBool: req.body.keywordBool || 'OR',
    bannedList: req.body.bannedList || [],
    bannedSources: req.body.bannedSources || [],
    locations: req.body.locations || [],
    sinceTime: req.body.sinceTime,
    startTime: req.body.startTime,
    operatingWindow: req.body.operatingWindow || 1,
    daysToRun: req.body.daysToRun,
    similarityMetric: 60,
    sentimentMetric: -0.5,
    totalPostsPerDay: req.body.totalPostsPerDay,
    curation: req.body.curation || false,
    twitterAccount_id: req.body.twitterAccount_id.map((id) => ObjectId(id)) || [],
    linkedinAccount_id: req.body.linkedinAccount_id.map((id) => ObjectId(id)) || [],
    facebookAccount_id: req.body.facebookAccount_id.map((id) => ObjectId(id)) || [],
    user_id: req.user._id,
    linkedinAccountPage_ids: req.body.linkedinAccountPage_ids,
    post_to_linkedin_personal: postToPersonal,
    paymentDefaulter: false,
    archived: false,
    brand_selected: ObjectId(req.body.brand_selected),
  };

  try {
    googleNews(req.body.keyword.join(','), req.body.locations.join(','));
  } catch (err) {
    console.log(err);
  }

  try {
    const assistant = new Search(assistantData);

    await assistant.save();
  } catch (err) {
    handleError(err, res);
  }

  updateUserLogs('User created assistant', req);
  trackApiEvent('Saved Assistant', req.user._id);
  if (
    (req.body.keywordBool && req.body.keywordBool === 'AND')
    || (req.body.bannedList && req.body.bannedList.length)
    || (req.body.bannedSources && req.body.bannedSources.length)
    || (req.body.locations && req.body.locations.length)
    || (req.body.sinceTime && req.body.sinceTime != 72)
  ) {
    trackApiEvent('Utilised Advance Search', req.user._id);
  }

  return res.status(201).json({
    message: 'You have succesfully created an assistant',
    status: 201,
  });
};

export const getAllAssistants = async (req, res) => {
  let assistants;

  try {
    const query = { user_id: req.user._id };
    if (req.query.archived === 'true') {
      query.archived = true;
    }
    assistants = await Search.find(query);
  } catch (err) {
    handleError(err, res);
  }

  updateUserLogs('get all assistants', req);

  return res.status(200).json({
    status: 200,
    message: `${assistants.length} assistants returned`,
    data: assistants,
  });
};

export const updateAssistant = async (req, res) => {
  try {
    const user = await User.findOne({ _id: req.user._id }).populate('planKey');

    const searches = await Search.findWithoutArchived({ user_id: req.user._id, _id: { $ne: req.params.id } });
    const totalPostsPerDay = searches.map((search) => search.totalPostsPerDay * search.daysToRun.length).reduce((a, b) => a + b, 0);
    const newTotalPosts = totalPostsPerDay + parseInt(req.body.totalPostsPerDay) * parseInt(req.body.daysToRun.length);

    if (newTotalPosts > user.planKey.totalPostsPerWeek) {
      return res.status(400).json({
        reason: 'max-posts-reached',
        message: `Creating this assistant puts you over your maximum post count per week of ${user.planKey.totalPostsPerWeek}. You have ${user.planKey.totalPostsPerWeek - totalPostsPerDay} posts per week remaining.`,
        status: 400,
      });
    }

    let postToPersonal = false;
    if (typeof (req.body.linkedAccount_id) === 'undefined' || req.body.linkedAccount_id.length < 1) {
      postToPersonal = false;
    } else {
      postToPersonal = true;
    }

    const assistant = await Search.findOneAndUpdate({ _id: req.params.id }, {
      name: req.body.name,
      keyword: req.body.keyword,
      keywordBool: req.body.keywordBool || 'OR',
      bannedList: req.body.bannedList || [],
      bannedSources: req.body.bannedSources || [],
      locations: req.body.locations || [],
      sinceTime: req.body.sinceTime,
      startTime: req.body.startTime,
      operatingWindow: req.body.operatingWindow || 1,
      daysToRun: req.body.daysToRun,
      totalPostsPerDay: req.body.totalPostsPerDay,
      twitterAccount_id: req.body.twitterAccount_id.map((id) => ObjectId(id)) || [],
      linkedinAccount_id: req.body.linkedinAccount_id.map((id) => ObjectId(id)) || [],
      facebookAccount_id: req.body.facebookAccount_id.map((id) => ObjectId(id)) || [],
      curation: req.body.curation || false,
      linkedinAccountPage_ids: req.body.linkedinAccountPage_ids,
      post_to_linkedin_personal: postToPersonal,
      archived: false,
      brand_selected: ObjectId(req.body.brand_selected),
    });
    try {
      googleNews(req.body.keyword.join(','), req.body.locations.join(','));
    } catch (err) {
      console.log(err);
    }
    if (!assistant) {
      res.status(404).json({
        status: 404,
        message: 'No assistant found',
      });
    }
  } catch (err) {
    return handleError(err, res);
  }

  updateUserLogs('User updated assistant', req);
  trackApiEvent('Saved Assistant', req.user._id);
  if (
    (req.body.keywordBool && req.body.keywordBool === 'AND')
    || (req.body.bannedList && req.body.bannedList.length)
    || (req.body.bannedSources && req.body.bannedSources.length)
    || (req.body.locations && req.body.locations.length)
    || (req.body.sinceTime && req.body.sinceTime != 72)
  ) {
    trackApiEvent('Utilised Advance Search', req.user._id);
  }

  return res.status(200).json({
    status: 200,
    message: 'Updated assistant',
  });
};

export const updateAssistantBanned = async (req, res) => {
  try {
    const user = await User.findOne({ _id: req.user._id }).populate('planKey');

    const assistant = await Search.findOneAndUpdate({ _id: req.params.id }, {
      $addToSet: {
        bannedList: req.body.bannedWords || [],
        bannedSources: req.body.bannedLink || [],
      },
    });
    if (!assistant) {
      res.status(404).json({
        status: 404,
        message: 'Assistant not found',
      });
    }
  } catch (err) {
    return handleError(err, res);
  }

  return res.status(200).json({
    status: 200,
    message: 'Updated assistant',
  });
};

export const pauseAssistant = async (req, res) => {
  try {
    const assistant = await Search.findOneAndUpdate({ _id: req.params.id }, {
      pauseStatus: true,
    });

    if (!assistant) {
      res.status(404).json({
        status: 404,
        message: 'No assistant found',
      });
    }
  } catch (err) {
    return handleError(err, res);
  }

  updateUserLogs('User paused assistant', req);

  return res.status(200).json({
    status: 200,
    message: 'Paused assistant',
  });
};

export const playAssistant = async (req, res) => {
  try {
    const assistant = await Search.findOneAndUpdate({ _id: req.params.id }, {
      pauseStatus: false,
    });

    if (!assistant) {
      res.status(404).json({
        status: 404,
        message: 'No assistant found',
      });
    }
  } catch (err) {
    return handleError(err, res);
  }

  updateUserLogs('User played assistant', req);

  return res.status(200).json({
    status: 200,
    message: 'Played assistant',
  });
};

export const archiveAssistant = async (req, res) => {
  try {
    const keepPosts = req.params.keep === 'true';
    const assistant = await Search.findOneAndUpdate({ _id: req.params.id }, {
      archived: true,
      keepPosts,
    });

    // console.log('NOT KEEP', !req.params.keep)
    if (!keepPosts) {
      await Post.updateMany({ search_id: req.params.id, status: 0 }, { status: 2 });
    }

    if (!assistant) {
      res.status(404).json({
        status: 404,
        message: 'No assistant found',
      });
    }
  } catch (err) {
    return handleError(err, res);
  }

  updateUserLogs('User archived assistant', req);

  res.status(200).json({
    status: 200,
    message: 'Assistant archived',
  });
};
