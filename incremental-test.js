try {
    process.on('uncaughtException', (err) => {
        console.error('UNCAUGHT:', err.message);
        console.error(err.stack);
    });
    process.on('unhandledRejection', (reason) => {
        console.error('UNHANDLED REJECTION:', reason);
    });

    const express = require('express');
    console.log('Express loaded');
    
    const app = express();
    const PORT = 3006;

    app.get('/', (req, res) => res.send('OK'));

    const server = app.listen(PORT, () => {
        console.log(`Server listening on ${PORT}`);
    });

    server.on('error', (err) => {
        console.error('SERVER ERROR:', err.message);
    });

    // Keep alive
    setInterval(() => {}, 1000);
    
} catch (err) {
    console.error('INIT ERROR:', err.message);
    console.error(err.stack);
    process.exit(1);
}