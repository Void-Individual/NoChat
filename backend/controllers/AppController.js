import redisClient from '../utils/redis';
import dbClient from '../utils/db';

const waitConnection = (client) => new Promise((resolve, reject) => {
  let i = 0;
  const repeatFct = async () => {
    await setTimeout(() => {
      i += 1;
      if (i >= 10) {
        reject();
      } else if (!client.isAlive()) {
        console.log('Repeating isalive');
        repeatFct();
      } else {
        resolve();
      }
    }, 1000);
  };
  repeatFct();
});

class AppController {
  static async getStatus(req, res) {
    console.log('Is mongo alive before waiting:', dbClient.isAlive());
    await waitConnection(dbClient);
    console.log('Is mongo alive after waiting:', dbClient.isAlive());

    console.log('Is redis alive before waiting:', redisClient.isAlive());
    await waitConnection(redisClient);
    console.log('Is redis alive after waiting:', redisClient.isAlive());

    const isAlive = {
      redis: redisClient.isAlive(),
      db: dbClient.isAlive(),
    };

    res.status(200).send(isAlive);
  }

  static async getStats(req, res) {
    const users = await dbClient.nbUsers();
    const files = await dbClient.nbFiles();
    const stats = {
      users, // Example data
      files, // Example data
    };
    res.status(200).send(stats);
  }
}

export default AppController;
