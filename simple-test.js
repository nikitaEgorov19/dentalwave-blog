const express = require('express');
const app = express();
const PORT = 3004;

const fs = require('fs');
fs.writeFileSync('started.txt', `Started at ${new Date().toISOString()}`);

app.use(express.static('public'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/api/test', (req, res) => res.json({ status: 'ok' }));

app.listen(PORT, () => {
    fs.writeFileSync('listening.txt', `Listening on ${PORT}`);
    console.log(`Server running on http://localhost:${PORT}`);
});

// prevent exit
setInterval(() => {}, 1000);