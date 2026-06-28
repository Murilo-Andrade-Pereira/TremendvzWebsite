const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const APP_DIR = path.join(__dirname, 'app');

app.set('view engine', 'ejs');
app.set('views', path.join(APP_DIR, 'views', 'pages'));

app.use(express.static(path.join(APP_DIR, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

const router = require('./app/routes/router');

app.use('/', router);

app.use((req, res) => {
  res.status(404).send('Pagina nao encontrada.');
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).send('Erro interno no servidor.');
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Tremendvz rodando em http://localhost:${PORT}`);
  });
}

module.exports = app;
