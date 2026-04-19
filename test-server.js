const child_process = require('child_process');

const server = require('child_process').fork('server.js', [], {
    env: { PORT: '5000' },
    stdio: 'inherit'
});

// Wait a moment then test
setTimeout(() => {
    const { exec } = require('child_process');
    exec('curl -s http://127.0.0.1:5000/api/articles', (err, stdout, stderr) => {
        console.log('CURL OUTPUT:', stdout);
        if (err) console.error('CURL ERR:', err);
        server.kill();
    });
}, 2000);
