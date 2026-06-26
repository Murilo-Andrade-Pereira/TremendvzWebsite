const express = require('express');
const router = express.Router();

// Rota principal que vai renderizar a página inicial da banda (index.ejs)
router.get('/', (req, res) => {
  res.render('index'); 
});

module.exports = router;
