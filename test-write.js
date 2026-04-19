const fs = require('fs');
fs.writeFileSync('test-write.txt', 'Test write at ' + new Date());
console.log('Wrote to file');
