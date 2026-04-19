const http = require('http');
const fs = require('fs');
const path = require('path');

console.log('Test script starting...');

const DATA_FILE = path.join(__dirname, 'data', 'articles.json');
console.log('DATA_FILE:', DATA_FILE);
console.log('Exists:', fs.existsSync(DATA_FILE));

// Simple test: can we read articles?
try {
    const content = fs.readFileSync(DATA_FILE, 'utf-8');
    const articles = JSON.parse(content);
    console.log('Articles loaded:', articles.length);
    if (articles[0]) {
        console.log('First article title:', articles[0].title);
        console.log('Has views?', 'views' in articles[0]);
    }
} catch (e) {
    console.error('Error:', e.message);
}

console.log('Test complete');
