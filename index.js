const {MongoClient} = require('mongodb');
const Twit = require('twit');

const TRACK_TEXT = '#すくるど語録集';
const MY_USER_ID = null;                      //process.env.TWITTER_ACCESS_TOKEN.replace(/-.*/, '');
const SKULD_USER_ID = '706318170416517120';   //'841638203467608064';
const ALREADY_EXISTS = 'すくるど語録集警察です！　そのツイートは既にタグ付けされています！';


function wah(func, callback) {
  if (!callback) {
    callback = err => {
      if (err) {
        console.error(err);
        return;
      }
    };
  }

  return function(...args) {
    func(...args)
      .then(data => {
        callback(null, data);
      })
      .catch(err => {
        callback(err);
      });
  }
}


async function main() {
  const mongoClient = await MongoClient.connect(process.env.MONGODB_URI)
  const database = mongoClient.db(process.env.MONGODB_URI.replace(/^.*\//, ''));
  const collection = database.collection(process.env.MONGODB_COLLECTION);

  const twitterClient = new Twit({
    consumer_key: process.env.TWITTER_CONSUMER_KEY,
    consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
    access_token: process.env.TWITTER_ACCESS_TOKEN,
    access_token_secret: process.env.TWITTER_ACCESS_TOKEN_SECRET,
  });

  const stream = twitterClient.stream('statuses/filter', {
    track: TRACK_TEXT,
  });

  stream.on('error', err => {
    console.error(err);
  });

  stream.on('tweet', wah(async tweet => {
    // exclude own tweets
    if (tweet.user.id_str === MY_USER_ID) {
      return;
    }

    // exclude retweets
    if (tweet.retweeted_status) {
      return;
    }

    // exclude non-quoted tweets
    if (!tweet.quoted_status || tweet.quoted_status.user.id_str !== SKULD_USER_ID) {
      return;
    }

    // exclude etc.
    if (!tweet.text.includes(TRACK_TEXT)) {
      return;
    }

    const rtid = tweet.id_str;
    const ttid = tweet.quoted_status_id_str;
    const rturl = `https://twitter.com/${tweet.user.screen_name}/status/${tweet.id_str}`;

    let exists = true;
    try {
      await collection.insertOne({
        rtid,
        ttid,
        rturl,
        tweet,
      });
      exists = false;
    } catch(error) {
      if (error.code !== 11000) {
        throw error;
      }
    }

    if (exists) {
      // already exists
      const document = await collection.findOne({
        ttid,
      });

      if (!document) {
        throw new Error(`insertion failed but collection does not exist\nrtid: ${rtid}, ttid: ${ttid}`);
      }

      await twitterClient.post('statuses/update', {
        status: `${ALREADY_EXISTS}\n${document.rturl}`,
        in_reply_to_status_id: rtid,
      });
    } else {
      // the first tweet
      await twitterClient.post('statuses/retweet/:id', {
        id: rtid,
      });
    }
  }));
}


main()
  .then(() => {
    console.log('started');

    setInterval(() => {
      console.log('running...');
    }, 20 * 60 * 1000);
  })
  .catch(err => {
    throw err;
  });
