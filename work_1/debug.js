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

const data = readCSV(path.join(__dirname, 'data.csv'));

// Check unique stores
const stores = [...new Set(data.map(d => d.store))];
console.log('Stores:', stores);

// Find store with max sales in September (filter by "Магазин 11" in any encoding)
const septData = data.filter(d => d.month === 9);
const storeNames = [...new Set(septData.map(d => d.store))];
console.log('\nUnique stores in September:', storeNames);

// Calculate sales by store
const storeSales = {};
septData.forEach(d => {
    if (!storeSales[d.store]) storeSales[d.store] = 0;
    storeSales[d.store] += d.revenue;
});

console.log('\nStore sales:');
Object.entries(storeSales).sort((a, b) => b[1] - a[1]).slice(0, 5).forEach(([s, v]) => console.log(`${s}: ${v.toFixed(2)}`));

// Try to find store 11
const store11 = septData.filter(d => d.store.includes('11') || d.store.includes('Ìàãàçèí 11'));
console.log('\nRecords for store 11:', store11.length);

// Check actual store names - use raw bytes
const sampleRecords = septData.slice(0, 5);
console.log('\nSample September records:');
sampleRecords.forEach(r => console.log(`Store: "${r.store}", Revenue: ${r.revenue}, Cost: ${r.cost}, Margin: ${r.revenue - r.cost}`));
