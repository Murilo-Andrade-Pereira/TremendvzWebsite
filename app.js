const express = require('express');
const path = require('path');
const multer = require('multer');
const fs = require('fs');

const app = express();
const PORT = 3000;

// View engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Static files
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Multer config for gallery uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const albumName = req.body.albumName || 'default';
    const albumPath = path.join(__dirname, 'public', 'images', 'gallery', albumName);
    fs.mkdirSync(albumPath, { recursive: true });
    cb(null, albumPath);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});
const upload = multer({ storage });

// Routes
const homeRouter = require('./routes/home');
const galleryRouter = require('./routes/gallery');

app.use('/', homeRouter);
app.use('/galeria', galleryRouter);

// Upload route
app.post('/galeria/upload', upload.array('fotos', 50), (req, res) => {
  res.redirect('/galeria');
});

app.listen(PORT, () => {
  console.log(`🎸 Tremendvz rodando em http://localhost:${PORT}`);
});