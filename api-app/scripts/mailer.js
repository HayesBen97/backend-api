import config from '../config';
import { emailTemplate } from './emailTemplate';

const postmark = require('postmark');

const {
  POSTMARK_API_KEY,
  POSTMARK_FROM_EMAIL,
  FRONTEND_URL,
} = config;

const signature = '\n\nThanks,\n\nMarketMate team\n\nIf you have any queries/questions, you can drop our team an email at marketing@marketmate.ai';

export const sendVerificationEmail = async (email, verificationString) => {
  const verificationUrl = `${FRONTEND_URL}/verify/${verificationString}`;
  await sendMail({
    To: email,
    Subject: 'Account registered, verify your email address',
    TextBody: `Hey there,\n\nWelcome to MarketMate - thanks for signing up.\n\nBefore we get you started on your 7-day free trial of MarketMate we need to quickly verify your email address - this won't take a second!\n\nClick the link below to verify your email address and begin your MarketMate experience.\n\n${verificationUrl}${signature}`,
    HtmlBody: emailTemplate(`Hey there,\n\nWelcome to MarketMate - thanks for signing up.\n\nBefore we get you started on your 7-day free trial of MarketMate we need to quickly verify your email address - this won't take a second!\n\nClick the link below to verify your email address and begin your MarketMate experience.\n\n${verificationUrl}`),
  });
};

export const sendWelcomeEmail = async (email) => {
  await sendMail({
    To: email,
    Subject: 'Verified - Welcome to MarketMate',
    TextBody: `Hey there,\n\nWe're pleased to let you know that your account has now been created and your 7-day free trial starts from today.\n\nHere's a quick overview to help you get settled in:\nWe offer a multi-platform approach: You can quickly and easily connect your LinkedIn, Twitter and Facebook accounts helping you achieve content consistency across each of your platforms.\nTell us what kind of content you want us to post: Nothing too specific, we're just looking for you to share a few topics/areas of interest and we'll do the rest. You can also let us know how often you'd like us to publish content.\nStay in control: We know some of our customers like to double check the curated content before it’s sent out to make sure it’s in line with their brand, or to simply add an extra spark to the wording. Through our ‘curate’ function we’ve enabled marketers to review and approve each of our composed messages before they are published.\n\nOur team are committed to developing our platform to best suit you. In order to do this, we need your feedback. As a valued user we’d really appreciate your thoughts and input – to help capture this we will be sending out a short survey in the coming weeks which we’d appreciate you taking five minutes to complete.\n\nWe hope you enjoy using MarketMate.${signature}`,
    HtmlBody: emailTemplate('Hey there,\n\nWe\'re pleased to let you know that your account has now been created and your 7-day free trial starts from today.\n\nHere\'s a quick overview to help you get settled in:\nWe offer a multi-platform approach: You can quickly and easily connect your LinkedIn, Twitter and Facebook accounts helping you achieve content consistency across each of your platforms.\nTell us what kind of content you want us to post: Nothing too specific, we\'re just looking for you to share a few topics/areas of interest and we\'ll do the rest. You can also let us know how often you\'d like us to publish content.\nStay in control: We know some of our customers like to double check the curated content before it’s sent out to make sure it’s in line with their brand, or to simply add an extra spark to the wording. Through our ‘curate’ function we’ve enabled marketers to review and approve each of our composed messages before they are published.\n\nOur team are committed to developing our platform to best suit you. In order to do this, we need your feedback. As a valued user we’d really appreciate your thoughts and input – to help capture this we will be sending out a short survey in the coming weeks which we’d appreciate you taking five minutes to complete.\n\nWe hope you enjoy using MarketMate.'),
  });
};

export const sendEndOfTrialEmail = async (email, user) => {
  const url = `${FRONTEND_URL}/`;
  await sendMail({
    To: email,
    Subject: 'End of trial',
    TextBody: `Hey ${user.name},\n\nWe hope you’ve enjoyed using MarketMate as much as we’ve enjoyed having you as amember!\n\nOur team wanted to get in touch to let you know that your 7-day free trial of our platform is due to end in 24 hours’ time.\n\nDon’t panic! If you wish to continue to use our platform, simply click the link below to sign up to our basic plan for just £99 a month.\n\n${url}\n\nThis package enables you to:\nConnect up to 10 different social media accounts including Facebook, Twitter and Facebook\nAccess to current and real-time content in line with your chosen topics •Consistent, reliable and automated posting across your connected social media platforms\nScale back on time and resource when it comes to content curation.${signature}`,
    HtmlBody: emailTemplate(`Hey ${user.name},\n\nWe hope you’ve enjoyed using MarketMate as much as we’ve enjoyed having you as amember!\n\nOur team wanted to get in touch to let you know that your 7-day free trial of our platform is due to end in 24 hours’ time.\n\nDon’t panic! If you wish to continue to use our platform, simply click the link below to sign up to our basic plan for just £99 a month.\n\n${url}\n\nThis package enables you to:\nConnect up to 10 different social media accounts including Facebook, Twitter and Facebook\nAccess to current and real-time content in line with your chosen topics •Consistent, reliable and automated posting across your connected social media platforms\nScale back on time and resource when it comes to content curation.`),
  });
};

export const sendForgotPasswordEmail = async (email, password_string) => {
  await sendMail({
    To: email,
    Subject: 'Forgot password',
    TextBody: `Need to reset your password? No problem let’s get you a new one!\n\nCopy your new password below, make sure to set a new one when you've logged in.\n\n${password_string}\n\nShould you encounter any issues, our team are always on hand and happy to help. You can contact us at marketing@marketmate.ai at any time.${signature}`,
    HtmlBody: emailTemplate(`Need to reset your password? No problem let’s get you a new one!\n\nCopy your new password below, make sure to set a new one when you've logged in.\n\n${password_string}\n\nShould you encounter any issues, our team are always on hand and happy to help. You can contact us at marketing@marketmate.ai at any time.`),
  });
};

const sendMail = async (options) => {
  const client = new postmark.ServerClient(POSTMARK_API_KEY);

  try {
    return await client.sendEmail({
      From: POSTMARK_FROM_EMAIL,
      ...options,
    });
  } catch (e) {
    console.log('Error sending email', e);
  }
};
