import express from 'express';
import AppController from '../controllers/AppController';
import { UsersController, UserController } from '../controllers/UsersController';
import { checkAuth, AuthController } from '../controllers/AuthController';
import FilesController from '../controllers/FilesController';

const router = express.Router();

router.get('/check-auth', checkAuth);

router.post('/login', UsersController.login);
router.post('/create-account', UsersController.postNew);

router.get('/users/me', UserController.getMe);
router.get('/disconnect', AuthController.getDisconnect);


router.get('/connect', AuthController.getConnect);



router.get('/status', AppController.getStatus);
router.get('/stats', AppController.getStats);

//router.get('/connect', AuthController.getConnect);

//router.get('/users/me', UserController.getMe);

router.post('/files', FilesController.postUpload);
router.get('/files/:id', FilesController.getShow);
router.get('/files', FilesController.getIndex);
router.put('/files/:id/publish', FilesController.putPublish);
router.put('/files/:id/publish', FilesController.putUnpublish);

module.exports = router;