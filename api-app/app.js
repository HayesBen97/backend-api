import express from 'express';
import session from 'express-session';
import bodyParser from 'body-parser';
import cors from 'cors';
import mongoose from 'mongoose';
import passport from 'passport';
import fs from 'fs';
import config from './config';
import apiRouter from './routers/apiRouter';

const {
  SESSION_KEY,
  MONGO_CONNECTION_STRING,
} = config;

const app = express();

const upload_path = require('path').join(__dirname, '/uploads');

let lastConnect = new Date();

var connectWithRetry = function () {
  lastConnect = new Date();
  return mongoose.connect(MONGO_CONNECTION_STRING, { useNewUrlParser: true, auto_reconnect: true, useFindAndModify: false }, (err) => {
    if (err) {
      console.error(err.name, ":", err.process, 'Failed to connect to MongoDB - retrying in 30 sec');
      setTimeout(connectWithRetry, 30000);
    }
  });
};
// mongoose.connect(MONGO_CONNECTION_STRING, { useNewUrlParser: true, auto_reconnect:true })
// connectWithRetry();

const port = process.env.APP_PORT || 3000;
const db = mongoose.connection;

// db.on('error', () => {
//   console.error('Failed to connect to database. Exiting.\r\n')
// process.exit(-1)
// mongoose.disconnect();
// })

db.once('open', () => {
  console.log('Succesfully connected to the database\r\n');
});

db.on('connecting', () => {
  console.log('connecting to MongoDB...');
});
db.on('connected', () => {
  console.log('MongoDB connected!');
});
db.on('reconnected', () => {
  console.log('MongoDB reconnected!');
});
db.on('disconnected', () => {
  console.error('MongoDB disconnected!');
  //   // mongoose.connect(MONGO_CONNECTION_STRING, { useNewUrlParser: true, auto_reconnect:true })
  if (new Date() - lastConnect > 60 * 1000) {
    connectWithRetry();
  }
});

app.use(session({
  secret: SESSION_KEY,
}));

app.use(bodyParser.json({ limit: '500mb' }));
app.use(cors());
app.use('/api/', apiRouter);
// app.use(express.static(upload_path))

if (process.env.NODE_ENV !== 'test') {
  app.listen(port);
}

console.log("App.js Initialised")

export default app;
