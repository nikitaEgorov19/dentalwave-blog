const { spawn } = require('child_process');
const http = require('http');

// Start server
const server = spawn('node', ['server.js'], {
    env: { ...process.env, PORT: '6000' },
    stdio: 'inherit'
});

server.on('error', (err) => {
    console.error('Failed to start server:', err);
});

// Wait for server to be ready
setTimeout(() => {
    // Make request
    http.get('http://127.0.0.1:6000/api/articles', (res) => {
        console.log('\n--- CLIENT RESPONSE ---');
        console.log('Status:', res.statusCode);
        let body = '';
        res.on('data', chunk => body += chunk);
        res.on('end', () => {
            console.log('Body length:', body.length);
            console.log('Body preview:', body.substring(0,300));
            server.kill();
        });
    }).on('error', (err) => {
        console.error('Request error:', err.message);
        server.kill();
    });
}, 3000);
