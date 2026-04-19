const fs = require('fs');
const XLSX = require('xlsx');

// Simple converter using iconv-lite if available, or just use the raw strings
const data = JSON.parse(fs.readFileSync(__dirname + '/results.json', 'utf8'));

const wb = XLSX.utils.book_new();

const ws1 = XLSX.utils.aoa_to_sheet([
    ['РЕЗУЛЬТАТЫ АНАЛИЗА'],
    [''],
    ['ЭТАП 1: Магазин с максимальными продажами в сентябре 2024'],
    ['Магазин', data.best_store],
    [''],
    ['ЭТАП 2: ABC-анализ по марже за сентябрь 2024'],
    ['Всего товаров', data.total_products],
    ['Категория A', data.category_a_count],
    [''],
    ['ЭТАП 3: Товара категории A с ухудшенной оборачиваемостью', data.worsened_turnover_count],
    [''],
    ['ЭТАП 4: TOP 5 товаров с высокой рентабельностью (3 мес)'],
]);

XLSX.utils.book_append_sheet(wb, ws1, 'Результат');

const ws2 = XLSX.utils.aoa_to_sheet([
    ['№', 'Товар', 'Категория', 'Маржа', 'Оборач. авг', 'Оборач. сент', 'Рентабельность 3 мес (%)']
]);
data.top5.forEach((p, i) => {
    ws2['A' + (i + 2)] = { t: 'n', v: i + 1 };
    ws2['B' + (i + 2)] = { t: 's', v: p.product };
    ws2['C' + (i + 2)] = { t: 's', v: p.category };
    ws2['D' + (i + 2)] = { t: 'n', v: parseFloat(p.margin_sept) };
    ws2['E' + (i + 2)] = { t: 'n', v: p.turnover_aug };
    ws2['F' + (i + 2)] = { t: 'n', v: p.turnover_sept };
    ws2['G' + (i + 2)] = { t: 'n', v: p.profitability_3m_pct };
});
XLSX.utils.book_append_sheet(wb, ws2, 'TOP 5');

const ws3 = XLSX.utils.aoa_to_sheet([
    ['Товар', 'Категория', 'ABC', 'Маржа', 'Накопленный %']
]);
data.category_a_first_20.forEach((p, i) => {
    ws3['A' + (i + 2)] = { t: 's', v: p.product };
    ws3['B' + (i + 2)] = { t: 'n', v: p.margin };
    ws3['C' + (i + 2)] = { t: 's', v: 'A' };
    ws3['D' + (i + 2)] = { t: 'n', v: p.cumulative_pct };
});
XLSX.utils.book_append_sheet(wb, ws3, 'ABC категория A');

XLSX.writeFile(wb, __dirname + '/BI_analysis_result.xlsx');
console.log('Excel saved!');