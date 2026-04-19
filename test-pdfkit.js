try {
    const PDFKit = require('pdfkit');
    console.log('PDFKit loaded, version:', PDFKit.version);
} catch (e) {
    console.error('PDFKit error:', e.message);
    console.error(e.stack);
}
