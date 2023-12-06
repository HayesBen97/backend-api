import mongoose from 'mongoose';

let rssconn = mongoose.createConnection(
  'mongodb://localhost:27017/RSS',
  { useNewUrlParser: true, auto_reconnect: true, useFindAndModify: false },
  (err) => {
    if (err) {
      console.error('RSS |', err.name, 'Failed to connect to MongoDB - retrying in 30 sec');
      setTimeout(() => {
        rssconn = connectWithRetry();
      }, 30000);
    }
  },
);

let lastConnect = new Date();

var connectWithRetry = function () {
  lastConnect = new Date();
  return rssconn.openUri(
    'mongodb://localhost:27017/RSS',
    { useNewUrlParser: true, auto_reconnect: true, useFindAndModify: false },
    (err) => {
      if (err) {
        console.error('RSS |', err.name, 'Failed to connect to MongoDB - retrying in 30 sec');
        setTimeout(() => {
          connectWithRetry();
        }, 30000);
      }
    },
  );
};

rssconn.on('open', () => {
  console.log('RSS | Succesfully connected to the database\r\n');
});

rssconn.on('connecting', () => {
  console.log('RSS | Connecting to MongoDB...');
});
rssconn.on('connected', () => {
  console.log('RSS | MongoDB connected!');
});
rssconn.on('reconnected', () => {
  console.log('RSS | MongoDB reconnected!');
});
rssconn.on('disconnected', () => {
  console.error('RSS | MongoDB disconnected!');
  if (new Date() - lastConnect > 60 * 1000) {
    rssconn = connectWithRetry();
  }
});

export default rssconn;
