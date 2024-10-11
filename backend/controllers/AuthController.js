import { v4 as uuidV4 } from 'uuid';
import redisClient from '../utils/redis';
import dbClient from '../utils/db';

const { ObjectId } = require('mongodb');

const crypto = require('crypto');

function hashSHA1(data) {
  const hash = crypto.createHash('sha1');
  hash.update(data);
  return hash.digest('hex');
}

function decodeBase64(base64Data) {
  const base64Header = base64Data.split(' ')[1];
  const data = Buffer.from(base64Header, 'base64').toString('utf8');
  const email = data.split(':')[0];
  let password = data.split(':')[1];
  password = hashSHA1(password);

  return [email, password];
}

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

class AuthController {
  static async getConnect(req, res) {
    try {
      console.log('Running connect')
      const header = req.header('Authorization');
      const [email, password] = decodeBase64(header);

      const user = await findOneUser(dbClient, { email, password });
      if (!user) {
        res.render('error-page', { error: 'Your own user info cant be found' });
        //res.status(401).send({ error: 'Unauthorized' });
        return;
      }

      const token = uuidV4();
      const key = `auth_${token}`;
      // Set this key to be active for a duration of 24 hours (in seconds)
      await redisClient.set(key, user._id.toString(), 60 * 60 * 24);
      res.status(200).send({ token });
    } catch (err) {
      console.log('There was an error:', err.message);
      res.render('error-page', { error: 'An error occured during connection' });
      //res.status(400).send({ error: 'Error during connection' });
    }
  }

  static async toggleStatus(req, res) {
    try {
      console.log('Toggling status')
      const token = req.cookies.authToken;
      const _id = await redisClient.get(`auth_${token}`);
      const user = await findOneUser(dbClient, { _id });

      let status = '';
      if (user.status === 'Offline') {
        status = 'Online';
      } else {
        status = 'Offline';
      }

      // Toggle the status' state
      console.log('Making the user ', status)
      try {
        const result = await dbClient.db.collection('users').updateOne(
          { _id: ObjectId(_id) },  // The filter to find the user document by ID
          { $set: { status } }  // Update operation to set the status to "Offline"
        );

        // Check if exactly one document was modified
        if (result.modifiedCount === 1) {
          console.log(`${user.username} is now ${status}`);
        } else {
          console.log(`No update occurred for ${user.username}.`);
          // This log could indicate that the user was already offline or the user was not found.
        }
      } catch (error) {
        console.error(`An error occurred while trying to set ${user.username} ${status}:`, error);
      }

      res.status(204).send();
    } catch (err) {
      console.log('An error occured while toggling the status:', err.message);
    }
  }

  static async getDisconnect(req, res) {
    try {
      const token = req.cookies.authToken;
      const _id = await redisClient.get(`auth_${token}`);
      const user = await findOneUser(dbClient, { _id });
      if (user) {
        await redisClient.del(`auth_${token}`);

        // Set the status to offline
        try {
          const result = await dbClient.db.collection('users').updateOne(
            { _id: ObjectId(_id) },  // The filter to find the user document by ID
            { $set: { status: "Offline" } }  // Update operation to set the status to "Offline"
          );

          // Check if exactly one document was modified
          if (result.modifiedCount === 1) {
            console.log(`${user.username} is now OFFLINE`);
          } else {
            console.log(`No update occurred for ${user.username}.`);
            // This log could indicate that the user was already offline or the user was not found.
          }
        } catch (error) {
          console.error(`An error occurred while trying to set ${user.username} offline:`, error);
        }

        res.status(204).send();
      } else {
        res.render('error-page', { error: 'Your own user info cant be found' });
        //res.status(401).send({ error: 'Unauthorized' });
      }
    } catch (err) {
      console.log('An error occured:', err.message);
      res.render('error-page', { error: 'An error occured during disconnection' });
      //res.status(500).send({ error: 'Error during disconnection' });
    }
  }
}

const checkAuth = async (req, res, next) => {
  try {
    const token = req.cookies.authToken;
    if (token) {
      // Check if the token is valid
      const userId = await redisClient.get(`auth_${token}`);
      if (userId) {
        // Token is valid
        return res.status(200).send('Authenticated');
      }
    }
    // Token is not valid or not present
    res.status(401).send('Not Authenticated');
    //res.render('error-page', { error: 'Not Authenticated' });
  } catch (err) {
    console.error('Error in /check-auth:', err.message);
    //res.render('error-page', { error: 'Server Error' });
    res.status(500).send('Server Error');
  }
};

export { AuthController, checkAuth };
