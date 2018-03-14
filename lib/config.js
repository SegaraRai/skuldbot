module.exports = {
  myUserId: process.env.TWITTER_ACCESS_TOKEN.replace(/-.*/, ''),
  skuldUserId: '706318170416517120',
  tag: {
    excludeOwnTweets: false,
    mongodbCollection: 'tag-history',
    trackText: '#すくるど語録集',
    createStatus(rtsn, tweetUrl) {
      return `@${rtsn} すくるど語録集警察です！　そのツイートは既にタグ付けされています！\n${tweetUrl}`;
    },
  },
  gacha: {
    excludeOwnTweets: false,
    fetchFriendsInterval: 3 * 60 * 60 * 1000,   // 3 hours
    mongodbCollection: 'gacha-history',
    trackUrl: 'shindanmaker.com/762814',
  },
};

