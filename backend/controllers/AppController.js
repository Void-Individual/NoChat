import redisClient from '../utils/redis';
import dbClient from '../utils/db';
import { v4 as uuidV4 } from 'uuid';

const { ObjectId } = require('mongodb');

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

async function findOneUser(client, query) {
  try {
    const newQuery = query;
    // If the passed query contains id, make it a mongo id object
    if (query._id) {
      newQuery._id = new ObjectId(query._id);
    }
    // FInd the mongo document that matches the search query
    const data = await client.db.collection('users').findOne(newQuery);
    // If it is found, it wil be returned, else return null
    return data;
  } catch (err) {
    console.log('Error finding data:', err.message);
    // If there is an error, return false instead of null
    return false;
  }
}

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


  static async startChat(req, res) {
    console.log('Running startChat');
    const token = req.cookies.authToken;
    if (!token) {
      res.status(401).send({ error: 'Unauthorized, You need to login again' });
      return;
    }
    const _id = await redisClient.get(`auth_${token}`);
    const mainUser = await findOneUser(dbClient, { _id });
    if (!mainUser) {
      res.status(401).send({ error: 'Unauthorized, You need to login again' });
      return;
    }
    const { user } = req.params;

    //const channel = `${mainUser.username}+${user}`;
    //console.log('SUb:', subscribedChannels)
    const channel = await checkChannels(mainUser.username, user);
    console.log('checked channels')
    console.log(`Main user: ${mainUser.username} is chatting with ${user}`);

    res.redirect(`/getChatChannelFile?channel=${encodeURIComponent(channel)}&user1=${encodeURIComponent(mainUser.username)}&user2=${encodeURIComponent(user)}`);
  }

  static async sendChat(req, res) {
    const { io } = require('../server'); // Import io for socket.io communication

    console.log('Running SendChat');
    const token = req.cookies.authToken;
    if (!token) {
      res.status(401).send({ error: 'Unauthorized, You need to login again' });
      return;
    }
    const _id = await redisClient.get(`auth_${token}`);
    const mainUser = await findOneUser(dbClient, { _id });
    if (!mainUser) {
      res.status(401).send({ error: 'Unauthorized, You need to login again' });
      return;
    }
    console.log('main is:', mainUser)
    const { user } = req.params;
    const { message } = req.body;
    const allChannels = await dbClient.subscribedChannels();
    const channel = allChannels[mainUser.username][user];
    console.log(`Main user: ${mainUser.username} is chatting with ${user}`);
    // Ensure that _server.io is defined
    if (!io) {
      return res.status(500).json({ error: 'Socket.io not initialized' });
    }
    sendMessage(channel, message, mainUser.username);
    res.redirect(`/saveChatChannelFile?channel=${encodeURIComponent(channel)}&message=${encodeURIComponent(message)}&user1=${encodeURIComponent(mainUser.username)}&user2=${encodeURIComponent(user)}`);
  }
}

async function checkChannels(user1, user2) {
   // Ensure both users exist in the channels dictionary
   const subscribedChannels = await dbClient.subscribedChannels();
   if (!subscribedChannels[user1]) {
    subscribedChannels[user1] = {};
  }
  if (!subscribedChannels[user2]) {
    subscribedChannels[user2] = {};
  }

  if (!subscribedChannels[user1][user2] && !subscribedChannels[user2][user1]) {
    const newChannel = uuidV4();
    subscribedChannels[user1][user2] = newChannel;
    subscribedChannels[user2][user1] = newChannel;
    startChatChannel(newChannel);
    await dbClient.updateChannels(subscribedChannels);
    console.log('Started a new channel for:', user1, user2);
  }
  return subscribedChannels[user1][user2];
}

redisClient.publisher.on('error', (err) => {
  console.error('Redis Publisher Error:', err);
});

redisClient.subscriber.on('error', (err) => {
  console.error('Redis Subscriber Error:', err);
});

// Function to publish a message
function sendMessage(channel, message, sender) {
  const { io } = require('../server'); // Import io for socket.io communication

  redisClient.publisher.publish(channel, message, (err, reply) => {
    if (err) {
      console.error('Error publishing message:', err);
    } else {
      console.log(`Message published to ${channel}: ${message}`);
      // Emit the message via Socket.io to both users in the channel
      io.to(channel).emit('newMessage', { sender, message });
    }
  });
}

function startChatChannel(channel) {
  const { io } = require('../server'); // Import io for socket.io communication

  redisClient.subscriber.subscribe((err, reply) => {
    if (err) {
      console.error('Failed to subscribe to channel:', err);
    } else {
      console.log(`Subscribed to ${channel}:`, reply);
      io.to(channel).emit('newMessage', message); // Ensure _server.io is accessible here
    }
  });

  // Listen for messages on the subscribed channel
  redisClient.subscriber.on('message', (channel, message) => {
    console.log(`Received message from ${channel}: ${message}`);
  });
}

// Function to stop the subscriber
function stopSubscriber(channel) {
  redisClient.subscriber.unsubscribe(channel, () => {
    console.log(`Unsubscribed from ${channel}`);
  });
}

export default AppController;
