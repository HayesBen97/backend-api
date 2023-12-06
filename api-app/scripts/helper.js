import path from 'path';
import crypto from 'crypto';
import mongoose from 'mongoose';
import UserLogs from '../models/userLogsModel';

const { ObjectId } = mongoose.Types;

const password = (pass) => crypto.createHash('md5').update(pass).digest('hex');

const getRandomNumber = (range) => Math.floor(Math.random() * range);

const getRandomNum = () => {
  const chars = '0123456789';

  return chars.substr(getRandomNumber(10), 1);
};

const getRandomChar = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  return chars.substr(getRandomNumber(26), 1);
};

const randomID = (size) => {
  let str = '';

  for (let i = 0; i < size; i++) {
    if (i < 3) {
      str += getRandomChar();
    } else {
      str += getRandomNum();
    }
  }

  return str;
};

const handleError = (err, res, message = 'An error occured') => res.status(500).json({
  status: 500,
  message,
  data: {
    errorMessage: err.message,
  },
});

const setHours1 = (hour) => {
  const dt1 = new Date();

  dt1.setDate(dt1.getDate() + 1);
  dt1.setHours(hour, 0, 0);

  console.log('set hours', dt1);

  return dt1;
};

const updateUserLogs = async (msg, req) => {
  if (req.user) {
    const log = {
      pageName: msg,
      user_id: req.user._id,
    };

    try {
      const newLog = new UserLogs(log);
      console.log(newLog);
      await newLog.save();
    } catch (err) {
      console.error('Unable to save user logs', err.message);
    }
  }
};

export {
  password,
  randomID,
  handleError,
  setHours1,
  updateUserLogs,
};
