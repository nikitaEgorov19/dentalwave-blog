const express = require('express');
const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');

console.log('Modules loaded');

const app = express();
const PORT = 3000;
const DATA_FILE = path.join(__dirname, 'data', 'articles.json');

console.log('Data file:', DATA_FILE);
console.log('Exists:', fs.existsSync(DATA_FILE));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static('public'));

console.log('Middleware set');

// Add simple test route
app.get('/api/hello', (req, res) => res.json({msg: 'ok'}));

// ... rest of routes would be here

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

console.log('listen called');

// Prevent exit
setInterval(() => {}, 1000);