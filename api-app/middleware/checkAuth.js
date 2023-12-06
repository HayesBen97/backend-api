import set from 'lodash.set';
import jwt from 'jsonwebtoken';

import config from '../config';
import User from '../models/userModel';
import Plan from '../models/planModel';
import { handleError } from '../scripts/helper';

const { JWT_TOKEN } = config;

const checkAuth = async (req, res, next) => {
  const authHeader = req.header('Authorization');
  let token;

  if (authHeader) {
    token = authHeader.split(' ')[1];
  } else {
    return res.status(403).json({
      status: 403,
      reason: 'no-login',
      message: 'You must be authenticated to access this resource',
    });
  }

  let decodedToken;
  try {
    decodedToken = jwt.verify(token, JWT_TOKEN);
  } catch (e) {
    switch (e.message) {
      case 'jwt expired':
        return res.status(403).json({
          status: 403,
          reason: 'expired-token',
          message: 'Your token has expired',
        });
      default:
        return res.status(403).json({
          status: 403,
          reason: 'unverify-token',
          message: 'There was an error verifying you token',
        });
    }
  }

  let user;
  try {
    user = await User.findOne({ _id: decodedToken.user._id })
      .populate('planKey');
  } catch (err) {
    return handleError(err, res);
  }

  if (!user) {
    return res.status(403).json({
      status: 403,
      reason: 'no-login',
      message: 'You must be authenticated to access this resource',
    });
  }

  if (!user.activeUser) {
    return res.status(403).json({
      status: 403,
      reason: 'inactive',
      message: 'This user account is inactive',
    });
  }

  if (user.planKey && (user.endDate >= new Date())) {
    // On a plan, plan is still active
    set(req, 'user', user);
    next();
  } else {
    // Plan is expired, lets see if it was a trial
    if (user.planKey.planKey === 'Trial') {
      // Trial has expired
      return res.status(403).json({
        status: 403,
        reason: 'trial-expired',
        message: 'This users trial has expired',
      });
    }

    // Otherwise the plan has expired
    return res.status(403).json({
      status: 403,
      reason: 'plan-expired',
      message: 'This users plan has expired',
    });
  }
};

export default checkAuth;
