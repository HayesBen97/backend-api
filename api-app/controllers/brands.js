import mongoose from 'mongoose';
import Brands from '../models/brandModel';
import User from '../models/userModel';
import { updateUserLogs, handleError } from '../scripts/helper';
import config from '../config';

const { ObjectId } = mongoose.Types;

const { FRONTEND_URL } = config;

export const createBrand = async (req, res) => {
  if (!req.body) {
    return res.status(400).json({
      status: 400,
      message: 'A request body is required',
    });
  }

  let brand_selected;
  const brandData = {
    name: req.body.name,
    twitterAccount_id: req.body.twitterAccount_id.map((id) => ObjectId(id)) || [],
    linkedinAccount_id: req.body.linkedinAccount_id.map((id) => ObjectId(id)) || [],
    facebookAccount_id: req.body.facebookAccount_id.map((id) => ObjectId(id)) || [],
    linkedinAccountPage_ids: req.body.linkedinAccountPage_ids || [],
    user_id: req.user._id,
    status: 1,
    postUserCreated: req.body.postUserCreated || 1,
  };

  try {
    const myPromise = async () => {
      const brand = new Brands(brandData);
      let user;
      const brand_array = [];
      brand_array.push(brand);
      brand_selected = brand._id;
      await brand.save();

      user = await User.findOne({ _id: req.user._id });
      return new Promise((resolve, reject) => {
        brand_array.map(async (item) => {
          try {
            await user.update({ brand_selected: brand._id });
            user = User.findOne({ _id: req.user._id });
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
    // await Promise.all(promises)
    // await user.update({
    //   brand_selected: brand._id
    // })
    // console.log('after user', user)
  } catch (err) {
    console.log('error', err);
    handleError(err, res);
  }

  try {
  } catch (err) {
    console.log('update errror', err);
    return handleError(err, res);
  }
  updateUserLogs('User created brand', req);

  return res.status(201).json({
    message: 'You have succesfully created an brand',
    status: 201,
    data: brand,
  });
};

export const getBrand = async (req, res) => {
  try {
    const query = { _id: ObjectId(req.params.id) };
    brand = await Brands.find(query);
  } catch (err) {
    handleError(err, res);
  }

  updateUserLogs('get brand', req);

  return res.status(200).json({
    status: 200,
    message: 'brand returned',
    data: brand,
  });
};

export const getAllBrands = async (req, res) => {
  let brands;
  try {
    const query = { user_id: req.user._id };
    brands = await Brands.find(query);
  } catch (err) {
    handleError(err, res);
  }

  updateUserLogs('get all brands', req);

  return res.status(200).json({
    status: 200,
    message: `${brands.length} brands returned`,
    data: brands,
  });
};

export const updateBrand = async (req, res) => {
  try {
    console.log('UPDATE BRAND', req.body);
    const brand = await Brands.findOneAndUpdate({ _id: req.params.id }, {
      name: req.body.name,
      twitterAccount_id: req.body.twitterAccount_id.map((id) => ObjectId(id)) || [],
      linkedinAccount_id: req.body.linkedinAccount_id.map((id) => ObjectId(id)) || [],
      facebookAccount_id: req.body.facebookAccount_id.map((id) => ObjectId(id)) || [],
      linkedinAccountPage_ids: req.body.linkedinAccountPage_ids,
      status: req.body.status,
      postUserCreated: req.body.postUserCreated,
      feeds: req.body.feeds,
      signature: req.body.signature,
      banned: req.body.banned,
      bannedSources: req.body.bannedSources,
    });

    if (!brand) {
      res.status(404).json({
        status: 404,
        message: 'No brand found',
      });
    }
  } catch (err) {
    console.log('ERROR', err);
    return handleError(err, res);
  }

  updateUserLogs('User updated brand', req);

  return res.status(200).json({
    status: 200,
    message: 'Updated brand',
  });
};
