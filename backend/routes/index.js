import express from 'express';
import AppController from '../controllers/AppController';
import { UsersController, UserController } from '../controllers/UsersController';
import { checkAuth, AuthController } from '../controllers/AuthController';
import FilesController from '../controllers/FilesController';
import multer from 'multer';
import path from 'path';

const router = express.Router();

// Configure Multer with disk storage to retain original filename and extension
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/'); // Save to 'uploads' directory
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now();
    const extension = path.extname(file.originalname); // Get original file extension
    cb(null, file.fieldname + '-' + uniqueSuffix + extension); // Filename with original extension
  }
});

// Configure Multer to specify the upload directory and file handling
const upload = multer({ storage: storage }); // Files will be saved to 'uploads' directory

router.get('/', (req, res) => {
  res.render('index');
});

// Create an endpoint to retrieve any html file that is called from another html file
router.get('/public/:path', (req, res) => {
  const { path } = req.params;
  res.render(path);
});

// Route to test location API
router.get('/location', (req, res) => {
  res.render('location');
})

// Route to handle file uploads
//router.post('/upload', upload.single('media'), (req, res) => {
//  if (req.file) {
//    // Successfully uploaded
//    res.status(200).json({ message: 'File uploaded successfully', file: req.file });
//  } else {
//    // Error or no file uploaded
//    res.status(400).json({ message: 'File upload failed' });
//  }
//});

router.get('/check-auth', checkAuth);

router.post('/login', UsersController.login);
router.post('/create-account', UsersController.postNew);

router.get('/user/me', UserController.getMe);
router.get('/user/search', UsersController.searchUser);
router.get('/user/:username', UserController.getUser);

router.get('/chat/:user', AppController.startChat);
router.post('/chat-send/:user', upload.single('media'), AppController.sendChat)
router.get('/getChatChannelFile', FilesController.getChatFile)
router.post('/saveChatChannelFile', FilesController.saveChatFile)

router.get('/disconnect', AuthController.getDisconnect);
router.get('/status', AuthController.toggleStatus);


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
