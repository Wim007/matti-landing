const http = require('http' );
const fs = require('fs');
const path = require('path');
const PORT = process.env.PORT || 3000;
const server = http.createServer((req, res ) => {
  const filePath = path.join(__dirname, req.url === '/' ? 'index.html' : req.url);
  fs.readFile(filePath, (err, data) => {
    if (err) {
      fs.readFile(path.join(__dirname, 'index.html'), (e, d) => {
        res.writeHead(200, {'Content-Type': 'text/html; charset=utf-8'});
        res.end(d);
      });
      return;
    }
    const ext = path.extname(filePath);
    const types = {'.html':'text/html','.png':'image/png','.jpg':'image/jpeg'};
    res.writeHead(200, {'Content-Type': types[ext] || 'text/html'});
    res.end(data);
  });
});
server.listen(PORT, '0.0.0.0', () => console.log('Running on ' + PORT));
