const config = require('./lib/config');
const wah = require('./lib/wah');
const twitterClient = require('./lib/twitterClient');
const {database} = require('./lib/mongoClient');

const collection = database.collection(config.gacha.MONGODB_COLLECTION);
const skuldFriends = new Set();


async function fetchSkuldFriends() {
  skuldFriends.clear();
  for (let cursor = '-1'; cursor !== '0';) {
    const {data} = await twitterClient.get('friends/ids', {
      user_id: config.SKULD_USER_ID,
      cursor,
      stringify_ids: true,
      count: 5000,
    });
    for (const id of data.ids) {
      skuldFriends.add(id);
    }
    cursor = data.next_cursor_str;
  }
}

async function main() {
  await fetchSkuldFriends();
  setInterval(wah(fetchSkuldFriends), config.gacha.FETCH_FRIENDS_INTERVAL);

  const stream = twitterClient.stream('statuses/filter', {
    track: config.gacha.TRACK_URL,
  });

  stream.on('error', err => {
    console.error(err);
  });

  stream.on('tweet', wah(async tweet => {
    // exclude own tweets
    if (config.gacha.EXCLUDE_OWN_TWEETS && tweet.user.id_str === config.MY_USER_ID) {
      return;
    }

    // exclude skuld's tweets
    if (tweet.user.id_str === config.SKULD_USER_ID) {
      return;
    }

    // exclude retweets
    if (tweet.retweeted_status) {
      return;
    }

    // exclude etc.
    const entities = tweet.extended_tweet ? tweet.extended_tweet.entities : tweet.entities;
    if (!entities || !entities.urls || !entities.urls.some(url => url.expanded_url.includes(config.gacha.TRACK_URL))) {
      return;
    }

    // exclude tweets from users who skuld has already followed
    if (skuldFriends.has(tweet.user.id_str)) {
      return;
    }

    const rtid = tweet.id_str;
    const rtuid = tweet.user.id_str;
    const rturl = `https://twitter.com/${tweet.user.screen_name}/status/${tweet.id_str}`;

    let exists = true;
    try {
      await collection.insertOne({
        rtid,
        rtuid,    // unique key
        rturl,
        tweet,
      });
      exists = false;
    } catch (err) {
      if (err.code !== 11000) {
        throw err;
      }
    }

    if (!exists) {
      // the first gacha by the user
      await twitterClient.post('direct_messages/events/new', {
        event: {
          type: 'message_create',
          message_create: {
            target: {
              recipient_id: config.SKULD_USER_ID,
            },
            message_data: {
              text: rturl,
            },
          },
        },
      });
    }
  }));
}


module.exports = main;
