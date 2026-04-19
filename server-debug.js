const fs = require('fs');
const express = require('express');
const PDFDocument = require('pdfkit');

console.log('Starting server...');

const app = express();
const PORT = 3000;
const DATA_FILE = './data/articles.json';

fs.writeFileSync('./server-start.log', `Starting at ${new Date()}\n`);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

app.get('/api/config', (req, res) => res.json({ baseUrl: 'http://localhost:3000' }));

app.get('/api/articles', (req, res) => {
    if (!require('fs').existsSync(DATA_FILE)) return res.json([]);
    const articles = require('fs').readFileSync(DATA_FILE, 'utf-8');
    let parsed = JSON.parse(articles);
    parsed = parsed.map(a => ({
        ...a,
        categories: a.categories || (a.categoryId ? [a.categoryId] : [])
    }));
    res.json(parsed);
});

app.get('/api/articles/:id', (req, res) => {
    const articles = JSON.parse(require('fs').readFileSync(DATA_FILE, 'utf-8'));
    const article = articles.find(a => a.id === parseInt(req.params.id));
    if (article) {
        article.views = (article.views || 0) + 1;
        require('fs').writeFileSync(DATA_FILE, JSON.stringify(articles, null, 2));
        res.json({
            ...article,
            categories: article.categories || (article.categoryId ? [article.categoryId] : [])
        });
    } else {
        res.status(404).json({ error: 'Not found' });
    }
});

app.get('/api/categories', (req, res) => {
    const catFile = './data/categories.json';
    if (!require('fs').existsSync(catFile)) {
        return res.json([{ id: 1, name: 'Разное' }]);
    }
    res.json(JSON.parse(require('fs').readFileSync(catFile, 'utf-8')));
});

app.post('/api/articles', (req, res) => {
    const articles = require('fs').existsSync(DATA_FILE) ? JSON.parse(require('fs').readFileSync(DATA_FILE, 'utf-8')) : [];
    let categoriesArray = req.body.categories && Array.isArray(req.body.categories) 
        ? req.body.categories.filter(id => typeof id === 'number')
        : [parseInt(req.body.categoryId) || 1];
    
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
    require('fs').writeFileSync(DATA_FILE, JSON.stringify(articles, null, 2));
    res.json(newArticle);
});

app.put('/api/articles/:id', (req, res) => {
    const articles = JSON.parse(require('fs').readFileSync(DATA_FILE, 'utf-8'));
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
        require('fs').writeFileSync(DATA_FILE, JSON.stringify(articles, null, 2));
        res.json(articles[index]);
    } else {
        res.status(404).json({ error: 'Not found' });
    }
});

app.delete('/api/articles/:id', (req, res) => {
    const articles = JSON.parse(require('fs').readFileSync(DATA_FILE, 'utf-8'));
    const filtered = articles.filter(a => a.id !== parseInt(req.params.id));
    if (filtered.length !== articles.length) {
        require('fs').writeFileSync(DATA_FILE, JSON.stringify(filtered, null, 2));
        res.json({ success: true });
    } else {
        res.status(404).json({ error: 'Not found' });
    }
});

app.get('/api/articles/:id/pdf', (req, res) => {
    const articles = JSON.parse(require('fs').readFileSync(DATA_FILE, 'utf-8'));
    const article = articles.find(a => a.id === parseInt(req.params.id));
    if (!article) return res.status(404).json({ error: 'Not found' });

    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(article.title)}.pdf`);

    const fonts = ['C:\\Windows\\Fonts\\arial.ttf', 'C:\\Windows\\Fonts\\times.ttf'];
    for (const f of fonts) if (require('fs').existsSync(f)) { doc.font(f); break; }

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
    article.content.split('\n\n').forEach(p => {
        doc.text(p, { align: 'justify', lineGap: 3 });
        doc.moveDown();
    });
    doc.end();
});

app.get('/', (req, res) => res.sendFile(__dirname + '/public/index.html'));
app.get('/article', (req, res) => res.sendFile(__dirname + '/public/article.html'));
app.get('/admin', (req, res) => res.sendFile(__dirname + '/public/admin.html'));

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
    fs.appendFileSync('./server-start.log', `Listening on port ${PORT}\n`);
});
