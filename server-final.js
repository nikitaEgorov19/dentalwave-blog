const express = require('express');
const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');

console.log('Starting server...');

const app = express();
const PORT = 3000;
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

app.post('/api/categories', (req, res) => {
    // Simplified - would need auth in real scenario
    const CAT_FILE = path.join(__dirname, 'data', 'categories.json');
    const categories = fs.existsSync(CAT_FILE) ? JSON.parse(fs.readFileSync(CAT_FILE, 'utf-8')) : [];
    const newCategory = { id: Date.now(), name: req.body.name };
    categories.push(newCategory);
    fs.writeFileSync(CAT_FILE, JSON.stringify(categories, null, 2));
    res.json(newCategory);
});

app.delete('/api/categories/:id', (req, res) => {
    const CAT_FILE = path.join(__dirname, 'data', 'categories.json');
    const categories = fs.existsSync(CAT_FILE) ? JSON.parse(fs.readFileSync(CAT_FILE, 'utf-8')) : [];
    const filtered = categories.filter(c => c.id !== parseInt(req.params.id));
    fs.writeFileSync(CAT_FILE, JSON.stringify(filtered, null, 2));
    res.json({ success: true });
});

app.get('/api/articles', (req, res) => {
    if (!fs.existsSync(DATA_FILE)) return res.json([]);
    let articles = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
    // Backward compatibility: add categories array if missing
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
        
        const updated = {
            ...articles[index],
            ...req.body,
            categories: categoriesArray,
            categoryId: categoriesArray[0] || articles[index].categoryId || 1,
            id: articles[index].id,
            date: articles[index].date
        };
        
        articles[index] = updated;
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
    if (!fs.existsSync(DATA_FILE)) return res.status(404).json({ error: 'Not found' });
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

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/article', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'article.html'));
});

app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
    console.log(`Admin panel at http://localhost:${PORT}/admin`);
});

console.log('Server initialized');
