import mongoose from 'mongoose';
import Feed from '../models/feedModel';
import Article from '../models/articleModel';
import Brand from '../models/brandModel';
import Post from '../models/postModel';

const { ObjectId } = mongoose.Types;

export const getFeeds = async (req, res) => {
  try {
    const startDate = req.body.date;

    const brand = await Brand.findOne({ _id: req.user.brand_selected });
    const { feeds } = brand;

    const feedNames = [];

    for (const i in feeds) {
      const feed = await Feed.find({ Link: feeds[i] });
      feed.forEach((feedFound) => {
        feedNames.push(feedFound.Name);
      });
    }

    let articleList = await Article.find(
      {
        RSSFeedName:
                {
                  $in: feedNames,
                },
        publishedDate: {
          $lt: startDate,
        },
      },
    ).sort(
      {
        publishedDate: -1,
      },
    ).limit(100);
    if (typeof (articleList) !== 'undefined' && articleList.length > 0) {
      const posts = await Post.find({ user_id: ObjectId(req.user._id), brand_selected: ObjectId(req.user.brand_selected), createdAt: { $gte: new Date(articleList[articleList.length - 1].publishedDate) } });
      const post_links = [];
      posts.forEach((post) => {
        post_links.push(post.link);
      });

      articleList = articleList.map((item) => ({ link: item.link, publishedDate: item.publishedDate }));
      articleList = articleList.filter((item) => !post_links.includes(item.link));
    } else {
      articleList = articleList.map((item) => ({ link: item.link, publishedDate: item.publishedDate }));
    }
    return res.status(200).json({
      status: 200,
      data: articleList,
    });
  } catch (err) {
    console.error('Error getting feeds', err);
    return res.status(500).json({
      status: 500,
      data: [],
    });
  }
};

export const addFeeds = async (req, res) => {
  try {
    const { feeds } = req.body;

    await Brand.findOneAndUpdate(
      {
        _id: req.user.brand_selected,
      },
      {
        $set: {
          feeds,
        },
      },
    );

    feeds.forEach(async (feed) => {
      const feedFound = await Feed.findOne({ Link: feed });
      if (!feedFound) {
        Feed.create({
          Name: feed,
          Link: feed,
        });
      }
    });

    return res.status(201).json({
      status: 201,
      message: 'Feeds added',
    });
  } catch (err) {
    console.error('Error adding feeds', err);
    return res.status(500).json({
      status: 500,
      message: 'Error adding feeds',
    });
  }
};
