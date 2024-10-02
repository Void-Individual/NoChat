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

async function findUsers(client, { search }) {
  try {
    const allData = await client.db.collection('users').find().toArray();

    // Filter users based on the search string ( Run it to search regardless of case setting)
    const data = allData.filter(user => user.username.toLowerCase().includes(search.toLowerCase()));
    //const searchQuery = {
    //  //username: { $regex: new RegExp(query, 'i') } // Case-insensitive search for matching usernames
    //  //username: { $text: {
    //  //  $search: query,
    //  //} } // Case-insensitive search for matching usernames
    //  username: search,
    //};

    //const data = await client.db.collection('users').find(searchQuery).collation({
    //  locale: 'en', strength: 2
    //}).toArray(); // Find all matching users
    ////const data = await client.db.collection('users').find().toArray();
    ////console.log({search});
    ////console.log(searchQuery);
    ////console.log(data);

    return data.length > 0 ? data : null; // Return the list of users or null if none are found
  } catch (err) {
    console.log('Error finding users:', err.message);
    return false;
  }
}

class UsersController {
  static async postNew(req, res) {
    try {
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

      res.json({data: 'Your account has been created successfully'});
    } catch (err) {
      console.log('Error occured while creating user:', err.message);
      res.status(500).send({ error: 'An error occured'});
    }
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

        // Store token in Redis with a 24-hour expiry (in seconds)
        await redisClient.set(key, user._id.toString(), 60 * 60 * 24);

        // Set the token in an HTTP-only cookie
        res.cookie('authToken', token, {
          httpOnly: true, // Prevent client-side JavaScript from accessing the cookie
          maxAge: 1000 * 60 * 60 * 24, // Cookie expires in 24 hours (in milliseconds)
          secure: false,    // Set to true in production (requires HTTPS)
          sameSite: 'Strict' // Prevents cross-site request forgery (CSRF) attacks
        });

        // Set an online status
        try {
          const result = await dbClient.db.collection('users').updateOne(
            { email },  // The filter to find the user document by ID
            { $set: { status: "Online" } }  // Update operation to set the status to "Offline"
          );

          // Check if exactly one document was modified
          if (result.modifiedCount === 1) {
            console.log(`${user.username} is now ONLINE`);
          } else {
            console.log(`No update occurred for ${user.username}.`);
            // This log could indicate that the user was already offline or the user was not found.
          }
        } catch (error) {
          console.error(`An error occurred while trying to set ${user.username} online:`, error);
        }

        // Send the success page
        res.redirect('/user/me');
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
    // Access token from cookies
    console.log('Running search');
    const token = req.cookies.authToken;
    if (!token) {
      res.status(401).send({ error: 'Unauthorized, You need to login again' });
      return;
    }
    const _id = await redisClient.get(`auth_${token}`);
    const user = await findOneUser(dbClient, { _id });
    if (!user) {
      res.status(401).send({ error: 'Unauthorized, You need to login again' });
      return;
    }
    const { search } = req.query;

    try {
      //console.log(search)
      const results = await findUsers(dbClient, { search });
      if (results) {
      //console.log(results)
      res.render('profile-page', { user, results: results || [] });
      return;
    } else {
        res.render('profile-page', {
          user,
          results: [{
            username: 'No profile matched this username',
            badMatch: true
          }]
      });
    }
    } catch (err) {
      console.log('An error occured while searching for user:', err.message);
      res.render('profile-page', { user, results: results || [] });
    }
  }
}

class UserController {
  static async getMe(req, res) {
    try {
      // Access token from cookies
      const token = req.cookies.authToken;
      if (!token) {
        res.redirect('error-page', { error: 'Unauthorized, token missing' });
        // res.status(401).send({ error: 'Unauthorized, token missing' });
        return;
      }

      const _id = await redisClient.get(`auth_${token}`);
      const user = await findOneUser(dbClient, { _id });
      const results = [];
      if (user) {
        res.render('profile-page', { user, results });
        //const { email } = user;
        //res.status(200).send(`User authenticated: ${{ id: _id, email }}`);
      } else {
        res.status(401).send({ error: 'Unauthorized, you need to log in' });
        return;
      }
    } catch (err) {
      console.log('An error occured:', err.message);
      res.status(400).send({ error: 'Error during disconnection' });
    }
  }

  static async getUser(req, res) {
    try {
      console.log('Runniing getUser');
      // Access token from cookies
      const token = req.cookies.authToken;
      if (!token) {
        res.status(401).send({ error: 'Unauthorized, token missing' });
        return;
      }

      const _id = await redisClient.get(`auth_${token}`);
      const user = await findOneUser(dbClient, { _id });
      if (!user) {
        res.status(401).send({ error: 'Unauthorized, you need to login' });
        //res.redirect('/login-page.html');
        return;
      }

      const username = req.params.username;
      //console.log('Username:', username)
      const searchedUser = await findOneUser(dbClient, { username });
      //console.log('Searched:', searchedUser)
      if (searchedUser) {
        //console.log('FOund user-page')
        res.render('user-page', { user: searchedUser });
      } else {
        res.render('profile-page', { user, results: [] });
      }
    } catch (err) {
      console.log('An error occured:', err.message);
      res.status(400).send({ error: 'Error while getting user' });
    }
  }
}

export { UserController, UsersController };
