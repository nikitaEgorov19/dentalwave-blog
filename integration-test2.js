const { spawn } = require('child_process');
const http = require('http');

console.log('Starting integration test...');

// Start server
const serverProcess = spawn('node', ['server.js'], {
    cwd: __dirname,
    env: { ...process.env, PORT: '3000' },
    stdio: ['pipe', 'pipe', 'pipe']
});

let output = '';
let errOutput = '';

serverProcess.stdout.on('data', (data) => {
    const text = data.toString();
    output += text;
    process.stdout.write('[SERVER] ' + text);
});

serverProcess.stderr.on('data', (data) => {
    const text = data.toString();
    errOutput += text;
    process.stderr.write('[ERR] ' + text);
});

// Wait then request
setTimeout(() => {
    http.get('http://localhost:3000/api/articles', (res) => {
        let body = '';
        res.on('data', chunk => body += chunk);
        res.on('end', () => {
            console.log('\n=== CLIENT RESPONSE ===');
            console.log('Status:', res.statusCode);
            console.log('Body length:', body.length);
            try {
                const json = JSON.parse(body);
                console.log('Articles count:', json.length);
                if (json[0]) {
                    console.log('First article title:', json[0].title);
                    console.log('Has views?', 'views' in json[0]);
                }
            } catch (e) {
                console.log('Body preview:', body.substring(0,200));
            }
            serverProcess.kill();
        });
    }).on('error', (err) => {
        console.error('Request failed:', err.message);
        serverProcess.kill();
    });
}, 4000);

serverProcess.on('exit', (code, signal) => {
    console.log('Server exited with code', code, 'signal', signal);
});
