const MongoClient = require('mongodb/lib/mongo_client');

class DBClient {
  constructor() {
    const host = process.env.DB_HOST || 'localhost';
    const port = process.env.DB_PORT || 27017;
    const database = process.env.DB_DATABASE || 'files_manager';

    this.connected = false;
    const url = `mongodb://${host}:${port}`;
    this.client = new MongoClient(url, { useNewUrlParser: true, useUnifiedTopology: true });

    this.client.connect((err) => {
      if (err) {
        console.log('Failed to connect to mongo:', err);
        this.connected = false;
      } else {
        console.log('Connected to mongodb');
        this.connected = true;
        this.db = this.client.db(database);
      }
    });
  }

  isAlive() {
    return this.connected;
  }

  async nbUsers() {
    if (this.connected && this.db) {
      const noUsers = await this.db.collection('users').countDocuments();
      return noUsers;
    }
    return 0;
  }

  async nbFiles() {
    if (this.connected && this.db) {
      const noFiles = await this.db.collection('files').countDocuments();
      return noFiles;
    }
    return 0;
  }
}

const dbClient = new DBClient();
module.exports = dbClient;
