const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3080;
const MIMES = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.css': 'text/css',
  '.ico': 'image/x-icon',
  '.svg': 'image/svg+xml',
  '.png': 'image/png'
};

const server = http.createServer((req, res) => {
  const reqPath = req.url.split('?')[0];
  const file = reqPath === '/' ? 'index.html' : reqPath.replace(/^\//, '');
  const filePath = path.join(__dirname, file);
  const ext = path.extname(filePath);

  if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
    res.writeHead(404);
    res.end('Not found');
    return;
  }

  res.setHeader('Content-Type', MIMES[ext] || 'application/octet-stream');
  res.end(fs.readFileSync(filePath));
});

const LOCAL_ALIAS = 'vault.lite.app';

server.listen(PORT, () => {
  console.log('Vault Lite running at http://localhost:' + PORT);
  console.log('If you added the hosts alias: http://' + LOCAL_ALIAS + ':' + PORT);
});
