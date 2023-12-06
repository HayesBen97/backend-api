import fs from 'fs';
import child_process from 'child_process';
import { trackApiEvent } from './tracking';

const { spawn } = child_process;

const metascraper = require('metascraper')([
  require('metascraper-author')(),
  require('metascraper-date')(),
  require('metascraper-description')(),
  require('metascraper-image')(),
  require('metascraper-logo')(),
  require('metascraper-clearbit')(),
  require('metascraper-publisher')(),
  require('metascraper-title')(),
  require('metascraper-url')(),
]);

const got = require('got');

// const targetUrl = 'https://www.theguardian.com/news/2020/may/13/naomi-klein-how-big-tech-plans-to-profit-from-coronavirus-pandemic'
//   ;(async () => {
//     const { body: html, url } = await got(targetUrl)
//     const metadata = await metascraper({ html, url })
//     console.log('metadata', metadata)
//   })()
export const predict = async (req, res) => {
  if (!req.body.args) {
    return res.status(400).json({
      status: 400,
      message: 'Please provide a keyword.',
    });
  }

  const { args } = req.body;

  let result;
  console.log('args', args);
  try {
    result = await makePrediction(args);
    trackApiEvent('Utilised Preview', req.user._id);
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      status: 500,
      message: err.message,
    });
  }

  return res.status(200).json({
    status: 200,
    data: JSON.stringify(result),
  });
};

const makePrediction = (keyword) => new Promise((resolve, reject) => {
  fs.access(`${process.env.PYTHONPATH}marketmate/search/predict.py`, fs.F_OK, async (err) => {
    if (err) {
      console.error(err);
      reject(err);
    }

    console.log(process.env.PYTHONPATH);
    const python_process = spawn('python3', ['-m', 'marketmate.search.predict', keyword]);

    let dataJson;

    for await (const data of python_process.stdout) {
      dataJson = JSON.parse(Buffer.from(data));
    }

    for (let i = 0; i < dataJson.length; i++) {
      // console.log('DATAJSON[i]', dataJson[i], dataJson)
      // console.log(typeof(dataJson[i]), typeof(dataJson))
      const { body: html, url } = await got(dataJson[i].url);
      if (typeof (url) !== 'undefined') {
        const metadata = await metascraper({ html, url });
        const post = dataJson[i];
        post.description = metadata.description;
        post.author = metadata.author;
        post.image = metadata.image;
        post.logo = metadata.logo;
        post.publisher = metadata.publisher;
        post.title = metadata.title;
        dataJson[i] = post;
        // dataJson = JSON.stringify(dataJson)
      }
    }
    console.log('DATA JSON', dataJson);
    dataJson = JSON.stringify(dataJson);
    resolve(dataJson);
  });
});
