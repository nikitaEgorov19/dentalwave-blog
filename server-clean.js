const express = require('express');
const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');

console.log('Starting server...');

try {
    const app = express();
    const PORT = 4001;
    const DATA_FILE = path.join(__dirname, 'data', 'articles.json');
    
    const ADMIN_USER = 'admin';
    const ADMIN_PASS = 'admin';

    app.use(express.urlencoded({ extended: true }));
    app.use(express.json());
    app.use(express.static('public'));

    app.get('/api/config', (req, res) => {
        res.json({ baseUrl: `${req.protocol}://${req.get('host')}` });
    });

    app.get('/api/categories', (req, res) => {
        const CAT_FILE = path.join(__dirname, 'data', 'categories.json');
        if (!fs.existsSync(CAT_FILE)) {
            const defaultCats = [{ id: 1, name: 'Разное' }];
            fs.writeFileSync(CAT_FILE, JSON.stringify(defaultCats, null, 2));
            return res.json(defaultCats);
        }
        res.json(JSON.parse(fs.readFileSync(CAT_FILE, 'utf-8')));
    });

    app.get('/api/articles', (req, res) => {
        if (!fs.existsSync(DATA_FILE)) return res.json([]);
        res.json(JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8')));
    });

    app.get('/api/articles/:id', (req, res) => {
        const articles = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
        const article = articles.find(a => a.id === parseInt(req.params.id));
        if (article) res.json(article);
        else res.status(404).json({ error: 'Article not found' });
    });

    app.post('/api/articles', (req, res) => {
        const articles = fs.existsSync(DATA_FILE) ? JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8')) : [];
        const newArticle = {
            id: Date.now(),
            title: req.body.title,
            content: req.body.content,
            annotation: req.body.annotation || '',
            author: req.body.author || 'Anonymous',
            categoryId: req.body.categoryId || 1,
            date: new Date().toLocaleDateString('ru-RU')
        };
        articles.push(newArticle);
        fs.writeFileSync(DATA_FILE, JSON.stringify(articles, null, 2));
        res.json(newArticle);
    });

    app.put('/api/articles/:id', (req, res) => {
        const articles = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
        const index = articles.findIndex(a => a.id === parseInt(req.params.id));
        if (index !== -1) {
            articles[index] = { ...articles[index], ...req.body, id: articles[index].id, date: articles[index].date };
            fs.writeFileSync(DATA_FILE, JSON.stringify(articles, null, 2));
            res.json(articles[index]);
        } else {
            res.status(404).json({ error: 'Article not found' });
        }
    });

    app.delete('/api/articles/:id', (req, res) => {
        const articles = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
        const filtered = articles.filter(a => a.id !== parseInt(req.params.id));
        if (filtered.length !== articles.length) {
            fs.writeFileSync(DATA_FILE, JSON.stringify(filtered, null, 2));
            res.json({ success: true });
        } else {
            res.status(404).json({ error: 'Article not found' });
        }
    });

    app.get('/api/articles/:id/pdf', (req, res) => {
        const articles = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
        const article = articles.find(a => a.id === parseInt(req.params.id));
        if (!article) return res.status(404).json({ error: 'Article not found' });

        const doc = new PDFDocument({ margin: 50, size: 'A4' });
        res.setHeader('Content-Type', 'application/pdf');
        const filename = encodeURIComponent(article.title) + '.pdf';
        res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${filename}`);

        const fontPaths = [
            'C:\\Windows\\Fonts\\arial.ttf',
            'C:\\Windows\\Fonts\\arialuni.ttf',
            'C:\\Windows\\Fonts\\times.ttf'
        ];

        for (const fp of fontPaths) {
            if (fs.existsSync(fp)) {
                doc.font(fp);
                break;
            }
        }

        doc.pipe(res);
        doc.fontSize(20).text(article.title, { align: 'center' });
        doc.moveDown();
        doc.fontSize(12).text(`Автор: ${article.author}`, { align: 'left' });
        doc.text(`Дата: ${article.date}`, { align: 'left' });
        doc.moveDown();
        if (article.annotation) {
            doc.fontSize(14).fillColor('blue');
            doc.text('Аннотация:', { continued: true });
            doc.fillColor('black');
            doc.moveDown();
            doc.fontSize(12).text(article.annotation, { align: 'justify', lineGap: 5 });
            doc.moveDown(2);
        }
        doc.fontSize(12);
        article.content.split('\n\n').forEach(para => {
            doc.text(para, { align: 'justify', lineGap: 3 });
            doc.moveDown();
        });
        doc.end();
    });

    app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));
    app.get('/article', (req, res) => res.sendFile(path.join(__dirname, 'public', 'article.html')));
    app.get('/admin', (req, res) => res.sendFile(path.join(__dirname, 'public', 'admin.html')));

    const server = app.listen(PORT, () => {
        console.log(`Server running at http://localhost:${PORT}`);
        console.log(`Admin panel at http://localhost:${PORT}/admin`);
    });

    server.on('error', (err) => {
        console.error('SERVER ERROR:', err);
        if (err.code === 'EADDRINUSE') {
            console.error(`Port ${PORT} is already in use. Try a different port.`);
        }
    });

    console.log('Server initialized successfully');
} catch (err) {
    console.error('FATAL ERROR:', err);
    process.exit(1);
}
