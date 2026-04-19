const fs = require('fs');
const XLSX = require('xlsx');

function readCSV(filename) {
    const content = fs.readFileSync(filename, 'latin1');
    const lines = content.split('\n').filter(l => l.trim());
    const data = [];
    
    for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split('\t');
        if (cols.length >= 10) {
            data.push({
                product: cols[0].trim(),
                store: cols[1].trim(),
                category: cols[2].trim(),
                subcategory: cols[3].trim(),
                month: parseInt(cols[4]),
                sales_qty: parseInt(cols[5]),
                revenue: parseFloat(cols[6].replace(',', '.')),
                cost: parseFloat(cols[7].replace(',', '.')),
                turnover: parseFloat(cols[8].replace(',', '.')),
                profitability: parseFloat(cols[9].replace(',', '.'))
            });
        }
    }
    return data;
}

const data = readCSV(__dirname + '/data.csv');

// Sheet 1: Source data - filter only for best store and September/August
const bestStoreSept = data.filter(d => d.month === 9);
const storeSales = {};
bestStoreSept.forEach(d => {
    if (!storeSales[d.store]) storeSales[d.store] = 0;
    storeSales[d.store] += d.revenue;
});
const bestStore = Object.entries(storeSales).sort((a, b) => b[1] - a[1])[0][0];

const storeData = data.filter(d => d.store === bestStore);

// Prepare all data with formulas
const wb = XLSX.utils.book_new();

// Helper to get column letter
function colLetter(n) {
    let result = '';
    while (n >= 0) {
        result = String.fromCharCode(65 + (n % 26)) + result;
        n = Math.floor(n / 26) - 1;
    }
    return result;
}

// ===== SHEET 1: ИСХОДНЫЕ ДАННЫЕ =====
const ws1Data = [
    ['МАГАЗИН', 'КАТЕГОРИЯ', 'ПОДКАТЕГОРИЯ', 'МЕСЯЦ', 'ПРОДАЖИ (шт)', 'ВЫРУЧКА', 'СЕБЕСТОИМОСТЬ', 'ОБОРАЧИВАЕМОСТЬ', 'РЕНТАБЕЛЬНОСТЬ']
];

// Sample: only first 1000 rows to keep file manageable
const sampleData = storeData.slice(0, 1000);
sampleData.forEach(d => {
    ws1Data.push([
        d.store,
        d.category,
        d.subcategory,
        d.month,
        d.sales_qty,
        d.revenue,
        d.cost,
        d.turnover,
        d.profitability
    ]);
});

const ws1 = XLSX.utils.aoa_to_sheet(ws1Data);
XLSX.utils.book_append_sheet(wb, ws1, '1_Исходные данные');

// ===== SHEET 2: ОПРЕДЕЛЕНИЕ МАГАЗИНА =====
const ws2Data = [
    ['ЭТАП 1: Определение магазина с максимальными продажами в сентябре 2024'],
    [''],
    ['Формула: =СУММЕСЛИ(данные!C:C;9;данные!G:G) - сумма выручки по магазинам за сентябрь'],
    [''],
    ['Метод решения:'],
    ['1. Фильтруем данные за месяц = 9 (сентябрь)'],
    ['2. Группируем по магазину (столбец Магазин)'],
    ['3. Суммируем выручку по каждому магазину'],
    ['4. Находим максимальное значение'],
    [''],
    ['Результат:'],
    ['МАГАЗИН С МАКС ПРОДАЖАМИ', bestStore[0]],
    ['ВЫРУЧКА (тыс.руб)', parseFloat(bestStore[1]).toFixed(2)],
];

const ws2 = XLSX.utils.aoa_to_sheet(ws2Data);
XLSX.utils.book_append_sheet(wb, ws2, '2_Магазин');

// ===== SHEET 3: ABC АНАЛИЗ =====
const septStore = storeData.filter(d => d.month === 9);

// Aggregate by subcategory for September
const prodSept = {};
septStore.forEach(d => {
    if (!prodSept[d.subcategory]) {
        prodSept[d.subcategory] = { category: d.category, revenue: 0, cost: 0 };
    }
    prodSept[d.subcategory].revenue += d.revenue;
    prodSept[d.subcategory].cost += d.cost;
});

Object.values(prodSept).forEach(p => {
    p.margin = p.revenue - p.cost;
});

const products = Object.values(prodSept).filter(p => p.margin > 0);
products.sort((a, b) => b.margin - a.margin);
const totalMargin = products.reduce((sum, p) => sum + p.margin, 0);

let cumulative = 0;
products.forEach((p, i) => {
    cumulative += p.margin;
    p.cumPct = (cumulative / totalMargin) * 100;
    p.abc = p.cumPct <= 80 ? 'A' : (p.cumPct <= 95 ? 'B' : 'C');
});

const categoryA = products.filter(p => p.abc === 'A');

// Build ABC sheet with formulas
const ws3Header = ['ПОДКАТЕГОРИЯ', 'КАТЕГОРИЯ', 'ВЫРУЧКА', 'СЕБЕСТОИМ', 'МАРЖА', 'МАРЖА %', 'НАКОПЛ %', 'ABC'];
const ws3Data = [ws3Header];

products.slice(0, 500).forEach((p, i) => {
    ws3Data.push([
        p.subcategory,
        p.category,
        p.revenue,
        p.cost,
        { f: `=D${i+2}-C${i+2}` },  // MARGIA = revenue - cost
        { f: `=E${i+2}/C${i+2}` },  // MARGIN %
        { f: `=F$sum/E$total` },      // CUMULATIVE % - formula reference
        p.abc
    ]);
});

const ws3 = XLSX.utils.aoa_to_sheet(ws3Data);

// Add SUM formulas at bottom
ws3['!ref'] = 'A1:H' + (ws3Data.length + 2);
ws3['A' + (ws3Data.length + 1)] = { t: 's', v: 'ИТОГО' };
ws3['E' + (ws3Data.length + 1)] = { t: 'n', v: totalMargin, f: `=SUM(E2:E${ws3Data.length})` };
ws3['!merges'] = [];

XLSX.utils.book_append_sheet(wb, ws3, '3_ABC анализ');

// ===== SHEET 4: ОБОРАЧИВАЕМОСТЬ =====
const productData = {};
storeData.forEach(d => {
    if (!productData[d.subcategory]) {
        productData[d.subcategory] = { category: d.category, months: {} };
    }
    productData[d.subcategory].months[d.month] = {
        revenue: d.revenue,
        cost: d.cost,
        turnover: d.turnover
    };
});

// Get August turnover for each product
const augTurnover = {};
storeData.filter(d => d.month === 8).forEach(d => {
    augTurnover[d.subcategory] = d.turnover;
});

// Filter A products with worsened turnover
const aw = categoryA.filter(p => {
    const t9 = productData[p.subcategory]?.months[9]?.turnover || 0;
    const t8 = augTurnover[p.subcategory] || 0;
    return t9 > t8;
});

// Build turnover sheet
const ws4Header = ['ПОДКАТЕГОРИЯ', 'КАТЕГОРИЯ', 'ОБОРАЧ АВГ', 'ОБОРАЧ СЕНТ', 'ИЗМЕНЕНИЕ', 'УХУДШЕНИЕ?'];
const ws4Data = [ws4Header];

aw.forEach((p, i) => {
    const t8 = augTurnover[p.subcategory] || 0;
    const t9 = productData[p.subcategory]?.months[9]?.turnover || 0;
    ws4Data.push([
        p.subcategory,
        p.category,
        t8,
        t9,
        { f: `=D${i+2}-C${i+2}` },
        { f: `=IF(E${i+2}>0;"Да";"Нет")` }
    ]);
});

const ws4 = XLSX.utils.aoa_to_sheet(ws4Data);
XLSX.utils.book_append_sheet(wb, ws4, '4_Оборачиваемость');

// ===== SHEET 5: TOP 5 =====
const allData3m = {};
storeData.forEach(d => {
    if (!allData3m[d.subcategory]) {
        allData3m[d.subcategory] = { revenue: 0, cost: 0 };
    }
    allData3m[d.subcategory].revenue += d.revenue;
    allData3m[d.subcategory].cost += d.cost;
});

Object.values(allData3m).forEach(p => {
    p.margin = p.revenue - p.cost;
    p.profitability = p.revenue > 0 ? p.margin / p.revenue : 0;
});

// Get 3-month profitability for aw products
aw.forEach(p => {
    const pm = allData3m[p.subcategory];
    if (pm) {
        p.profitability_3m = pm.profitability;
    }
});

aw.sort((a, b) => b.profitability_3m - a.profitability_3m);
const top5 = aw.slice(0, 5);

// Build TOP 5 sheet with formulas
const ws5Header = ['№', 'ПОДКАТЕГОРИЯ', 'КАТЕГОРИЯ', 'МАРЖА СЕНТ', 'ОБОРАЧ АВГ', 'ОБОРАЧ СЕНТ', 'РЕНТАБ 3 МЕС %'];
const ws5Data = [ws5Header];

top5.forEach((p, i) => {
    const t8 = augTurnover[p.subcategory] || 0;
    const t9 = productData[p.subcategory]?.months[9]?.turnover || 0;
    ws5Data.push([
        i + 1,
        p.subcategory,
        p.category,
        p.margin,
        t8,
        t9,
        { f: `=${(p.profitability_3m * 100).toFixed(4)}/100` }
    ]);
});

const ws5 = XLSX.utils.aoa_to_sheet(ws5Data);
XLSX.utils.book_append_sheet(wb, ws5, '5_TOP5');

// Save
XLSX.writeFile(wb, __dirname + '/BI_analysis_with_formulas.xlsx');
console.log('Excel with formulas saved!');