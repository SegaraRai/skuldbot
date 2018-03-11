module.exports = {
  MY_USER_ID: process.env.TWITTER_ACCESS_TOKEN.replace(/-.*/, ''),
  SKULD_USER_ID: '841638203467608064',//'706318170416517120',
  tag: {
    MONGODB_COLLECTION: 'tag-history',
    TRACK_TEXT: '#すくるど語録集',
    EXCLUDE_OWN_TWEETS: false,
    CREATE_STATUS(rtsn, tweetUrl) {
      return `@${rtsn} すくるど語録集警察です！　そのツイートは既にタグ付けされています！\n${tweetUrl}`;
    },
  },
  gacha: {
    MONGODB_COLLECTION: 'gacha-history',
    TRACK_URL: 'shindanmaker.com/762814',
    EXCLUDE_OWN_TWEETS: false,
  },
};

