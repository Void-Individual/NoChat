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
        this.db.collection('users').createIndex(
          { username: 1 },
          {
            collation: { locale: 'en', strength: 2 }
          }
        )
        this.db.collection('files').createIndex(
          { username: 1 },
          {
            collation: { locale: 'en', strength: 2 }
          }
        )
      }
    });
  }

  async subscribedChannels() {
    try {
      const subscribedChannels = await this.db.collection('files').findOne({ name: 'subscribedChannels'});

      if (!subscribedChannels) {
        console.log('EMpty channels');
        return {};
      }
      //console.log(subscribedChannels);
      return subscribedChannels.data;
      //return {};
    } catch (err) {
      console.log('Error getting the channels:', err.message);
      return {}
    }
  }

  async updateChannels(subscribedChannels) {
    const name = 'subscribedChannels';

    try {
      // Update the channels document or insert it if it doesn't exist
      await this.db.collection('files').updateOne(
        { name }, // Query to find the document by name
        {
          $set: { data: subscribedChannels }, // Update the data field with new channels
          $inc: { channelCount: 1 } // Increment the channelCount by 1
        },
        { upsert: true } // Insert a new document if it doesn't exist
        );
        console.log('Channels updated successfully');
    } catch (err) {
      console.log('An error occured while handling the channels: ', err.message);
      return;
    }
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

  async users(statusValue) {
    if (this.connected && this.db) {
      // Count documents of users who are online
      const noUsers = await this.db.collection('users').countDocuments({ status: statusValue });
      return noUsers;
    }
    return 0;
  }

  async channelCount() {
    if (this.connected && this.db) {
      const subscribedChannels = await this.db.collection('files').findOne({ name: 'subscribedChannels'});
      if (subscribedChannels.channelCount) {
        return subscribedChannels.channelCount;
      } else {
        return 0;
      }
    }
    return 0;
  }
}

const dbClient = new DBClient();
module.exports = dbClient;
