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

// Prepare data by subcategory and month
const productData = {};
storeData.forEach(d => {
    if (!productData[d.subcategory]) {
        productData[d.subcategory] = {
            product: d.subcategory,
            category: d.category,
            months: {}
        };
    }
    productData[d.subcategory].months[d.month] = {
        revenue: d.revenue,
        cost: d.cost,
        turnover: d.turnover,
        profitability: d.profitability
    };
});

// Check a few products
console.log('\nSample products:');
Object.values(productData).slice(0, 5).forEach(p => {
    const m7 = p.months[7];
    const m8 = p.months[8];
    const m9 = p.months[9];
    console.log(`${p.product}: Jul: T=${m7?.turnover}, Aug: T=${m8?.turnover}, Sept: T=${m9?.turnover}`);
});

// Check products with turnover data
const productsWithData = Object.values(productData).filter(p => p.months[8] && p.months[9]);
console.log('\nProducts with Aug & Sept data:', productsWithData.length);

// Compare turnover
let augHigher = 0, septHigher = 0, same = 0;
productsWithData.forEach(p => {
    const t8 = p.months[8].turnover;
    const t9 = p.months[9].turnover;
    if (t9 > t8) septHigher++;
    else if (t8 > t9) augHigher++;
    else same++;
});

console.log(`August higher: ${augHigher}, September higher: ${septHigher}, Same: ${same}`);