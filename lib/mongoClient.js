const {MongoClient, Db} = require('mongodb');


module.exports = {
  /** @type {?MongoClient} */
  mongoClient: null,
  /** @type {?Db} */
  database: null,

  async init() {
    this.mongoClient = await MongoClient.connect(process.env.MONGODB_URI);
    this.database = this.mongoClient.db(process.env.MONGODB_URI.replace(/^.*\//, ''));
  },
};
