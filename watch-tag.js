const config = require('./lib/config');
const wah = require('./lib/wah');
const twitterClient = require('./lib/twitterClient');
const {database} = require('./lib/mongoClient');

const collection = database.collection(config.tag.MONGODB_COLLECTION);


async function main() {
  const stream = twitterClient.stream('statuses/filter', {
    track: config.tag.TRACK_TEXT,
  });

  stream.on('error', err => {
    console.error(err);
  });

  stream.on('tweet', wah(async tweet => {
    // exclude own tweets
    if (config.tag.EXCLUDE_OWN_TWEETS && tweet.user.id_str === config.MY_USER_ID) {
      return;
    }

    // exclude retweets
    if (tweet.retweeted_status) {
      return;
    }

    // exclude non-quote tweets
    if (!tweet.quoted_status || tweet.quoted_status.user.id_str !== config.SKULD_USER_ID) {
      return;
    }

    // exclude etc.
    if (!tweet.text.includes(config.tag.TRACK_TEXT)) {
      return;
    }

    const rtid = tweet.id_str;
    const rtsn = tweet.user.screen_name;
    const ttid = tweet.quoted_status_id_str;
    const rturl = `https://twitter.com/${tweet.user.screen_name}/status/${tweet.id_str}`;

    let exists = true;
    try {
      await collection.insertOne({
        rtid,
        ttid,     // unique key
        rturl,
        tweet,
      });
      exists = false;
    } catch (err) {
      if (err.code !== 11000) {
        throw err;
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
        status: config.tag.CREATE_STATUS(rtsn, document.rturl),
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


module.exports = main;
