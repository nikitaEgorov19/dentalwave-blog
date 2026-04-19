const http = require('http');

const options = {
    hostname: '127.0.0.1',
    port: 5000,
    path: '/api/articles',
    method: 'GET',
    timeout: 3000
};

const req = http.request(options, (res) => {
    console.log('STATUS:', res.statusCode);
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
        console.log('Response length:', data.length);
        console.log('First 200 chars:', data.substring(0,200));
    });
});

req.on('error', (err) => {
    console.error('Request error:', err.message);
});

req.on('timeout', () => {
    console.error('Request timeout');
    req.destroy();
});

req.end();
