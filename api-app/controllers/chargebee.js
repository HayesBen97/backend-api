import mongoose from 'mongoose';
import crypto from 'crypto';
import request from 'request';
import User from '../models/userModel';
import Plan from '../models/planModel';

import config from '../config';

const {
  MAILCHIMP_API_KEY,
  MAILCHIMP_LIST,
  MAILCHIMP_URL,
  HUBSPOT_API_KEY,
} = config;

const Hubspot = require('hubspot');

const { ObjectId } = mongoose.Types;

const hubspot = HUBSPOT_API_KEY ? new Hubspot({ apiKey: HUBSPOT_API_KEY }) : null;

export const receiveSubscriptionData = async (req, res) => {
  const { subscription, customer } = req.body.content;

  console.log('CHARGEBEE EVENT', req.body.event_type);

  if (req.body.event_type === 'subscription_created') {
    try {
      const plan = await Plan.findOne({ planKey: subscription.plan_id });

      let user = await User.findOneAndUpdate({ email1: customer.email }, {
        planKey: ObjectId(plan._id),
        nextBillingDate: new Date(subscription.next_billing_at * 1000).toISOString(),
        endDate: new Date((subscription.next_billing_at * 1000) + (12 * 60 * 60 * 1000)).toISOString(),
      });

      const old_plan = await Plan.findOne({ _id: user.planKey });

      // await new Promise((resolve, reject) => {
      //   const data = {
      //     tags: [
      //             {name: plan.planKey, status: 'active'},
      //             {name: 'trial expired', status: 'inactive'},
      //             {name: 'no upgrade', status: 'inactive'},
      //           ],
      //   };
      //   if (old_plan.planKey === 'Trial') {
      //     data.tags.unshift({name: '14-Day Trial User', status: 'inactive'})
      //   } else {
      //     data.tags.unshift({name: old_plan.planKey, status: 'inactive'})
      //   }

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
      try {
        const properties = [
          { property: 'plan_key', value: plan.planKey.toUpperCase() },
        ];

        if (!user.tracking['Upgrade Account']) {
          const tracked = Object.keys(user.tracking).filter((key) => user.tracking[key] || key == 'Upgrade Account');
          properties.push(
            { property: 'user_state', value: tracked.join(';') },
          );
          user = await User.findOneAndUpdate({ email1: customer.email }, {
            $set: {
              'tracking.Upgrade Account': true,
            },
          });
        }
        if (hubspot) {
          const result = await hubspot.contacts.createOrUpdate(customer.email, { properties });
          console.log('Response from API', result);
        }
      } catch (err) {
        console.error(err);
      }

      return res.status(200).json({
        status: 200,
        message: 'Plan updated succesfully',
      });
    } catch (err) {
      console.log(err);
      return res.status(500).json({
        status: 500,
        message: err.message,
      });
    }
  }

  if (req.body.event_type === 'subscription_renewed' || req.body.event_type === 'subscription_activated') {
    try {
      const plan = await Plan.findOne({ planKey: subscription.plan_id });

      const user = await User.findOneAndUpdate({ email1: customer.email }, {
        planKey: ObjectId(plan._id),
        nextBillingDate: new Date(subscription.next_billing_at * 1000).toISOString(),
        endDate: new Date((subscription.next_billing_at * 1000) + (12 * 60 * 60 * 1000)).toISOString(),
      });

      return res.status(200).json({
        status: 200,
        message: 'Subscription renewed succesfully',
      });
    } catch (err) {
      console.log(err);
      return res.status(500).json({
        status: 500,
        message: err.message,
      });
    }
  }

  return res.status(200).json({
    status: 200,
    message: 'no handling for this webhook',
  });
};
