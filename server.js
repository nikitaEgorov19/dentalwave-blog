process.on('uncaughtException', (err) => {
    console.error('UNCAUGHT EXCEPTION:', err.message);
    console.error(err.stack);
    process.exit(1);
});

process.on('unhandledRejection', (reason) => {
    console.error('UNHANDLED REJECTION:', reason);
});

const fs = require('fs');
const path = require('path');
const express = require('express');
const PDFDocument = require('pdfkit');

console.log('All modules loaded OK');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'data', 'articles.json');

console.log('DATA_FILE:', DATA_FILE);
console.log('Exists:', fs.existsSync(DATA_FILE));

// Middleware
app.use(express.static('public'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API routes
app.get('/api/config', (req, res) => {
    res.json({ baseUrl: `${req.protocol}://${req.get('host')}` });
});

app.get('/api/categories', (req, res) => {
    const catFile = path.join(__dirname, 'data', 'categories.json');
    if (!fs.existsSync(catFile)) {
        return res.json([{ id: 1, name: 'Разное' }]);
    }
    res.json(JSON.parse(fs.readFileSync(catFile, 'utf-8')));
});

app.get('/api/articles', (req, res) => {
    if (!fs.existsSync(DATA_FILE)) return res.json([]);
    let articles = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
    articles = articles.map(a => ({
        ...a,
        categories: a.categories || (a.categoryId ? [a.categoryId] : [])
    }));
    res.json(articles);
});

app.get('/api/articles/:id', (req, res) => {
    if (!fs.existsSync(DATA_FILE)) return res.status(404).json({ error: 'Not found' });
    const articles = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
    const article = articles.find(a => a.id === parseInt(req.params.id));
    if (article) {
        article.views = (article.views || 0) + 1;
        fs.writeFileSync(DATA_FILE, JSON.stringify(articles, null, 2));
        res.json({
            ...article,
            categories: article.categories || (article.categoryId ? [article.categoryId] : [])
        });
    } else {
        res.status(404).json({ error: 'Article not found' });
    }
});

app.post('/api/articles', (req, res) => {
    const articles = fs.existsSync(DATA_FILE) ? JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8')) : [];
    let categoriesArray = [];
    if (req.body.categories && Array.isArray(req.body.categories)) {
        categoriesArray = req.body.categories.filter(id => typeof id === 'number');
    } else if (req.body.categoryId) {
        categoriesArray = [parseInt(req.body.categoryId)];
    } else {
        categoriesArray = [1];
    }
    const newArticle = {
        id: Date.now(),
        title: req.body.title,
        content: req.body.content,
        annotation: req.body.annotation || '',
        author: req.body.author || 'Anonymous',
        categoryId: categoriesArray[0] || 1,
        categories: categoriesArray,
        views: 0,
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
        let categoriesArray = [];
        if (req.body.categories && Array.isArray(req.body.categories)) {
            categoriesArray = req.body.categories.filter(id => typeof id === 'number');
        } else if (req.body.categoryId) {
            categoriesArray = [parseInt(req.body.categoryId)];
        } else if (articles[index].categories) {
            categoriesArray = articles[index].categories;
        } else {
            categoriesArray = [articles[index].categoryId || 1];
        }
        articles[index] = {
            ...articles[index],
            ...req.body,
            categories: categoriesArray,
            categoryId: categoriesArray[0] || articles[index].categoryId || 1,
            id: articles[index].id,
            date: articles[index].date
        };
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

// Admin authentication
app.post('/api/verify', (req, res) => {
    const auth = req.headers.authorization || '';
    const credentials = Buffer.from(auth.replace('Basic ', ''), 'base64').toString();
    const [user, pass] = credentials.split(':');
    console.log('Auth attempt:', { user, pass }); // Debug log
    if (user === '123' && pass === '123') {
        res.json({ success: true });
    } else {
        res.status(401).json({ success: false });
    }
});

app.get('/api/articles/:id/pdf', (req, res) => {
    const articles = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
    const article = articles.find(a => a.id === parseInt(req.params.id));
    if (!article) return res.status(404).json({ error: 'Article not found' });

    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(article.title)}.pdf`);

    const fonts = ['C:\\Windows\\Fonts\\arial.ttf', 'C:\\Windows\\Fonts\\times.ttf'];
    for (const f of fonts) {
        if (fs.existsSync(f)) {
            doc.font(f);
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

// Pages
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));
app.get('/article', (req, res) => res.sendFile(path.join(__dirname, 'public', 'article.html')));
app.get('/admin', (req, res) => res.sendFile(path.join(__dirname, 'public', 'admin.html')));

// Start server
try {
    const server = app.listen(PORT, () => {
        console.log(`Server running at http://localhost:${PORT}`);
        console.log(`Admin: http://localhost:${PORT}/admin`);
    });
    
    server.on('listening', () => {
        console.log('Server is listening');
    });
    
    server.on('error', (err) => {
        console.error('SERVER ERROR:', err.code, err.message);
    });
    
} catch (err) {
    console.error('LISTEN FAILED:', err);
    process.exit(1);
}
