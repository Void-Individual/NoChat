import redisClient from '../utils/redis';
import dbClient from '../utils/db';
import { v4 as uuidV4 } from 'uuid';

const { ObjectId } = require('mongodb');

const crypto = require('crypto');

function hashSHA1(data) {
  const hash = crypto.createHash('sha1');
  hash.update(data);
  return hash.digest('hex');
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

class UsersController {
  static async postNew(req, res) {
    const { email, username, phoneNumber } = req.body;
    let { password } = req.body;

    const missingFields = ['email','password','username'].filter(f => !req.body[f]);
    if (missingFields.length) {
      res.status(400).send({ error: `Missing ${missingFields[0]}` });
      return;
    }

    // Check if the email has been used
    const checkEmail = await findOneUser(dbClient, { email });
    if (checkEmail) {
      res.status(400).send({
        error: ' This Email already has an account',
        checkEmail
       });
      return;
    } if (checkEmail === false) {
      res.status(400).send({ error: 'An error occured' });
      return;
    }

    // Check if the email has been used
    const checkUser = await findOneUser(dbClient, { username });
    if (checkUser) {
      res.status(400).send({
        error: 'This username has been taken',
        checkUser
     });
      return;
    } if (checkUser === false) {
      res.status(400).send({ error: 'An error occured' });
      return;
    }

    password = hashSHA1(password);
    const data = {
      email,
      password,
      username,
      phoneNumber: phoneNumber || null
    };
    const newUser = await dbClient.db.collection('users').insertOne(data);

    //const endPointData = {
    //  email,
    //  id: newUser.insertedId,
    //};

    res.status(201).send({
      note: 'A new account has been created for you',
      userDetails: newUser.ops
    });
  }

  static async login(req, res) {
    try {
      const { email, password } = req.body;

      const user = await findOneUser(dbClient, { email });
      if (user) {
        if (hashSHA1(password) !== user.password) {
          res.status(401).send({ error: 'Invalid password'});
          return;
        }

        // Generate token upon successful login
        const token = uuidV4();
        const key = `auth_${token}`;

        // Store token in Redis with a 1-hour expiry (in seconds)
        await redisClient.set(key, user._id.toString(), 60 * 60);

        // Set the token in an HTTP-only cookie
        res.cookie('authToken', token, {
          httpOnly: true, // Prevent client-side JavaScript from accessing the cookie
          maxAge: 1000 * 60 * 60, // Cookie expires in 1 hour (in milliseconds)
          secure: false,    // Set to true in production (requires HTTPS)
          sameSite: 'Strict' // Prevents cross-site request forgery (CSRF) attacks
        });

        // Send the success page
        res.redirect('/users/me');
      } else {
        res.status(401).send({ error: 'Email does not exist' });
        return;
      }
    } catch (err) {
    console.log('An error occured in /login:', err);
    res.status(400).send({ error: 'Error during login' });
   }
  }

  static async searchUser(req, res) {
    const { username } = req.body;

    await findOneUser(dbClient, { username }).then((user) => {
      if (user) {
        res.send('Profile Found!');
      } else {
        res.send('No profile matched this username')
      }
    }).catch((err) => {
      console.log('An error occured while searching for user:', err.message);
      res.status(400).send({ error: 'Error during search' });
     });
  }
}

class UserController {
  static async getMe(req, res) {
    try {
      // Access token from cookies
      const token = req.cookies.authToken;
      if (!token) {
        res.status(401).send({ error: 'Unauthorized, token missing' });
        return;
      }

      const _id = await redisClient.get(`auth_${token}`);
      const user = await findOneUser(dbClient, { _id });
      if (user) {
        res.render('profile-page', { user });
        //const { email } = user;
        //res.status(200).send(`User authenticated: ${{ id: _id, email }}`);
      } else {
        res.status(401).send({ error: 'Unauthorized' });
        return;
      }
    } catch (err) {
      console.log('An error occured:', err.message);
      res.status(400).send({ error: 'Error during disconnection' });
    }
  }
}

export { UserController, UsersController };
