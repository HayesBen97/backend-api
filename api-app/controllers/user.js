import mongoose from 'mongoose';
import User from '../models/userModel';

import { handleError, password as createPassword } from '../scripts/helper';

const { ObjectId } = mongoose.Types;

export const updateUserProfile = async (req, res) => {
  console.log('update user profile', req.body);
  if (!req.body) {
    return res.status(400).json({
      status: 400,
      message: 'You must provide a body',
    });
  }

  let user;
  try {
    user = await User.findOne({ _id: req.user._id });
  } catch (err) {
    return handleError(err, res);
  }

  try {
    await user.update({
      name: req.body.name,
      email1: req.body.email1,
      brand_selected: req.body.brand_selected,
    });
  } catch (err) {
    return handleError(err, res);
  }

  if (req.body.password && req.body.password !== '') {
    if (req.body.password !== req.body.passwordConfirm) {
      return res.status(400).json({
        status: 400,
        message: 'Passwords must match',
      });
    }

    try {
      await user.update({
        password: createPassword(req.body.password),
      });
    } catch (err) {
      return handleError(err, res);
    }
  }

  try {
    user = await User.findOne({ _id: req.user._id }).populate('planKey');
  } catch (err) {
    console.log(err);
    return handleError(err, res);
  }

  return res.status(201).json({
    message: 'User updated succesfully',
    data: user,
  });
};

export const updateTutorialStep = async (req, res) => {
  // Possible tutorial keys [onboarding, adding_accounts, assistant_creation]
  const { tutorial, step } = req.params;

  try {
    await User.findOneAndUpdate({ _id: req.user._id }, {
      activeTutorial: tutorial,
      tutorialStep: step,
    });
  } catch (err) {
    return handleError(err, res);
  }

  return res.status(200).json({
    message: 'User tutorial step updated',
  });
};

export const getUserProfile = async (req, res) => {
  let user;
  try {
    user = await User.findOne({ _id: req.user._id }).populate('planKey');
  } catch (err) {
    return handleError(err, res);
  }

  return res.status(201).json({
    message: 'User retrieved succesfully',
    data: user,
  });
};
