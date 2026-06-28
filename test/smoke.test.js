const assert = require('node:assert/strict');
const test = require('node:test');

const app = require('../app');

function startServer() {
  return new Promise((resolve) => {
    const server = app.listen(0, () => resolve(server));
  });
}

async function request(server, path, options) {
  const { port } = server.address();
  return fetch(`http://127.0.0.1:${port}${path}`, options);
}

test('main pages render', async (t) => {
  const server = await startServer();
  t.after(() => server.close());

  const pages = ['/', '/album', '/banda', '/discografia', '/galeria'];

  for (const page of pages) {
    const response = await request(server, page);
    const body = await response.text();

    assert.equal(response.status, 200);
    assert.match(body, /TREMENDVZ/);
  }
});

test('album and static assets are served', async (t) => {
  const server = await startServer();
  t.after(() => server.close());

  const album = await request(server, '/album');
  const body = await album.text();
  const css = await request(server, '/css/index.css');
  const js = await request(server, '/js/index.js');
  const cover = await request(server, '/images/gloria-e-sangue.jpg');

  assert.equal(album.status, 200);
  assert.match(body, /Glória e Sangue/);
  assert.equal(css.status, 200);
  assert.equal(js.status, 200);
  assert.equal(cover.status, 200);
});

test('public gallery upload route is disabled', async (t) => {
  const server = await startServer();
  t.after(() => server.close());

  const response = await request(server, '/galeria/upload', {
    method: 'POST',
  });

  assert.equal(response.status, 404);
});
