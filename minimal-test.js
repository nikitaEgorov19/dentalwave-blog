process.on('uncaughtException', (err) => {
    console.error('UNCAUGHT:', err);
    process.exit(1);
});
process.on('unhandledRejection', (reason) => {
    console.error('UNHANDLED REJECTION:', reason);
});

const express = require('express');
const app = express();
const PORT = 56789;

app.use(express.static('public'));

app.get('/api/test', (req, res) => {
    res.json({ ok: true, time: new Date().toISOString() });
});

try {
    app.listen(PORT, () => {
        console.log(`Test server listening on ${PORT}`);
    });
    console.log('App.listen called');
} catch (err) {
    console.error('LISTEN ERROR:', err);
}

setTimeout(() => {
    console.log('Server running test...');
}, 1000);
