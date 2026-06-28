const express = require('express');
const fs = require('fs');
const path = require('path');

const router = express.Router();
const galleryRoot = path.join(__dirname, '..', 'public', 'images', 'gallery');
const imageExtensions = new Set(['.avif', '.gif', '.jpeg', '.jpg', '.png', '.webp']);

const album = {
  title: 'Glória e Sangue',
  year: '2025',
  type: 'Álbum',
  cover: '/images/gloria-e-sangue.jpg',
  description:
    'Um registro épico e visceral, atravessado por guerra, honra e intensidade humana.',
  tracks: [
    'Torture, Perpetual Darkness and Pain',
    'Before The Atrocious Power Of My Sword',
    'NON DVCOR DVCO',
    'Weeping and Gnashing of Teeth',
    'Glória e Sangue',
  ],
};

const discography = [
  album,
  {
    title: 'NON DVCOR DVCO',
    year: '2025',
    type: 'Single',
    cover: '/images/logo-tremendvz.png',
    description: 'Não sou conduzido, conduzo.',
    tracks: [],
  },
];

function readGalleryAlbums() {
  if (!fs.existsSync(galleryRoot)) {
    return [];
  }

  return fs
    .readdirSync(galleryRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((albumEntry) => {
      const albumPath = path.join(galleryRoot, albumEntry.name);
      const photos = fs
        .readdirSync(albumPath, { withFileTypes: true })
        .filter((entry) => entry.isFile() && imageExtensions.has(path.extname(entry.name).toLowerCase()))
        .map((photo) => `/images/gallery/${encodeURIComponent(albumEntry.name)}/${encodeURIComponent(photo.name)}`);

      return {
        name: albumEntry.name,
        photos,
      };
    })
    .filter((galleryAlbum) => galleryAlbum.photos.length > 0)
    .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
}

router.get('/', (req, res) => {
  res.render('index', {
    activePage: 'home',
    album,
    pageTitle: 'TREMENDVZ',
  });
});

router.get('/album', (req, res) => {
  res.render('album', {
    activePage: 'album',
    album,
    pageTitle: album.title,
  });
});

router.get('/banda', (req, res) => {
  res.render('band', {
    activePage: 'band',
    pageTitle: 'A Banda',
  });
});

router.get('/discografia', (req, res) => {
  res.render('discography', {
    activePage: 'discography',
    discography,
    pageTitle: 'Discografia',
  });
});

router.get('/galeria', (req, res) => {
  res.render('gallery', {
    activePage: 'gallery',
    albums: readGalleryAlbums(),
    pageTitle: 'Galeria',
  });
});

module.exports = router;
