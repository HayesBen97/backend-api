import mongoose from 'mongoose';
import TwitterAccount from '../models/twitterAccountModel';
import LinkedinAccount from '../models/linkedinAccountModel';
import FacebookAccount from '../models/facebookAccountModel';
import AccountStats from '../models/accountStats';
import Post from '../models/postModel';
import Search from '../models/searchModel';
import Brands from '../models/brandModel';
import User from '../models/userModel';
import { updateUserLogs, handleError } from '../scripts/helper';
import config from '../config';

const { ObjectId } = mongoose.Types;

const { FRONTEND_URL } = config;

export const removeAccount = async (req, res) => {
  try {
    if (req.body.linkedinAccountPage_ids) {
    }

    if (!req.body) {
      return res.status(400).json({
        status: 400,
        message: 'A request body is required',
      });
    }

    const user = await User.find({ _id: req.user._id }).lean();
    if (req.body.linkedinAccountPage_ids) {
      for (var key in req.body.linkedinAccountPage_ids) {
        const queryString = `linkedinAccountPage_ids.${key}`;
        for (const index in req.body.linkedinAccountPage_ids[key]) {
          const query = { $pull: { [`${queryString}`]: req.body.linkedinAccountPage_ids[key][index] } };
          Search.update({}, query, { multi: true, upsert: false }, (err) => {
            if (err) {
              console.log(err);
            }
          });
          LinkedinAccount.update({ _id: ObjectId(key) },
            { $pull: { pageIDs: { id: req.body.linkedinAccountPage_ids[key][index] } } }, { multi: true, upsert: false }, (err) => {
              if (err) {
                console.log(err);
              }
            });
          const postQuery = { linkedinAccountPage_id: req.body.linkedinAccountPage_ids[key][index] };
          Post.deleteMany(postQuery, (err) => {
            if (err) {
              console.log(err);
            }
          });
        }
      }
    } else if (typeof (req.body.twitterAccount_id) === 'undefined'
    && typeof (req.body.facebookAccount_id) === 'undefined') {
      const accountQuery = { _id: ObjectId(req.body.linkedinAccount_id) };
      const otherQuery = { linkedinAccount_id: ObjectId(req.body.linkedinAccount_id) };
      LinkedinAccount.deleteOne(accountQuery, (err) => {
        if (err) {
          console.log(err);
        }
      });
      Post.deleteMany(otherQuery, (err) => {
        if (err) {
          console.log(err);
        }
      });
      Search.update({}, { $pull: otherQuery }, { multi: true, upsert: false }, (err) => {
        if (err) {
          console.log(err);
        }
      });
    } else if (typeof (req.body.linkedinAccount_id) === 'undefined'
      && typeof (req.body.facebookAccount_id) === 'undefined') {
      const accountQuery = { _id: ObjectId(req.body.twitterAccount_id) };
      const otherQuery = { twitterAccount_id: ObjectId(req.body.twitterAccount_id) };
      TwitterAccount.deleteOne(accountQuery, (err) => {
        if (err) {
          console.log(err);
        }
      });
      Post.deleteMany(otherQuery, (err) => {
        if (err) {
          console.log(err);
        }
      });
      Search.update({}, { $pull: otherQuery }, { multi: true, upsert: false }, (err) => {
        if (err) {
          console.log(err);
        }
      });
    } else {
      const accountQuery = { _id: ObjectId(req.body.facebookAccount_id) };
      const otherQuery = { facebookAccount_id: ObjectId(req.body.facebookAccount_id) };
      FacebookAccount.deleteOne(accountQuery, (err) => {
        if (err) {
          console.log(err);
        }
      });
      Post.deleteMany(otherQuery, (err) => {
        if (err) {
          console.log(err);
        }
      });
      Search.update({}, { $pull: otherQuery }, { multi: true, upsert: false }, (err) => {
        if (err) {
          console.log(err);
        }
      });
    }

    const accountQuery = { user_id: ObjectId(req.user._id) };
    const assistants = await Search.find({
      $and: [accountQuery, { facebookAccount_id: { $size: 0 } },
        { linkedinAccount_id: { $size: 0 } }, { twitterAccount_id: { $size: 0 } }],
    }, (err) => {
      if (err) {
        console.log(err);
      }
    });
    for (const item in assistants) {
      if (typeof (assistants[item].linkedinAccountPage_ids) === 'undefined' || Object.entries(assistants[item].linkedinAccountPage_ids).length < 1) {
        Search.deleteOne({ _id: ObjectId(assistants[item]._id) }, (err) => {
          if (err) {
            console.log(err);
          }
        });
      } else {
        for (var key in assistants[item].linkedinAccountPage_ids) {
          if (assistants[item].linkedinAccountPage_ids[key].length < 1) {
            Search.deleteOne({ _id: ObjectId(assistants[item]._id) }, (err) => {
              if (err) {
                console.log(err);
              }
            });
          }
        }
      }
    }
  } catch (err) {
    console.log(err);
  }
};

export const purgeAccountLinks = async (req, res) => {
  try {
    if (!req.body) {
      return res.status(400).json({
        status: 400,
        message: 'A request body is required',
      });
    }

    const user = await User.find({ _id: req.user._id }).lean();
    if (req.params.type === 'linkedin_page') {
      const queryString = `linkedinAccountPage_ids.${req.params.linkedin_key}`;
      const query = { $pull: { [`${queryString}`]: Number(req.params.id) } };
      Search.update({}, query, { multi: true, upsert: false }, (err) => {
        if (err) {
          console.log('linkedinaccountpage_ids error', err);
        }
      });
      const postQuery = { linkedinAccountPage_id: req.params.id };
      Post.deleteMany(postQuery, (err) => {
        if (err) {
          console.log(err);
        }
      });
    } else if (req.params.type === 'linkedin') {
      const accountQuery = { _id: ObjectId(req.params.id) };
      const otherQuery = { linkedinAccount_id: ObjectId(req.params.id) };
      Post.deleteMany(otherQuery, (err) => {
        if (err) {
          console.log(err);
        }
      });
      Search.update({}, { $pull: otherQuery }, { multi: true, upsert: false }, (err) => {
        if (err) {
          console.log(err);
        }
      });
    } else if (req.params.type === 'twitter') {
      const accountQuery = { _id: ObjectId(req.params.id) };
      const otherQuery = { twitterAccount_id: ObjectId(req.params.id) };
      console.log('--------------------------twitter---------------------------------', accountQuery, otherQuery);
      Post.deleteMany(otherQuery, (err) => {
        if (err) {
          console.log(err);
        }
      });
      Search.update({}, { $pull: otherQuery }, { multi: true, upsert: false }, (err) => {
        if (err) {
          console.log(err);
        }
      });
    } else {
      const accountQuery = { _id: ObjectId(req.params.id) };
      const otherQuery = { facebookAccount_id: ObjectId(req.params.id) };
      Post.deleteMany(otherQuery, (err) => {
        if (err) {
          console.log(err);
        }
      });
      Search.update({}, { $pull: otherQuery }, { multi: true, upsert: false }, (err) => {
        if (err) {
          console.log(err);
        }
      });
    }

    const accountQuery = { user_id: ObjectId(req.user._id) };
    const assistants = await Search.find({
      $and: [accountQuery, { facebookAccount_id: { $size: 0 } },
        { linkedinAccount_id: { $size: 0 } }, { twitterAccount_id: { $size: 0 } }],
    }, (err) => {
      if (err) {
        console.log(err);
      }
    });
    for (const item in assistants) {
      if (typeof (assistants[item].linkedinAccountPage_ids) === 'undefined' || Object.entries(assistants[item].linkedinAccountPage_ids).length < 1) {
        Search.deleteOne({ _id: ObjectId(assistants[item]._id) }, (err) => {
          if (err) {
            console.log(err);
          }
        });
      } else {
        for (const key in assistants[item].linkedinAccountPage_ids) {
          if (assistants[item].linkedinAccountPage_ids[key].length < 1) {
            Search.deleteOne({ _id: ObjectId(assistants[item]._id) }, (err) => {
              if (err) {
                console.log(err);
              }
            });
          }
        }
      }
    }
  } catch (err) {
    console.log(err);
  }
};

export const getAllAccounts = async (req, res) => {
  let twitterAccounts; let linkedinAccounts; let
    facebookAccounts;

  try {
    twitterAccounts = await TwitterAccount.find({ user_id: req.user._id }, { oauthToken: 0, oauthTokenSecret: 0 });
  } catch (err) {
    return handleError(err, res);
  }

  try {
    linkedinAccounts = await LinkedinAccount.find({ user_id: req.user._id }, { oauthToken: 0 });
  } catch (err) {
    return handleError(err, res);
  }

  try {
    facebookAccounts = await FacebookAccount.find({ user_id: req.user._id }, { oauthToken: 0 });
  } catch (err) {
    return handleError(err, res);
  }

  updateUserLogs('get accounts', req);

  const accountsLength = twitterAccounts.concat(linkedinAccounts, facebookAccounts).length;
  return res.status(200).json({
    status: 200,
    message: `${accountsLength} accounts returned`,
    data: {
      TwitterAccounts: twitterAccounts,
      LinkedinAccounts: linkedinAccounts,
      FacebookAccounts: facebookAccounts,
    },
  });
};

export const updatePages = async (req, res) => {
  if (req.body[0] === 'empty') {
    req.body[1].forEach(async (item) => {
      await LinkedinAccount.findOneAndUpdate({ _id: ObjectId(item) }, { pageIDs: [], pagesSelected: true });
      await Brands.updateMany(
        { linkedinAccountPage_ids: { $elemMatch: { object_id: ObjectId(item) } } },
        { $pull: { linkedinAccountPage_ids: { object_id: ObjectId(item) } } },
        { upsert: false },
      );
    });
  } else {
    const account = await LinkedinAccount.findOneAndUpdate({ _id: req.body[0] }, { pageIDs: req.body[1], pagesSelected: true });
  }
  res.redirect(FRONTEND_URL);
};

export const pagesUpdates = async (req, res) => {
  if (req.body[0] === 'empty') {
    req.body[1].forEach(async (item) => {
      await LinkedinAccount.findOneAndUpdate({ _id: ObjectId(item) }, { pageIDs: [], pagesSelected: true });
      await Brands.updateMany(
        { linkedinAccountPage_ids: { $elemMatch: { object_id: ObjectId(item) } } },
        { $pull: { linkedinAccountPage_ids: { object_id: ObjectId(item) } } },
        { upsert: false },
      );
    });
  } else {
    const account = await LinkedinAccount.findOneAndUpdate({ _id: req.body[0] }, { pageIDs: req.body[1], pagesSelected: true });
  }
  req.body[1].forEach(async (item) => {
    const linkedinAccount = await LinkedinAccount.findOne({ _id: ObjectId(item) });
    if (linkedinAccount) {
      const pageIDs = linkedinAccount.pageIDs.map((page) => page.id);
      await Brands.updateMany(
        { linkedinAccountPage_ids: { $elemMatch: { object_id: ObjectId(item) } } },
        { $pull: { linkedinAccountPage_ids: { object_id: ObjectId(item), id: { $nin: pageIDs } } } },
        { upsert: false },
      );
    }
  });

  res.redirect(FRONTEND_URL);
};

export const getLinkedInPages = async (req, res) => {
  let linkedinPages;
  try {
    const query = { _id: ObjectId(req.user._id) };
    linkedinPages = await LinkedinAccount.find(query);
  } catch (err) {
    console.log(err);
  }

  return res.status(200).json({
    status: 200,
    message: `${linkedinPages.length} linkedinPages returned`,
    data: linkedinPages,
  });
};

export const getAccountStats = async (req, res) => {
  let accountStats;

  try {
    accountStats = await AccountStats.find({ account_id: req.params.id });
  } catch (err) {
    return handleError(err, res);
  }

  return res.status(200).json({
    status: 200,
    message: 'Account stats returned',
    data: accountStats,
  });
};

const getStats = async (brand) => {
  let tempStats;
  const statsArray = [];
  brand[0].twitterAccount_id.forEach(async (id) => {
    tempStats = [];
    tempStats = await AccountStats.find({ account_id: id, createdAt: { $gte: new Date(new Date() - 14 * 60 * 60 * 24 * 1000) } }).lean();
    statsArray.push(tempStats);
  });
  brand[0].facebookAccount_id.forEach(async (id) => {
    tempStats = [];
    tempStats = await AccountStats.find({ account_id: id, createdAt: { $gte: new Date(new Date() - 14 * 60 * 60 * 24 * 1000) } }).lean();
    statsArray.push(tempStats);
  });
  brand[0].linkedinAccount_id.forEach(async (id) => {
    tempStats = [];
    tempStats = await AccountStats.find({ account_id: id, createdAt: { $gte: new Date(new Date() - 14 * 60 * 60 * 24 * 1000) } }).lean();
    statsArray.push(tempStats);
  });
  brand[0].linkedinAccountPage_ids.forEach(async (page) => {
    tempStats = [];
    tempStats = await AccountStats.find({ account_id: page.object_id, createdAt: { $gte: new Date(new Date() - 14 * 60 * 60 * 24 * 1000) } }).lean();
    statsArray.push(tempStats);
  });

  return tempStats;
};
export const getFortniteStats = async (req, res) => {
  let accountStats;
  let statsArray = [];
  let brand;
  const tempStats = [];

  try {
    brand = await Brands.find({ _id: req.params.brand_id }).lean();
    statsArray = await getStats(brand);
  } catch (err) {
    return handleError(err, res);
  }

  return res.status(200).json({
    status: 200,
    message: 'Account stats returned',
    data: accountStats,
  });
};

export const getLinkedinFortnite = async (req, res) => {
  let accountStats;
  const { id, pageid } = req.params;
  try {
    // accountStats = await AccountStats.find({$and: [ {account_id: ObjectId(id)} , {page_id: pageid}]})
    accountStats = await AccountStats.find({ account_id: ObjectId(id), page_id: Number(pageid), createdAt: { $gte: new Date(new Date() - 14 * 60 * 60 * 24 * 1000) } });
  } catch (err) {
    return handleError(err, res);
  }

  return res.status(200).json({
    status: 200,
    message: 'Account stats returned',
    data: accountStats,
  });
};

export const getLinkedinStats = async (req, res) => {
  let accountStats;
  const { id, pageid } = req.params;
  try {
    // accountStats = await AccountStats.find({$and: [ {account_id: ObjectId(id)} , {page_id: pageid}]})
    accountStats = await AccountStats.find({ account_id: ObjectId(id), page_id: Number(pageid) });
  } catch (err) {
    return handleError(err, res);
  }

  return res.status(200).json({
    status: 200,
    message: 'Account stats returned',
    data: accountStats,
  });
};
