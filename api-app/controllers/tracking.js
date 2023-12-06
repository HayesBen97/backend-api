import User from '../models/userModel';
import config from '../config';

const Hubspot = require('hubspot');

const {
  HUBSPOT_API_KEY,
} = config;

const hubspot = HUBSPOT_API_KEY ? new Hubspot({ apiKey: HUBSPOT_API_KEY }) : null;

export const trackEvent = async (req, res) => {
  console.log(req.body.event);
  try {
    const user = await User.findOne({ _id: req.user._id });

    const { event } = req.body;

    const properties = [];

    if (!user.tracking[event]) {
      const tracked = Object.keys(user.tracking).filter((key) => user.tracking[key] || key == event);
      properties.push(
        { property: 'user_state', value: tracked.join(';') },
      );
      await user.update({
        $set: {
          [`tracking.${event}`]: true,
        },
      });
      if (hubspot) {
        const result = await hubspot.contacts.createOrUpdate(user.email1, { properties });
        console.log('Response from API', result);
      }
    }
  } catch (err) {
    console.error('Error tracking event', err);
  }

  return res.status(200).json({
    status: 200,
    data: {},
  });
};

export const trackApiEvent = async (event, user_id) => {
  try {
    const properties = [];

    const user = await User.findOne({ _id: user_id });

    if (!user.tracking[event]) {
      const tracked = Object.keys(user.tracking).filter((key) => user.tracking[key] || key == event);
      properties.push(
        { property: 'user_state', value: tracked.join(';') },
      );
      await user.update({
        $set: {
          [`tracking.${event}`]: true,
        },
      });
      if (hubspot) {
        const result = await hubspot.contacts.createOrUpdate(user.email1, { properties });
        console.log('Response from API', result);
      }
    }
  } catch (err) {
    console.error('Error tracking event from API', err);
  }
};
