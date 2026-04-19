try {
    const express = require('express');
    const fs = require('fs');
    const path = require('path');
    const PDFDocument = require('pdfkit');
    console.log('All modules loaded OK');
    
    const app = express();
    const PORT = 3002;
    
    app.get('/', (req, res) => res.send('OK'));
    
    app.listen(PORT, () => {
        console.log(`Server listening on ${PORT}`);
    });
} catch (err) {
    console.error('STARTUP ERROR:', err.message);
    console.error(err.stack);
    process.exit(1);
}
