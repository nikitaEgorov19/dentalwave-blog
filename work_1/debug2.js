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

// Check unique values
const products = [...new Set(data.map(d => d.product))];
const categories = [...new Set(data.map(d => d.category))];
const subcategories = [...new Set(data.map(d => d.subcategory))];

console.log('Unique products:', products.length);
console.log('Products:', products.slice(0, 10));

console.log('\nUnique categories:', categories.length);
console.log('Categories:', categories.slice(0, 10));

console.log('\nUnique subcategories:', subcategories.length);
console.log('Subcategories:', subcategories.slice(0, 10));

// Check store 11 data
const store11 = data.filter(d => d.store.includes('11'));
console.log('\nStore 11 records:', store11.length);

// Unique products in store 11
const store11Products = [...new Set(store11.map(d => d.product))];
const store11Categories = [...new Set(store11.map(d => d.category))];
const store11Subcategories = [...new Set(store11.map(d => d.subcategory))];

console.log('\nStore 11 - unique products:', store11Products.length);
console.log('Store 11 - unique categories:', store11Categories.length);
console.log('Store 11 - unique subcategories:', store11Subcategories.length);

// Check if we should use category as product
console.log('\nSample store 11 data:');
store11.slice(0, 10).forEach(r => {
    console.log(`Prod: "${r.product}", Cat: "${r.category}", Subcat: "${r.subcategory}", Month: ${r.month}, Rev: ${r.revenue}`);
});
