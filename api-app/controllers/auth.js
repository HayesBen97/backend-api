import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';

import passport from 'passport';
import { Strategy as TwitterStrategy } from 'passport-twitter';
import { Strategy as LinkedinStrategy } from 'passport-linkedin-oauth2';
import { Strategy as FacebookStrategy } from 'passport-facebook';
import request from 'request';
import axios from 'axios';
import {
  password as createPassword, handleError, updateUserLogs, randomID,
} from '../scripts/helper';
import User from '../models/userModel';
import Twitter from '../models/twitterAccountModel';
import LinkedinAccount from '../models/linkedinAccountModel';
import Facebook from '../models/facebookAccountModel';
import Brands from '../models/brandModel';

import { trackApiEvent } from './tracking';

import config from '../config';
import { sendVerificationEmail, sendWelcomeEmail, sendForgotPasswordEmail } from '../scripts/mailer';

const { ObjectId } = mongoose.Types;

const https = require('https');
const Hubspot = require('hubspot');

const {
  JWT_TOKEN,
  FRONTEND_URL,
  TWITTER_CONSUMER_KEY,
  TWITTER_CONSUMER_SECRET,
  TWITTER_CALLBACK_URL,
  LINKEDIN_CONSUMER_KEY,
  LINKEDIN_CONSUMER_SECRET,
  LINKEDIN_CALLBACK_URL,
  FACEBOOK_APP_ID,
  FACEBOOK_APP_SECRET,
  FACEBOOK_CALLBACK_URL,
  MAILCHIMP_API_KEY,
  MAILCHIMP_LIST,
  MAILCHIMP_URL,
  HUBSPOT_API_KEY,
} = config;

const hubspot = HUBSPOT_API_KEY ? new Hubspot({ apiKey: HUBSPOT_API_KEY }) : null;

const LINKEDIN_SUCCESS_URL = FRONTEND_URL.concat('/main/linkedinPages');
const REDIRECT = FRONTEND_URL.concat('/user/accounts');

export const login = async (req, res) => {
  if (!req.body) {
    return res.status(400).json({
      status: 400,
      message: 'Request body is missing',
    });
  }

  const { email1, password } = req.body;

  if (!email1 || !password) {
    return res.status(400).json({
      status: 400,
      message: 'Email address and password are required.',
    });
  }

  try {
    const user = await User.findOne({
      email1,
      password: createPassword(password),
    });

    if (!user) {
      return res.status(403).json({
        status: 403,
        message: 'Either the email address or password is incorrect',
      });
    }

    const capabilities = {
      admin: 0,
    };

    const userInfo = {
      activeUser: user.activeUser,
      _id: user._id,
      email1: user.email1,
      name: user.name,
      planKey: user.planKey,
      activeTutorial: user.activeTutorial || 'onboarding',
      tutorialStep: user.tutorialStep || 0,
      createdAt: user.createdAt,
      updatedat: user.updatedAt,
      brand_selected: user.brand_selected,
    };

    const token = jwt.sign({
      user: userInfo,
      name: user.name,
      capabilities,
    }, JWT_TOKEN);

    updateUserLogs('User Login', { user: { _id: userInfo._id } });

    return res.status(200).json({
      status: 200,
      message: 'Succesfully signed in',
      data: {
        userInfo,
        token,
      },
    });
  } catch (err) {
    console.log(err);
    return handleError(err, res);
  }
};

export const subscribe = async (email, name) => {
  // const data = { email_address: email,
  //                status: 'subscribed',
  //                merge_fields: {"FNAME": name},
  //                tags: ['14-Day Trial User'],
  //              };
  // await new Promise((resolve, reject) => {
  //   request.post( { uri: `${MAILCHIMP_URL}lists/${MAILCHIMP_LIST}/members/`,
  //   headers: {
  //      Authorization: `Basic ${`${MAILCHIMP_API_KEY}`.toString('base64')}`,
  //      Application: 'applications/json'
  //      }, json: true, body: data, }, (err, response, body) => {
  //     if (err){
  //       reject(err)
  //     } else {
  //       resolve(body);
  //     }
  //   })

  // })
  if (hubspot) {
    try {
      const properties = [
        { property: 'firstname', value: name },
        { property: 'plan_key', value: 'TRIAL' },
        { property: 'user_state', value: 'Entered Platform' },
      ];

      const result = await hubspot.contacts.createOrUpdate(email, { properties });
      console.log('Response from API', result);
    } catch (err) {
      console.error(err);
      console.error(err.message);
    }
  }

  // Make sure that it sets their tag to trail if they were already signed up
  // await new Promise((resolve, reject) => {
  //   const data = {
  //     tags: [
  //             {name: '14-Day Trial User', status: 'active'},
  //           ],
  //   };

  //   const subscriber_hash = crypto.createHash('md5').update(customer.email).digest('hex')

  //   request.post( { uri: `${MAILCHIMP_URL}lists/${MAILCHIMP_LIST}/members/${subscriber_hash}/tags`,
  //   headers: {
  //      Authorization: `Basic ${`${MAILCHIMP_API_KEY}`.toString('base64')}`,
  //      Application: 'applications/json'
  //      }, json: true, body: data, }, (err, response, body) => {
  //     if (err){
  //       reject(err)
  //     } else {
  //       resolve(body);
  //     }
  //   })

  // })
};

export const register = async (req, res) => {
  if (!req.body) {
    return res.status(400).json({
      status: 400,
      message: 'Request body is missing',
    });
  }
  const {
    email1,
    name,
    password,
    brand,
    referal,
    countryName,
  } = req.body;

  try {
    const foundUser = await User.findOne({
      email1,
    }, {
      name: 1,
      email1: 1,
    });

    if (foundUser) {
      return res.status(400).json({
        status: 400,
        message: 'A user already exists with this email address.',
      });
    }
  } catch (err) {
    return handleError(err, res);
  }

  try {
    const user = new User({
      email1,
      name,
      countryName,
      password: password ? createPassword(password) : null,
      planKey: ObjectId('5ddc0c8c718aac1e44dfaa2e'), // don't hardcode this in the future,
      endDate: new Date(Date.now() + 6048e5), // 7 days from now
      referal,
    });

    const newUser = await user.save();
    try {
      await sendVerificationEmail(email1, user._id);
    } catch (e) {
      return res.status(500).json({
        status: 500,
        message: 'There was an error sending the verification email',
      });
    }

    const capabilities = {
      admin: 0,
    };

    const brandData = {
      name: brand,
      twitterAccount_id: [],
      linkedinAccount_id: [],
      facebookAccount_id: [],
      linkedinAccountPage_ids: [],
      user_id: newUser._id,
    };
    let brand_selected;

    const myPromise = async () => {
      const brand = new Brands(brandData);
      let user;
      const brand_array = [];
      brand_array.push(brand);
      brand_selected = brand._id;
      await brand.save();

      user = await User.findOne({ _id: newUser._id });
      return new Promise((resolve, reject) => {
        brand_array.map(async (item) => {
          try {
            await user.update({ brand_selected: brand._id });
            user = User.findOne({ _id: newUser._id });
            resolve(brand);
          } catch (e) {
            console.log('error e', e);
          }
        });
      });
    };

    const callMyPromise = async () => {
      const result = await (myPromise());
      return result;
    };

    callMyPromise().then((result) => {
      console.log(result);
    });

    try {
      await subscribe(email1, name);
    } catch (e) {
    }
    const userInfo = {
      activeUser: newUser.activeuser,
      _id: newUser._id,
      email1: newUser.email1,
      planKey: user.planKey,
      activeTutorial: user.activeTutorial || 'onboarding',
      tutorialStep: user.tutorialStep || 0,
      name: newUser.name,
      createdAt: newUser.createdAt,
      updatedat: newUser.updatedAt,
      brand_selected,
    };

    const token = jwt.sign({
      user: userInfo,
      name: newUser.name,
      capabilities,
    }, JWT_TOKEN);

    try {
      updateUserLogs('register', { user: { _id: userInfo._id } });
    } catch (e) {
    }

    return res.status(201).json({
      message: 'You have succesfully signed up with MarketMate.',
      status: 201,
      data: {
        token,
        userInfo,
      },
    });
  } catch (err) {
    if (err.name === 'MongoError' && err.code === 11000) {
      return res.status(409).json({
        status: 409,
        message: 'Duplicate key',
        data: {
          errorMessage: err,
        },
      });
    }

    return handleError(err, res, 'Unable to save record.');
  }
};

export const verify = async (req, res) => {
  const { id } = req.params;

  let foundUser;
  try {
    foundUser = await User.findOneAndUpdate({ _id: ObjectId(id) }, {
      activeUser: true,
    });

    await sendWelcomeEmail(foundUser.email1);
    updateUserLogs('verified', { user: { _id: id } });
  } catch (err) {
    return handleError(err, res);
  }

  const userInfo = {
    activeUser: foundUser.activeuser,
    _id: foundUser._id,
    email1: foundUser.email1,
    name: foundUser.name,
    planKey: foundUser.planKey,
    activeTutorial: user.activeTutorial || 'onboarding',
    tutorialStep: user.tutorialStep || 0,
    createdAt: foundUser.createdAt,
    updatedat: foundUser.updatedAt,
  };
  const capabilities = {
    admin: 0,
  };
  const token = jwt.sign({
    user: userInfo,
    name: foundUser.name,
    capabilities,
  }, JWT_TOKEN);

  return res.status(201).json({
    message: 'You have verified your MarketMate account.',
    status: 201,
    data: {
      token,
      userInfo,
    },
  });
};

export const forgotPassword = async (req, res) => {
  const { email } = req.body;

  let foundUser;
  try {
    foundUser = await User.findOne({ email1: email });

    const password_string = randomID(10);

    await foundUser.update({
      password: createPassword(password_string),
    });
    await sendForgotPasswordEmail(foundUser.email1, password_string);
    updateUserLogs('requested forgot password', { user: { _id: foundUser._id } });
  } catch (err) {
    console.log(err);
  }

  return res.status(201).json({
    message: 'Forgot password requested',
    status: 201,
  });
};

const getPages = async (accessToken, facebookId) => {
  let pageResponse;
  try {
    pageResponse = await axios.get(`https://graph.facebook.com/me/accounts?access_token=${accessToken}`);
  } catch (e) {
    console.log(e);
  }

  pageResponse.data.data.map(async (account) => {
    const facebookAcc = await Facebook.findOne({ facebookId: account.id });
    if (!facebookAcc) {
      await Facebook.create({
        facebookId: account.id,
        oauthToken: account.access_token,
        displayName: account.name,
        parentFacebookId: facebookId,
      });
    }
  });
};

export const facebookCallback = async (req, res, next) => {
  if (req.query.denied) {
    return res.redirect(FRONTEND_URL);
  }

  let createdAccount;

  passport.use(
    new FacebookStrategy(
      {
        clientID: FACEBOOK_APP_ID,
        clientSecret: FACEBOOK_APP_SECRET,
        callbackURL: FACEBOOK_CALLBACK_URL,
      }, async (accessToken, refreshToken, profile, cb) => {
        const facebookAccount = await Facebook.findOne({
          facebookId: profile.id,
        });

        await getPages(accessToken, profile.id);

        const facebookData = {
          facebookId: profile.id,
          displayName: profile.displayName,
          oauthToken: accessToken,
        };

        if (facebookAccount) {
          // let redirectUrl = `${FRONTEND_URL}/auth/facebook/${facebookAccount.facebookId}`

          // return res.redirect(redirectUrl)\

          const test_brand = await Brands.findOne({ facebookAccount_id: facebookAccount._id });
          // /!test_brand will check for both null and undefined
          if (!test_brand || test_brand.length < 1) {
            res.redirect(FRONTEND_URL.concat('/user/accounts/true'));
          } else {
            res.redirect(FRONTEND_URL.concat(`/user/accounts/true/${test_brand._id}/facebook/${facebookAccount._id}`));
          }
          return;
          // return res.redirect(FRONTEND_URL.concat("/user/accounts/true"))
        }

        const newAccount = new Facebook(facebookData);

        createdAccount = await newAccount.save();

        const redirectUrl = `${FRONTEND_URL}/auth/facebook/${createdAccount.facebookId}`;

        return res.redirect(redirectUrl);
      },
    ),
  );

  passport.serializeUser((user, done) => {
    done(null, user);
  });

  passport.deserializeUser((user, done) => {
    done(null, user);
  });

  passport.initialize()(req, res, () => {
    passport.session()(req, res, () => {
      passport.authenticate('facebook', { scope: ['manage_pages', 'publish_pages'] })(req, res, next);
    });
  });

  // return res.redirect(`${FRONTEND_URL}`)
};
function sleep(milliseconds) {
  const date = Date.now();
  let currentDate = null;
  do {
    currentDate = Date.now();
  } while (currentDate - date < milliseconds);
}

export const twitterCallback = async (req, res, next) => {
  if (req.query.denied) {
    return res.redirect(FRONTEND_URL);
  }
  passport.use(new TwitterStrategy({
    consumerKey: TWITTER_CONSUMER_KEY,
    consumerSecret: TWITTER_CONSUMER_SECRET,
    callbackURL: TWITTER_CALLBACK_URL.queryStringURL,
    scope: ['r_emailaddress', 'r_liteprofile'],
  }, async (token, tokenSecret, profile, cb) => {
    try {
      const twitterAccount = await Twitter.findOne({
        twitterHandle: profile.username,
      });

      if (twitterAccount) {
        const test_brand = await Brands.findOne({ user_id: req.session.userId, twitterAccount_id: twitterAccount._id });
        if (typeof (test_brand) === 'undefined' || typeof (test_brand) === 'null' || test_brand.length < 1) {
          res.redirect(FRONTEND_URL.concat('/user/accounts/true'));
        } else {
          res.redirect(FRONTEND_URL.concat(`/user/accounts/true/${test_brand._id}/twitter/${twitterAccount._id}`));
        }
        return;
      }
      const twitterData = {
        twitterHandle: profile.username,
        oauthToken: token,
        oauthTokenSecret: tokenSecret,
        initialFollowersCount: profile._json.followers_count,
        initialFavouritesCount: profile._json.favourites_count,
        initialFriendsCount: profile._json.friends_count,
        initialStatusesCount: profile._json.statuses_count,
        fromAPIFollowersCount: profile._json.followers_count,
        fromAPIFavouritesCount: profile._json.favourites_count,
        fromAPIFriendsCount: profile._json.friends_count,
        fromAPIStatusesCount: profile._json.statuses_count,
        currentFavouritesCount: 0,
        currentFriendsCount: 0,
        currentStatusesCount: 0,
        twitterID: profile._json.id_str,
        user_id: req.session.userId,
      };

      const newAccount = new Twitter(twitterData);
      const createdAccount = await newAccount.save();
      trackApiEvent('Connected A Profile', req.session.userId);
      const user = await User.findOne({ _id: req.session.userId });
      const brand = await Brands.findOne({ _id: user.brand_selected });
      const brand_twitter = brand.twitterAccount_id;
      brand_twitter.push(createdAccount._id);
      await Brands.findOneAndUpdate({ _id: brand._id }, {
        twitterAccount_id: brand_twitter,
      });
      res.redirect(`${REDIRECT}`);
      return cb(null, createdAccount);
    } catch (err) {
      console.log(err);
      return cb(err);
    }
  }));

  passport.serializeUser((user, done) => {
    done(null, user);
  });

  passport.deserializeUser((user, done) => {
    done(null, user);
  });

  passport.initialize()(req, res, () => {
    passport.session()(req, res, () => {
      passport.authenticate('twitter', {})(req, res, next);
    });
  });
};

export const linkedinCallback = async (req, res, next) => {
  const userID = req.query.userId || '';
  const queryStringURL = `?userId=${userID}`;

  if (req.query.denied) {
    return res.redirect(FRONTEND_URL);
  }

  passport.use(new LinkedinStrategy({
    clientID: LINKEDIN_CONSUMER_KEY,
    clientSecret: LINKEDIN_CONSUMER_SECRET,
    callbackURL: LINKEDIN_CALLBACK_URL + queryStringURL,
    scope: ['r_emailaddress', 'r_liteprofile', 'w_member_social', 'r_organization_social', 'w_organization_social', 'rw_organization_admin'],
  }, async (accessToken, refreshToken, profile, done) => {
    const linkedinid = profile.id;
    const { displayName } = profile;
    const user_email = profile.emails[0].value;
    const pages_for_brand = [];
    console.log('liref', refreshToken);

    LinkedinAccount.findOne({
      linkedinID: linkedinid,
    }, (err, account) => {
      if (err) {
        //  around here to do for duplicate accounts
        console.error(err);
        return done(err);
      }
      if (account) {
        console.log('found account');
        const updatedData = {};
        updatedData.oauthToken = accessToken;
        const options = {
          host: 'api.linkedin.com',
          path: '/v2/organizationalEntityAcls?q=roleAssignee&role=ADMINISTRATOR&state=APPROVED&projection=(*,elements*(*,organizationalTarget~(*)))',
          method: 'GET',
          headers: {
            Authorization: `Bearer ${updatedData.oauthToken}`,
          },
        };
        const pageRequest = https.request(options, (res) => {
          let data = '';
          res.on('data', (chunk) => {
            data += chunk;
          });

          res.on('end', async () => {
            const pageData = JSON.parse(data);
            const pageIdArray = [];
            pageData.elements.forEach((element) => {
              pageIdArray.push({
                name: element['organizationalTarget~'].localizedName,
                id: element['organizationalTarget~'].id,
              });
            });

            updatedData.pageIDs = pageIdArray;
            if (typeof (updatedData.pageIDs) !== 'undefined' || updatedData.pageIDs.length > 0) {
              updatedData.pagesSelected = false;
            } else {
              updatedData.pagesSelected = true;
            }

            const createdAccount = await LinkedinAccount.findOneAndUpdate({ _id: account._id }, updatedData, (err, linkedin_account) => done(null, linkedin_account));
            const myPromise = async () => {
              const brand_array = [];
              const c_Account = await LinkedinAccount.find({ linkedinID: linkedinid }).lean();
              let user = await User.findOne({ _id: userID });
              const brand = await Brands.findOne({ _id: user.brand_selected }).lean();
              const brand_linkedin = brand.linkedinAccount_id;
              const brand_linkedin_pages = brand.linkedinAccountPage_ids || [];
              let newPage = false;
              pageIdArray.forEach((page) => {
                const brandLinkedinPageIds = brand_linkedin_pages.map(
                  (linkledinPage) => linkledinPage.id,
                );
                if (!brandLinkedinPageIds.includes(page.id)) {
                  newPage = true;
                  brand_linkedin_pages.push({
                    displayName: page.name,
                    _id: page.id,
                    id: page.id,
                    object_id: c_Account[0]._id,
                    page: true,
                    linkedinID: linkedinid,
                  });
                }
              });
              if (!newPage) {
                LinkedinAccount.findOneAndUpdate({ _id: account._id },
                  { pagesSelected: true });
              }
              brand_linkedin.push(c_Account[0]._id);
              await Brands.findOneAndUpdate({ _id: brand._id }, {
                linkedinAccount_id: brand_linkedin,
                linkedinAccountPage_ids: brand_linkedin_pages,
              });
              return new Promise((resolve, reject) => {
                brand_array.map(async (item) => {
                  try {
                    await user.update({ brand_selected: brand._id });
                    user = User.findOne({ _id: userId });
                    resolve(brand);
                  } catch (e) {
                    console.log('error e', e);
                  }
                });
              });
            };

            const callMyPromise = async () => {
              const result = await (myPromise());
              return result;
            };

            callMyPromise().then((result) => {
              console.log('final result', result);
              return res.status(201).json({
                message: 'You have succesfully updated your account',
                status: 201,
                data: result,
              });
            });
          });
        });
        pageRequest.end();
      } else {
        const data_for_new_account = {};
        data_for_new_account.user_id = ObjectId(userID);
        data_for_new_account.displayName = displayName;
        data_for_new_account.oauthToken = accessToken;
        data_for_new_account.email = user_email;
        data_for_new_account.provider = profile.provider;
        data_for_new_account.linkedinID = linkedinid;
        data_for_new_account.automatedPosts = 0;
        const options = {
          host: 'api.linkedin.com',
          path: '/v2/organizationalEntityAcls?q=roleAssignee&role=ADMINISTRATOR&state=APPROVED&projection=(*,elements*(*,organizationalTarget~(*)))',
          method: 'GET',
          headers: {
            Authorization: `Bearer ${data_for_new_account.oauthToken}`,
          },
        };
        const pageRequest = https.request(options, (res) => {
          let data = '';
          res.on('data', (chunk) => {
            data += chunk;
          });

          res.on('end', async () => {
            const pageData = JSON.parse(data);
            const pageIdArray = [];
            pageData.elements.forEach((element) => {
              pageIdArray.push({
                name: element['organizationalTarget~'].localizedName,
                id: element['organizationalTarget~'].id,
              });
            });

            data_for_new_account.pageIDs = pageIdArray;
            if (typeof (data_for_new_account.pageIDs) !== 'undefined' || data_for_new_account.pageIDs.length > 0) {
              data_for_new_account.pagesSelected = false;
            } else {
              data_for_new_account.pagesSelected = true;
            }

            const newLinkedinAccount = new LinkedinAccount(data_for_new_account);
            const createdAccount = await newLinkedinAccount.save((err, linkedin_account) => done(null, linkedin_account));
            trackApiEvent('Connected A Profile', userID);
            const myPromise = async () => {
              const brand_array = [];
              const c_Account = await LinkedinAccount.find({ linkedinID: linkedinid }).lean();
              let user = await User.findOne({ _id: userID });
              const brand = await Brands.findOne({ _id: user.brand_selected }).lean();
              const brand_linkedin = brand.linkedinAccount_id;
              const brand_linkedin_pages = brand.linkedinAccountPage_ids || [];
              pageIdArray.forEach((page) => {
                brand_linkedin_pages.push({
                  displayName: page.name, _id: page.id, id: page.id, object_id: c_Account[0]._id, page: true, linkedinID: linkedinid,
                });
              });
              brand_linkedin.push(c_Account[0]._id);
              await Brands.findOneAndUpdate({ _id: brand._id }, {
                linkedinAccount_id: brand_linkedin,
                linkedinAccountPage_ids: brand_linkedin_pages,
              });
              return new Promise((resolve, reject) => {
                brand_array.map(async (item) => {
                  try {
                    await user.update({ brand_selected: brand._id });
                    user = User.findOne({ _id: userId });
                    resolve(brand);
                  } catch (e) {
                    console.log('error e', e);
                  }
                });
              });
            };

            const callMyPromise = async () => {
              const result = await (myPromise());
              return result;
            };

            callMyPromise().then((result) => {
              console.log('final result', result);
              return res.status(201).json({
                message: 'You have succesfully created an brand',
                status: 201,
                data: result,
              });
            });
            /*
                let user = await User.findOne({ _id: req.session.userId })
                let brand = await Brands.findOne({ _id: user.brand_selected })
                let brand_linkedin = brand.linkedinAccount_id
                let brand_linkedin_pages = brand.LinkedinAccountPage_ids
                brand_linkedin.push(createdAccount._id)
                pageIdArray.forEach(page => {
                  brand_linkedin_pages.push({displayName: page.name, _id: page.id, id: page.id, object_id: createdAccount._id, page: true, linkedinID: createdAccount.linkedinID})
                })
                await Brands.findOneAndUpdate({ _id: brand._id }, {
                  linkedinAccount_id: brand_linkedin,
                linkedinAccountPage_ids: brand_linkedin_pages
              })
                */
          });
        });

        pageRequest.end();
      }
    });
  }));

  passport.serializeUser((user, done) => {
    done(null, user);
  });

  passport.deserializeUser((user, done) => {
    done(null, user);
  });

  passport.initialize()(req, res, () => {
    passport.session()(req, res, () => {
      passport.authenticate('linkedin', {
        state: 'MARKETMATE!@#$%^',
        successRedirect: LINKEDIN_SUCCESS_URL,
        failureRedirect: FRONTEND_URL,
      })(req, res, next);
    });
  });
};

export const authenticateWithLinkedIn = async (req, res, next) => {
  const userID = req.query.userId || '';
  const queryStringURL = `?userId=${userID}`;

  passport.use(
    new LinkedinStrategy(
      {
        clientID: LINKEDIN_CONSUMER_KEY,
        clientSecret: LINKEDIN_CONSUMER_SECRET,
        callbackURL: LINKEDIN_CALLBACK_URL + queryStringURL,
        scope: ['r_emailaddress', 'r_liteprofile', 'w_member_social', 'r_organization_social', 'w_organization_social', 'rw_organization_admin'],
      }, () => {},
    ),
  );

  req.session.userId = req.query.userId;
  passport.serializeUser((user, done) => {
    done(null, user);
  });

  passport.deserializeUser((user, done) => {
    done(null, user);
  });

  passport.initialize()(req, res, () => {
    passport.session()(req, res, () => {
      passport.authenticate('linkedin', { state: 'MARKETMATE!@#$%^' })(req, res, next);
    });
  });
};

export const authenticateWithTwitter = async (req, res, next) => {
  const userID = req.query.userId || '';
  const queryStringURL = `?userId=${userID}`;

  passport.use(
    new TwitterStrategy(
      {
        consumerKey: TWITTER_CONSUMER_KEY,
        consumerSecret: TWITTER_CONSUMER_SECRET,
        callbackURL: TWITTER_CALLBACK_URL.queryStringURL,
        scope: ['r_emailaddress', 'r_liteprofile'],
      }, () => {},
    ),
  );

  req.session.userId = req.query.userId;
  passport.serializeUser((user, done) => {
    done(null, user);
  });

  passport.deserializeUser((user, done) => {
    done(null, user);
  });

  passport.initialize()(req, res, () => {
    passport.session()(req, res, () => {
      passport.authenticate('twitter', {})(req, res, next);
    });
  });
};

export const authenticateWithFacebook = async (req, res, next) => {
  passport.use(
    new FacebookStrategy(
      {
        clientID: FACEBOOK_APP_ID,
        clientSecret: FACEBOOK_APP_SECRET,
        callbackURL: FACEBOOK_CALLBACK_URL,
      }, () => {},
    ),
  );

  passport.serializeUser((user, done) => {
    done(null, user);
  });
  passport.deserializeUser((user, done) => {
    done(null, user);
  });

  passport.initialize()(req, res, () => {
    passport.session()(req, res, () => {
      passport.authenticate('facebook', { scope: ['manage_pages', 'publish_pages'] })(req, res, next);
    });
  });
};

export const refreshToken = async (req, res, next) => {
  const authHeader = req.header('Authorization');

  if (!authHeader) {
    return res.status(403).json({
      status: 403,
      reason: 'no-login',
      message: 'You must be authenticated to access this resource',
    });
  }

  try {
    const token = authHeader.split(' ')[1];

    const decodedToken = jwt.verify(token, JWT_TOKEN, { ignoreExpiration: true });

    const { email1 } = decodedToken.user;

    const user = await User.findOne({
      email1,
    });

    if (!user) {
      return res.status(500).json({
        status: 500,
        message: 'Unable to refresh token',
      });
    }

    const userInfo = {
      activeUser: user.activeUser,
      _id: user._id,
      email1: user.email1,
      name: user.name,
      planKey: user.planKey,
      activeTutorial: user.activeTutorial || 'onboarding',
      tutorialStep: user.tutorialStep || 0,
      createdAt: user.createdAt,
      updatedat: user.updatedAt,
    };

    const newToken = jwt.sign({
      user: userInfo,
      name: user.name,
      capabilities: decodedToken.capabilities,
    }, JWT_TOKEN);

    return res.status(200).json({
      status: 200,
      message: 'Token refreshed',
      data: {
        token: newToken,
        userInfo,
      },
    });
  } catch (err) {
    return handleError(err, res);
  }
};

export const linkAccounts = async (req, res, next) => {
  const { facebookId, userId } = req.body;

  if (!facebookId || !userId) {
    return res.status(400).json({
      status: 400,
      message: 'Missing either the facebookId or the userId',
    });
  }

  let facebookAccount;
  try {
    facebookAccount = await Facebook.findOneAndUpdate({ facebookId }, {
      user_id: ObjectId(userId),
    });

    await Facebook.updateMany({ parentFacebookId: facebookId }, { $set: { user_id: ObjectId(userId) } });
    trackApiEvent('Connected A Profile', userId);
  } catch (e) {
    console.log(e);
    handleError(e, res);
  }

  const myPromise = async () => {
    const createdAccount = await Facebook.find({ $or: [{ facebookId }, { parentFacebookId: facebookId }] },
      (err, result) => {
        if (err) {
          console.log(err);
        } else {
          console.log('ye');
        }
      }).lean();
    let user = await User.findOne({ _id: userId });
    const brand = await Brands.findOne({ _id: user.brand_selected }).lean();
    const brand_facebook = brand.facebookAccount_id;
    createdAccount.forEach((account) => {
      brand_facebook.push(account._id);
    });
    await Brands.findOneAndUpdate({ _id: brand._id }, {
      facebookAccount_id: brand_facebook,
    });
    return new Promise((resolve, reject) => {
      brand_array.map(async (item) => {
        try {
          await user.update({ brand_selected: brand._id });
          user = User.findOne({ _id: userId });
          resolve(brand);
        } catch (e) {
          console.log('error e', e);
        }
      });
    });
  };

  const callMyPromise = async () => {
    const result = await (myPromise());
    return result;
  };

  callMyPromise().then((result) => res.status(201).json({
    message: 'You have succesfully created an brand',
    status: 201,
    data: result,
  }));

  return res.status(201).json({
    status: 201,
    message: 'Linked accounts',
    data: facebookAccount,
  });
};
