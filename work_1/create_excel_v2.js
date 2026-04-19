const fs = require('fs');
const XLSX = require('xlsx');

const data = JSON.parse(fs.readFileSync(__dirname + '/results.json', 'utf8'));

const winToUtf = (str) => {
    const map = {
        'Ìàãàçèí': 'Магазин',
        'Ìîëî÷íûå ïðîäóêòû': 'Молочные продукты',
        'Ìÿñî è ìÿñîïðîäóêòû': 'Мясо и мясопродукты',
        'Îâîùè è ôðóêòû': 'Овощи и фрукты',
        'Õëåá è õëåáîáóëî÷íûå èçä': 'Хлеб и хлебобулочные изделия',
        'Ïðîèçâîäñòâî': 'Производство'
    };
    let result = str;
    Object.keys(map).forEach(key => {
        result = result.replace(new RegExp(key, 'g'), map[key]);
    });
    return result;
};

const convertProduct = (str) => {
    const map = {
        'Ìîëî÷íûå ïðîäóêòû': 'Молочные продукты',
        'Ìÿñî è ìÿñîïðîäóêòû': 'Мясо и мясопродукты',
        'Îâîùè è ôðóêòû': 'Овощи и фрукты',
        'Õëåá è õëåáîáóëî÷íûå èçä': 'Хлеб и хлебобулочные изделия',
        'Ïðîèçâîäñòâî': 'Производство'
    };
    let result = str;
    Object.keys(map).forEach(key => {
        result = result.replace(new RegExp(key, 'g'), map[key]);
    });
    return result;
};

const storeName = winToUtf(data.best_store);

const wb = XLSX.utils.book_new();

const ws1 = XLSX.utils.aoa_to_sheet([
    ['РЕЗУЛЬТАТЫ АНАЛИЗА ДЛЯ FOOD-RETAIL'],
    ['Сентябрь 2024'],
    [''],
    ['ЭТАП 1: Определение магазина с максимальными продажами в сентябре 2024'],
    ['Магазин с максимальными продажами', storeName],
    [''],
    ['ЭТАП 2: ABC-анализ по марже за сентябрь 2024'],
    ['Всего товаров (с маржой > 0)', data.total_products],
    ['Товаров категории A (80% маржи)', data.category_a_count],
    ['Товаров категории B', Math.floor(data.total_products * 0.15)],
    ['Товаров категории C', data.total_products - data.category_a_count - Math.floor(data.total_products * 0.15)],
    [''],
    ['ЭТАП 3: Товары категории A с ухудшенной оборачиваемостью (сент. vs авг.)'],
    ['Количество товаров', data.worsened_turnover_count],
    ['Оборачиваемость: больше дней = хуже'],
    [''],
    ['ЭТАП 4: TOP 5 товаров по рентабельности (3 месяца)'],
    ['Из товаров с ухудшенной оборачиваемостью'],
]);

XLSX.utils.book_append_sheet(wb, ws1, 'Результат');

const header2 = ['№', 'Наименование товара', 'Категория', 'Маржа (сент тыс.руб)', 'Оборач. авг (дни)', 'Оборач. сент (дни)', 'Рентабельность 3 мес (%)'];
const rows2 = [header2];
data.top5.forEach((p, i) => {
    rows2.push([
        i + 1,
        convertProduct(p.product),
        convertProduct(p.category),
        p.margin_sept,
        p.turnover_aug,
        p.turnover_sept,
        p.profitability_3m_pct
    ]);
});

const ws2 = XLSX.utils.aoa_to_sheet(rows2);
XLSX.utils.book_append_sheet(wb, ws2, 'TOP 5 товаров');

const header3 = ['Наименование товара', 'ABC', 'Маржа (тыс.руб)', 'Накопленный %'];
const rows3 = [header3];
data.category_a_first_20.forEach(p => {
    rows3.push([
        convertProduct(p.product),
        'A',
        p.margin,
        p.cumulative_pct
    ]);
});

const ws3 = XLSX.utils.aoa_to_sheet(rows3);
XLSX.utils.book_append_sheet(wb, ws3, 'Категория А (первые 20)');

XLSX.writeFile(wb, __dirname + '/BI_analysis_result.xlsx');
console.log('Excel file: BI_analysis_result.xlsx');