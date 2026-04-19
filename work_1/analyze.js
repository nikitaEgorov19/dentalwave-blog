const fs = require('fs');
const path = require('path');

function readCSV(filename) {
    const content = fs.readFileSync(filename, 'latin1');
    const lines = content.split('\n').filter(l => l.trim());
    const data = [];
    
    for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split('\t');
        if (cols.length >= 10) {
            data.push({
                store: cols[1].trim(),
                category: cols[2].trim(),
                subcategory: cols[3].trim(),
                month: parseInt(cols[4]),
                revenue: parseFloat(cols[6].replace(',', '.')),
                cost: parseFloat(cols[7].replace(',', '.')),
                turnover: parseFloat(cols[8].replace(',', '.')),
                profitability: parseFloat(cols[9].replace(',', '.'))
            });
        }
    }
    return data;
}

const data = readCSV(path.join(__dirname, 'data.csv'));

// Find best store
const septData = data.filter(d => d.month === 9);
const storeSales = {};
septData.forEach(d => {
    if (!storeSales[d.store]) storeSales[d.store] = 0;
    storeSales[d.store] += d.revenue;
});
const bestStore = Object.entries(storeSales).sort((a, b) => b[1] - a[1])[0][0];
console.log('Best store:', bestStore);

const storeData = data.filter(d => d.store === bestStore);

// === Prepare data by subcategory ===
const productData = {};
storeData.forEach(d => {
    if (!productData[d.subcategory]) {
        productData[d.subcategory] = {
            product: d.subcategory,
            category: d.category,
            revenue: {7:0,8:0,9:0},
            cost: {7:0,8:0,9:0},
            turnover: {},
            profitability: {}
        };
    }
    productData[d.subcategory].revenue[d.month] += d.revenue;
    productData[d.subcategory].cost[d.month] += d.cost;
    if (d.month === 9) productData[d.subcategory].turnover[9] = d.turnover;
    if (d.month === 8) productData[d.subcategory].turnover[8] = d.turnover;
});

// Calculate September margin
Object.values(productData).forEach(p => {
    p.margin = p.revenue[9] - p.cost[9];
});

// Filter products with margin > 0
const products = Object.values(productData).filter(p => p.margin > 0);
console.log('Products with margin:', products.length);

// ABC Analysis
products.sort((a, b) => b.margin - a.margin);
const totalMargin = products.reduce((sum, p) => sum + p.margin, 0);
console.log('Total margin:', totalMargin.toFixed(2));

let cumulative = 0;
products.forEach(p => {
    cumulative += p.margin;
    p.cumulativePct = (cumulative / totalMargin) * 100;
    if (p.cumulativePct <= 80) p.abc = 'A';
    else if (p.cumulativePct <= 95) p.abc = 'B';
    else p.abc = 'C';
});

const categoryA = products.filter(p => p.abc === 'A');
console.log('Category A count:', categoryA.length);

// Check turnover worsening - note: higher turnover = worse (more days to sell)
const withWorsened = categoryA.filter(p => {
    const t8 = p.turnover[8];
    const t9 = p.turnover[9];
    return t9 > t8;
});

console.log('Category A with worsened turnover:', withWorsened.length);

// Calculate 3-month profitability
Object.values(productData).forEach(p => {
    const rev3m = p.revenue[7] + p.revenue[8] + p.revenue[9];
    const cost3m = p.cost[7] + p.cost[8] + p.cost[9];
    const margin3m = rev3m - cost3m;
    p.profitability_3m = rev3m > 0 ? margin3m / rev3m : 0;
});

// Add 3-month profitability to worsened products
withWorsened.forEach(p => {
    const pm = productData[p.product];
    p.profitability_3m = pm.profitability_3m;
    p.turnover_aug = p.turnover[8];
    p.turnover_sept = p.turnover[9];
});

// Sort by 3-month profitability
withWorsened.sort((a, b) => b.profitability_3m - a.profitability_3m);

const top5 = withWorsened.slice(0, 5);
console.log('\n=== TOP 5 PRODUCTS ===');
top5.forEach((p, i) => {
    console.log(`${i+1}. ${p.product}`);
    console.log(`   Category: ${p.category}`);
    console.log(`   Margin (Sept): ${p.margin.toFixed(2)}`);
    console.log(`   Turnover Aug: ${p.turnover_aug}, Sept: ${p.turnover_sept}`);
    console.log(`   Profitability (3m): ${(p.profitability_3m*100).toFixed(2)}%`);
});

// Save results
const results = {
    best_store: bestStore,
    total_products: products.length,
    category_a_count: categoryA.length,
    worsened_turnover_count: withWorsened.length,
    top5: top5.map(p => ({
        product: p.product,
        category: p.category,
        margin_sept: parseFloat(p.margin.toFixed(2)),
        turnover_aug: p.turnover_aug,
        turnover_sept: p.turnover_sept,
        profitability_3m_pct: parseFloat((p.profitability_3m * 100).toFixed(2))
    })),
    category_a_first_20: categoryA.slice(0, 20).map(p => ({
        product: p.product,
        margin: parseFloat(p.margin.toFixed(2)),
        cumulative_pct: parseFloat(p.cumulativePct.toFixed(2))
    }))
};

fs.writeFileSync(path.join(__dirname, 'results.json'), JSON.stringify(results, null, 2));
console.log('\nSaved to results.json');