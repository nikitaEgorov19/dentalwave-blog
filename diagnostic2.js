const express = require('express');
const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');

console.log('Modules loaded');
console.log('Express:', express);
console.log('PDFKit:', PDFKit ? 'OK' : 'missing');

const app = express();
const PORT = 3003;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/test', (req, res) => res.json({ ok: true }));

app.listen(PORT, () => {
    console.log(`Server STARTED on port ${PORT}`);
});

// Keep process alive indicator
setInterval(() => {}, 1000);