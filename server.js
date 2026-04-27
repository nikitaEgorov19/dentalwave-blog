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
const nodemailer = require('nodemailer');

console.log('All modules loaded OK');

// Email configuration (using ethereal for testing, replace with real credentials in production)
const transporter = nodemailer.createTransport({
    host: "smtp.ethereal.email",
    port: 587,
    secure: false,
    auth: {
        user: "ethereal.user@ethereal.email", // replace with real email
        pass: "ethereal.password" // replace with real password
    }
});

// Function to send email
async function sendEmail(to, subject, text) {
    try {
        await transporter.sendMail({
            from: '"DENTAL journal" <guccihighwaters@mail.ru>',
            to,
            subject,
            text
        });
        console.log(`Email sent to ${to}`);
    } catch (error) {
        console.error('Error sending email:', error);
    }
}

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'data', 'articles.json');
const CATEGORIES_FILE = path.join(__dirname, 'data', 'categories.json');

console.log('DATA_FILE:', DATA_FILE);
console.log('Exists:', fs.existsSync(DATA_FILE));

if (!fs.existsSync(path.join(__dirname, 'data'))) {
    fs.mkdirSync(path.join(__dirname, 'data'), { recursive: true });
}

if (!fs.existsSync(CATEGORIES_FILE)) {
    const defaultCategories = [
        { id: 1, name: 'Детская хирургия' },
        { id: 2, name: 'Челюстно-лицевая хирургия' },
        { id: 3, name: 'Хирургическая стоматология' },
        { id: 4, name: 'Ортопедическая стоматология' },
        { id: 5, name: 'Терапевтическая стоматология' },
        { id: 6, name: 'Ортодонтическая стоматология' }
    ];
    fs.writeFileSync(CATEGORIES_FILE, JSON.stringify(defaultCategories, null, 2));
    console.log('Created default categories');
}

if (!fs.existsSync(DATA_FILE)) {
    const defaultArticle = {
        id: Date.now(),
        title: 'ЗУБЫ Круто',
        content: 'Ставят ли коронки на молочные зубы и что это дает\nФото зубов ребенка со множественным кариесом.Источник: shutterstock.com. Автор фото: Stanislaw Mikulski\nОсновная задача коронки на молочном зубе - сохранить его до того момента, как начнет прорезываться постоянный. Ее установка может потребоваться, если целостность зуба была нарушена или есть сомнения в его прочности. При этом коронка защищает зуб от повторного развития кариеса, сколов и любого дальнейшего разрушения. Она обладает высокой прочностью и устанавливается герметично на собственные ткани зуба.\n\nТак как коронка полностью повторяет, с анатомической точки зрения, натуральный зуб, она сохраняет нормальную функцию пережевывания пищи. Не страдает дикция и формируется правильный прикус. Получается, что молочный зуб в полной безопасности, а постоянный зуб, чей зачаток находятся под молочным, получает возможность правильно развиваться.\n\nУдалять установленную коронку на молочный зуб не нужно. Она выпадет вместе с молочным зубом при прорезывании постоянного. До этого момента она будет просто поддерживать работу зубочелюстной системы без вреда для здоровья. Коронки изготавливают из безопасных для детей материалов.\n\nЧем грозит отсутствие коронки на молочном зубе\nФото ребенка с молочными зубамиИсточник: shutterstock.com. Автор фото: riggleton\nЕсли зуб был разрушен, а коронка не устанавливалась, возможно неправильное или несвоевременное прорезывание постоянного зуба. Дело в том, что нормальная смена зубов возможна только при сохранении жевательной нагрузки. Коронка выполняет эту задачу на все 100%, эффективно распределяя нагрузку и включая в процесс корни молочного зуба. Со временем они рассосутся, и прорежется постоянный зуб.\n\nНередко без протезирования разрушенных зубов во рту происходят сдвиги зубного ряда в целом и отмечается неадекватное повышение нагрузки на соседние зубы. В свою очередь, удаление разрушающегося зуба потребует использования специальной ортодонтической распорки.',
        annotation: 'Краткое описание статьи о коронках на молочных зубах',
        author: 'Админ',
        categoryId: 1,
        categories: [1],
        views: 0,
        date: new Date().toLocaleDateString('ru-RU')
    };
    fs.writeFileSync(DATA_FILE, JSON.stringify([defaultArticle], null, 2));
    console.log('Created default article');
}

app.use(express.static('public'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/api/config', (req, res) => {
    res.json({ baseUrl: `${req.protocol}://${req.get('host')}` });
});

app.get('/api/categories', (req, res) => {
    const catFile = path.join(__dirname, 'data', 'categories.json');
    if (!fs.existsSync(catFile)) return res.json([{ id: 1, name: 'Разное' }]);
    res.json(JSON.parse(fs.readFileSync(catFile, 'utf-8')));
});

app.post('/api/categories', (req, res) => {
    const catFile = path.join(__dirname, 'data', 'categories.json');
    let categories = fs.existsSync(catFile) ? JSON.parse(fs.readFileSync(catFile, 'utf-8')) : [];
    const newId = categories.length ? Math.max(...categories.map(c => c.id)) + 1 : 1;
    const newCategory = { id: newId, name: req.body.name || 'Новый раздел' };
    categories.push(newCategory);
    fs.writeFileSync(catFile, JSON.stringify(categories, null, 2));
    res.json(newCategory);
});

app.delete('/api/categories/:id', (req, res) => {
    const catFile = path.join(__dirname, 'data', 'categories.json');
    let categories = fs.existsSync(catFile) ? JSON.parse(fs.readFileSync(catFile, 'utf-8')) : [];
    categories = categories.filter(c => c.id !== parseInt(req.params.id));
    fs.writeFileSync(catFile, JSON.stringify(categories, null, 2));
    res.json({ success: true });
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

app.post('/api/articles', async (req, res) => {
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
        authorEmail: req.body.authorEmail || '',
        categoryId: categoriesArray[0] || 1,
        categories: categoriesArray,
        views: 0,
        date: new Date().toLocaleDateString('ru-RU'),
        status: 'pending' // pending, published, rejected
    };
    articles.push(newArticle);
    fs.writeFileSync(DATA_FILE, JSON.stringify(articles, null, 2));
    
    // Send email notification to author about submission
    if (newArticle.authorEmail) {
        await sendEmail(
            newArticle.authorEmail,
            'Статья отправлена на модерацию',
            `Здравствуйте, ${newArticle.author}!\n\nВаша статья "${newArticle.title}" отправлена на модерацию. Вы получите уведомление на эту почту, когда решение будет принято.\n\nС уважением,\nРедакция DENTAL journal`
        );
    }
    
    res.json(newArticle);
});

app.put('/api/articles/:id', async (req, res) => {
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
        
        // Store previous status to check if it changed
        const previousStatus = articles[index].status;
        articles[index] = {
            ...articles[index],
            ...req.body,
            categories: categoriesArray,
            categoryId: categoriesArray[0] || articles[index].categoryId || 1,
            id: articles[index].id,
            date: articles[index].date
        };
        fs.writeFileSync(DATA_FILE, JSON.stringify(articles, null, 2));
        
        // Send email notification if status changed to published or rejected
        if (req.body.status && req.body.status !== previousStatus) {
            const article = articles[index];
            if (article.authorEmail) {
                let subject, text;
                if (req.body.status === 'published') {
                    subject = 'Ваша статья опубликована';
                    text = `Здравствуйте, ${article.author}!\n\nПоздравляем! Ваша статья "${article.title}" опубликована в журнале DENTAL journal.\n\nС уважением,\nРедакция DENTAL journal`;
                } else if (req.body.status === 'rejected') {
                    const rejectionReason = req.body.rejectionReason || 'Не указано';
                    subject = 'Ваша статья отклонена';
                    text = `Здравствуйте, ${article.author}!\n\nК сожалению, ваша статья "${article.title}" не прошла модерацию.\n\nПричина отклонения: ${rejectionReason}\n\nВы можете внести правки и отправить статью повторно.\n\nС уважением,\nРедакция DENTAL journal`;
                }
                
                if (subject && text) {
                    await sendEmail(article.authorEmail, subject, text);
                }
            }
        }
        
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

app.post('/api/verify', (req, res) => {
    const auth = req.headers.authorization || '';
    const credentials = Buffer.from(auth.replace('Basic ', ''), 'base64').toString();
    const [user, pass] = credentials.split(':');
    if (user === '123' && pass === '123') {
        res.json({ success: true });
    } else {
        res.status(401).json({ success: false });
    }
});

app.get('/api/articles/:id/pdf', (req, res) => {
    try {
        const articles = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
        const article = articles.find(a => a.id === parseInt(req.params.id));
        if (!article) return res.status(404).json({ error: 'Article not found' });

        // Create PDF with A4 size and 20mm margins (0.787 inches)
        const doc = new PDFDocument({ 
            size: 'A4', 
            margins: { top: 20, bottom: 20, left: 20, right: 20 } // 20mm in points (1mm = 2.83465 points, so 20mm ≈ 56.7 points)
        });
        
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(article.title)}.pdf`);

        // Try Times New Roman ( Liberation Serif ) first, then DejaVuSans
        const fontPaths = [
            // Times New Roman / Liberation Serif (various locations)
            '/usr/share/fonts/liberation/LiberationSerif.ttf',
            '/usr/share/fonts/truetype/liberation/LiberationSerif.ttf',
            '/usr/share/fonts/truetype/msttcorefonts/Times_New_Roman.ttf',
            '/usr/share/fonts/msttcorefonts/Times_New_Roman.ttf',
            // DejaVuSans fallback
            '/usr/share/fonts/dejavu/DejaVuSans.ttf',
            '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',
        ];
        
        let fontLoaded = false;
        for (const p of fontPaths) {
            if (fs.existsSync(p)) {
                doc.font(p);
                console.log(`PDF: using font ${p.split('/').pop()} at ${p}`);
                fontLoaded = true;
                break;
            }
        }
        
        if (!fontLoaded) {
            console.log('PDF: WARNING - no suitable font found, using default (may not display Cyrillic)');
        }

        doc.pipe(res);
        
        // Заголовок статьи - заглавными буквами, выравнивание по центру
        doc.fontSize(14)
           .text(article.title.toUpperCase(), { 
               align: 'center',
               lineGap: 12, // 1.5 line spacing for 14pt font
               paragraphGap: 12 * 1.25 // 1.25 cm paragraph indent (converted to points)
           })
           .moveDown();
           
        // Аннотация (если есть)
        if (article.annotation) {
            doc.fontSize(14)
               .fillColor('blue')
               .text('Аннотация:', { continued: true })
               .fillColor('black')
               .moveDown();
               
            doc.fontSize(14)
               .text(article.annotation, { 
                   align: 'justify',
                   lineGap: 12, // 1.5 line spacing
                   paragraphGap: 12 * 1.25 // 1.25 cm paragraph indent
               })
               .moveDown(2);
        }
        
        // Основной текст
        doc.fontSize(14);
        
        // Разбиваем контент на параграфы и обрабатываем каждый
        const paragraphs = article.content.split('\n\n');
        paragraphs.forEach((para, index) => {
            // Добавляем абзацный отступ 1.25 см для каждого параграфа кроме первого
            if (index > 0) {
                doc.moveDown(1.25 * 14 / 12); // 1.25 cm в точках для 14pt шрифта
            }
            
            doc.text(para, { 
                align: 'justify',
                lineGap: 12, // 1.5 line spacing (14pt * 1.5 = 21pt, так что gap = 21-14 = 7pt)
                // Примечание: PDFKit не имеет прямого способа отключить переносы слов,
                // но мы можем попытаться контролировать это через другие параметры
            });
            
            // Добавляем пустую строку между параграфами (кроме последнего)
            if (index < paragraphs.length - 1) {
                doc.moveDown();
            }
        });
        
        doc.end();
    } catch (err) {
        console.error('PDF generation error:', err);
        res.status(500).json({ error: 'PDF generation failed' });
    }
});

app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));
app.get('/article', (req, res) => res.sendFile(path.join(__dirname, 'public', 'article.html')));
app.get('/admin', (req, res) => res.sendFile(path.join(__dirname, 'public', 'admin.html')));

try {
    const server = app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
    server.on('error', err => {
        console.error('SERVER ERROR:', err.code, err.message);
    });
} catch (err) {
    console.error('START ERROR:', err);
    process.exit(1);
}
