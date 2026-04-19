const http = require('http');

console.log('Minimal server starting...');

const server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('OK');
});

const PORT = 3001;
server.listen(PORT, () => {
    console.log(`Test server listening on ${PORT}`);
});

server.on('error', (err) => {
    console.error('Server error:', err);
});
